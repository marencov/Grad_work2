import styles from "@/components/Slides.module.css";

export default function QuestionSlide() {
  return (
    <div>
      <p className={styles.kicker}>Question</p>
      <h2 className={styles.heroTitle}>さぁどっち？</h2>
    </div>
  );
}
