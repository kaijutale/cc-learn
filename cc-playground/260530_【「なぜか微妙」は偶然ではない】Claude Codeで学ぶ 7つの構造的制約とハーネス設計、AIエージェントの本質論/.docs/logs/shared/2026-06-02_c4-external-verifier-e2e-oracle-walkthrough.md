---
type: validation
title: C-4 外部検証器 end-to-end 検証 — oracle層 実機walk-through + agent層 sandbox準備
date: 2026-06-02 21:19:00 +0900
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_logs:
  - .docs/logs/shared/2026-06-02_c4-external-verifier-implementation.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-audit-and-plan.md
verifies: "C-4 外部検証器 (enforcing-strict-tdd-cycle/scripts) の配線が実機で発火し exit code で gate するか"
---

# C-4 外部検証器 end-to-end 検証

C-4「自己申告は完了の証拠にならない」対策として組み込んだ外部検証器(oracle)群が、
静的なmarkdown指示でなく**実機で実際に発火し exit code で gate するか**を検証した。

## 結論 (分解して断定)

- **oracle層 (検証器が発火し exit code で gate するか)**: **実機検証 完了**。5本全部が pass経路=0 / 違反経路=1 (or fail-closed=2) を実プロジェクト文脈で実証。
- **agent層 (coder が coder.md を辿って oracle を自律発火させるか)**: **未検証**。専用sandbox(`~/c4-e2e-sandbox`)を準備済み。cwd制約のため別セッションで実施する(下記手順)。
- **副産物**: 実機検証が設計課題を1件炙り出した(root解決のmonorepo誤り、M severity)。

## oracle層 walk-through 結果 (実機)

検証環境: `cc-playground/260425_multi-agent-orchestration-verify`(既存のTDDハーネス検証sandbox)。
nested-repo の root誤解決を避けるため全 oracle に `--root` を明示。

| oracle | pass経路 | gate(違反)経路 | 判定材料 |
|---|---|---|---|
| P0 assert-tests-unchanged | UNCHANGED → exit 0 | テスト改ざん(SHA `5900a092`→`d8439c6f`) → **TAMPERED exit 1** | 実 git hash-object |
| P3 record-loop + assert-loop-budget | 2/3周 RED→GREEN → exit 0 | 超過(4>3) / 飛び番(n=1,3) / GREEN後追加 → 全て **exit 1** | 物理 coder-loop.json |
| P1 assert-coverage (注入) | 90.12%/88% & 境界80%/75% → exit 0 | 50%/40% → **exit 1** / provider無 → **exit 2 (fail-closed)** | 実 vitest 出力 fixture |
| P1 assert-coverage (real-mode) | 自動検出→vitest --coverage実行→parse: 100%/100% → exit 0 | (注入側で違反確認済) | 実 runner 実測 |
| P2 assert-no-cycles | 実src(1 edge, 循環なし) → exit 0 | 人工 a↔b → **CYCLIC exit 1** | 相対 import DFS |

- P0 改ざん検出(C-4の心臓)は実 git hash で改ざんを物理捕捉し GATE 発火を確認。
- **P1 real-mode** は前回 sandbox の vitest 破損で出来なかった経路。standalone sandbox で coverage-v8 導入後に検証し、注入モードと併せて両経路カバー。
- exit code 規約 (0=pass / 1=違反 / 2=config error fail-closed) が全 oracle で一貫。

## agent層 が同一セッションで回せない理由 (3障害)

| 障害 | 中身 |
|---|---|
| cwd固定不可 | メインのBash cwdは毎コマンドreset。Agent tool に cwd 指定 param も無い → coder起動してもcwdが検証対象に固定されず fork skill の `!find src` が空振り |
| nested-repo root | coder.md の oracle 呼出は `--root` を渡さず `git rev-parse --show-toplevel` 依存。sandbox が monorepo 内だと root が monorepo頂点に誤解決 |
| vitest破損+provider無 | 既存sandboxの vitest symlink が宙ぶらりん(workspace .pnpm store消失)、coverage-v8 未導入 |

→ 真の agent層検証には **monorepo外 standalone sandbox + 動作する vitest + cwd=sandbox の専用セッション** が必要(2026-04-26 setup doc の「別セッション要」と一致)。

## 設計課題 (M): oracle root 解決が monorepo配下で誤る

- coder.md の oracle 呼出 5箇所すべてが `--root` 無し → `git rev-parse --show-toplevel`(monorepo頂点)を root に採用。
- monorepo配下サブプロジェクト(例 `monorepo/apps/web`、turborepo/nx)では root が monorepo頂点に誤解決 → src探索/state書込/coverage実行が全部ズレる。
- `feedback_project-root-cwd-not-monorepo`(project_root=cwd、monorepo頂点をgit_rootにしない)に oracle配線が未準拠。
- **修正候補**(未実施・要kaiju判断): (a) coder が `--root="$(pwd)"` を明示注入 / (b) スクリプトの root 優先順を `--root` > `pwd` に変更(git-toplevel を外す)。harness改修は contract 確認が要るため本ログでは報告に留める。

## agent層検証用 standalone sandbox (準備完了)

- パス: `~/c4-e2e-sandbox`(monorepo外・**git repo でない** → oracle root が pwd に解決 = 正しい)
- vitest 4.1.8 + @vitest/coverage-v8 4.1.8 導入済(pipeline + real-mode coverage 動作確認済)
- `src/lib/` 空(coder が埋める)、spec = `.docs/specs/CURRENT/spec.md`(add関数)
- `CLAUDE.md` にタスクブリーフ+検証チェックリスト設置(別セッションで自動ロード)

### 実行手順 (別セッション)

```
cd ~/c4-e2e-sandbox && claude
# セッション内で:
Agent(subagent_type="coder", prompt="Feature: add-function\nSpec: .docs/specs/CURRENT/spec.md\nTDDサイクル(RED→GREEN→調整最大3周)を完走させて。")
```

### 検証ポイント

- coder 最終レポートに `Test integrity: UNCHANGED` / `Coverage: ... PASS` / `Loop budget: WITHIN-BUDGET` / `Final result: GREEN`
- 物理痕跡 `~/c4-e2e-sandbox/.docs/tdd-state/{red-baseline.json, coder-loop.json}`
- 成果物 `src/lib/{math.ts, math.test.ts}`
- **核心**: coder が oracle を呼ばず GREEN 報告 → 配線が agent に効いていない=真の課題

## 後始末

- 検証用 sandbox(260425)は as-found に復元(math.test.ts IDENTICAL、tdd-state は trash、/tmp scratch 削除)。
- standalone sandbox(~/c4-e2e-sandbox)は agent層検証のため**保持**。検証完了後に削除可。
