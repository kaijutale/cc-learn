---
type: work
title: C-4 外部検証器のハーネス組込み 実装 (Phase A-D / S1-S8)
date: 2026-06-02 14:42 +0900 (JST)
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_logs:
  - .docs/logs/shared/2026-06-02_c4-external-verifier-audit-and-plan.md
tags: [C-4, 外部検証器, oracle, TDD, enforcing-strict-tdd-cycle, shellcheck, multi-agent]
---

# C-4 外部検証器のハーネス組込み 実装ログ (Phase A-D)

## 概要

参照書籍の制約 C-4「自己申告は完了の証拠にならない」対策として、グローバルハーネス `~/.claude/` の TDD サイクル (enforcing-strict-tdd-cycle) に **外部検証器 (oracle)** を組み込んだ。完了判定を AI の自己申告でなく、捏造不能な物理的事実 (exit code / git hash / カバレッジ数値) で gate する。plan のハブ&スポーク6+1のうち S1〜S8 を実装 (S9 は任意・未着手)。

## 進め方 (幹直列・枝並列ハイブリッド)

依存グラフが直列 (共通基盤→P0→P1-P4) かつ `coder.md` を4タスクが奪い合う制約から、「完全並列」を避け以下を採用:

- **幹 (直列・メイン)**: Phase A 共通基盤 (S1-S2) → Phase B P0 (S3-S4)。MVP の心臓。
- **枝 (並列・subagent 3体)**: Phase C で P1/P2/P3 の oracle 本体を独立コンテキストの subagent に並列委譲 (別ファイルで競合ゼロ)。改修中の TDD ハーネスは使わず汎用 general-purpose を使用 (再帰リスク回避)。
- **集約 (直列・メイン)**: Phase D で `coder.md` への P1/P3/P4 配線をメインが1箇所で実施 (4タスクの同一ファイル奪い合いを構造的に回避)。

## 成果物

### 新規 (24ファイル、すべて `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` 配下)

- 共通基盤: `tests/assert.sh` (run_case/assert_output_contains/assert_summary)、`tests/run-all.sh`、`tests/assert-self.test.sh`、`lib/test-runner-detect.sh` (detect_unit_command/detect_coverage_command/parse_coverage_pct)、`tests/test-runner-detect.test.sh`、`tests/fixtures/test-runner-detect/` (package.json×2 / pyproject / coverage出力×3)
- P0: `assert-tests-unchanged.sh` (--record/--baseline, git hash 照合)、`tests/assert-tests-unchanged.test.sh`
- P1: `assert-coverage.sh` (--line-min/--branch-min, fail-closed)、`tests/assert-coverage.test.sh`、`tests/fixtures/assert-coverage/` (×4)
- P2: `assert-no-cycles.sh` (相対import DFS循環検出)、`tests/assert-no-cycles.test.sh`
- P3: `record-loop-iteration.sh` (JSON append+rollback)、`assert-loop-budget.sh` (budget監査)、`tests/assert-loop-budget.test.sh`

### 改修 (既存・後方互換)

- `~/.claude/agents/coder.md`: Rules 2項目 + ORACLE パス群定義 + ループ内 record + verify GREEN 後の baseline/coverage gate + ループ後 budget 監査 + Step6 レポートに Test integrity/Coverage/Loop budget/Reviewers 行。既存契約 (`Final result: GREEN ✅` / `[Coder Cycle Complete]`) は不変。
- `~/.claude/skills/verify-test-fork/SKILL.md`: `## テスト不変性検証` セクション + 指示項目7 + 出力に `Test integrity:` 行。既存 `Result: GREEN ✅ / RED ❌` 契約は不変、!構文11件も不変。

### 環境

- `brew install shellcheck` (0.11.0)。全 oracle の静的解析に使用。

## 検証結果 (exit code = 物理的証拠)

- **run-all 全体統合**: 6テストファイル **55ケース全PASS** (assert-coverage 17 / assert-loop-budget 9 / assert-no-cycles 7 / assert-self 4 / assert-tests-unchanged 5 / test-runner-detect 13)、exit 0。
- **shellcheck -x**: 全 `.sh` CLEAN (警告0)。
- **machine固有パス**: `.sh` 内 0件。**fixture .ts 残存**: 0件 (LSP ノイズ源なし)。
- **回帰確認** (harness-modification-policy 準拠): `Result: GREEN` parse契約 / `[Coder Cycle Complete]` 出力契約 / `!構文`件数 すべて不変。参照 oracle 実在、擬似コード変数定義は使用より前。

## 主要な技術的学び

1. **shellcheck の source 追跡**: `-x` + `# shellcheck source-path=SCRIPTDIR` (スクリプト自身のディレクトリ基準) が cwd 非依存で堅牢。`source=./x` は実行 cwd 依存で、一括検証時に SC1091 になる。
2. **find 出力と heredoc の stdin 競合**: `find | python3 - <<'PY'` は heredoc が stdin を奪うため不可。ファイル探索を python の os.walk に寄せて回避。
3. **git hash-object はリポジトリ外で動く**: tmp に git init 不要 (内容ハッシュ計算のみ)。改ざん検出 fixture を tmp に作れる。
4. **静的 .ts fixture の TS LSP ノイズ**: `~/.claude/` 配下に解決不能 import を持つ .ts を永続配置すると TS LSP が "Cannot find module" を出し続ける。tmp 動的生成で回避 (P0/P3 は元から tmp、P2 を後追いで統一)。
5. **lib の metric 無視バグ (P1担当が発見)**: `parse_coverage_pct pytest branches` が metric を無視し常に行%を返す (pytest-cov 標準出力に分岐列が無いため)。fail-closed (return 2) が C-4 整合の正解。根本修正済み (lib本体)。
6. **assert.sh の run_case は bash -c サブシェル**: source した関数は継承されない。cmd 文字列内で source するか export -f が必要。
7. **subagent 並列の競合回避**: 同一ファイル (coder.md) を触る4タスクはメイン集約、独立 oracle 本体だけ並列。これが「幹直列・枝並列」の設計根拠。

## 検証の信頼度ランク (C-4 の精神)

- **oracle 単体 = 実機検証済み (最高)**: 55ケースを exit code で確認。
- **配線 (coder.md/verify-test-fork の markdown) = 静的整合確認のみ**: 契約不変・参照実在・変数順序を確認したが、coder を実起動した end-to-end は未検証。

## 残작業 (次セッション)

1. **配線の end-to-end 実機検証** (最優先): 小 feature の spec を用意し coder を実起動、RED→record→implement→verify→baseline→coverage→budget が実際に回るか観察。これが完了して初めて配線が「実機検証済み」になる。
2. **S9 warn-hook** (任意): `hook_post_test_write_notice.sh` を /tmp に正本作成→かもね手動 cp+chmod+settings.json 配線。block しない補助警告。
3. lib pytest branches バグ修正に伴う回帰確認は完了済み (P1 は本体で先に弾くため影響なし、lib テストに回帰ケース追加済み)。
