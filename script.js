/*
  script.js は動きを担当するファイルです。

  このプロトタイプでやっていること:
  1. Scrollama で「今見えているスライド」を判定する
  2. 選択肢ボタンを押したら、選択状態を保存する
  3. 理由を入力して送信したら、localStorage に回答を蓄積する
  4. 保存された回答をSVGの散布図として描画する

  localStorage とは:
  - ブラウザの中に小さなデータを保存する機能です。
  - サーバーなしで試せるので、プロトタイプに向いています。
  - 本番では Next.js の API Route や Supabase / Firebase などに置き換えるとよいです。
*/

const slides = Array.from(document.querySelectorAll(".slide"));
const progressDots = Array.from(document.querySelectorAll(".progress-dot"));
const scrollButtons = Array.from(document.querySelectorAll("[data-scroll-to]"));
const choiceButtons = Array.from(document.querySelectorAll(".choice-card"));
const answerForm = document.querySelector("#answerForm");
const reasonInput = document.querySelector("#reasonInput");
const scatterChart = document.querySelector("#scatterChart");
const tooltip = document.querySelector("#tooltip");
const toast = document.querySelector("#toast");
const slidesContainer = document.querySelector("#slides");
const resultsSection = document.querySelector("#results");
const submitButton = document.querySelector(".submit-button");
const overallMeta = document.querySelector("#overallMeta");
const overallContent = document.querySelector("#overallContent");
const overallOverview = document.querySelector("#overallOverview");
const overallInsights = document.querySelector("#overallInsights");
const overallStandouts = document.querySelector("#overallStandouts");
const overallFunny = document.querySelector("#overallFunny");

const STORAGE_KEY = "takahiromethod_scrolly_answers";
const ANALYSIS_STORAGE_KEY = "takahiromethod_scrolly_answer_analysis";
const OVERALL_ANALYSIS_STORAGE_KEY = "takahiromethod_scrolly_overall_analysis";
const SUPABASE_TABLE_NAME = "answers";
const ANALYSIS_TABLE_NAME = "answer_analysis";
const OVERALL_ANALYSIS_TABLE_NAME = "overall_analysis";

/*
  Supabaseの接続準備です。

  Reactに移行した場合は、このあたりは lib/supabaseClient.js のような
  別ファイルへ分けると責務が見えやすくなります。

  window.SUPABASE_CONFIG は supabase-config.js で定義します。
  service_role key や OpenAI APIキーのような秘密情報は、絶対に
  フロントエンドへ置かないでください。
*/
const supabaseConfig = window.SUPABASE_CONFIG;
const hasSupabaseConfig =
  supabaseConfig?.url &&
  supabaseConfig?.anonKey &&
  !supabaseConfig.url.includes("YOUR_PROJECT_ID") &&
  !supabaseConfig.anonKey.includes("YOUR_SUPABASE_ANON_PUBLIC_KEY");
const supabaseClient =
  window.supabase && hasSupabaseConfig
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;
let cachedAnswers = getLocalAnswers();
let cachedAnalyses = getLocalAnalyses();
let latestOverallAnalysis = getLocalOverallAnalysis();
let latestAnalysis = null;
let isResultsAnalysisVisible = false;
let activeStep = "";

/*
  選択肢の表示名をまとめておきます。
  data-choice の値だけだと機械向けなので、人間に見せる文字はここで管理します。
*/
const choiceLabels = {
  poopCurry: "うんこ味のカレー",
  curryPoop: "カレー味のうんこ",
};

let selectedChoice = "";

