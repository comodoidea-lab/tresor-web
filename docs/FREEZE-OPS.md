# 凍結時の運用手順（未実行）

> **状態: 一部実施済み（2026-09-03）。バックグラウンド処理は停止済み、公開面は未処理。**
>
> 目的: 「**データは保存するが、バックグラウンド処理と不要な公開面は停止する**」凍結状態にする。
> 開発凍結の経緯は [`../README.md`](../README.md) を参照。進捗は §0 を参照。

---

## 0. 実施記録

### 完了

| 日付 | 工程 | 内容 |
|---|---|---|
| 2026-09-03 | Step 0 | 棚卸し完了。Functions 1本（us-central1）／Firestore は `(default)` 1つ／**複合インデックスは空**（保全対象なし）／ルールは所有者限定型／Auth ユーザー2件 |
| 2026-09-03 | Step 0 | 現行 Firestore ルールを [`../firestore.rules`](../firestore.rules) に保存（従来バージョン管理外だった） |
| 2026-09-03 | Step 1（前半） | Auth ユーザー2件を `~/tresor-backup-20260903/auth-users.json` へ退避。**リポジトリ外**（public リポジトリへの個人データ混入を避けるため） |
| 2026-09-03 | **Step 2** | **`sendDailyNotifications` を削除。** `functions:list` が空であることを確認済み（＝毎時実行は停止）。付随する Cloud Scheduler ジョブ・Pub/Sub トピック・ビルド成果物も削除されるはずだが、**`gcloud` 未導入のため未検証**（下記注記） |
| 2026-09-03 | **Step 3-1** | **Auth プロバイダを無効化。** Identity Toolkit へ照会し `PASSWORD_LOGIN_DISABLED` を確認（存在しない `.invalid` アドレスでの照会。アカウントは作成していない）。**第三者が新規登録する経路が閉じた** |
| 2026-09-03 | **Step 3-2** | **Firestore ルールを全拒否に変更。** `allow read, write: if false`（全パス）を配信。コンソールと Admin SDK は迂回するため管理者による取り出しは可能。凍結前の控えは [`../firestore.rules`](../firestore.rules) |
| 2026-09-03 | Step 0（追加） | **Hosting を確認。** 既定サイト `tresor-app-cc24a` は存在するがコンテンツ未デプロイ（`web.app` / `firebaseapp.com` とも 404）。一方 `__/auth/handler` は **200 で生存**。**触らない判断が正しいことを確認** |
| 2026-09-03 | **Step 3-3** | **Vercel プロジェクト `tresor-web` を削除。** `https://tresor-web.vercel.app` は 404。デプロイのみ削除する意図で `vercel remove` を実行したが、同コマンドはプロジェクト自体を削除する挙動だったため、**器も含めて消えた**（下記の注記を参照） |

> **これにより、凍結の目的は実質的に達成された。**
> 継続的に実行・課金される処理はゼロになり（Step 2）、
> 第三者が課金を発生させ得る唯一の経路も閉じた（Step 3-1）。
> 残る工程は多重防御と整理であり、緊急性はない。
>
> 復旧する場合は `functions/` で `npm i` 後に `firebase deploy --only functions`
> （`functions/node_modules` は未インストール）。Auth はコンソールでプロバイダを再有効化する。

> **未検証事項（`gcloud` 未導入のため）:**
> Step 2 で確認できたのは「Cloud Function が存在しないこと」まで。
> Cloud Scheduler ジョブ・Pub/Sub トピック・Artifact Registry のビルド成果物が
> 実際に消えたかは確認していない。**毎時実行が止まったことは関数の消滅で確定している**ため
> 実行・課金の停止に影響はないが、ストレージ残骸の有無は不明。
> 気になる場合は Cloud Console で
> Cloud Scheduler / Pub/Sub / Artifact Registry を目視確認すること。

