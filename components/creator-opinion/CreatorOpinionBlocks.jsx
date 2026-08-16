import styles from "./CreatorOpinionBlocks.module.css";

function Icon({ name }) {
  const paths = {
    alert: <><path d="M12 8v5" /><path d="M12 17h.01" /><path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>,
    question: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-1 .6-1.5 1.1-1.5 2.2" /><path d="M12 17h.01" /></>,
    idea: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.2 14 16 14 17h-4c0-1-.5-1.8-1.5-2.5Z" /></>,
    balance: <><path d="M4 8h16" /><path d="m7 5-3 3 3 3" /><path d="M20 16H4" /><path d="m17 13 3 3-3 3" /></>,
    ambulance: <><path d="M5 7h10v10H5z" /><path d="M15 11h3l2 3v3h-5" /><circle cx="8" cy="18" r="2" /><circle cx="17" cy="18" r="2" /><path d="M10 9v6M7 12h6" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.idea}</svg>;
}

export function OpinionArticle({ children }) {
  return <article className={styles.article}><p className={styles.articleLabel}>制作者の意見</p>{children}</article>;
}

export function OpinionBadge({ children, icon = "idea" }) {
  return <div className={styles.badge}><span className={styles.badgeIcon}><Icon name={icon} /></span><span>{children}</span></div>;
}

export function OpinionLead({ children }) {
  return <div className={styles.lead}>{children}</div>;
}

export function ExplanationCard({ title, icon = "question", children }) {
  return <aside className={styles.card}><span className={styles.cardIcon}><Icon name={icon} /></span><div><h3>{title}</h3><div>{children}</div></div></aside>;
}

export function ConflictPoint({ leftTitle, leftText, rightTitle, rightText }) {
  return <div className={styles.conflictGrid}><div className={styles.conflict}><h3>{leftTitle}</h3><p>{leftText}</p></div><span className={styles.versus}>VS</span><div className={styles.conflict}><h3>{rightTitle}</h3><p>{rightText}</p></div></div>;
}

export function Callout({ children }) {
  return <aside className={styles.callout}>{children}</aside>;
}

export function Figure({ src, alt, caption }) {
  return <figure className={styles.figure}><img src={src} alt={alt} />{caption && <figcaption>{caption}</figcaption>}</figure>;
}

export function SourceList({ items = [] }) {
  return <footer className={styles.sources}><h3>参考資料</h3><ul>{items.map((item) => <li key={item.url || item.title}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a> : item.title}{item.organization ? ` — ${item.organization}` : ""}</li>)}</ul></footer>;
}
