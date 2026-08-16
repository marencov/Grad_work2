"use client";

import { useState } from "react";
import { isSupabaseReady, supabaseClient } from "@/lib/supabaseClient";
import styles from "@/components/InformationPage.module.css";

const CONTACT_COOLDOWN_KEY = "crosstalk_contact_submitted_at";
const CONTACT_COOLDOWN_MS = 60_000;

const CATEGORY_GUIDES = {
  site_overall: {
    guide: "サイトの印象、わかりやすかった点、改善してほしい点などをお書きください。",
    placeholder: "例：トップページの説明はわかりやすかったですが、回答結果の見方についてもう少し説明があるとよいと思いました。",
  },
  topic_request: {
    guide: "追加してほしいテーマ、賛成・反対で考えたい問い、そのテーマが必要だと思った理由をお書きください。",
    placeholder: "例：『救急外来の適正利用』をテーマに追加してほしいです。患者側と医療者側で考え方が分かれやすいと思ったためです。",
  },
  how_to: {
    guide: "どのページで、何をしようとして、どこがわからなかったかをお書きください。",
    placeholder: "例：テーマを選んだ後、回答結果を見る方法がわかりませんでした。現在は回答理由の入力画面まで進んでいます。",
  },
  bug: {
    guide: "発生したページ、操作手順、表示された内容、使用デバイス・OS・ブラウザをできる範囲でお書きください。",
    placeholder: "例：iPhone 15／iOS／Safariを使用しています。FAQを開いた後にトップへ戻ると、テーマ一覧が表示されませんでした。",
  },
  other: {
    guide: "お問い合わせの内容を具体的にお書きください。返信に必要な情報がある場合は、あわせてご記入ください。",
    placeholder: "お問い合わせ内容を20文字以上で入力してください。",
  },
};

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const selectedGuide = CATEGORY_GUIDES[category];

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const category = String(formData.get("category") || "");
    const inquiry = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();
    const consented = formData.get("consent") === "on";

    // 人には見えない項目です。値がある場合はボット投稿として扱います。
    if (website) {
      setStatus("success");
      setMessage("お問い合わせを受け付けました。");
      form.reset();
      setCategory("");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("有効なメールアドレスを入力してください。");
      return;
    }

    if (!category || inquiry.length < 20 || inquiry.length > 4000) {
      setStatus("error");
      setMessage("お問い合わせ種別を選び、内容を20〜4000文字で入力してください。");
      return;
    }

    if (!consented) {
      setStatus("error");
      setMessage("個人情報の取り扱いを確認し、同意してください。");
      return;
    }

    if (!isSupabaseReady) {
      setStatus("error");
      setMessage("現在、送信先に接続できません。時間をおいてもう一度お試しください。");
      return;
    }

    const lastSubmittedAt = Number(window.localStorage.getItem(CONTACT_COOLDOWN_KEY) || 0);
    if (Date.now() - lastSubmittedAt < CONTACT_COOLDOWN_MS) {
      setStatus("error");
      setMessage("連続送信はできません。1分ほど待ってからお試しください。");
      return;
    }

    setStatus("submitting");

    const { error } = await supabaseClient.from("contact_inquiries").insert({
      name: name || null,
      email,
      category,
      message: inquiry,
    });

    if (error) {
      console.error("Contact inquiry submission failed", error);
      setStatus("error");
      setMessage("送信できませんでした。時間をおいてもう一度お試しください。");
      return;
    }

    window.localStorage.setItem(CONTACT_COOLDOWN_KEY, String(Date.now()));
    form.reset();
    setCategory("");
    setStatus("success");
    setMessage("お問い合わせを受け付けました。ありがとうございます。");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.fieldGrid}>
        <label>
          お名前 <span className={styles.optional}>任意</span>
          <input name="name" type="text" maxLength="100" autoComplete="name" placeholder="例：山田 太郎" />
        </label>
        <label>
          メールアドレス <span className={styles.required}>必須</span>
          <input name="email" type="email" maxLength="320" autoComplete="email" placeholder="example@email.com" required />
        </label>
      </div>

      <label>
        お問い合わせ種別 <span className={styles.required}>必須</span>
        <select
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        >
          <option value="" disabled>選択してください</option>
          <option value="site_overall">サイト全体について</option>
          <option value="topic_request">掲載テーマを追加したい</option>
          <option value="how_to">操作方法がわからない</option>
          <option value="bug">不具合報告</option>
          <option value="other">その他</option>
        </select>
      </label>

      <label>
        お問い合わせ内容 <span className={styles.required}>必須</span>
        {selectedGuide ? <span className={styles.fieldGuide}>{selectedGuide.guide}</span> : null}
        <textarea
          name="message"
          minLength="20"
          maxLength="4000"
          rows="8"
          placeholder={selectedGuide?.placeholder || "先にお問い合わせ種別を選択してください。"}
          required
        />
      </label>

      <label className={styles.honeypot} aria-hidden="true">
        Webサイト
        <input name="website" type="text" tabIndex="-1" autoComplete="off" />
      </label>

      <label className={styles.consent}>
        <input name="consent" type="checkbox" required />
        <span>
          入力内容を制作者がお問い合わせ対応のために保存・利用することに同意します。
        </span>
      </label>

      {message ? (
        <p
          className={status === "success" ? styles.successMessage : styles.errorMessage}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <button className={styles.submitButton} type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "送信中…" : "お問い合わせを送信"}
      </button>
    </form>
  );
}