> **Step 3-3 の副作用:** プロジェクト削除により `tresor-web.vercel.app` の
> サブドメインが**解放され、他の Vercel 利用者が取得可能な状態**になった。
> Firebase 側は Auth 無効化・ルール全拒否・関数削除により完全に閉じているため、
> 取得されても trésor のデータには到達できない。
> **残る論点は既存の PWA インストール2件のみ** — 当該オリジンの新しい所有者が
> Service Worker 経由でそれらの端末にコンテンツを配信し得る。
> **対処: 本人と家族の端末で PWA をアンインストールし、サイトデータを消去すること。**
> （名前を押さえ直したい場合は、同名の空プロジェクトを Vercel に作成すれば再確保できる）

> **検証の限界:** メール/パスワードの無効化は機能テストで確認済み。
> **Google プロバイダは同等の照会手段が無く（OAuth フローを要するため）、未検証。**
> コンソール上で無効になっていることを目視で確認しておくこと。

### 未実施

| 工程 | 内容 | 実施者 | 備考 |
|---|---|---|---|
| Step 1（後半） | Firestore データの JSON ダンプ | 要サービスアカウント鍵 | **急がない。** Step 2・3 のいずれもデータを消さず、コンソールからの閲覧も残る |
| Step 4 | 予算アラート ¥1 超 | コンソール | Blaze 従量制のための保険 |

---

## 1. コードと設定から確認した現状

| 対象 | 事実 | 根拠 |
|---|---|---|
| Firebase プロジェクト | `tresor-app-cc24a` | `.firebaserc` |
| Cloud Functions | **v1 の pubsub スケジュール関数が1本のみ** `sendDailyNotifications`、`0 * * * *`（Asia/Tokyo）、Node 20、リージョン指定なし＝ `us-central1` | `functions/src/index.ts:50`, `firebase.json` |
| 付随して作られる GCP 資源 | Cloud Function 本体 ／ Cloud Scheduler ジョブ ／ Pub/Sub トピック の3つ（v1 スケジュール関数の仕様） | 同上 |
| Firestore | `users/{uid}/templates`, `/items`, `/settings/default`, `/fcmTokens/{hash}` | `src/hooks/useData.ts` |
| Firestore ルール・インデックス | **リポジトリに存在しない**（コンソール管理と推定、バージョン管理外） | `git ls-files` に該当なし |
| Authentication | Google（`signInWithPopup`）＋ **メール/パスワード新規登録**（`createUserWithEmailAndPassword`） | `src/app/page.tsx:141,173` |
| Storage | バケットは設定済み（`tresor-app-cc24a.firebasestorage.app`）だが **書き込むコードが存在しない**＝ほぼ空 | 画像フィールド未実装 |
| Firebase Hosting | `firebase.json` に **hosting セクション無し**＝このリポジトリからはデプロイしていない。ただし既定サイトは `authDomain` として Google ログインの認証ハンドラを提供している | `firebase.json`, `authDomain` |
| FCM | Web Push。SW は `public/firebase-messaging-sw.js` | 同ファイル |
| Vercel | `vercel.json` は `{}`。公開URL `https://tresor-web.vercel.app`。`export const dynamic = 'force-dynamic'` によりアクセスごとにSSR実行 | `vercel.json`, `src/app/page.tsx:3` |
| GitHub | `comodoidea-lab/tresor-web` — **public**（2026-09-03 に未認証APIで確認） | GitHub API |

### 1.1 Firebase コンソールで確認済み（2026-09-03）

| 項目 | 確認結果 |
|---|---|
| 課金プラン | **Blaze（従量制）** — 推定ではなく確定。悪用時に上限が無い前提で扱う |
| 登録アプリ | ウェブアプリ 1件（`tresor-app`）のみ |
| Functions 呼び出し | **7日間で 167回**（24回/日 × 7日 = 168 とほぼ一致）。スケジューラが想定通り毎時起動している |
| Analytics | プロジェクト側では有効。ただし **コードから初期化されていない**（`firebase/analytics` の import も `getAnalytics()` の呼び出しも存在しない）。データ収集は発生しておらず、停止対象に含める必要はない |
| Firestore ルール | **所有者限定型**。`/users/{userId}/{document=**}` に対して `request.auth.uid == userId` のみ許可。それ以外のパスは既定で拒否。控えを [`../firestore.rules`](../firestore.rules) に保存済み |
| Authentication | **登録ユーザーは2件のみ**（本人と家族、いずれも Google プロバイダ）。**第三者による不正登録の形跡なし** |
| 最終ログイン | 2026-04-25（最終コミット 2026-04-04 の約3週間後）。以降 4か月以上アクセスなし |
| 認可済みドメイン | `localhost` / `tresor-app-cc24a.firebaseapp.com` / `tresor-app-cc24a.web.app` / `tresor-web.vercel.app` / **`vercel.app`**。最後の1つは広すぎる指定で、任意の `*.vercel.app` から認証フローを実行できてしまう。**プロバイダを再有効化する場合は先にこれを削除すること** |

