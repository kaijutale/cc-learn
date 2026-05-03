---
title: coordination-harness-integrity-fork C-3b 31件解消 実装ログ
date: 2026-05-04
type: implementation
project: 260417-coordination-harness-integrity-fork
plan: swift-orbiting-allen
status: completed
verdict_change: CONDITIONAL (31違反) → GO (0違反、全5 ruleset pass)
related_logs:
  - 2026-05-03_coordination-harness-integrity-bootstrap.md (前々 plan、bootstrap)
  - 2026-05-03_coordination-harness-integrity-postmortem.md (前々 plan、Q&A)
  - 2026-05-04_coordination-harness-integrity-bcfix.md (前 plan、B+C改修 + next.config fix)
related_audits:
  - .docs/coordination-integrity/2026-05-03.md (Stage 2、改修前、Verdict NO-GO 43違反)
  - .docs/coordination-integrity/2026-05-03_run2.md (B+C改修中間、NO-GO 26違反)
  - .docs/coordination-integrity/2026-05-04.md (B+C+next.config 後、CONDITIONAL 31違反)
  - .docs/coordination-integrity/2026-05-04_run2.md (本plan 最終、GO 0違反)
---

# coordination-harness-integrity-fork C-3b 31件解消 実装ログ

## 背景

前 plan (B+C 改修 + next.config fix) で Verdict CONDITIONAL に到達したが、C-3b major 31件 (find -maxdepth 欠落) が残存。critical 0 だが完全 pass せず、ハーネス品質磨き込みの観点で残課題化していた。

`-maxdepth N` 一律追加は雑な解 (検出漏れリスクあり) なので、**用途別に N を判定**して個別最適化することで「hang 防止」と「検出精度」を両立する設計を Plan agent で検証。修正版 (P1=8 / P2=4 / P3=6 / P4=10+.git prune) を採用、本 plan で実装。

## 変更内容

### 用途別 N 値マッピング (4パターン、合計31件)

| パターン | N | 件数 | 対象ファイル | 用途 |
|---|---|---|---|---|
| **P1** | 8 | 25 | red-test-fork (8) / implement-fork (8) / verify-test-fork (8) / llm-debate-implementer (1) | src/ 配下のソース・テスト検出 |
| **P2** | 4 | 4 | llm-debate-documenter (1) / llm-debate-tester L35 (1) / llm-debate-ui-designer L35,L41 (2) | .docs/ 配下のドキュメント列挙 |
| **P3** | 6 | 1 | llm-debate-ui-designer L38 (1) | src/ 配下のディレクトリ検出 |
| **P4** | 10 + .git prune | 1 | llm-debate-tester L38 (1) | cwd 全体走査 (テスト検出) |

### N 値選定の根拠

- **P1=8**: monorepo `packages/X/src/feature/components/atoms/<file>` (深さ 8) ちょうど境界。N=10 は予防意図と矛盾、N=5 は monorepo 検出漏れ
- **P2=4**: `.docs/specs/CURRENT/<file>` (深さ 4) 境界、起点に依存させず統一値で機械検証容易
- **P3=6**: `src/packages/<pkg>/src/components/ui` (深さ 5) + 1マージン、ディレクトリ少数なので走査時間爆発リスク低
- **P4=10**: cwd 全体は最も深いケース、+ 既存 `node_modules` prune に `.git` 追加で minimum 防御 (`dist/.next/coverage/.turbo` は head -20 で頭打ち + YAGNI 原則で追加せず)

### 修正前後 (代表例)

**P1 (red-test-fork L35)**:
```
- !`find src -type f -name "*.ts"`
+ !`find src -maxdepth 8 -type f -name "*.ts"`
```

**P4 (llm-debate-tester L38、唯一の prune 拡張)**:
```
- !`find . -type f \( -name "*.test.ts" ... \) -not -path "./node_modules/*" 2>/dev/null | head -20 || echo "(no tests yet)"`
+ !`find . -maxdepth 10 -type f \( -name "*.test.ts" ... \) -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | head -20 || echo "(no tests yet)"`
```

## Before / After — Verdict 推移 (3回連鎖)

| 項目 | Stage 2 (改修前) | run2 (B+C改修後) | 2026-05-04 (next.config fix後) | **2026-05-04_run2 (本plan最終)** |
|---|---|---|---|---|
| **Verdict** | NO-GO | NO-GO | CONDITIONAL | **GO** ✓ |
| critical_count | 31 | 1 | 0 | **0** |
| major_count | 12 | 25 | 31 | **0** |
| minor_count | 0 | 0 | 0 | **0** |
| total_count | 43 | 26 | 31 | **0** |
| zsh_glob_violation | true | true | false | **false** |
| ruleset_results.A_frontmatter | pass | pass | pass | **pass** |
| ruleset_results.B_tools_wiring | pass | pass | pass | **pass** |
| ruleset_results.C_bang_syntax | fail | fail | pass | **pass** |
| ruleset_results.D_observability | fail | pass | pass | **pass** |
| ruleset_results.E_prompt_template | pass | pass | pass | **pass** |
| skill 起動 duration_sec | 298 | 149 | 244 | **113** |

### 改善率
- critical: 31 → 0 (**-100%**)
- major: 12 → 0 (**-100%**)
- C-3b 全件解消、全 ruleset 100% 完全 pass
- duration_sec: 298秒 → 113秒 (**-62%**、improvement is observable)

### Self-Eating Dogfood
本 audit skill 自身は本plan で触っていない (前 plan で対応済、-maxdepth 指定済)。run3 でも 5 ruleset 全 pass、改修自己整合 GO 維持。

### 反インフレチェック (issues=0 を疑った 5件、team-reviewer から)

