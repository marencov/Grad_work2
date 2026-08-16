const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "hooks", "useDebateQuestion.js");
const source = fs.readFileSync(sourcePath, "utf8");
const catalogDeclaration = source.indexOf("DEBATE_QUESTION_CATALOG");
const arrayStart = source.indexOf("[", catalogDeclaration);
const arrayEnd = source.indexOf("\n];", arrayStart) + 2;

if (catalogDeclaration < 0 || arrayStart < 0 || arrayEnd < 2) {
  throw new Error("DEBATE_QUESTION_CATALOG could not be found.");
}

const context = {};
vm.runInNewContext(`catalog = ${source.slice(arrayStart, arrayEnd)}`, context);

const catalog = context.catalog;
if (!Array.isArray(catalog) || catalog.length === 0) {
  throw new Error("DEBATE_QUESTION_CATALOG is empty.");
}

const slugs = new Set();
for (const question of catalog) {
  if (!question.slug || slugs.has(question.slug)) {
    throw new Error(`Invalid or duplicate slug: ${question.slug}`);
  }
  if (!question.choices?.pro || !question.choices?.con) {
    throw new Error(`Both choices are required: ${question.slug}`);
  }
  slugs.add(question.slug);
}

const payload = catalog.map((question) => ({
  slug: question.slug,
  title: question.title,
  description: question.description,
  field_tags: question.fieldTags ?? [],
  axis_x_label: question.axisXLabel,
  axis_y_label: question.axisYLabel,
  pro_label: question.choices.pro.label,
  pro_description: question.choices.pro.description,
  con_label: question.choices.con.label,
  con_description: question.choices.con.description,
  reason_tags: question.reasonTagSeeds ?? [],
}));

const jsonSqlLiteral = JSON.stringify(payload).replaceAll("'", "''");

const sql = `
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
from jsonb_to_recordset('${jsonSqlLiteral}'::jsonb) as x(
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
where q.slug in (${payload.map(({ slug }) => `'${slug.replaceAll("'", "''")}'`).join(",")})
group by q.id, q.slug, q.title
order by q.slug;
`.trim();

const outputIndex = process.argv.indexOf("--output");
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;

if (outputPath) {
  fs.writeFileSync(path.resolve(projectRoot, outputPath), `${sql}\n`, "utf8");
} else {
  process.stdout.write(sql);
}