> **注意:** Analytics ダッシュボードの「データなし（過去14日）」は、
> Analytics が初期化されていないことによる当然の結果であり、
> **利用者がいないことの証拠にはならない。** 実際の利用者数は Authentication の
> ユーザー一覧で確認すること（下記 §6）。

---

## 2. 五分類

### 2.1 停止するとデータが失われるもの

| 操作 | 失われるもの |
|---|---|
| Firebase プロジェクトの削除 | すべて。**再開条件を残す方針とは両立しない** |
| Firestore データベースの削除 | `users/*` 配下の全データ |
| Authentication ユーザーの削除 | uid。**Firestore の `users/{uid}` は残るが到達不能になる**（ログインで戻れない） |
| Firestore ルールの上書き | **現行ルールの内容**。リポジトリに無いため、控えを取らずに書き換えると元が失われる |

> Cloud Functions の削除、Scheduler の停止、Auth プロバイダの無効化、Vercel の削除は、
> **いずれもデータを失わない**。

### 2.2 停止しても既存データを保持できるもの

- Cloud Scheduler ジョブの一時停止（`pause`）— 最小・完全可逆
- Cloud Functions 関数の削除 — 再開はリポジトリから再デプロイ
- Auth プロバイダの無効化 — ユーザーレコードは残る。再有効化で復帰
- Firestore ルールを全拒否に変更 — データは残る。Admin SDK とコンソールは影響を受けない
- Vercel プロジェクトの削除 — データは Firebase 側。コードは GitHub に残る
- `users/*/fcmTokens` の削除 — 端末側で再取得可能

### 2.3 継続的に課金・実行・読み取りが発生し得るもの

| 資源 | 発生量 | 現実的な費用 |
|---|---|---|
| Cloud Scheduler ジョブ 1件 | 毎時起動 = 720回/月 | 無料枠 3ジョブ/月 の範囲内 |
| Cloud Functions 呼び出し | 約720回/月 | 無料枠（200万回/月）の範囲内 |
| Firestore 読み取り | 毎時 `collectionGroup('settings').get()` = 設定ドキュメント数 × 24/日 | 利用者が少なければ無料枠内 |
| FCM 送信 | トークンが登録済みで条件に合致した場合のみ | 無料 |
| Artifact Registry / `gcf-sources-*` バケット | デプロイ済み関数のビルド成果物が**常時保管される** | **唯一じわじわ残るストレージ課金**（関数を削除するまで消えない） |
| Vercel | アクセスごとに SSR 実行 | Hobby は無料 |

> **現状の実費はほぼ ¥0 と見込まれる。問題は金額ではなく、Cloud Functions を使う都合で
> プロジェクトが従量課金（Blaze）である前提のため、悪用された場合に上限が無いこと。**

### 2.4 外部公開・セキュリティ上、放置すべきでないもの

> **2026-09-03 の確認により、当初の想定より危険度は低い。**
> Firestore ルールは所有者限定型で正しく書かれており、登録ユーザーは本人と家族の2件のみ。
> **既存データが第三者に読まれる経路は無く、不正登録の形跡も無い。**
> 以下は「起きていないが、開いたままの口」として扱う。緊急対応ではなく、計画的に閉じればよい。

1. **第三者がアカウントを作れる状態は続いている（残る唯一の実害経路）**
   ルールが所有者限定であるため、他人のデータは読めない。しかし新規登録した第三者は
   **自分の `users/{uid}` 配下に無制限に書き込める**。Blaze 従量制のため、
   書き込み量と保存量はそのまま課金対象になる。データ漏洩ではなく**コスト方向のリスク**。

