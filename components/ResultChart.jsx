"use client";

import { useState } from "react";
import { CHOICES, getChoiceLabel } from "@/data/choices";
import { createPointLayout, getScoreStyle } from "@/utils/chartLayout";
import styles from "@/components/Chart.module.css";

function getPointScore(answer, answerScores) {
  return answerScores.get(answer.id) ?? 0;
}

function ResultTooltip({ tooltip }) {
  if (!tooltip) return null;

  return (
    <div
      className={styles.tooltip}
      style={{
        left: tooltip.x,
        top: tooltip.y,
      }}
    >
      <p className={styles.tooltipChoice}>{getChoiceLabel(tooltip.answer.choice)}</p>
      <p className={styles.tooltipReason}>{tooltip.answer.reason}</p>
    </div>
  );
}

function getTooltipPosition(event) {
  const tooltipWidth = 440;
  const tooltipHeight = 190;
  const padding = 16;
  const x = Math.min(event.clientX + padding, window.innerWidth - tooltipWidth);
  const y = Math.min(event.clientY + padding, window.innerHeight - tooltipHeight);

  return {
    x: Math.max(padding, x),
    y: Math.max(padding, y),
  };
}

export default function ResultChart({
  answers,
  ownAnswerId,
  answerScores,
  isAnalysisVisible,
  onAnswerLike,
}) {
  const [tooltip, setTooltip] = useState(null);

  // 先に回答へscoreを合体させてから、円形パッキング風レイアウトを作ります。
  // これにより、レイアウト関数側では「高スコアを中心へ置く」判断ができます。
  const scoredAnswers = answers.map((answer) => ({
    ...answer,
    score: getPointScore(answer, answerScores),
  }));

  const points = createPointLayout(scoredAnswers);
  const pointsForDrawing = [...points].sort((a, b) => (a.score || 0) - (b.score || 0));
  const counts = answers.reduce((totals, answer) => {
    totals[answer.choice] = (totals[answer.choice] || 0) + 1;
    return totals;
  }, {});

  const showTooltip = (event, answer) => {
    const position = getTooltipPosition(event);
    setTooltip({
      answer,
      x: position.x,
      y: position.y,
    });
  };

  const moveTooltip = (event) => {
    setTooltip((currentTooltip) => {
      if (!currentTooltip) return null;
      const position = getTooltipPosition(event);
      return {
        ...currentTooltip,
        x: position.x,
        y: position.y,
      };
    });
  };

  return (
    <div className={styles.chartShell}>
      <svg
        className={`${styles.scatterChart} ${
          isAnalysisVisible ? styles.analysisChart : ""
        }`}
        viewBox="0 0 900 520"
        role="img"
        aria-label="アンケート回答の選択分布グラフ"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <radialGradient id="poopCurryGradient" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#ffb0aa" />
            <stop offset="35%" stopColor="#ff2f21" />
            <stop offset="100%" stopColor="#b90f07" />
          </radialGradient>
          <radialGradient id="curryPoopGradient" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#92d8ff" />
            <stop offset="38%" stopColor="#0094ff" />
            <stop offset="100%" stopColor="#0050bc" />
          </radialGradient>
          <filter id="softPointShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="5"
              stdDeviation="3"
              floodColor="#111111"
              floodOpacity="0.24"
            />
          </filter>
        </defs>

        <line className={styles.chartAxis} x1="120" y1="420" x2="780" y2="420" />
        <line className={styles.chartAxis} x1="120" y1="70" x2="120" y2="420" />
        {[0, 1, 2, 3].map((line) => (
          <line
            key={line}
            className={styles.chartGuide}
            x1="120"
            y1={350 - line * 70}
            x2="780"
            y2={350 - line * 70}
          />
        ))}

        <text className={styles.chartTitle} x="450" y="42" textAnchor="middle">
          回答のまとまり
        </text>

        {CHOICES.map((choice, index) => {
          const x = index === 0 ? 270 : 630;
          return (
            <g key={choice.id}>
              <text className={styles.chartLabel} x={x} y="466" textAnchor="middle">
                {getChoiceLabel(choice.id)}
              </text>
              <text className={styles.chartCount} x={x} y="498" textAnchor="middle">
                {counts[choice.id] || 0}票
              </text>
            </g>
          );
        })}

        {pointsForDrawing.map((point) => {
          const scoreStyle = getScoreStyle(point.score);
          return (
            <circle
              key={point.id}
              className={`${styles.point} ${
                point.choice === "poopCurry" ? styles.poopCurryPoint : styles.curryPoopPoint
              } ${point.id === ownAnswerId ? styles.ownPoint : ""}`}
              cx={point.x}
              cy={point.y}
              r={scoreStyle.radius}
              opacity={scoreStyle.opacity}
              filter="url(#softPointShadow)"
              tabIndex="0"
              aria-label={`${getChoiceLabel(point.choice)}: ${point.reason}`}
              onMouseEnter={(event) => showTooltip(event, point)}
              onMouseMove={moveTooltip}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onAnswerLike?.(point.id)}
              onFocus={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setTooltip({
                  answer: point,
                  x: rect.left + rect.width + 16,
                  y: rect.top + 16,
                });
              }}
              onBlur={() => setTooltip(null)}
            />
          );
        })}
      </svg>

      <ResultTooltip tooltip={tooltip} />
    </div>
  );
}
