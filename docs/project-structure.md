# プロジェクト全体の構造メモ

このプロジェクトは、現時点では React プロジェクトではなく、静的な HTML / CSS / JavaScript だけで作られたプロトタイプです。

## 現在のファイル構成

```text
卒制prototype2/
├─ index.html
├─ script.js
├─ styles.css
└─ docs/
   ├─ project-structure.md
   ├─ index-html.md
   ├─ script-js.md
   └─ styles-css.md
```

## 各ファイルの役割

| ファイル | 役割 |
| --- | --- |
| `index.html` | 画面に表示する要素を並べるファイルです。スライド、ボタン、フォーム、SVGグラフの置き場所があります。 |
| `styles.css` | 見た目を決めるファイルです。色、文字サイズ、余白、スクロールスナップ、レスポンシブ対応を担当しています。 |
| `script.js` | 動きを担当するファイルです。スクロール検知、選択肢のクリック、回答保存、グラフ描画をまとめて処理しています。 |

## 現在のデータの流れ

```text
ユーザーが選択肢をクリック
  ↓
script.js の selectedChoice に選択状態を保存
  ↓
理由フォームに入力
  ↓
送信時に localStorage へ保存
  ↓
保存済み回答を読み出す
  ↓
SVG の散布図として画面に描画
```

## 現時点の重要な注意点

- React の `component`、`props`、`state`、`useEffect`、`hooks` はまだ使われていません。
- 現在の状態管理は、React の `state` ではなく、普通の JavaScript 変数 `selectedChoice` と `localStorage` で行われています。
- `localStorage` はブラウザ内だけに保存されるため、別のPCやスマホから同じ結果を見ることはできません。
- サーバーやクラウドDBへの保存処理はまだありません。
- AI解析処理はまだ実装されていません。
- 日本語テキストやコメントが文字化けしているため、まず文字コードを UTF-8 として整える必要があります。
- `index.html` と `script.js` には、文字化けに伴ってタグや文字列が壊れている可能性があります。

## React化した場合のおすすめ構成

将来 React / Vite / Next.js などに移行する場合は、次のように分けると責務が見えやすくなります。

```text
src/
├─ components/
│  ├─ SlideSection.jsx
│  ├─ ChoiceCards.jsx
│  ├─ ReasonForm.jsx
│  ├─ ResultChart.jsx
│  └─ ProgressDots.jsx
├─ hooks/
│  ├─ useScrollSteps.js
│  └─ useSurveyAnswers.js
├─ lib/
│  ├─ supabaseClient.js
│  └─ aiAnalysisClient.js
├─ utils/
│  ├─ sanitize.js
│  └─ chartLayout.js
├─ data/
│  └─ choices.js
├─ App.jsx
└─ main.jsx
```

## React初心者向けの言葉

### JSX

JSX は、JavaScript の中に HTML のような見た目で UI を書く記法です。

今の `index.html` にある `<section>` や `<button>` は、React 化すると JSX の中に移動します。

### component

component は、画面の部品です。

たとえば、選択肢カード、理由入力フォーム、結果グラフをそれぞれ別 component にすると、1つのファイルが大きくなりにくくなります。

### props

props は、親 component から子 component に渡す値です。

例: `ChoiceCards` に `choices` という配列を渡すと、選択肢の表示を外から変更しやすくなります。

### state

state は、画面の状態を覚える React の仕組みです。

今の `selectedChoice` は、React では `useState` で管理する候補です。

### useEffect

useEffect は、「画面が表示された後」「値が変わった後」に実行したい処理を書く hooks です。

Scrollama のセットアップ、Supabase からの初回データ取得、グラフ再描画などは `useEffect` に入ることが多いです。

### hooks

hooks は、React の状態管理や副作用処理を component の中で使うための関数です。

将来は、スクロール処理を `useScrollSteps`、回答保存を `useSurveyAnswers` のように分けると読みやすくなります。

## 今後導入を検討できるライブラリ

| 目的 | 候補 | なぜ必要か | 既存コードへの影響 |
| --- | --- | --- | --- |
| React開発環境 | Vite | 初学者にも扱いやすく、Reactの開発サーバーが速いです。 | `index.html` / `script.js` を `src` 配下へ分ける移行が必要です。 |
| ルーティングやAPI | Next.js | API Routeを使うと、OpenAI APIキーをフロントに出さずAI解析できます。 | 構成が少し大きくなりますが、サーバー処理を安全に分けられます。 |
| DB保存 | Supabase | アンケート回答をクラウドに保存できます。 | `.env` にURLと匿名キーを置き、保存処理を `lib` に分離します。 |
| 可視化 | D3.js | 散布図、力学グラフ、クラスタ表現などを細かく作れます。 | SVG描画処理を `ResultChart` や `utils/chartLayout` に移すと導入しやすいです。 |
| スクロール演出 | Scrollama | 現在もCDNで利用中です。Reactではhooks化すると管理しやすいです。 | `setupScrollama` を `useScrollSteps` に分離します。 |
| 入力検証 | Zod | 回答データの形を安全にチェックできます。 | 保存前のバリデーションを追加できます。 |

## セキュリティ方針

- OpenAI APIキー、Supabase service role key、その他の秘密情報は絶対にフロントエンドへ書かないでください。
- ブラウザで使ってよいキーと、サーバーだけで使うキーを分けてください。
- AI解析は、できれば Next.js API Route、Cloud Functions、Supabase Edge Functions などサーバー側で実行してください。
- `.env` を使う前提にし、`.env.example` にはダミー値だけを書きます。

