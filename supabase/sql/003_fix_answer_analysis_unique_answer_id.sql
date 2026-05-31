-- analyze-answer Edge Function が answer_id をキーにして解析結果を更新できるように、
-- answer_id に unique 制約を追加します。
--
-- すでに同じ answer_id の行が重複している場合、このSQLは失敗します。
-- その場合は重複行を整理してから実行してください。

alter table answer_analysis
add constraint answer_analysis_answer_id_key unique (answer_id);

