# trésor

あらゆるモノを、ユーザー自身が定義した「型」で管理する PWA。
Next.js 14 + Firebase (Auth / Firestore / Cloud Functions / FCM)。

> ## 状態: **開発凍結**（2026-09-03）
>
> Phase 0（不具合修正）を含め、**追加実装は行わない**。
> 本リポジトリはアーカイブとして保持する。コード変更の予定なし。
>
> 凍結の判断は、下記「調査結果」に基づく。再開する場合は「再開条件」を先に確認すること。

---

## 1. このリポジトリは何だったか

2026-03-28 〜 04-04 の約1週間で実装。冷蔵庫・本棚・商品在庫・デジタル資産など、
管理したいモノの種類ごとに専用アプリを使い分けるコストを、
**ユーザー定義スキーマ（テンプレート）** ひとつで畳むことを狙った。

- `Template` = サブロケーション（階層）＋ 型付き属性（text / number / date / tag / url / checkbox）
- `Item` = テンプレートに従うレコード（名前・数量・保管場所・属性・ノート）
- Cloud Functions が毎時起動し、`date` 型属性の期限が近いアイテムを FCM で通知

以後の変更は UI 微修正のみ（`5582aad` 〜 `7b4a510`）。機能追加は 2026-04-04 で停止している。

---

## 2. 凍結理由

### 2.1 差別化の前提が、競合検証で否定された

trésor の唯一の差別化候補は「ユーザーがテンプレート・属性・型・階層を定義できること」だった。
2026-09-03、直接競合 **monoca 2**（https://monoca2.web.app、Web版で実機検証）を確認したところ、
同じ機能をより広い型セットで既に実装していた。詳細は §3.2。

### 2.2 用途特化アプリには、型システムでは追いつけない

同一 GitHub アカウントの `mercari-stock`（2026-06-21〜）が示す通り、
用途特化アプリの価値は項目の型ではなく **計算・導出・外部照会・ワークフロー** にある。
これは汎用スキーマでは原理的に表現できない。詳細は §3.3。

### 2.3 作者自身が trésor を使わなかった

trésor には当初から **商品在庫プリセット**（仕入れ価格・仕入れ日・商品URL・JANコード）が入っていた。
にもかかわらず 2ヶ月半後の 2026-06-21、物販在庫の管理のために `mercari-stock` を新規に構築している。
しかもテスト・マイグレーション・worker 分離を備えた、trésor より明確に堅い作りで。

競合調査より、この事実の方が重い。**汎用スキーマは、作者本人の実用に耐えなかった。**

### 結論

汎用側は monoca 2 が型数・写真・OCR・グループ共有・約1万件の評価実績で上回り、
特化側は専用アプリが計算と外部照会で勝つ。trésor は両側から挟まれており、
市場向けプロダクトとしては成立しない。自分用ツールとしても、作者の実際の選択がそれを支持していない。

---

## 3. 調査結果の記録（2026-09-03）

### 3.1 コード監査

静的読解（`src/` 2,551行 / `functions/` 192行）で確認した実装上の綻び 13件。主なもの:

| 内容 | 箇所 |
|---|---|
| 絞り込み中に並べ替えると別アイテムが動く（`filtered` の添字で `items` を splice） | `src/app/page.tsx:936` |
| ダッシュボードの期限判定が型を見ず全属性へ `new Date()` を総当たり、かつ7日固定 | `src/app/page.tsx:696` |
| `getDaysUntil()` / `formatDate()` が実装済みで未使用（日付は生文字列表示） | `src/app/page.tsx:85,95` |
| 属性型 `tag` が `text` と同一挙動。カード側は値の `#` 始まりで判定 | `src/app/page.tsx:424,1277` |
| テンプレート0件でもアイテムを保存でき、`templateId: ''` の「未分類」が残る | `src/app/page.tsx:341` |
| デスクトップヘッダの検索窓が非機能（`value` / `onChange` なし） | `src/app/page.tsx:2062` |
| 「CSVから復元」が `alert` のみ（インポート未実装） | `src/app/page.tsx:1637` |
| Firestore のオフライン永続化が未設定（圏外で一覧が空になる） | `src/lib/firebase.ts:26` |
| 死にコード: `isDark` / `overshoot` / `springBack` / `swipedId` / `isInEditMode` | `src/app/page.tsx` 各所 |

監査結論は「**型を作らせておいて、型を使っていない**」。
ユーザーが定義した階層・型・日付が、一覧・検索・並び・通知のどこにも効いていない。

詳細レポート: https://claude.ai/code/artifact/60ee258a-1364-44d7-864a-a6fa92f29a61

### 3.2 競合検証: monoca 2（実機、Web版）

「カテゴリの項目を編集 → 項目を追加」で選べる **項目の種類（11種）**:

> アイコン / カラータグ / テキスト(1行) / テキスト(複数行) / スコア(1〜5) / 日にち / 数値 / URL / バーコード / 画像 / 場所

trésor は 6種（text / number / date / tag / url / checkbox）。
trésor 側にあって monoca に無いのは `checkbox` のみ。

