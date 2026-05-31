-- answers テーブルに、AI採点とクリック加点で使う score を追加します。
-- 初回のAI採点は 0〜10、ユーザーのクリックでは +1 ずつ増やします。
-- OpenAI APIキーを守るため、score の更新は Edge Function から service role で行います。

alter table answers
add column if not exists score integer not null default 0;
