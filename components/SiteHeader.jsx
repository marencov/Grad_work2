"use client";

import { useEffect, useState } from "react";
import styles from "@/components/SiteHeader.module.css";

const BASE_PATH = "/CrossTalk";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

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
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
        type="button"
        aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-main-navigation"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav
        id="mobile-main-navigation"
        className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ""}`}
        aria-label="メインナビゲーション"
      >
        <a href={`${BASE_PATH}/#topics`} onClick={() => setIsMenuOpen(false)}>テーマ一覧</a>
        <a href={`${BASE_PATH}/about`} onClick={() => setIsMenuOpen(false)}>CrossTalkって？</a>
        <a href={`${BASE_PATH}/faq`} onClick={() => setIsMenuOpen(false)}>FAQ</a>
        <a href={`${BASE_PATH}/contact`} onClick={() => setIsMenuOpen(false)}>ご意見・ご感想</a>
      </nav>
    </header>
  );
}
