---
date: 2026-06-02 21:20:00
type: work
topic: c4-external-verifier-e2e-session
session: C-4 外部検証器 end-to-end 検証セッション (pickup 起点)
note: 作業日 2026-06-02 / ログ記録 2026-06-05 (後日記録、Gotcha に従い date は作業日)
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [pickup, handoff, logging]
related_agent: [coder, team-tester, team-implementer]
related_plan_id: 2026-06-02-external-verifier-gap-closure
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_log_ids:
  - 2026-06-02_c4-external-verifier-e2e-oracle-walkthrough
  - 2026-06-02_c4-external-verifier-implementation
  - 2026-06-02_c4-external-verifier-audit-and-plan
related_log:
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-oracle-walkthrough.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-implementation.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-audit-and-plan.md
---

# C-4 外部検証器 end-to-end 検証セッション (pickup → 実行 → 引き継ぎ)

> /pickup で handoff の next_phase (配線 end-to-end 実機検証) を引き継ぎ実行。oracle層は実機検証完了、agent層は cwd 制約で別セッション必須と判明し standalone sandbox を準備して kaiju へバトン。検証結果の詳細は [[2026-06-02_c4-external-verifier-e2e-oracle-walkthrough]] 参照。

## 概要

- 起点: `/pickup` で前セッションの handoff (status=in_progress, next_phase=「配線の end-to-end 実機検証」) を復元。
- 目的: C-4 外部検証器 (enforcing-strict-tdd-cycle/scripts の oracle 群) の配線が静的 markdown 指示でなく **実機で発火し exit code で gate するか** を確かめ、信頼度を「静的→実機」に上げる。
- kaiju 指示: 「end-to-end 実機検証」で進行 → agent層が回せないと判明後「standalone sandbox 準備(A案)」を選択 → 最後は「ここで区切る」。

## 内容 (セッションの流れと判断)

1. **pickup**: handoff frontmatter を機械パース。実体確認 (`~/.claude/.../scripts/` に 25 ファイル実在 = handoff と一致)。
2. **oracle層 実機 walk-through (完了)**: 既存検証 sandbox (260425) で `--root` 明示し 5 本を実行。全て pass=0 / 違反=1 / provider無=2(fail-closed) を実証。assert-coverage は注入モードに加え **real-mode (実測 vitest --coverage parse)** も後で standalone sandbox で検証。→ 詳細表は validation log。
3. **agent層が同一セッションで回せないと判明**: ① Agent tool に cwd param 無し + メイン Bash cwd reset、② coder.md の oracle 呼出が `--root` 無し → nested-repo で git-toplevel が monorepo頂点に誤解決、③ 既存 sandbox の vitest 破損 (workspace .pnpm store 消失) + coverage provider 無。
4. **standalone sandbox 準備 (A案実行)**: `~/c4-e2e-sandbox` を monorepo外・非gitリポで新設 (→ oracle root が pwd 解決で正しい)。vitest 4.1.8 + @vitest/coverage-v8 4.1.8 を install し pipeline + real-mode coverage の動作を実証。src/lib 空、spec 配置、`CLAUDE.md` にタスクブリーフ+検証チェックリスト設置。
5. **引き継ぎ**: agent層検証 (coder が coder.md を辿り oracle を自律発火させるか) は cwd 制約で kaiju が別セッション `cd ~/c4-e2e-sandbox && claude` → coder Agent 起動 で実施する段にバトンタッチ。

## 設計意図

- **なぜ standalone sandbox (monorepo外・非git)**: oracle の root 解決順は `--root` > `git rev-parse --show-toplevel` > `pwd`。coder は `--root` を渡さないため、検証対象が git リポ内 (= monorepo配下) だと root が monorepo頂点に誤解決する。monorepo外の非gitディレクトリにすれば git-toplevel が失敗し pwd にfallback = sandbox を正しく指す。これで nested-repo 罠と cwd 固定問題を同時に回避し、kaiju の別セッションで素直に回せる。
- **なぜ別セッション必須**: メインのこのセッションは cwd が 260530 PJ に固定 (毎コマンド reset)。Agent tool に cwd 指定がないため、coder を sandbox cwd で起動できない。cwd=sandbox のセッションを別途起動するのが唯一の正攻法 (2026-04-26 setup doc の「別セッション要」と一致)。

## 副作用 / 持ち越し

- **agent層 未検証 (kaiju 手番)**: coder 自律起動での oracle 発火確認は未実施。手順は sandbox の CLAUDE.md。
- **設計課題 (M) root 解決**: coder.md の oracle 呼出が git-toplevel 依存 → monorepo配下サブPJ (turborepo/nx 等) で誤解決。修正候補 = coder が `--root="$(pwd)"` 注入 or スクリプト優先順を pwd 優先に。harness 改修なので contract 確認後に判断 (agent層結果を見てからが自然)。
- **`~/c4-e2e-sandbox` を保持**: agent層検証用。完了後に削除可。
- **未 commit**: 本 log + validation log + 更新済 handoff。commit は kaiju 依頼時のみ。
- 検証用 sandbox (260425) は as-found に復元、/tmp scratch 掃除済。

## 関連ファイル

- `.docs/logs/shared/2026-06-02_c4-external-verifier-e2e-oracle-walkthrough.md` — oracle層 実機検証の詳細 (結果表・証拠・finding M)
- `.claude/handoff-state.md` — 更新済 (next_phase=agent層 別セッション、kaiju_action_required 明記)
- `~/c4-e2e-sandbox/CLAUDE.md` — 別セッション用タスクブリーフ + 検証チェックリスト
- `~/.claude/agents/coder.md` — 検証対象の配線本体 (Step 5 で oracle を発火)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` — oracle 群 (P0-P3) + lib + tests
