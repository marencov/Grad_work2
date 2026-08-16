import styles from "@/components/SiteHeader.module.css";

const BASE_PATH = "/CrossTalk";

export default function SiteHeader() {
  return (
    <header className={styles.topBar}>
      <a className={styles.brand} href={`${BASE_PATH}/`} aria-label="CrossTalk トップページ">
        <img
          src={`${BASE_PATH}/images/CrossTalkLogo.svg`}
          alt=""
          className={styles.brandLogo}
        />
        <span className={styles.brandTitle}>CrossTalk</span>
      </a>
      <nav className={styles.nav} aria-label="メインナビゲーション">
        <a href={`${BASE_PATH}/#topics`}>テーマ一覧</a>
        <a href={`${BASE_PATH}/about`}>CrossTalkって？</a>
        <a href={`${BASE_PATH}/faq`}>FAQ</a>
        <a href={`${BASE_PATH}/contact`}>ご意見・ご感想</a>
      </nav>
    </header>
  );
}
