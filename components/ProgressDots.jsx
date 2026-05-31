import styles from "@/components/SurveyExperience.module.css";

const labels = {
  title: "タイトル",
  question: "問い",
  choice: "選択",
  reason: "理由",
  results: "結果",
};

export default function ProgressDots({ steps, activeStep, onSelect }) {
  return (
    <nav className={styles.progress} aria-label="ページ内の進行状況">
      {steps.map((step) => (
        <button
          key={step}
          type="button"
          className={`${styles.progressDot} ${
            activeStep === step ? styles.activeProgressDot : ""
          }`}
          aria-label={`${labels[step]}へ移動`}
          onClick={() => onSelect(step)}
        />
      ))}
    </nav>
  );
}
