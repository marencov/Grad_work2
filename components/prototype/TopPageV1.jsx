"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  DEBATE_QUESTION_CATALOG,
  useDebateQuestion,
  useDebateTopics,
} from "@/hooks/useDebateQuestion";
import styles from "@/components/prototype/TopPageV1.module.css";
import CreatorOpinionContent from "@/components/creator-opinion/CreatorOpinionContent";
import SiteHeader from "@/components/SiteHeader";

const BASE_PATH = "/CrossTalk";

const ASSETS = {
  logo: assetPath("/images/CrossTalkLogo.svg"),
  hero: assetPath("/images/Hero.png"),
  icon: assetPath("/images/icons/icon_money.svg"),
};

const ATTRIBUTE_FIELDS = [
  {
    key: "ageGroup",
    label: "年代",
    options: ["10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代", "90代以上", "回答しない"],
  },
  {
    key: "gender",
    label: "性別",
    options: ["男性", "女性", "その他", "回答しない"],
  },
  {
    key: "medicalExperience",
    label: "医療・介護従事者ですか？",
    options: ["はい", "いいえ", "回答しない"],
  },
  {
    key: "caregivingExperience",
    label: "身近な人の治療・介護に関わった経験",
    options: ["ある", "ない", "回答しない"],
  },
];

const AGE_GROUP_ORDER = ATTRIBUTE_FIELDS.find((field) => field.key === "ageGroup").options.slice(0, 9);
const MEDICAL_WORKER_VALUES = ATTRIBUTE_FIELDS.find((field) => field.key === "medicalExperience").options;
const CARE_EXPERIENCE_VALUES = ATTRIBUTE_FIELDS.find((field) => field.key === "caregivingExperience").options;
const MEDICAL_PROFESSIONS = [
  "医師",
  "看護師",
  "リハビリ科",
  "検査・放射線技師",
  "医療事務",
  "介護職",
  "薬剤師",
  "医療系学生",
  "その他",
  "回答しない",
];

const TEXT_MINING_KEYWORDS = [
  "延命", "延命治療", "生命", "生命維持", "治療", "医療", "技術", "回復", "可能性",
  "苦痛", "痛み", "苦しみ", "緩和", "自然", "自然経過", "尊厳", "本人", "意思",
  "家族", "時間", "生活", "生活の質", "QOL", "負担", "判断", "介護", "看取り",
  "穏やか", "無用", "できる限り", "本人らしさ", "選択", "希望",
];

const TEXT_MINING_STOP_WORDS = new Set([
  "こと", "もの", "ため", "よう", "それ", "これ", "どれ", "そこ", "ここ",
  "する", "いる", "ある", "なる", "思う", "です", "ます", "から", "ので",
]);

const TOPIC_CARDS = [
  {
    title: "延命医療は\nされるべき？",
    answers: "9,215",
    leftLabel: "義務化すべき",
    rightLabel: "任意にすべき",
    leftPercent: 48,
    rightPercent: 52,
    tags: ["医療", "社会", "投票"],
  },
  {
    title: "自由診療は\nどこまでやってよい？",
    answers: "9,215",
    leftLabel: "義務化すべき",
    rightLabel: "任意にすべき",
    leftPercent: 48,
    rightPercent: 52,
    tags: ["医療", "社会", "投票"],
  },
  {
    title: "救急車は\n有料化すべき？",
    answers: "9,215",
    leftLabel: "義務化すべき",
    rightLabel: "任意にすべき",
    leftPercent: 48,
    rightPercent: 52,
    tags: ["医療", "社会", "投票"],
  },
  {
    title: "身体拘束は\nやってもよい？",
    answers: "9,215",
    leftLabel: "義務化すべき",
    rightLabel: "任意にすべき",
    leftPercent: 48,
    rightPercent: 52,
    tags: ["医療", "社会", "投票"],
  },
];

const CATEGORY_CARDS = [
  { label: "医療費の負担", subtitle: "公平性と負担のあり方", count: "8,317" },
  { label: "終末期医療", subtitle: "本人・家族・医療の対話", count: "8,317" },
  { label: "予防接種", subtitle: "個人の自由と社会の安全", count: "8,317" },
  { label: "医療AI", subtitle: "技術と人の判断", count: "8,317" },
  { label: "介護と家族", subtitle: "支える人の現実", count: "8,317" },
  { label: "地域医療", subtitle: "住む場所で変わる安心", count: "8,317" },
];

function assetPath(path) {
  return `${BASE_PATH}${path}`;
}

