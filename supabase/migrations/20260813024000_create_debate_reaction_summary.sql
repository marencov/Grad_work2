create or replace view debate_reaction_question_summary
with (security_invoker = true)
as
select
  question_id,
  count(*)::bigint as total_reactions,
  count(distinct actor_response_id)::bigint as reacting_users,
  count(*) filter (where actor_side = target_side)::bigint as same_side_reactions,
  count(*) filter (where actor_side <> target_side)::bigint as opposite_side_reactions,
  count(*) filter (where reaction = 'naruhodo')::bigint as naruhodo_reactions,
  count(*) filter (where reaction = 'hmm')::bigint as hmm_reactions,
  count(*) filter (where actor_side = target_side and reaction = 'naruhodo')::bigint
    as same_side_naruhodo,
  count(*) filter (where actor_side = target_side and reaction = 'hmm')::bigint
    as same_side_hmm,
  count(*) filter (where actor_side <> target_side and reaction = 'naruhodo')::bigint
    as opposite_side_naruhodo,
  count(*) filter (where actor_side <> target_side and reaction = 'hmm')::bigint
    as opposite_side_hmm,
  round(
    100.0 * count(*) filter (where actor_side <> target_side) / nullif(count(*), 0),
    1
  ) as opposite_side_reaction_percent,
  round(
    100.0 * count(*) filter (where reaction = 'naruhodo') / nullif(count(*), 0),
    1
  ) as naruhodo_percent,
  round(
    100.0 * count(*) filter (where reaction = 'hmm') / nullif(count(*), 0),
    1
  ) as hmm_percent
from debate_response_reactions
group by question_id;

comment on view debate_reaction_question_summary is
'質問ごとのリアクション利用者数、同側・反対側、なるほど・うーんの件数と割合。service role等の管理側から参照する。';
