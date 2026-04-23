---
date: 2026-04-21
target: orchestrating-team-development
target_path: /Users/camone/.claude/skills/orchestrating-team-development/SKILL.md
phase_completed: 1, 2, 3
phase_pending: 4, 5
basis_essence_review: .docs/plans/essence-review-orchestrating-team-development-2026-04-21.md
basis_fix_plan: .docs/plans/fix-plan-orchestrating-team-development-2026-04-21.md
file_size_before: 232
file_size_after: 263
file_size_delta: +31
git_tracked: false  # ~/.claude/ は git 管理外
rollback_strategy: Edit 逆操作（このログの "Edit 履歴" 節参照）
---

# L3 orchestrating-team-development 修正ログ（Phase 3 完了）

## 概要

L3 オーケストレーター skill `orchestrating-team-development` を agent-essence 11 原則に照らしてレビューし、優先度上位 3 件（V-2.2 / T-2.2 / C-5）の改善を最小 diff で適用した。下位層契約（L2 coder / enforcing-strict-tdd-cycle / L1 fork skills）は一切変更していない。

## 修正 3 件のサマリー

| # | 原則 | 位置 | 変更内容 |
|---|---|---|---|
| 1 | **C-5 報酬ハッキング** | Step 2（L97-98）+ Gotchas 末尾（L255） | spec/test の権限分離を明記。実装者による spec/test の編集をフェーズゲート違反として扱う |
| 2 | **V-2.2 behavior+structure 二層判定** | Step 5（L149）+ 新節「検証の二層構成」（L152-163）+ 判断ポイント表（L219） | 検証を behavior oracle（test/lint/branch-validator）と structure oracle（ファイルサイズ/関数長/循環依存/重複）の二層に分離。片方のみ pass は不完了 |
| 3 | **T-2.2 目標ドリフト抗力** | 新節「spec 再注入プロトコル」（L221-232） | フェーズゲート違反 2 回目 / FB ループ 2 ラウンド目 / Mode 遷移 / メンバー入替の 4 トリガーで `.docs/specs/<feature>.md` を再読込し AC を共有タスクリストに再注入。履歴 3 rev 超で spec 再策定シグナル |

## Edit 履歴（rollback 用、時系列）

### Edit 1: 修正 3-a（Step 2 チーム設計の C-5 権限分離）

- 位置: SKILL.md L94-97 の番号付きリスト項目 3 を拡張
- 追加行数: 2
- rollback: L97-98 の 2 行を削除

### Edit 2: 修正 3-b（Gotchas 末尾の C-5 実装者テスト編集禁止）

- 位置: SKILL.md Gotchas 最終行の次に 1 行追加（`## Reference Navigation` の前）
- 追加行数: 1
- rollback: L255 を削除

### Edit 3: 修正 1（V-2.2 Step 5 拡張 + 新節）

- 位置: Step 5 の箇条書きに 1 行追加 + 新節「検証の二層構成（V-2.2）」を Step 6 の前に挿入
- 追加行数: 14
- rollback: L149 の 1 行と L152-163 の新節ブロックを削除

### Edit 4: 修正 1-b + 修正 2（V-2.2 判断ポイント表行追加 + T-2.2 spec 再注入節）

- 位置: 判断ポイント表の最終行の次に 1 行 + 新節「spec 再注入プロトコル（T-2.2）」を `## 規模別ガイド` の前に挿入
- 追加行数: 14
- rollback: L219 の 1 行と L221-232 の新節ブロックを削除

## 下位層契約フリーズ検証（修正スコープの自己監査）

以下の呼出インターフェースが **実際に変更されていないこと** を確認:

