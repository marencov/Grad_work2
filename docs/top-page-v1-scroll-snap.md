# TopPage v1 Scroll Snap Design

このメモは、`/top-page-v1` のスクロール設計をあとで迷わないための解説です。

## 結論

`TopPagev1` では、スクロールバーは1本だけにします。

そのうえで、ページ前半は普通にスクロールし、`Scrollytelling / general` の一部セクションだけが軽くスナップするようにします。

```css
.page {
  height: 100dvh;
  overflow-y: auto;
  scroll-snap-type: y proximity;
}

.snapSection {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: normal;
}
```

## なぜ `proximity` なのか

`scroll-snap-type: y proximity` は、「スナップ位置に近いときだけ吸着する」指定です。

今回のページでは、次のような体験にしたいので `proximity` が合っています。

- TopPage内は普通のWebページとして自然にスクロールしたい
- Scrollytellingの100dvhセクションでは、画面1枚ずつ気持ちよく止まってほしい
- スナップ領域の最後から、詳細結果やAI分析の縦長セクションへ自然に抜けたい

`mandatory` にすると吸着が強くなりすぎます。特に、100dvhセクションのあとに通常スクロールの長い領域がある場合、ユーザーがスナップ領域から抜けにくく感じることがあります。

そのため、このプロトタイプでは `mandatory` ではなく `proximity` を標準方針にします。

## どのセクションがスナップするか

Figmaで `100dvh in implementation` とコメントしているセクションだけを `.snapSection` にします。

現在の対象は以下です。

- `QuestionMain`
- `AnswerMain`
- `AttributeCollector`
- `ReasonInput`

これらは実装上、必ず `height: 100dvh` にします。

## どのセクションはスナップしないか

情報量が多いセクションは、画面1枚に押し込まず通常スクロールにします。

現在の対象は以下です。

- `DetailResults`
- `HighlightedOpinions`
- `AITagMap`

これらは `.longSection` として扱います。

## 二重スクロールバーを避ける

内側に `overflow-y: auto` を持つスクロールコンテナを作ると、ページ全体のスクロールバーと内側のスクロールバーが二重になります。

このページでは避けます。

```jsx
<main className={styles.page}>
  <TopBar />
  <Hero />
  <HotTopics />
  <Categories />
  <ScrollytellingGeneral />
</main>
```

`.page` が唯一のスクロールコンテナです。

`snapStory` は構造を分かりやすくするための囲いで、スクロールコンテナにはしません。

## React初心者向けの見方

React側では、スナップするかどうかはクラス名で分けます。

```jsx
function QuestionMainSection() {
  return <section className={styles.snapSection}>...</section>;
}

function DetailResultsSection() {
  return <section className={styles.longSection}>...</section>;
}
```

つまり、あとで新しいセクションを追加するときは、まず次を判断します。

- 画面1枚で見せたい: `.snapSection`
- 縦に読ませたい: `.longSection`

## 今後の注意

`scroll-snap-type` を `mandatory` に戻す場合は、必ず次を確認してください。

- スナップ領域から通常スクロール領域へ抜けられるか
- トラックパッド、マウスホイール、キーボード操作で違和感がないか
- 画面高さが低いPCでも内容が切れていないか

現時点では、`proximity` がこのページの標準です。