function createId() {
  /*
    回答ごとに重ならないIDを作ります。
    新しいブラウザでは crypto.randomUUID() が使えますが、
    古い環境で動かす可能性もあるので、Date.now() を使った予備も用意しています。
  */
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `answer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocalAnswers() {
  /*
    localStorage に保存されている文字列を、JavaScriptで使いやすい配列に戻します。
    データがないときは空の配列 [] を返します。
  */
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return [];
  }
}

function saveLocalAnswers(answers) {
  /*
    localStorage は文字列しか保存できません。
    そのため JSON.stringify で配列を文字列に変換して保存します。
  */
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

function getLocalAnalyses() {
  /*
    Edge Functionをまだ使わないローカル確認用の保存場所です。
    Supabaseが設定されている本番寄りの動きでは、answer_analysis テーブルを使います。
  */
  const rawData = localStorage.getItem(ANALYSIS_STORAGE_KEY);
  if (!rawData) {
    return [];
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return [];
  }
}

function saveLocalAnalyses(analyses) {
  localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analyses));
}

function getLocalOverallAnalysis() {
  const rawData = localStorage.getItem(OVERALL_ANALYSIS_STORAGE_KEY);
  if (!rawData) {
    return null;
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
}

function saveLocalOverallAnalysis(analysis) {
  localStorage.setItem(OVERALL_ANALYSIS_STORAGE_KEY, JSON.stringify(analysis));
}

function getAnswers() {
  return cachedAnswers;
}

function normalizeAnalysis(row) {
  /*
    DBの snake_case(answer_id) を、画面で扱いやすい camelCase(answerId) に変換します。
    React化したときも、画面側のcomponentはこの形だけを見ればよくなります。
  */
  return {
    id: row.id,
    answerId: row.answer_id || row.answerId,
    summary: row.summary,
    sentiment: row.sentiment,
    tags: Array.isArray(row.tags) ? row.tags : [],
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    createdAt: row.created_at || row.createdAt,
  };
}

function normalizeOverallAnalysis(row) {
  /*
    Supabaseの列名は snake_case、画面側は camelCase にそろえます。
    全体解析は、可視化や展示用のテキストとして使うため、配列項目は必ず配列に整えます。
  */
  return {
    id: row.id,
    totalCount: row.total_count || row.totalCount || 0,
    choiceCounts: row.choice_counts || row.choiceCounts || {},
    leadingChoice: row.leading_choice || row.leadingChoice || "unknown",
    overview: row.overview || "",
    insights: Array.isArray(row.insights) ? row.insights : [],
    opinionGroups: Array.isArray(row.opinion_groups)
      ? row.opinion_groups
      : Array.isArray(row.opinionGroups)
        ? row.opinionGroups
        : [],
    standoutOpinions: Array.isArray(row.standout_opinions)
      ? row.standout_opinions
      : Array.isArray(row.standoutOpinions)
        ? row.standoutOpinions
        : [],
    funnyOpinions: Array.isArray(row.funny_opinions)
      ? row.funny_opinions
      : Array.isArray(row.funnyOpinions)
        ? row.funnyOpinions
        : [],
    scoredAnswers: Array.isArray(row.scored_answers)
      ? row.scored_answers
      : Array.isArray(row.scoredAnswers)
        ? row.scoredAnswers
        : [],
    recommendations: Array.isArray(row.recommendations)
      ? row.recommendations
      : [],
    createdAt: row.created_at || row.createdAt,
  };
}

function normalizeAnswer(row) {
  /*
    Supabaseの列名 created_at を、画面側で使いやすい createdAt に変えます。

    DBの形と画面の形をここで変換しておくと、あとでReact化したときに
    component側がDBの細かい列名に振り回されにくくなります。
  */
  return {
    id: row.id,
    choice: row.choice,
    reason: row.reason,
    createdAt: row.created_at || row.createdAt,
  };
}

async function fetchAnswersFromSupabase() {
  if (!supabaseClient) {
    return getLocalAnswers();
  }

  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .select("id, choice, reason, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabaseから回答を取得できませんでした:", error);
    showToast("Supabaseから読み込めませんでした");
    return getLocalAnswers();
  }

  return data.map(normalizeAnswer);
}

async function refreshAnswers() {
  cachedAnswers = await fetchAnswersFromSupabase();
  renderChart();
}

async function fetchAnalysesFromSupabase() {
  /*
    解析結果をまとめて取得します。
    将来、回答数が増えたら「最新100件だけ」などに制限すると軽くできます。
  */
  if (!supabaseClient) {
    return getLocalAnalyses();
  }

  const { data, error } = await supabaseClient
    .from(ANALYSIS_TABLE_NAME)
    .select("id, answer_id, summary, sentiment, tags, keywords, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabaseから解析結果を取得できませんでした:", error);
    return getLocalAnalyses();
  }

  return data.map(normalizeAnalysis);
}

async function fetchAnalysisForAnswer(answerId) {
  /*
    Edge Functionの返り値の形が変わっても画面表示できるように、
    answer_analysis テーブルから answer_id で解析結果を取り直すための関数です。

    初心者向けメモ:
    - Edge Functionは「解析して保存する係」
    - この関数は「保存された解析結果を読む係」
    と分けておくと、返り値の形に依存しすぎず安全です。
  */
  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from(ANALYSIS_TABLE_NAME)
    .select("id, answer_id, summary, sentiment, tags, keywords, created_at")
    .eq("answer_id", answerId)
    .maybeSingle();

  if (error) {
    console.error("解析結果の取得に失敗しました:", error);
    throw error;
  }

  return data ? normalizeAnalysis(data) : null;
}

async function refreshAnalyses() {
  cachedAnalyses = await fetchAnalysesFromSupabase();
  latestAnalysis = cachedAnalyses[cachedAnalyses.length - 1] || null;
  renderLatestAnalysis();
}

async function fetchLatestOverallAnalysisFromSupabase() {
  /*
    保存済みの最新の全体解析を取得します。
    ページを開き直しても直近の考察を表示できるようにするためです。
  */
  if (!supabaseClient) {
    return getLocalOverallAnalysis();
  }

  const { data, error } = await supabaseClient
    .from(OVERALL_ANALYSIS_TABLE_NAME)
    .select(
      "id, total_count, choice_counts, leading_choice, overview, insights, opinion_groups, standout_opinions, funny_opinions, scored_answers, recommendations, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("全体解析の取得に失敗しました:", error);
    return getLocalOverallAnalysis();
  }

  return data ? normalizeOverallAnalysis(data) : null;
}

async function refreshOverallAnalysis() {
  latestOverallAnalysis = await fetchLatestOverallAnalysisFromSupabase();
  renderChart();
  renderOverallAnalysis();
}

async function runOverallAnalysis() {
  /*
    全体解析を実行して画面を更新する共通関数です。
    回答送信後の自動解析と、手動ボタンの再解析の両方から使います。
  */
  showToast("全体解析中...");
  latestOverallAnalysis = await analyzeOverallAnswers();
  if (!supabaseClient) {
    saveLocalOverallAnalysis(latestOverallAnalysis);
  }
  renderChart();
  renderOverallAnalysis();
  showToast("全体解析が完了しました");
}

async function saveAnswer(answer) {
  /*
    Supabaseが設定されている場合はクラウドDBへ保存します。
    未設定の場合は、プロトタイプ確認用にlocalStorageへ保存します。
  */
  if (!supabaseClient) {
    const localAnswer = {
      ...answer,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    cachedAnswers = [...getLocalAnswers(), localAnswer];
    saveLocalAnswers(cachedAnswers);
    return localAnswer;
  }

  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .insert({
      choice: answer.choice,
      reason: answer.reason,
    })
    .select("id, choice, reason, created_at")
    .single();

  if (error) {
    console.error("Supabaseへの保存に失敗しました:", error);
    throw error;
  }

  return normalizeAnswer(data);
}

function createLocalAnalysis(answer) {
  /*
    Supabase未設定でも画面の流れを試せるようにする簡易解析です。
    本物のAI解析ではありません。実際の解析はEdge Function + OpenAI APIで行います。
  */
  const words = answer.reason
    .split(/[\s、。,.!?！？]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: createId(),
    answerId: answer.id,
    summary: answer.reason.length > 48
      ? `${answer.reason.slice(0, 48)}...`
      : answer.reason,
    sentiment: "neutral",
    tags: ["local-preview"],
    keywords: words.length ? words : [answer.choice],
    createdAt: new Date().toISOString(),
  };
}

function createLocalOverallAnalysis() {
  /*
    Supabase未設定時の簡易版です。
    本物の全体考察は analyze-overall Edge Function がOpenAI APIで行います。
  */
  const answers = getAnswers();
  const choiceCounts = answers.reduce((counts, answer) => {
    counts[answer.choice] = (counts[answer.choice] || 0) + 1;
    return counts;
  }, {});
  const sortedChoices = Object.entries(choiceCounts).sort((a, b) => b[1] - a[1]);
  const leadingChoice = sortedChoices[0]?.[0] || "none";
  const standoutOpinions = answers
    .filter((answer) => answer.reason.length > 20)
    .slice(-3)
    .map((answer) => ({
      answerId: answer.id,
      choice: answer.choice,
      reason: answer.reason,
      whyItStandsOut: "理由が比較的具体的なため",
    }));
  const scoredAnswers = answers.map((answer) => ({
    answerId: answer.id,
    score: Math.max(0, Math.min(10, Math.round(answer.reason.length / 12))),
    reason: answer.reason.length > 12 ? "理由の記述量で簡易スコアリング" : "短い回答",
  }));

  return {
    id: createId(),
    totalCount: answers.length,
    choiceCounts,
    leadingChoice,
    overview: `現在の回答数は${answers.length}件です。${leadingChoice}が相対的に多い状態です。`,
    insights: ["これはローカル確認用の簡易集計です。"],
    opinionGroups: [
      {
        label: "ローカル集計",
        description: "Supabase未設定時の仮の全体解析です。",
        relatedChoices: Object.keys(choiceCounts),
      },
    ],
    standoutOpinions,
    funnyOpinions: standoutOpinions.slice(0, 2).map((opinion) => ({
      ...opinion,
      answerId: opinion.answerId || "",
      whyFunny: "ローカル確認用の仮ピックアップ",
    })),
    scoredAnswers,
    recommendations: ["本番では analyze-overall Edge Function を使ってください。"],
    createdAt: new Date().toISOString(),
  };
}

async function analyzeOverallAnswers() {
  /*
    全回答をまとめて解析します。
    1件ごとの解析とは違い、ここでは「全体傾向」「優勢」「意見グループ」
    「光る意見」をまとめて見ます。
  */
  if (!supabaseClient) {
    return createLocalOverallAnalysis();
  }

  const { data, error } = await supabaseClient.functions.invoke(
    "analyze-overall",
    {
      body: {},
    },
  );

  if (error) {
    const details = await getFunctionErrorDetails(error);
    console.error("全体解析に失敗しました:", details || error);
    throw new Error(formatErrorDetails(details || error));
  }

  if (data?.analysis) {
    return normalizeOverallAnalysis(data.analysis);
  }

  return normalizeOverallAnalysis(data);
}

async function getFunctionErrorDetails(error) {
  /*
    Supabase Edge Functionが 4xx / 5xx を返した場合、
    error.context の中にレスポンス本文が入っていることがあります。
    ここを読むと「OPENAI_API_KEYがない」「テーブルがない」などの原因に近づけます。
  */
  if (!error?.context) {
    return null;
  }

  try {
    const contentType = error.context.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      return await error.context.json();
    }
    return await error.context.text();
  } catch {
    return null;
  }
}

function formatErrorDetails(details) {
  /*
    Consoleに Object とだけ出ると原因が読みにくいので、
    画面表示や Error message に使いやすい文字列へ変換します。
  */
  if (!details) {
    return "Unknown Edge Function error";
  }

  if (typeof details === "string") {
    return details;
  }

  if (details instanceof Error) {
    return details.message;
  }

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

function renderLatestAnalysis() {
  // 個別解析パネルは現在使っていません。互換用に空関数として残しています。
}

function renderAnalysisError(message) {
  console.error(message);
}

function renderOverallAnalysis() {
  /*
    全体解析の表示をまとめて更新します。
    innerHTMLではなくtextContentとcreateElementを使い、AIの文章がHTMLとして
    実行されないようにしています。
  */
  if (!overallMeta || !overallContent) {
    return;
  }

  if (!latestOverallAnalysis) {
    overallMeta.textContent = "全体解析はまだありません。";
    overallContent.hidden = true;
    return;
  }

  const countsText = Object.entries(latestOverallAnalysis.choiceCounts)
    .map(([choice, count]) => `${getChoiceLabel(choice)}: ${count}`)
    .join(" / ");

  overallMeta.textContent = `回答 ${latestOverallAnalysis.totalCount}件 / 優勢: ${getChoiceLabel(latestOverallAnalysis.leadingChoice)} / ${countsText}`;
  overallContent.hidden = false;
  overallOverview.textContent = latestOverallAnalysis.overview;

  renderList(overallInsights, latestOverallAnalysis.insights);
  renderList(
    overallStandouts,
    latestOverallAnalysis.standoutOpinions.map(
      (opinion) =>
        `${opinion.reason} (${opinion.choice}) - ${opinion.whyItStandsOut}`,
    ),
  );
  renderList(
    overallFunny,
    latestOverallAnalysis.funnyOpinions.map(
      (opinion) => `${opinion.reason} (${opinion.choice}) - ${opinion.whyFunny}`,
    ),
  );
}

function setResultsAnalysisVisible(isVisible) {
  /*
    結果ページは2段階で見せます。
    1. 最初はグラフだけ
    2. さらに下スクロールしたら、画面位置は固定したままAI解析と吹き出しを追加
  */
  isResultsAnalysisVisible = isVisible;
  resultsSection?.classList.toggle("is-analysis-visible", isVisible);
  renderChart();
}

function renderList(container, items) {
  container.replaceChildren();

  if (!items.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "まだありません。";
    container.append(emptyItem);
    return;
  }

  items.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    container.append(listItem);
  });
}

function getChoiceLabel(choiceName) {
  if (choiceName === "tie") {
    return "拮抗";
  }
  if (choiceName === "none" || choiceName === "unknown") {
    return "未判定";
  }
  return choiceLabels[choiceName] || choiceName;
}

function setActiveStep(stepName) {
  /*
    右側のページ位置ドットを更新します。
    Scrollama が現在の section を検知するたびに呼ばれます。
  */
  const previousStep = activeStep;
  activeStep = stepName;
  document.body.dataset.step = stepName;

  progressDots.forEach((dot) => {
    dot.classList.toggle("is-active", dot.dataset.dot === stepName);
  });

  if (stepName === "results" && previousStep !== "results") {
    setResultsAnalysisVisible(false);
    renderChart();
  }
}

function scrollToSlide(id) {
  /*
    ボタンで次のページへ移動するための関数です。
    CSSのスクロールスナップがあるので、移動後はスライド位置に自然に止まります。
  */
  const target = document.querySelector(`#${id}`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function chooseAnswer(choiceName) {
  selectedChoice = choiceName;

  choiceButtons.forEach((button) => {
    const isSelected = button.dataset.choice === choiceName;
    button.classList.toggle("is-selected", isSelected);
  });

  scrollToSlide("reason");
  reasonInput.focus({ preventScroll: true });
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;

  window.setTimeout(() => {
    toast.hidden = true;
  }, 1600);
}

