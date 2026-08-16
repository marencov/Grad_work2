-- Adds the ten medical debate topics introduced in the web catalog.
-- Run after 007_create_debate_question_system.sql.

with seed as (
  select *
  from jsonb_to_recordset(
    $$[
      {"slug":"antibiotics-for-common-cold","title":"風邪に抗菌薬を\n使ってよい？","description":"抗菌薬の必要性と、薬剤耐性や患者の希望について考える問いです。","field_tags":["感染症","抗菌薬","薬剤耐性","適正使用"],"axis_x_label":"患者の希望↔医学的必要性","axis_y_label":"薬剤耐性への懸念","pro_label":"場合によっては使ってよい","pro_description":"症状や細菌感染の可能性に応じて使用してよい","con_label":"安易に使うべきでない","con_description":"効果が期待できない風邪への使用は避けるべき","reason_tags":["症状の早期改善","細菌感染の可能性","薬剤耐性","副作用","患者の希望","適正使用"]},
      {"slug":"prescription-in-private-practice","title":"自由診療なら\n何を処方してもよい？","description":"患者の選択肢と、医師の専門的責任や安全性の境界について考える問いです。","field_tags":["自由診療","処方","医療倫理","患者安全"],"axis_x_label":"患者の自由↔医師の責任","axis_y_label":"安全性・規制の重視","pro_label":"幅広く認めてよい","pro_description":"十分な説明と同意があれば患者の選択を尊重すべき","con_label":"一定の制限が必要","con_description":"自由診療でも安全性と医学的妥当性を優先すべき","reason_tags":["患者の自己決定","医師の裁量","安全性","医学的根拠","説明と同意","利益優先への懸念"]},
      {"slug":"liberalization-of-medical-advertising","title":"医療広告は\nもっと自由にすべき？","description":"患者が情報を得る機会と、誇大広告や誤解を招く情報のリスクについて考える問いです。","field_tags":["医療広告","情報提供","広告規制","患者保護"],"axis_x_label":"情報発信の自由↔患者保護","axis_y_label":"広告規制への支持","pro_label":"もっと自由にすべき","pro_description":"患者が医療機関を比較できる情報を増やすべき","con_label":"慎重に規制すべき","con_description":"誇大広告や不適切な誘導から患者を守るべき","reason_tags":["患者の知る権利","医療機関の比較","誇大広告","情報の信頼性","患者の誘導","競争の促進"]},
      {"slug":"taking-medicine-with-side-effects","title":"副作用がある薬でも\n飲むべき？","description":"治療によって得られる効果と、副作用による負担をどのように比較するかを考える問いです。","field_tags":["薬物療法","副作用","治療選択","意思決定"],"axis_x_label":"治療効果↔副作用の回避","axis_y_label":"治療リスクへの許容","pro_label":"効果が上回るなら飲むべき","pro_description":"必要な治療なら副作用の可能性があっても受け入れる","con_label":"無理に飲むべきでない","con_description":"副作用による負担や生活への影響を重視する","reason_tags":["治療効果","副作用の重さ","生活の質","病気の深刻さ","代替治療","本人の意思"]},
      {"slug":"hospital-wait-times","title":"病院の待ち時間は\n長すぎる？","description":"現在の病院の待ち時間を、医療の質や現場の負担も含めて考える問いです。","field_tags":["待ち時間","外来診療","患者満足","医療現場"],"axis_x_label":"診療の丁寧さ↔待ち時間の短縮","axis_y_label":"現状への問題意識","pro_label":"長すぎる","pro_description":"患者の時間的負担を減らす改善が必要","con_label":"ある程度は仕方がない","con_description":"安全で丁寧な診療のためには一定の待ち時間が必要","reason_tags":["患者の時間","予約制度","人手不足","診療の丁寧さ","業務効率","緊急患者の優先"]},
      {"slug":"license-revocation-for-medical-errors","title":"医療ミスをした医師は\n免許剥奪すべき？","description":"患者の安全と責任追及、再発防止や医療現場への影響について考える問いです。","field_tags":["医療ミス","医師免許","患者安全","医療倫理"],"axis_x_label":"厳しい責任追及↔再発防止と改善","axis_y_label":"処分の厳格さ","pro_label":"重大な場合は剥奪すべき","pro_description":"患者の安全と医療への信頼を守るため厳しく処分する","con_label":"一律に剥奪すべきでない","con_description":"原因や故意・過失の程度を個別に判断すべき","reason_tags":["患者の安全","医師の責任","過失の程度","再発防止","組織的要因","萎縮医療"]},
      {"slug":"expansion-of-telemedicine","title":"オンライン診療を\nもっと増やすべき？","description":"医療へのアクセス向上と、対面でなければ得にくい診療情報について考える問いです。","field_tags":["オンライン診療","医療アクセス","デジタル医療","地域医療"],"axis_x_label":"利便性↔対面診療の確実性","axis_y_label":"デジタル医療への期待","pro_label":"もっと増やすべき","pro_description":"通院の負担を減らし医療へのアクセスを改善すべき","con_label":"慎重に増やすべき","con_description":"診察精度や見逃しのリスクを考慮すべき","reason_tags":["通院負担","地域格差","診察精度","見逃しのリスク","デジタル格差","感染対策"]},
      {"slug":"ai-medical-diagnosis","title":"AIに診断を\n任せるべき？","description":"AIによる診断支援の可能性と、誤診時の責任や人間の判断の必要性について考える問いです。","field_tags":["医療AI","診断","医療技術","責任"],"axis_x_label":"技術への期待↔人間による判断","axis_y_label":"AIへの信頼","pro_label":"一定範囲で任せてよい","pro_description":"精度が確認された領域ではAIを積極的に活用すべき","con_label":"最終判断は人がすべき","con_description":"診断の責任や患者ごとの事情を人間が判断すべき","reason_tags":["診断精度","医師不足","見落とし防止","責任の所在","患者との対話","AIへの不信"]},
      {"slug":"legalization-of-active-euthanasia","title":"積極的安楽死を\n認めるべき？","description":"耐えがたい苦痛から逃れる選択と、生命保護や制度の濫用リスクについて考える問いです。","field_tags":["安楽死","終末期医療","自己決定","生命倫理"],"axis_x_label":"生命の保護↔自己決定","axis_y_label":"制度化への許容","pro_label":"厳しい条件付きで認めるべき","pro_description":"本人の明確な意思と耐えがたい苦痛がある場合に認める","con_label":"認めるべきでない","con_description":"生命保護と濫用防止を優先し別の支援を充実させる","reason_tags":["本人の自己決定","耐えがたい苦痛","生命の尊重","制度の濫用","家族への影響","緩和ケア"]},
      {"slug":"shorter-consultations-to-reduce-waiting","title":"待ち時間を短くするために\n診察時間を短縮すべき？","description":"多くの患者を早く診察することと、一人ひとりに丁寧な診療を行うことのバランスを考える問いです。","field_tags":["待ち時間","診察時間","医療効率","患者満足"],"axis_x_label":"診療効率↔診療の丁寧さ","axis_y_label":"時間短縮への支持","pro_label":"ある程度短縮すべき","pro_description":"診療を効率化して全体の待ち時間を減らすべき","con_label":"診察時間を守るべき","con_description":"待ち時間より十分な説明と診察を優先すべき","reason_tags":["待ち時間","診療の丁寧さ","説明不足","医療現場の効率","患者数","診療内容による調整"]}
    ]$$::jsonb
  ) as x(
    slug text, title text, description text, field_tags jsonb,
    axis_x_label text, axis_y_label text,
    pro_label text, pro_description text,
    con_label text, con_description text, reason_tags jsonb
  )
),
upserted_questions as (
  insert into debate_questions (
    slug, title, description, field_tags, axis_x_label, axis_y_label, is_active
  )
  select slug, title, description, field_tags, axis_x_label, axis_y_label, true
  from seed
  on conflict (slug) do update set
    title = excluded.title,
    description = excluded.description,
    field_tags = excluded.field_tags,
    axis_x_label = excluded.axis_x_label,
    axis_y_label = excluded.axis_y_label,
    is_active = true
  returning id, slug
),
upserted_choices as (
  insert into debate_choices (
    question_id, side, label, description, color, sort_order
  )
  select q.id, c.side, c.label, c.description, c.color, c.sort_order
  from seed s
  join upserted_questions q on q.slug = s.slug
  cross join lateral (
    values
      ('pro', s.pro_label, s.pro_description, 'blue', 1),
      ('con', s.con_label, s.con_description, 'red', 2)
  ) as c(side, label, description, color, sort_order)
  on conflict (question_id, side) do update set
    label = excluded.label,
    description = excluded.description,
    color = excluded.color,
    sort_order = excluded.sort_order
  returning question_id
)
insert into debate_question_reason_tag_seeds (question_id, tag, sort_order)
select
  q.id,
  tags.tag,
  tags.ordinality::int
from seed s
join upserted_questions q on q.slug = s.slug
cross join lateral jsonb_array_elements_text(s.reason_tags)
  with ordinality as tags(tag, ordinality)
on conflict (question_id, tag) do update
set sort_order = excluded.sort_order;
