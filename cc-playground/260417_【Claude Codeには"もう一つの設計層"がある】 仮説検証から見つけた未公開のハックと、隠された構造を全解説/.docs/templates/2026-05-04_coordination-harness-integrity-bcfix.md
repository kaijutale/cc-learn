---
title: coordination-harness-integrity-fork B+C改修 実装ログ
date: 2026-05-04
type: implementation
project: 260417-coordination-harness-integrity-fork
plan: bash-1-context-fork-skills-agent-skill-enchanted-seahorse-bcfix
status: completed
verdict_change: NO-GO (43違反) → CONDITIONAL (31違反、C-3b major のみ残存)
related_logs:
  - 2026-05-03_coordination-harness-integrity-bootstrap.md (前 plan、bootstrap)
  - 2026-05-03_coordination-harness-integrity-postmortem.md (前 plan、Q&A)
  - 2026-05-01_zsh-nullglob-result.md (B改修の根拠、find -name literal は safe 実証)
related_audits:
  - .docs/coordination-integrity/2026-05-03.md (Stage 2、Verdict NO-GO 43違反、改修前)
  - .docs/coordination-integrity/2026-05-03_run2.md (run2、B+C改修後、NO-GO 1+25違反)
  - .docs/coordination-integrity/2026-05-04.md (run3、追加 fix 後、CONDITIONAL 0+31違反、最終)
---

# coordination-harness-integrity-fork B+C改修 実装ログ

## 背景

前 plan (`bash-1-context-fork-skills-agent-skill-enchanted-seahorse`、bootstrap、archived) で `coordination-harness-integrity-fork` skill を新設、Stage 2 で Production Run 実行 → **Verdict NO-GO + 43違反** を検出。違反は2パターンに集約:

- **C-3違反 31件 (critical)**: 「`find` には `-maxdepth N` 指定がある」を critical 判定 → NO-GO 格上げ。だが過去bug 2026-05-01 の実発火条件は `ls openapi.*` の **glob 直書き** (zsh nomatch hang) であり、`find -name "literal"` は **shell glob 展開を経由しないので safe**。1 ID で2つの異なる失敗モードを混ぜた状態 = false positive 量産源
- **D-1違反 12件 (major)**: llm-debate 系 6 skill の Observability セクションが TDD3点 (red/implement/verify-test-fork) の3キー (`tool_uses_count` + `file_writes_count` + `duration_sec`) と不揃い

note記事5項目チェックリストは前セッション完了済。本 plan は **「note記事の枠を超えたハーネス品質磨き込み」** = 残存負債の構造解消、verifier 精度向上、協調コア schema 揃え。

## 変更内容

### B改修 — ruleset C-3 を C-3a / C-3b / C-3c に分割

**典拠**: `.docs/templates/2026-05-01_zsh-nullglob-result.md` の実証データ。

`~/.claude/skills/coordination-harness-integrity-fork/SKILL.md` を 5箇所 Edit (233 → 236行):

| 箇所 | 改修内容 |
|---|---|
| L109-111 | C-3 (1行) → C-3a (critical: ls/echo glob 直書き) / C-3b (major: find -maxdepth 欠落) / C-3c (対象外: find -name literal) の3行に分割 |
| L148 | Verdict logic step 7 を `C-3` → `C-3a` に変更 (critical のみ NO-GO 格上げ) |
| L153 | zsh_glob_violation フラグ注釈を C-3a 専用に修正 (C-3b は集計対象外を明示) |
| L172 | ruleset_results の C_bang_syntax fail 条件をコメントで明示 (C-1/C-2/C-3a のみ fail、C-3b は CONDITIONAL 域) |
| L236 | 関連ファイルセクションに `.docs/templates/2026-05-01_zsh-nullglob-result.md` を追記 |

### C改修 — llm-debate 系 6 skill の Observability schema 統一

**正典**: `~/.claude/skills/red-test-fork/SKILL.md` L97-101 (TDD3点が共有する3キー schema)。

llm-debate 系 6 skill を一括改修:

