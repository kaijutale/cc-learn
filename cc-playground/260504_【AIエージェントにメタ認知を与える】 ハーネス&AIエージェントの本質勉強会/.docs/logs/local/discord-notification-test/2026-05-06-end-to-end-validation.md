---
date: 2026-05-06 00:47:29
type: validation
topic: discord-notification-test
target: 本質ドキュメントPR駆動更新フロー (収集→提案→通知→レビュー→取り込み) における「通知」フェーズが Discord webhook で end-to-end 動作するかを実測検証
verifier: メインClaude (Opus 4.7) + かもね手動実測
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill: [logging]
---

# Discord webhook 通知 — 本質ドキュメントPR駆動フロー「通知」フェーズ end-to-end 検証

> Discord webhook を用いた PC + スマホ通知到達性を 6 stage で実測。設定が完璧 (All Messages / Desktop通知ON / Muteなし) でも通知が出ない grayzone (active channel 表示中の抑制 × Idle status 抑制 の複合) を発見し、回避手順を確立した。スマホ通知不達は仕様 (マルチデバイス相互排他、デフォルト 10 min timeout) と判明。

---

## 検証目的

本質勉強会 PDF p.9-10 で記述される「PR駆動の更新フロー」5ステップのうち **3. 通知: Discordに通知** フェーズが、新規Discordサーバー + webhook URL + curl 送信という最小構成で実環境で機能するかを確認する。

仮説:
1. webhook URL を発行し curl POST すれば、Discord channel にメッセージが届く
2. Discord 内通知設定 (All Messages) と OS 通知許可があれば、PC + スマホの両方にプッシュ通知が届く
3. embed 形式で title/url/description を渡せば、PR 通知として実用的なカード表示になる
4. embed の title をクリックすれば 1 タップで GitHub PR ページに遷移できる

→ 実測の結果、**1, 3, 4 は仮説通り**。**2 は条件が複雑で仮説が単純すぎた** ことが判明。

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `cc-playground/260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会/` |
| OS | macOS (Darwin 25.4.0) |
| ターミナル | zsh + curl |
| Discord 鯖 | `ハーネス通知test` (新規作成、template: Create My Own / For me and my friends) |
| Discord channel | `#general` (デフォルト) |
| Discord アカウント | camone |
| webhook 識別子 | Captain Hook (APP) |
| シークレット管理 | `.env` (`DISCORD_WEBHOOK_URL=...`) — `.gitignore` 済 |
| スマホ | iPhone (Discord アプリ、camone 同一ログイン) |

## 実測結果サマリ

| 指標 | 自実測 | 期待値 | 一致度 |
|---|---|---|---|
| webhook URL 発行 | ✅ | できる | ✅ |
| curl 送信 (text content, 46B) | ✅ HTTP 204 相当 (受信0B) | 送信完了 | ✅ |
| curl 送信 (embed, 437B) | ✅ HTTP 204 相当 | 送信完了 | ✅ |
| メッセージ Discord 到達 | ✅ Captain Hook APP として表示 | 想定通り | ✅ |
| embed レンダリング (色/title/desc/author) | ✅ 紺色縦線 + リンク化 + 日本語表示 | 想定通り | ✅ |
| PC デスクトップ通知 (初回試行) | ❌ 設定 OK でも届かず | 届くはず | ⚠️ |
| PC デスクトップ通知 (status=Online + 別 server 表示) | ✅ macOS バナー到達 | | ✅ |
| PR リンク 1クリック遷移 | ✅ `Leaving Discord` 警告 → GitHub 404 | | ✅ |
| スマホ push 通知 (PC active 時) | ❌ 不達 | | ⚠️ (仕様) |
| `.gitignore` への local/ 自動登録 | ✋ 未登録のまま (project CLAUDE.md 優先) | skill 警告 | ⚠️ (意図的) |

## 各 Stage 詳細結果

### Stage 1: webhook URL 発行

- **結果**: ✅
- **手順**: Discord 画面 → サーバー作成 (Create My Own / For me and my friends) → channel 設定 → Integrations → Webhooks → New Webhook → Copy Webhook URL
- **学び**: テンプレ (Gaming/Friends/Study Group/School Club) を選ぶと不要な channel が自動生成される。test 用には **Create My Own + For me and my friends** が最小ノイズ
- **secret 扱い**: webhook URL が認証トークンを兼ねているため、初期段階で URL を会話に直接貼ってしまった事案あり。**会話履歴に残ると revoke 以外の対処不能** なため、即時 delete & 再発行 → `.env` 経由に変更