さらに、trésor の改善案として立案した仕様が既に実装済みだった:

- **日にち型に通知トグル**（「オンにすると設定された日にちに合わせて通知が来るようになります」、既定オフ）
  → 提案していた属性単位の `notify?: boolean` と既定値まで一致
- **期日順ビュー**（カテゴリ横断）に「賞味期限: **あと300日**」形式の残日数表示
  → 提案していた残日数バッジと同じ
- **項目の表示/非表示とドラッグ並べ替え**
  → 提案していた `displayAttrs`（カードに出す属性の選択）と同じ

その他、確認できた実装済み機能:
アカウント登録なしで即利用可（登録理由は同期）/ 持ってるモノ・欲しいモノの二軸 /
コレクション → カテゴリ → サブカテゴリの階層 / 写真 10枚per モノ /
名前欄のバーコードスキャン、かつバーコードは型でもある /
**画像からの取り込み（OCR、NEW表示）** / グループ共有 / ゴミ箱 / 履歴 / カラータグ管理。

trésor のロードマップで Phase 2 に置いていた 写真・バーコード・OCR は、いずれも出荷済みだった。

### 3.3 用途特化アプリとの比較: `mercari-stock`

`/Users/tomoya/GitHub/mercari-stock`（Vite + React + Cloudflare Workers + D1）。
汎用の型システムでは表現できない要素:

- `profit` = メルカリ価格 − 仕入価格 − 手数料率(設定値) − 送料(設定値) — **設定を参照する派生計算**
- `ownedEntries[]` / `missingEntries[]` と 1〜N の巻グリッド — **全体集合と所持集合の差分をUI化した型**
- `isComplete = ownedCount >= totalPublishedCount` — **導出フラグ**
- 既刊数調査 = Workers AI + Web検索で属性を埋め、`confidence` / `sourceUrls` / `reasoning` を返す — **外部知識で埋まる属性**
- `pre_listing → selling → sold_out` — **ワークフローを持つ列挙**
- `purchaseTotal` / `estimatedProfit` / `missingVolumeCount` — **ドメイン固有の集計**

ロードマップ（凍結前に作成、Phase 2/3 は本判断により破棄）:
https://claude.ai/code/artifact/1eff8386-1f9f-4234-b57a-3e280f932d73

---

## 4. 再開条件

以下のいずれかが**事実として**確認できた場合に限り、再検討する。

1. **monoca 2 が利用不能になる** — サービス終了、日本語圏での提供停止、または課金条件の大幅な悪化。
2. **「置き場」としての需要が自分の中で実証される** — 管理したい対象が同時に3つ以上発生し、
   かつ各々に専用アプリを建てるコストが見合わないと具体的に判断できたとき。
3. **計算・導出・外部照会が不要な用途に限定できると分かる** — §3.3 の6要素が要らない範囲だけを
   対象にできると確認できたとき。汎用スキーマが負けない領域はそこだけ。
4. **期限通知に絞った最小プロダクトとして切り出す価値が出たとき** — trésor の唯一の実装済み独自資産は
   Cloud Functions の期限通知（§5.1）。これ単体を別の形にする話であれば、trésor の再開ではなく資産移転。

### 再開理由にならないもの

- **UI を直したくなった** — 停止前の最後の6コミットはすべて UI 修正であり、
  それが機能追加の停止と同時に起きている。同じ行動の反復は再開ではない。
- **監査で見つかった不具合が気になる** — 使っていないアプリの不具合は、修正しても価値を生まない。
- **技術的に面白い実装を思いついた** — §2 の3点はいずれも技術で覆せない。

---

## 5. 他プロジェクトへ流用可能な資産

### 5.1 期限通知の基盤 — **流用価値が最も高い**

`functions/src/index.ts`（192行）

毎時起動の pubsub スケジュール（`0 * * * *`, Asia/Tokyo）、JST 変換、`collectionGroup('settings')` で
全ユーザーを走査、`date` 型属性の抽出、FCM 送信、無効トークンの自動削除まで一通り揃っている。

**`mercari-stock` には期限の概念が無い**ため、消費期限のある在庫を扱うなら移植価値がある。
ただし Cloudflare Workers（Cron Triggers）へ移すなら firebase-admin 依存の書き直しになる。

移植時は §3.1 の欠陥を持ち込まないこと — **属性単位の通知フラグが無いため、
日付属性を追加しただけで通知対象になり、誤通知が発生する**（monoca は既定オフのトグルで解決している）。

### 5.2 3テーマのカラートークン体系 — **フレームワーク非依存でそのまま持ち出せる**

`src/app/globals.css` ＋ `tailwind.config.ts`

Material 3 系のトーナルな設計。surface 5段（lowest / low / default / high / highest）、
primary / secondary / outline / error の各系統を CSS 変数で定義し、
`data-theme` 属性で amber / botanical / midnight を切り替える。
Tailwind 側は `darkMode: ['class', '[data-theme="midnight"]']` で dark を midnight に同居させている。

### 5.3 PWA 一式

`public/manifest.json`, `public/sw.js`, `public/firebase-messaging-sw.js`, `src/app/layout.tsx` の head

