-- Prevent public clients from modifying arbitrary responses.
-- A per-response edit-token hash is checked by the update-debate-response Edge Function.

alter table public.debate_responses
add column if not exists edit_token_hash text;

alter table public.debate_responses
drop constraint if exists debate_responses_edit_token_hash_format;

alter table public.debate_responses
add constraint debate_responses_edit_token_hash_format
check (edit_token_hash is null or edit_token_hash ~ '^[0-9a-f]{64}$');

drop policy if exists "Anyone can update prototype debate responses"
on public.debate_responses;

revoke update on table public.debate_responses from anon, authenticated;
