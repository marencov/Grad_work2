begin;

create temporary table debate_catalog_sync (
  slug text primary key,
  title text not null,
  description text not null,
  field_tags jsonb not null,
  axis_x_label text not null,
  axis_y_label text not null,
  pro_label text not null,
  pro_description text not null,
  con_label text not null,
  con_description text not null,
  reason_tags jsonb not null
) on commit drop;

insert into debate_catalog_sync
select *
from jsonb_to_recordset('[{"slug":"life-support-treatment","title":"延命治療は\nどこまで行うべき？","description":"正解のない医療の問いです。まずは直感で立場を選んでください。","field_tags":["終末期医療","人生会議","尊厳死","高齢者医療"],"axis_x_label":"侵襲的↔緩和的","axis_y_label":"生命・技術への期待","pro_label":"積極的に行うべき","pro_description":"できる限り生命を伸ばす","con_label":"自然な経過を尊重すべき","con_description":"無用な苦痛を与えるべきでない","reason_tags":["苦痛の回避","本人の意思","本人の尊厳","生活の質","回復可能性","家族負担"]},{"slug":"physical-restraint","title":"身体拘束は\n容認されるべき？","description":"安全確保と本人の尊厳・自由のあいだで、どこまで身体拘束を認めるべきかを考える問いです。","field_tags":["介護","医療安全","高齢者医療"],"axis_x_label":"安全確保↔尊厳・自由","axis_y_label":"現場負担・リスク許容","pro_label":"必要な場合は容認すべき","pro_description":"転倒や事故を防ぐために限定的に認めるべき","con_label":"原則として避けるべき","con_description":"本人の尊厳や自由を不当に奪うべきでない","reason_tags":["転倒予防","本人の尊厳","現場負担","家族の安心","虐待リスク","代替ケア"]},{"slug":"aed-for-collapsed-woman","title":"倒れている女性に\nAEDを使う？","description":"救命の緊急性と、プライバシー・ためらい・法的心理的ハードルのあいだで判断が分かれる問いです。","field_tags":["救急医療","AED","ジェンダー"],"axis_x_label":"救命優先↔配慮・ためらい","axis_y_label":"市民救助への信頼","pro_label":"迷わず使うべき","pro_description":"命を救うことを最優先に行動すべき","con_label":"使うには配慮が必要","con_description":"プライバシーや誤解への不安も無視できない","reason_tags":["救命優先","プライバシー","法的保護","周囲の協力","ためらい","教育不足"]},{"slug":"paid-ambulance","title":"救急車は\n有料化すべき？","description":"救急資源の適正利用と、必要な人が受診をためらうリスクのあいだで考える問いです。","field_tags":["救急医療","医療費"],"axis_x_label":"適正利用↔アクセス保障","axis_y_label":"自己負担への許容","pro_label":"有料化すべき","pro_description":"不要不急の利用を減らし、救急資源を守るべき","con_label":"無料を維持すべき","con_description":"必要な人が救急要請をためらうべきでない","reason_tags":["不要不急利用","受診控え","医療資源","公平性","低所得者負担","重症化リスク"]},{"slug":"elderly-copayment-30-percent","title":"高齢者の窓口負担も\n3割にするべき？","description":"世代間の公平性と、高齢者の受診控え・生活負担のあいだで判断が分かれる問いです。","field_tags":["医療費","高齢者医療","公平性"],"axis_x_label":"世代間公平↔高齢者保護","axis_y_label":"自己負担への許容","pro_label":"3割にするべき","pro_description":"現役世代との公平性や制度維持を重視すべき","con_label":"負担増は避けるべき","con_description":"高齢者の受診控えや生活負担を増やすべきでない","reason_tags":["世代間公平","制度維持","受診控え","生活負担","低所得高齢者","医療費抑制"]},{"slug":"antibiotics-for-common-cold","title":"風邪に抗菌薬を\n使ってよい？","description":"風邪に抗菌薬（抗生物質）は必要だと思いますか？","field_tags":["感染症","抗菌薬適正使用","医療資源"],"axis_x_label":"患者の希望↔医学的必要性","axis_y_label":"薬剤耐性への懸念","pro_label":"使ってよい","pro_description":"症状強い場合などは、風邪にも使用してよい","con_label":"安易に使うべきでない","con_description":"効果が期待できない風邪への使用は避けるべき","reason_tags":["症状の早期改善","細菌感染の可能性","薬剤耐性","副作用","患者の希望","適正使用"]},{"slug":"prescription-in-private-practice","title":"自由診療なら\n何でも処方してもよい？","description":"患者の選択肢と、医師の専門的責任や安全性の境界について考える問いです。","field_tags":["自由診療","医療資源","マンジャロ問題"],"axis_x_label":"患者の自由↔医師の責任","axis_y_label":"安全性・規制の重視","pro_label":"幅広く認めてよい","pro_description":"自由診療では患者の希望を尊重すべき","con_label":"一定の制限が必要","con_description":"自由診療でも安全性と医学的妥当性を優先すべき","reason_tags":["患者の自己決定","医師の裁量","安全性","医学的根拠","説明と同意","利益優先への懸念"]},{"slug":"liberalization-of-medical-advertising","title":"医療広告は\nもっと自由にすべき？","description":"患者が情報を得る機会と、誇大広告や誤解を招く情報のリスクについて考える問いです。","field_tags":["医療広告","情報提供"],"axis_x_label":"情報発信の自由↔患者保護","axis_y_label":"広告規制への支持","pro_label":"もっと自由にすべき","pro_description":"患者が医療機関を比較できる情報を増やすべき","con_label":"慎重に規制すべき","con_description":"誇大広告や不適切な誘導から患者を守るべき","reason_tags":["患者の知る権利","医療機関の比較","誇大広告","情報の信頼性","患者の誘導","競争の促進"]},{"slug":"taking-medicine-with-side-effects","title":"副作用がある薬でも\n必要なら使用するべき？","description":"治療によって得られる効果と、副作用による負担をどのように比較するかを考える問いです。","field_tags":["副作用","医療安全","リスク評価"],"axis_x_label":"治療効果↔副作用の回避","axis_y_label":"治療リスクへの許容","pro_label":"効果がリスクを上回るなら飲むべき","pro_description":"必要な治療なら副作用の可能性があっても受け入れる","con_label":"無理に飲むべきでない","con_description":"副作用が少しでもあるなら慎重になるべき","reason_tags":["治療効果","副作用の重さ","生活の質","病気の深刻さ","代替治療","本人の意思"]},{"slug":"license-revocation-for-medical-errors","title":"医療ミスをした医師は\n免許剥奪すべき？","description":"医療ミスを無くすためには、処分を重くするべきでしょうか？","field_tags":["医療事故","医療安全"],"axis_x_label":"厳しい責任追及↔再発防止と改善","axis_y_label":"処分の厳格さ","pro_label":"剥奪すべき","pro_description":"患者の安全と医療への信頼を守るため厳しく処分するべき","con_label":"慎重に判断すべき","con_description":"原因や故意・過失の程度を個別に判断すべき","reason_tags":["患者の安全","医師の責任","過失の程度","再発防止","組織的要因","萎縮医療"]},{"slug":"expansion-of-telemedicine","title":"オンライン診療を\nもっと増やすべき？","description":"医療へのアクセス向上と、対面でなければ得にくい診療情報について考える問いです。","field_tags":["オンライン診療","医療資源","医療DX"],"axis_x_label":"利便性↔対面診療の確実性","axis_y_label":"デジタル医療への期待","pro_label":"もっと増やすべき","pro_description":"通院の負担を減らし医療へのアクセスを改善すべき","con_label":"慎重にするべき","con_description":"対面でないとわからないことが多く、慎重にするべき","reason_tags":["通院負担","地域格差","診察精度","見逃しのリスク","デジタル格差","感染対策"]},{"slug":"ai-medical-diagnosis","title":"AIに診断を\n任せてもよい？","description":"AIによる診断支援の可能性と、誤診時の責任や人間の判断の必要性について考える問いです。","field_tags":["医療AI","医療DX"],"axis_x_label":"技術への期待↔人間による判断","axis_y_label":"AIへの信頼","pro_label":"どんどん任せてよい","pro_description":"精度が確認された領域ではAIを積極的に活用すべき","con_label":"一定は人間がするべき","con_description":"診断の責任や患者ごとの事情など、人間が最終判断すべき","reason_tags":["診断精度","医師不足","見落とし防止","責任の所在","患者との対話","AIへの不信"]},{"slug":"legalization-of-active-euthanasia","title":"積極的安楽死を\n認めるべき？","description":"治療の見込みがない場合、耐えがたい苦痛から逃れる選択と、生命保護や制度の濫用リスクについて考える問いです。","field_tags":["安楽死","終末期医療","人生会議","倫理"],"axis_x_label":"生命の保護↔自己決定","axis_y_label":"制度化への許容","pro_label":"条件付きで認めるべき","pro_description":"本人の明確な意思と耐えがたい苦痛がある場合ならば認める","con_label":"認めるべきでない","con_description":"生命保護と濫用防止を優先し別の支援を充実させる","reason_tags":["本人の自己決定","耐えがたい苦痛","生命の尊重","制度の濫用","家族への影響","緩和ケア"]},{"slug":"shorter-consultations-to-reduce-waiting","title":"待ち時間を短くするために\n診察時間を短縮すべき？","description":"多くの患者を早く診察することと、一人ひとりに丁寧な診療を行うことのバランスを考える問いです。","field_tags":["待ち時間","診察時間","医療資源"],"axis_x_label":"診療効率↔診療の丁寧さ","axis_y_label":"時間短縮への支持","pro_label":"ある程度短縮すべき","pro_description":"診療を効率化して全体の待ち時間を減らすべき","con_label":"診察時間を守るべき","con_description":"待ち時間より十分な説明と診察を優先すべき","reason_tags":["待ち時間","診療の丁寧さ","説明不足","医療現場の効率","患者数","診療内容による調整"]},{"slug":"personal-responsibility-medical-costs","title":"自己責任の病気は\n医療費を本人負担にすべき？","description":"喫煙者の肺癌や生活習慣病など、本人に原因がある医療費は本人負担にすべきだと思いますか？","field_tags":["医療費","公平性"],"axis_x_label":"個人の責任↔社会による保障","axis_y_label":"本人負担への許容","pro_label":"自己負担割合を増やすべき","pro_description":"本人による原因には一定の責任を求めるべき","con_label":"差を生むべきではない","con_description":"原因に関わらず、保険料や窓口負担は一定にすべき","reason_tags":["本人の責任","疾患原因の複雑さ","医療費の公平性","予防への動機","経済格差","受診控え","スティグマ"]}]'::jsonb) as x(
  slug text,
  title text,
  description text,
  field_tags jsonb,
  axis_x_label text,
  axis_y_label text,
  pro_label text,
  pro_description text,
  con_label text,
  con_description text,
  reason_tags jsonb
);

