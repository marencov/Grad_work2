-- お問い合わせ種別を、画面上の用途に合わせた分類へ更新する。

alter table public.contact_inquiries
drop constraint if exists contact_inquiries_category_values;

alter table public.contact_inquiries
add constraint contact_inquiries_category_values
check (category in ('site_overall', 'topic_request', 'how_to', 'bug', 'other'));

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