1. team-pm の kpidd プリロード矛盾疑い → teammate 起動時 skills 非適用の公式仕様で両立
2. team-reviewer の責務拡張疑い → Gotchas で明示的に許容済
3. coder.md の Python 擬似コード LLM 誤読リスク → ruleset 5 観点外、scope 外
4. llm-debate master の context:fork なし疑い → 設計意図通り (Lead が親コンテキスト)
5. 大型 SKILL.md ファイルサイズ → CLAUDE.md 500 行ルールはコード対象、Markdown 適用外

→ 5件すべて妥当な根拠で `issues=0` を防御。team-reviewer が能動的に見落としを探し、合理的に却下した証拠。

## 学び

### 1. 「一律 N」 vs 「用途別 N」 の判断軸
かもねの問い「`-maxdepth` で有限時間保証 = 雑になる」は本質的指摘だった。検証漏れリスク (false negative) と hang リスク (致命傷) のトレードオフを認識した上で、**用途別に N を選定**することで両立できる。今回の実例:
- P1=8 (monorepo 深さ 8 上限)
- P2=4 (.docs/ 構造境界)
- P3=6 (ディレクトリ検出は少数)
- P4=10 + prune 強化 (cwd 全体走査の minimum 防御)

### 2. Plan agent の検証で N 値が下方修正された価値
私の元案 (P1=10, P2=3-4, P3=5) を Plan agent が検証 → P1=8/P2=4/P3=6 に修正提案。理由:
- N=10 は「予防意図と矛盾」(実質無制限に近い)
- N=8 は「monorepo 上限 + 1マージン」でちょうど良い
- N=5 (P3) では monorepo `src/packages/<pkg>/src/components/ui` (深さ 5) が境界、N=6 で安全

→ Plan agent の独立検証が「現実的な monorepo 構造」に基づく N 値選定を導出。サブエージェントに検証させる価値が機械的に証明された事例。

### 3. prune 拡張の YAGNI 原則
`dist/.next/coverage/.turbo` を全部 prune に追加する誘惑があったが、**`head -N で頭打ち`** + **`既存 node_modules prune`** で実用上の hang リスクは既に最小化されている。`.git` のみ追加で十分。過剰防御は ruleset 違反検出時の grep パターンマッチを複雑化させ、保守負荷を増やす。

### 4. 3回連鎖の Verdict 改善が示す ruleset の精度
- Stage 2 (改修前): 43違反 (誤分類含む、C-3 が混在検出)
- run2: 26違反 (B+C改修で D-1 解消、C-3 分割で精度向上)
- 2026-05-04: 31違反 (next.config fix で critical→0、ただし C-3b 31件浮上)
- **2026-05-04_run2 (本plan): 0違反 (全 ruleset 100% pass)**

→ ruleset 精密化 (B改修) → schema 統一 (C改修) → 既存負債解消 (next.config + C-3b) の段階的改善。各段階で「真の違反」が浮上し、最終的に GO 到達。**ruleset 自体の信頼性向上が ruleset 違反解消の前提**。

## 関連ファイル

### 本 plan 修正対象 (7ファイル、グローバル資産、git管理外)
- `~/.claude/skills/red-test-fork/SKILL.md` — 8件 (L35-44)、P1=8
- `~/.claude/skills/implement-fork/SKILL.md` — 8件 (L35-44)、P1=8
- `~/.claude/skills/verify-test-fork/SKILL.md` — 8件 (L34-43)、P1=8
- `~/.claude/skills/llm-debate-implementer/SKILL.md` — 1件 (L36)、P1=8
- `~/.claude/skills/llm-debate-documenter/SKILL.md` — 1件 (L38)、P2=4
- `~/.claude/skills/llm-debate-tester/SKILL.md` — 2件 (L35: P2=4 / L38: P4=10 + .git prune)
- `~/.claude/skills/llm-debate-ui-designer/SKILL.md` — 3件 (L35: P2=4 / L38: P3=6 / L41: P2=4)

### 出力ファイル (本プロジェクト cwd 内、git 管理対象、commit対象)
- `.docs/coordination-integrity/2026-05-04_run2.md` — run3、最終 audit (GO 0違反、新規 commit)
- `.docs/templates/2026-05-04_coordination-harness-integrity-c3bfix.md` — 本実装ログ (新規 commit)

### バックアップ (R1 緩和、一時、手動 cp、git管理外)
- `/tmp/skills-backup-c3bfix/` (7 skill ディレクトリ)
- 復元コマンド: `cp -r /tmp/skills-backup-c3bfix/* ~/.claude/skills/`

### Plan ファイル
- `~/.claude/plans/swift-orbiting-allen.md` (本plan、archived へ rename + mv 予定)

## 完了条件チェック

- [x] Step 1 完了: 事前バックアップ取得 (`/tmp/skills-backup-c3bfix/`、7 skill)
- [x] Step 2 完了: 7ファイル × 31行に -maxdepth N 追加 (grep 件数 31 検証済)
- [x] Step 3 完了: 本 audit skill 再起動 → Verdict GO 取得
- [x] Step 4 完了: 判定樹「GO → Step 5 進行」適用
- [x] Step 5 完了: 実装ログ作成 + commit 2分割 (本実装ログ + audit 出力)
- [ ] Step 6 完了: plan を archived へ mv (status: completed) — 次 step

## 後続 plan 候補 (本plan外、別ticket化推奨)

- 教訓 memory 保存 plan: `feedback_find-maxdepth-monorepo-mapping.md` (本plan の N 値選定知見)
- ruleset C-1 拡張 plan: `rg --files` 等の高速検索コマンドを allowlist 追加 (案 D の保留事項)
- 別領域 verifier-driven workflow 横展開: `a11y-fork`, `license-compliance-fork`, `api-contract-fork` 等