2. **Vercel を消しても、この口は閉じない**
   Web API キーは公開前提でクライアントに露出しており、フロントエンドが無くても
   Identity Toolkit の REST API を直接叩けばアカウントは作成できる。
   **登録を実際に止められるのは、コンソールで Auth プロバイダを無効化したときだけ。**

3. **`public/firebase-messaging-sw.js` の Firebase 設定が public リポジトリに含まれている**
   ただし **Web API キーは設計上クライアントに露出する前提**であり、デプロイ済みサイトからも取得できる。
   **鍵の露出そのものは脆弱性ではない。** 対処は鍵のローテーションではなく 1 を閉じること。
   リポジトリを private にしても、公開サイトが生きている限り露出量は変わらない。

4. **Cloud Functions が動き続けている**
   凍結後も、条件に合致すれば実在の端末へ通知が飛ぶ。

5. `NEXT_PUBLIC_FIREBASE_VAPID_KEY` がローカル `.env.local` に存在しない
   Vercel 側に設定されているかはコードからは判定不能。棚卸し時に確認対象。

### 2.5 将来再開するために残すべきもの

- Firebase プロジェクト `tresor-app-cc24a` 本体（**削除しない**）
- Firestore データ本体と、エクスポート済みバックアップ
- Authentication のユーザーレコード
- **現行 Firestore ルールの控え** — 現在リポジトリに無い。凍結作業の一部として `firestore.rules` に保存する
- `.env.local` の値（`.gitignore` 済み、ローカルのみ）と Vercel 側環境変数の一覧
- GitHub リポジトリ（コード）
- **`tresor-app-cc24a.firebaseapp.com` の既定 Hosting サイト** — Google ログインの `__/auth/handler` を提供している。
  これを削除するとポップアップ認証が壊れるため、**触らない**

---

## 3. 最小手順（順序に意味がある）

> 実行前に `firebase login` / `gcloud auth login` が必要。
> リージョンとジョブ名は下記の想定だが、**実行前に一覧で確認すること。**

### Step 0 — 現状の棚卸し（読み取りのみ）

```bash
firebase projects:list
firebase functions:list --project tresor-app-cc24a
gcloud scheduler jobs list --project tresor-app-cc24a
gcloud pubsub topics list --project tresor-app-cc24a
```

Firebase コンソールで以下を確認・記録する。
- ~~Firestore → ルール（全文をコピーしてリポジトリの `firestore.rules` に保存）~~ → **完了**（[`../firestore.rules`](../firestore.rules)）
- Authentication → Sign-in method で有効なプロバイダ
- 課金プラン（Blaze / Spark）と現在の請求額

### Step 1 — バックアップ（**必ず最初**）

Step 3 で Auth を止めると自分もログインできなくなるため、**先にデータを退避する。**

> **アプリ内の「CSVバックアップを出力」は backup として不十分。**
> アイテムしか出力されず、テンプレートの階層・属性・型が失われる（`README.md` §3.1 参照）。

```bash
# Firestore を既存バケットへエクスポートし、ローカルへ取得してから GCS 側を削除する
gcloud firestore export gs://tresor-app-cc24a.firebasestorage.app/backup-20260903 \
  --project tresor-app-cc24a

gsutil -m cp -r gs://tresor-app-cc24a.firebasestorage.app/backup-20260903 ./backup/
gsutil -m rm -r gs://tresor-app-cc24a.firebasestorage.app/backup-20260903

# 認証ユーザーの退避
firebase auth:export ./backup/users.json --project tresor-app-cc24a
```

`./backup/` は **リポジトリにコミットしない**（個人データを含む）。`.gitignore` への追加を先に行う。

> **リポジトリは public。** バックアップ内容・メールアドレス・UID を
> `README.md` や本書へ書き写さないこと。件数と概要のみ記録する。
>
> 登録ユーザーは2件で、うち1件は家族のアカウント。Step 3-1 の Auth 無効化は
> 家族側のログインも止める。`gcloud firestore export` は両方のデータを含むため、
> バックアップとしては充足している。

### Step 2 — バックグラウンド処理を止める

