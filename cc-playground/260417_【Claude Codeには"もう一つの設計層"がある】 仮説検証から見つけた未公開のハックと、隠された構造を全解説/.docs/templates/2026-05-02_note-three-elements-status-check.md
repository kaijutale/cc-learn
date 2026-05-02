---
feature: note-three-elements-status-check
session: 未設定
date: 2026-05-02 14:34:36
---

# note記事「もう一つの設計層」3要素 達成状況チェック

## 概要

note記事『Claude Codeには"もう一つの設計層"がある』が「Claude Code Skills と context:fork 活用の要点」として提示した3つの未公開ハック (`!`コマンド構文 / `context:fork` / 孫エージェント) について、わたしのグローバルハーネス (`~/.claude/`) における達成状況を実測ベースで照合した。記事の主張に対し、わたしのハーネスが「同じ概念を別用途で達成」「達成済み」「記事より一歩先 (L4まで踏破)」のいずれに該当するかを整理。

## 実装内容

### 1. `!`コマンド構文の実利用パターン4分類 (実測)

`grep -rn "^!" ~/.claude/skills/` の結果を用途別に分類。

| カテゴリ | 用例 | 採用skill |
|---|---|---|
| タイムスタンプ/CWD注入 | `!`date +%s``, `!`pwd``, `!`date "+%Y-%m-%d %H:%M:%S"`` | `llm-debate*`, `*-fork`, `logging-validation-result` |
| git状態スナップショット | `!`git status -sb``, `!`git diff --stat``, `!`git log --oneline``, `!`git diff --staged`` | `commit`, `generating-doc-from-diff`, `llm-debate-reviewer` |
| ファイル構造プローブ | `!`find src -type f -name "*.test.ts"``, `!`find ~/.claude/skills -maxdepth 2 -name SKILL.md``, `!`ls ~/.claude/agents/`` | `verify-test-fork`, `enumerating-verifiable-workflows` |
| 設定ファイル本文展開 | `!`cat package.json``, `!`head -50 .gitignore`` | `verify-test-fork`, `auditing-*-fork` |

note記事の代表用途「Codex CLIなど外部AIツールの確実な実行」は、わたしのハーネスでは **CLAUDE.md `## Harness` の Claude Only方針により採用しない**。代わりに上記4カテゴリの「決定論的コンテキスト注入」として運用。本質的価値「シェルコマンドが決定論的に実行され動的コンテキストとしてエージェントに注入される」は同じ。

### 2. `context: fork` 採用skill = 14個 (実測)

```
llm-debate / llm-debate-{reviewer,ui-designer,implementer,tester,documenter}
verify-test-fork / red-test-fork / implement-fork
auditing-aio-fork / auditing-nextjs-security-fork
enumerating-verifiable-workflows
enforcing-strict-tdd-cycle / orchestrating-team-development
```

note記事「テストライターと実装者の思考が混在しないクリーンな分離」は、TDD3点セット (`red-test-fork` → `implement-fork` → `verify-test-fork`) で完全実装済み。`coder` agent定義に明記。

### 3. 孫エージェント = 達成済み + ひ孫 (L4) も検証済み

| 層 | agent名 | skill経由 |
|---|---|---|
| 子 (L2) | `coder`, `experiment-coordinator`, `deep-experiment-coordinator` | メインから直接Agent tool |
| 孫 (L3) | `team-tester`/`team-implementer`/`team-reviewer`/`team-documenter`/`team-pm`/`team-ui-designer`, `grandchild-inspector`, `recursive-grandchild-inspector` | `*-fork` skill経由 (skill+subagent:) |
| ひ孫 (L4) | `great-grandchild-inspector` | `fork-recursive-grandchild` → `fork-great-grandchild` 連鎖 |

note記事は「孫」止まり。わたしのハーネスは `recursive-grandchild-inspector` (Skillツール持ち孫) → `fork-great-grandchild` skill → `great-grandchild-inspector` の再帰連鎖でひ孫レベルまで踏破。検証ログは `2026-04-20_grandchild-agent-verification.md` および `2026-04-20_great-grandchild-agent-verification.md` に既存。

## 設計意図

### なぜ実測ベースで照合するか
note記事の概念は抽象記述なので、「達成済み」と即答するとハーネス実態とのズレを見逃す。`grep` + `find` で**カウント可能な証拠**を添えることで、「記事に書かれた概念」と「自分のハーネスに実装された機能」の対応関係を構造的に確認できる。

### `!`構文の用途差を「ギャップ」ではなく「方針差」と整理する理由
記事が想定する Codex CLI連携用途を「未達」と書くと誤解を招く。`## Harness` 方針 (Claude Only) は意図的選択であり、達成度ではない。本質的価値「決定論的コンテキスト注入」は同じなので、用途カテゴリで整理することで方針差を明示しつつ達成度評価を独立させた。

### ひ孫レベル踏破を「記事より一歩先」と位置付ける根拠
記事は「Agentツール多段不可 → Skill+context:fork+subagent: で突破」までで止まっている。わたしのハーネスは「孫が再帰的にSkill経由で別孫を呼ぶ」L4まで実験ログ化済み (`great-grandchild-inspector` agent の存在が証拠)。これは記事の延長線上にある自然な拡張だが、note記事では言及されていない領域。

## 副作用

- **`generating-gitignore/patterns.md` の `!.vscode/settings.json` 等は別物**: gitignoreの否定パターン (除外解除) であり、Claude Code skill構文の `!`コマンドとは無関係。grep結果に混入するため、今後同種の調査時は `--include="SKILL.md"` でフィルタする方が良い。
- 直近のcommit `1ee96f1` に「zsh null_glob による skill 全停止 bug 検証ログ」「!構文 glob 直書き禁忌」とあり、`!`構文の落とし穴も既に踏破済み。今回のサマリには含めなかったが、`!`構文を新規追加する際は当該ログを必ず参照する。
- このログは CLAUDE.md (project) により Git追跡対象。skill default の「gitignored」を上書きされている点に注意。

## 関連ファイル

- `~/.claude/skills/llm-debate/SKILL.md` — `!`date/pwd``による時刻・cwd注入の代表例
- `~/.claude/skills/verify-test-fork/SKILL.md` — `!`find``と`!`cat package.json``を組み合わせた検証コンテキスト構築
- `~/.claude/skills/commit/SKILL.md` — `!`git status/diff/log`` のgit状態スナップショット
- `~/.claude/skills/enumerating-verifiable-workflows/SKILL.md` — `!`find ~/.claude/skills``等のメタプローブ
- `~/.claude/agents/coder.md` — TDD3点セット (red-test-fork → implement-fork → verify-test-fork) の発火元
- `~/.claude/agents/great-grandchild-inspector.md` — L4 (ひ孫) 実証用agent
- `~/.claude/skills/fork-recursive-grandchild/SKILL.md` — 孫→ひ孫のskill連鎖
- `.docs/templates/2026-04-20_grandchild-agent-verification.md` — 孫検証の既存ログ
- `.docs/templates/2026-04-20_great-grandchild-agent-verification.md` — ひ孫検証の既存ログ
- `~/.claude/CLAUDE.md` (`## Harness`セクション) — Claude Only方針の根拠
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-fork-asymmetry.md` — fork時のcwd継承非対称性の記憶
