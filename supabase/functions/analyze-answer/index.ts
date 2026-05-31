// Supabase Edge Function: analyze-answer
//
// 役割:
// 1. フロントエンドから answerId を受け取る
// 2. answers テーブルから回答本文を読む
// 3. OpenAI APIで回答理由を summary / sentiment / tags / keywords に解析する
// 4. answer_analysis テーブルへ保存する
//
// 重要:
// - OpenAI APIキーはフロントエンドに置きません。
// - Supabase Edge Functionの環境変数 OPENAI_API_KEY から読みます。
// - DB保存には SUPABASE_SERVICE_ROLE_KEY を使います。

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnalysisResult = {
  summary: string;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  tags: string[];
  keywords: string[];
};

type AnalyzeRequestBody = {
  answerId?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function parseOpenAiJson(responseJson: any): AnalysisResult {
  /*
    OpenAI Responses APIの返答は、環境やSDKでは output_text が見えることがあります。
    REST APIでは output 配列の content[].text に入ることもあります。

    ここで1か所に取り出し処理をまとめておくと、
    フロントエンドやDB保存処理がOpenAIの細かい返答形式に振り回されません。
  */
  const rawAnalysis = extractOpenAiAnalysis(responseJson);
  const parsed =
    typeof rawAnalysis === "string" ? JSON.parse(rawAnalysis) : rawAnalysis;

  return {
    summary: String(parsed.summary ?? ""),
    sentiment: parsed.sentiment ?? "neutral",
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.map(String)
      : [],
  };
}

function extractOpenAiAnalysis(responseJson: any) {
  if (responseJson.output_text) {
    return responseJson.output_text;
  }

  for (const outputItem of responseJson.output ?? []) {
    for (const content of outputItem.content ?? []) {
      if (content.parsed) {
        return content.parsed;
      }

      if (content.text) {
        return content.text;
      }
    }
  }

  /*
    もし将来 Chat Completions 形式に切り替えた場合の保険です。
    今回は Responses API を使っていますが、初心者が後で試行錯誤しても
    ここで拾える可能性を少し増やしておきます。
  */
  const chatContent = responseJson.choices?.[0]?.message?.content;
  if (chatContent) {
    return chatContent;
  }

  throw new Error(
    `OpenAI response did not include analysis JSON. Response keys: ${
      Object.keys(responseJson).join(", ")
    }`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { answerId } = (await req.json()) as AnalyzeRequestBody;
    if (!answerId) {
      return jsonResponse({ error: "answerId is required" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .select("id, choice, reason, created_at")
      .eq("id", answerId)
      .single();

    if (answerError || !answer) {
      return jsonResponse(
        { error: "Answer not found", details: answerError?.message },
        404,
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openaiModel,
        input: [
          {
            role: "system",
            content:
              "You analyze short Japanese survey answers. Return concise JSON only.",
          },
          {
            role: "user",
            content: [
              `choice: ${answer.choice}`,
              `reason: ${answer.reason}`,
              "",
              "Analyze the reason for visualization.",
              "summary: one short Japanese sentence.",
              "sentiment: one of positive, neutral, negative, mixed.",
              "tags: 1 to 5 short Japanese category labels.",
              "keywords: 1 to 8 important Japanese keywords.",
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "answer_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: {
                  type: "string",
                },
                sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative", "mixed"],
                },
                tags: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                keywords: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["summary", "sentiment", "tags", "keywords"],
            },
          },
        },
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return jsonResponse(
        { error: "OpenAI request failed", details: errorText },
        502,
      );
    }

    const openaiJson = await openaiResponse.json();
    const analysis = parseOpenAiJson(openaiJson);

    /*
      解析結果をDBへ保存します。

      raw_analysis はデバッグや再解析に便利な列ですが、
      既に古いSQLでテーブルを作っている場合は列が無いことがあります。
      その場合でも最低限の解析結果を保存できるように、まず raw_analysis ありで試し、
      schema cache / column missing 系のエラーなら raw_analysis なしで再試行します。
    */
    const analysisPayload = {
      answer_id: answer.id,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      tags: analysis.tags,
      keywords: analysis.keywords,
      raw_analysis: analysis,
      updated_at: new Date().toISOString(),
    };

    let { data: savedAnalysis, error: analysisError } =
      await saveAnswerAnalysis(supabase, analysisPayload);

    if (analysisError && isMissingOptionalAnalysisColumn(analysisError)) {
      const { raw_analysis: _rawAnalysis, updated_at: _updatedAt, ...fallbackPayload } =
        analysisPayload;

      const retryResult = await saveAnswerAnalysis(supabase, fallbackPayload);

      savedAnalysis = retryResult.data;
      analysisError = retryResult.error;
    }

    if (analysisError) {
      return jsonResponse(
        { error: "Failed to save analysis", details: analysisError.message },
        500,
      );
    }

    return jsonResponse({
      analysis: savedAnalysis,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

function isMissingOptionalAnalysisColumn(error: any) {
  const message = String(error?.message ?? "");
  return (
    message.includes("raw_analysis") ||
    message.includes("updated_at") ||
    message.includes("schema cache")
  );
}

async function saveAnswerAnalysis(supabase: any, payload: any) {
  /*
    本来は answer_id に unique 制約を付けて upsert するのが素直です。
    ただ、学習中のプロトタイプではテーブル定義が途中で変わりやすいので、
    unique 制約が無くても動く「既存確認 → update / insert」にしています。
  */
  const { data: existingRows, error: selectError } = await supabase
    .from("answer_analysis")
    .select("id")
    .eq("answer_id", payload.answer_id)
    .limit(1);

  if (selectError) {
    return { data: null, error: selectError };
  }

  if (existingRows && existingRows.length > 0) {
    return await supabase
      .from("answer_analysis")
      .update(payload)
      .eq("id", existingRows[0].id)
      .select("id, answer_id, summary, sentiment, tags, keywords, created_at")
      .single();
  }

  return await supabase
    .from("answer_analysis")
    .insert(payload)
    .select("id, answer_id, summary, sentiment, tags, keywords, created_at")
    .single();
}
