-- Keep existing questions and responses, but hide these topics from the public catalog.
update public.debate_questions
set is_active = false
where slug in (
  'taking-medicine-with-side-effects',
  'shorter-consultations-to-reduce-waiting'
);
