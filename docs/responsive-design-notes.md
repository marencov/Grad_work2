# Responsive Design Notes

このメモは、`TopPagev1` と今後のScrollytelling実装で使うレスポンシブ設計の考え方をまとめたものです。

Web開発初心者でも後から読み返せるように、FigmaとCSSの役割を分けて整理します。

## 結論

Figmaは `1440px` 固定幅で作ってOKです。

ただし、Figmaの1440pxは「完成サイズ」ではなく「基準サイズ」として扱います。

実装では、Figmaの見た目をそのまま固定pxで写すのではなく、CSSで次のように翻訳します。

- `max-width`
- `%`
- `minmax()`
- `clamp()`
- `aspect-ratio`
- 必要最小限の `media query`

## FigmaとCSSの役割

### Figma

Figmaでは代表的な画面幅で、理想の見た目を決めます。

おすすめは以下です。

```txt
390px   Mobile
768px   Tablet
1024px  Small Desktop
1440px  Desktop Design Base
1920px  Large Desktop Check
```

すべての中間幅をFigmaで作る必要はありません。

Figmaでは、主に以下を決めます。

- 見出しの強さ
- 情報の優先順位
- カードの並び
- 余白の雰囲気
- 色やトーン
- 代表的なレイアウト

### CSS

CSSでは、Figmaで決めた見た目を画面幅に応じて自然に伸縮させます。

つまり、Figmaの数値をそのまま写すのではなく、ルールに変換します。

## まず固定幅をやめる

Figmaでは `1440px` や `1408px` のフレームを使っていても、Webではそのまま固定しません。

悪い例:

```css
.section {
  width: 1408px;
}
```

良い例:

```css
.section {
  width: min(100% - 48px, 1200px);
  margin-inline: auto;
}
```

意味:

- 画面が狭いときは `100% - 48px`
- 画面が広いときは最大 `1200px`
- 中央寄せ

## 余白は `clamp()` が便利

画面幅によって余白を自然に変えたいときは `clamp()` が便利です。

```css
.section {
  width: min(100% - clamp(32px, 6vw, 96px), 1280px);
}
```

意味:

- 最小余白は `32px`
- 通常は画面幅の `6vw`
- 最大余白は `96px`

これにより、HDでも4Kでも余白が極端になりにくくなります。

## 4K対応の考え方

4Kユーザーは増えています。

ただし、4K幅いっぱいに本文やカードを広げると読みにくくなります。

4K対応は「全部を大きく広げる」ことではありません。

4K対応とは、広い画面でも破綻せず、美しく余白を扱うことです。

おすすめ:

```css
.pageSection {
  width: min(100% - clamp(32px, 6vw, 160px), 1440px);
}

.visualSection {
  width: min(100% - clamp(32px, 6vw, 160px), 1680px);
}
```

考え方:

- 文章やカード: 最大 `1200px〜1440px`
- グラフや可視化: 最大 `1440px〜1680px`
- Hero画像: 画面幅いっぱいでもOK
- 文字: 4Kでも巨大化させすぎない

## グリッドは可変にする

カード一覧は固定3列だけにしない方が扱いやすいです。

```css
.topicGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
```

意味:

- 1カードは最低 `280px`
- 入るだけ横に並ぶ
- 入らなければ自然に折り返す

デスクトップだけ丁寧に制御したい場合は、ブレイクポイントでもOKです。

```css
.topicGrid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1100px) {
  .topicGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

## 画像は `aspect-ratio` で扱う

画像に固定の高さを入れすぎると、画面サイズが変わったときに崩れやすくなります。

悪い例:

```css
.heroImage {
  height: 560px;
}
```

良い例:

```css
.heroImage {
  aspect-ratio: 4 / 3;
}

.heroImage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

`aspect-ratio` を使うと、横幅に応じて高さも自然に決まります。

## 文字サイズは伸ばしすぎない

文字サイズを完全に `vw` だけで決めると、4Kで巨大化しすぎることがあります。

慎重にやるなら、段階的なブレイクポイントが安全です。

```css
.heroTitle {
  font-size: 56px;
}

@media (max-width: 1200px) {
  .heroTitle {
    font-size: 48px;
  }
}

@media (max-width: 900px) {
  .heroTitle {
    font-size: 38px;
  }
}
```

`clamp()` を使う場合も、最大値を必ず決めます。

```css
.heroTitle {
  font-size: clamp(38px, 5vw, 64px);
}
```

## 比率で作るべきもの

以下は、画面幅に応じて伸縮させるとよいものです。

- セクション幅
- カラム幅
- グリッド列
- 画像サイズ
- gap
- padding
- グラフの横幅

## 比率だけにしない方がよいもの

以下は、比率だけで伸ばすと崩れやすいです。

- 本文の最大幅
- ボタンの最小サイズ
- 入力欄の高さ
- 文字サイズ
- アイコンサイズ
- カードの最大幅

これらは `min-width`、`max-width`、固定px、段階的なmedia queryを組み合わせます。

## ブレイクポイントの使いどころ

ブレイクポイントは、細かく作りすぎる必要はありません。

使うのは、主に構造が変わるタイミングです。

- 横並びを縦並びにする
- ナビをハンバーガーメニューにする
- カードの列数を変える
- グラフと説明文の位置を変える
- 文字サイズを一段落とす

おすすめ確認幅:

```txt
360px   Small Mobile
390px   Mobile
768px   Tablet
1024px  Small Desktop
1440px  Desktop Base
1920px  Large Desktop Check
```

4K専用デザインを全ページ分作る必要はありません。

4Kは、`max-width` と余白設計で破綻しないか確認します。

## Scrollytellingの100dvhセクション

Scrollytellingでは、Figmaで `100dvh in implementation` と書いたセクションがあります。

これらは実装で `height: 100dvh` にします。

```css
.snapSection {
  height: 100dvh;
  scroll-snap-align: start;
}
```

ただし、画面の高さが低いPCでは中身が詰まる可能性があります。

そのため、余白は固定pxだけでなく `clamp()` を使うとよいです。

```css
.snapSection {
  height: 100dvh;
  padding-block: clamp(40px, 7vh, 72px);
}
```

## 今回のプロジェクトでの方針

`TopPagev1` では、まず次の順番でレスポンシブ化するのがよいです。

1. 固定に近い `1408px` 幅を、`max-width` と `clamp()` に置き換える
2. Hero画像を `min-height` 固定から `aspect-ratio` 管理へ寄せる
3. `topicGrid` や `categoryGrid` を可変グリッドにする
4. 文字サイズを段階的に調整する
5. 100dvhセクションの余白を `clamp()` 化する
6. その後にTablet/Mobile用の構造変更を追加する

## 一番大事な考え方

Figmaは「基準の見た目」を作る場所です。

CSSは「画面幅ごとの振る舞い」を作る場所です。

つまり、

```txt
Figmaの固定値を、そのままWebに写す
```

ではなく、

```txt
Figmaの見た目を、CSSの可変ルールに翻訳する
```

と考えると、レスポンシブ対応がかなり分かりやすくなります。
