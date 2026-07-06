---
date: 2026-07-05 11:32:57
type: work
topic: issue-73-87-review-harness-fix-cycle
session: 260530 review系skill強化 実装デー2

related_skill: [review-harness, essence-reviewing-orchestrator, harness-essentials-reviewer-fork, skill-essentials-reviewer-fork, ui-essentials-reviewer-fork, launching-gtr-issue-worktree, creating-pr, pickup, logging]
related_agent: [general-purpose (診断1回委譲), harness-essentials-reviewer, skill-essentials-reviewer, ui-essentials-reviewer]

related_plan_id: 2026-07-03-review-skills-enhancement
related_plan: .docs/plans/2026-07-03-review-skills-enhancement.md
related_log_ids: [2026-07-05_review-skills-baseline-and-research-routing]
related_log: [.docs/logs/shared/2026-07-05_review-skills-baseline-and-research-routing.md]
---

# issue #73/#87 実装サイクル — グレード表6段階整合 + red AA 対応、essence-gate 正規通過の実地記録

> review-harness の2バグを worktree 分離で修正し、essence レビュー 2 run (H1→H0) を経て gate を bypass ゼロで通過、PR #88/#89 merge → live 反映まで完遂。gate の判定メカニズムと fork 中継の構造的失敗という副産物知見が大きい。

## 概要

phase_order 起点の issue #73 (review-harness のグレード定義がテンプレのみ旧5段階のバグ) に着手したところ、commit 前 essence レビューが変更 diff 外の既存欠陥 (red accent の WCAG AA 未達) を High 検出。かいじゅう裁定「red修正を先行 (bypass せず正規ルート)」に従い issue #87 を起票・修正し、再レビューで C0/H0 を取って両 commit を gate 正面通過させた。

## 内容

### タイムライン (2026-07-05)

