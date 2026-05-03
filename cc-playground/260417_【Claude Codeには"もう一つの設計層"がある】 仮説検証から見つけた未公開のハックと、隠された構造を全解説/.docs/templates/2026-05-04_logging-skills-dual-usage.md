---
feature: logging-skills-dual-usage
session: 未設定
date: 2026-05-04 02:36:03
---

# Logging Skills Dual Usage — 実装ログと検証ログの役割分担実例

## 概要

C-3b 解消 plan 完了後、かもねが `/logging-implementation` と `/logging-validation-result` を順次起動。**2種類の永続記録を書き分けた経緯と学び**を残す。本セッションのメタ作業 (機能実装そのものではなく「実装活動の記録方法」) の実体験記録であり、両 skill の役割分担を次回 onboarding 時に参照できる形にする。

きっかけは「修正・検証完了後、何をどこに記録するか」の判断が曖昧だったこと。両 skill を順次起動することで、「実装ログ (templates/)」と「検証ログ (knowledge/)」の差を実装レベルで固めた。

## 実装内容

### 1. `/logging-implementation` 起動 → 既存実装ログの format 修正

skill 起動時、既存ログ (`2026-05-04_coordination-harness-integrity-c3bfix.md`) を skill 必須 format で再評価:

| 項目 | 既存 | skill 必須 | 対応 |
|---|---|---|---|
| frontmatter `feature` | `title:` で記述 | `feature:` (ケバブケース) 必須 | rename |
| frontmatter `session` | なし | 必須 (未設定なら明記) | 追加 (`未設定`) |
| frontmatter `date` | `2026-05-04` | `yyyy-mm-dd HH:MM:SS` | 時刻補完 |
| H2 `## 概要` | `## 背景` | `## 概要` 必須 | rename |
| H2 `## 実装内容` | `## 変更内容` | `## 実装内容` 必須 | rename |
| H2 `## 設計意図` | なし | 必須 | 新規追加 |
| H2 `## 副作用` | なし | 必須 | 新規追加 |

修正コミット: `d18031a` (`docs(260417): C-3b fix 実装ログを logging-implementation skill format に揃える`)

### 2. `/logging-validation-result` 起動 → 検証ログ新規作成

新 topic `coordination-harness-integrity` を作成:
```
.docs/knowledge/coordination-harness-integrity/2026-05-04-c3b-elimination-result.md
```

書いた内容 (実装ログとの差別化観点):
- frontmatter: `date / type / target / verifier / related_*` (実装フォーカスでなく検証フォーカス)
- 必須 H2: `検証目的 / 検証環境 / 実測結果サマリ / 各Stage 詳細結果 / 重要発見 / 結論`
- 重要発見セクションで **「記事/公式 docs に書かれていない知見」7件**を文書化

新規コミット: `2ccf184` (`docs(260417): C-3b解消検証の永続知識ログを追加`)

### 3. push (かもね手動実行)

ahead 4 commits を origin/main に反映:
- `01d4455` audit 出力 (Verdict GO)
- `e957a3f` 実装ログ初版
- `d18031a` 実装ログ format fix
- `2ccf184` 検証ログ

push: `62b29c7..2ccf184  main -> main`

## 設計意図

### なぜ「実装ログ」と「検証ログ」を分けるか

両者は「永続的な記録」だが、**問いの粒度が異なる**:

| 観点 | 実装ログ (`templates/`) | 検証ログ (`knowledge/`) |
|---|---|---|
| 答える問い | 「**何を作ったか**」 | 「**何が分かったか**」 |
| frontmatter 主軸 | `feature` (機能名) | `target` (検証対象) + `verifier` (誰が確認したか) |
| 必須 H2 | 概要 / 実装内容 / 設計意図 / 副作用 / 関連ファイル | 検証目的 / 検証環境 / 実測結果サマリ / 各Stage 詳細 / 重要発見 / 結論 |
| 想定読者 | 後セッションで「同じ機能を再修正する人」 | 後セッションで「同じ検証を再現したい人 + 学びを参照したい人」 |
| プロジェクト固有性 | 高 (本プロジェクトの実装) | 中〜低 (一般化された知見も含む) |

