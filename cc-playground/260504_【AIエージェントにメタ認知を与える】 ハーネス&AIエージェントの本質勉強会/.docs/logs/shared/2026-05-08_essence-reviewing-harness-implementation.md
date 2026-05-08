---
date: 2026-05-08
type: work
title: essence-reviewing-harness 実装 (3 領域並列 essence レビューハーネス新規構築)
status: completed
related_plan: ~/.claude/.docs/plans/archived/2026-05-08-essence-reviewing-harness.md
related_skills_new:
  - ~/.claude/skills/essence-reviewing-harness/SKILL.md
  - ~/.claude/skills/harness-essentials-reviewer-fork/SKILL.md
  - ~/.claude/skills/skill-essentials-reviewer-fork/SKILL.md
  - ~/.claude/skills/ui-essentials-reviewer-fork/SKILL.md
related_skills_referenced:
  - ~/.claude/skills/llm-debate/SKILL.md
  - ~/.claude/skills/llm-debate-reviewer/SKILL.md
  - ~/.claude/skills/review-agent-essence/SKILL.md
related_existing_agents_used:
  - ~/.claude/agents/harness-essentials-reviewer.md
  - ~/.claude/agents/skill-essentials-reviewer.md
  - ~/.claude/agents/ui-essentials-reviewer.md
related_memory:
  - feedback_no-existing-harness-modification.md
  - feedback_multi-agent-debate-design.md
  - feedback_skill-fork-asymmetry.md
  - feedback_disable-model-invocation-blocks-skill-tool.md
  - feedback_datetime-jst-not-utc.md
related_article: ~/.claude/.docs/references/note-articles/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
---

# essence-reviewing-harness 実装ログ

## 概要 (What)

3 領域 (ハーネス/skill/UI) の essence レビューを並列起動して統合判断を返す並列ハーネスを新規構築。
master skill 1 ファイル + fork sub-skill 3 ファイル = **計 4 ファイル新規作成、合計 753 行**。

既存 3 協調 skill (`three-elements-harness` / `orchestrating-team-development` / `enforcing-strict-tdd-cycle`)、`review-agent-essence`、 essence-reviewer agent 3 体は **完全無変更** (改修禁止 memory 完全遵守)。

## 設計意図 (Why)

### 出発点
かもねの問い: 「マルチエージェント協調 skill (`/three-elements-harness`, `/orchestrating-team-development`, `/enforcing-strict-tdd-cycle`) に essence-reviewer 6 体 (agent 3 + fork skill 3) を組み込むか?」

### 判断: 組み込まない (NO) + 並列ハーネス作成 (B-2)

| 判定項目 | 結論 | 根拠 |
|---|---|---|
| 既存 3 協調 skill への組込み (= 改修) | NO | 改修禁止 memory 違反 |
| 既存 `review-agent-essence` の改修 | NO | 2026-05-06 に同案 (Option A) を memory 例として却下済 |
| 新規ハーネス `essence-reviewing-harness` 作成 | YES | memory「新基準には新規ハーネス伴走」原則に整合 |
| fork skill 3 体新規作成 | YES | note記事の context:fork 経由 reviewer 呼出を実装 |
| 既存 essence-reviewer agent 3 体の改修 | NO | 現定義は完結性あり、流用可 |

### Plan agent の B-3 推奨が反証された経緯

Plan agent は「agent 3 体は既に fork skill 不要レベルの完結性あり、master skill 1 つで agent を Task 並列起動すれば十分 (B-3)」と主張。しかし:

- **note記事 (260404) の核心**: 「コンテキストフォーク経由でレビューアを呼び出す形にしておけば、メインのコンテキストを汚さずに評価を実行できる」
- `Task(subagent_type=...)` 経由 (Agent ツール) は **親 prompt で情報伝達** → メインコンテキストの一部が子に届く
- Skill `context: fork` + `subagent` 経由のみが **純粋な遮断** = !構文での決定論的注入のみで親 context を継承しない
- → かもねの note引用が技術的に正しく、Plan agent の B-3 推奨は overengineering ではなく **必要レベル不足** だった

### B-2 案の選定理由

