"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseReady, supabaseClient } from "@/lib/supabaseClient";

const DEFAULT_QUESTION_SLUG = "life-support-treatment";
const LOCAL_KEY_PREFIX = "crosstalk_debate";
const REACTION_KEY = "crosstalk_debate_reactions";
const QUESTION_VERSION = "2026-08-13-v1";

function readReactionHistory() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REACTION_KEY)) || {};
  } catch {
    return {};
  }
}

function writeReactionHistory(history) {
  window.localStorage.setItem(REACTION_KEY, JSON.stringify(history));
}

export const DEBATE_QUESTION_CATALOG = [
  {
    slug: "life-support-treatment",
    title: "延命治療は\nどこまで行うべき？",
    description: "正解のない医療の問いです。まずは直感で立場を選んでください。",
    fieldTags: ["終末期医療", "人生会議", "尊厳死", "高齢者医療"],
    axisXLabel: "侵襲的↔緩和的",
    axisYLabel: "生命・技術への期待",
    choices: {
      pro: { label: "積極的に行うべき", description: "できる限り生命を伸ばす" },
      con: { label: "自然な経過を尊重すべき", description: "無用な苦痛を与えるべきでない" },
    },
    reasonTagSeeds: ["苦痛の回避", "本人の意思", "本人の尊厳", "生活の質", "回復可能性", "家族負担"],
    answerCount: 9215,
  },
  {
    slug: "physical-restraint",
    title: "身体拘束は\n容認されるべき？",
    description: "安全確保と本人の尊厳・自由のあいだで、どこまで身体拘束を認めるべきかを考える問いです。",
    fieldTags: ["介護", "医療安全", "高齢者医療"],
    axisXLabel: "安全確保↔尊厳・自由",
    axisYLabel: "現場負担・リスク許容",
    choices: {
      pro: { label: "必要な場合は容認すべき", description: "転倒や事故を防ぐために限定的に認めるべき" },
      con: { label: "原則として避けるべき", description: "本人の尊厳や自由を不当に奪うべきでない" },
    },
    reasonTagSeeds: ["転倒予防", "本人の尊厳", "現場負担", "家族の安心", "虐待リスク", "代替ケア"],
    answerCount: 8240,
  },
  {
    slug: "aed-for-collapsed-woman",
    title: "倒れている女性に\nAEDを使う？",
    description: "救命の緊急性と、プライバシー・ためらい・法的心理的ハードルのあいだで判断が分かれる問いです。",
    fieldTags: ["救急医療", "AED", "ジェンダー"],
    axisXLabel: "救命優先↔配慮・ためらい",
    axisYLabel: "市民救助への信頼",
    choices: {
      pro: { label: "迷わず使うべき", description: "命を救うことを最優先に行動すべき" },
      con: { label: "使うには配慮が必要", description: "プライバシーや誤解への不安も無視できない" },
    },
    reasonTagSeeds: ["救命優先", "プライバシー", "法的保護", "周囲の協力", "ためらい", "教育不足"],
    answerCount: 7960,
  },
  {
    slug: "paid-ambulance",
    title: "救急車は\n有料化すべき？",
    description: "救急資源の適正利用と、必要な人が受診をためらうリスクのあいだで考える問いです。",
    fieldTags: ["救急医療", "医療費"],
    axisXLabel: "適正利用↔アクセス保障",
    axisYLabel: "自己負担への許容",
    choices: {
      pro: { label: "有料化すべき", description: "不要不急の利用を減らし、救急資源を守るべき" },
      con: { label: "無料を維持すべき", description: "必要な人が救急要請をためらうべきでない" },
    },
    reasonTagSeeds: ["不要不急利用", "受診控え", "医療資源", "公平性", "低所得者負担", "重症化リスク"],
    answerCount: 7560,
  },
  {
    slug: "elderly-copayment-30-percent",
    title: "高齢者の窓口負担も\n3割にするべき？",
    description: "世代間の公平性と、高齢者の受診控え・生活負担のあいだで判断が分かれる問いです。",
    fieldTags: ["医療費", "高齢者医療", "公平性"],
    axisXLabel: "世代間公平↔高齢者保護",
    axisYLabel: "自己負担への許容",
    choices: {
      pro: { label: "3割にするべき", description: "現役世代との公平性や制度維持を重視すべき" },
      con: { label: "負担増は避けるべき", description: "高齢者の受診控えや生活負担を増やすべきでない" },
    },
    reasonTagSeeds: ["世代間公平", "制度維持", "受診控え", "生活負担", "低所得高齢者", "医療費抑制"],
    answerCount: 7010,
  },
  {
    slug: "antibiotics-for-common-cold",
    title: "風邪に抗菌薬を\n使ってよい？",
    description: "風邪に抗菌薬（抗生物質）は必要だと思いますか？",
    fieldTags: ["感染症", "抗菌薬適正使用", "医療資源"],
    axisXLabel: "患者の希望↔医学的必要性",
    axisYLabel: "薬剤耐性への懸念",
    choices: {
      pro: { label: "使ってよい", description: "症状強い場合などは、風邪にも使用してよい" },
      con: { label: "安易に使うべきでない", description: "効果が期待できない風邪への使用は避けるべき" },
    },
    reasonTagSeeds: ["症状の早期改善", "細菌感染の可能性", "薬剤耐性", "副作用", "患者の希望", "適正使用"],
    answerCount: 0,
  },
  {
    slug: "prescription-in-private-practice",
    title: "自由診療なら\n何でも処方してもよい？",
    description: "患者の選択肢と、医師の専門的責任や安全性の境界について考える問いです。",
    fieldTags: ["自由診療", "医療資源", "マンジャロ問題"],
    axisXLabel: "患者の自由↔医師の責任",
    axisYLabel: "安全性・規制の重視",
    choices: {
      pro: { label: "幅広く認めてよい", description: "自由診療では患者の希望を尊重すべき" },
      con: { label: "一定の制限が必要", description: "自由診療でも安全性と医学的妥当性を優先すべき" },
    },
    reasonTagSeeds: ["患者の自己決定", "医師の裁量", "安全性", "医学的根拠", "説明と同意", "利益優先への懸念"],
    answerCount: 0,
  },
  {
    slug: "liberalization-of-medical-advertising",
    title: "医療広告は\nもっと自由にすべき？",
    description: "患者が情報を得る機会と、誇大広告や誤解を招く情報のリスクについて考える問いです。",
    fieldTags: ["医療広告", "情報提供"],
    axisXLabel: "情報発信の自由↔患者保護",
    axisYLabel: "広告規制への支持",
    choices: {
      pro: { label: "もっと自由にすべき", description: "患者が医療機関を比較できる情報を増やすべき" },
      con: { label: "慎重に規制すべき", description: "誇大広告や不適切な誘導から患者を守るべき" },
    },
    reasonTagSeeds: ["患者の知る権利", "医療機関の比較", "誇大広告", "情報の信頼性", "患者の誘導", "競争の促進"],
    answerCount: 0,
  },
  {
    slug: "license-revocation-for-medical-errors",
    title: "医療ミスをした医師は\n免許剥奪すべき？",
    description: "医療ミスを無くすためには、処分を重くするべきでしょうか？",
    fieldTags: ["医療事故", "医療安全"],
    axisXLabel: "厳しい責任追及↔再発防止と改善",
    axisYLabel: "処分の厳格さ",
    choices: {
      pro: { label: "剥奪すべき", description: "患者の安全と医療への信頼を守るため厳しく処分するべき" },
      con: { label: "慎重に判断すべき", description: "原因や故意・過失の程度を個別に判断すべき" },
    },
    reasonTagSeeds: ["患者の安全", "医師の責任", "過失の程度", "再発防止", "組織的要因", "萎縮医療"],
    answerCount: 0,
  },
  {
    slug: "expansion-of-telemedicine",
    title: "オンライン診療を\nもっと増やすべき？",
    description: "医療へのアクセス向上と、対面でなければ得にくい診療情報について考える問いです。",
    fieldTags: ["オンライン診療", "医療資源", "医療DX"],
    axisXLabel: "利便性↔対面診療の確実性",
    axisYLabel: "デジタル医療への期待",
    choices: {
      pro: { label: "もっと増やすべき", description: "通院の負担を減らし医療へのアクセスを改善すべき" },
      con: { label: "慎重にするべき", description: "対面でないとわからないことが多く、慎重にするべき" },
    },
    reasonTagSeeds: ["通院負担", "地域格差", "診察精度", "見逃しのリスク", "デジタル格差", "感染対策"],
    answerCount: 0,
  },
  {
    slug: "ai-medical-diagnosis",
    title: "AIに診断を\n任せてもよい？",
    description: "AIによる診断支援の可能性と、誤診時の責任や人間の判断の必要性について考える問いです。",
    fieldTags: ["医療AI", "医療DX"],
    axisXLabel: "技術への期待↔人間による判断",
    axisYLabel: "AIへの信頼",
    choices: {
      pro: { label: "どんどん任せてよい", description: "精度が確認された領域ではAIを積極的に活用すべき" },
      con: { label: "一定は人間がするべき", description: "診断の責任や患者ごとの事情など、人間が最終判断すべき" },
    },
    reasonTagSeeds: ["診断精度", "医師不足", "見落とし防止", "責任の所在", "患者との対話", "AIへの不信"],
    answerCount: 0,
  },
  {
    slug: "legalization-of-active-euthanasia",
    title: "積極的安楽死を\n認めるべき？",
    description: "治療の見込みがない場合、耐えがたい苦痛から逃れる選択と、生命保護や制度の濫用リスクについて考える問いです。",
    fieldTags: ["安楽死", "終末期医療", "人生会議", "倫理"],
    axisXLabel: "生命の保護↔自己決定",
    axisYLabel: "制度化への許容",
    choices: {
      pro: { label: "条件付きで認めるべき", description: "本人の明確な意思と耐えがたい苦痛がある場合ならば認める" },
      con: { label: "認めるべきでない", description: "生命保護と濫用防止を優先し別の支援を充実させる" },
    },
    reasonTagSeeds: ["本人の自己決定", "耐えがたい苦痛", "生命の尊重", "制度の濫用", "家族への影響", "緩和ケア"],
    answerCount: 0,
  },
  {
    slug: "personal-responsibility-medical-costs",
    title: "自己責任の病気は\n医療費を本人負担にすべき？",
    description: "喫煙者の肺癌や生活習慣病など、本人に原因がある医療費は本人負担にすべきだと思いますか？",
    fieldTags: ["医療費", "公平性"],
    axisXLabel: "個人の責任↔社会による保障",
    axisYLabel: "本人負担への許容",
    choices: {
      pro: { label: "自己負担割合を増やすべき", description: "本人による原因には一定の責任を求めるべき" },
      con: { label: "差を生むべきではない", description: "原因に関わらず、保険料や窓口負担は一定にすべき" },
    },
    reasonTagSeeds: ["本人の責任", "疾患原因の複雑さ", "医療費の公平性", "予防への動機", "経済格差", "受診控え", "スティグマ"],
    answerCount: 0,
  },
];

