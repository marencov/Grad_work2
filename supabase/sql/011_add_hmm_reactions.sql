alter table debate_responses
add column if not exists hmms integer not null default 0 check (hmms >= 0);
