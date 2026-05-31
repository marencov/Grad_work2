"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseReady, supabaseClient } from "@/lib/supabaseClient";
import { getChoiceLabel } from "@/data/choices";

const ANSWERS_TABLE = "answers";
const OVERALL_ANALYSIS_TABLE = "overall_analysis";
const ANSWERS_STORAGE_KEY = "takahiromethod_next_answers";
const OVERALL_STORAGE_KEY = "takahiromethod_next_overall_analysis";
const LAST_ANSWER_STORAGE_KEY = "takahiromethod_next_last_answer_id";

function createId() {
  return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocalJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawData = localStorage.getItem(key);
    return rawData ? JSON.parse(rawData) : fallback;
  } catch (error) {
    console.warn(`${key} を読み取れませんでした`, error);
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeAnswer(row) {
  return {
    id: row.id,
    choice: row.choice,
    reason: row.reason,
    score: Number(row.score ?? 0),
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function normalizeOverallAnalysis(row) {
  if (!row) return null;

  return {
    id: row.id || createId(),
    totalCount: row.total_count ?? row.totalCount ?? 0,
    choiceCounts: row.choice_counts ?? row.choiceCounts ?? {},
    leadingChoice: row.leading_choice ?? row.leadingChoice ?? "none",
    overview: row.overview ?? "",
    insights: row.insights ?? [],
    opinionGroups: row.opinion_groups ?? row.opinionGroups ?? [],
    standoutOpinions: row.standout_opinions ?? row.standoutOpinions ?? [],
    funnyOpinions: row.funny_opinions ?? row.funnyOpinions ?? [],
    scoredAnswers: row.scored_answers ?? row.scoredAnswers ?? [],
    recommendations: row.recommendations ?? [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

function estimateLocalScore(reason) {
  const text = String(reason || "").trim();
  const normalized = text.toLowerCase();

  if (text.length < 6 || ["test", "テスト", "aaa", "あああ"].includes(normalized)) {
    return 0;
  }

  let score = Math.min(8, Math.floor(text.length / 12) + 2);
  if (/[！？!?笑w]/.test(text)) score += 1;
  if (/具体|経験|なぜ|理由|思う|感じ/.test(text)) score += 1;
  return Math.max(0, Math.min(10, score));
}

function createLocalOverallAnalysis(answers) {
  const choiceCounts = answers.reduce((counts, answer) => {
    counts[answer.choice] = (counts[answer.choice] || 0) + 1;
    return counts;
  }, {});

  const sortedChoices = Object.entries(choiceCounts).sort((a, b) => b[1] - a[1]);
  const leadingChoice = sortedChoices[0]?.[0] || "none";
  const scoredAnswers = answers.map((answer) => ({
    answerId: answer.id,
    choice: answer.choice,
    score: Number(answer.score ?? estimateLocalScore(answer.reason)),
    reason: answer.reason,
  }));

  const goodOpinions = scoredAnswers
    .filter((answer) => answer.score >= 6)
    .slice(0, 3)
    .map((answer) => ({
      answerId: answer.answerId,
      choice: answer.choice,
      label: getChoiceLabel(answer.choice),
      reason: answer.reason,
      why: "理由が具体的なので、議論を動かす発言として目立っています。",
    }));

  return {
    id: createId(),
    totalCount: answers.length,
    choiceCounts,
    leadingChoice,
    overview:
      answers.length === 0
        ? "まだ回答待ちです。最初の一票が入ると、ここから実況が始まります。"
        : `${answers.length}件の回答が集まりました。今のところ ${getChoiceLabel(
            leadingChoice,
          )} が一歩リード。とはいえ、理由のクセと熱量で試合展開はまだまだ動きそうです。`,
    insights: [
      "これはSupabase未接続時のローカル簡易解析です。",
      "本番の細かい考察は Supabase Edge Function の analyze-overall が担当します。",
    ],
    opinionGroups: [],
    standoutOpinions: goodOpinions,
    funnyOpinions: goodOpinions.slice(0, 2),
    scoredAnswers,
    recommendations: [],
    createdAt: new Date().toISOString(),
  };
}

async function readFunctionError(error) {
  const response = error?.context;
  if (!response) return error?.message || "Edge Function の詳細を取得できませんでした。";

  try {
    const contentType = response.headers?.get?.("content-type") || "";
    return contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    return error?.message || "Edge Function の詳細を取得できませんでした。";
  }
}

export function useSurveyAnswers() {
  const [answers, setAnswers] = useState([]);
  const [overallAnalysis, setOverallAnalysis] = useState(null);
  const [ownAnswerId, setOwnAnswerId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const showMessage = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2600);
  }, []);

  const fetchAnswers = useCallback(async () => {
    if (!isSupabaseReady) {
      const localAnswers = readLocalJson(ANSWERS_STORAGE_KEY, []);
      setAnswers(localAnswers);
      return localAnswers;
    }

    const { data, error: fetchError } = await supabaseClient
      .from(ANSWERS_TABLE)
      .select("*")
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    const normalizedAnswers = (data || []).map(normalizeAnswer);
    setAnswers(normalizedAnswers);
    return normalizedAnswers;
  }, []);

  const fetchLatestOverallAnalysis = useCallback(async () => {
    if (!isSupabaseReady) {
      const localAnalysis = normalizeOverallAnalysis(readLocalJson(OVERALL_STORAGE_KEY, null));
      setOverallAnalysis(localAnalysis);
      return localAnalysis;
    }

    const { data, error: fetchError } = await supabaseClient
      .from(OVERALL_ANALYSIS_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const normalizedAnalysis = normalizeOverallAnalysis(data);
    setOverallAnalysis(normalizedAnalysis);
    return normalizedAnalysis;
  }, []);

  useEffect(() => {
    // useEffect は「画面が表示された後に実行する処理」です。
    // ここでは初回表示時に、保存済みの回答と最新の全体解析を読み込みます。
    setOwnAnswerId(readLocalJson(LAST_ANSWER_STORAGE_KEY, null));
    Promise.all([fetchAnswers(), fetchLatestOverallAnalysis()]).catch((loadError) => {
      console.error(loadError);
      setError("保存済みデータの読み込みに失敗しました。");
    });
  }, [fetchAnswers, fetchLatestOverallAnalysis]);

  const saveAnswer = useCallback(async ({ choice, reason }) => {
    const answer = {
      id: createId(),
      choice,
      reason,
      score: estimateLocalScore(reason),
      createdAt: new Date().toISOString(),
    };

    if (!isSupabaseReady) {
      const localAnswers = [...readLocalJson(ANSWERS_STORAGE_KEY, []), answer];
      writeLocalJson(ANSWERS_STORAGE_KEY, localAnswers);
      return answer;
    }

    const { data, error: insertError } = await supabaseClient
      .from(ANSWERS_TABLE)
      .insert({
        choice: answer.choice,
        reason: answer.reason,
        score: 0,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return normalizeAnswer(data);
  }, []);

  const rememberOwnAnswer = useCallback((answerId) => {
    setOwnAnswerId(answerId);
    writeLocalJson(LAST_ANSWER_STORAGE_KEY, answerId);
  }, []);

  const runAnswerScoring = useCallback(async (answer) => {
    if (!isSupabaseReady) {
      return answer;
    }

    const { data, error: functionError } = await supabaseClient.functions.invoke(
      "score-answer",
      {
        body: {
          answerId: answer.id,
        },
      },
    );

    if (functionError) {
      const details = await readFunctionError(functionError);
      throw new Error(
        `回答のAI採点に失敗しました: ${
          typeof details === "string" ? details : JSON.stringify(details, null, 2)
        }`,
      );
    }

    return normalizeAnswer(data?.answer || answer);
  }, []);

  const runOverallAnalysis = useCallback(async (currentAnswers) => {
    if (!isSupabaseReady) {
      const localAnalysis = createLocalOverallAnalysis(currentAnswers);
      writeLocalJson(OVERALL_STORAGE_KEY, localAnalysis);
      setOverallAnalysis(localAnalysis);
      return localAnalysis;
    }

    const { data, error: functionError } = await supabaseClient.functions.invoke(
      "analyze-overall",
      {
        body: {},
      },
    );

    if (functionError) {
      const details = await readFunctionError(functionError);
      throw new Error(
        `全体解析に失敗しました: ${
          typeof details === "string" ? details : JSON.stringify(details, null, 2)
        }`,
      );
    }

    const normalizedAnalysis = normalizeOverallAnalysis(data?.analysis || data);
    setOverallAnalysis(normalizedAnalysis);
    return normalizedAnalysis;
  }, []);

  const submitAnswer = useCallback(
    async ({ choice, reason }) => {
      setStatus("submitting");
      setError("");

      try {
        const savedAnswer = await saveAnswer({ choice, reason });
        rememberOwnAnswer(savedAnswer.id);

        // ここで結果ページへすぐ進めるように、まず保存済み回答を画面へ反映します。
        // AI採点と全体解析は下の Promise で裏側に回し、完了したらグラフだけ更新します。
        setAnswers((currentAnswers) => [...currentAnswers, savedAnswer]);
        setStatus("analyzing");
        showMessage("回答を保存しました。AI解析は裏で更新中です。");

        Promise.resolve()
          .then(async () => {
            await runAnswerScoring(savedAnswer);
            const latestAnswers = await fetchAnswers();
            await runOverallAnalysis(latestAnswers);
            await fetchLatestOverallAnalysis();
            setStatus("idle");
            showMessage("AI解析結果を更新しました。");
          })
          .catch(async (backgroundError) => {
            console.error(backgroundError);
            await fetchAnswers().catch(() => {});
            setStatus("idle");
            setError(
              backgroundError.message || "AI解析の更新に失敗しました。回答は保存済みです。",
            );
          });

        return savedAnswer;
      } catch (submitError) {
        console.error(submitError);
        setStatus("idle");
        setError(submitError.message || "回答の保存または解析に失敗しました。");
        return false;
      }
    },
    [
      fetchAnswers,
      fetchLatestOverallAnalysis,
      runAnswerScoring,
      runOverallAnalysis,
      saveAnswer,
      showMessage,
      rememberOwnAnswer,
    ],
  );

  const incrementAnswerScore = useCallback(
    async (answerId) => {
      setError("");

      if (!isSupabaseReady) {
        const localAnswers = readLocalJson(ANSWERS_STORAGE_KEY, []);
        const updatedAnswers = localAnswers.map((answer) =>
          answer.id === answerId
            ? { ...answer, score: Number(answer.score || 0) + 1 }
            : answer,
        );
        writeLocalJson(ANSWERS_STORAGE_KEY, updatedAnswers);
        setAnswers(updatedAnswers);
        showMessage("いいねでスコアを+1しました。");
        return;
      }

      setAnswers((currentAnswers) =>
        currentAnswers.map((answer) =>
          answer.id === answerId
            ? { ...answer, score: Number(answer.score || 0) + 1 }
            : answer,
        ),
      );

      const { data, error: functionError } = await supabaseClient.functions.invoke(
        "increment-answer-score",
        {
          body: { answerId },
        },
      );

      if (functionError) {
        const details = await readFunctionError(functionError);
        await fetchAnswers();
        setError(
          `スコア更新に失敗しました: ${
            typeof details === "string" ? details : JSON.stringify(details, null, 2)
          }`,
        );
        return;
      }

      const updatedAnswer = normalizeAnswer(data?.answer || {});
      setAnswers((currentAnswers) =>
        currentAnswers.map((answer) =>
          answer.id === updatedAnswer.id ? updatedAnswer : answer,
        ),
      );
      showMessage("いいねでスコアを+1しました。");
    },
    [fetchAnswers, showMessage],
  );

  const answerScores = useMemo(() => {
    return new Map(answers.map((answer) => [answer.id, Number(answer.score) || 0]));
  }, [answers]);

  return {
    answers,
    ownAnswerId,
    overallAnalysis,
    answerScores,
    status,
    message,
    error,
    isSupabaseReady,
    submitAnswer,
    incrementAnswerScore,
  };
}
