import OverallAnalysisPanel from "@/components/OverallAnalysisPanel";
import ResultChart from "@/components/ResultChart";
import styles from "@/components/Results.module.css";

export default function ResultsSlide({
  answers,
  ownAnswerId,
  answerScores,
  overallAnalysis,
  isAnalysisVisible,
  isSupabaseReady,
  status,
  error,
  onAnswerLike,
}) {
  return (
    <>
      <header className={styles.resultsHead}>
        <p className={styles.kicker}>Live Result</p>
        <h2>選択の分布</h2>
        <p className={styles.hint}>
          {isAnalysisVisible
            ? "AI実況と注目コメントを重ねて表示中"
            : "もう少し下へスクロールすると、同じグラフにAI解析が重なります"}
        </p>
      </header>

      <div className={styles.chartWrap}>
        <ResultChart
          answers={answers}
          ownAnswerId={ownAnswerId}
          answerScores={answerScores}
          isAnalysisVisible={isAnalysisVisible}
          onAnswerLike={onAnswerLike}
        />
      </div>

      <OverallAnalysisPanel
        analysis={overallAnalysis}
        isVisible={isAnalysisVisible}
        isSupabaseReady={isSupabaseReady}
        status={status}
        error={error}
      />
    </>
  );
}
