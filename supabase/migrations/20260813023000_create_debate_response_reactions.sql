create table if not exists debate_response_reactions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references debate_questions(id) on delete cascade,
  actor_response_id uuid not null references debate_responses(id) on delete cascade,
  target_response_id uuid not null references debate_responses(id) on delete cascade,
  actor_side text not null check (actor_side in ('pro', 'con')),
  target_side text not null check (target_side in ('pro', 'con')),
  reaction text not null check (reaction in ('naruhodo', 'hmm')),
  question_version text not null default 'unknown',
  occurred_at timestamptz not null default now(),
  check (actor_response_id <> target_response_id),
  unique (actor_response_id, target_response_id)
);

create index if not exists debate_response_reactions_question_idx
on debate_response_reactions(question_id, occurred_at desc);

create index if not exists debate_response_reactions_actor_idx
on debate_response_reactions(actor_response_id);

create index if not exists debate_response_reactions_sides_idx
on debate_response_reactions(question_id, actor_side, target_side, reaction);

alter table debate_response_reactions enable row level security;
