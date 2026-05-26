---
date: 2026-05-26 23:27:46
type: qa
topic: pdr-construction-remaining-tasks
session: 残タスク整理 (PDR グローバル構築 plan 策定後)

related_skill: [logging, handoff, pickup]

related_plan_id: 2026-05-25-pdr-global-harness-construction
related_plan: .docs/plans/2026-05-25-pdr-global-harness-construction.md
related_log_ids: [2026-05-25_pdr-global-harness-construction-design]
related_log: [2026-05-25_pdr-global-harness-construction-design.md]
---

# 残タスク整理 — PDR グローバル構築 plan 策定後

> push (a02a1d7..1adbc43) 後の「残りtaskは？」への回答。実装は未着手、ゲートは camone の判断3点。技術的ブロッカーはなし。

## 概要

PDR (プロジェクトドメインレビューア = そのPJ固有ルールを守れているか点検する評価役) のグローバル構築 plan を策定・commit・push した直後の残タスク棚卸し。実装フェーズは未着手で、着手前に人間判断が要る3点が最優先ゲート。

## 内容

### A. すぐ判断が要る3点 (これを決めないと実装に入れない = Open Decisions)

1. **司令塔skillの扱い** — グローバルに既存の「全PJ共通3観点 (ハーネス/skill/UI) をまとめて評価起動する司令塔 (essence-reviewing-orchestrator)」がある。誤配置版は「+PJ固有の4観点目 (project-domain)」を足した4観点版 (project-essence-orchestrator)。これを (a)既存3観点版と別に新設 / (b)4観点版を正式版に格上げ / (c)司令塔は作らず固有点検役を単独 fork 呼出のみ、のどれにするか。
2. **固有ルールの抜き方 (de-projectize) = severity calibration の置き場所** — グローバル定義に「このPJのCritical例 (UI作らない/Claude限定/Opus固定 等)」がベタ書き。(a)全部消して汎用文だけ / (b)カテゴリだけ汎用化し具体ルールは起動時に `.docs/identity/` から読む【推奨】/ (c)深刻度判定そのものを `.docs/identity/` に宣言させる【最クリーンだが identity schema + bootstrapping-project-identity の変更要】。
3. **名前の不一致** — 点検役の名前は `project-DOMAIN-reviewer`、読む文書のフォルダ名は `.docs/identity/` でズレ。note 自身が両用語使用 (セクション2「プロジェクトアイデンティティ」/ セクション3「プロジェクトドメインレビューア」/ Q&A「ドメイン知識ドキュメント」) を継承。揃えるなら dir 改名でなく点検役を `project-identity-reviewer` に寄せる方が筋。

### B. 判断後の実装4ステップ (PDR plan Phase 1-4)

- **Phase 1**: 点検役 (`project-domain-reviewer` agent + `project-domain-reviewer-fork` skill) をグローバル `~/.claude/` へ移し、固有ルールを抜く (de-projectize)。cwd grayzone (fork から `.docs/identity/` 相対参照) の堅牢性検証。
- **Phase 2**: 司令塔skillを A-1 の決定どおり処理。重複スクリプト (3/4が global と完全一致) の排除。
- **Phase 3**: 学習PJ側の後片付け — 誤配置ファイル (`.claude/skills/project-essence-orchestrator/`, `.../project-domain-reviewer-fork/`, `.claude/agents/project-domain-reviewer.md`) の追跡解除 + **保留中の `.gitignore` 変更 (`.claude/` 一括ignore化) をここで確定 commit**。`.docs/identity/` は評価データとして残す。
- **Phase 4**: 動作検証 — このPJで正しく動く / 自己定義文書 (identity) が無い他PJでは「判定保留 ⚪」に縮退 / 既存3観点版が無傷、の3点を実機確認。

### C. 保留中の別トラック

- 「本質ドキュメント (全PJ共通の不変原則をまとめた評価基準 = `~/.claude/.docs/essence/`)」をPR駆動で育てるフロー。論文収集skill (`proposing-essence-updates`) と Discord通知 (`notify-essence-update.yml`) が未着手のまま保留 (plan: 2026-05-22-essence-doc-pr-driven-flow.md)。固有点検役の件を先行させる方針。

### 現状サマリ

- 技術的ブロッカー: なし。ゲートは A の3判断のみ。
- git: main は push 済み (1adbc43)。保留中の `.gitignore` 変更は Phase 3 まで未commitのまま意図的に残す。

## 関連ファイル

- `.docs/plans/2026-05-25-pdr-global-harness-construction.md` — 残タスクの正本 (Phase0-4 + Open Decisions)
- `.docs/logs/shared/2026-05-25_pdr-global-harness-construction-design.md` — 前段の設計セッションログ
- `.claude/handoff-state.md` — status: planning、next は Phase 0 (gitignored)
- `.docs/plans/2026-05-22-essence-doc-pr-driven-flow.md` — 保留中の別トラック (本質ドキュメント自動更新)
