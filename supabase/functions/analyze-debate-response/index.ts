// Supabase Edge Function: analyze-debate-response
// Analyzes one written reason, reusing existing reason tags where possible.

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
  if (!value) throw new Error(`${name} is not set`);
  return value;
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

  throw new Error("OpenAI response did not include analysis JSON.");
}

function normalizeAnalysis(responseJson: any) {
  const raw = extractOpenAiJson(responseJson);
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const axisScores = parsed.axisScores ?? {};

  return {
    anonymizedReason: String(parsed.anonymizedReason ?? "").trim(),
    summary: String(parsed.summary ?? ""),
    reasonTags: Array.isArray(parsed.reasonTags)
      ? parsed.reasonTags.map(String).slice(0, 6)
      : [],
    axisScores: {
      painDignity: Math.max(-1, Math.min(1, Number(axisScores.painDignity ?? 0))),
      lifeTechnologyExpectation: Math.max(
        -1,
        Math.min(1, Number(axisScores.lifeTechnologyExpectation ?? 0)),
      ),
    },
    textMiningWords: Array.isArray(parsed.textMiningWords)
      ? parsed.textMiningWords.map(String).slice(0, 6)
      : [],
    standoutScore: Math.max(0, Math.min(10, Math.round(Number(parsed.standoutScore ?? 0)))),
    rawAnalysis: parsed,
  };
}

function uniqueTags(rows: Array<{ reason_tags: unknown }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const tags = Array.isArray(row.reason_tags) ? row.reason_tags : [];
    for (const tag of tags) {
      const label = String(tag || "").trim();
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, 40)
    .map(([tag]) => tag);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { responseId } = await req.json();
    if (!responseId) {
      return jsonResponse({ error: "responseId is required" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: response, error: responseError } = await supabase
      .from("debate_responses")
      .select(`
        id,
        question_id,
        choice_side,
        reason,
        attributes,
        debate_questions(title, description, axis_x_label, axis_y_label),
        debate_choices(label, description)
      `)
      .eq("id", responseId)
      .single();

    if (responseError || !response) {
      return jsonResponse(
        { error: "Failed to read response", details: responseError?.message },
        500,
      );
    }

    if (!String(response.reason || "").trim()) {
      return jsonResponse({ error: "Reason is empty" }, 400);
    }

    const { data: tagRows, error: tagError } = await supabase
      .from("debate_response_analysis")
      .select("reason_tags")
      .eq("question_id", response.question_id)
      .limit(500);

    const { data: seedTagRows, error: seedTagError } = await supabase
      .from("debate_question_reason_tag_seeds")
      .select("tag")
      .eq("question_id", response.question_id)
      .order("sort_order", { ascending: true });

    if (tagError) {
      return jsonResponse(
        { error: "Failed to read existing tags", details: tagError.message },
        500,
      );
    }

    if (seedTagError) {
      return jsonResponse(
        { error: "Failed to read seed tags", details: seedTagError.message },
        500,
      );
    }

    const seedTags = (seedTagRows ?? []).map((row) => String(row.tag || "").trim()).filter(Boolean);
    const existingTags = [...new Set([...seedTags, ...uniqueTags(tagRows ?? [])])].slice(0, 24);
    const question = Array.isArray(response.debate_questions)
      ? response.debate_questions[0]
      : response.debate_questions;
    const choice = Array.isArray(response.debate_choices)
      ? response.debate_choices[0]
      : response.debate_choices;

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
              "日本語の意見を匿名化してから中立に分類する。人名、病院・診療所・介護施設・学校・勤務先などの固有名、住所、電話番号、メールアドレス、SNS ID、患者番号など個人を特定または推測できる情報は、意味を補完・推測せず全て『●●●』に置換する。匿名化対象がなければ原文をそのままanonymizedReasonへ入れる。summary、タグ、特徴語にも固有名や個人識別情報を絶対に含めない。既存タグを優先し、JSONのみ返す。",
          },
          {
            role: "user",
            content: [
              `質問: ${question?.title ?? ""}`,
              `選択: ${choice?.label ?? response.choice_side}`,
              `属性: ${JSON.stringify(response.attributes ?? {})}`,
              `既存タグ候補: ${JSON.stringify(existingTags)}`,
              `軸: x=${question?.axis_x_label ?? "苦痛と尊厳"}, y=${question?.axis_y_label ?? "生命・技術への期待"}（各-1〜1）`,
              `理由: ${response.reason}`,
              "anonymizedReasonは意見の意味を変えず個人識別情報だけを●●●に置換する。summaryは40字以内、reasonTagsは1〜4個、textMiningWordsは特徴語3〜6個、standoutScoreは0〜10。",
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "debate_response_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                anonymizedReason: { type: "string" },
                summary: { type: "string" },
                reasonTags: {
                  type: "array",
                  items: { type: "string" },
                },
                axisScores: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    painDignity: { type: "number", minimum: -1, maximum: 1 },
                    lifeTechnologyExpectation: {
                      type: "number",
                      minimum: -1,
                      maximum: 1,
                    },
                  },
                  required: ["painDignity", "lifeTechnologyExpectation"],
                },
                textMiningWords: {
                  type: "array",
                  items: { type: "string" },
                },
                standoutScore: { type: "integer", minimum: 0, maximum: 10 },
              },
              required: [
                "anonymizedReason",
                "summary",
                "reasonTags",
                "axisScores",
                "textMiningWords",
                "standoutScore",
              ],
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
    const analysis = normalizeAnalysis(openaiJson);
    const anonymizedReason = analysis.anonymizedReason || "●●●";

    const { error: anonymizeSaveError } = await supabase
      .from("debate_responses")
      .update({
        reason: anonymizedReason,
        attributes: {
          ...(response.attributes ?? {}),
          reasonAnonymized: anonymizedReason !== String(response.reason ?? ""),
          reasonAnonymizedAt: new Date().toISOString(),
        },
      })
      .eq("id", response.id);

    if (anonymizeSaveError) {
      return jsonResponse(
        { error: "Failed to save anonymized reason", details: anonymizeSaveError.message },
        500,
      );
    }

    const payload = {
      response_id: response.id,
      question_id: response.question_id,
      summary: analysis.summary,
      reason_tags: analysis.reasonTags,
      axis_scores: analysis.axisScores,
      value_axes: [],
      sentiment: "neutral",
      standout_score: analysis.standoutScore,
      is_interesting: analysis.standoutScore >= 7,
      raw_analysis: analysis.rawAnalysis,
      updated_at: new Date().toISOString(),
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("debate_response_analysis")
      .upsert(payload, { onConflict: "response_id" })
      .select("*")
      .single();

    if (saveError) {
      return jsonResponse(
        { error: "Failed to save analysis", details: saveError.message },
        500,
      );
    }

    return jsonResponse({ analysis: savedAnalysis });
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