| 案 | 採用判定 | 主な理由 |
|---|---|---|
| (A) 既存3 skillに組込 | ❌ | 改修禁止 memory 直接違反 |
| (B-1) fork skill 3 つ単独 | ❌ | 統合判断レイヤー欠落、ユーザーが手動オーケストレーション必要 |
| **(B-2) master + 3 fork skill** | ✅ | note記事準拠 (context:fork 純粋遮断) + Lead 統合判断 + llm-debate パターン踏襲 |
| (B-3) master 1 ファイル (Plan agent推奨) | ❌ | Task ツール経由は親 prompt で情報伝達 → メインコンテキスト汚染 |
| (B-4) review-agent-essence拡張版 | ❌ | 領域分岐の二重化で責務不明瞭、命名衝突 |

## 実装内容 (How)

### ファイル 1: master skill (`essence-reviewing-harness/SKILL.md`, 195 行)

- **frontmatter**: name + description のみ (`context:fork` なし、Lead 自身のコンテキストで動く)
- **!構文**: `date +%s` / `pwd` / `target.md` 存在確認 / `target.md` 本文
- **Step 1-5**: 議題確認 → 3 sub-skill 並列起動 → 戻り値分析 → Lead 統合判断 → 出力フォーマット
- **トリガー語**: 「essence レビュー」「essentials レビュー」「3 領域 essence」「全領域 essence」「ハーネス本質レビュー」「skill 本質レビュー」「UI 本質レビュー」「essence-reviewing-harness 起動」
- **出力**: 3 領域マトリクス + 領域横断分析 + Lead 統合判断 + Observability yaml

### ファイル 2-4: fork sub-skill 3 体 (各 172-204 行)

| ファイル | subagent | 評価基準 | 行数 | 領域固有要素 |
|---|---|---|---|---|
| `harness-essentials-reviewer-fork` | `harness-essentials-reviewer` | `harness-essentials.md` 8 原則 | 172 | - |
| `skill-essentials-reviewer-fork` | `skill-essentials-reviewer` | `skill-essentials.md` 8 原則 | 182 | Progressive Disclosure 観点 (`references/`/`scripts/` 構造評価) |
| `ui-essentials-reviewer-fork` | `ui-essentials-reviewer` | `ui-essentials.md` 8 原則 | 204 | 抽象語 grep + 5軸キーワード grep を !構文で並行注入 |

共通要素:
- **frontmatter**: `context: fork` + `subagent: <領域>-essentials-reviewer`
- **!構文**: `date` / `pwd` (Layer 1 cwd 対策) / `target.md` 全量 / 評価基準 essence ドキュメント / `git status` / `git log`
- **Step 0**: `cd "$PARENT_CWD"` (Layer 2 cwd 継承対策)
- **Step 1-5/6**: 評価基準 Read → 評価対象 Read → 関連度フィルタ → severity rubric → 反インフレチェック
- **出力**: 原則適用マトリクス (○/△/×/-) + severity 付き指摘 (🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low) + 改善提案 + Observability yaml

### 設計参考パターン (既存資産の踏襲)

- **llm-debate (master) + llm-debate-{role} (sub) パターン**: 5 視点議論構造を essence レビュー 3 領域版に転用
- **llm-debate-reviewer の出力構造**: 「結論 → 問題リスト → 観点評価 → 反インフレ → 反例 → Observability」を essence の 8原則 × 3領域 で再現
- **既存 essence-reviewer agent 3 体の流用**: `~/.claude/agents/{harness,skill,ui}-essentials-reviewer.md` を完全無変更で利用 (judging-review-severity rubric プリロード済、Edit/Write 非装備で構造的に書込不能)

## 検証結果 (Verification)

### 構造的検証 (Task #5 で実行、2026-05-08 05:11)

| 項目 | 結果 |
|---|---|
| 既存 protected ファイル mtime (改修禁止 memory 遵守) | ✅ 全 10 ファイルが今セッション (2026-05-08 05:00) 以前 |
| 新規 4 ファイル存在 | ✅ May 8 05:07-05:10 に作成、合計 753 行 |
| subagent 配線 (3 fork sub-skill → 対応 agent) | ✅ 全て正しく対応 |
| master skill に context:fork なし (Lead 自身のコンテキスト) | ✅ 確認 |
| Progressive Disclosure (各ファイル 500 行以内) | ✅ 最大 204 行 |
| Claude Code skill 認識 | ✅ available skills 一覧に 4 件全て登録 |