- [x] `activate-agent-teams` への起動契約 — 変更なし
- [x] `enforcing-strict-tdd-cycle` 委譲契約 — Step 5 の本文記述は不変
- [x] `Agent` tool 経由の `coder` subagent 委譲 — Step 5 の本文記述は不変
- [x] `red-test-fork` / `implement-fork` / `verify-test-fork` — 言及の文言は修正前と同一
- [x] `agent-teams-patterns` / `authoring-agent-definitions` 参照 — Step 2 番号 1-2 は不変
- [x] `establishing-knowledge-persistence` / `spec-based-development` / `designing-dd` / `branch-validator` — Step 3 も不変

**結論**: L3 内部のみ修正、L2/L1 への波及なし。

## 検証戦略（Phase 4 への引き継ぎ）

- 別ターミナルで `cd test-tdd-cycle-validation/ && claude` を起動
- `/enforcing-strict-tdd-cycle` または `coder agent で REQUIREMENTS.md に従って TDDサイクルを実行してください`
- **Round 2 ベースライン**: 43/43 GREEN / Coverage 100% / 調整ループ 0 回
- 上記を下回ったら Phase 3 へ差し戻し（修正ログの Edit 逆操作で rollback）
- L3 の修正（検証の二層構成 / spec 再注入プロトコル / 権限分離）は **本文拡張のみ** で下位層の動作には触れていないので、Round 2 結果はそのまま再現するはず

## Phase 5 empirical 事前チェックリスト

収束判定の要件:

- [critical] Mode 選択が判断基準に従う（9 種類）
- [critical] 検証に behavior + structure 二層 oracle が適用される ← 今回の修正 #1 の動作確認
- [critical] フェーズゲート違反 2 回目で spec 再注入が実行される ← 今回の修正 #2 の動作確認
- [critical] 実装者が spec/test を書き換えようとしたとき構造的に拒否される ← 今回の修正 #3 の動作確認
- フェーズゲート（spec→design→test→impl→verify→review）がタスク依存で順序強制
- 相互レビューが異コンテキスト起動
- インフレ検知（全軸 A 以上は赤信号）

シナリオ最低 3 本 + hold-out 1 本:
- Sprint 2-3 人（標準）
- Marathon 5 人 worktree（大規模）
- Hotfix 単発（緊急）
- hold-out: Refactor または UI-First（過適合チェック用）

**過適合判定**: 収束時に hold-out の精度が直近平均 -15 ポイント以下なら baseline 再設計。

## スコープ外（backlog、次セッション以降）

次のセッション群で検討する改善:

- T-2.1 計画テンプレート外部化（`references/task-list-template.md`）
- V-1.1 hook による機械的防衛（テスト改変の自動 revert）
- K-1.1 Restartable Handoff スキーマ定義
- S-1.3 tool allowlist の defaults 全面対応（今回は部分対応のみ）
- K-2.3 観測面設計（activate-agent-teams 側の runtime 契約）
- Mode 遷移トリガー条件の明示（C-3 逃げ道封じ）
- Step 5 fork 失敗フォールバック（L2 側で対処する方が自然）
- L2 基盤 prerequisite の整合性監査（K-1.2）
- 共有タスクリスト書き込み競合（activate-agent-teams 側の責務）

## 次セッション group（執行順）

Session 2:
1. `coder` subagent フルループ（`/Users/camone/.claude/agents/coder.md`）
2. `enforcing-strict-tdd-cycle` フルループ

Session 3:
3. `verify-test-fork` / `red-test-fork` / `implement-fork` 簡易版

---

## 関連ファイル

- essence レビュー: `.docs/plans/essence-review-orchestrating-team-development-2026-04-21.md`
- 修正プラン: `.docs/plans/fix-plan-orchestrating-team-development-2026-04-21.md`
- 修正対象: `/Users/camone/.claude/skills/orchestrating-team-development/SKILL.md`
- 親プラン: `/Users/camone/.claude/plans/1-skills-subagents-2-skills-subagents-re-snug-eclipse.md`
- 検証環境: `test-tdd-cycle-validation/`
- 11 原則本体: `/Users/camone/.claude/skills/review-agent-essence/reference/agent-essence.md`
- Round 2 ベースライン: `.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md`
