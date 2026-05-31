import styles from "@/components/SurveyExperience.module.css";

export default function Toast({ message, tone = "success" }) {
  if (!message) return null;

  return (
    <div className={`${styles.toast} ${tone === "error" ? styles.errorToast : ""}`}>
      {message}
    </div>
  );
}
