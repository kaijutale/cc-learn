---
date: 2026-06-16 08:27:29
type: work
topic: proposing-essence-updates-self-review
session: proposing-essence-updates self-review → 全件修正 → PR #7
related_skill: [essence-reviewing-orchestrator, explain-in-html, handoff, logging]
related_plan_id: 2026-06-15-proposing-essence-updates
related_plan: .docs/plans/2026-06-15-proposing-essence-updates.md
related_log_ids: [2026-06-16_harness-hooks-pr4-and-proposing-essence-updates-skill]
related_log: [2026-06-16_harness-hooks-pr4-and-proposing-essence-updates-skill.md]
---

# proposing-essence-updates skill の essence self-review → 全件修正 → PR #7

> fresh session の self-review で Critical 1 含む 12 件を検出・全件修正し、再 self-eval で Critical/High=0 (PASS) を確認して PR #7 化。build 当事者の自己検証では見逃した silent failure を、独立再評価 + 実機実行が掘り当てた。

## 概要

handoff (proposing-essence-updates-build → self-review) を /pickup で復元。前セッションで build した proposing-essence-updates skill (essence-docs の陳腐化点検と不足補充を PR ドラフトとして提案するハーネス運用 skill) を、build 当事者バイアスを断つため fresh session で self-review する任務。最終的に全件修正 → PR #7 作成 → HTML 解説まで完走。

## 内容

### self-review の実行方式 (装置の !構文停止 → 手動オーケストレーション)

essence-reviewing-orchestrator を起動したが、SKILL.md 行50 の `!`構文 (`ls -t .../*_progress.json` = wildcard 含む) が Skill ツール経路の permission で停止。当初「ls 未許可」と誤診したが `Bash(ls:*)` は settings に実在。真因は「bang 経路の permission チェックが wildcard を含むコマンドを静的解決できず保守的に要承認にする」。通常 Bash tool は同一コマンドを通す非対称性。

→ 装置に頼らず Agent ツールで harness/skill/ui 3領域 reviewer を fresh fork 並列起動し、Lead (メイン Claude) が統合判断する手動方式に切替。視点独立性 + fresh Lead 統合という装置の本質を手で再現。

### 初回 self-eval v1 = FAIL (Critical 1 / High 3 / Medium 5 / Low 3)

- **C-1 (Critical)**: collect_baseline.sh の awk が skill-sources.md で棄却候補を silent 空振り。固定文字列「棄却した候補」マッチだが実見出しは「### 棄却 / 他領域へ振った候補」。実機実行で count=0 確認。中核安全機構 (棄却済み候補の再提案防止) の機能不全。
- **H-1**: config.json の gitignore 保護が主張のみで実在せず (secret 漏洩リスク)
- **H-2**: notify_discord.sh が webhook URL を process argv 露出
- **H (旧 H-3)**: awk のセクション境界が h2 のみで保留候補混入
- Medium 5 / Low 2: receive-secret 誤記・サイクル状態未定義・confidence 用途・I/O 異常系・truncate 等

### Lead 補正 2件 (視点独立 fork の盲点を fresh Lead が相殺)

- **schedule built-in 誤検出却下**: reviewer 2体が「schedule skill 不在 (High)」と判定したが、schedule は Claude Code built-in。両者は ~/.claude/skills/ ディレクトリ走査のみで盲点共有。
- **essence-docs gitignore 却下**: reviewer が「essence は gitignore 除外」と判定したが、cwd を ~/.claude メイン (たまたま chore/stop-words-trim-3rules branch = essence 除外) で確認したため。proposing が動く feat branch では tracked。

### 全件修正 + 再 self-eval v2 = PASS (Critical 0 / High 0)

- awk を正規表現 `/^###?[[:space:]].*棄却/` + h2/h3 境界対応に修正、3領域実機検証 (skill 新規3行ヒット)
- config.json gitignore 検証ゲート (skill 内完結)、webhook 環境変数化 等 全12件修正
- 再 eval で新規 Medium1 (essence-gate 事実誤認: apply_paths は skills/agents/hooks のみで essence-docs 非対象) + Low2 も検出 → 修正
- 検証: bash -n / python AST / collect_baseline.sh 3領域実行 / quick_validate「Skill is valid!」

### 永続化と成果物

- self-eval v1 (FAIL) / v2 (PASS) を essence-gate 契約の `_self-eval-v<N>` 命名 + `Critical X / High Y` verdict 行で永続化
- commit 5fe3c81 → push → PR #7
- orchestrator 自体の改善 2件 (行50 bang-glob load失敗 + output-format 命名曖昧さ) は issue #6 に分離
- explain-in-html で HTML 解説生成

## 設計意図

- self-review を fresh session で行うのは「自作物への甘化バイアス」を統合層から排除するため。3 fork は context:fork で独立だが Lead は非独立 → fresh Lead で完全独立化。
- orchestrator の !構文停止時、装置を直さず手動再現で代替したのは、proposing の self-review がスコープであり orchestrator 改修はスコープ外 (別 issue #6) のため。スコープ混在を避けた。

## 副作用 / 重要発見

- **build 当事者の自己検証では silent failure を見逃す**: collect_baseline.sh の awk 空振りは「読んで OK」では検出不能。実機実行 (count=0) で初めて露見。build 時の自己検証が「読んで OK」止まりだった痕跡。
- **fresh fork 独立再評価 + 実機実行が Critical を掘り当てた**。検証は「読む」でなく「動かす」。
- **視点独立 fork でも共有する盲点がある**: schedule built-in / essence-docs gitignore の2件は、独立 fork 2体が同じ盲点 (ディレクトリ走査のみ / branch 取り違え) を共有。fresh Lead が事実で相殺 (誤検出2件却下)。評価は「一度」でなく「独立に重ねた上で統合層が覆す」。
- **skill self-review の永続化は essence-gate 契約に従う**: `_self-eval-v<N>` 命名 + `Critical X / High Y` (スラッシュ区切り) verdict 行が必須。汎用 review 命名 (`_<target-slug>`) で書くと gate が認識しない (output-format.md の曖昧さ、issue #6 に記録)。
- **再 eval も「事実誤認」を掘り当てる**: 新規 Medium1 (essence-gate が essence-docs を gate すると誤記) は、apply_paths 実測で覆った。修正後の再評価でも能動探索が効く。

## 関連ファイル

- `/Users/camone/.worktrees/.claude/feat-proposing-essence-updates/skills/proposing-essence-updates/` — 対象 skill (PR #7 のソース)
- `~/.claude/.docs/essence-review-runs/2026-06-16_044659_proposing-essence-updates_self-eval-v1.md` — 初回 self-eval (FAIL)
- `~/.claude/.docs/essence-review-runs/2026-06-16_075938_proposing-essence-updates_self-eval-v2.md` — 再 self-eval (PASS)
- `.docs/output/explain-in-html/260616_proposing-essence-updates-self-review.html` — HTML 解説
- `.docs/plans/2026-06-16-orchestrator-bang-glob-fix.md` — orchestrator bang-glob 修正 plan (issue #6 関連)
- PR #7: https://github.com/kaijutale/claude-harness/pull/7
- issue #6: https://github.com/kaijutale/claude-harness/issues/6