機能フォーカスと検証フォーカスを **同じファイルに混ぜると**、どちらの観点でも探しにくくなる (「あれどこ書いた?」問題)。**1ファイル1主題**で粒度を分ける方が後で trace 可能。

### なぜ skill が format を強制するか

`feature` (ケバブケース) や必須 H2 5/6 セクションが **ファイル単位で同じ位置にある**ことで:
- grep / yq による横断検索が機械的に機能 (例: 全 `feature: coordination-harness-*` を抽出)
- onboarding 時に「どこを読めばいいか」迷わない
- format 揺らぎが「いつ書かれたか」のメタ情報を汚染しない (skill 注意事項の旧フォーマット保持原則とも整合)

→ skill format は「個人スタイル」より「**機械検証可能なテンプレート**」を優先する設計判断。

### なぜ knowledge を git tracked にするか

`logging-validation-result` skill description:
> `.docs/knowledge/` 配下は git追跡対象。永続化されたknowledge は**プロジェクトの資産**

`.docs/templates/` (デフォルトは gitignored、本プロジェクトでは tracked) と異なり、knowledge は明確に **資産** = リポジトリと運命を共にする。実装ログは「ローカル作業記録」だが、検証ログは「未公開 hack の実証データ」として**価値が長期保持される**。

## 副作用

### 既存実装ログの format 違反が検出された

最初に `e957a3f` で書いた実装ログは独自 format (frontmatter に `title:` 等を独自定義)。`/logging-implementation` 起動時に skill 必須 format と照合して **format 違反が判明** → 修正 commit (`d18031a`) が追加で必要だった (+40 insertions / -4 deletions)。

教訓: **skill format は事前確認しないと後で修正コストが発生**。新規実装ログを書く前に skill 中身を Read で確認すべき。

### skill 再起動の手間

両 skill を起動する = 2回 Skill ツール経由で本体 SKILL.md を読み込む = context 消費。1回で完結する skill (例: 両者を統合した`logging-dual-mode-skill`) があれば効率的だが、設計上は **役割分離が優先** (skill 単一責任原則) なので、現状の 2-skill 構成を受け入れる。

### plan archive 後の追加 commit

本 plan の plan ファイル archive 後にも追加 commit (format fix + 検証ログ + 本ログ) が発生 = plan の `actual_outcome` には反映されない。これは設計上のトレードオフ (plan 完了 = 主機能完了、メタ作業は別 trace) で受容。

## 関連ファイル

### 本セッションで作成・修正したログ
- `.docs/templates/2026-05-04_coordination-harness-integrity-c3bfix.md` — C-3b 解消の機能実装ログ (commit `e957a3f` + format fix `d18031a`)
- `.docs/knowledge/coordination-harness-integrity/2026-05-04-c3b-elimination-result.md` — C-3b 解消の検証ログ (commit `2ccf184`、新 topic)
- `.docs/templates/2026-05-04_logging-skills-dual-usage.md` — **本ログ** (skill 利用パターンのメタ記録)

### 関連 commit (push 済、`62b29c7..2ccf184`)
- `01d4455` audit 出力 (Verdict GO)
- `e957a3f` 実装ログ初版
- `d18031a` 実装ログ format fix
- `2ccf184` 検証ログ

### 関連 skill (本セッションで利用)
- `~/.claude/skills/logging-implementation/SKILL.md` — frontmatter 5フィールド + H2 5セクション必須
- `~/.claude/skills/logging-validation-result/SKILL.md` — frontmatter 4必須 + H2 6必須セクション、新 topic 自動 mkdir
- `~/.claude/skills/commit/SKILL.md` — 起動したが本セッション関連は既に commit 済で対象なし、push 提案のみ

### 関連 plan
- `~/.claude/plans/archived/swift-orbiting-allen.md` — C-3b 解消 plan (status: completed、actual_outcome 追記済)

### 過去の関連実装ログ (参照、書き換えなし)
- `.docs/templates/2026-05-04_coordination-harness-integrity-bcfix.md` — 前 plan B+C 改修 (本ログ作成前に既存)
- `.docs/templates/2026-05-03_coordination-harness-integrity-bootstrap.md` — 前々 plan bootstrap
- `.docs/templates/2026-05-03_coordination-harness-integrity-postmortem.md` — 前々 plan Q&A
