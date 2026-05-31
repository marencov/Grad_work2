import styles from "@/components/SurveyExperience.module.css";

export default function SlideSection({
  id,
  children,
  className = "",
  registerSection,
  isAnalysisVisible = false,
  onWheel,
}) {
  return (
    <section
      id={id}
      ref={registerSection(id)}
      data-step={id}
      className={`${styles.slide} ${className} ${
        isAnalysisVisible ? styles.analysisVisible : ""
      }`}
      onWheel={onWheel}
    >
      {children}
    </section>
  );
}