const FALLBACK_QUESTION = {
  id: "local-life-support-treatment",
  slug: DEFAULT_QUESTION_SLUG,
  title: "延命治療はどこまで行うべき？",
  description:
    "正解がひとつに決まりにくい医療の問いについて、まずは直感に近い立場を選び、その理由を集めます。",
  axisXLabel: "苦痛と尊厳",
  axisYLabel: "生命・技術への期待",
};

const FALLBACK_CHOICES = [
  {
    id: "local-pro",
    questionId: FALLBACK_QUESTION.id,
    side: "pro",
    label: "積極的に行うべき",
    description: "できる限り生命を伸ばす",
    color: "blue",
  },
  {
    id: "local-con",
    questionId: FALLBACK_QUESTION.id,
    side: "con",
    label: "自然な経過を尊重すべき",
    description: "無用な苦痛を与えるべきでない",
    color: "red",
  },
];

function getCatalogQuestion(slug = DEFAULT_QUESTION_SLUG) {
  return DEBATE_QUESTION_CATALOG.find((question) => question.slug === slug) ?? DEBATE_QUESTION_CATALOG[0];
}

function getLocalKey(slug) {
  return `${LOCAL_KEY_PREFIX}_${slug || DEFAULT_QUESTION_SLUG}`;
}

