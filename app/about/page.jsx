import InformationPage from "@/components/InformationPage";
import styles from "@/app/about/AboutPage.module.css";

export const metadata = {
  title: "CrossTalkって何？ | CrossTalk",
  description: "医療をめぐる認識の違いを可視化し、対話につなげるCrossTalkの仕組みをご紹介します。",
};

const SOLUTIONS = [
  { number: "01", title: "SNSの参加しやすさ", text: "気になる問いを選び、自分の立場と理由を投稿する。難しい医療の話題にも、日常的なSNSのような感覚で参加できます。", tone: "blue" },
  { number: "02", title: "グラフィックレコーディング × インフォグラフィック", text: "賛成・反対、属性ごとの傾向、特徴的な言葉を見える形に整理。複雑な議論を、ひと目で捉えやすくします。", tone: "violet" },
  { number: "03", title: "AIによる自動解析", text: "自由記述を要約・分類し、キーワードや価値観の傾向を抽出。単純な投票数だけでは見えない違いを探します。", tone: "red" },
];

const FLOW = [
  { number: "1", title: "選ぶ", text: "医療の問いに立場を示す" },
  { number: "2", title: "語る", text: "そう考えた理由を投稿する" },
  { number: "3", title: "整理する", text: "AIが意見を分類・要約する" },
  { number: "4", title: "見つける", text: "異なる価値観や共通点を知る" },
];

export default function AboutPage() {
  return (
    <InformationPage eyebrow="About CrossTalk" title="CrossTalkって何？" description="☞医療者と市民。立場の違う人どうしが、互いの考えを知るための参加型プラットフォームです。">
      <section className={styles.visualStatement}>
        <div>
          <p className={styles.sectionLabel}>VISUAL COMMUNICATION</p>
          <h2>医療の対話を、<br />見える形に。</h2>
          <p>
            CrossTalkは、<strong>グラフィックレコーディングとインフォグラフィック</strong>を活かして、複雑な医療の議論をわかりやすく可視化する作品です。文章を読むだけでは気づきにくい意見の分布、共通点、価値観の違いを、直感的に発見できる体験を目指しています。
          </p>
        </div>
        <div className={styles.visualMark} aria-hidden="true">
          <span className={styles.speechMark}>意見</span>
          <b>→</b>
          <div className={styles.chartMark}><i /><i /><i /><i /><i /></div>
          <small>違いが見える</small>
        </div>
      </section>

      <section className={styles.storySection}>
        <p className={styles.sectionLabel}>THE QUESTION</p>
        <h2>医療は、なぜ分かり合いにくいのか</h2>
        <p className={styles.lead}>医療は専門知識の差が大きい一方で、誰もがいつか当事者になります。しかし、医療従事者と一般市民が、互いの考え方や価値観を知る機会は多くありません。</p>
        <div className={styles.gapDiagram} aria-label="医療従事者と一般市民の認識の隔たり">
          <div className={`${styles.personCard} ${styles.medicalCard}`}><span className={styles.personIcon} aria-hidden="true">＋</span><strong>医療従事者</strong><small>知識・安全・現場の制約</small></div>
          <div className={styles.gapCenter}><span>認識の齟齬</span><div aria-hidden="true"><i /><b>?</b><i /></div><small>摩擦・不信・すれ違い</small></div>
          <div className={`${styles.personCard} ${styles.citizenCard}`}><span className={styles.personIcon} aria-hidden="true">○</span><strong>一般市民・患者</strong><small>経験・不安・生活の価値観</small></div>
        </div>
        <p>同じ出来事を見ても、持っている情報や置かれた状況によって受け止め方は変わります。その違いが見えないままだと、説明不足、不信、過度な期待、医療者の萎縮など、双方にとって息苦しい状況につながります。</p>
      </section>

      <section className={styles.storySection}>
        <p className={styles.sectionLabel}>WHY SOCIAL?</p>
        <h2>SNSの力を、分断ではなく対話へ</h2>
        <div className={styles.snsComparison}>
          <article><span className={styles.minus}>−</span><h3>SNSが抱える問題</h3><p>刺激の強い意見が広がりやすく、似た価値観だけが集まることで、対立や分断が深まりやすい。</p></article>
          <div className={styles.transformArrow} aria-hidden="true">→</div>
          <article><span className={styles.plus}>＋</span><h3>SNSが持つ可能性</h3><p>誰もが気軽に声を上げ、多くの人の経験や価値観を集め、議論へ参加するきっかけをつくれる。</p></article>
        </div>
        <p className={styles.highlight}>CrossTalkは、SNSの「参加しやすさ」を活かしながら、意見を競わせるのではなく、違いを発見する体験へと組み替えます。</p>
      </section>

      <section className={styles.storySection}>
        <p className={styles.sectionLabel}>THE APPROACH</p>
        <h2>3つの仕組みで、違いを見える形に</h2>
        <div className={styles.solutionGrid}>{SOLUTIONS.map((item) => <article className={`${styles.solutionCard} ${styles[item.tone]}`} key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section className={styles.storySection}>
        <p className={styles.sectionLabel}>HOW IT WORKS</p>
        <h2>あなたの意見が「認識地図」になるまで</h2>
        <div className={styles.flowDiagram}>{FLOW.map((item, index) => <div className={styles.flowItem} key={item.number}><article><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>{index < FLOW.length - 1 ? <b aria-hidden="true">→</b> : null}</div>)}</div>
        <div className={styles.mapResult}><div className={styles.mapDots} aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div><div><strong>社会の認識地図へ</strong><p>多数派の傾向だけでなく、少数派の経験や特徴的な意見にも光を当てます。回答が増えるほど地図は更新され、参加者一人ひとりがその地図を共に描いていきます。</p></div></div>
      </section>

      <section className={styles.goalSection}>
        <p className={styles.sectionLabel}>OUR GOAL</p>
        <h2>正解を決めるのではなく、<br />違いを知るところから。</h2>
        <p>CrossTalkが目指すのは、どちらかの意見を勝たせることではありません。「なぜそう考えるのか」を互いに知り、医療をめぐる対話を少しずつ始めやすくすることです。</p>
      </section>

      <section className={styles.creatorSection}>
        <img src="/CrossTalk/images/creator-profile.jpg" alt="制作者 酒井希天のプロフィール写真" />
        <div>
          <p className={styles.sectionLabel}>CREATOR</p>
          <h2>制作者</h2>
          <p>日本内科学会　内科専門医</p>
          <p>多摩美術大学　情報デザイン学科　卒業制作作品</p>
          <strong>酒井希天</strong>
        </div>
      </section>

      <aside className={styles.noticeSection}><h2>ご利用にあたって</h2><p>本サイトは医療相談や診断を行うものではありません。個人名、医療機関名、連絡先など、個人を特定できる情報は投稿しないでください。表示される分析内容は卒業制作として検証中です。</p></aside>
    </InformationPage>
  );
}
