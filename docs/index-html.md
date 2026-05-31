# index.html の説明

`index.html` は、画面に出る要素を並べるファイルです。

このプロジェクトでは、1ページを縦方向のスライドのように見せるために、複数の `<section class="slide">` が並んでいます。

## 主な役割

- サイト全体のHTML構造を作る
- 各スライドの見出し、ボタン、フォーム、結果表示エリアを配置する
- `styles.css` を読み込む
- Scrollama と `script.js` を読み込む
- JavaScript が操作するための `id` や `data-*` 属性を用意する

## 主要なHTML要素

| 要素 | 役割 |
| --- | --- |
| `<main id="slides" class="snap-scroll">` | スクロール対象の親要素です。CSSの scroll-snap と Scrollama の対象になります。 |
| `<section class="slide" data-step="...">` | 1枚のスライドです。`data-step` は現在位置の判定に使われます。 |
| `<button data-scroll-to="...">` | 押すと指定したスライドへ移動するボタンです。 |
| `<button data-choice="...">` | アンケートの選択肢です。JavaScriptが `data-choice` を読み取ります。 |
| `<form id="answerForm">` | 理由入力と送信をまとめるフォームです。 |
| `<textarea id="reasonInput">` | ユーザーが理由を書く入力欄です。 |
| `<svg id="scatterChart">` | 回答結果を散布図として描画する場所です。 |
| `<nav class="progress">` | 現在のスライド位置を示すドットナビです。 |

## データの流れ

`index.html` 自体はデータを保存しません。

ただし、JavaScript が操作しやすいように `id` と `data-*` 属性を置いています。

```text
HTMLのボタンやフォーム
  ↓
script.js がクリックや送信を検知
  ↓
localStorageへ保存
  ↓
SVGに結果を描画
```

## Reactに移行した場合

今のHTMLは、Reactでは JSX として component に分けます。

例:

```jsx
function ChoiceCards({ choices, selectedChoice, onSelect }) {
  return (
    <div className="choice-grid">
      {choices.map((choice) => (
        <button
          key={choice.id}
          className="choice-card"
          onClick={() => onSelect(choice.id)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}
```

この例では、`choices`、`selectedChoice`、`onSelect` が props です。

## 使われている外部ライブラリ

### Scrollama

`index.html` の末尾でCDNから読み込まれています。

```html
<script src="https://unpkg.com/scrollama"></script>
```

Scrollama は、スクロール位置に応じて「今どのステップが表示されているか」を検知するライブラリです。

## 編集時の注意点

- `id="question"` や `data-step="question"` の名前を変える場合は、`script.js` 側の処理も確認してください。
- `data-choice` の値を増やす場合は、`script.js` の `choiceLabels` やグラフ描画処理も更新が必要です。
- `svg` の `id="scatterChart"` を変えると、結果グラフが描画されなくなります。
- 現在、日本語テキストが文字化けしています。まず UTF-8 として文字を直すことをおすすめします。
- 一部の閉じタグや引用符が壊れている可能性があります。ブラウザ表示確認とHTMLバリデーションを行ってください。

## レスポンシブ視点

- `<meta name="viewport">` は入っているため、スマホ表示の土台はあります。
- 見た目の調整は `styles.css` の `@media (max-width: 760px)` が担当しています。
- 今後は、長い日本語テキストがスマホで折り返せるかを必ず確認してください。

