import styles from "@/components/Slides.module.css";

export default function ChoiceSlide({ choices, selectedChoice, onSelect }) {
  return (
    <div className={styles.choiceContent}>
      <p className={styles.kicker}>Choose one</p>
      <h2 className={styles.choiceHeading}>選択</h2>

      <div className={styles.choiceGrid}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={`${styles.choiceCard} ${
              selectedChoice === choice.id ? styles.selectedChoiceCard : ""
            }`}
            onClick={() => onSelect(choice.id)}
          >
            <span>{choice.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
