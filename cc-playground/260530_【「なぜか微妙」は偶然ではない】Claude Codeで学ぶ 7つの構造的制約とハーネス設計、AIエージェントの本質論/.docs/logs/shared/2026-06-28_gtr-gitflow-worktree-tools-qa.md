---
date: 2026-06-28 02:42:27
type: qa
topic: gtr-gitflow-worktree-tools-qa
session: gtr/gitflow/worktree 使い分け + Claude Code 基本ツール質疑
related_skill: [launching-gitflow-worktrees, launching-gtr-issue-worktree, creating-gtr-worktree, orchestrating-team-development, explain-in-html]
related_log_ids: [2026-06-27_pattern2-phase0-issue50]
related_log: [2026-06-27_pattern2-phase0-issue50.md]
---

# gtr / gitflow / worktree の使い分けと Claude Code 基本ツールの質疑

> 前回(issue #50 完結)の続き。worktree 系の skill(gtr系3種)・gitflow・context:fork の関係と、Bash/Glob/Grep の役割分担を整理。解説 HTML を3本生成。わらわの HTML 表現の誤りをかいじゅうが指摘し訂正した一件を含む。

## 概要

issue #50 で worktree 隔離を実機で通した流れから、worktree 周辺の概念(gtr / gitflow / context:fork)と Claude Code の基本ツール(Bash/Glob/Grep)を質疑で整理した。各テーマを explain-in-html で視覚化(HTML 3本)。

## 内容

6つの論点:

1. **gitflow とは** — Git の「機能」ではなく、ブランチ運用の「戦略・規約」(Vincent Driessen 2010、main/develop/feature)。git-flow CLI もラッパーに過ぎず、Git 本体に gitflow 機能は無い。4レイヤーの区別: Git(基盤)/ worktree(機能)/ gtr(道具)/ gitflow(戦略)。軸が直交する。
2. **gitflow は必須でない** — creating-gtr-worktree / launching-gtr-issue-worktree を複数起動すれば worktree が複数でき並列は可能。gitflow は「並列の必須条件」ではなく「大規模並列の安全オプション」(main 保護・develop 緩衝・誤マージ防止)。規模で使い分け。
3. **協調系の worktree 作成担当 = launching-gitflow-worktrees** — orchestrating-team-development の Step 2.5 で呼ぶ。issue 系=issue 駆動、creating=単一汎用と「駆動軸」が違うため、チーム協調用は gitflow 版だけが噛み合う。なお coder/TDD/llm-debate は context:fork(会話分離)で、worktree(ファイル分離)とは別物。協調系でファイル worktree を作るのは launching-gitflow-worktrees 一つ。
4. **gtr系3 skill の使い分け** — creating(汎用最小・特化なし)/ issue(GitHub issue 駆動・文脈注入あり)/ gitflow(チーム協調)。判断軸=「複数チームか?」→ gitflow、「issue 駆動か?」→ issue、「ただ隔離したいだけ」→ creating。
5. **gtr系に gitflow を組み込むべきか → No** — 単一責務を壊し過剰適用を招く(260517 skill 境界)。gitflow が要る規模なら専用 skill を呼べばよい。必要なら共通 hook やベースブランチ選択という軽い部分策で。
6. **Bash/Glob/Grep ツール** — Glob(ファイル名・パスで探す)/ Grep(中身を正規表現で検索、ripgrep ベース)/ Bash(コマンド実行・副作用)。検索・読み取りは専用ツール、Bash で find/grep/cat を代用しないのが Claude Code 流(速度・権限・移植性・構造化のため)。

## 重要な学び(観測した失敗 — レビューが効いた一件)

- **わらわの HTML 表現の誤りをかいじゅうが指摘 → 訂正**: 解説 HTML(gitflow-optional)で「gitflow 無し = 各 worktree が main 直結 → 本番直結リスク」と書いたが、かいじゅうが「gtr系も専用ブランチを切るのだからその risk は無いのでは?」と指摘。正しい。訂正版: 作業は専用ブランチ(main 直接編集なし)+ PR ゲートで守られる。develop 緩衝の本当の価値は「**複数 feature を main 前に束ねて統合・検証する段階**」であって「作業の場所」ではない。実害が出るのは大規模並列時のみ。── 「リスク」を過大表現していた点を、かいじゅうのレビューが捕捉した。
- **概念の階層分離**: gtr=道具 / gitflow=戦略 / worktree=Git の機能 / context:fork=会話コンテキストの分離。「worktree を作る ≠ gitflow を使う」「context:fork ≠ worktree」── 混同しやすい4〜5概念を別レイヤーとして切り分けた。

## 関連ファイル

- `.docs/logs/shared/2026-06-27_pattern2-phase0-issue50.md` — 前回ログ(issue #50 Phase 0 実装完結)、本ログの前編
- `.docs/output/explain-in-html/260627_gitflow-vs-gtr-worktree.html` — gitflow とは / gtr系 worktree との違い(基礎)
- `.docs/output/explain-in-html/260627_gitflow-optional-worktree-ownership.html` — gitflow 必須でない / 協調系の worktree 担当(応用、develop 緩衝表現を訂正済)
- `.docs/output/explain-in-html/260627_bash-glob-grep-tools.html` — Bash/Glob/Grep の役割分担
- skill: launching-gitflow-worktrees / launching-gtr-issue-worktree / creating-gtr-worktree / orchestrating-team-development(Step 2.5)/ explain-in-html