Service Worker のキャッシュ戦略が実用的:
navigate 要求はネットワーク優先（失敗時のみキャッシュ）/ Firebase・googleapis 系は常にネットワーク /
その他の静的アセットはキャッシュ優先。`next.config.mjs` に `/sw.js` 用の Cache-Control ヘッダ設定あり。
アイコンは 16 / 32 / 180 / 192 / 512 / 1024 を `public/` と `app-icons/` に用意済み。

### 5.4 Firebase 認証 + Firestore 購読の雛形

`src/hooks/useAuth.ts`, `src/hooks/useData.ts`, `src/lib/firebase.ts`

Google / メール認証、`onSnapshot` の `orderBy` 失敗時フォールバック、`writeBatch` による一括更新、
`ignoreUndefinedProperties` 付きの `initializeFirestore`。
`mercari-stock` は PIN + D1 なので直接は使わないが、Firebase 系を新規に建てる際の出発点になる。

### 5.5 プリセット定義（用途別の初期スキーマ案）

`src/types/index.ts` の `PRESET_TEMPLATES`

冷蔵庫 / 引き出し・棚 / 商品在庫 / 本棚 / デジタル資産 / 買い物リスト / アイデアノート の7用途について、
階層と属性を設計済み。**専用アプリを新規に建てる際の初期スキーマ案として再利用できる。**
実際、商品在庫の項目（仕入れ価格・仕入れ日・商品URL・JANコード）は
`mercari-stock` の `normal_items` と重なっている。

### 5.6 小物

- `exportToCSV()`（`src/app/page.tsx:100`）— BOM 付き UTF-8、ダブルクォートエスケープ。日本語 Excel 対応
- `logo.svg` / 宝箱アイコンの SVG パス（`src/app/page.tsx` 内にインライン）
- `stitch_tresor_inventory_manager*/` の DESIGN.md 4件 — 「The Tactile Archivist」「No-Line Rule」など
  色・タイポグラフィの指針。次のアプリのデザイン言語として再利用可

### 5.7 流用しないほうがよいもの

- **手書きのドラッグ並べ替え**（`src/app/page.tsx` に約240行、2箇所に重複）— 速度計算・慣性・スプリングバックを
  自前実装しているが `overshoot` / `springBack` は未使用。OS 標準やライブラリを使うべき
- **2,188行の単一コンポーネント構造** — 全画面・全モーダルが `page.tsx` 1ファイルに同居
- **アイテム単位の自由色**（`cardColor`）— 凡例も絞り込みも無く、状態色を導入すると意味が衝突する

---

## 6. 稼働環境について（一部対応済み）

**開発の凍結と、稼働の停止は別**。稼働側の状態は以下の通り。

- ~~Vercel デプロイ: `https://tresor-web.vercel.app`~~ → **2026-09-03 にプロジェクトごと削除済み（404）**
- Firebase プロジェクト: `tresor-app-cc24a`（`.firebaserc`）— **Blaze（従量制）**、2026-09-03 にコンソールで確認
- ~~Cloud Functions `sendDailyNotifications` が毎時実行される~~
  → **2026-09-03 に削除済み。** Cloud Scheduler ジョブと Pub/Sub トピックも同時に消え、
  **継続的に実行・課金される処理はゼロになった**

さらに 2026-09-03 の確認により、以下が判明している。

- GitHub リポジトリ `comodoidea-lab/tresor-web` は **public**
- `public/firebase-messaging-sw.js` に Firebase 設定がハードコードされ、追跡対象になっている
  （ただし Web API キーは設計上クライアントに露出する前提であり、これ自体は脆弱性ではない）
- Firestore ルールは **所有者限定型**（`request.auth.uid == userId`）で正しく書かれている。
  控えを [`firestore.rules`](firestore.rules) に保存した（従来リポジトリに存在しなかった）
- 登録ユーザーは **2件のみ**（本人と家族）。**第三者による不正登録の形跡は無い**
- 残る開口部は「第三者が新規登録して自分の領域に書き込める」＝**コスト方向のみ**。
  データ漏洩の経路は無い。緊急性は低いが、Blaze 従量制のため上限は無い

**手順と進捗は [`docs/FREEZE-OPS.md`](docs/FREEZE-OPS.md) に記録している。**
2026-09-03 時点で **Cloud Functions の削除・Auth プロバイダの無効化・Firestore ルールの全拒否・
Vercel プロジェクトの削除まで完了**。稼働中のバックグラウンド処理と公開面はいずれも存在しない。
未実施は **予算アラートの設定**と **Firestore データの JSON バックアップ**（いずれも任意）。

---

## 7. 記録の作成経緯

2026-09-03、以下の順で調査し、C案（開発凍結）を決定した。

1. コード監査（静的読解、実装変更なし）→ §3.1
2. 監査結果に基づく再起動ロードマップの作成（Phase 0〜3）
3. 直接競合 monoca 2 の実機検証 → §3.2、差別化の前提が否定される
4. `mercari-stock` との比較 → §3.3、用途特化に対する劣位が確定
5. 凍結を決定。Phase 0 を含む全実装を中止

