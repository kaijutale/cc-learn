---
date: 2026-05-22 10:47:57
type: work
topic: pr-driven-flow-phase0-and-source-incident
session: 本質ドキュメント更新フロー Phase 0 実装 + whats-left 残タスク処遇
related_skill: [pickup, explain-in-html, handoff, logging]
related_plan_id: 2026-05-22-essence-doc-pr-driven-flow
related_plan: <project_root>/.docs/plans/2026-05-22-essence-doc-pr-driven-flow.md
related_log_ids: [2026-05-06_essence-docs-v1-creation]
related_log: [2026-05-06_essence-docs-v1-creation.md]
---

# PR駆動フロー Phase 0 実装 + 残タスク処遇 + 出典露出インシデント対応

> 本質ドキュメント更新フロー (PR駆動) を plan 化し Phase 0 (essence/ git化) を実装。途中で出典メタの public 露出インシデントを検出・完全対応。並行して whats-left の残タスク①②を実体確認で処遇確定。

## 概要

セッション開始時、`/pickup` で前 handoff (status=completed) を復元。whats-left.html が挙げた「本当の残りタスク」を1つずつ実体確認で処遇する流れになった。一貫したのは「楽観的な処遇ラベルを鵜呑みにせず、稼働中の実体を見る」規律。3タスク (①branch-validator ②auditing-web-quality ③PR駆動フロー) を処遇し、③を plan 化 + Phase 0 実装まで進めた。

## 内容

### ① branch-validator の Hook化 → 閉じる

- 実体: 名前から「ブランチ名検証」と想像されていたが、SKILL.md を読むと spec 照合 skill (実装が spec 通りか検証)。核心は AC文言⇔実装コードの意味マッピング = LLM 判断、決定論部分は spec-validator CLI に分離済み。Hook 化不可。
- ブランチ名検証 Hook も、グローバル CLAUDE.md に命名規則が未定義 + 失敗実測なし + 被害小で、層選択原則上やる根拠なし。
- 処遇: 誤抽出としてクローズ。

### ② auditing-web-quality の fork化 → 見送る

- 実体: 単体 skill。協調ハーネス (three-elements / orchestrating-team / tdd-cycle) の一部ではない (参照ゼロで確認)。
- 障害4点: Chrome DevTools MCP 依存 / 既存 audit 孫 (team-auditor) は MCP 非保有 / 監査の核心が視覚判断 / team-auditor に web-quality 追加は K-2.1 違反リスクと設計者が自己警告 (team-auditor.md Gotcha)。
- 処遇: 見送り (新規ブラウザ監査孫が必要でコスト大、価値見合わず)。

### ③ PR駆動の本質ドキュメント更新フロー → plan化 + Phase 0 実装

- plan: `2026-05-22-essence-doc-pr-driven-flow.md` (design-only)。フロー ①収集→②提案→③通知→④レビュー→⑤取り込み。Phase 0-4。
- 確定判断: ①収集skill=context:fork+subagent隔離 / essence-docs=public / git 方式A (その場 git init) / task3=新規skill (accumulating-reviewer-feedback は改修禁止のため拡張不可)。
- Phase 0 (git化) 完全実装: `~/.claude/.docs/essence/` を git 化し camoneart/essence-docs (public) に push。README の参照パス規約を「絶対パス推奨」→「チルダ参照」に修正 (実体は reviewer 31箇所すべてチルダ・絶対パス0件と grep で確認)。reviewer 群の参照は不変 (.git 追加のみで非破壊)。

### 出典露出インシデント (Phase 0 実装中に検出・対応)

- 問題: public 化した本質ドキュメントに、外部参考コンテンツの出典メタ (記事参照 / ページ番号引用 / 由来語 / 内部skill名) が public + git 履歴に露出。本質doc本体3つ + README に渡って埋め込まれていた。
- 対応: 出典メタを全削除 (原則本文は一字も変えず保持、8原則×3doc 維持を grep で確認、94削除/9挿入)。履歴クリーン (committer は amend 非対応のため trash .git → git init → 出典なし版で単一 root-commit → force push)。さらに repo 作り直しで dangling commit まで完全消去。出典なし版を新 repo に push (abb64ed)。

## 設計意図

- **実体確認の規律 (本セッションの背骨)**: 「defer」「条件付き」「未着手」といった処遇ラベルや plan/HTML のスナップショットを鵜呑みにせず、稼働中の skill/agent/設定の実体を見る。①(誤抽出) ②(障害4点) ③(Phase A は実は実装済み + git 非管理という構造制約) と、いずれもラベルの裏に隠れた実態を実体確認が暴いた。
- **plan と handoff の役割分担 (SSOT)**: plan = PR駆動フロー実装計画の本体 (設計の真実)、handoff = 今セッションの状態スナップショット + `related_plan` で plan を参照。設計詳細を両方に書くと乖離するため、参照ポインタで繋いで重複ゼロにした。
- **出典削除の判断軸 (camone の視点転換)**: 「public 公開がダメ」ではなく「本質ドキュメントの質に寄与するか」で判断。出典は構築メタ (どこ由来か) で原理原則の内容には寄与しない → 削除。本質docは「誰が見ても正しい原理原則」= 数学の公式のように出典なしで成立する、という定義に基づく。削除は隠蔽でなく純化。

## 副作用

- **出典インシデントはメインClaude の見落としが起点**: Phase 0 で push を急いだ際、「秘密 = 認証情報」と狭く捉え、本質doc に埋め込まれた出典メタ (外部参考コンテンツへの参照) を精査しなかった。public + git 履歴に露出した。検出→削除→履歴クリーン→repo作り直しで完全対応したが、公開前精査の対象範囲を誤った。教訓を memory に保存 (feedback_public-repo-pre-publish-scan): 公開前精査は認証情報だけでなく出典・由来・内部構造も grep 全チェックする。
- **継続運用枠4件は今回の処遇対象外**: 全体タスク台帳 (harness-construction-tasks.md 23項目) のうち PR駆動フロー以外の残りは B4/D4/G2/G3 の継続運用枠のみ。discrete task ではなく運用習慣のため、本セッションでは着手せず handoff/台帳に保持。

## 関連ファイル

- `<project_root>/.docs/plans/2026-05-22-essence-doc-pr-driven-flow.md` — PR駆動フロー実装計画 (design-only、Phase 0-4)
- `<project_root>/.docs/output/explain-in-html/260522_pr-driven-doc-flow-status.html` — PR駆動フロー現状の解説 HTML
- `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` + `README.md` — git化 + 出典削除の対象 (原則本文は保持)
- camoneart/essence-docs (public, commit abb64ed) — 本セッションで新規作成。本質ドキュメント3領域 + README の git 管理先
- `<project_root>/.claude/handoff-state.md` — 今セッション状態の引き継ぎ (status=in_progress、next_phase=Phase 1/2)
