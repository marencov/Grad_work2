-- answersテーブルに保存した1件の回答に対して、AI解析結果を保存するテーブルです。
-- summary / sentiment / tags / keywords をあとからWeb画面で読み出せるようにします。

create table if not exists answer_analysis (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null references answers(id) on delete cascade,
  summary text not null,
  sentiment text not null,
  tags jsonb not null default '[]'::jsonb,
  keywords jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (answer_id)
);

alter table answer_analysis enable row level security;

-- フロントエンドから解析結果を表示するため、匿名ユーザーの読み取りを許可します。
-- 本番で個人情報を扱う場合は、公開範囲をもっと厳しくしてください。
create policy "Anyone can read answer analysis"
on answer_analysis
for select
to anon
using (true);

-- insert / update は anon に許可しません。
-- analyze-answer Edge Function が service role key で保存します。

