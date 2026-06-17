---
date: 2026-06-15 02:08:45
type: qa
topic: directory-terminology-worktree
session: 未設定
related_skill: [logging]
---

# 作業ディレクトリの呼び名: worktree は一般名ではない

> 「今いる作業ディレクトリ」の呼称を整理。worktree は Git 特定機能の名前であって、カレントディレクトリ/プロジェクトルートの一般名ではない。

## 概要

かいじゅうから「現在地というか、作業単位のディレクトリってなんて呼ぶ? worktree?」という用語確認の質問。
混同しやすい3階層 (今いる場所 / プロジェクトの根 / Git の枝分かれ) を切り分けて断定した。

## 内容

### 結論

`worktree` は一般名ではなく、Git の特定機能の呼び名。
「今いる作業ディレクトリ」を指す一般語は **カレントディレクトリ (作業ディレクトリ / working directory, cwd)** であり、worktree とは別物。

### 階層ごとの正しい呼称

| 言いたいこと | 正しい呼び名 | 確認コマンド |
|---|---|---|
| 今いる場所そのもの | カレントディレクトリ / cwd | `pwd` |
| プロジェクトの根っこ | プロジェクトルート / リポジトリルート | `git rev-parse --show-toplevel` |
| Git で1リポジトリから枝分かれさせた別フォルダ | worktree | `git worktree list` |

### 各概念の正体

- **カレントディレクトリ (cwd)**: `pwd` で出る、今立っている場所。Claude Code 環境では `Primary working directory` と呼ばれる。
- **プロジェクトルート / リポジトリルート**: `.git/` や `CLAUDE.md` が置かれる最上位階層。「作業単位」と言うときは多くがこれを指す。
- **worktree (git worktree)**: 1つの Git リポジトリから複数ブランチを別々のディレクトリに同時展開する機能。例えば `main` を A フォルダ、`feature-x` を B フォルダで同時に開いたとき、A・B それぞれが worktree。

### 誤解の核

worktree という語は **git worktree 機能を使っている場合に限った**呼び名。
普通に `git clone` しただけのフォルダは worktree とは呼ばず、ただの作業ディレクトリ (cwd)。
「今いるフォルダ全般」を worktree と呼ぶのは誤り。

### 運用上の補足

本PJのグローバル規約 (multi-agent-safety.md) では `git worktree` 操作は「明示指示なしでは不可」。
よって Claude 側が自発的に worktree を切ることはなく、必要時はかいじゅうの明示指示が前提。

## 関連ファイル

- `~/.claude/rules/multi-agent-safety.md` — `git worktree` 操作の明示指示要件 (自発実行禁止) の出典
- `launching-gitflow-worktrees` / `launching-gtr-issue-worktree` skill — 実際に worktree を切る運用 skill (参考)
