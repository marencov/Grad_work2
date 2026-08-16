-- Generic two-sided debate question system for CrossTalk prototypes.
-- Run this in Supabase SQL Editor before using /top-page-v1 with Supabase.

create extension if not exists pgcrypto;

create table if not exists debate_questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  axis_x_label text not null default '苦痛と尊厳',
  axis_y_label text not null default '生命・技術への期待',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists debate_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references debate_questions(id) on delete cascade,
  side text not null check (side in ('pro', 'con')),
  label text not null,
  description text not null default '',
  color text not null default 'blue',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, side)
);

create table if not exists debate_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references debate_questions(id) on delete cascade,
  choice_id uuid not null references debate_choices(id) on delete restrict,
  choice_side text not null check (choice_side in ('pro', 'con')),
  reason text not null default '',
  likes int not null default 0 check (likes >= 0),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debate_response_analysis (
  response_id uuid primary key references debate_responses(id) on delete cascade,
  question_id uuid not null references debate_questions(id) on delete cascade,
  summary text not null default '',
  reason_tags jsonb not null default '[]'::jsonb,
  axis_scores jsonb not null default '{}'::jsonb,
  value_axes jsonb not null default '[]'::jsonb,
  sentiment text not null default 'neutral',
  standout_score int not null default 0 check (standout_score between 0 and 10),
  is_interesting boolean not null default false,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debate_question_analysis_snapshots (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references debate_questions(id) on delete cascade,
  total_count int not null default 0,
  choice_counts jsonb not null default '{}'::jsonb,
  top_tags jsonb not null default '[]'::jsonb,
  tag_distribution_by_side jsonb not null default '{}'::jsonb,
  scatter_summary jsonb not null default '{}'::jsonb,
  neutral_analysis_text text not null default '',
  standout_responses jsonb not null default '[]'::jsonb,
  raw_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists debate_choices_question_id_idx on debate_choices(question_id);
create index if not exists debate_responses_question_id_idx on debate_responses(question_id);
create index if not exists debate_responses_choice_side_idx on debate_responses(question_id, choice_side);
create index if not exists debate_responses_likes_idx on debate_responses(question_id, likes desc);
create index if not exists debate_response_analysis_question_id_idx on debate_response_analysis(question_id);
create index if not exists debate_question_analysis_question_id_idx on debate_question_analysis_snapshots(question_id, created_at desc);

alter table debate_questions
add column if not exists field_tags jsonb not null default '[]'::jsonb;

create table if not exists debate_question_reason_tag_seeds (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references debate_questions(id) on delete cascade,
  tag text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (question_id, tag)
);

create index if not exists debate_question_reason_tag_seeds_question_id_idx
on debate_question_reason_tag_seeds(question_id, sort_order);

create or replace function touch_debate_response_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_debate_responses_updated_at on debate_responses;
create trigger touch_debate_responses_updated_at
before update on debate_responses
for each row
execute function touch_debate_response_updated_at();

alter table debate_questions enable row level security;
alter table debate_choices enable row level security;
alter table debate_responses enable row level security;
alter table debate_response_analysis enable row level security;
alter table debate_question_analysis_snapshots enable row level security;
alter table debate_question_reason_tag_seeds enable row level security;

drop policy if exists "Anyone can read debate questions" on debate_questions;
create policy "Anyone can read debate questions"
on debate_questions for select
to anon
using (true);

drop policy if exists "Anyone can read debate choices" on debate_choices;
create policy "Anyone can read debate choices"
on debate_choices for select
to anon
using (true);

drop policy if exists "Anyone can insert debate responses" on debate_responses;
create policy "Anyone can insert debate responses"
on debate_responses for insert
to anon
with check (true);

drop policy if exists "Anyone can read debate responses" on debate_responses;
create policy "Anyone can read debate responses"
on debate_responses for select
to anon
using (true);

drop policy if exists "Anyone can update prototype debate responses" on debate_responses;
create policy "Anyone can update prototype debate responses"
on debate_responses for update
to anon
using (true)
with check (true);

drop policy if exists "Anyone can read debate response analysis" on debate_response_analysis;
create policy "Anyone can read debate response analysis"
on debate_response_analysis for select
to anon
using (true);

drop policy if exists "Anyone can read debate question analysis" on debate_question_analysis_snapshots;
create policy "Anyone can read debate question analysis"
on debate_question_analysis_snapshots for select
to anon
using (true);

drop policy if exists "Anyone can read debate question reason tag seeds" on debate_question_reason_tag_seeds;
create policy "Anyone can read debate question reason tag seeds"
on debate_question_reason_tag_seeds for select
to anon
using (true);

insert into debate_questions (
  slug,
  title,
  description,
  axis_x_label,
  axis_y_label
)
values (
  'life-support-treatment',
  '延命治療はどこまで行うべき？',
  '正解のない問いです。まずは直感で選んでください。',
  '苦痛と尊厳',
  '生命・技術への期待'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  axis_x_label = excluded.axis_x_label,
  axis_y_label = excluded.axis_y_label;

insert into debate_choices (
  question_id,
  side,
  label,
  description,
  color,
  sort_order
)
select
  q.id,
  v.side,
  v.label,
  v.description,
  v.color,
  v.sort_order
from debate_questions q
cross join (
  values
    ('pro', '積極的に行うべき', 'できる限り生命を伸ばす', 'blue', 1),
    ('con', '自然な経過を尊重すべき', '無用な苦痛を与えるべきでない', 'red', 2)
) as v(side, label, description, color, sort_order)
where q.slug = 'life-support-treatment'
on conflict (question_id, side) do update
set
  label = excluded.label,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

update debate_questions
set axis_x_label = '侵襲的↔緩和的'
where slug = 'life-support-treatment';

with question_seed(slug, title, description, field_tags, axis_x_label, axis_y_label) as (
  values
    (
      'life-support-treatment',
      '延命治療は<br>どこまで行うべき？',
      '正解のない医療の問いについて、まずは直感で立場を選んでください。',
      '["終末期医療","人生会議"]'::jsonb,
      '侵襲的↔緩和的',
      '生命・技術への期待'
    ),
    (
      'physical-restraint',
      '身体拘束は<br>容認されるべき？',
      '安全確保と本人の尊厳・自由のあいだで、どこまで身体拘束を認めるべきかを考える問いです。',
      '["介護","認知症","安全管理"]'::jsonb,
      '安全確保↔尊厳・自由',
      '現場負担・リスク許容'
    ),
    (
      'aed-for-collapsed-woman',
      '倒れている女性に<br>AEDを使う？',
      '救命の緊急性と、プライバシー・ためらい・法的心理的ハードルのあいだで判断が分かれる問いです。',
      '["救急医療","ジェンダー","良きサマリア人の法"]'::jsonb,
      '救命優先',
      '配慮・ためらい'
    ),
    (
      'paid-ambulance',
      '救急車は<br>有料化すべき？',
      '救急資源の適正利用と、必要な人が受診をためらうリスクのあいだで考える問いです。',
      '["救急医療","医療費","医療資源"]'::jsonb,
      '適正利用↔アクセス保障',
      '自己負担への許容'
    ),
    (
      'elderly-copayment-30-percent',
      '高齢者の窓口負担も<br>一律3割にするべき？',
      '世代間の公平性と、高齢者の受診控え・生活負担のあいだで判断が分かれる問いです。',
      '["医療費","高齢者医療","世代間公平"]'::jsonb,
      '世代間公平↔高齢者保護',
      '医療費削減'
    )
)
insert into debate_questions (slug, title, description, field_tags, axis_x_label, axis_y_label)
select slug, title, description, field_tags, axis_x_label, axis_y_label
from question_seed
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  field_tags = excluded.field_tags,
  axis_x_label = excluded.axis_x_label,
  axis_y_label = excluded.axis_y_label,
  is_active = true;

with choice_seed(slug, side, label, description, color, sort_order) as (
  values
    ('life-support-treatment', 'pro', '積極的に行うべき', 'できる限り生命を伸ばす', 'blue', 1),
    ('life-support-treatment', 'con', '自然な経過を尊重すべき', '無用な苦痛を与えるべきでない', 'red', 2),
    ('physical-restraint', 'pro', '治療に必要な場合は容認すべき', '転倒や事故を防ぐために限定的に認めるべき', 'blue', 1),
    ('physical-restraint', 'con', 'どんな場合も避けるべき', '本人の尊厳や自由を不当に奪うべきでない', 'red', 2),
    ('aed-for-collapsed-woman', 'pro', '迷わず使うべき', '命を救うことを最優先に行動すべき', 'blue', 1),
    ('aed-for-collapsed-woman', 'con', '使うには配慮が必要', 'プライバシーや誤解への不安も無視できない', 'red', 2),
    ('paid-ambulance', 'pro', '有料化すべき', '不要不急の利用を減らし、救急資源を守るべき', 'blue', 1),
    ('paid-ambulance', 'con', '無料を維持すべき', '必要な人が救急要請をためらうべきでない', 'red', 2),
    ('elderly-copayment-30-percent', 'pro', '3割にするべき', '現役世代との公平性や制度維持を重視すべき', 'blue', 1),
    ('elderly-copayment-30-percent', 'con', '負担増は避けるべき', '高齢者の受診控えや生活負担を増やすべきでない', 'red', 2)
)
insert into debate_choices (question_id, side, label, description, color, sort_order)
select q.id, c.side, c.label, c.description, c.color, c.sort_order
from choice_seed c
join debate_questions q on q.slug = c.slug
on conflict (question_id, side) do update
set
  label = excluded.label,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

with tag_seed(slug, tag, sort_order) as (
  values
    ('life-support-treatment', '苦痛の回避', 1),
    ('life-support-treatment', '本人の意思', 2),
    ('life-support-treatment', '本人の尊厳', 3),
    ('life-support-treatment', '生活の質', 4),
    ('life-support-treatment', '回復可能性', 5),
    ('life-support-treatment', '家族負担', 6),
    ('physical-restraint', '転倒予防', 1),
    ('physical-restraint', '本人の尊厳', 2),
    ('physical-restraint', '現場負担', 3),
    ('physical-restraint', '家族の安心', 4),
    ('physical-restraint', '虐待リスク', 5),
    ('physical-restraint', '代替ケア', 6),
    ('aed-for-collapsed-woman', '救命優先', 1),
    ('aed-for-collapsed-woman', 'プライバシー', 2),
    ('aed-for-collapsed-woman', '法的保護', 3),
    ('aed-for-collapsed-woman', '周囲の協力', 4),
    ('aed-for-collapsed-woman', 'ためらい', 5),
    ('aed-for-collapsed-woman', '教育不足', 6),
    ('paid-ambulance', '不要不急利用', 1),
    ('paid-ambulance', '受診控え', 2),
    ('paid-ambulance', '医療資源', 3),
    ('paid-ambulance', '公平性', 4),
    ('paid-ambulance', '低所得者負担', 5),
    ('paid-ambulance', '重症化リスク', 6),
    ('elderly-copayment-30-percent', '世代間公平', 1),
    ('elderly-copayment-30-percent', '制度維持', 2),
    ('elderly-copayment-30-percent', '受診控え', 3),
    ('elderly-copayment-30-percent', '生活負担', 4),
    ('elderly-copayment-30-percent', '低所得高齢者', 5),
    ('elderly-copayment-30-percent', '医療費抑制', 6)
)
insert into debate_question_reason_tag_seeds (question_id, tag, sort_order)
select q.id, t.tag, t.sort_order
from tag_seed t
join debate_questions q on q.slug = t.slug
on conflict (question_id, tag) do update
set sort_order = excluded.sort_order;
