import styles from "@/components/Slides.module.css";

export default function TitleSlide({ onStart }) {
  return (
    <div>
      <p className={styles.kicker}>Digital Graphic Recording Survey</p>
      <h1 className={styles.heroTitle}>究極の選択</h1>
      <button className={styles.iconTextButton} type="button" onClick={onStart}>
        はじめる
      </button>
    </div>
  );
}