function createFallbackQuestion(slug = DEFAULT_QUESTION_SLUG) {
  const catalogQuestion = getCatalogQuestion(slug);
  return {
    id: `local-${catalogQuestion.slug}`,
    slug: catalogQuestion.slug,
    title: catalogQuestion.title,
    description: catalogQuestion.description,
    fieldTags: catalogQuestion.fieldTags,
    axisXLabel: catalogQuestion.axisXLabel,
    axisYLabel: catalogQuestion.axisYLabel,
  };
}

function createFallbackChoices(slug = DEFAULT_QUESTION_SLUG) {
  const catalogQuestion = getCatalogQuestion(slug);
  return [
    {
      id: `local-${catalogQuestion.slug}-pro`,
      questionId: `local-${catalogQuestion.slug}`,
      side: "pro",
      label: catalogQuestion.choices.pro.label,
      description: catalogQuestion.choices.pro.description,
      color: "blue",
    },
    {
      id: `local-${catalogQuestion.slug}-con`,
      questionId: `local-${catalogQuestion.slug}`,
      side: "con",
      label: catalogQuestion.choices.con.label,
      description: catalogQuestion.choices.con.description,
      color: "red",
    },
  ];
}

const SAMPLE_RESPONSES = [
  {
    id: "sample-1",
    questionId: FALLBACK_QUESTION.id,
    choiceId: "local-con",
    choiceSide: "con",
    reason:
      "本人が望まない延命なら、医療で時間を伸ばすよりも、苦痛を少なくして家族と過ごせることを大切にしたいです。",
    likes: 12,
    attributes: { ageGroup: "40代", medicalExperience: "なし" },
    createdAt: "2026-06-01T00:00:00.000Z",
    analysis: {
      summary: "苦痛を抑え、本人の時間を尊重したい",
      reasonTags: ["苦痛の回避", "本人の意思", "家族との時間"],
      axisScores: { painDignity: 0.68, lifeTechnologyExpectation: -0.54 },
      standoutScore: 8,
      isInteresting: true,
    },
  },
  {
    id: "sample-2",
    questionId: FALLBACK_QUESTION.id,
    choiceId: "local-pro",
    choiceSide: "pro",
    reason:
      "回復の可能性が少しでもあるなら、医療技術を使って判断の時間を確保することにも意味があると思います。",
    likes: 9,
    attributes: { ageGroup: "20代", medicalExperience: "あり" },
    createdAt: "2026-06-01T00:01:00.000Z",
    analysis: {
      summary: "回復可能性と判断時間を重視する",
      reasonTags: ["回復可能性", "医療技術への期待", "家族の判断時間"],
      axisScores: { painDignity: -0.58, lifeTechnologyExpectation: 0.76 },
      standoutScore: 7,
      isInteresting: true,
    },
  },
  {
    id: "sample-3",
    questionId: FALLBACK_QUESTION.id,
    choiceId: "local-con",
    choiceSide: "con",
    reason:
      "生きている長さだけでなく、その人らしくいられるかを考えるべきだと思います。",
    likes: 16,
    attributes: { ageGroup: "30代", caregivingExperience: "あり" },
    createdAt: "2026-06-01T00:02:00.000Z",
    analysis: {
      summary: "その人らしさを重視する",
      reasonTags: ["本人の尊厳", "生活の質", "本人の意思"],
      axisScores: { painDignity: 0.86, lifeTechnologyExpectation: -0.28 },
      standoutScore: 9,
      isInteresting: true,
    },
  },
];

