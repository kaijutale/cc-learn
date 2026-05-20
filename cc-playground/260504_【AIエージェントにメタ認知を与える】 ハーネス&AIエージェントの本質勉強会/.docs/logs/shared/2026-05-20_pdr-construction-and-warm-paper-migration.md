---
date: 2026-05-20 15:50:00 +0900
type: work
topic: pdr-construction-and-warm-paper-migration
session: Session N+10 (pickup 復元 → PDR 構築 + explain-in-html Warm Paper 移行)
related_skill: [pickup, bootstrapping-project-identity, explain-in-html, project-domain-reviewer-fork, project-essence-orchestrator, logging]
related_plan: [2026-05-18-project-domain-reviewer-construction.md]
related_plan_id: pdr-construction
related_log_ids: [2026-05-20_pdr-5-2b-identity-verify]
note: プロジェクト CLAUDE.md ルール (このプロジェクトのログは全て shared/ 保存) により local/ を経由せず shared/ 直書き
---

# Session N+10 — PDR 4層構築 + explain-in-html Warm Paper 移行

> pickup で handoff (2026-05-18) を復元 → 実態が PDR 5-2a まで進行済と判明 → 5-2b verify → explain-in-html を memopo 由来の Warm Paper 美学へ全面置換 → PDR 5-3/5-4/5-5 を構築・検証した 1 セッション。

## 概要

- **目的**: ハーネス構築の残りタスク (harness-remaining-tasks.html で可視化) に着手、特に PDR (Project Domain Reviewer) 本線を進める
- **2 つの大きな成果**: (1) explain-in-html skill の固定美学を Spidey → Warm Paper へ全面移行、(2) PDR 4層構造 (agent + fork skill + orchestrator + scripts) を構築し fork→agent を実機検証

## 内容

### 1. pickup で handoff 乖離を検出

handoff (2026-05-18, status=planning) より実態が前進: PDR plan 化 (Phase 1) + 5-2a (bootstrapping-project-identity skill + template) + Task #2 (--pr フラグ) が既に完了済。次手 = 5-2b verify と確定。

### 2. PDR 5-2b: identity verify (bootstrapping-project-identity --verify)

既存 identity 4 ファイル (v1.0) を template + essence (24 原則) と照合 → 完全整合 (verdict PASS)。差分は template 側の不足 2 セクションのみ。詳細は `2026-05-20_pdr-5-2b-identity-verify.md`。

### 3. explain-in-html を Warm Paper 美学へ全面移行 (v2 Spidey → v3)

camone が memopo (別 iOS アプリプロジェクト) の mockup UI を気に入り、explain-in-html へ反映を指示。**Spidey identity を完全置換** (camone 選択):
- 美学名は中立化 (`memopo` は別プロジェクト名のため `Warm Paper` に。グローバル skill にプロジェクト固有名を埋めない CLAUDE.md `Harness` 規約準拠)
- 4 ファイル全改修: base.html (CSS変数値 + フォント + 背景 + 丸み13箇所 + italic廃止) / aesthetic-identity.md (全面) / SKILL.md (description + 5軸 + 比喩) / component-library.md (フォント名6箇所)
- 配色: terracotta #e8623c + teal #3f8f7b + warm brown #1c1a17 + warm cream #f3ede1
- フォント: Zen Maru Gothic (丸ゴシック) + Zen Kaku Gothic New + JetBrains Mono
- **Gotcha 発見**: Zen Maru Gothic は italic 非対応 → 強調を color + weight に切替 (4箇所修正)
- **見落とし発見**: SKILL.md Step 5 自己診断チェックリストの「IBM Plex Sans JP」が本文改訂後も残存 → grep で検出・修正。identity 型 skill 改修では「自己診断項目」が漏れやすい
- CSS 変数名は中立 (--copper/--moss/--rust) のまま値だけ差替 → 全コンポーネント連動 (v1 Editorial → v2 Spidey の置換履歴の設計が効いた)

