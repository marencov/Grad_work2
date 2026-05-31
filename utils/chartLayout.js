import { scaleLinear } from "d3";

export const CHART_VIEW_BOX = {
  width: 900,
  height: 520,
  top: 70,
  bottom: 420,
};

const opacityScale = scaleLinear().domain([0, 10]).range([0.35, 1]).clamp(true);
const radiusScale = scaleLinear().domain([0, 20]).range([9, 24]).clamp(true);

const CLUSTER_CENTERS = {
  poopCurry: { x: 270, y: 255 },
  curryPoop: { x: 630, y: 255 },
};

export function getScoreStyle(score = 0) {
  return {
    opacity: opacityScale(score),
    radius: radiusScale(score),
  };
}

function getPackedOffset(index) {
  if (index === 0) {
    return { x: 0, y: 0 };
  }

  // 厳密な物理シミュレーションではなく、軽量な「円形パッキング風」配置です。
  // スコア順に並べたあと、中心から外側へ黄金角で点を散らすので、
  // 高スコアほど中心、低スコアほど外側に見える構成になります。
  const ring = Math.ceil(Math.sqrt(index));
  const angle = index * 2.399963229728653;
  const distance = Math.min(150, ring * 28);

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  };
}

export function createPointLayout(answers) {
  const groupedAnswers = answers.reduce((groups, answer) => {
    if (!groups[answer.choice]) {
      groups[answer.choice] = [];
    }
    groups[answer.choice].push(answer);
    return groups;
  }, {});

  return Object.entries(groupedAnswers).flatMap(([choice, choiceAnswers]) => {
    const center = CLUSTER_CENTERS[choice] || { x: CHART_VIEW_BOX.width / 2, y: 255 };

    return [...choiceAnswers]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((answer, index) => {
        const offset = getPackedOffset(index);
        return {
          ...answer,
          x: center.x + offset.x,
          y: center.y + offset.y,
        };
      });
  });
}