function createId() {
  return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLocalState(slug = DEFAULT_QUESTION_SLUG) {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(getLocalKey(slug));
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeLocalState(slug = DEFAULT_QUESTION_SLUG, state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getLocalKey(slug), JSON.stringify(state));
}

function getDisplayEnvironment() {
  if (typeof window === "undefined") return {};

  const width = window.innerWidth;
  if (width <= 760) {
    return { deviceCategory: "スマホ", viewportWidthRange: "760px以下" };
  }
  if (width <= 1024) {
    return { deviceCategory: "タブレット", viewportWidthRange: "761〜1024px" };
  }
  return { deviceCategory: "PC", viewportWidthRange: "1025px以上" };
}

function getResponseDurationSeconds(startedAt, completedAt) {
  const started = new Date(startedAt).getTime();
  const completed = new Date(completedAt).getTime();
  if (!Number.isFinite(started) || !Number.isFinite(completed)) return null;
  return Math.max(0, Math.round((completed - started) / 1000));
}

function redactObviousPersonalInformation(value) {
  return String(value ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "●●●")
    .replace(/(?:\+?81[-\s]?)?0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}/g, "●●●")
    .replace(/[一-龯ぁ-んァ-ヶーA-Za-z0-9]{2,30}(?:病院|医院|クリニック|診療所|介護施設|老人ホーム|学校)/g, "●●●");
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function createFallbackTopics() {
  return DEBATE_QUESTION_CATALOG.map((question) => ({
    slug: question.slug,
    title: question.title,
    answers: question.answerCount,
    leftLabel: question.choices.pro.label,
    rightLabel: question.choices.con.label,
    leftPercent: 50,
    rightPercent: 50,
    tags: question.fieldTags,
  })).sort((a, b) => b.answers - a.answers);
}

function createTopicsFromRows(questionRows = [], choiceRows = [], responseRows = []) {
  const catalogBySlug = new Map(DEBATE_QUESTION_CATALOG.map((question) => [question.slug, question]));
  const choicesByQuestionId = new Map();
  const countsByQuestionId = new Map();

  choiceRows.forEach((choice) => {
    const list = choicesByQuestionId.get(choice.question_id) ?? [];
    list.push(choice);
    choicesByQuestionId.set(choice.question_id, list);
  });

  responseRows.forEach((response) => {
    const counts = countsByQuestionId.get(response.question_id) ?? { pro: 0, con: 0, total: 0 };
    const side = response.choice_side === "con" ? "con" : "pro";
    counts[side] += 1;
    counts.total += 1;
    countsByQuestionId.set(response.question_id, counts);
  });

  return questionRows
    .map((question) => {
      const catalog = catalogBySlug.get(question.slug);
      const choices = choicesByQuestionId.get(question.id) ?? [];
      const proChoice = choices.find((choice) => choice.side === "pro");
      const conChoice = choices.find((choice) => choice.side === "con");
      const counts = countsByQuestionId.get(question.id) ?? { pro: 0, con: 0, total: 0 };
      const leftPercent = getPercent(counts.pro, counts.total);
      return {
        slug: question.slug,
        title: question.title || catalog?.title || "",
        answers: counts.total,
        leftLabel: proChoice?.label ?? catalog?.choices.pro.label ?? "",
        rightLabel: conChoice?.label ?? catalog?.choices.con.label ?? "",
        leftPercent,
        rightPercent: counts.total ? 100 - leftPercent : 0,
        tags: question.field_tags ?? catalog?.fieldTags ?? [],
      };
    })
    .sort((a, b) => b.answers - a.answers || a.title.localeCompare(b.title, "ja"));
}

function normalizeQuestion(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    fieldTags: row.field_tags ?? row.fieldTags ?? [],
    axisXLabel: row.axis_x_label ?? row.axisXLabel ?? "苦痛と尊厳",
    axisYLabel: row.axis_y_label ?? row.axisYLabel ?? "生命・技術への期待",
  };
}

function normalizeChoice(row) {
  return {
    id: row.id,
    questionId: row.question_id ?? row.questionId,
    side: row.side,
    label: row.label,
    description: row.description,
    color: row.color,
  };
}

function normalizeAnalysis(row) {
  if (!row) return null;
  const rawAnalysis = row.raw_analysis ?? row.rawAnalysis ?? {};
  return {
    summary: row.summary ?? "",
    reasonTags: row.reason_tags ?? row.reasonTags ?? [],
    axisScores: row.axis_scores ?? row.axisScores ?? {},
    valueAxes: row.value_axes ?? row.valueAxes ?? [],
    textMiningWords: rawAnalysis.textMiningWords ?? row.textMiningWords ?? [],
    rawAnalysis,
    sentiment: row.sentiment ?? "neutral",
    standoutScore: row.standout_score ?? row.standoutScore ?? 0,
    isInteresting: row.is_interesting ?? row.isInteresting ?? false,
  };
}

function normalizeResponse(row) {
  const analysisRow = Array.isArray(row.debate_response_analysis)
    ? row.debate_response_analysis[0]
    : row.analysis ?? row.debate_response_analysis;

  return {
    id: row.id,
    questionId: row.question_id ?? row.questionId,
    choiceId: row.choice_id ?? row.choiceId,
    choiceSide: row.choice_side ?? row.choiceSide,
    reason: row.reason ?? "",
    likes: Number(row.likes ?? 0),
    hmms: Number(row.hmms ?? 0),
    attributes: row.attributes ?? {},
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    analysis: normalizeAnalysis(analysisRow),
  };
}