insert into debate_questions (
  slug, title, description, field_tags, axis_x_label, axis_y_label, is_active
)
select
  slug, title, description, field_tags, axis_x_label, axis_y_label, true
from debate_catalog_sync
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  field_tags = excluded.field_tags,
  axis_x_label = excluded.axis_x_label,
  axis_y_label = excluded.axis_y_label,
  is_active = true;

insert into debate_choices (
  question_id, side, label, description, color, sort_order
)
select
  q.id, choice.side, choice.label, choice.description, choice.color, choice.sort_order
from debate_catalog_sync seed
join debate_questions q on q.slug = seed.slug
cross join lateral (
  values
    ('pro', seed.pro_label, seed.pro_description, 'blue', 1),
    ('con', seed.con_label, seed.con_description, 'red', 2)
) as choice(side, label, description, color, sort_order)
on conflict (question_id, side) do update set
  label = excluded.label,
  description = excluded.description,
  color = excluded.color,
  sort_order = excluded.sort_order;

delete from debate_question_reason_tag_seeds tags
using debate_questions q, debate_catalog_sync seed
where tags.question_id = q.id
  and q.slug = seed.slug;

insert into debate_question_reason_tag_seeds (question_id, tag, sort_order)
select
  q.id, tags.tag, tags.ordinality::int
from debate_catalog_sync seed
join debate_questions q on q.slug = seed.slug
cross join lateral jsonb_array_elements_text(seed.reason_tags)
  with ordinality as tags(tag, ordinality);

commit;

select
  q.slug,
  q.title,
  count(distinct c.id) as choice_count,
  count(distinct t.id) as seed_tag_count
from debate_questions q
left join debate_choices c on c.question_id = q.id
left join debate_question_reason_tag_seeds t on t.question_id = q.id
where q.slug in ('life-support-treatment','physical-restraint','aed-for-collapsed-woman','paid-ambulance','elderly-copayment-30-percent','antibiotics-for-common-cold','prescription-in-private-practice','liberalization-of-medical-advertising','taking-medicine-with-side-effects','license-revocation-for-medical-errors','expansion-of-telemedicine','ai-medical-diagnosis','legalization-of-active-euthanasia','shorter-consultations-to-reduce-waiting','personal-responsibility-medical-costs')
group by q.id, q.slug, q.title
order by q.slug;