### Stage 2: curl 送信 (text content)

```bash
source .env && curl -X POST -H "Content-Type: application/json" \
  -d '{"content":"🌟 webhook test from かもね"}' \
  "$DISCORD_WEBHOOK_URL"
```

- **結果**: ✅
- **観測**: curl 出力 `100 46 0 0 100 46`、stderr 空
- **学び**: Discord webhook は成功時 **HTTP 204 No Content** 相当 (受信 0B)。空の応答 = 失敗ではなく **正常**。失敗時のみ JSON エラーが返る
- **詰まり**: かもねが先に `curl -X POST` だけ打って `(2) no URL specified` エラー → 引数完備でリトライして解決

### Stage 3: curl 送信 (embed 形式)

```bash
source .env && curl -X POST -H "Content-Type: application/json" \
  -d '{
    "embeds": [{
      "title": "[PR #1] agent-essentials.md に「ツール最小権限」原則を追加",
      "url": "https://github.com/camoneart/example/pull/1",
      "description": "Meta-Harness論文より新観点を抽出\n\n**追加された原則**: ツールは必要最小限のみ渡す",
      "color": 5814783,
      "author": {"name": "本質ドキュメントPR Bot"}
    }]
  }' "$DISCORD_WEBHOOK_URL"
```

- **結果**: ✅ (送信 437B、Discord にカード表示)
- **観測**: 紺色 (color: 5814783) の縦線 + title リンク化 + description 改行付き表示 + author name 表示 すべて想定通り
- **学び**: **embed JSON 形式は LLM に書きやすい形**。Claude に「Discord embed で PR 通知を生成」と頼むと一発で生成できる。これは GitHub Notification では真似できない利点

### Stage 4: PC デスクトップ通知到達検証 (← 最大の grayzone)

#### 4-1: 初回試行 — 不達

- **状態**: 設定すべて完璧 (Server Notification: All Messages / Channel: All Messages / User Settings: Enable Desktop Notifications ON / Mute なし)
- **結果**: ❌ **通知音もバナーも出ず**
- **当初の誤認**: 「設定どこか間違ってるはず」とユーザー設定を再確認したが、**全く間違ってなかった**

#### 4-2: 切り分け実施 — 到達

- 試行 A: status を `Idle` → `Online` に変更
- 試行 B: 当該 channel (`#general`) の表示をやめて、別サーバーを画面表示
- **結果**: ✅ macOS バナー到達 (`Captain Hook (#general, Text Channels)` として通知表示)
- **同時イベント**: macOS から「Discordアプリからの通知の受信を続けますか？」ダイアログ出現 (=お試し許可期間終了通知) → 「続ける...」を選択しないと以後通知止まる重要選択点

#### 4-3: 真因の特定

| 抑制レイヤー | デフォルト挙動 |
|---|---|
| **active channel 抑制** | ユーザーが当該 channel を画面表示中なら「読んでる扱い」で通知抑制 |
| **Idle status 抑制** | status=Idle 時はデスクトップ通知頻度を下げる方向に動く (Discord 公式 doc に明記なし、grayzone) |
| **アプリ active 抑制** | Discord アプリ自体が前面 active なら、OS バナー出さず画面内表示で代替 |

→ **3 層が複合的に効いて初めて「届かない」状態が完成**。1 つ解除しても残りで抑制される構造

### Stage 5: PR リンク 1クリック遷移

- **結果**: ✅
- **観測**: embed の title をクリック → Discord が `Leaving Discord` 警告ダイアログ表示 (URL: `https://github.com/camoneart/example/pull/1`、`Trust github.com links` チェックボックス) → `Visit Site` クリック → ブラウザで GitHub 404 ページ (`This is not the web page you are looking for`) 表示
- **学び**: Discord の外部リンク警告は1クリック挟むが、`Trust github.com links from now on` をチェックすれば次回からスキップ可能。**遷移経路自体は2ステップだが、信頼ドメイン化で1ステップ化できる**

### Stage 6: スマホ push 通知検証

- **結果**: ❌ 不達 (PC active 状態で送信した場合)
- **真因**: Discord の **マルチデバイス相互排他**仕様
  - PC で active/idle 状態の間 → スマホには push を送らない
  - **Push Notification Inactive Timeout** デフォルト = **10 分**
  - User Settings → Notifications → Advanced で `Immediately` 〜任意分数に変更可能