function normalizeSnapshot(row) {
  if (!row) return null;
  const rawAnalysis = row.raw_analysis ?? row.rawAnalysis ?? {};
  return {
    id: row.id,
    totalCount: row.total_count ?? row.totalCount ?? 0,
    choiceCounts: row.choice_counts ?? row.choiceCounts ?? {},
    topTags: row.top_tags ?? row.topTags ?? [],
    tagDistributionBySide:
      row.tag_distribution_by_side ?? row.tagDistributionBySide ?? {},
    scatterSummary: row.scatter_summary ?? row.scatterSummary ?? {},
    neutralAnalysisText:
      row.neutral_analysis_text ?? row.neutralAnalysisText ?? "",
    standoutResponses: row.standout_responses ?? row.standoutResponses ?? [],
    rawAnalysis,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

function createLocalAnalysis(reason, existingTags) {
  const text = String(reason || "");
  const rules = [
    ["苦痛の回避", /苦痛|痛|つら|苦し|負担/],
    ["本人の意思", /本人|意思|望|選/],
    ["本人の尊厳", /尊厳|その人らし|人らし| dignity/i],
    ["生活の質", /生活|質|QOL|日常/],
    ["家族の判断時間", /家族|判断|時間|迷/],
    ["回復可能性", /回復|可能性|治る|助か/],
    ["医療技術への期待", /技術|医療|治療|できる限り/],
  ];
  const matched = rules
    .filter(([, pattern]) => pattern.test(text))
    .map(([tag]) => tag);
  const fallbackTag = existingTags[0] ?? "価値観の迷い";
  const tags = [...new Set(matched.length ? matched : [fallbackTag])]
    .map((tag) => existingTags.find((existing) => existing === tag) || tag)
    .slice(0, 6);

  return {
    summary: text.slice(0, 42) || "理由は未入力です",
    reasonTags: tags,
    axisScores: {
      painDignity: /尊厳|本人|その人らし/.test(text) ? 0.72 : /苦痛|痛/.test(text) ? -0.42 : 0,
      lifeTechnologyExpectation: /技術|回復|延命|生命/.test(text) ? 0.62 : /自然|無用|苦痛/.test(text) ? -0.58 : 0,
    },
    valueAxes: tags,
    textMiningWords: tags,
    rawAnalysis: { textMiningWords: tags },
    sentiment: "neutral",
    standoutScore: Math.min(10, Math.max(3, Math.round(text.length / 18))),
    isInteresting: text.length > 35,
  };
}

function getInvasivePalliativeScore(reason) {
  const text = String(reason || "");
  if (/緩和|苦痛|痛|つら|苦し|自然|無用|穏やか|看取り/.test(text)) return 0.72;
  if (/侵襲|延命|生命維持|できる限り|技術|回復|治療継続/.test(text)) return -0.72;
  return 0;
}

function createLocalSnapshot(responses) {
  const choiceCounts = responses.reduce(
    (counts, response) => {
      counts[response.choiceSide] = (counts[response.choiceSide] ?? 0) + 1;
      return counts;
    },
    { pro: 0, con: 0 },
  );
  const tagMap = new Map();

  responses.forEach((response) => {
    response.analysis?.reasonTags?.forEach((tag) => {
      const entry = tagMap.get(tag) ?? { tag, pro: 0, con: 0, total: 0 };
      entry[response.choiceSide] += 1;
      entry.total += 1;
      tagMap.set(tag, entry);
    });
  });

  const topTags = [...tagMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return {
    id: "local-snapshot",
    totalCount: responses.length,
    choiceCounts,
    topTags,
    tagDistributionBySide: Object.fromEntries(
      topTags.map((tag) => [tag.tag, { pro: tag.pro, con: tag.con, total: tag.total }]),
    ),
    scatterSummary: {
      points: responses
        .filter((response) => response.reason)
        .map((response) => ({
          responseId: response.id,
          side: response.choiceSide,
          likes: response.likes,
          x: response.analysis?.axisScores?.painDignity ?? 0,
          y: response.analysis?.axisScores?.lifeTechnologyExpectation ?? 0,
          tags: response.analysis?.reasonTags ?? [],
          summary: response.analysis?.summary ?? "",
          reason: response.reason,
        })),
    },
    neutralAnalysisText:
      "ローカル表示では、回答理由に含まれる語から簡易的にタグと分布を作っています。SupabaseとOpenAIを接続すると、既存タグを再利用しながら複数理由を抽出し、より中立的な全体分析を保存します。",
    standoutResponses: responses
      .filter((response) => response.reason)
      .sort((a, b) => (b.analysis?.standoutScore ?? 0) - (a.analysis?.standoutScore ?? 0))
      .slice(0, 4)
      .map((response) => ({
        responseId: response.id,
        side: response.choiceSide,
        reason: response.reason,
        why: response.analysis?.summary ?? "",
      })),
    createdAt: new Date().toISOString(),
  };
}

export function useDebateTopics() {
  const [topics, setTopics] = useState(createFallbackTopics);

  const refreshTopics = useCallback(async () => {
    if (!isSupabaseReady) {
      setTopics(createFallbackTopics());
      return;
    }

    try {
      const [{ data: questionRows, error: questionError }, { data: choiceRows, error: choiceError }, { data: responseRows, error: responseError }] =
        await Promise.all([
          supabaseClient
            .from("debate_questions")
            .select("*")
            .eq("is_active", true),
          supabaseClient
            .from("debate_choices")
            .select("question_id, side, label"),
          supabaseClient
            .from("debate_responses")
            .select("question_id, choice_side"),
        ]);

      if (questionError) throw questionError;
      if (choiceError) throw choiceError;
      if (responseError) throw responseError;

      setTopics(createTopicsFromRows(questionRows ?? [], choiceRows ?? [], responseRows ?? []));
    } catch (topicError) {
      console.error(topicError);
      setTopics(createFallbackTopics());
    }
  }, []);

  useEffect(() => {
    refreshTopics();
  }, [refreshTopics]);

  return topics;
}

async function readFunctionError(error) {
  const response = error?.context;
  if (!response) return error?.message || "Edge Function error";
  try {
    const contentType = response.headers?.get?.("content-type") || "";
    return contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    return error?.message || "Edge Function error";
  }
}

export function useDebateQuestion(questionSlug = DEFAULT_QUESTION_SLUG) {
  const selectedSlug = getCatalogQuestion(questionSlug).slug;
  const fallbackQuestion = useMemo(() => createFallbackQuestion(selectedSlug), [selectedSlug]);
  const fallbackChoices = useMemo(() => createFallbackChoices(selectedSlug), [selectedSlug]);
  const fallbackResponses = useMemo(
    () => (selectedSlug === DEFAULT_QUESTION_SLUG ? SAMPLE_RESPONSES : []),
    [selectedSlug],
  );
  const [question, setQuestion] = useState(fallbackQuestion);
  const [choices, setChoices] = useState(fallbackChoices);
  const [responses, setResponses] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [ownResponseId, setOwnResponseId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reactionHistory, setReactionHistory] = useState({});

  useEffect(() => {
    setReactionHistory(readReactionHistory());
  }, []);

  const showMessage = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 2600);
  }, []);

  const refreshLocal = useCallback(() => {
    const state = readLocalState(selectedSlug) ?? {
      ownResponseId: null,
      responses: fallbackResponses,
    };
    const localSnapshot = createLocalSnapshot(state.responses);
    setQuestion(fallbackQuestion);
    setChoices(fallbackChoices);
    setResponses(state.responses);
    setOwnResponseId(state.ownResponseId);
    setSnapshot(localSnapshot);
    writeLocalState(selectedSlug, state);
    return state;
  }, [fallbackChoices, fallbackQuestion, fallbackResponses, selectedSlug]);

  const refreshRemote = useCallback(async () => {
    const { data: questionRow, error: questionError } = await supabaseClient
      .from("debate_questions")
      .select("*")
      .eq("slug", selectedSlug)
      .single();

    if (questionError) throw questionError;
    const normalizedQuestion = normalizeQuestion(questionRow);

    const [{ data: choiceRows, error: choiceError }, { data: responseRows, error: responseError }, { data: snapshotRow, error: snapshotError }] =
      await Promise.all([
        supabaseClient
          .from("debate_choices")
          .select("*")
          .eq("question_id", normalizedQuestion.id)
          .order("sort_order", { ascending: true }),
        supabaseClient
          .from("debate_responses")
          .select("*, debate_response_analysis(*)")
          .eq("question_id", normalizedQuestion.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabaseClient
          .from("debate_question_analysis_snapshots")
          .select("*")
          .eq("question_id", normalizedQuestion.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (choiceError) throw choiceError;
    if (responseError) throw responseError;
    if (snapshotError) throw snapshotError;

    setQuestion(normalizedQuestion);
    setChoices((choiceRows ?? []).map(normalizeChoice));
    setResponses((responseRows ?? []).map(normalizeResponse));
    setSnapshot(normalizeSnapshot(snapshotRow));
  }, [selectedSlug]);

  useEffect(() => {
    setOwnResponseId(null);
    setStatus("idle");
    setMessage("");
    setError("");
  }, [selectedSlug]);

  const refresh = useCallback(async () => {
    setError("");
    if (!isSupabaseReady) {
      refreshLocal();
      return;
    }

    try {
      await refreshRemote();
    } catch (loadError) {
      console.error(loadError);
      setError("Supabaseから読み込めませんでした。ローカル表示に切り替えます。");
      refreshLocal();
    }
  }, [refreshLocal, refreshRemote]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectChoice = useCallback(
    async (choice) => {
      setStatus("saving-choice");
      setError("");
      try {
        if (!isSupabaseReady) {
          const state = readLocalState(selectedSlug) ?? { ownResponseId: null, responses: fallbackResponses };
          const response = {
            id: createId(),
            questionId: question.id,
            choiceId: choice.id,
            choiceSide: choice.side,
            reason: "",
            likes: 0,
            attributes: {
              questionVersion: QUESTION_VERSION,
              completionStatus: "choice-selected",
            },
            createdAt: new Date().toISOString(),
            analysis: null,
          };
          const nextState = {
            ownResponseId: response.id,
            responses: [response, ...state.responses],
          };
          writeLocalState(selectedSlug, nextState);
          refreshLocal();
          setStatus("idle");
          showMessage("選択を保存しました。");
          return response;
        }

        const remoteQuestion =
          question.id?.startsWith?.("local-")
            ? (
                await supabaseClient
                  .from("debate_questions")
                  .select("*")
                  .eq("slug", selectedSlug)
                  .single()
              ).data
            : { id: question.id };

        if (!remoteQuestion?.id) {
          throw new Error("Supabaseの質問データを取得できませんでした。");
        }

        const remoteChoice =
          choice.id?.startsWith?.("local-")
            ? (
                await supabaseClient
                  .from("debate_choices")
                  .select("*")
                  .eq("question_id", remoteQuestion.id)
                  .eq("side", choice.side)
                  .single()
              ).data
            : choice;

        if (!remoteChoice?.id) {
          throw new Error("Supabaseの選択肢データを取得できませんでした。");
        }

        const { data, error: insertError } = await supabaseClient
          .from("debate_responses")
          .insert({
            question_id: remoteQuestion.id,
            choice_id: remoteChoice.id,
            choice_side: choice.side,
            attributes: {
              questionVersion: QUESTION_VERSION,
              completionStatus: "choice-selected",
            },
          })
          .select("*")
          .single();

        if (insertError) throw insertError;
        const response = normalizeResponse(data);
        setOwnResponseId(response.id);
        await refreshRemote();
        setStatus("idle");
        showMessage("選択を保存しました。");
        return response;
      } catch (saveError) {
        console.error(saveError);
        setStatus("idle");
        setError(saveError.message || "選択の保存に失敗しました。");
        return null;
      }
    },
    [fallbackResponses, question.id, refreshLocal, refreshRemote, selectedSlug, showMessage],
  );

  const saveAttributes = useCallback(
    async (responseId, attributes) => {
      if (!responseId) return null;
      setStatus("saving-attributes");
      setError("");

      try {
        const currentResponse = responses.find((response) => response.id === responseId);
        const nextAttributes = {
          ...(currentResponse?.attributes ?? {}),
          ...attributes,
          questionVersion: currentResponse?.attributes?.questionVersion ?? QUESTION_VERSION,
          completionStatus: "attributes-completed",
        };

        if (!isSupabaseReady) {
          const state = readLocalState(selectedSlug) ?? { ownResponseId: responseId, responses: fallbackResponses };
          const responses = state.responses.map((response) =>
            response.id === responseId ? { ...response, attributes: nextAttributes } : response,
          );
          writeLocalState(selectedSlug, { ...state, responses });
          refreshLocal();
          setStatus("idle");
          showMessage("属性情報を保存しました。");
          return true;
        }

        const { error: updateError } = await supabaseClient
          .from("debate_responses")
          .update({ attributes: nextAttributes })
          .eq("id", responseId);

        if (updateError) throw updateError;
        await refreshRemote();
        setStatus("idle");
        showMessage("属性情報を保存しました。");
        return true;
      } catch (saveError) {
        console.error(saveError);
        setStatus("idle");
        setError(saveError.message || "属性情報の保存に失敗しました。");
        return false;
      }
    },
    [fallbackResponses, refreshLocal, refreshRemote, responses, selectedSlug, showMessage],
  );

  const saveReasonAndAnalyze = useCallback(
    async (responseId, reason) => {
      if (!responseId) return null;
      const normalizedReason = reason.trim();
      const hasReason = Boolean(normalizedReason);
      setStatus(hasReason ? "analyzing" : "saving-reason");
      setError("");
      const answeredAt = new Date().toISOString();
      const displayEnvironment = getDisplayEnvironment();

      try {
        if (!isSupabaseReady) {
          const state = readLocalState(selectedSlug) ?? { ownResponseId: responseId, responses: fallbackResponses };
          if (!hasReason) {
            const responses = state.responses.map((response) =>
              response.id === responseId
                ? {
                    ...response,
                    reason: "",
                    analysis: null,
                    attributes: {
                      ...(response.attributes ?? {}),
                      answeredAt,
                      questionVersion: response.attributes?.questionVersion ?? QUESTION_VERSION,
                      completionStatus: "completed",
                      responseDurationSeconds: getResponseDurationSeconds(response.createdAt, answeredAt),
                      reasonAnswered: false,
                      ...displayEnvironment,
                    },
                  }
                : response,
            );
            writeLocalState(selectedSlug, { ...state, responses });
            refreshLocal();
            setStatus("idle");
            showMessage("理由は未回答として保存しました。");
            return true;
          }
          const seedTags = getCatalogQuestion(question.slug).reasonTagSeeds ?? [];
          const anonymizedReason = redactObviousPersonalInformation(normalizedReason);
          const existingTags = [
            ...seedTags,
            ...state.responses.flatMap((response) => response.analysis?.reasonTags ?? []),
          ];
          const localAnalysis = createLocalAnalysis(anonymizedReason, existingTags);
          localAnalysis.axisScores = {
            ...localAnalysis.axisScores,
            painDignity: getInvasivePalliativeScore(anonymizedReason),
          };
          const responses = state.responses.map((response) =>
            response.id === responseId
              ? (() => {
                  const responseDurationSeconds = getResponseDurationSeconds(response.createdAt, answeredAt);
                  return {
                    ...response,
                    reason: anonymizedReason,
                    attributes: {
                      ...(response.attributes ?? {}),
                      answeredAt,
                      questionVersion: response.attributes?.questionVersion ?? QUESTION_VERSION,
                      completionStatus: "completed",
                      responseDurationSeconds,
                      reasonAnswered: true,
                      reasonAnonymized: anonymizedReason !== normalizedReason,
                      reasonAnonymizedAt: answeredAt,
                      ...displayEnvironment,
                    },
                    analysis: localAnalysis,
                  };
                })()
              : response,
          );
          writeLocalState(selectedSlug, { ...state, responses });
          refreshLocal();
          setStatus("idle");
          showMessage("理由を保存し、簡易解析しました。");
          return true;
        }

        const currentResponse = responses.find((response) => response.id === responseId);
        const responseDurationSeconds = getResponseDurationSeconds(currentResponse?.createdAt, answeredAt);
        const { error: updateError } = await supabaseClient
          .from("debate_responses")
          .update({
            reason: normalizedReason,
            attributes: {
              ...(currentResponse?.attributes ?? {}),
              answeredAt,
              questionVersion: currentResponse?.attributes?.questionVersion ?? QUESTION_VERSION,
              completionStatus: "completed",
              responseDurationSeconds,
              reasonAnswered: hasReason,
              ...displayEnvironment,
            },
          })
          .eq("id", responseId);

        if (updateError) throw updateError;

        if (!hasReason) {
          await refreshRemote();
          setStatus("idle");
          showMessage("理由は未回答として保存しました。");
          return true;
        }

        const { error: analyzeError } = await supabaseClient.functions.invoke(
          "analyze-debate-response",
          { body: { responseId } },
        );

        if (analyzeError) {
          const details = await readFunctionError(analyzeError);
          throw new Error(
            `個別AI解析に失敗しました: ${
              typeof details === "string" ? details : JSON.stringify(details)
            }`,
          );
        }

        const { data: questionAnalysisResult, error: questionAnalyzeError } = await supabaseClient.functions.invoke(
          "analyze-debate-question",
          { body: { questionId: question.id } },
        );

        if (questionAnalyzeError) {
          console.warn(await readFunctionError(questionAnalyzeError));
        }

        await refreshRemote();
        setStatus("idle");
        showMessage(
          questionAnalysisResult?.skipped
            ? `理由を保存しました。全体AI解析は${questionAnalysisResult.nextAnalysisAt}件到達時に更新します。`
            : "理由を保存し、AI解析を更新しました。",
        );
        return true;
      } catch (saveError) {
        console.error(saveError);
        await refresh().catch(() => {});
        setStatus("idle");
        setError(saveError.message || "理由の保存または解析に失敗しました。");
        return false;
      }
    },
    [fallbackResponses, question.id, question.slug, refresh, refreshLocal, refreshRemote, responses, selectedSlug, showMessage],
  );

  const reactToResponse = useCallback(
    async (responseId, reaction) => {
      if (!responseId) return;
      if (reaction !== "naruhodo" && reaction !== "hmm") return;
      if (!ownResponseId) {
        showMessage("先にこの質問へ回答するとリアクションできます。");
        return;
      }
      if (responseId === ownResponseId) {
        showMessage("自分の意見にはリアクションできません。");
        return;
      }
      setError("");
      const reactionId = `${selectedSlug}:${responseId}`;
      const currentHistory = readReactionHistory();
      if (currentHistory[reactionId]) {
        showMessage("この意見にはリアクション済みです。");
        return;
      }

      const countKey = reaction === "naruhodo" ? "likes" : "hmms";
      const nextHistory = { ...currentHistory, [reactionId]: reaction };
      writeReactionHistory(nextHistory);
      setReactionHistory(nextHistory);

      if (!isSupabaseReady) {
        const state = readLocalState(selectedSlug) ?? { ownResponseId: null, responses: fallbackResponses };
        const actor = state.responses.find((response) => response.id === ownResponseId);
        const target = state.responses.find((response) => response.id === responseId);
        const responses = state.responses.map((response) =>
          response.id === responseId
            ? { ...response, [countKey]: Number(response[countKey] ?? 0) + 1 }
            : response,
        );
        const reactionEvents = [
          ...(state.reactionEvents ?? []),
          {
            questionId: question.id,
            actorResponseId: ownResponseId,
            targetResponseId: responseId,
            actorSide: actor?.choiceSide,
            targetSide: target?.choiceSide,
            relation: actor?.choiceSide === target?.choiceSide ? "same" : "opposite",
            reaction,
            questionVersion: actor?.attributes?.questionVersion ?? QUESTION_VERSION,
            occurredAt: new Date().toISOString(),
          },
        ];
        writeLocalState(selectedSlug, { ...state, responses, reactionEvents });
        refreshLocal();
        return;
      }

      setResponses((current) =>
        current.map((response) =>
          response.id === responseId
            ? { ...response, [countKey]: Number(response[countKey] ?? 0) + 1 }
            : response,
        ),
      );

      const { error: likeError } = await supabaseClient.functions.invoke(
        "increment-debate-response-reaction",
        {
          body: {
            responseId,
            actorResponseId: ownResponseId,
            reaction,
            questionVersion:
              responses.find((response) => response.id === ownResponseId)?.attributes?.questionVersion ?? QUESTION_VERSION,
          },
        },
      );

      if (likeError) {
        const rolledBackHistory = readReactionHistory();
        delete rolledBackHistory[reactionId];
        writeReactionHistory(rolledBackHistory);
        setReactionHistory({ ...rolledBackHistory });
        const details = await readFunctionError(likeError);
        setError(
          `いいねの更新に失敗しました: ${
            typeof details === "string" ? details : JSON.stringify(details)
          }`,
        );
        await refreshRemote().catch(() => {});
      }
    },
    [fallbackResponses, ownResponseId, question.id, refreshLocal, refreshRemote, responses, selectedSlug, showMessage],
  );

  const saveFinalEvaluation = useCallback(
    async (responseId, evaluation) => {
      if (!responseId || !evaluation || !Object.keys(evaluation).length) return false;
      setStatus("saving-evaluation");
      setError("");

      const evaluatedAt = new Date().toISOString();
      const currentResponse = responses.find((response) => response.id === responseId);
      const evaluationFields = Object.fromEntries(
        Object.entries(evaluation).filter(([, value]) => value !== undefined),
      );
      const nextAttributes = {
        ...(currentResponse?.attributes ?? {}),
        ...evaluationFields,
        evaluationAnsweredAt: evaluatedAt,
      };
      if (Object.hasOwn(evaluationFields, "pageFeedback")) {
        nextAttributes.pageFeedback = String(evaluationFields.pageFeedback ?? "").trim();
      }
      nextAttributes.completionStatus = nextAttributes.pageHelpful && nextAttributes.finalOpinionChange
        ? "evaluation-completed"
        : "evaluation-in-progress";

      try {
        if (!isSupabaseReady) {
          const state = readLocalState(selectedSlug) ?? { ownResponseId: responseId, responses: fallbackResponses };
          const nextResponses = state.responses.map((response) =>
            response.id === responseId ? { ...response, attributes: nextAttributes } : response,
          );
          writeLocalState(selectedSlug, { ...state, responses: nextResponses });
          refreshLocal();
        } else {
          const { error: updateError } = await supabaseClient
            .from("debate_responses")
            .update({ attributes: nextAttributes })
            .eq("id", responseId);
          if (updateError) throw updateError;
          await refreshRemote();
        }

        setStatus("idle");
        showMessage("回答ありがとうございました。");
        return true;
      } catch (saveError) {
        console.error(saveError);
        setStatus("idle");
        setError(saveError.message || "最終評価の保存に失敗しました。");
        return false;
      }
    },
    [fallbackResponses, refreshLocal, refreshRemote, responses, selectedSlug, showMessage],
  );

  const selectedResponse = useMemo(
    () => responses.find((response) => response.id === ownResponseId) ?? null,
    [ownResponseId, responses],
  );

  const counts = useMemo(() => {
    return responses.reduce(
      (totals, response) => {
        totals[response.choiceSide] = (totals[response.choiceSide] ?? 0) + 1;
        totals.total += 1;
        return totals;
      },
      { pro: 0, con: 0, total: 0 },
    );
  }, [responses]);

  return {
    question,
    choices,
    responses,
    snapshot,
    ownResponseId,
    selectedResponse,
    counts,
    status,
    message,
    error,
    isSupabaseReady,
    selectChoice,
    saveAttributes,
    saveReasonAndAnalyze,
    reactToResponse,
    saveFinalEvaluation,
    reactionHistory,
    refresh,
  };
}
