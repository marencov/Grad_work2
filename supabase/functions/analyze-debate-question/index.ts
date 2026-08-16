// Supabase Edge Function: analyze-debate-question
// Builds a neutral snapshot for one debate question from responses and tags.

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

function parseOpenAiAnalysis(responseJson: any) {
  const raw = extractOpenAiJson(responseJson);
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  const standoutBySide = parsed.standoutBySide ?? {};
  const standoutResponses = (["pro", "con"] as const)
    .map((side) => {
      const item = standoutBySide[side];
      if (!item || !String(item.summary ?? "").trim()) return null;
      return {
        responseId: String(item.responseId ?? ""),
        side,
        reason: String(item.representativeReason ?? ""),
        why: String(item.summary ?? ""),
      };
    })
    .filter(Boolean);
  return {
    analysisTitle: String(parsed.analysisTitle ?? ""),
    stanceTone: ["pro", "con", "neutral"].includes(parsed.stanceTone)
      ? parsed.stanceTone
      : "neutral",
    neutralAnalysisText: String(parsed.neutralAnalysisText ?? ""),
    standoutResponses,
    observations: Array.isArray(parsed.observations)
      ? parsed.observations.map(String)
      : [],
    rawAnalysis: parsed,
  };
}

function emptySideCounts() {
  return { pro: 0, con: 0 };
}

const DEFAULT_IMMEDIATE_ANALYSIS_LIMIT = 50;
const DEFAULT_ANALYSIS_INTERVAL = 50;

function positiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number(Deno.env.get(name));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function shouldRunOverallAnalysis(
  totalCount: number,
  previousTotalCount: number | null,
  immediateLimit: number,
  interval: number,
) {
  // While the dataset is small, keep the current immediate feedback behavior.
  if (totalCount < immediateLimit) return true;

  // Once it is large, only analyze when a new interval boundary has been crossed.
  // With the defaults this runs at 50, 100, 150... responses.
  const currentMilestone = Math.floor(totalCount / interval);
  const previousMilestone = Math.floor((previousTotalCount ?? 0) / interval);
  return currentMilestone > previousMilestone;
}

