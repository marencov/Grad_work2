# script.js の説明

`script.js` は、このプロトタイプの動きをまとめて担当しているファイルです。

現在は React ではなく、ブラウザ標準の JavaScript で DOM を直接操作しています。

## 主な役割

- スライドの現在位置を検知する
- 進捗ドットを更新する
- ボタンクリックで指定スライドへスクロールする
- 選択肢をクリックした状態を保存する
- 理由フォームの送信を受け取る
- 回答を `localStorage` に保存する
- 保存済み回答をSVG散布図として描画する
- ツールチップを表示する

## ファイル内の大きなまとまり

| まとまり | 役割 |
| --- | --- |
| DOM取得 | `document.querySelector` でHTML要素を取得しています。 |
| 定数 | `STORAGE_KEY` や `choiceLabels` など、全体で使う固定値です。 |
| 状態 | `selectedChoice` が現在選ばれている回答を覚えています。 |
| 保存処理 | `getAnswers` / `saveAnswers` が `localStorage` を読み書きします。 |
| スクロール処理 | `setupScrollama` / `setupFallbackObserver` が現在スライドを検知します。 |
| 回答処理 | `chooseAnswer` / `submitAnswer` がユーザーの入力を扱います。 |
| 可視化処理 | `renderChart` / `getPointPosition` がSVGを描画します。 |
| イベント登録 | ファイル下部の `addEventListener` 群がクリックや送信を監視します。 |

## Reactの概念に置き換えると

### state

今の `selectedChoice` は、Reactでは `useState` に置き換えます。

```jsx
const [selectedChoice, setSelectedChoice] = useState("");
```

state を使うと、選択状態が変わったときにReactが画面を再描画してくれます。

### props

今は `choiceLabels` を `script.js` の中で直接参照しています。

Reactでは、選択肢データを親 component から子 component に props として渡すと、部品を再利用しやすくなります。

### useEffect

Scrollama の初期化、`localStorage` からの読み込み、画面サイズ変更時の処理は、Reactでは `useEffect` に入れる候補です。

```jsx
useEffect(() => {
  // Scrollamaのセットアップ
  // componentが消えるときの後片付けもここで行う
}, []);
```

### hooks

スクロール検知や回答保存は、専用 hooks に分けると読みやすくなります。

例:

- `useScrollSteps`
- `useSurveyAnswers`
- `useResultChart`

## 外部ライブラリ

### Scrollama

`setupScrollama` で使っています。

Scrollama が読み込めている場合は Scrollama を使い、読み込めていない場合は `IntersectionObserver` を使うフォールバック構成になっています。

これは良い考え方です。ネットワーク都合でCDNが読めないときでも最低限動かせます。

## データ保存の流れ

```text
選択肢をクリック
  ↓
selectedChoice に保存
  ↓
フォーム送信
  ↓
id / choice / reason / createdAt の形にまとめる
  ↓
localStorage に JSON文字列として保存
  ↓
renderChart で再描画
```

## セキュリティと安全性

現在の保存先は `localStorage` です。

これはプロトタイプとしては簡単ですが、本番アンケートには向きません。

- ユーザーのブラウザ内にしか保存されない
- 他の人の回答と共有できない
- ユーザーがブラウザの開発者ツールから編集できる
- 個人情報を保存する場合は設計上の注意が必要

本番では Supabase などのクラウドDBへ保存し、保存前に入力検証を行うのがおすすめです。

## AI解析の分離方針

OpenAI APIキーなどの秘密情報は、フロントエンドの `script.js` に絶対に書かないでください。

AI解析は次のようなサーバー側に置くのが安全です。

- Next.js API Route
- Supabase Edge Functions
- Cloudflare Workers
- Firebase Functions

```text
ブラウザ
  ↓ 回答だけ送信
サーバーAPI
  ↓ 秘密のAPIキーを使ってAI解析
OpenAI API
  ↓ 解析結果
サーバーAPI
  ↓ 必要な結果だけ返す
ブラウザ
```

## 可視化の拡張性

現在の `renderChart` は、SVG要素を直接作成して散布図を描画しています。

今後 D3.js を使うなら、次の処理を分けると移行しやすいです。

- データを集計する処理
- 点の座標を計算する処理
- SVGに描画する処理
- ツールチップを表示する処理

## 編集時の注意点

- `choiceLabels` に新しい選択肢を追加したら、`getPointPosition` やCSSの色も合わせて更新してください。
- `localStorage` のキー `STORAGE_KEY` を変えると、過去の回答が読み込めなくなります。
- `innerHTML` を使う場合は、入力値を必ずエスケープしてください。現在は `escapeHtml` が用意されています。
- 現在、文字化けの影響で文字列の引用符が壊れている箇所があるように見えます。まず構文チェックを行ってください。

## 今後の分割案

```text
src/
├─ data/choices.js
├─ hooks/useSurveyAnswers.js
├─ hooks/useScrollSteps.js
├─ utils/escapeHtml.js
├─ utils/chartLayout.js
└─ components/ResultChart.jsx
```

この分割にすると、アンケート取得、保存、AI解析、可視化、スクロール演出を別々に育てやすくなります。