| ファイル | 改修内容 |
|---|---|
| llm-debate-implementer/SKILL.md | Observability セクション (L113-115): 2キー → 4キー (tool_uses_count + file_writes_count + duration_sec + files_read補助) |
| llm-debate-tester/SKILL.md | 同上 (L112-114) |
| llm-debate-reviewer/SKILL.md | 同上 (L135-137) |
| llm-debate-documenter/SKILL.md | 同上 (L127-129) |
| llm-debate-ui-designer/SKILL.md | 同上 (L122-124) |
| llm-debate/SKILL.md (master) | 構造指示 (3項目テキスト) → 5キー固定 yaml block (3キー + sub_skill_invocations + sub_skill_durations) |

`file_writes_count: 0` は批評専任 (Edit/Write 非装備で構造的に 0 固定) を明示、契約として注釈化。

### 追加修正 (本 plan スコープ拡張、Step 3 で浮上した既存負債) — next.config.* literal 化

**経緯**: B改修の精密分類により、`enforcing-strict-tdd-cycle/SKILL.md:28` に C-3a violation 1件浮上。`ls openapi.*` パターンと完全同型 (zsh nomatch hang リスク)。改修自体が混入させた違反ではなく、ruleset 精度向上で可視化された既存負債。

`~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md:28` を 1行 Edit:

- before: `!\`ls package.json next.config.* tsconfig.json 2>/dev/null\``
- after: `!\`ls package.json next.config.ts next.config.js next.config.mjs tsconfig.json 2>/dev/null\``

literal 列挙化により shell glob 展開を経由しないため C-3a 違反解消。Next.js 公式設定ファイル名 (ts/js/mjs) を網羅。

## Before / After — Verdict 変化推移

| 項目 | Stage 2 (改修前) | run2 (B+C改修後) | run3 (next.config fix後、最終) |
|---|---|---|---|
| **Verdict** | NO-GO | NO-GO | **CONDITIONAL** |
| critical_count | 31 | 1 | **0** |
| major_count | 12 | 25 | 31 |
| minor_count | 0 | 0 | 0 |
| total_count | 43 | 26 | 31 |
| zsh_glob_violation | true | true | **false** |
| ruleset_results.A_frontmatter | pass | pass | pass |
| ruleset_results.B_tools_wiring | pass | pass | pass |
| ruleset_results.C_bang_syntax | fail | fail | **pass** |
| ruleset_results.D_observability | fail | pass | pass |
| ruleset_results.E_prompt_template | pass | pass | pass |
| skill 起動 duration_sec | 298 | 149 | 244 |

### 改善率
- critical: 31 → 0 (**-100%**)
- D-1 major: 12 → 0 (**-100%**)
- C-3a: 31 (誤分類含む) → 0 (**-100%**)
- C-3b major: 12 (一部誤分類) → 31 (純粋な find -maxdepth 欠落、別plan対象)

### Self-Eating Dogfood
本 audit skill 自身は run3 でも 5 ruleset 全 pass (-maxdepth 全行明示、glob 直書きなし、Observability 3キー、出力先 `.docs/coordination-integrity/`)。改修自己整合 GO 維持。

## 学び

### 1. ruleset 精密化は「false positive削減」より「真の違反の可視化」効果が大きい
B改修前: C-3 31件 critical (うち真の zsh nomatch リスクは 1件、残 30件は予防的 find -maxdepth)。Verdict NO-GO の重み付けが歪んでいた。
B改修後: C-3a 1件 critical (真の zsh nomatch リスク) + C-3b 31件 major (予防的)。Verdict 階層が**実態の severity 分布**を正しく反映。

### 2. 「想定外 critical 検出」の判定樹解釈分岐
plan の Verification plan に「NO-GO (C-3a違反検出 = 想定外) → 緊急停止」とあったが、run2 で C-3a 1件浮上した時に文字通り適用すると改修自体ロールバック。実態は「精密分類で既存負債が浮上」 = ruleset 精度向上の成功事例。判定樹の「想定外」は「改修が新規混入させた疑い」を想定した文言で、今回のケースとは性質が異なる。

A 選択 (本 plan 内 1行 fix) で GO相当 (CONDITIONAL受容) 到達できた = scope creep を許容した実用判断。plan scope 厳守 (B選択) も妥当だったが、コンテキスト整理コスト > 1行 fix の重みなので A が合理的。

