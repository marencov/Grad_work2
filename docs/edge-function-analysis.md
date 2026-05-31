# Edge FunctionによるAI解析メモ

回答保存後に、Supabase Edge Function `analyze-answer` を呼び出して、OpenAI APIで回答理由を解析します。

## 全体の流れ

```text
ブラウザ
  ↓ answers に回答を保存
Supabase DB
  ↓ 保存できた answerId を使う
ブラウザ
  ↓ functions.invoke("analyze-answer", { answerId })
Supabase Edge Function
  ↓ OPENAI_API_KEY を環境変数から読む
OpenAI API
  ↓ summary / sentiment / tags / keywords をJSONで返す
Supabase Edge Function
  ↓ answer_analysis に保存
ブラウザ
  ↓ 解析結果を画面に表示
```

## 作成したファイル

| ファイル | 役割 |
| --- | --- |
| `supabase/sql/001_create_answer_analysis.sql` | `answer_analysis` テーブルを作るSQLです。 |
| `supabase/functions/analyze-answer/index.ts` | 回答理由をOpenAI APIで解析してDBへ保存するEdge Functionです。 |
| `script.js` | 回答送信後に `supabaseClient.functions.invoke("analyze-answer")` を呼びます。 |
| `index.html` | 解析結果を表示するパネルを追加しています。 |
| `styles.css` | 解析結果パネルの見た目を追加しています。 |

## 環境変数

Supabase Edge Function側に設定してください。

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` は任意です。未設定の場合、Edge Function側では `gpt-4.1-mini` を使います。

## セキュリティ上の重要点

- OpenAI APIキーはフロントエンドに置きません。
- `service_role key` もフロントエンドに置きません。
- ブラウザは `answerId` だけをEdge Functionに渡します。
- `answer_analysis` への `insert` / `update` は匿名ユーザーには許可していません。
- 解析結果の `select` はWeb表示のために匿名ユーザーへ許可しています。

## 解析JSONの形

```json
{
  "summary": "短い要約文",
  "sentiment": "positive | neutral | negative | mixed",
  "tags": ["タグ1", "タグ2"],
  "keywords": ["キーワード1", "キーワード2"]
}
```

## デプロイ手順

Supabase CLIを使う場合の例です。

```bash
supabase db push
supabase functions deploy analyze-answer
```

SQLだけ先にSupabase DashboardのSQL Editorで実行しても大丈夫です。

## 401エラーが出る場合

ブラウザのConsoleに次のようなエラーが出る場合があります。

```text
Failed to load resource: the server responded with a status of 401
FunctionsHttpError: Edge Function returned a non-2xx status code
```

これは、Edge FunctionのJWT検証で止まっている可能性が高いです。

このプロトタイプは匿名アンケートなので、`supabase/config.toml` に次の設定を入れています。

```toml
[functions.analyze-answer]
verify_jwt = false
```

Supabase CLIを使う場合は、この設定を含めた状態で再デプロイしてください。

```bash
supabase functions deploy analyze-answer --no-verify-jwt
```

Dashboardから設定している場合は、`analyze-answer` FunctionのJWT verificationをオフにしてください。

注意点として、JWT検証をオフにするとFunction URLを知っている人が呼び出せます。卒制プロトタイプでは進めやすい設定ですが、本番ではレート制限やログイン、Bot対策を検討してください。

## `"undefined" is not valid JSON` が出る場合

これは、Edge Function内でOpenAIの返答から解析JSONを取り出す処理に失敗している状態です。

よくある原因は、OpenAI Responses APIの返答を `response.output_text` だけで読もうとしていることです。REST APIでは、解析結果が `response.output[].content[].text` 側に入ることがあります。

このプロジェクトの `supabase/functions/analyze-answer/index.ts` では、次の順で解析結果を探すようにしています。

```text
response.output_text
  ↓ なければ
response.output[].content[].parsed
  ↓ なければ
response.output[].content[].text
  ↓ なければ
response.choices[0].message.content
```

Supabase Dashboard上で直接Functionを編集している場合は、ローカルの `supabase/functions/analyze-answer/index.ts` の内容をDashboard側にも反映してください。

## `raw_analysis column` が無いと言われる場合

次のようなエラーが出る場合があります。

```text
Could not find the 'raw_analysis' column of 'answer_analysis' in the schema cache
```

これは `answer_analysis` テーブルを古いSQLで作ったため、`raw_analysis` カラムが無い状態です。

Supabase Dashboard の SQL Editor で次を実行してください。

```sql
alter table answer_analysis
add column if not exists raw_analysis jsonb not null default '{}'::jsonb;

alter table answer_analysis
add column if not exists updated_at timestamptz not null default now();
```

この修正SQLは `supabase/sql/002_fix_answer_analysis_raw_analysis.sql` にも置いてあります。

## `ON CONFLICT` のunique制約エラーが出る場合

次のようなエラーが出る場合があります。

```text
there is no unique or exclusion constraint matching the ON CONFLICT specification
```

これは、`answer_analysis.answer_id` に unique 制約が無い状態で、Edge Functionが `upsert(..., { onConflict: "answer_id" })` を使ったときに起きます。

SQL Editorで次を実行してください。

```sql
alter table answer_analysis
add constraint answer_analysis_answer_id_key unique (answer_id);
```

この修正SQLは `supabase/sql/003_fix_answer_analysis_unique_answer_id.sql` にも置いてあります。

なお、現在の `analyze-answer` は unique 制約が無くても動くように、`upsert` ではなく「既存確認 → update / insert」の形に変更しています。

## 全体解析を追加する場合

1件ずつの解析とは別に、全回答をまとめて読む `analyze-overall` Edge Function を追加しています。

主な役割は次の通りです。

- 全回答をまとめて読み込む
- どちらの選択肢が優勢かを見る
- どんな意見グループがあるかを整理する
- データ全体への考察を作る
- 光る意見、ユニークな意見をピックアップする

SQL Editorで次を実行してください。

```sql
-- ファイル: supabase/sql/004_create_overall_analysis.sql
create table if not exists overall_analysis (
  id uuid primary key default gen_random_uuid(),
  total_count integer not null default 0,
  choice_counts jsonb not null default '{}'::jsonb,
  leading_choice text,
  overview text not null,
  insights jsonb not null default '[]'::jsonb,
  opinion_groups jsonb not null default '[]'::jsonb,
  standout_opinions jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table overall_analysis enable row level security;

create policy "Anyone can read overall analysis"
on overall_analysis
for select
to anon
using (true);
```

Edge Functionは `supabase/functions/analyze-overall/index.ts` です。

Dashboardで関数を作る場合は、`analyze-overall` という名前で作り、JWT verificationをオフにしてください。

CLIを使う場合は次のようにデプロイします。

```bash
supabase functions deploy analyze-overall --no-verify-jwt
```

## 現在のAI解析方針

現在は `analyze-answer` は使わず、`analyze-overall` だけで全体解析しています。

`analyze-overall` が返す主な値は次の通りです。

- `overview`: グラフ下部に大きく表示する「全体の傾向と考察」
- `standoutOpinions`: グラフ中に吹き出し表示する「光る意見・具体的な意見」
- `funnyOpinions`: グラフ中に吹き出し表示する「クスッとくる面白い意見」
- `scoredAnswers`: 各回答に対する0〜10点の重み

スコアは、無回答、`test`、意味不明、解析不能、短すぎる回答を0点に近づけ、具体的な理由、光る視点、面白い表現がある回答を10点に近づける方針です。

フロントエンドでは `scoredAnswers` の `score` を使って、散布図の点の濃さと大きさを変えています。
