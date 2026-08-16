-- CrossTalk お問い合わせ保存テーブル。
-- 公開クライアントは INSERT のみ可能で、個人情報を含む行の読み取りは許可しない。

create extension if not exists pgcrypto;

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  category text not null,
  message text not null,
  status text not null default 'new',
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint contact_inquiries_name_length check (name is null or char_length(name) between 1 and 100),
  constraint contact_inquiries_email_length check (char_length(email) between 3 and 320),
  constraint contact_inquiries_category_values check (
    category in ('site_overall', 'topic_request', 'how_to', 'bug', 'other')
  ),
  constraint contact_inquiries_message_length check (char_length(message) between 20 and 4000),
  constraint contact_inquiries_status_values check (status in ('new', 'in_progress', 'resolved', 'closed'))
);

create index if not exists contact_inquiries_status_created_at_idx
on public.contact_inquiries (status, created_at desc);

alter table public.contact_inquiries enable row level security;

revoke all on table public.contact_inquiries from anon, authenticated;
grant insert on table public.contact_inquiries to anon, authenticated;

drop policy if exists "Anyone can submit a contact inquiry" on public.contact_inquiries;
create policy "Anyone can submit a contact inquiry"
on public.contact_inquiries
for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(email) between 3 and 320
  and category in ('site_overall', 'topic_request', 'how_to', 'bug', 'other')
  and char_length(message) between 20 and 4000
);
