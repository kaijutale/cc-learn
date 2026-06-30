---
date: 2026-06-30 13:26:56
type: work
topic: command-handoff-rule-fix
session: command-handoff ルールのゲート欠落修正
related_skill: [logging, commit, creating-pr]
related_log_ids: [2026-06-30_good-plan-5elements-and-adr-container]
related_log: [2026-06-30_good-plan-5elements-and-adr-container.md]
---

# command-handoff ルールにゲート新設 — committer の不要な手渡しを構造的に止める

> `~/.claude/rules/command-handoff.md` が「いつ手渡すか」のゲートを欠き `committer` を例示していたため、制限していない commit まで kaiju に手渡していた。ゲート新設 + committer 再分類で修正、PR #61 でマージ・反映済み。

## 概要

- 問題: 本セッション中、commit のたびに `committer` コマンドを「! で打ち込んでくれ」と kaiju に手渡していた。kaiju が「最近 commit は制限してないのに、commit のコマンドまでやらせるのは command-handoff.md のせい。意図が伝わってない」と指摘。
- 根本原因: `command-handoff.md` が (1)「いつ手渡すか」の条件 (ゲート) を書かず「提示時の書き方」だけ規定し、(2) 例として `committer` を `git push` と並べて挙げていた。結果「列挙されたコマンド = 手渡すもの」と誤読し、制限外の committer まで handoff した。
- 対応: ゲートを新設し committer を「agent 直接実行」側に明示。harness 改修ゆえ branch-first で実施 → PR #61 → kaiju merge → 後片付け。

## 内容

reword (`rules/command-handoff.md`, +25 / -8):

- **ゲート新設**: `!` 手渡しは「kaiju 自身が実行する必要があるコマンド」(権限制限 / 対話入力 / 明示指定) に限る、を冒頭に明記。
- **committer 再分類**: 制限外 → agent が直接実行 (push だけ handoff) と例示で固定。
- 既存「書き方」ルールは「handoff する時だけ」に従属。判断軸を「これは agent の権限で実行できるか?」に一本化。

プロセス (branch-first、main 直接改修を回避):

- in-place feature branch `feat/command-handoff-clarify` を作成 → reword → `committer` (00cd5e9) → `git switch main` で復帰。
- push (kaiju 実行) → `gh pr create` で PR #61 → kaiju が GitHub で merge → `fetch --prune` + `pull --ff-only` (89ae3c1 → decc5fa) → ローカルブランチ `-D`。
- live config に反映確認 (ゲート出現数 0 → 3)。worktree は不使用ゆえ撤収対象なし。

## 設計意図

- ゲートの判断軸を「決定の性質 = agent が実行を許されているか」に固定し、コマンド名の列挙 (committer/push) に依存させない。列挙が誤読を招いた元凶ゆえ、否定的明示 (「制限外は直接実行」) で塞ぐ。
- 後方互換: `git push` 等の手渡し挙動は不変。追加は「制限外は agent 直接実行」の一点。

## 副作用

- 観測 (運用知): 複合 Bash コマンド (`committer` + `git switch` + 複数 verify をまとめたもの) が permission で拒否されたが、`committer` 単独に分割したら通過した。→ ハーネスの git 系ミューテーションは atomic に分けると permission 摩擦が少ない。
- 隔離手段の使い分け: ADR 時 (7ファイル・協調ハーネス) は worktree + 別セッションだったが、本件は doc 1ファイルの明確化ゆえ in-place ブランチで十分。改修の重さに応じて隔離コストを変える判断。

## 関連ファイル

- `~/.claude/rules/command-handoff.md` — 修正対象 (ゲート新設)、claude-harness 側
- claude-harness PR #61 (main decc5fa) — 本修正の実装本体
- `.docs/logs/shared/2026-06-30_good-plan-5elements-and-adr-container.md` — 同セッション前半 (5要素 → ADR コンテナ) のログ
