---
date: 2026-06-07 16:34:09
type: work
topic: c4-post-completion-cleanup
session: C-4 完了後の整理 (plan archive + sandbox 軽量化)
related_skill: [logging, handoff]
related_log_ids:
  - 2026-06-07_c4-verification-complete-capstone
  - 2026-06-07_c4-thread-closure-verify-commit-push
related_log:
  - .docs/logs/shared/2026-06-07_c4-verification-complete-capstone.md
  - .docs/logs/shared/2026-06-07_c4-thread-closure-verify-commit-push.md
---

# C-4 完了後の整理 (plan archive + sandbox 軽量化)

> C-4 検証完了を受けた後片付け2件。完了済 plan 8本を archived/ へ集約、検証 sandbox を node_modules だけ削除して 108M→528K に軽量化(生証拠は保全)。

## 概要

C-4 end-to-end 検証が全完了・commit・push 済みになったのを受けて、散らかりを整理した: ①完了 plan の archive、②検証 sandbox の容量回収。どちらも可逆な操作 (mv / trash) で実施。

## 内容

### 1. plan の archive (`.docs/plans/`)

- **完了8件 → `archived/`**: C-4検証系7本 (external-verifier-gap-closure / verifier-00-shared-infra / p0-test-tamper / p1-coverage / p2-cycles / p3-loop-state / p4-reviewer-visibility) + c2-c3-defense-skills。
- **直下に残置1件**: `2026-06-07-vectorized-cuddling-deer.md` (auto-memory整理・status=planning・未着手)。
- **完了判定は status 欄でなく実態で**: c2-c3 は frontmatter `status: planning` のまま陳腐化していたが、skill 実在 (`blinding-review-prompt` / `detecting-framing-bias`) + 完了ログ複数で実質完了と判断し archive。p4 も「[ ] S8」未チェックだったが coder.md に `Reviewers invoked:` 行が実装済 = 完了。
- handoff の `related_plan` パスを archived/ に修正。

### 2. sandbox 軽量化 (`c4-e2e-sandbox/`)

- 容量内訳測定: 全体 108M のうち **node_modules が 107M**、生証拠 evidence は 364K。
- **node_modules だけ trash** → 108M→**528K** (107M回収)。骨格 (package.json / pnpm-lock.yaml / tsconfig / src / RUN-ME) + `.docs/evidence/`(F1/F2/F4 の TRANSCRIPT・coder-loop.json・topic.md 実体) は保全。
- RUN-ME.md に「再検証前に `pnpm install --ignore-workspace` で復活」注記を追加。
- 削除は trash (rm 不使用)、復元可。

## 設計意図 / 再利用知

- **related_*_id (不変ID) 設計が archive で効いた**: plan を archived/ に mv するとログの `related_plan` (path) は切れるが、`related_plan_id` (ファイル名 base) で `find .docs/plans/ -name "<id>.md"` 再解決できる。logging skill のハイブリッド ID+path 設計が想定通り機能。
- **「node_modules だけ削除」クリーンアップ・パターン**: 検証用使い捨て環境を畳むとき、丸ごと削除より優位。容量の大半 (今回99%) を回収しつつ、軽量な生証拠 (364K) を保全し、pnpm-lock 固定で再install 再現可能。完全削除は生証拠を失うので、ログ要約で十分と確信できる時のみ。
- **完了判定は frontmatter status 欄を信じすぎない**: status は更新漏れで陳腐化する (c2-c3 が planning のまま完了していた)。実態 (成果物=skill/コードの実在、完了ログ、checkbox でなく実装の有無) で判断する。

## 副作用 / 注意点

- node_modules 削除により、保全した evidence/src の `*.test.ts` が IDE で `Cannot find module 'vitest'` を出す (LSP ノイズ)。無害、再install で消える (`feedback_bash-oracle-authoring-traps` の .ts LSP ノイズ事例)。
- このセッションの新ログ群 (closure / capstone / 本ログ等) は未commit (kaiju 依頼時に /commit)。

## 関連ファイル

- `.docs/plans/archived/` — 完了 plan 9本集約 (今回8 + 既存 curl-hook-overblock-fix)
- `.docs/plans/2026-06-07-vectorized-cuddling-deer.md` — 未着手の残置 plan
- `c4-e2e-sandbox/` — 528K に軽量化 (骨格 + evidence、node_modules 削除)
- `c4-e2e-sandbox/RUN-ME.md` — 再install 注記追加
- `.claude/handoff-state.md` — related_plan パス修正