### トリガー語衝突確認

- `review-agent-essence` description: 「設計レビュー」「エッセンスレビュー」「原則チェック」
- `essence-reviewing-harness` description: 「essence レビュー」「essentials レビュー」「3 領域 essence」「全領域 essence」「ハーネス本質レビュー」「skill 本質レビュー」「UI 本質レビュー」「essence-reviewing-harness 起動」

衝突可能性ある語: 「エッセンスレビュー」(review-agent-essence) と 「essence レビュー」(essence-reviewing-harness) — 英日混在で類似

→ **部分的に衝突**。「3 領域」「全領域」「ハーネス本質」「skill 本質」「UI 本質」を含めることで明示的に master skill 発動可能 (使い分け運用推奨、master SKILL.md の Gotcha に明記済)

### 試験起動 (実運用検証は未実施)

- Phase 4 試験起動は今セッションで未実施
- 次回かもねが「essence レビューして」「3 領域 essence」等で発動して end-to-end 動作確認推奨

## 副作用・注意点 (Side effects)

### 設計上の制約
- **議題ファイル契約**: `/Users/camone/.docs/essence-review/CURRENT/target.md` を呼出元が事前配置必須 (絶対パス、cwd 非依存)
- **subagent 名 23-28 文字**: 起動時の identifier 長は要観察
- **subagent から Skill 呼出は公式 grayzone**: パターン C (TDD workflow 内から呼出) は要再検証

### トリガー語使い分け運用
- master skill 優先発動には「3 領域」「全領域」「ハーネス本質」「skill 本質」「UI 本質」のいずれかを含める
- 単に「エッセンスレビュー」のみだと `review-agent-essence` (汎用 11 原則) が優先される可能性

### 反インフレ原則の二段階適用
- 各 reviewer agent (Step 5/6) で 1 回適用 (領域内見落とし検出)
- master Lead 統合判断 (Step 4) で再適用 (領域横断視点での見落とし検出)
- 3 領域全 🟢 は Lead 視点でも赤信号として再検討

### Claude Only 原則維持
- 3 sub-skill いずれかが「外部 AI を使うべき」と提案しても Lead が棄却
- 評価基準 (essence ドキュメント) の更新もユーザー HITL 必須

## 次のステップ

### 実運用で確認すべき項目
1. master skill 起動 → 3 sub-skill 並列起動 → Lead 統合判断 の end-to-end 動作確認
2. cwd 継承対策 (Layer 1 + Layer 2) が subagent context で正しく機能するか実測
3. トリガー語衝突の実動作確認 (「エッセンスレビュー」入力時にどちらが優先発動するか)
4. メインコンテキスト汚染ゼロの確認 (subagent への入出力ログ可視化)

### 将来拡張候補 (本ログのスコープ外)
- 自動レビューフロー (commit/PR 作成時 hook 起動)
- 評価対象ファイル `target.md` のテンプレート化 (CLI ツール化)
- レビュー結果の永続化 (`.docs/essence-review/<date>_<target>/result.md`)
- Critical 検出時の自動 hook 化 (TDD cycle 完了後の essence audit gate)

## Observability

```yaml
Implementation:
  files_created: 4
  total_lines_added: 753
  existing_files_modified: 0          # 改修禁止 memory 完全遵守
  duration_min: ~30                   # Task #1〜#5 通算 (05:04 → 05:13)
  validation_steps: 6                 # 構造的検証 Step 1-6
  validation_pass: 6                  # 全 PASS
  task_count: 6                       # Task #1〜#6
  task_completed_at: "2026-05-08 05:13:21 +09:00"
  triggers_for_master:
    - "essence レビュー"
    - "essentials レビュー"
    - "3 領域 essence"
    - "全領域 essence"
    - "ハーネス本質レビュー"
    - "skill 本質レビュー"
    - "UI 本質レビュー"
    - "essence-reviewing-harness 起動"
  collision_with_review_agent_essence: "partial (エッセンスレビューのみで両ヒット可能性、3領域/全領域/本質付与で回避)"
```