1. **pickup**: handoff frontmatter パース → blockers 3件を AskUserQuestion で裁定 (①logging配置先衝突→issue #86 起票 / ②gate挙動確認先行 / ③orchestrator self-eval 延期)
2. **#73 実装**: `/launching-gtr-issue-worktree` で worktree 作成 → diagnosis-report-template.md:43-48 に E行追加・D=20-39% → 3ファイル grep 突合 PASS → 診断1回 (subagent 委譲) 96% S、baseline (96/96) と完全一致
3. **essence レビュー run 1** (対象: #73 worktree): 🟡 **C0/H1/M5/L6** (record `2026-07-05_103541`)
   - High = html-report-template.html の red `#E63946` 小テキスト 4.42:1 / 白抜きバッジ 4.17:1 (AA 4.5 未達)。**#73 の diff 外の既存欠陥**
   - skill 領域の High 申告 (閾値二重管理) は「顕在事例は #73 で解消済 + 実測安定 (総合% 96/96/96/98/96)」を根拠に Lead が Medium へ裁定 — gate 帰結に影響しない裁定である点を record に構造的証跡として明記
4. **かいじゅう裁定**: red修正先行 (SKIP_ESSENCE_GATE 不使用)
5. **#87 実装**: issue 起票 → 別 worktree → `--red:#EA4C58` (text用) + `--red-deep:#C1121F` (白抜き背景用) の 2 トークン分割
6. **essence レビュー run 2** (対象: #87 worktree に #73 修正も適用した**複合状態 = merge 後 main 相当**): 🟢 **C0/H0/M7/L5** (record `2026-07-05_111643`)
7. **commit**: `5b03ea8` (#87) / `56d8d41` (#73) — **essence-gate は両方 deny なしで正規通過** (bypass ゼロ)
8. **PR #88/#89**: creating-pr skill 経由で作成 (P0+bug)、かいじゅうが #88→#89 の順で merge → worktree 2本 `gtr rm` → `~/.claude` を ff-pull で `737d6a7` へ → **live ファイルで 6 段階表と `--red-deep` の実在を grep 確認**

### 重要知見 1: essence-gate の実挙動 (hook 実装読解 + 実地通過で確定)

- gate は `apply_paths` (skills/ 等) を含む commit のみ発動し、`.docs/` は適用範囲外 (record 追加 commit は素通り — 挙動確認 commit `6748a81` で実証)
- verdict 源は「**records dir の最新 .md をグローバルに**」採用 (`hook_pre_commit_essence_gate.sh:265`)。対象 skill と無関係の record でも最新なら効く
- **stale 判定** (`:336-390`): ステージ対象の mtime > 最新 record の mtime → block。ゆえに **「修正 → self-eval 再実行 → C0/H0 → commit」が構造的に強制される** — High 解消だけでは通れない
- 数値抽出は `^high_count:` 行頭アンカー優先 + 散文フォールバック + fail-closed

### 重要知見 2: 逐次修正の sequencing 罠

#87 を main 起点 worktree で単独レビューすると、#73 未適用ゆえグレード表ドリフトが「顕在」のまま High 再燃して再 block される (裁定基準「顕在=High」の必然)。解法: **#87 worktree に #73 修正も適用した複合状態 (merge 後 main 相当) を 1 回でレビュー**し、commit はファイル単位で各 worktree から分離実行。record には複合状態評価であることを明記。レビュー 1 run で両 commit の verdict 源を賄えた。

### 重要知見 3: ui fork の SendMessage 中継が構造的に失敗 (run 1)

- ui-essentials-reviewer-fork の孫 reviewer が teammate (tmux backend) として起動され、レビュー完了後の SendMessage が **その実行コンテキストで無効化**されていた (reviewer 自身が `delivery_channel: subagent-final-text (SendMessage disabled in this context)` と自己記録)
- 症状: idle 通知だけが届き本文が来ない。復旧: teammate transcript (`~/.claude/projects/<slug>/<session>.jsonl`) から SendMessage tool_use の input を直接抽出
- run 2 では task-notification 経由で正常着信 (再現せず)。**fork 中継契約のギャップとして issue 化候補**
- 教訓: 「idle しか来ない」時は transcript が観測可能な一次ソース。推測 (Stop hook に 2 回指摘された) でなく tmux pane / teams config / inbox / transcript の順で機械観測する

### 重要知見 4: 検証の多重独立性が効いた

red AA の before/after は harness/skill/ui reviewer + Lead の **4 系統が独立に WCAG 相対輝度式で計算し数値一致** (4.42/4.12/4.17 → 4.98/4.64/6.22)。ui reviewer は `--red on --surface-2 = 4.22 FAIL` を検出した上で「テキスト非搭載」を用途実査して偽陽性除外しており、機械計算 + 用途実査の 2 段が誤指摘を防いだ。

### 副産物の検出 (未修正・フォロー対象)

- **SKILL.md:45 バイト破損** (U+FFFD×2、「構造把握のた��）」、main 由来) — Lead が worktree/live 双方で機械確認済み。Medium
- 閾値二重定義の単一ソース化 (issue #80 系)、マーク色依存、検疫宣言欠落、トリガー広すぎ等 Medium 計7件 → accumulating-reviewer-feedback で蓄積→HITL が筋
- orchestrator の「progress_json ピン留め」が旧 run の json を表示する既知ズレ (init 出力が正)

## 設計意図

- gate を「回避する対象」でなく「設計どおり働かせる対象」として扱った: High は実修正で潰し、record の鮮度要件は再レビューで満たす。SKIP は監査痕跡付きの緊急口として温存
- severity 裁定の誠実性担保: skill High→Medium 裁定が gate 帰結を変えない (UI High が独立に存在した) 状況で行われたことを record に明記し、「gate 都合の降格」への反証を構造化

## 副作用

- 本ログの配置先はプロジェクト CLAUDE.md (「全ログ shared/」) を logging skill デフォルト (local/ 経由) に優先させる前セッション踏襲の裁定 — **この無裁定衝突そのものが issue #86 の主題** (override 契約 1 行で決定論化予定、未着手)
- `~/.claude` の `M settings.json` (他エージェント作業中) は不触で残置。pull は --ff-only で汚れと無干渉に実施

## 関連ファイル

- `~/.claude/skills/review-harness/diagnosis-report-template.md` — #73 修正本体 (live 反映済み)
- `~/.claude/skills/review-harness/html-report-template.html` — #87 修正本体 (live 反映済み)
- `~/.claude/.docs/essence-review-records/2026-07-05_103541_*.md` — run 1 record (🟡 C0/H1/M5/L6)
- `~/.claude/.docs/essence-review-records/2026-07-05_111643_*.md` — run 2 record (🟢 C0/H0/M7/L5、両 commit の gate verdict 源)
- `~/.claude/hooks/hook_pre_commit_essence_gate.sh` — gate 実装 (知見1の根拠)
- https://github.com/kaijutale/claude-harness/pull/88 / pull/89 — merge 済み PR (merge commits `5cbbdff` / `737d6a7`)
- https://github.com/kaijutale/claude-harness/issues/86 — logging 配置先 override 契約 (本日起票、未着手)
- `~/.claude/output/harness-diag-2026-07-05-1012.md` — #73 検証の診断レポート (96% S)
