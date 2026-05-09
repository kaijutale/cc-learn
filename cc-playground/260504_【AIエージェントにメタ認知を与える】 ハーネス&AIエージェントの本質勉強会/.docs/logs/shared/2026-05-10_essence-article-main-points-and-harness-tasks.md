---
date: 2026-05-10 00:00:51
type: work
topic: essence-article-main-points-and-harness-tasks
session: harness-essence-study-and-task-derivation
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_log_ids: [2026-05-09_essence-reviewer-redesign-discussion, 2026-05-08_skill-context-fork-qa, 2026-05-06_essence-docs-v1-creation]
related_log: [.docs/logs/shared/2026-05-09_essence-reviewer-redesign-discussion.md, .docs/logs/shared/2026-05-08_skill-context-fork-qa.md, .docs/logs/shared/2026-05-06_essence-docs-v1-creation.md]
---

# 本質勉強会記事 main-points 化 + ハーネス構築タスク導出

> note記事「ハーネス&AIエージェントの本質勉強会」を全7セクション要点に圧縮し、それを起点に自分のハーネス構築タスクを23件 × 7カテゴリで構造化した。途中で「実装者にも本質ドキュメントを参照させるのか?」という派生Q&Aが発生し、非対称配布(reviewer=全量 / implementer=圧縮版)という設計原則を再確認した。

## 概要

### 目的

note記事 `260404_【AIエージェントにメタ認知を与える】ハーネス&AIエージェントの本質勉強会.pdf` の内容を、自プロジェクトのハーネス構築の文脈に橋渡しする2つの成果物を作る:

1. **要点まとめ** (`.docs/output/main-points.md`) ― 後で読み返すための地図として、各セクションの主張・理由・具体例を `-` ネスト箇条書きで凝縮
2. **タスクリスト** (`.docs/tasks/harness-construction-tasks.md`) ― 要点から「自分のハーネスに直接必要なアクション」を抽出し、優先度別にチェックリスト化

### 背景

- かもねは既に `harness-essentials-reviewer` / `skill-essentials-reviewer` / `ui-essentials-reviewer` / `team-*` / `coordination-harness-integrity-fork` 等の主要ハーネス資産を構築済み
- だが原典記事との照合は未実施 → 既存資産が記事の主張する全要素をカバーしているか、ギャップがあるかを可視化する必要がある
- そのための土台として、まず原典の論理構造をフラットに残し、次にタスク化する2段階アプローチを採用

## 内容

### フェーズ1: 派生Q&A — 「実装者も本質ドキュメントを参照するのか?」

ユーザーから次の疑問が発火:

> レビューアパターンの基本構造図では「実装者エージェント → 成果物 → レビューアエージェント(本質ドキュメント参照)」と書かれている。本質ドキュメントを参照させるのはレビューアエージェントのみだと思っていたが、実装者エージェントにも本質ドキュメントを参照させるのね?

**結論**: 参照させるが**全量ではなく圧縮版**。非対称配布が答え。

**根拠の整理**:

