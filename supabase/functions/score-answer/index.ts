// Supabase Edge Function: score-answer
//
// 目的:
// - 回答が投稿された直後に、その1件だけをOpenAI APIで採点する
// - 採点結果を answers.score に保存する
// - 全体解析 analyze-overall を毎回スコアリング用途に使わない
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function getChoiceLabel(choice: string) {
  const labels: Record<string, string> = {
    poopCurry: "うんこ味のカレー",
    curryPoop: "カレー味のうんこ",
  };
  return labels[choice] ?? choice;
}

function extractOpenAiJson(responseJson: any) {
  if (responseJson.output_text) return responseJson.output_text;

  for (const outputItem of responseJson.output ?? []) {
    for (const content of outputItem.content ?? []) {
      if (content.parsed) return content.parsed;
      if (content.text) return content.text;
    }
  }

  const chatContent = responseJson.choices?.[0]?.message?.content;
  if (chatContent) return chatContent;

  throw new Error("OpenAI response did not include score JSON.");
}

function parseScore(responseJson: any) {
  const raw = extractOpenAiJson(responseJson);
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Math.max(0, Math.min(10, Math.round(Number(parsed.score ?? 0))));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { answerId } = await req.json();
    if (!answerId) {
      return jsonResponse({ error: "answerId is required" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: answer, error: readError } = await supabase
      .from("answers")
      .select("id, choice, reason")
      .eq("id", answerId)
      .single();

    if (readError || !answer) {
      return jsonResponse(
        { error: "Failed to read answer", details: readError?.message },
        500,
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
              "あなたはアンケート回答を0〜10点で採点する評価者です。意味不明、短すぎる、test、テスト、aaa、asdf、空欄、質問に答えていない投稿は必ず0点。具体的な理由、視点の面白さ、展示で目立つ価値があるほど高得点にしてください。返答はJSONのみです。",
          },
          {
            role: "user",
            content: [
              `選択肢: ${getChoiceLabel(answer.choice)}`,
              `理由: ${answer.reason}`,
              "0〜10の整数scoreだけを返してください。",
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "answer_score",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                score: {
                  type: "integer",
                  minimum: 0,
                  maximum: 10,
                },
              },
              required: ["score"],
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
    const score = parseScore(openaiJson);

    const { data: updatedAnswer, error: updateError } = await supabase
      .from("answers")
      .update({ score })
      .eq("id", answer.id)
      .select("id, choice, reason, score, created_at")
      .single();

    if (updateError) {
      return jsonResponse(
        { error: "Failed to save score", details: updateError.message },
        500,
      );
    }

    return jsonResponse({ answer: updatedAnswer });
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
