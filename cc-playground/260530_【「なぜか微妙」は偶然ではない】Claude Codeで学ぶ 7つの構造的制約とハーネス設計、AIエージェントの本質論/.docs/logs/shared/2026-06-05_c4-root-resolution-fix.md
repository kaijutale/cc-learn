---
date: 2026-06-05 20:30:00
type: work
topic: c4-root-resolution-fix
session: C-4 外部検証器 root課題(M)の根本修正
related_skill: [verify-test-fork]
related_agent: [coder]
related_log_ids:
  - 2026-06-02_c4-external-verifier-e2e-oracle-walkthrough
  - 2026-06-02_c4-external-verifier-e2e-session
related_log:
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-oracle-walkthrough.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-session.md
---

# C-4 外部検証器 root課題(M) 根本修正

> coder.md の oracle 呼出が `--root` を渡さず monorepo配下サブPJで root 誤解決する設計課題を、`--root="{WORK_DIR}"` 注入で根本修正。実機実証で monorepo頂点汚染が消えることを確認。

## 概要

agent層 e2e 検証が PASS した後の本筋改善。end-to-end 検証中に炙り出した設計課題(M)を修正した。

- **課題(M)**: coder.md Step5 の oracle 呼出5箇所が `--root` を渡さず、oracle の root 解決が `git rev-parse --show-toplevel` (monorepo頂点) に落ちる。本番 monorepo配下サブプロジェクト (turborepo/nx) で src探索・state書込・coverage実行が monorepo頂点にズレる。
- `feedback_project-root-cwd-not-monorepo` (project_root=cwd、monorepo頂点をgit_rootにしない) に oracle 配線が未準拠だった。

## 内容 (変更点)

harness-modification-policy 遵守 (全文Read済、後方互換、oracle の I/O契約不変=L1不可侵に非該当、policy「凍結ではない: バグ修正」で許容)。

### `~/.claude/agents/coder.md` (5箇所 + コメント)
- Step5 の oracle 呼出に `--root "{WORK_DIR}"` を注入: `assert-tests-unchanged --record` / `record-loop-iteration` / `assert-tests-unchanged --baseline` / `assert-coverage` / `assert-loop-budget`。
- `WORK_DIR = pwd` (project root、既に cwd race 対策で確立済) をそのまま root に流用。
- WORK_DIR 定義箇所に理由コメント追加 (root解決順 / monorepo誤解決の説明)。

### `~/.claude/skills/verify-test-fork/SKILL.md` (一貫性、2箇所)
- 可視化用 `assert-tests-unchanged --baseline` にも `--root "<### 作業ディレクトリ の !pwd 展開値>"` を付与。
- 「--root 一貫性」注記を追加。coder が project root に baseline を書くのに team-tester が monorepo頂点で読むと SKIPPED 誤判定する片手落ちを防ぐ。

## 実機検証 (修正の効果)

monorepo配下・**git init 無し** (=バグ条件) の subdir を再現して実証:

| 観点 | 結果 |
|---|---|
| バグ条件 | `git rev-parse --show-toplevel` = monorepo頂点 (`claude-code-learn`) を返す |
| 修正後 `--root="$(pwd)"` | state が **project-local** (`subdir/.docs/tdd-state/red-baseline.json`) に書かれる |
| monorepo頂点汚染 | **なし** (頂点に red-baseline 生成されず) |
| baseline 照合 | UNCHANGED exit 0 (project-local root で正常動作) |

→ `--root` 注入で root が project root に固定され、monorepo誤解決が解消することを確認。

## 設計意図

- 修正方法は (a) coder が `--root="$(pwd)"` 注入 を採用 (検討した (b) スクリプトの root 優先順変更 は全呼出元に影響し contract 的に重いため不採用)。(a) は coder 内部の呼び方変更のみで oracle 契約不変、最小・後方互換。
- sandbox 検証では git init で回避していたが、それは検証環境の回避策。本修正は **本番の monorepo配下PJ** で正しく動かすための根本対応。

## 副作用 / 残課題

- **新 coder.md は実 coder agent で再実行していない**: 変更は純粋に additive (`--root="{WORK_DIR}"` 追記) で WORK_DIR は既存利用のため agent 誤実行リスクは低いが、agent層フル再検証は未実施 (別セッション要)。
- agent層 failure path (調整ループ/llm-debate/改ざんBLOCK) は依然未検証 (前ログ参照)。
- ~/.claude/ の変更 (coder.md, verify-test-fork) は未commit (かもね依頼時のみ)。

## 関連ファイル

- `~/.claude/agents/coder.md` — oracle呼出 --root 注入 (Step5)
- `~/.claude/skills/verify-test-fork/SKILL.md` — 可視化 --baseline の --root 一貫性
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/*.sh` — oracle 本体 (--root は既存フラグ、変更なし)
