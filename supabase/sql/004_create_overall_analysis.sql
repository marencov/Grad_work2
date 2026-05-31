-- 全回答をまとめてAI解析した結果を保存するテーブルです。
-- 1件ごとの解析は answer_analysis、全体の傾向や考察は overall_analysis に分けます。

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