**選択肢A（可逆性を優先・推奨）** — 関数を残し、実行だけ止める。

```bash
gcloud scheduler jobs pause firebase-schedule-sendDailyNotifications-us-central1 \
  --location us-central1 --project tresor-app-cc24a
```

**選択肢B（費用ゼロを優先）** — 関数ごと削除。Scheduler ジョブと Pub/Sub トピックも同時に消え、
2.3 で唯一残っていたビルド成果物のストレージ課金も消える。再開はリポジトリから再デプロイ。

```bash
firebase functions:delete sendDailyNotifications --project tresor-app-cc24a
```

> 凍結が長期前提であれば **B を推奨**。関数は `functions/src/index.ts` 192行から再現できる。

### Step 3 — 公開面を閉じる

**3-1. Auth プロバイダを無効化**（コンソール → Authentication → Sign-in method）
Google と メール/パスワード の両方を無効にする。新規登録と既存ログインの両方が止まり、ユーザーレコードは残る。

**3-2. Firestore ルールを全拒否に**（Step 0 で控えを保存済みであること）

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

コンソールとサーバー SDK からは引き続きアクセスできるため、後日の取り出しは可能。

**3-3. Vercel の公開を止める**
プロジェクトを削除するのが最も確実（コードは GitHub に残り、再デプロイは数分）。
残す場合は Deployment Protection を有効にし、Firebase 系の環境変数を削除する。

### Step 4 — 保険

Google Cloud の予算アラートを ¥1 超で設定する。想定外の課金が起きた場合に気づける。
停止操作ではないが、従量課金プランを残す以上これが最後の防波堤になる。

### Step 5 — 記録

`README.md` §6 を「未処理」から実施済みに更新し、実施日・選んだ選択肢・
Vercel を削除したか否かを追記する。

---

## 4. 実行後に残るもの

| 残るもの | 状態 | 費用 |
|---|---|---|
| Firebase プロジェクト | 存続（Blaze のまま） | 使用しなければ ¥0 |
| Firestore データ | 保持。ルールにより外部アクセス不可 | 無料枠内 |
| Auth ユーザーレコード | 保持。ログインは不可 | ¥0 |
| Storage バケット | ほぼ空 | ¥0 |
| Hosting 既定サイト | **意図的に残す**（認証ハンドラ） | ¥0 |
| GitHub リポジトリ | public のまま。判断は別途 | ¥0 |
| Cloud Functions | 選択肢Aなら残存（停止中）／Bなら削除 | A: ビルド成果物のみ／B: ¥0 |

---

## 5. 再開時の逆順

1. Vercel プロジェクトを再作成し、環境変数を再設定（`.env.local` の値を使用）
2. Firestore ルールを `firestore.rules` の控えから復元
3. Auth プロバイダを再有効化
4. 必要であれば `firebase deploy --only functions`
5. 通知を再開する場合、`users/*/fcmTokens` は無効化されている可能性が高く、端末側で再取得が必要

---

## 6. 未確認事項

2026-09-03 のコンソール確認で、課金プラン・登録アプリ・Functions 稼働状況・Analytics・
**Firestore ルール・Authentication ユーザー**は解決した（§1.1）。残るのは以下。

1. **有効な Auth プロバイダの一覧** — 登録済み2件はいずれも Google だが、
   コード上はメール/パスワード登録も呼び出している（`createUserWithEmailAndPassword`）。
   プロバイダが有効なままかは未確認。Step 3-1 で両方を無効化するなら確認は不要。
   *確認先: コンソール → Authentication → ログイン方法*
2. **これまでの実際の請求額** — Blaze 確定により確認価値が高い。
   *確認先: コンソール左下「Blaze 従量制」→ 使用量と請求額*
3. ~~`users/*/fcmTokens` の登録件数~~ → **論点として消滅**（関数を削除したため通知は発生しない）
4. ~~Vercel 側の環境変数~~ → **論点として消滅**（プロジェクトごと削除済み）
5. ~~Firebase Hosting の既定サイトに何かデプロイされているか~~ → **確認済み: 未デプロイ（404）。認証ハンドラのみ稼働**
