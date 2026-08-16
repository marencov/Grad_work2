import SiteHeader from "@/components/SiteHeader";
import styles from "@/components/InformationPage.module.css";

export default function InformationPage({ eyebrow, title, description, children }) {
  return (
    <main className={styles.page}>
      <SiteHeader />
      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className={styles.content}>{children}</div>
        <a className={styles.backLink} href="/CrossTalk/#topics">
          テーマ一覧へ戻る
        </a>
      </div>
    </main>
  );
}

export function InfoSection({ title, children }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function FaqItem({ question, children }) {
  return (
    <details className={styles.faqItem}>
      <summary>{question}</summary>
      <div>{children}</div>
    </details>
  );
}