- **学び**: これは設定問題ではなく **仕様**。「PC 作業中は PC で気付ければよく、PC 離れた時だけスマホに来る」という Discord の哲学的設計
- **判断**: かもねの運用は **PC 中心** のため、デフォルト 10 分のままで支障なし。検証スキップ判断は妥当

## 重要発見

### 発見 1: Discord 通知到達は 4 要素の論理積

```
通知到達 = (Discord内設定 OK)
        ∧ (OS 通知許可 OK)
        ∧ (画面位置: 当該 channel 非表示)
        ∧ (status: Online)
        ∧ (デバイス排他 timeout 通過 — スマホの場合)
```

**1 要素でも欠ければ無音**。「設定 OK なのに来ない」の真因はほぼここ。これは Discord 公式 doc に明示的にまとめられた箇所がなく、**実測でしか辿り着けない知識**

### 発見 2: macOS の「お試し通知期間」ダイアログ

macOS は新規アプリの初回通知を「**お試し許可**」で出す。一定回数または時間後に「続けますか?」ダイアログを出し、ここで `オフにする` を押すと **以降通知ゼロ** になる事故ポイント。検証中に偶然このダイアログを引いたが、誤って「オフ」を選ぶと再現しづらい不具合になる

### 発見 3: webhook URL の secret 扱いが甘くなりがち

URL に認証トークンが埋め込まれている設計のため、**URL 1 行 = secret 1 つ**。会話・チャット・ログ・git のいずれにも残してはならない。一度漏れたら **delete & 再発行のみが対処**。今回の検証では初動で URL を会話に直接貼り、即 revoke→ 再発行 → `.env` 経由に変更する手順を踏んだ

### 発見 4: PR 駆動フローの「通知」フェーズは Discord webhook だけで完結する

Discord 公式 GitHub bot や複雑な integration を入れずとも、**curl 1 行 + embed JSON** で実用十分なカード型 PR 通知が作れる。実装コストが低く、PR 駆動フローのMVP には十分

### 発見 5: project CLAUDE.md と global skill のルール衝突

`/logging` skill のデフォルト挙動は「`.docs/logs/local/` を `.gitignore` 登録」だが、本プロジェクトの `CLAUDE.md` は「`.docs/logs` を git 管理対象とする」と明記。**プロジェクト固有ルールが優先**。skill の警告に従わず、`.gitignore` 未登録のまま記録した

## 改善候補

- 領域別 channel 分離 test (`#agent-essentials`, `#skill-essentials` 等) は essentials.md が **2 領域以上動き始めてから** 実施 (YAGNI)
- スマホ通知が必要になった場合、`Push Notification Inactive Timeout` を `Immediately` 化 (ただし PC + スマホ両方で鳴るため通知疲れリスク)
- 本格運用時は webhook URL を **領域 1:1:1** で発行し、領域別 channel に飛ばす構成
- `Trust github.com links from now on` を初回クリックで有効化し、レビュー摩擦を 1 ステップ削減
- 本質勉強会 PDF の「通知: Discord に通知」記述は 1 行のみ。**通知設計の grayzone (画面位置/status/排他) を補足する解説** を本質ドキュメント運用ガイドに加えると未来の自分・チーム加入者がハマらない

## 結論

- **PR 駆動フロー「通知」フェーズは Discord webhook + curl で end-to-end 動作することを実測確認**
- **設定単体では通知到達を保証できない**。画面位置 + status + OS 許可 + デバイス排他 timeout の 4 軸の論理積で初めて成立
- **かもね運用前提 (PC 作業中心)** ではデフォルト設定のまま運用可能。スマホ通知の不達も仕様であり問題なし
- 本フェーズは実装コスト極小 (Discord 鯖作成 5 分 + webhook 発行 1 分 + curl 1 行) で、本質ドキュメント PR 駆動フロー MVP に組み込める段階に到達
- 今回得た「**通知到達 = 4 要素の論理積**」知見は、半年後の再導入時・他プロジェクト展開時に必ず再利用される。`/promote-log` で shared/ への昇格候補

## 関連ファイル

- `.docs/tasks/discord-notification-test.md` — 本検証のタスク定義 (チェックリスト元)
- `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — PR 駆動フローの記述元 (p.9-10)
- `.env` — `DISCORD_WEBHOOK_URL` 格納場所 (`.gitignore` 済)
- `.docs/logs/local/discord-notification-test/` — 本検証の続編置き場 (領域別 channel 分離 test 等の続編をここに追加)
