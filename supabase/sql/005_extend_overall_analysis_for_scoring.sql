-- 全体解析に、回答ごとのスコアと面白い意見を保存するための追加SQLです。
-- Supabase Dashboard の SQL Editor で実行してください。

alter table overall_analysis
add column if not exists scored_answers jsonb not null default '[]'::jsonb;

alter table overall_analysis
add column if not exists funny_opinions jsonb not null default '[]'::jsonb;