async function submitAnswer(reason) {
  /*
    1回ぶんの回答をオブジェクトとして作ります。
    id は点を区別するため、createdAt は回答時刻を残すための値です。
  */
  const answer = {
    choice: selectedChoice,
    reason,
  };

  try {
    if (submitButton) {
      submitButton.disabled = true;
    }
    showToast("送信中...");

    const savedAnswer = await saveAnswer(answer);
    cachedAnswers = [...getAnswers(), savedAnswer];

    reasonInput.value = "";
    showToast("送信しました");
    renderChart();
    scrollToSlide("results");

    if (supabaseClient) {
      await refreshAnswers();
    }

    try {
      await runOverallAnalysis();
      setResultsAnalysisVisible(false);
    } catch (overallError) {
      console.error(overallError);
      overallMeta.textContent = `全体解析に失敗しました: ${overallError.message}`;
      showToast("全体解析に失敗しました");
    }
  } catch (error) {
    console.error(error);
    showToast("送信に失敗しました");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function createSvgElement(tagName, attributes = {}) {
  /*
    SVGの部品を作るための小さなヘルパー関数です。
    document.createElementNS を使う点が、普通のHTML要素作成と少し違います。
  */
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

function getPointPosition(answer, index, choiceIndexCounts) {
  /*
    散布図の点の位置を決めます。
    x はどちらを選んだか、y は同じ選択の中で何番目かを表します。

    少しだけ左右に散らすことで、点が完全に重ならないようにしています。
  */
  const chartTop = 70;
  const chartBottom = 420;
  const xBase = answer.choice === "poopCurry" ? 260 : 640;
  const countInSameChoice = choiceIndexCounts[answer.choice];
  const jitter = ((index % 5) - 2) * 18;
  const y = chartBottom - countInSameChoice * 28;

  return {
    x: xBase + jitter,
    y: Math.max(chartTop, y),
  };
}

function renderChart() {
  const answers = getAnswers();

  scatterChart.replaceChildren();

  /*
    まず軸・ガイド・ラベルなど、グラフの土台を描きます。
  */
  scatterChart.append(
    createSvgElement("line", {
      class: "chart-axis",
      x1: 120,
      y1: 430,
      x2: 780,
      y2: 430,
    }),
    createSvgElement("line", {
      class: "chart-guide",
      x1: 260,
      y1: 70,
      x2: 260,
      y2: 430,
    }),
    createSvgElement("line", {
      class: "chart-guide",
      x1: 640,
      y1: 70,
      x2: 640,
      y2: 430,
    }),
  );

  const leftLabel = createSvgElement("text", {
    class: "chart-label",
    x: 260,
    y: 478,
    "text-anchor": "middle",
  });
  leftLabel.textContent = choiceLabels.poopCurry;

  const rightLabel = createSvgElement("text", {
    class: "chart-label",
    x: 640,
    y: 478,
    "text-anchor": "middle",
  });
  rightLabel.textContent = choiceLabels.curryPoop;

  const title = createSvgElement("text", {
    class: "chart-count",
    x: 450,
    y: 42,
    "text-anchor": "middle",
  });
  title.textContent = `回答数 ${answers.length}`;

  scatterChart.append(leftLabel, rightLabel, title);

  const totals = {
    poopCurry: answers.filter((answer) => answer.choice === "poopCurry").length,
    curryPoop: answers.filter((answer) => answer.choice === "curryPoop").length,
  };

  const leftCount = createSvgElement("text", {
    class: "chart-count",
    x: 260,
    y: 96,
    "text-anchor": "middle",
  });
  leftCount.textContent = `${totals.poopCurry}票`;

  const rightCount = createSvgElement("text", {
    class: "chart-count",
    x: 640,
    y: 96,
    "text-anchor": "middle",
  });
  rightCount.textContent = `${totals.curryPoop}票`;

  scatterChart.append(leftCount, rightCount);

  const choiceIndexCounts = {
    poopCurry: 0,
    curryPoop: 0,
  };
  const pointPositions = new Map();

  answers.forEach((answer, index) => {
    choiceIndexCounts[answer.choice] += 1;

    const point = getPointPosition(answer, index, choiceIndexCounts);
    const score = getAnswerScore(answer.id);
    const circle = createSvgElement("circle", {
      class: `point choice-${answer.choice}`,
      cx: point.x,
      cy: point.y,
      r: 10 + score * 0.6,
      tabindex: 0,
      style: `opacity: ${0.22 + score * 0.078}`,
      "aria-label": `${choiceLabels[answer.choice]}: ${answer.reason}`,
    });
    pointPositions.set(answer.id, point);

    circle.addEventListener("mouseenter", (event) => {
      showTooltip(event, answer);
    });
    circle.addEventListener("mousemove", (event) => {
      moveTooltip(event);
    });
    circle.addEventListener("mouseleave", hideTooltip);
    circle.addEventListener("focus", (event) => {
      showTooltip(event, answer);
    });
    circle.addEventListener("blur", hideTooltip);

    scatterChart.append(circle);
  });

  renderChartCallouts(pointPositions);
}

function getAnswerScore(answerId) {
  /*
    analyze-overall が返した scoredAnswers から0〜10のスコアを探します。
    スコアが無い回答は、まだ全体解析されていないので薄めの3点として扱います。
  */
  const scoredAnswer = latestOverallAnalysis?.scoredAnswers?.find(
    (item) => item.answerId === answerId,
  );
  return Math.max(0, Math.min(10, Number(scoredAnswer?.score ?? 3)));
}

function renderChartCallouts(pointPositions) {
  /*
    光る意見と面白い意見を、グラフ内の点の近くに吹き出しとして表示します。
    数が多すぎると読みにくいので、それぞれ最大3件に絞ります。
  */
  if (!latestOverallAnalysis || !isResultsAnalysisVisible) {
    return;
  }

  const callouts = [
    ...(latestOverallAnalysis.standoutOpinions || [])
      .slice(0, 3)
      .map((opinion) => ({
        ...opinion,
        kind: "standout",
        label: "光る意見",
        note: opinion.whyItStandsOut,
      })),
    ...(latestOverallAnalysis.funnyOpinions || [])
      .slice(0, 3)
      .map((opinion) => ({
        ...opinion,
        kind: "funny",
        label: "面白い意見",
        note: opinion.whyFunny,
      })),
  ];

  callouts.forEach((callout, index) => {
    const point = pointPositions.get(callout.answerId);
    if (!point) {
      return;
    }

    const xOffset = index % 2 === 0 ? 26 : -246;
    const yOffset = -76 - (index % 3) * 10;
    const x = Math.max(18, Math.min(point.x + xOffset, 650));
    const y = Math.max(54, point.y + yOffset);
    const text = `${callout.label}: ${callout.reason}`;

    scatterChart.append(createCalloutGroup(x, y, text, callout.kind));
  });
}

function createCalloutGroup(x, y, text, kind) {
  const group = createSvgElement("g", {
    class: `chart-callout is-${kind}`,
  });
  const lines = wrapSvgText(text, 18, 3);
  const width = 220;
  const height = 30 + lines.length * 20;

  group.append(
    createSvgElement("rect", {
      x,
      y,
      width,
      height,
      rx: 6,
    }),
  );

  lines.forEach((line, index) => {
    const textElement = createSvgElement("text", {
      x: x + 12,
      y: y + 25 + index * 20,
    });
    textElement.textContent = line;
    group.append(textElement);
  });

  return group;
}

function wrapSvgText(text, maxChars, maxLines) {
  const chars = [...text];
  const lines = [];

  for (let index = 0; index < chars.length; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
    if (lines.length === maxLines) {
      break;
    }
  }

  if (chars.length > maxChars * maxLines) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  }

  return lines;
}

function showTooltip(event, answer) {
  tooltip.innerHTML = `
    <strong>${choiceLabels[answer.choice]}</strong><br>
    ${escapeHtml(answer.reason)}
  `;
  tooltip.hidden = false;
  moveTooltip(event);
}

function moveTooltip(event) {
  const x = "clientX" in event ? event.clientX : 24;
  const y = "clientY" in event ? event.clientY : 24;

  tooltip.style.left = `${Math.max(16, Math.min(x + 16, window.innerWidth - 380))}px`;
  tooltip.style.top = `${Math.max(16, Math.min(y + 16, window.innerHeight - 150))}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

function escapeHtml(text) {
  /*
    入力された文章をそのままHTMLとして入れると危険な場合があります。
    ここでは最低限、HTMLとして解釈されやすい記号を安全な文字に置き換えます。
  */
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addSampleAnswers() {
  const sampleAnswers = [
    {
      id: createId(),
      choice: "poopCurry",
      reason: "食べ物としての形が残っているほうが、まだ想像できるから。",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      choice: "curryPoop",
      reason: "味がカレーなら、感覚としては乗り切れる気がした。",
      createdAt: new Date().toISOString(),
    },
    {
      id: createId(),
      choice: "poopCurry",
      reason: "名前の不快感より、実体がカレーであることを重視した。",
      createdAt: new Date().toISOString(),
    },
  ];

  cachedAnswers = [...getAnswers(), ...sampleAnswers];
  saveLocalAnswers(cachedAnswers);
  renderChart();
}

function setupScrollama() {
  /*
    Scrollama が読み込めている場合はこちらを使います。
    offset: 0.55 は「画面の55%あたりに来たら、そのスライドを現在地にする」という意味です。
  */
  const scroller = scrollama();

  scroller
    .setup({
      step: ".slide",
      offset: 0.55,
      root: slidesContainer,
    })
    .onStepEnter((response) => {
      setActiveStep(response.element.dataset.step);
    });

  window.addEventListener("resize", scroller.resize);
}

function setupFallbackObserver() {
  /*
    Scrollama がCDNから読み込めなかった場合の予備です。
    IntersectionObserver でも「今どのスライドが見えているか」を判定できます。
  */
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        setActiveStep(visibleEntry.target.dataset.step);
      }
    },
    {
      root: slidesContainer,
      threshold: 0.55,
    },
  );

  slides.forEach((slide) => observer.observe(slide));
}

scrollButtons.forEach((button) => {
  button.addEventListener("click", () => {
    scrollToSlide(button.dataset.scrollTo);
  });
});

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    chooseAnswer(button.dataset.choice);
  });
});

answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const reason = reasonInput.value.trim();

  if (!selectedChoice) {
    showToast("先にどちらかを選んでください");
    scrollToSlide("choice");
    return;
  }

  if (!reason) {
    showToast("理由を少し書いてください");
    reasonInput.focus();
    return;
  }

  submitAnswer(reason);
});

resultsSection?.addEventListener(
  "wheel",
  (event) => {
    if (document.body.dataset.step !== "results") {
      return;
    }

    if (event.deltaY > 0 && !isResultsAnalysisVisible) {
      event.preventDefault();
      event.stopPropagation();
      setResultsAnalysisVisible(true);
      return;
    }

    if (event.deltaY < 0 && isResultsAnalysisVisible) {
      event.preventDefault();
      event.stopPropagation();
      setResultsAnalysisVisible(false);
    }
  },
  { passive: false },
);

setActiveStep("title");
renderChart();
renderLatestAnalysis();
renderOverallAnalysis();
refreshAnswers();
refreshOverallAnalysis();

if (typeof scrollama === "function") {
  setupScrollama();
} else {
  setupFallbackObserver();
}
