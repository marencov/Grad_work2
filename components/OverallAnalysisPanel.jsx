import { getChoiceLabel } from "@/data/choices";
import styles from "@/components/Results.module.css";

function formatCounts(choiceCounts = {}) {
  const entries = Object.entries(choiceCounts);
  if (entries.length === 0) return "まだ集計待ち";

  return entries
    .map(([choiceId, count]) => `${getChoiceLabel(choiceId)} ${count}票`)
    .join(" / ");
}

function ListBlock({ title, items, fallback }) {
  return (
    <section className={styles.analysisBlock}>
      <h3>{title}</h3>
      {items?.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>
              {typeof item === "string" ? item : item.reason || item.why || JSON.stringify(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p>{fallback}</p>
      )}
    </section>
  );
}

export default function OverallAnalysisPanel({
  analysis,
  isVisible,
  isSupabaseReady,
  status,
  error,
}) {
  const isAnalyzing = status === "analyzing";

  return (
    <aside
      className={`${styles.overallPanel} ${isVisible ? styles.visiblePanel : ""}`}
      aria-hidden={!isVisible}
    >
      <div className={styles.overallHead}>
        <p className={styles.analysisTitle}>AI実況席</p>
        <p className={styles.overallMeta}>
          {isAnalyzing
            ? "ただいま全体を解析中..."
            : analysis
              ? `${analysis.totalCount}件 / ${formatCounts(analysis.choiceCounts)}`
              : "解析結果待ち"}
        </p>
      </div>

      <section className={styles.overviewBlock}>
        <h3>全体の傾向と考察</h3>
        <p>
          {error ||
            analysis?.overview ||
            (isSupabaseReady
              ? "回答が入ると、ここにAI実況が表示されます。"
              : "Supabase未接続のため、いまはブラウザ内の簡易解析で待機中です。")}
        </p>
      </section>

      <div className={styles.analysisGrid}>
        <ListBlock
          title="考察メモ"
          items={analysis?.insights}
          fallback="まだAIからのメモはありません。"
        />
        <ListBlock
          title="光る意見"
          items={analysis?.standoutOpinions}
          fallback="具体的な理由が増えるほど、ここが賑やかになります。"
        />
        <ListBlock
          title="面白い意見"
          items={analysis?.funnyOpinions}
          fallback="笑える一言をAIが探しています。"
        />
      </div>
    </aside>
  );
}