| 役割 | 配布粒度 | 理由 |
|---|---|---|
| Reviewer | 全量 (rubric含む) | 厳密評価のため |
| Implementer | 圧縮版 (指針のみ、rubricは消す) | 探索空間を潰さない / 採点ハック(Goodhart's law)を防ぐ / ユーザー意図吸収余地確保 |

**フィードバックループとの関係**:

- 実装者が本質を**全く知らない**: 雑な成果物 → reviewerで大量NG → ループ爆発
- 実装者が**全量持つ**: rubric最適化(採点ハック)が起きる
- 実装者が**圧縮版持つ**: 8割筋の良い成果物 → 部分NG → 1〜2回で収束 ← **これが正解**

**圧縮版の作り方の原則**:

1. 守らせたい原則のみ抽出
2. 評価のニュアンス・採点基準は削る
3. WHYは残し、HOWの細部は消す

### フェーズ2: main-points.md の作成

PDF全26ページ (PDFツールで pages: 1-10, 11-20, 21-30 と分割読込) + ユーザー提供スクリーンショットで全7セクション+まとめを把握。`-` ネスト箇条書き形式で構造化:

```
## N. <セクション名>
- <小見出し>
  - <主張・理由・具体例>
```

セクション構成:

1. AIエージェント・ハーネスエンジニアリングとは (2小見出し)
2. 本質ドキュメントの設計思想 (4小見出し)
3. レビューアパターンとフィードバックループ (5小見出し)
4. コンテキストフォークとサブエージェント設計 (6小見出し)
5. 決定論的制御と確率的制御のバランス (5小見出し)
6. 実践パターン (5小見出し)
7. Q&A (6問)
- まとめ (5ポイント + 最終メッセージ)

合計 38 小見出し相当を 1ファイルに凝縮 ≒ 元記事のファイル化された地図。

### フェーズ3: harness-construction-tasks.md の作成

main-points.mdから「自分のハーネス構築に必要な箇所」だけを抽出し、**7カテゴリ × 3優先度** で23タスク化:

| カテゴリ | タスク数 | main-points.md 対応セクション |
|---|---|---|
| A. 本質ドキュメント整備 | 3 | §2 |
| B. レビューア構築・運用 | 4 | §3 |
| C. サブエージェント設計 | 4 | §4 |
| D. 制御バランス | 4 | §5 |
| E. 自己強化機構 | 4 | §6 (前半) |
| F. ガードレール | 1 | §6 (環境分離) |
| G. 運用フロー (PR駆動) | 3 | §2 (後半) + §7 |

優先度層 (P0=即着手 / P1=1〜2週内設計判断 / P2=継続運用) で分類、着手順序を「P0棚卸し → P1設計実装 → P2運用定着」と推奨。

**ギャップ予測**: P0 棚卸しを実行すると以下が「既にカバー済み」として消し込み対象になる見込み:
- B1 (3つの essentials reviewer): 全て存在
- C1 (4役割エージェント): `team-*` + `Plan` + `Explore` でほぼ完備
- F1 (本番/開発分離): CLAUDE.md `Secrets` 3層モデルで既に対応

逆に「ギャップとして残る可能性」:
- A1〜A3 (各 essentials.md が5原理を網羅しているか未確認)
- B2 (各レビューアの終了条件明文化)
- C2 (実装者向け圧縮版本質ドキュメント)
- E2/E3 (FB蓄積 + 進捗外部化)
- G1 (PR駆動更新の自動化、Discord通知部分のみ進行中)

## 設計意図

### なぜ「要点まとめ → タスク化」の2段階にしたか

- 1段階で直接タスク化すると、抽出ミスが発生した時に「どこから来た判断か」が追えなくなる
- 中間に main-points.md を挟むことで、タスクリストの妥当性を後から検証可能
- main-points.md自体も「読み返しの地図」として独立価値を持つので無駄にならない

### なぜタスクを「優先度層」で分類したか

- 単純な順序リストだと「今日何をすべきか」と「3ヶ月後にどう運用が回っているか」が同じファイルから読み取れない
- P0/P1/P2 の3層に分けることで、着手順序が自然に決まる
- 「Gotcha追記=P0 / レビューア閾値設計=P1 / PR駆動更新サイクル=P2」のように、難易度ではなく**緊急度+依存関係**で層を切った

### なぜ「既存ハーネスとのギャップ確認」をタスク冒頭に置いたか

- かもねは既に主要ハーネス資産を構築済み → ゼロから作るのではなく**ギャップを埋める**段階
- これに気づかず作業を始めると同じものを二重実装する
- 着手順序欄に「✅ 印 + 該当エージェント名で消し込み」運用を明記し、二重実装を構造的に防ぐ

## 副作用

- main-points.md と既存の `essence-docs-v1-creation` (2026-05-06) との差分管理が今後発生する。原典PDFを2つ要約した形になるので、内容のずれが発生したらどちらが正か判断する必要がある
- harness-construction-tasks.md の優先度判定は私(Claude)の主観も入っている。実際の P0 棚卸しでギャップが想定と異なる場合、優先度を再調整する必要あり
- タスクファイル `step.md` (既存) と `harness-construction-tasks.md` (新規) の役割分担を冒頭で明記したが、両者を同時に運用すると重複しがち。step.md は「最初の一歩」で消化されたら役目終了の認識でOK

## 関連ファイル

- `.docs/output/main-points.md` — フェーズ2成果物。全7セクション要点まとめ
- `.docs/tasks/harness-construction-tasks.md` — フェーズ3成果物。23タスク × 7カテゴリ × 3優先度層
- `.docs/tasks/step.md` — 既存。「最初の一歩」リスト。本ファイルの祖先
- `.docs/tasks/discord-notification-test.md` — G1 (PR駆動5ステップ) の通知フェーズ検証タスク
- `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — 原典記事
- `.docs/references/sources/pdf/Meta-Harness_End-to-End_Optimization_of_Model_Harnesses.pdf` — 関連論文 (Meta-Harness)
- `.docs/identity/harness-identity.md` / `.docs/identity/skill-identity.md` — プロジェクト固有のアイデンティティドキュメント (本質ドキュメントとは分離管理)
- `~/.claude/agents/harness-essentials-reviewer.md` — B1で確認対象のレビューア (3つのうちの1つ)
- `~/.claude/agents/skill-essentials-reviewer.md` — 同上
- `~/.claude/agents/ui-essentials-reviewer.md` — 同上