### 4. PDR 5-3/5-4/5-5 構築 (note 記事「複数レビューアの活用」の固有軸)

claude-code-guide agent で前提条件 (プロジェクトローカル .claude/ 運用) を確認:
- **agent/skill で優先順位が逆**: agent = Project > User (プロジェクト優先) / skill = Personal > Project (グローバル優先)。PDR agent はローカル優先で理想的、PDR skill はグローバルに同名なしで衝突せず認識・呼出可
- **fork は1段まで** ("A fork cannot spawn further forks") → orchestrator(非fork)→fork skill→agent の1段構成で成立

構築物 (全て `.claude/` プロジェクトローカル、gitignored):
- 5-3: `.claude/agents/project-domain-reviewer.md` — 評価軸 = identity (固有選択)、essence (普遍) ではない。color=purple
- 5-4: `.claude/skills/project-domain-reviewer-fork/SKILL.md` — context:fork + subagent、identity 存在検証 + Anti-Goals 照合を !構文注入
- 5-5: `.claude/skills/project-essence-orchestrator/SKILL.md` — 4領域 (harness/skill/ui/project-domain) 並列、ui は ui-identity 存在時のみ。既存 essence-reviewing-orchestrator は無改修、scripts は複製流用 (init は永続化先を project-essence-review-runs に分離)

### 5. 実機検証

- **5-4 fork→agent 実機検証成功**: harness-remaining-tasks.html を評価対象に project-domain-reviewer-fork 起動 → identity マトリクス + severity (Medium 1 + Low 2) + Observability を返した。「UI 制作 Anti-Goals 違反では?」を能動検証して「可視化物は UI 制作に非該当」と正しく非該当判定 (誤検出なし)、memory も参照
- **5-5 決定論検証**: init-progress.sh (進捗JSON生成) + validate-all-steps.sh (9step INCOMPLETE 検出) 動作確認。!構文9 / scripts相対参照5 / context:fork 0 (master)

## 設計意図

- **既存無改修 + 新規プロジェクトローカル**: essence-reviewing-orchestrator (グローバル3領域) を改修せず、4領域版を project ローカルに新設 (memory `feedback_no-existing-harness-modification` 準拠)
- **scripts は領域非依存なので複製流用**: validate は len() で step 数を動的取得、init は step 名が orchestration 段階 (領域非依存) → 4領域化でロジック改変不要
- **普遍軸 (essence) と固有軸 (identity) の分離を orchestrator が明示統合**: Step 3.5 で交差ケース (essence は満たすが identity 違反、等) を検出する設計

## 副作用 / 持ち越し

- **PDR 成果 (.claude/配下) は全て gitignored** → このリポジトリの git 追跡外。動作はするが commit に含まれない。git 追跡 or グローバル昇格は 5-6 で判断
- **再帰的発見**: PDR が harness-remaining-tasks.html の「gitignored で永続化方針逸脱」を Medium 指摘したが、PDR 自身も gitignored。固有軸レビューアの永続化観点が自身に跳ね返る (harness-essentials 原則8 メタ再帰)
- **残タスク**: 5-5 フル起動検証 (orchestrator 実起動) / 5-6 source of truth 整理 (CLAUDE.md vs identity + .claude//.docs/output gitignore 方針) / harness-remaining-tasks.html の gitignore 対応 (PDR 指摘)

## 関連ファイル

- `.docs/plans/2026-05-18-project-domain-reviewer-construction.md` — PDR 構築 plan
- `.claude/agents/project-domain-reviewer.md` / `.claude/skills/project-domain-reviewer-fork/` / `.claude/skills/project-essence-orchestrator/` — PDR 4層 (gitignored)
- `~/.claude/skills/explain-in-html/` — Warm Paper 移行 (git 管理外、別リポジトリ)
- `.docs/output/explain-in-html/warm-paper-migration.html` — Warm Paper 検証成果物 (追跡対象)
- `.docs/logs/shared/2026-05-20_pdr-5-2b-identity-verify.md` — 5-2b verify レポート
