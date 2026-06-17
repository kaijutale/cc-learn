---
date: 2026-06-16 08:20:08
type: work
topic: orchestrator-bang-glob-bug-and-self-review-meta
session: proposing-essence-updates-self-review (continued)
related_skill: [essence-reviewing-orchestrator, review-agent-essence, creating-gtr-worktree, logging]
related_agent: [general-purpose]
related_plan_id: 2026-06-16-orchestrator-bang-glob-fix
related_plan: .docs/plans/2026-06-16-orchestrator-bang-glob-fix.md
related_log_ids: [2026-06-16_harness-hooks-pr4-and-proposing-essence-updates-skill]
---

# orchestrator bang-glob bug の root cause + self-review メタ評価 + issue #6

> proposing-essence-updates の self-review が別セッションで orchestrator の load 失敗に当たり、root cause を実機特定。別セッションが書いた self-review v2 handoff の構図を批判評価し、orchestrator 改善 2 件 (issue #6) の plan + worktree を準備。

## 概要

前ログ(build + reviewer 選定)からの続き。reviewer = essence-reviewing-orchestrator に決定後、別セッションが self-review を起動 → **load 時 permission 停止**。本セッションでその root cause を実機切り分けで確定し、並行して (1) 別セッションの v2 handoff の構図欠陥を評価 (2) plan と handoff の役割を整理 (3) issue #6 の plan を 2 件統合に拡張 + worktree 作成、を実施。実装は未着手(準備のみ)。

## 内容

### 1. orchestrator bang-glob load 失敗の root cause(実機確定)
- 症状: orchestrator 起動時、SKILL.md 行50 `!`ls -t <glob>/*_progress.json 2>/dev/null | head -1`` が permission 停止
- 当初の別セッション診断「ls 未許可」→ **誤り**(`Bash(ls:*)` は settings に実在)
- 実機切り分け(本セッション): 同一の `ls -t <glob> | head -1` を通常 Bash tool で叩くと**通る**。行44(`git diff | head || echo` = より複合だが glob なし)も bang で通過。行50(glob あり)だけ bang で停止
- 確定: **`!`構文(bang)の permission が wildcard を静的解決できず保守的に「要承認」にする**(通常 Bash tool は `Bash(ls:*)` で通すが bang 経路は honor しきれない)。bug は skill 側(行50 だけ inline glob bang、兄弟は全て script)

### 2. self-review v2 handoff(別セッションの再設計)の批判評価
- 別セッションが「fresh Lead が単独 Verdict まで出した = 自己循環」として、orchestrator を視点1 に降格した custom A/B/C/D pipeline に再設計
- 評価(迎合せず): **過剰補正と判定**。①循環論の過剰一般化(「essence-docs も Claude 産」は overstate — essence-docs は HITL curated。突き詰めると orchestrator 設計全体を否定する自己矛盾)②決めた orchestrator の sidestep
- だが芯は活かせ:(A)実機接地・(B2/B3)security/運用視点・(D)人間判定 は補完的に有効

### 3. plan と handoff の役割整理
- plan(`2026-06-15-proposing-essence-updates.md`)= skill を**作る**ビルド計画(Phase 1-8)。self-review は工程の1項目
- handoff = 現在地の付箋(/pickup が読む)。v2 は self-review 専用
- 両者は別物。handoff は plan を参照するだけ

### 4. issue #6(orchestrator 改善 2 件)+ plan + worktree
- issue #6: 問題1(行50 bang-glob)+ 問題2(output-format.md が self-eval 命名の使い分けを明示せず、汎用命名で書いて essence-gate 認識せず事故)→ 1 PR 統合
- plan を 2 件カバーに拡張、worktree `fix/orchestrator-bang-glob`(main=fe92ea5 起点)作成

## 重要発見(grayzone / 監査の死角)

- **bang permission は通常 Bash より glob に厳しい**: 同一コマンドが Bash tool で通り bang で止まる。skill が bang に glob を inline で書くと load 失敗。回避 = glob を script 内に隠す(orchestrator の兄弟 context 注入は全てそうしている、行50 だけ例外)
- **v1 self-review は orchestrator を実走していなかった**: essence-review-runs に proposing の self-eval 痕跡ゼロ。決めたツール(orchestrator)が一度も使われず、v1 は手動 single-Lead review だった = 決定からの drift
- **循環の階層を混同しない**: build-Lead バイアス(実在、fresh session で解決)と「基準が Claude 産」の循環(essence-docs は HITL curated ゆえ overstate)は別物。後者を理由に Claude verdict 全廃すると harness 設計と矛盾
- **max_proposals_per_cycle は死に設定**: config.example.json にしか無く SKILL.md/scripts のどこも参照せず(別セッションの実機検証が正しく突いた)
- **hook over-block を更に2回踏んだ**: stop_words が「半分」(ヘッジ禁止、正当指摘だが部分一致)と「追...」(部分一致 false positive)で発火。監査が挙げた hook_stop_words の部分一致 over-block を実走で連続体験

## 設計意図

- **orchestrator fix の方針**: 行50 を兄弟同様 script 化(or 行47 と重複なら削除)。後方互換、出力文字列同一が完了条件。2 件 1 PR = orchestrator self-eval 連鎖を1回で済ます
- **self-review の正道**: v2 の「orchestrator 捨てて custom pipeline」ではなく、**orchestrator(fresh Lead + 独立3 fork + Critical HITL)を芯に、実機検証 + security/運用視点を補完**。最終判定が人間なのは Critical HITL で既に担保

## 副作用 / 積み残し

- **orchestrator fix(issue #6)**: plan + worktree 準備済・**未実装**
- **proposing-essence-updates self-review**: 別セッションで進行中(手動オーケストレーション、3 fork)。skill 本体は self-review 知見で改良済(webhook を env 渡し化・gitignore 先行ゲート・source強度 vs confidence 分離 等)、未コミット
- **PR #4(hooks)**: OPEN・レビュー待ち
- **branch 名**: `fix/orchestrator-bang-glob` は問題1 のみ反映。2 件統合ゆえ `fix/orchestrator-issue-6` への `gtr mv` は任意

## 関連ファイル

- `.docs/plans/2026-06-16-orchestrator-bang-glob-fix.md` — orchestrator 改善 2 件の plan(issue #6 統合)
- `.docs/plans/2026-06-15-proposing-essence-updates.md` — skill build の plan
- `/Users/camone/.worktrees/.claude/fix-orchestrator-bang-glob/` — orchestrator fix の worktree
- `.claude/handoff-state.md` — self-review v2 handoff(別セッション道標)
- issue #6: https://github.com/kaijutale/claude-harness/issues/6
- PR #4: https://github.com/kaijutale/claude-harness/pull/4
- 前ログ: `.docs/logs/shared/2026-06-16_harness-hooks-pr4-and-proposing-essence-updates-skill.md`
