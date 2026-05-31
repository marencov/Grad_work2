/*
  Supabase接続設定のサンプルです。

  使い方:
  1. このファイルをコピーして、同じ階層に supabase-config.js を作る
  2. Supabaseの Project URL と anon public key を入れる
  3. supabase-config.js は自分の環境用として扱う

  注意:
  - anon public key はブラウザで使う前提の公開キーです。
  - service_role key は絶対にここへ書かないでください。
  - OpenAI APIキーなどの秘密情報も、フロントエンドには書かないでください。
*/
window.SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY",
};
