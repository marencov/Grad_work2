// This file keeps temporary prototype data away from the UI components.
// React beginners note:
// Components should usually receive data through props instead of hard-coding
// every label. Later, these arrays can be replaced with Supabase/API results.

export const topicCards = [
  {
    title: "ワクチン接種は\n義務化すべき？",
    category: "医療",
    answers: "9,215",
    leftLabel: "義務化すべき",
    rightLabel: "任意にすべき",
    leftPercent: 48,
    rightPercent: 52,
    tags: ["医療", "社会", "投票"],
  },
  {
    title: "延命治療は\nどこまで行うべき？",
    category: "医療",
    answers: "22,194",
    leftLabel: "積極的に行うべき",
    rightLabel: "自然な経過を尊重すべき",
    leftPercent: 56,
    rightPercent: 44,
    tags: ["医療", "家族", "倫理"],
  },
  {
    title: "医療AIの判断は\nどこまで信じる？",
    category: "テクノロジー",
    answers: "8,412",
    leftLabel: "活用すべき",
    rightLabel: "慎重であるべき",
    leftPercent: 49,
    rightPercent: 51,
    tags: ["AI", "医療", "未来"],
  },
];

export const categoryCards = [
  { label: "医療費の負担", subtitle: "公平性と負担のあり方", count: "8,317" },
  { label: "終末期医療", subtitle: "本人・家族・医療の対話", count: "6,208" },
  { label: "予防接種", subtitle: "個人の自由と社会の安全", count: "9,215" },
  { label: "医療AI", subtitle: "技術と人の判断", count: "4,892" },
  { label: "介護と家族", subtitle: "支える人の現実", count: "5,604" },
  { label: "地域医療", subtitle: "住む場所で変わる安心", count: "3,771" },
];

export const ageResults = [
  { ageGroup: "10代", leftPercent: 45, rightPercent: 55 },
  { ageGroup: "20代", leftPercent: 48, rightPercent: 52 },
  { ageGroup: "30代", leftPercent: 51, rightPercent: 49 },
  { ageGroup: "40代", leftPercent: 56, rightPercent: 44 },
  { ageGroup: "50代", leftPercent: 58, rightPercent: 42 },
  { ageGroup: "60代", leftPercent: 63, rightPercent: 37 },
  { ageGroup: "70代", leftPercent: 61, rightPercent: 39 },
  { ageGroup: "80代", leftPercent: 59, rightPercent: 41 },
  { ageGroup: "90歳以上", leftPercent: 54, rightPercent: 46 },
];

export const highlightedOpinions = {
  left: [
    {
      reason: "家族が異変に気づけないよう、できることはすべてやるべきだと思う。",
      meta: "40代・男性・医師",
      tags: ["家族", "責任"],
      likes: 128,
    },
    {
      reason: "医療の進歩を信じたい。諦めるのはまだ早い、と思ってしまう。",
      meta: "30代・女性・会社員",
      tags: ["医療", "希望"],
      likes: 96,
    },
    {
      reason: "子どもが小さいうちは、可能性を信じたい。",
      meta: "30代・女性・主婦",
      tags: ["子育て", "未来"],
      likes: 84,
    },
  ],
  right: [
    {
      reason: "本人が望んでいないなら、無理に延ばすべきではないと思う。",
      meta: "50代・男性・会社員",
      tags: ["自然な経過", "尊厳"],
      likes: 142,
    },
    {
      reason: "苦しみを長引かせるより、自然に任せたい。",
      meta: "40代・女性・看護師",
      tags: ["自然", "苦痛"],
      likes: 118,
    },
    {
      reason: "尊厳を保つことが、その人らしさだと思う。",
      meta: "60代・女性・主婦",
      tags: ["尊厳", "人生観"],
      likes: 103,
    },
  ],
};

export const scatterPoints = [
  { x: 154, y: 108, size: 22, side: "left" },
  { x: 198, y: 144, size: 14, side: "left" },
  { x: 236, y: 122, size: 18, side: "left" },
  { x: 182, y: 222, size: 16, side: "left" },
  { x: 258, y: 208, size: 12, side: "left" },
  { x: 396, y: 104, size: 20, side: "right" },
  { x: 438, y: 144, size: 16, side: "right" },
  { x: 474, y: 216, size: 22, side: "right" },
  { x: 384, y: 238, size: 14, side: "right" },
  { x: 332, y: 268, size: 18, side: "right" },
];

export const analysisPoints = [
  {
    title: "年代で見ると、意見の重心が少し変わります。",
    body: "20代は「自然な経過を尊重すべき」が多く、年齢が上がるほど「積極的に行うべき」の割合が増える傾向があります。",
  },
  {
    title: "理由のタグでは、尊厳・家族・苦痛が大きな論点です。",
    body: "賛成側は「家族」「医療への期待」、反対側は「自然な経過」「尊厳」「苦痛」に関連する理由が集まりやすくなっています。",
  },
];