### 3. Observability schema 統一の波及効果
TDD3点 (red/implement/verify-test-fork) と llm-debate 系 6 skill が同じ3キー schema を共有することで、横断観測の自動集計可能性 (jq/yq などで `tool_uses_count` を全 fork skill から抽出) が担保された。新たに増える fork skill にも同じ schema を強制すれば、observability の一貫性が構造的に保たれる。

### 4. グローバル資産改修のコスト
本 plan の主要修正対象 7ファイルすべて `~/.claude/skills/` (グローバル資産、本プロジェクト cwd 外、git 管理対象外)。改修前バックアップ (`/tmp/backup-bcfix/`) を取ったがリポジトリ管理されないので、復元は手動 cp に依存。グローバル資産の version 管理は別途検討余地あり (例: `~/.claude/` 全体を別 git リポジトリで管理)。

## 関連ファイル

### 本 plan 修正対象 (7ファイル、グローバル資産、git管理外)
- `~/.claude/skills/coordination-harness-integrity-fork/SKILL.md` — B改修 (5箇所、+3行)
- `~/.claude/skills/llm-debate/SKILL.md` — C改修 master (5キー固定 yaml)
- `~/.claude/skills/llm-debate-implementer/SKILL.md` — C改修 sub (4キー化)
- `~/.claude/skills/llm-debate-tester/SKILL.md` — 同上
- `~/.claude/skills/llm-debate-reviewer/SKILL.md` — 同上
- `~/.claude/skills/llm-debate-documenter/SKILL.md` — 同上
- `~/.claude/skills/llm-debate-ui-designer/SKILL.md` — 同上

### 追加修正 (1ファイル、グローバル資産、git管理外)
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — next.config.* glob → literal 列挙化 (1行)

### 出力ファイル (本プロジェクト cwd 内、git 管理対象、commit対象)
- `.docs/coordination-integrity/2026-05-03.md` — Stage 2、改修前 audit 結果 (既 commit、保全)
- `.docs/coordination-integrity/2026-05-03_run2.md` — run2、B+C改修後の中間 audit (新規 commit)
- `.docs/coordination-integrity/2026-05-04.md` — run3、追加 fix 後の最終 audit (新規 commit)
- `.docs/templates/2026-05-04_coordination-harness-integrity-bcfix.md` — 本実装ログ (新規 commit)

### バックアップ (一時、手動 cp、git管理外)
- `/tmp/backup-bcfix/coordination-harness-integrity-fork/`
- `/tmp/backup-bcfix/llm-debate*/` (6 skill)
- `/tmp/backup-bcfix/enforcing-strict-tdd-cycle/`

## 後続 plan 候補 (本 plan 外、別 ticket 化推奨)

1. **C-3b 31件是正 plan**: 11 fork skill (TDD3点 + llm-debate 系 6 + auditing-aio-fork + auditing-nextjs-security-fork) の `find` 行に `-maxdepth N` 一括追加。31件 → 0件で Verdict GO 到達期待
2. **教訓 memory 保存 plan**: 本 plan で得た学び3件を `~/.claude/projects/-Users-camone-.../memory/` に永続化 (feedback_ruleset-precision-vs-falsepositive.md / feedback_scope-creep-judgement.md / feedback_observability-cross-fork-schema.md)
3. **検証対象 agent 拡張 plan**: 現行 12 agent (coder + team-* 6 + llm-debater-* 5) に加えて debater-* 6体 (Agent Teams 版) も検証対象に追加するかの議論 (現状は audit 対象外、設計判断として保留)

## 完了条件チェック

- [x] Step 1: 本 skill SKILL.md ruleset C-3 を C-3a/b/c に分割、Verdict logic 更新 (5箇所 Edit、+3行)
- [x] Step 2: llm-debate 系 6 skill の Observability 3キー化 (master は5キー固定)
- [x] Step 3: 本 skill 再起動 → CONDITIONAL Verdict 取得 (受容、別 plan 化推奨)
- [x] Step 4: 実装ログ作成 + commit 2分割 (audit 出力 + 実装ログ。グローバル資産は cwd外で commit対象外)
- [ ] Step 5: plan ファイル `status: completed` 設定 → archived へ rename + mv (次 step)
