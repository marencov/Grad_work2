# Supabase連携メモ

このプロジェクトでは、まずユーザー回答を `answers` テーブルへ保存するところまでを実装しています。

## Supabase側のテーブル

作成済みのテーブルは次の形です。

```sql
create table answers (
  id uuid primary key default gen_random_uuid(),
  choice text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table answers enable row level security;

create policy "Anyone can insert answers"
on answers
for insert
to anon
with check (true);

create policy "Anyone can read answers"
on answers
for select
to anon
using (true);
```

## ローカル側の設定

`supabase-config.js` に、Supabaseの接続情報を入れます。

共有用の見本として `supabase-config.example.js` も置いてあります。

```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_PUBLIC_KEY",
};
```

`anonKey` はブラウザで使える公開キーです。  
ただし、`service_role key` や OpenAI APIキーのような秘密情報は絶対に書かないでください。

`supabase-config.js` は `.gitignore` に入れています。

## 現在のデータの流れ

```text
フォーム送信
  ↓
script.js の submitAnswer
  ↓
Supabase設定があれば answers テーブルに insert
  ↓
insert成功後、Supabaseから最新回答を select
  ↓
SVGグラフを再描画
```

Supabaseが未設定、または通信に失敗した場合は、プロトタイプ確認用として `localStorage` に保存します。

## 今後の注意点

- 現在のRLSは、匿名ユーザーが全回答を読める設定です。公開展示や授業内プロトタイプでは便利ですが、本番では表示範囲を再検討してください。
- 個人情報を入力させる場合は、保存項目、同意文、削除方法を設計してください。
- AI解析はフロントエンドに置かず、Next.js API Route、Supabase Edge Functions、Cloudflare Workers などのサーバー側に置くのが安全です。