export default function TopPageV1() {
  const [selectedQuestionSlug, setSelectedQuestionSlug] = useState("life-support-treatment");
  const debate = useDebateQuestion(selectedQuestionSlug);
  const topics = useDebateTopics();

  useEffect(() => {
    const applySlugFromUrl = () => {
      const requestedSlug = new URLSearchParams(window.location.search).get("slug");
      const isKnownSlug = DEBATE_QUESTION_CATALOG.some(({ slug }) => slug === requestedSlug);
      if (!requestedSlug) {
        setSelectedQuestionSlug("life-support-treatment");
        return;
      }
      if (!isKnownSlug) return;

      setSelectedQuestionSlug(requestedSlug);
      window.setTimeout(() => {
        document.getElementById("question")?.scrollIntoView({ block: "start" });
      }, 80);
    };

    applySlugFromUrl();
    window.addEventListener("popstate", applySlugFromUrl);
    return () => window.removeEventListener("popstate", applySlugFromUrl);
  }, []);

  const selectTopic = (slug) => {
    setSelectedQuestionSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("slug", slug);
    url.hash = "question";
    window.history.pushState({ slug }, "", url);
    window.setTimeout(() => {
      document.getElementById("question")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  return (
    <main className={styles.page}>
      <SiteHeader />
      <Hero />
      <HotTopics topics={topics} selectedSlug={selectedQuestionSlug} onSelectTopic={selectTopic} />
      <Categories />
      <ScrollytellingGeneral
        debate={debate}
        topics={topics}
        selectedSlug={selectedQuestionSlug}
        onSelectTopic={selectTopic}
      />
      <Toast message={debate.message || debate.error} tone={debate.error ? "error" : "success"} />
    </main>
  );
}

function Hero() {
  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroText}>
        <h1 className={styles.heroTitle}>
          <span className={styles.desktopHeroTitleLine}>医療の「ちがい」を集めて</span>
          <span className={styles.desktopHeroTitleLine}>よりよい対話をつくろう</span>
          <span className={styles.mobileHeroTitleLine}>みんなの考え</span>
          <span className={styles.mobileHeroTitleLine}>見てみよう</span>
        </h1>
        <p>
          あなたはどちらの意見ですか？
          <br />
          みんなの意見が、医療の未来を考えるヒントになります。
        </p>
      </div>
      <figure className={styles.heroImageCard}>
        <img src={ASSETS.hero} alt="医療対話を表すヒーロービジュアル" />
      </figure>
    </section>
  );
}

function HotTopics({ topics, selectedSlug, onSelectTopic }) {
  const [showAllTopics, setShowAllTopics] = useState(false);
  const initialTopicCount = 10;

  const visibleTopics = showAllTopics ? topics : topics.slice(0, initialTopicCount);
  const hasMoreTopics = visibleTopics.length < topics.length;

  return (
    <section id="topics" className={styles.contentBand}>
      <TopicSectionHeading
        title="今みんなが答えている話題"
        actionLabel={showAllTopics ? "少なく見る →" : "すべて見る →"}
        onAction={() => setShowAllTopics((current) => !current)}
        showAction={hasMoreTopics || showAllTopics}
      />
      <div className={styles.topicGrid}>
        {visibleTopics.map((topic) => (
          <TopicCard
            key={topic.slug || topic.title}
            topic={topic}
            isActive={selectedSlug === topic.slug}
            onSelect={() => onSelectTopic(topic.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function TopicCard({ topic, isActive = false, onSelect }) {
  return (
    <article
      className={`${styles.topicCard} ${isActive ? styles.topicCardActive : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <h3>{renderBreakLines(topic.title)}</h3>
      <div className={styles.topicChoiceLabels}>
        <span>{topic.leftLabel}</span>
        <span>{topic.rightLabel}</span>
      </div>
      <ResultSplit left={topic.leftPercent} right={topic.rightPercent} />
      <div className={styles.topicCardFooter}>
        <span>{topic.leftPercent}%</span>
        <span>{topic.rightPercent}%</span>
      </div>
      <div className={styles.topicTags}>
        {topic.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <p>{Number(topic.answers ?? 0).toLocaleString("ja-JP")}人が回答</p>
    </article>
  );
}

function renderBreakLines(value) {
  return String(value || "")
    .split(/\n|<br\s*\/?>/i)
    .map((line, index) => (
      <Fragment key={`${line}-${index}`}>
        {index > 0 ? <br /> : null}
        {line}
      </Fragment>
    ));
}

function Categories() {
  return (
    <section className={styles.contentBand}>
      <SectionHeading title="話題のテーマ" href="#topics" />
      <div className={styles.categoryGrid}>
        {CATEGORY_CARDS.map((category) => (
          <article className={styles.categoryCard} key={category.label}>
            <PrototypeIcon />
            <div>
              <h3>{category.label}</h3>
              <p>{category.subtitle}</p>
              <strong>{category.count}</strong>
            </div>
          </article>
        ))}
      </div>
      <a className={styles.startLink} href="#question">
        さっそくはじめてみましょう！
      </a>
    </section>
  );
}

function ScrollytellingGeneral({ debate, topics, selectedSlug, onSelectTopic }) {
  return (
    <section id="question" className={styles.scrollytelling}>
      <div className={styles.snapStory}>
        <QuestionMainSection debate={debate} />
        <AnswerMainSection debate={debate} />
        <AttributeCollectorSection debate={debate} />
        <ReasonInputSection debate={debate} />
      </div>
      <DetailResultsSection debate={debate} />
      <HighlightedOpinionsSection debate={debate} />
      <AITagMapSection debate={debate} />
      <CreatorOpinionSection questionSlug={selectedSlug} />
      <FinalEvaluationSection debate={debate} />
      <MoreTopicsSection
        topics={topics}
        selectedSlug={selectedSlug}
        onSelectTopic={onSelectTopic}
      />
    </section>
  );
}

function QuestionMainSection({ debate }) {
  return (
    <section className={`${styles.snapSection} ${styles.questionSection}`}>
      <div className={styles.questionStack}>
        <QuestionHeader question={debate.question} />
        <div className={styles.choicePanel}>
          {debate.choices.map((choice, index) => (
            <Fragment key={choice.id}>
              {index === 1 ? (
                <span className={styles.orBadge} key="or">
                  or
                </span>
              ) : null}
              <ChoiceCard
                choice={choice}
                isSelected={debate.selectedResponse?.choiceSide === choice.side}
                isBusy={debate.status === "saving-choice"}
                onSelect={async () => {
                  const saved = await debate.selectChoice(choice);
                  if (saved) {
                    document.getElementById("answer-result")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              />
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionHeader({ question }) {
  return (
    <div className={styles.questionHeader}>
      <p className={styles.eyebrow}>Question</p>
      <h2>{renderBreakLines(question.title)}</h2>
      <p>{question.description || "正解のない問いです。まずは直感で選んでください。"}</p>
    </div>
  );
}

function ChoiceCard({ choice, isSelected, isBusy, onSelect }) {
  const colorClass = choice.side === "pro" ? styles.blue : styles.red;
  return (
    <button
      className={`${styles.choiceCard} ${colorClass} ${isSelected ? styles.choiceCardSelected : ""}`}
      type="button"
      disabled={isBusy}
      onClick={onSelect}
    >
      <strong>{choice.label}</strong>
      <span>{choice.description}</span>
    </button>
  );
}

function AnswerMainSection({ debate }) {
  const proChoice = debate.choices.find((choice) => choice.side === "pro");
  const conChoice = debate.choices.find((choice) => choice.side === "con");
  const proPercent = getPercent(debate.counts.pro, debate.counts.total);
  const conPercent = debate.counts.total ? 100 - proPercent : 0;

  return (
    <section id="answer-result" className={styles.snapSection}>
      <div className={styles.answerPanel}>
        <h2 className={styles.answerTitle}>みんなの回答結果</h2>
        <div className={styles.bigPercentRow}>
          <strong className={styles.blueText}>{proPercent}%</strong>
          <span>vs</span>
          <strong className={styles.redText}>{conPercent}%</strong>
        </div>
        <ResultSplit left={proPercent} right={conPercent} />
        <div className={styles.resultMetaRow}>
          <ResultMeta label={proChoice?.label ?? "賛成派"} count={`${debate.counts.pro}件`} color="blue" />
          <ResultMeta label={conChoice?.label ?? "反対派"} count={`${debate.counts.con}件`} color="red" />
        </div>
        <button
          className={styles.scrollNextButton}
          type="button"
          onClick={() =>
            document.getElementById("attribute-collector")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          <span>詳しい理由を見る</span>
          <i aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function ResultMeta({ label, count, color }) {
  return (
    <div className={styles.resultMeta}>
      <strong className={styles[`${color}Text`]}>{label}</strong>
      <span>{count}</span>
    </div>
  );
}

function AttributeCollectorSection({ debate }) {
  const [attributes, setAttributes] = useState(
    debate.selectedResponse?.attributes ?? {},
  );

  useEffect(() => {
    setAttributes(debate.selectedResponse?.attributes ?? {});
  }, [debate.question.id, debate.selectedResponse?.id]);

  const updateAttribute = (key, value) => {
    setAttributes((current) => {
      const next = { ...current, [key]: value };
      if (key === "medicalExperience" && value !== "はい") {
        delete next.medicalProfession;
      }
      return next;
    });
  };

  const needsMedicalProfession = attributes.medicalExperience === "はい";
  const canContinue = !needsMedicalProfession || Boolean(attributes.medicalProfession);

  return (
    <section id="attribute-collector" className={styles.snapSection}>
      <div className={`${styles.attributeLayout} ${styles.attributeCollectorPanel}`}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>より詳しい解析のために</p>
          <h2>
            あなたについて
            <br />
            教えてください
          </h2>
          <p>
            より正確な分析のために、差し支えない範囲でご回答ください。
            <br />
            回答はボタンを押すだけで完了します。
          </p>
        </div>
        <div className={styles.attributePanel}>
          {ATTRIBUTE_FIELDS.map((field) => (
            <div className={styles.attributeGroup} data-field={field.key} key={field.key}>
              <h3>{field.label}</h3>
              <div className={styles.optionGrid}>
                {field.options.map((option) => (
                  <button
                    className={attributes[field.key] === option ? styles.selectedPill : ""}
                    type="button"
                    key={option}
                    onClick={() => updateAttribute(field.key, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {needsMedicalProfession ? (
            <div className={`${styles.attributeGroup} ${styles.medicalProfessionGroup}`}>
              <label htmlFor="medical-profession">具体的な職種</label>
              <select
                id="medical-profession"
                value={attributes.medicalProfession ?? ""}
                onChange={(event) => updateAttribute("medicalProfession", event.target.value)}
              >
                <option value="" disabled>職種を選んでください</option>
                {MEDICAL_PROFESSIONS.map((profession) => (
                  <option value={profession} key={profession}>{profession}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div className={styles.formActions}>
            <button
              type="button"
              disabled={!debate.ownResponseId || debate.status === "saving-attributes" || !canContinue}
              onClick={async () => {
                const saved = await debate.saveAttributes(debate.ownResponseId, attributes);
                if (saved) {
                  document.getElementById("reason-input")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
            >
              次へ
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReasonInputSection({ debate }) {
  const [reason, setReason] = useState(debate.selectedResponse?.reason ?? "");
  const selectedChoice = debate.choices.find(
    (choice) => choice.side === debate.selectedResponse?.choiceSide,
  );
  const isConChoice = selectedChoice?.side === "con";
  const colorClass = isConChoice ? styles.redText : styles.blueText;
  const selectedChoiceClass = isConChoice
    ? `${styles.selectedChoice} ${styles.selectedChoiceRed}`
    : styles.selectedChoice;

  useEffect(() => {
    setReason(debate.selectedResponse?.reason ?? "");
  }, [debate.question.id, debate.selectedResponse?.id]);

  return (
    <section id="reason-input" className={styles.snapSection}>
      <div className={`${styles.reasonLayout} ${styles.reasonInputPanel}`}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>Reason</p>
          <h2>理由も聞かせて</h2>
          <p>
            一言でもOKです。具体的に書くほど、あとでみんなの意見として見えやすくなります。
          </p>
          <div className={selectedChoiceClass}>
            <span>あなたの選択</span>
            <strong className={colorClass}>{selectedChoice?.label ?? "未選択"}</strong>
          </div>
        </div>
        <form
          className={styles.reasonForm}
          onSubmit={(event) => {
            event.preventDefault();
            document.getElementById("detail-results")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            window.requestAnimationFrame(() => {
              void debate.saveReasonAndAnalyze(debate.ownResponseId, reason);
            });
          }}
        >
          <label htmlFor="reason">なぜそう思いましたか？</label>
          <textarea
            id="reason"
            maxLength={500}
            value={reason}
            placeholder="気楽に書いてください。短いひとことでも大丈夫です。"
            onChange={(event) => setReason(event.target.value)}
          />
          <div className={styles.formMeta}>
            <span className={styles.privacyHint}>
              <span>個人を特定できる情報や、病院・施設名は書かないでください</span>
              <strong>送信後、個人情報が含まれる場合は自動で匿名化します</strong>
            </span>
            <span>{reason.length} / 500</span>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={() => setReason("")}>
              消す
            </button>
            <button
              type="submit"
              disabled={!debate.ownResponseId || !reason.trim() || debate.status === "analyzing"}
            >
              理由を送信
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function DetailResultsSection({ debate }) {
  const proPercent = getPercent(debate.counts.pro, debate.counts.total);
  const conPercent = debate.counts.total ? 100 - proPercent : 0;
  const proChoice = debate.choices.find((choice) => choice.side === "pro");
  const conChoice = debate.choices.find((choice) => choice.side === "con");
  const sideLabels = {
    pro: proChoice?.label ?? "賛成側",
    con: conChoice?.label ?? "反対側",
  };
  const byAge = createAgeSegmentRows(debate.responses);
  const attributePanels = createAttributeComparisonPanels(debate.responses, sideLabels);

  return (
    <section id="detail-results" className={styles.longSection}>
      <div className={styles.overallCard}>
        <h2>みんなの回答結果</h2>
        <div className={styles.overallSummary}>
          <strong className={styles.blueText}>{proPercent}%</strong>
          <strong className={styles.redText}>{conPercent}%</strong>
        </div>
        <ResultSplit left={proPercent} right={conPercent} />
        <div className={styles.resultMetaRow}>
          <ResultMeta label={sideLabels.pro} count={`${debate.counts.pro}件`} color="blue" />
          <ResultMeta label={sideLabels.con} count={`${debate.counts.con}件`} color="red" />
        </div>
      </div>
      <SegmentRows title="年代別の比較" rows={byAge} />
      <AttributeComparisonPanels panels={attributePanels} />
    </section>
  );
}

function AttributeComparisonPanels({ panels }) {
  return (
    <div className={styles.segmentGrid}>
      {panels.map((panel) => (
        <div className={styles.segmentCard} key={panel.title}>
          <h3>{panel.title}</h3>
          <div className={styles.segmentRows}>
            {panel.rows.map((row) => (
              <div className={styles.segmentNumberRow} key={row.label}>
                <span>
                  {row.label}
                  <small>n={row.total}</small>
                </span>
                <strong className={styles[row.majorityClass]}>
                  {row.majorityLabel}
                  <b>{row.majorityPercent}%</b>
                </strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentRows({ title, rows }) {
  return (
    <div className={styles.ageCard}>
      <h2>{title}</h2>
      <div className={styles.ageRows}>
        {rows.length ? (
          rows.map((row) => <AgeRow row={row} key={row.label} />)
        ) : (
          <p className={styles.emptyText}>属性つきの回答がまだありません。</p>
        )}
      </div>
    </div>
  );
}

function AgeRow({ row }) {
  const label = typeof row.total === "number" ? `${row.label}(n=${row.total})` : row.label;

  return (
    <div className={`${styles.ageRow} ${row.isEmpty ? styles.ageRowEmpty : ""}`}>
      <span>{label}</span>
      {row.isEmpty ? (
        <span className={styles.noAgeAnswer}>回答がありません</span>
      ) : (
        <>
          <strong className={styles.blueText}>{row.proPercent}%</strong>
          <ResultSplit left={row.proPercent} right={row.conPercent} />
          <strong className={styles.redText}>{row.conPercent}%</strong>
        </>
      )}
    </div>
  );
}

function HighlightedOpinionsSection({ debate }) {
  const [sortMode, setSortMode] = useState("popular");
  const [visibleCounts, setVisibleCounts] = useState({ pro: 3, con: 3 });
  const proChoice = debate.choices.find((choice) => choice.side === "pro");
  const conChoice = debate.choices.find((choice) => choice.side === "con");
  const sideLabels = {
    pro: proChoice?.label ?? "賛成側",
    con: conChoice?.label ?? "反対側",
  };
  const proOpinions = useMemo(
    () => sortResponses(debate.responses, sortMode, "pro"),
    [debate.responses, sortMode],
  );
  const conOpinions = useMemo(
    () => sortResponses(debate.responses, sortMode, "con"),
    [debate.responses, sortMode],
  );

  useEffect(() => {
    setVisibleCounts({ pro: 3, con: 3 });
  }, [debate.question.id, sortMode]);

  const showMoreOpinions = (side) => {
    setVisibleCounts((current) => ({
      ...current,
      [side]: current[side] + 3,
    }));
  };

  return (
    <section id="reasons" className={styles.longSection}>
      <SectionTitle
        title="みんなの理由"
        description="気になった意見には「なるほど」または「う〜ん」でリアクションできます。"
      />
      <OpinionSortBar
        sortMode={sortMode}
        onSortChange={setSortMode}
      />
      <div className={styles.opinionColumns}>
        <OpinionColumn
          title={sideLabels.pro}
          color="blue"
          opinions={proOpinions}
          visibleCount={visibleCounts.pro}
          onShowMore={() => showMoreOpinions("pro")}
          onReact={debate.reactToResponse}
          reactionHistory={debate.reactionHistory}
          questionSlug={debate.question.slug}
          sideLabels={sideLabels}
        />
        <OpinionColumn
          title={sideLabels.con}
          color="red"
          opinions={conOpinions}
          visibleCount={visibleCounts.con}
          onShowMore={() => showMoreOpinions("con")}
          onReact={debate.reactToResponse}
          reactionHistory={debate.reactionHistory}
          questionSlug={debate.question.slug}
          sideLabels={sideLabels}
        />
      </div>
    </section>
  );
}

function OpinionFilterBar({ sortMode, onSortChange }) {
  return (
    <div className={styles.filterBar}>
      <div>
        {[
          ["popular", "人気順"],
          ["standout", "AI注目順"],
          ["newest", "新着順"],
        ].map(([value, label]) => (
          <button
            className={sortMode === value ? styles.activeFilter : ""}
            type="button"
            key={value}
            onClick={() => onSortChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpinionSortBar({ sortMode, onSortChange }) {
  const options = [
    ["popular", "人気順"],
    ["newest", "新着順"],
    ["medical", "医療従事者"],
    ["age", "年代順"],
    ["tag", "理由タグ"],
  ];

  return (
    <div className={styles.filterBar}>
      <div>
        {options.map(([value, label]) => (
          <button
            className={sortMode === value ? styles.activeFilter : ""}
            type="button"
            key={value}
            onClick={() => onSortChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OpinionColumn({ title, color, opinions, visibleCount, onShowMore, onReact, reactionHistory, questionSlug, sideLabels }) {
  const visibleOpinions = opinions.slice(0, visibleCount);
  const hasMore = visibleCount < opinions.length;

  return (
    <div className={styles.opinionColumn}>
      <h3 className={styles[`${color}Text`]}>{title}</h3>
      <div className={styles.opinionList}>
        {opinions.length ? (
          <>
            {visibleOpinions.map((opinion) => (
              <OpinionCard
                opinion={opinion}
                color={color}
                onReact={(reaction) => onReact(opinion.id, reaction)}
                reactedWith={reactionHistory[`${questionSlug}:${opinion.id}`]}
                sideLabels={sideLabels}
                key={opinion.id}
              />
            ))}
            {hasMore ? (
              <button
                className={`${styles.columnMoreButton} ${styles[`${color}MoreButton`]}`}
                type="button"
                onClick={onShowMore}
              >
                もっと見る
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
          </>
        ) : (
          <p className={styles.emptyText}>理由文つきの回答がまだありません。</p>
        )}
      </div>
    </div>
  );
}

function OpinionCard({ opinion, color, onReact, reactedWith, sideLabels }) {
  const tags = opinion.analysis?.reasonTags ?? [];
  const attributeLabels = formatOpinionAttributes(opinion.attributes);
  return (
    <article className={styles.opinionCard}>
      <PrototypeIcon className={`${styles.avatar} ${styles[color]}`} />
      <div className={styles.opinionBody}>
        <p>{opinion.reason}</p>
        <small>
          {opinion.choiceSide === "pro" ? sideLabels.pro : sideLabels.con}
          {attributeLabels.length ? ` / ${attributeLabels.join(" / ")}` : " / 属性未回答"}
          {opinion.analysis?.summary ? ` / ${opinion.analysis.summary}` : ""}
        </small>
        <div className={styles.opinionBottom}>
          <div className={styles.tagRow}>
            {tags.map((tag) => (
              <span className={styles[`${color}Tag`]} key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className={styles.reactionButtons} aria-label="この意見へのリアクション">
            <button
              className={reactedWith === "naruhodo" || reactedWith === "like" ? `${styles.reactedButton} ${styles[`${color}ReactedButton`]}` : ""}
              type="button"
              onClick={() => onReact("naruhodo")}
              disabled={Boolean(reactedWith)}
            >
              なるほど {opinion.likes}
            </button>
            <button
              className={reactedWith === "hmm" ? `${styles.reactedButton} ${styles[`${color}ReactedButton`]}` : ""}
              type="button"
              onClick={() => onReact("hmm")}
              disabled={Boolean(reactedWith)}
            >
              う〜ん {opinion.hmms ?? 0}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatOpinionAttributes(attributes = {}) {
  const isAnswered = (value) => value && value !== "回答しない";
  const labels = [];

  if (isAnswered(attributes.ageGroup)) labels.push(attributes.ageGroup);
  if (isAnswered(attributes.gender)) labels.push(attributes.gender);
  if (isAnswered(attributes.medicalProfession)) labels.push(attributes.medicalProfession);

  return labels;
}

function AITagMapSection({ debate }) {
  const topTags = getTopTags(debate);
  const scatterPoints = getScatterPoints(debate);
  const textMiningWords = createTextMiningWords(debate.responses);
  const proChoice = debate.choices.find((choice) => choice.side === "pro");
  const conChoice = debate.choices.find((choice) => choice.side === "con");
  const sideLabels = {
    pro: proChoice?.label ?? "賛成側",
    con: conChoice?.label ?? "反対側",
  };

  return (
    <section id="map" className={styles.longSection}>
      <SectionTitle
        title="AIタグで見る意見の地図"
        description="理由タグとAI軸スコアから、立場ごとの偏りと意見の集中を可視化します。"
      />
      <div className={styles.visualGrid}>
        <RadarCard tags={topTags} sideLabels={sideLabels} />
        <ScatterCard
          points={scatterPoints}
          axisXLabel="侵襲的↔緩和的"
          axisYLabel={debate.question.axisYLabel}
          sideLabels={sideLabels}
        />
      </div>
      <TextMiningCard words={textMiningWords} />
      <AIAnalysisCardDynamic snapshot={debate.snapshot} />
    </section>
  );
}

function CreatorOpinionSection({ questionSlug }) {
  return (
    <section className={styles.longSection}>
      <div className={styles.creatorOpinionPanel}>
        <CreatorOpinionContent questionSlug={questionSlug} />
      </div>
    </section>
  );
}

const FINAL_OPINION_OPTIONS = [
  ["same", "やっぱり最初と同じ意見"],
  ["understanding_deepened", "考えは同じ。でも相手意見への理解は深まった"],
  ["became_uncertain", "どちらともいえなくなった"],
  ["switched_side", "逆の考えに変わった"],
];

function FinalEvaluationSection({ debate }) {
  const savedAttributes = debate.selectedResponse?.attributes ?? {};
  const [pageHelpful, setPageHelpful] = useState(savedAttributes.pageHelpful ?? "");
  const [finalOpinionChange, setFinalOpinionChange] = useState(savedAttributes.finalOpinionChange ?? "");
  const [showFeedback, setShowFeedback] = useState(Boolean(savedAttributes.pageFeedback));
  const [pageFeedback, setPageFeedback] = useState(savedAttributes.pageFeedback ?? "");
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const initialSide = debate.selectedResponse?.choiceSide ?? "pro";
  const initialColor = initialSide === "con" ? "red" : "blue";
  const oppositeColor = initialSide === "con" ? "blue" : "red";

  useEffect(() => {
    setPageHelpful(savedAttributes.pageHelpful ?? "");
    setFinalOpinionChange(savedAttributes.finalOpinionChange ?? "");
    setShowFeedback(Boolean(savedAttributes.pageFeedback));
    setPageFeedback(savedAttributes.pageFeedback ?? "");
    setEvaluationMessage("");
  }, [debate.question.id, debate.selectedResponse?.id]);

  const getOpinionTone = (value) => {
    if (value === "same") return initialColor;
    if (value === "switched_side") return oppositeColor;
    if (value === "understanding_deepened") return "mixed";
    return "neutral";
  };

  return (
    <section id="final-evaluation" className={styles.longSection}>
      <div className={styles.finalEvaluationPanel}>
        <div className={styles.finalEvaluationHeader}>
          <p className={styles.eyebrow}>最後に</p>
          <h2>この問いはいかがでしたか？</h2>
        </div>

        <div className={styles.evaluationBlock}>
          <h3>このページは参考になりましたか？</h3>
          <div className={styles.helpfulChoices}>
            {[["helpful", "参考になった"], ["not_helpful", "参考にならなかった"]].map(([value, label]) => (
              <button
                className={pageHelpful === value ? styles.evaluationSelected : ""}
                type="button"
                onClick={() => {
                  setPageHelpful(value);
                  setEvaluationMessage(
                    value === "helpful"
                      ? "ありがとうございました！"
                      : "率直なご意見、参考になります。",
                  );
                  void debate.saveFinalEvaluation(debate.ownResponseId, {
                    pageHelpful: value,
                    finalOpinionChange: finalOpinionChange || undefined,
                  });
                }}
                disabled={!debate.ownResponseId || debate.status === "saving-evaluation"}
                key={value}
              >
                <FinalEvaluationIcon type={value} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button
            className={`${styles.feedbackToggle} ${showFeedback ? styles.feedbackToggleActive : ""}`}
            type="button"
            onClick={() => setShowFeedback((current) => !current)}
          >
            <FinalEvaluationIcon type="feedback" />
            <span>その他・自由回答</span>
            <b aria-hidden="true">{showFeedback ? "−" : "＋"}</b>
          </button>
          {showFeedback ? (
            <label className={styles.feedbackField}>
              <span>感想や気になったことがあれば教えてください（任意）</span>
              <textarea
                value={pageFeedback}
                maxLength={500}
                onChange={(event) => setPageFeedback(event.target.value)}
                placeholder="例：いろいろな立場の理由を比較できたのがよかった"
              />
              <div className={styles.feedbackActions}>
                <small>{pageFeedback.length} / 500</small>
                <button
                  type="button"
                  disabled={!debate.ownResponseId || !pageFeedback.trim() || debate.status === "saving-evaluation"}
                  onClick={async () => {
                    const saved = await debate.saveFinalEvaluation(debate.ownResponseId, { pageFeedback });
                    if (saved) setEvaluationMessage("詳しく教えていただき、ありがとうございます！");
                  }}
                >
                  自由回答を送る
                </button>
              </div>
            </label>
          ) : null}
        </div>

        <div className={styles.evaluationBlock}>
          <h3>今の気持ちは？</h3>
          <div className={styles.finalOpinionChoices}>
            {FINAL_OPINION_OPTIONS.map(([value, label]) => {
              const tone = getOpinionTone(value);
              return (
                <button
                  className={`${styles.finalOpinionChoice} ${styles[`${tone}OpinionChoice`]} ${finalOpinionChange === value ? styles.finalOpinionSelected : ""}`}
                  type="button"
                  onClick={() => {
                    setFinalOpinionChange(value);
                    setEvaluationMessage({
                      same: "今の気持ちを教えていただき、ありがとうございます！",
                      understanding_deepened: "新しい気づきを教えていただき、ありがとうございます！",
                      became_uncertain: "正直な気持ちを教えていただき、ありがとうございます！",
                      switched_side: "考えの変化を教えていただき、ありがとうございます！",
                    }[value]);
                    void debate.saveFinalEvaluation(debate.ownResponseId, {
                      pageHelpful: pageHelpful || undefined,
                      finalOpinionChange: value,
                    });
                  }}
                  disabled={!debate.ownResponseId || debate.status === "saving-evaluation"}
                  key={value}
                >
                  <i aria-hidden="true" />
                  <FinalEvaluationIcon type={value} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {evaluationMessage ? (
          <p className={styles.evaluationSaved} role="status">{evaluationMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

function FinalEvaluationIcon({ type }) {
  const paths = {
    feedback: <><path d="M4 5.5h16v11H9l-5 4v-15Z" /><path d="M8 10h8M8 13h5" /></>,
    helpful: <><path d="M7 10v10H4V10h3Z" /><path d="M7 18h10.3a2 2 0 0 0 1.9-1.4l1.4-4.5A2 2 0 0 0 18.7 9H15l.5-2.6A2 2 0 0 0 13.5 4L9 10H7" /></>,
    not_helpful: <><path d="M7 14V4H4v10h3Z" /><path d="M7 6h10.3a2 2 0 0 1 1.9 1.4l1.4 4.5a2 2 0 0 1-1.9 2.6H15l.5 2.6a2 2 0 0 1-2 2.4L9 14H7" /></>,
    same: <><path d="M5 12a7 7 0 1 0 2-4.9" /><path d="M5 4v5h5" /></>,
    understanding_deepened: <><path d="M9 18h6M10 21h4" /><path d="M8.3 15.5A7 7 0 1 1 15.7 15.5c-1 .7-1.2 1.4-1.2 2.5h-5c0-1.1-.2-1.8-1.2-2.5Z" /><path d="M12 6v5l3 2" /></>,
    became_uncertain: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.1 2.3c-.9.4-.9 1-.9 1.7M12 17h.01" /></>,
    switched_side: <><path d="M4 7h13" /><path d="m14 4 3 3-3 3" /><path d="M20 17H7" /><path d="m10 14-3 3 3 3" /></>,
  };

  return (
    <svg className={styles.evaluationIcon} viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function MoreTopicsSection({ topics, selectedSlug, onSelectTopic }) {
  const otherTopics = topics.filter((topic) => topic.slug !== selectedSlug);

  return (
    <section className={styles.longSection}>
      <SectionTitle title="他の話題も回答しよう" description="" />
      <div className={`${styles.topicGrid} ${styles.moreTopicGrid}`}>
        {otherTopics.map((topic) => (
          <TopicCard
            key={topic.slug || topic.title}
            topic={topic}
            onSelect={() => onSelectTopic(topic.slug)}
          />
        ))}
      </div>
    </section>
  );
}

function RadarCard({ tags, sideLabels }) {
  const polygon = createRadarPolygon(tags, "pro");
  const redPolygon = createRadarPolygon(tags, "con");
  const labelPositions = createRadarLabelPositions(tags.length || 6);

  return (
    <article className={styles.visualCard}>
      <h3>タグ軸で見る意見の偏り</h3>
      <p>上位6つの理由タグについて、賛成派・反対派それぞれの出現数を比較します。</p>
      <svg className={styles.radarSvg} viewBox="0 0 474 360" role="img" aria-label="タグ分布のレーダーチャート">
        {[0.33, 0.66, 1].map((scale) => (
          <polygon points={createRadarGrid(tags.length || 6, scale)} key={scale} />
        ))}
        <path d={polygon} className={styles.radarBlue} />
        <path d={redPolygon} className={styles.radarRed} />
        {(tags.length ? tags : createEmptyTags()).map((tag, index) => (
          <text key={tag.tag} x={labelPositions[index].x} y={labelPositions[index].y}>
            {tag.tag}
          </text>
        ))}
      </svg>
      <Legend sideLabels={sideLabels} />
    </article>
  );
}

function ScatterCard({ points, axisXLabel, axisYLabel, sideLabels }) {
  const [activePoint, setActivePoint] = useState(null);
  const displayAxisXLabel = "侵襲的↔緩和的";

  return (
    <article className={`${styles.visualCard} ${styles.scatterCard}`}>
      <h3>意見の集中マップ</h3>
      <p>
        横軸は{axisXLabel}、縦軸は{axisYLabel}。円の大きさはいいね数です。
      </p>
      <svg className={styles.scatterSvg} viewBox="0 0 594 380" role="img" aria-label="意見の散布図">
        <line x1="36" y1="190" x2="558" y2="190" />
        <line x1="297" y1="34" x2="297" y2="346" />
        <g className={styles.scatterAxisLabels}>
          <title>{displayAxisXLabel}</title>
          <text x="297" y="26" textAnchor="middle">{axisYLabel} 高</text>
          <text x="297" y="366" textAnchor="middle">{axisYLabel} 低</text>
          <text x="44" y="178" textAnchor="start">侵襲的・生命維持を重視</text>
          <text x="550" y="178" textAnchor="end">緩和的・苦痛軽減を重視</text>
        </g>
        <text x="18" y="30">苦痛の回避・自然経過</text>
        <text x="394" y="30">尊厳・医療技術への期待</text>
        <text x="216" y="360">{axisXLabel}</text>
        {points.map((point) => (
          <circle
            className={point.side === "pro" ? styles.scatterBlue : styles.scatterRed}
            cx={point.x}
            cy={point.y}
            key={point.id}
            onBlur={() => setActivePoint(null)}
            onClick={() => setActivePoint(point)}
            onFocus={() => setActivePoint(point)}
            onMouseEnter={() => setActivePoint(point)}
            onMouseLeave={() => setActivePoint(null)}
            r={point.r}
            role="button"
            tabIndex={0}
          >
            <title>{point.label}</title>
          </circle>
        ))}
      </svg>
      {activePoint ? (
        <div
          className={styles.scatterTooltip}
          style={{
            left: `${(activePoint.x / 594) * 100}%`,
            top: `${(activePoint.y / 380) * 100}%`,
          }}
        >
          <strong className={activePoint.side === "pro" ? styles.blueText : styles.redText}>
            {activePoint.side === "pro" ? sideLabels.pro : sideLabels.con}
          </strong>
          <p>{activePoint.label || "理由文はまだありません。"}</p>
          <small>{activePoint.attributeText}</small>
        </div>
      ) : null}
      <Legend sideLabels={sideLabels} />
    </article>
  );
}

function TextMiningCard({ words }) {
  const groupedWords = {
    pro: words.filter((word) => word.side === "pro"),
    neutral: words.filter((word) => word.side === "neutral"),
    con: words.filter((word) => word.side === "con"),
  };

  return (
    <article className={`${styles.analysisCard} ${styles.textMiningCard}`}>
      <div className={styles.analysisHeader}>
        <h3>テキストマイニング</h3>
        <span>特徴語</span>
      </div>
      <p>理由文に出てくる特徴的なワードを、頻出度と立場の偏りで配置します。</p>
      <div className={styles.wordMiningGrid}>
        <WordCloudColumn title="賛成に多い語" color="blue" words={groupedWords.pro} />
        <WordCloudColumn title="どちらにも出る語" color="neutral" words={groupedWords.neutral} />
        <WordCloudColumn title="反対に多い語" color="red" words={groupedWords.con} />
      </div>
    </article>
  );
}

function WordCloudColumn({ title, color, words }) {
  return (
    <div className={`${styles.wordCloudColumn} ${styles[`${color}WordColumn`]}`}>
      <h4>{title}</h4>
      <div className={styles.wordCloud}>
        {words.length ? (
          words.map((word) => (
            <span
              className={styles[`${color}Word`]}
              style={{ fontSize: `${word.fontSize}px` }}
              title={`total ${word.total}, pro ${word.pro}, con ${word.con}`}
              key={word.word}
            >
              {word.word}
            </span>
          ))
        ) : (
          <p className={styles.emptyText}>まだ十分な理由文がありません。</p>
        )}
      </div>
    </div>
  );
}

function AIAnalysisCardDynamic({ snapshot }) {
  const heading = getAnalysisHeading(snapshot);
  const standoutResponses = getOneStandoutResponsePerSide(snapshot?.standoutResponses);

  return (
    <article id="analysis" className={styles.analysisCard}>
      <div className={styles.analysisHeader}>
        <h3>AIによる分析</h3>
        <span>{snapshot?.createdAt ? new Date(snapshot.createdAt).toLocaleString("ja-JP") : "解析待ち"}</span>
      </div>
      <strong className={styles[heading.className]}>{heading.title}</strong>
      <p>{snapshot?.neutralAnalysisText || "理由文が集まると、ここに全体の論点整理が表示されます。"}</p>
      {standoutResponses.map((item) => (
        <div className={styles.analysisPoint} key={item.responseId}>
          <PrototypeIcon className={styles.analysisIcon} />
          <div>
            <h4>{item.side === "pro" ? "賛成側の注目意見" : "反対側の注目意見"}</h4>
            <p>{item.why || item.reason}</p>
          </div>
        </div>
      ))}
    </article>
  );
}

function AIAnalysisCard({ snapshot }) {
  const heading = getAnalysisHeading(snapshot);
  const standoutResponses = getOneStandoutResponsePerSide(snapshot?.standoutResponses);

  return (
    <article id="analysis" className={styles.analysisCard}>
      <div className={styles.analysisHeader}>
        <h3>AIによる分析</h3>
        <span>{snapshot?.createdAt ? new Date(snapshot.createdAt).toLocaleString("ja-JP") : "解析待ち"}</span>
      </div>
      <strong>中立的な読み取り</strong>
      <p>{snapshot?.neutralAnalysisText || "理由文が集まると、ここに全体の論点整理が表示されます。"}</p>
      {standoutResponses.map((item) => (
        <div className={styles.analysisPoint} key={item.responseId}>
          <PrototypeIcon className={styles.analysisIcon} />
          <div>
            <h4>{item.side === "pro" ? "積極派の注目意見" : "自然経過派の注目意見"}</h4>
            <p>{item.why || item.reason}</p>
          </div>
        </div>
      ))}
    </article>
  );
}

function getOneStandoutResponsePerSide(responses = []) {
  return ["pro", "con"]
    .map((side) => responses.find((response) => response.side === side))
    .filter(Boolean);
}

function ResultSplit({ left, right }) {
  return (
    <div className={styles.splitBar} aria-label={`left ${left} percent, right ${right} percent`}>
      <span className={styles.splitBlue} style={{ width: `${left}%` }} />
      <span className={styles.splitRed} style={{ width: `${right}%` }} />
    </div>
  );
}

function Legend({ sideLabels = { pro: "賛成側", con: "反対側" } }) {
  return (
    <div className={styles.legend}>
      <span>
        <i className={styles.legendBlue} /> {sideLabels.pro}
      </span>
      <span>
        <i className={styles.legendRed} /> {sideLabels.con}
      </span>
    </div>
  );
}

function PrototypeIcon({ className = styles.prototypeIcon }) {
  return <img src={ASSETS.icon} alt="" className={className} aria-hidden="true" />;
}

function SectionHeading({ title, href }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      <a href={href}>すべて見る →</a>
    </div>
  );
}

function TopicSectionHeading({ title, actionLabel, onAction, showAction }) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      {showAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className={styles.sectionTitle}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function Toast({ message, tone }) {
  if (!message) return null;
  return (
    <div className={`${styles.toast} ${tone === "error" ? styles.toastError : ""}`}>
      {message}
    </div>
  );
}

function getPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function getAnalysisHeading(snapshot) {
  const raw = snapshot?.rawAnalysis ?? {};
  const tone = ["pro", "con", "neutral"].includes(raw.stanceTone) ? raw.stanceTone : getSnapshotTone(snapshot);
  const fallbackTitle =
    tone === "pro"
      ? "延命への期待がやや強い回答傾向"
      : tone === "con"
        ? "自然経過と苦痛軽減を重視する回答傾向"
        : "賛否が分かれる複数論点型の回答傾向";

  return {
    title: raw.analysisTitle || fallbackTitle,
    className:
      tone === "pro"
        ? "analysisTitlePro"
        : tone === "con"
          ? "analysisTitleCon"
          : "analysisTitleNeutral",
  };
}

function getSnapshotTone(snapshot) {
  const counts = snapshot?.choiceCounts ?? {};
  const pro = Number(counts.pro ?? 0);
  const con = Number(counts.con ?? 0);
  const total = pro + con;
  if (!total || Math.abs(pro - con) / total < 0.12) return "neutral";
  return pro > con ? "pro" : "con";
}

function createSegmentRows(responses, attributeKey) {
  const groups = new Map();
  responses.forEach((response) => {
    const label = response.attributes?.[attributeKey];
    if (!label || label === "回答しない") return;
    const group = groups.get(label) ?? { label, pro: 0, con: 0, total: 0 };
    group[response.choiceSide] += 1;
    group.total += 1;
    groups.set(label, group);
  });

  return [...groups.values()].map((group) => {
    const proPercent = getPercent(group.pro, group.total);
    return {
      label: group.label,
      proPercent,
      conPercent: group.total ? 100 - proPercent : 0,
      total: group.total,
    };
  });
}

function createAgeSegmentRows(responses) {
  const rowsByLabel = new Map(
    createSegmentRows(responses, "ageGroup").map((row) => [row.label, row]),
  );

  return AGE_GROUP_ORDER.map((label) => {
    const row = rowsByLabel.get(label);
    if (row) return row;
    return {
      label,
      proPercent: 0,
      conPercent: 0,
      total: 0,
      isEmpty: true,
    };
  });
}

function createAttributeComparisonPanels(responses, sideLabels) {
  return [
    {
      title: "医療従事者vs一般市民",
      rows: createFixedComparisonRows(responses, "medicalExperience", [
        { label: "医療従事者", value: MEDICAL_WORKER_VALUES[0] },
        { label: "一般市民", value: MEDICAL_WORKER_VALUES[1] },
      ], sideLabels),
    },
    {
      title: "自身・家族の医療/介護経験の有無",
      rows: createFixedComparisonRows(responses, "caregivingExperience", [
        { label: "経験あり", value: CARE_EXPERIENCE_VALUES[0] },
        { label: "経験なし", value: CARE_EXPERIENCE_VALUES[1] },
      ], sideLabels),
    },
  ];
}

function createFixedComparisonRows(responses, attributeKey, items, sideLabels) {
  return items.map((item) => {
    const matched = responses.filter((response) => response.attributes?.[attributeKey] === item.value);
    const pro = matched.filter((response) => response.choiceSide === "pro").length;
    const proPercent = getPercent(pro, matched.length);
    const conPercent = matched.length ? 100 - proPercent : 0;
    const majority = getMajorityResult(proPercent, conPercent, matched.length, sideLabels);
    return {
      label: item.label,
      total: matched.length,
      proPercent,
      conPercent,
      ...majority,
    };
  });
}

function getMajorityResult(proPercent, conPercent, total, sideLabels = { pro: "賛成側", con: "反対側" }) {
  if (!total) {
    return {
      majorityLabel: "回答なし",
      majorityPercent: 0,
      majorityClass: "segmentNeutralText",
    };
  }

  if (proPercent === conPercent) {
    return {
      majorityLabel: "賛否両論",
      majorityPercent: proPercent,
      majorityClass: "segmentNeutralText",
    };
  }

  if (proPercent > conPercent) {
    return {
      majorityLabel: sideLabels.pro,
      majorityPercent: proPercent,
      majorityClass: "segmentBlueText",
    };
  }

  return {
    majorityLabel: sideLabels.con,
    majorityPercent: conPercent,
    majorityClass: "segmentRedText",
  };
}

function sortResponses(responses, sortMode, sideFilter) {
  return [...responses]
    .filter((response) => response.reason)
    .filter((response) => sideFilter === "all" || response.choiceSide === sideFilter)
    .sort((a, b) => {
      if (sortMode === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortMode === "medical") return compareMedicalWorker(a, b);
      if (sortMode === "age") return compareAgeGroup(a, b);
      if (sortMode === "tag") return compareReasonTag(a, b);
      return b.likes - a.likes;
    });
}

function compareMedicalWorker(a, b) {
  const rankA = a.attributes?.medicalExperience === MEDICAL_WORKER_VALUES[0] ? 0 : 1;
  const rankB = b.attributes?.medicalExperience === MEDICAL_WORKER_VALUES[0] ? 0 : 1;
  if (rankA !== rankB) return rankA - rankB;
  return compareNewest(a, b);
}

function compareAgeGroup(a, b) {
  const rankA = getAgeRank(a.attributes?.ageGroup);
  const rankB = getAgeRank(b.attributes?.ageGroup);
  if (rankA !== rankB) return rankA - rankB;
  return compareNewest(a, b);
}

function compareReasonTag(a, b) {
  const tagA = getPrimaryReasonTag(a);
  const tagB = getPrimaryReasonTag(b);
  if (tagA !== tagB) return tagA.localeCompare(tagB, "ja");
  return compareNewest(a, b);
}

function compareNewest(a, b) {
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function getAgeRank(ageGroup) {
  const index = AGE_GROUP_ORDER.indexOf(ageGroup);
  return index === -1 ? AGE_GROUP_ORDER.length : index;
}

function getPrimaryReasonTag(response) {
  return response.analysis?.reasonTags?.[0] ?? "タグなし";
}

function getTopTags(debate) {
  const snapshotTags = debate.snapshot?.topTags ?? [];
  if (snapshotTags.length) {
    return snapshotTags.slice(0, 6).map((tag) => ({
      tag: tag.tag,
      pro: Number(tag.pro ?? 0),
      con: Number(tag.con ?? 0),
      total: Number(tag.total ?? 0),
    }));
  }

  const tagMap = new Map();
  debate.responses.forEach((response) => {
    response.analysis?.reasonTags?.forEach((tag) => {
      const entry = tagMap.get(tag) ?? { tag, pro: 0, con: 0, total: 0 };
      entry[response.choiceSide] += 1;
      entry.total += 1;
      tagMap.set(tag, entry);
    });
  });

  return [...tagMap.values()].sort((a, b) => b.total - a.total).slice(0, 6);
}

function getScatterPoints(debate) {
  const snapshotPoints = debate.snapshot?.scatterSummary?.points ?? [];
  const responseById = new Map(debate.responses.map((response) => [response.id, response]));
  const points = snapshotPoints.length
    ? snapshotPoints
    : debate.responses
        .filter((response) => response.analysis)
        .map((response) => ({
          responseId: response.id,
          side: response.choiceSide,
          likes: response.likes,
          x: response.analysis?.axisScores?.painDignity ?? 0,
          y: response.analysis?.axisScores?.lifeTechnologyExpectation ?? 0,
          attributes: response.attributes,
          reason: response.reason,
        }));

  return points.map((point) => ({
    ...point,
    id: point.responseId,
    side: point.side,
    x: 297 + Number(point.x ?? 0) * 220,
    y: 190 - Number(point.y ?? 0) * 135,
    r: Math.min(24, 7 + Math.sqrt(Number(point.likes ?? 0) + 1) * 2.5),
    label: point.reason ?? "",
    attributeText: formatScatterAttributes(point.attributes ?? responseById.get(point.responseId)?.attributes),
  }));
}

function formatScatterAttributes(attributes = {}) {
  const values = [
    attributes.ageGroup,
    attributes.gender,
    attributes.medicalExperience ? `医療・介護従事者: ${attributes.medicalExperience}` : "",
    attributes.caregivingExperience ? `医療/介護経験: ${attributes.caregivingExperience}` : "",
  ].filter(Boolean);

  return values.length ? values.join(" / ") : "属性は未回答です";
}

function createTextMiningWords(responses) {
  const wordMap = new Map();

  responses
    .filter((response) => response.reason)
    .forEach((response) => {
      const aiWords = response.analysis?.textMiningWords ?? response.analysis?.rawAnalysis?.textMiningWords ?? [];
      const words = aiWords.length
        ? aiWords.map(String).filter(Boolean).slice(0, 16)
        : extractOpinionWords(response.reason, response.analysis?.reasonTags ?? []);
      words.forEach((word) => {
        const entry = wordMap.get(word) ?? { word, pro: 0, con: 0, total: 0 };
        entry[response.choiceSide] += 1;
        entry.total += 1;
        wordMap.set(word, entry);
      });
    });

  const entries = [...wordMap.values()]
    .filter((word) => word.total >= 1)
    .sort((a, b) => b.total - a.total || a.word.localeCompare(b.word, "ja"))
    .slice(0, 42);
  const maxTotal = Math.max(1, ...entries.map((word) => word.total));

  return entries.map((word) => {
    const side = word.pro === word.con ? "neutral" : word.pro > word.con ? "pro" : "con";
    return {
      ...word,
      side,
      fontSize: Math.round(13 + (word.total / maxTotal) * 18),
    };
  });
}

function extractOpinionWords(reason, reasonTags) {
  const text = String(reason || "");
  const dictionaryWords = TEXT_MINING_KEYWORDS.filter((word) => text.includes(word));
  const tokenWords = (text.match(/[一-龯ぁ-んァ-ヶーA-Za-z0-9]{2,12}/g) ?? [])
    .filter((word) => !TEXT_MINING_STOP_WORDS.has(word))
    .filter((word) => !/^[0-9]+$/.test(word))
    .slice(0, 8);
  const tagWords = reasonTags
    .flatMap((tag) => String(tag).split(/[・、,\s/]+/))
    .filter((word) => word.length >= 2 && word.length <= 12);

  return [...new Set([...dictionaryWords, ...tokenWords, ...tagWords])].slice(0, 16);
}

function createEmptyTags() {
  return ["苦痛の回避", "本人の意思", "本人の尊厳", "生活の質", "回復可能性", "家族負担"].map(
    (tag) => ({ tag, pro: 0, con: 0, total: 0 }),
  );
}

function createRadarGrid(count, scale) {
  return createRadarPoints(
    Array.from({ length: count }, () => scale),
    count,
  )
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function createRadarPolygon(tags, side) {
  const source = tags.length ? tags : createEmptyTags();
  const max = Math.max(1, ...source.map((tag) => Math.max(tag.pro, tag.con)));
  const values = source.map((tag) => Number(tag[side] ?? 0) / max);
  const points = createRadarPoints(values, source.length);
  return `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} Z`;
}

function createRadarPoints(values, count) {
  const centerX = 237;
  const centerY = 180;
  const radius = 142;
  return values.map((value, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return {
      x: Math.round(centerX + Math.cos(angle) * radius * value),
      y: Math.round(centerY + Math.sin(angle) * radius * value),
    };
  });
}

function createRadarLabelPositions(count) {
  return createRadarPoints(Array.from({ length: count }, () => 1.16), count);
}
