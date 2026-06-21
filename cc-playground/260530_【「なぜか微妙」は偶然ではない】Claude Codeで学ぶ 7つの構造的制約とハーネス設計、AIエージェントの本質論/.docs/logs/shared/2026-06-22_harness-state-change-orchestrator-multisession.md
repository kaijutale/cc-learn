---
date: 2026-06-22 07:10:59
type: observation
topic: harness-state-change-orchestrator-and-multisession
session: ハーネス状態変化の観測
target: ~/.claude (claude-harness) の前回(5ebc7c3) -> 現在(d3adf67) の状態変化
verifier: メインClaude (Opus 4.8, cc-playground オーケストレーター)
related_log_ids: [2026-06-21_hook-3parallel-orchestration-and-review]
related_pr: "kaijutale/claude-harness #30 #31 #33 #34 #36 #37 #38 #40"
---

# ハーネス状態変化の観測 — orchestrator issue#6 解決 + 複数セッション並行進化

> 前回(plan整理 5ebc7c3 + orchestrator worktree 準備)から今(06-22)までに、ハーネスは複数セッションの手で d3adf67 まで前進。issue#6 解決、essence-review-runs リネーム、multi-agent-safety への worktree 隔離知見追記が主な変化。

## 観測目的

cc-playground(観測サンドボックス)から ~/.claude(claude-harness)が前回作業以降どう変化したかを把握し、特に「わらわが準備した orchestrator worktree のその後」と「複数セッション並行の痕跡」を記録する。

## 観測環境

| 項目 | 値 |
|---|---|
| 対象 | ~/.claude (kaijutale/claude-harness) |
| 観測者 | メインClaude (Opus 4.8, cc-playground cwd) |
| 観測日時 | 2026-06-22 07:10 JST |
| 前回基点 | 5ebc7c3 (plan整理) |
| 現在 | origin/main = d3adf67 |

## 変化サマリ

| 項目 | 前回 | 現在 |
|---|---|---|
| origin/main | 5ebc7c3 | d3adf67 |
| issue #6 | OPEN | **CLOSED (PR#30)** |
| essence-review-runs | (旧名) | **records にリネーム (#33/#34)** |
| self-eval | runs配下 | records へ移行 (#37) |
| multi-agent-safety.md | — | **worktree隔離知見 追記** |
| worktree | main + fix-orchestrator(準備) | main(chore/sync) + issue-39 + fix-orchestrator(役目終了) |

## 各変化の詳細

### 1. orchestrator issue#6 解決 (わらわの準備が実を結んだ)
前回わらわが fix/orchestrator-issue-6 worktree を最新 main から作り「plan を読ませて着手」を提示。別セッションがそれで実装 -> **PR #30 (orchestrator 改善2件: 行50 inline glob bang の script化 + output-format の self-eval命名明示) -> squash マージ -> issue#6 COMPLETED (06-20)**。worktree は clean・マージ済で役目終了(621bc1a は squash ゆえ origin/main に hash 違いで非在、内容は保全)。

### 2. orchestrator 周辺の継続改善
#31 essence-summary 正本同期(32->35原則) / #36 issue#32 housekeeping(stale pending解消等)。orchestrator が複数セッションで磨かれ続けている。

### 3. essence-review-runs -> records リネーム (#33/#34) + self-eval 移行 (#37)
essence レビューの記録ディレクトリ改名。self-eval v9-v11 を records へ移行。

### 4. config 整理
#38 current-issue.md を gitignore(gtr issue worktree のローカル文脈の PR 混入防止) / #40 essence reminder 毎週金曜化 + harness config。

### 5. multi-agent-safety.md への worktree 隔離知見追記 (最重要の学び)
「ハーネス(~/.claude 自身)改修の並行 worktree は単体では隔離不可(稼働 claude は固定 ~/.claude を読む)。CLAUDE_CONFIG_DIR=<worktree> claude で起動して初めて隔離。gtr ai は env 不設定ゆえ隔離不可。skill/agent/rule/CLAUDE.md は隔離可、hook は settings.json の絶対パス参照ゆえ射程外」。

## 重要発見

- **「worktree 準備 -> 別セッション着手」パターンの実証**: 前回わらわが用意した orchestrator worktree が、別セッションの手で PR#30 まで到達し issue#6 を閉じた。オーケストレーター(準備)と実装(別セッション)の分業が機能した。
- **worktree 隔離の落とし穴 (multi-agent-safety 新知見)**: わらわは前回「worktree で別セッション着手」を提示したが、ハーネス自身の worktree は稼働 claude から見て隔離されない(固定 ~/.claude を読む)。skill/agent/rule は worktree 編集で隔離可だが、hook は settings.json 絶対パス参照ゆえ射程外。**CLAUDE_CONFIG_DIR 起動が真の隔離条件**。今後の並行ハーネス改修の前提。
- **ハーネスの高速並行進化**: #25-#40 が短期間に積まれた。cc-playground から観測すると、ハーネスが複数の手で生き物のように育っている。

## 改善候補

- わらわの fix-orchestrator-issue-6 worktree は役目終了(PR#30 マージ済・clean)。削除候補だが worktree 操作は明示指示要ゆえ、かいじゅう承認後に gtr rm。

## 結論

ハーネスは orchestrator issue#6 解決 + 周辺整理で 5ebc7c3 -> d3adf67 へ前進。わらわの fix-orchestrator-issue-6 worktree は役目終了。~/.claude は現在 chore/sync-uncommitted ブランチで「蓄積未commit 整理」中(別セッション/かいじゅう領域、わらわは不干渉)。
