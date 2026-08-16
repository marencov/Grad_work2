-- Adds the personal-responsibility medical-cost debate topic.
-- Run after 007_create_debate_question_system.sql.

insert into debate_questions (
  slug,
  title,
  description,
  field_tags,
  axis_x_label,
  axis_y_label,
  is_active
)
values (
  'personal-responsibility-medical-costs',
  E'自己責任の病気は\n医療費を本人負担にすべき？',
  '喫煙や生活習慣と関連する病気について、本人の責任と、病気の原因の複雑さや社会保障の役割を考える問いです。',
  '["医療費","生活習慣病","公平性"]'::jsonb,
  '個人の責任↔社会による保障',
  '本人負担への許容',
  true
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  field_tags = excluded.field_tags,
  axis_x_label = excluded.axis_x_label,
  axis_y_label = excluded.axis_y_label,
  is_active = true;

with choice_seed(side, label, description, color, sort_order) as (
  values
    ('pro', '本人負担を増やすべき', '本人が選んだ生活習慣には一定の責任を求めるべき', 'blue', 1),
    ('con', '一律に負担させるべきでない', '病気の原因は複雑で、自己責任だけでは判断できない', 'red', 2)
)
insert into debate_choices (
  question_id,
  side,
  label,
  description,
  color,
  sort_order
)
select q.id, c.side, c.label, c.description, c.color, c.sort_order
from debate_questions q
cross join choice_seed c
where q.slug = 'personal-responsibility-medical-costs'
on conflict (question_id, side) do update
set
  label = excluded.label,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

with tag_seed(tag, sort_order) as (
  values
    ('本人の責任', 1),
    ('疾患原因の複雑さ', 2),
    ('医療費の公平性', 3),
    ('予防への動機', 4),
    ('経済格差', 5),
    ('受診控え', 6),
    ('スティグマ', 7)
)
insert into debate_question_reason_tag_seeds (question_id, tag, sort_order)
select q.id, t.tag, t.sort_order
from debate_questions q
cross join tag_seed t
where q.slug = 'personal-responsibility-medical-costs'
on conflict (question_id, tag) do update
set sort_order = excluded.sort_order;
