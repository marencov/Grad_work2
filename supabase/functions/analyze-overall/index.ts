// Supabase Edge Function: analyze-overall
//
// 目的:
// - フロントエンドから OpenAI APIキーを隠す
// - answers テーブルの全回答をまとめて読む
// - OpenAI APIで「全体の傾向」「光る意見」「面白い意見」をJSON生成する
// - overall_analysis テーブルへ保存する
//
// 注意:
// - OPENAI_API_KEY は Supabase Edge Function の環境変数に設定します。
// - React / Next.js 側の .env.local には絶対に OpenAI APIキーを書きません。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnswerRow = {
  id: string;
  choice: string;
  reason: string;
  created_at: string;
};

type OverallAnalysis = {
  overview: string;
  leadingChoice: string;
  insights: string[];
  opinionGroups: Array<{
    label: string;
    description: string;
    relatedChoices: string[];
  }>;
  standoutOpinions: Array<{
    answerId: string;
    choice: string;
    reason: string;
    whyItStandsOut: string;
  }>;
  funnyOpinions: Array<{
    answerId: string;
    choice: string;
    reason: string;
    whyFunny: string;
  }>;
  recommendations: string[];
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

function getChoiceLabel(choice: string) {
  const labels: Record<string, string> = {
    poopCurry: "うんこ味のカレー",
    curryPoop: "カレー味のうんこ",
  };
  return labels[choice] ?? choice;
}

function countChoices(answers: Array<{ choice: string }>) {
  return answers.reduce<Record<string, number>>((counts, answer) => {
    counts[answer.choice] = (counts[answer.choice] ?? 0) + 1;
    return counts;
  }, {});
}

function getLeadingChoice(choiceCounts: Record<string, number>) {
  const entries = Object.entries(choiceCounts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return "none";
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return "tie";
  return entries[0][0];
}

function extractOpenAiAnalysis(responseJson: any) {
  if (responseJson.output_text) {
    return responseJson.output_text;
  }

  for (const outputItem of responseJson.output ?? []) {
    for (const content of outputItem.content ?? []) {
      if (content.parsed) return content.parsed;
      if (content.text) return content.text;
    }
  }

  const chatContent = responseJson.choices?.[0]?.message?.content;
  if (chatContent) return chatContent;

  throw new Error(
    `OpenAI response did not include analysis JSON. Response keys: ${
      Object.keys(responseJson).join(", ")
    }`,
  );
}

function parseOpenAiJson(responseJson: any): OverallAnalysis {
  const rawAnalysis = extractOpenAiAnalysis(responseJson);
  const parsed =
    typeof rawAnalysis === "string" ? JSON.parse(rawAnalysis) : rawAnalysis;

  return {
    overview: String(parsed.overview ?? ""),
    leadingChoice: String(parsed.leadingChoice ?? "unknown"),
    insights: Array.isArray(parsed.insights) ? parsed.insights.map(String) : [],
    opinionGroups: Array.isArray(parsed.opinionGroups)
      ? parsed.opinionGroups
      : [],
    standoutOpinions: Array.isArray(parsed.standoutOpinions)
      ? parsed.standoutOpinions
      : [],
    funnyOpinions: Array.isArray(parsed.funnyOpinions)
      ? parsed.funnyOpinions
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String)
      : [],
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
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = getRequiredEnv("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: answers, error: answersError } = await supabase
      .from("answers")
      .select("id, choice, reason, created_at")
      .order("created_at", { ascending: true })
      .limit(200);

    if (answersError) {
      return jsonResponse(
        { error: "Failed to read answers", details: answersError.message },
        500,
      );
    }

    if (!answers || answers.length === 0) {
      return jsonResponse({ error: "No answers to analyze" }, 400);
    }

    const typedAnswers = answers as AnswerRow[];
    const choiceCounts = countChoices(typedAnswers);
    const leadingChoice = getLeadingChoice(choiceCounts);
    const choiceCountsForPrompt = Object.fromEntries(
      Object.entries(choiceCounts).map(([choice, count]) => [
        getChoiceLabel(choice),
        count,
      ]),
    );
    const compactAnswers = typedAnswers.map((answer, index) => ({
      id: answer.id,
      no: index + 1,
      choiceKey: answer.choice,
      choice: getChoiceLabel(answer.choice),
      reason: answer.reason,
    }));

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
              "あなたは展示会場のアンケート回答を読む、親しみやすい試合実況者兼データ解説者です。硬いレポート調ではなく、やわらかい口語調で、少し面白おかしく実況してください。ただし回答者を馬鹿にせず、具体的な観察と根拠を大切にしてください。返答は日本語JSONのみです。",
          },
          {
            role: "user",
            content: [
              "以下はアンケート回答の全体データです。",
              "抽出してほしいものは3種類です。",
              "1. 全体の傾向と考察: どちらが優勢か、なぜそう見えるか、どんな判断軸があるか。",
              "2. 光る意見や具体的な意見: どちらの選択肢でもよいので、展示で目立たせる価値のあるもの。",
              "3. クスッときてしまう面白い意見: ユーモア、言い回し、発想のズレがあるもの。",
              "overview と insights は実況席から話しているような口語調にしてください。",
              "例: おっと、ここで味覚重視派がじわじわ前に出てきました。見た目のインパクトより、口に入れた瞬間の現実を見ている人が多そうです。",
              "whyItStandsOut と whyFunny も、短く、やわらかく、少し楽しいコメントにしてください。",
              "個別回答の採点は別のscore-answer関数で済ませているため、この全体解析ではscoreを返さないでください。",
              "回答や解析結果では poopCurry / curryPoop という内部名を使わず、日本語の選択肢名だけを使ってください。",
              "",
              `choiceCounts: ${JSON.stringify(choiceCountsForPrompt)}`,
              `leadingChoiceByCount: ${getChoiceLabel(leadingChoice)}`,
              `answers: ${JSON.stringify(compactAnswers)}`,
            ].join("\n"),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "overall_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                overview: { type: "string" },
                leadingChoice: { type: "string" },
                insights: { type: "array", items: { type: "string" } },
                opinionGroups: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      label: { type: "string" },
                      description: { type: "string" },
                      relatedChoices: { type: "array", items: { type: "string" } },
                    },
                    required: ["label", "description", "relatedChoices"],
                  },
                },
                standoutOpinions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      answerId: { type: "string" },
                      choice: { type: "string" },
                      reason: { type: "string" },
                      whyItStandsOut: { type: "string" },
                    },
                    required: ["answerId", "choice", "reason", "whyItStandsOut"],
                  },
                },
                funnyOpinions: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      answerId: { type: "string" },
                      choice: { type: "string" },
                      reason: { type: "string" },
                      whyFunny: { type: "string" },
                    },
                    required: ["answerId", "choice", "reason", "whyFunny"],
                  },
                },
                recommendations: { type: "array", items: { type: "string" } },
              },
              required: [
                "overview",
                "leadingChoice",
                "insights",
                "opinionGroups",
                "standoutOpinions",
                "funnyOpinions",
                "recommendations",
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
    const analysis = parseOpenAiJson(openaiJson);

    const payload = {
      total_count: typedAnswers.length,
      choice_counts: choiceCounts,
      leading_choice: analysis.leadingChoice || getChoiceLabel(leadingChoice),
      overview: analysis.overview,
      insights: analysis.insights,
      opinion_groups: analysis.opinionGroups,
      standout_opinions: analysis.standoutOpinions,
      funny_opinions: analysis.funnyOpinions,
      scored_answers: [],
      recommendations: analysis.recommendations,
      raw_analysis: analysis,
    };

    const { data: savedAnalysis, error: saveError } = await supabase
      .from("overall_analysis")
      .insert(payload)
      .select(
        "id, total_count, choice_counts, leading_choice, overview, insights, opinion_groups, standout_opinions, funny_opinions, scored_answers, recommendations, created_at",
      )
      .single();

    if (saveError) {
      return jsonResponse(
        { error: "Failed to save overall analysis", details: saveError.message },
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
