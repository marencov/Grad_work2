import { getChoiceLabel } from "@/data/choices";
import styles from "@/components/Slides.module.css";

export default function ReasonSlide({
  selectedChoice,
  reason,
  status,
  onReasonChange,
  onSubmit,
  onBack,
}) {
  const isSubmitting =
    status === "submitting" || status === "scoring" || status === "analyzing";
  const canSubmit = Boolean(selectedChoice) && reason.trim().length > 0 && !isSubmitting;

  return (
    <div className={styles.reasonContent}>
      <p className={styles.kicker}>Reason</p>
      <h2 className={styles.reasonHeading}>理由も聞かせて</h2>

      <form className={styles.reasonForm} onSubmit={onSubmit}>
        <p className={styles.selectedText}>
          選択中: {selectedChoice ? getChoiceLabel(selectedChoice) : "まだ選ばれていません"}
        </p>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="なぜそう思った？ 直感でも、体験談でも、ふざけた本音でもOKです。"
        />

        <div className={styles.formActions}>
          <button className={styles.secondaryButton} type="button" onClick={onBack}>
            選び直す
          </button>
          <button className={styles.submitButton} type="submit" disabled={!canSubmit}>
            {status === "submitting"
              ? "保存中..."
              : status === "scoring"
                ? "AI採点中..."
              : status === "analyzing"
                ? "AI実況中..."
                : "回答を送る"}
          </button>
        </div>
      </form>
    </div>
  );
}
