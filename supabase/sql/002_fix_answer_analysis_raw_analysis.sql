-- 既に answer_analysis テーブルを作った後で raw_analysis カラムが無い場合の修正SQLです。
-- Supabase Dashboard の SQL Editor で実行してください。

alter table answer_analysis
add column if not exists raw_analysis jsonb not null default '{}'::jsonb;

alter table answer_analysis
add column if not exists updated_at timestamptz not null default now();