function aggregate(responses: any[]) {
  const choiceCounts = emptySideCounts();
  const tagCounts = new Map<string, { pro: number; con: number; total: number }>();
  const scatter = [];

  for (const response of responses) {
    const side = response.choice_side === "con" ? "con" : "pro";
    choiceCounts[side] += 1;

    const analysis = Array.isArray(response.debate_response_analysis)
      ? response.debate_response_analysis[0]
      : response.debate_response_analysis;
    const tags = Array.isArray(analysis?.reason_tags) ? analysis.reason_tags : [];

    for (const rawTag of tags) {
      const tag = String(rawTag || "").trim();
      if (!tag) continue;
      const entry = tagCounts.get(tag) ?? { pro: 0, con: 0, total: 0 };
      entry[side] += 1;
      entry.total += 1;
      tagCounts.set(tag, entry);
    }

    const axis = analysis?.axis_scores ?? {};
    scatter.push({
      responseId: response.id,
      side,
      likes: Number(response.likes ?? 0),
      x: Number(axis.painDignity ?? 0),
      y: Number(axis.lifeTechnologyExpectation ?? 0),
      tags,
      summary: analysis?.summary ?? "",
      reason: response.reason,
    });
  }

  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0], "ja"))
    .slice(0, 6)
    .map(([tag, counts]) => ({ tag, ...counts }));

  const tagDistributionBySide = Object.fromEntries(
    topTags.map((entry) => [
      entry.tag,
      {
        pro: entry.pro,
        con: entry.con,
        total: entry.total,
      },
    ]),
  );

  return {
    choiceCounts,
    topTags,
    tagDistributionBySide,
    scatterSummary: {
      points: scatter,
      axes: {
        xLabel: "侵襲的↔緩和的",
        x: "苦痛と尊厳",
        y: "生命・技術への期待",
      },
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { questionId, slug } = await req.json();
    if (!questionId && !slug) {
      return jsonResponse({ error: "questionId or slug is required" }, 400);
    }

    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let questionQuery = supabase
      .from("debate_questions")
      .select("*")
      .limit(1)
      .single();

    questionQuery = questionId
      ? questionQuery.eq("id", questionId)
      : questionQuery.eq("slug", slug);

    const { data: question, error: questionError } = await questionQuery;

    if (questionError || !question) {
      return jsonResponse(
        { error: "Failed to read question", details: questionError?.message },
        500,
      );
    }

    const { data: responses, error: responsesError } = await supabase
      .from("debate_responses")
      .select(`
        id,
        choice_side,
        reason,
        likes,
        attributes,
        created_at,
        debate_response_analysis(
          summary,
          reason_tags,
          axis_scores,
          standout_score,
          is_interesting
        )
      `)
      .eq("question_id", question.id)
      .neq("reason", "")
      .order("created_at", { ascending: false })
      .limit(300);

    if (responsesError) {
      return jsonResponse(
        { error: "Failed to read responses", details: responsesError.message },
        500,
      );
    }

    const typedResponses = responses ?? [];
    const { count: responseCount, error: responseCountError } = await supabase
      .from("debate_responses")
      .select("id", { count: "exact", head: true })
      .eq("question_id", question.id)
      .neq("reason", "");

    if (responseCountError) {
      return jsonResponse(
        { error: "Failed to count responses", details: responseCountError.message },
        500,
      );
    }

    const totalResponseCount = responseCount ?? typedResponses.length;
    const aggregates = aggregate(typedResponses);

    if (totalResponseCount === 0) {
      const payload = {
        question_id: question.id,
        total_count: 0,
        choice_counts: aggregates.choiceCounts,
        top_tags: [],
        tag_distribution_by_side: {},
        scatter_summary: aggregates.scatterSummary,
        neutral_analysis_text: "まだ理由文つきの回答がありません。回答が集まると、ここに中立的な分析が表示されます。",
        standout_responses: [],
        raw_analysis: {},
      };

      const { data: savedEmpty } = await supabase
        .from("debate_question_analysis_snapshots")
        .insert(payload)
        .select("*")
        .single();

      return jsonResponse({ analysis: savedEmpty });
    }

    const immediateLimit = positiveIntegerEnv(
      "DEBATE_IMMEDIATE_ANALYSIS_LIMIT",
      DEFAULT_IMMEDIATE_ANALYSIS_LIMIT,
    );
    const analysisInterval = positiveIntegerEnv(
      "DEBATE_ANALYSIS_INTERVAL",
      DEFAULT_ANALYSIS_INTERVAL,
    );
    const { data: previousSnapshot, error: previousSnapshotError } = await supabase
      .from("debate_question_analysis_snapshots")
      .select("*")
      .eq("question_id", question.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousSnapshotError) {
      return jsonResponse(
        { error: "Failed to read previous analysis", details: previousSnapshotError.message },
        500,
      );
    }

    if (
      !shouldRunOverallAnalysis(
        totalResponseCount,
        previousSnapshot?.total_count ?? null,
        immediateLimit,
        analysisInterval,
      )
    ) {
      return jsonResponse({
        analysis: previousSnapshot,
        skipped: true,
        reason: "analysis_interval_not_reached",
        currentTotalCount: totalResponseCount,
        nextAnalysisAt:
          (Math.floor(totalResponseCount / analysisInterval) + 1) * analysisInterval,
      });
    }

    const compactResponses = typedResponses.slice(0, 120).map((response) => {
      const analysis = Array.isArray(response.debate_response_analysis)
        ? response.debate_response_analysis[0]
        : response.debate_response_analysis;
      return {
        id: response.id,
        side: response.choice_side,
        reason: response.reason,
        likes: response.likes,
        tags: analysis?.reason_tags ?? [],
        axisScores: analysis?.axis_scores ?? {},
        summary: analysis?.summary ?? "",
        standoutScore: analysis?.standout_score ?? 0,
      };
    });

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
              "あなたは医療・倫理テーマのアンケートを中立的に分析する編集者です。どちらの立場も善悪で裁かず、意見の背景にある価値観、迷い、論点のズレをわかりやすく整理します。煽らず、断定しすぎず、展示で読める自然な日本語にしてください。返答はJSONのみです。",
          },
          {
            role: "user",
            content: [
              "analysisTitle は分析結果を端的に表す20字以内の日本語タイトルにしてください。stanceTone は全体の傾向として pro / con / neutral のいずれかを返してください。",
              `質問: ${question.title}`,
              `説明: ${question.description}`,
              `回答数: ${totalResponseCount}`,
              `選択数: ${JSON.stringify(aggregates.choiceCounts)}`,
              `上位タグ: ${JSON.stringify(aggregates.topTags)}`,
              `タグ分布: ${JSON.stringify(aggregates.tagDistributionBySide)}`,
              `回答データ: ${JSON.stringify(compactResponses)}`,
              "",
              "neutralAnalysisTextは300から500字程度。賛成/反対のどちらにも肩入れせず、なぜ分かれるのか、どんな価値軸が見えるのかを書いてください。",
              "standoutBySide.proには賛成側で注目すべき意見や論点を1つの短いまとめとして、standoutBySide.conには反対側で注目すべき意見や論点を1つの短いまとめとして必ず出力してください。",
              "各summaryは、その側の複数回答に共通する背景や価値観が伝わる80字以内の中立的な要約にしてください。単なる一回答の転載や、もう一方への批判にはしないでください。",
              "responseIdとrepresentativeReasonには、そのまとめを最もよく代表する実在の回答を回答データから1件だけ選んでください。該当側の理由文がない場合は、全フィールドを空文字にしてください。",
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "debate_question_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                analysisTitle: { type: "string" },
                stanceTone: {
                  type: "string",
                  enum: ["pro", "con", "neutral"],
                },
                neutralAnalysisText: { type: "string" },
                observations: {
                  type: "array",
                  items: { type: "string" },
                },
                standoutBySide: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    pro: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        responseId: { type: "string" },
                        representativeReason: { type: "string" },
                        summary: { type: "string" },
                      },
                      required: ["responseId", "representativeReason", "summary"],
                    },
                    con: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        responseId: { type: "string" },
                        representativeReason: { type: "string" },
                        summary: { type: "string" },
                      },
                      required: ["responseId", "representativeReason", "summary"],
                    },
                  },
                  required: ["pro", "con"],
                },
              },
              required: [
                "analysisTitle",
                "stanceTone",
                "neutralAnalysisText",
                "observations",
                "standoutBySide",
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
    const aiAnalysis = parseOpenAiAnalysis(openaiJson);
    const payload = {
      question_id: question.id,
      total_count: totalResponseCount,
      choice_counts: aggregates.choiceCounts,
      top_tags: aggregates.topTags,
      tag_distribution_by_side: aggregates.tagDistributionBySide,
      scatter_summary: aggregates.scatterSummary,
      neutral_analysis_text: aiAnalysis.neutralAnalysisText,
      standout_responses: aiAnalysis.standoutResponses,
      raw_analysis: aiAnalysis.rawAnalysis,
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("debate_question_analysis_snapshots")
      .insert(payload)
      .select("*")
      .single();

    if (saveError) {
      return jsonResponse(
        { error: "Failed to save question analysis", details: saveError.message },
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
