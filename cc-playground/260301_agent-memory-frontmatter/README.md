# Agent Memory Frontmatter フィールド（v2.1.33〜）

## 概要

Claude Code v2.1.33で導入された、カスタムAgent（サブエージェント）に永続的なメモリを持たせる機能。
複数の会話をまたいで、Agentが学習内容を保持・蓄積できる。

## 設定方法

Agentの定義ファイル（`.claude/agents/xxx.md`）のfrontmatterに `memory` フィールドを追加する。

```yaml
---
name: code-reviewer
description: Reviews code for quality and best practices
memory: user
tools: Read, Grep, Glob, Bash
---

You are a code reviewer. As you review code, update your agent memory with
patterns, conventions, and recurring issues you discover.
```

## 3つのメモリスコープ

| スコープ | 保存場所 | 特徴 |
|---------|---------|------|
| `user` | `~/.claude/agent-memory/<agent-name>/` | 全プロジェクト横断で使える個人メモリ |
| `project` | `.claude/agent-memory/<agent-name>/` | プロジェクト固有、チームで共有可能 |
| `local` | `.claude/agent-memory-local/<agent-name>/` | プロジェクト固有、個人用（Gitに含めない） |

### スコープの選び方

- **`user`**: 全プロジェクトで使い回すAgent向け（例: 汎用コードレビュー）
- **`project`**: プロジェクト固有の規約を覚えさせたい時（例: プロジェクト専用のアーキテクチャガイド）
- **`local`**: 個人的なメモを残したい時（Gitに含めない）

## 動作の仕組み

`memory` フィールドを設定すると、以下が自動的に行われる：

1. **メモリ管理の指示がシステムプロンプトに自動注入される** — Agentはメモリの読み書き方法を知る
2. **`MEMORY.md` の先頭200行がAgentのコンテキストに含まれる** — 過去の学習が自動で読み込まれる
3. **Read/Write/Editツールが自動的に有効化される** — メモリファイルを管理できるようになる

## 実用例

### コードレビューAgent

```yaml
---
name: code-reviewer
description: Expert code review specialist
memory: project
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a senior code reviewer. As you review code, update your agent memory with:
- Coding patterns and conventions used in this project
- Common issues and how they were fixed
- Team standards and best practices
- Architecture decisions and their rationale

Before reviewing, check your memory for patterns you've seen before.
After reviewing, update your memory with new learnings.
```

### プロジェクトエキスパートAgent

```yaml
---
name: project-expert
description: This project's architecture expert
memory: project
---

Before answering questions, check your memory for relevant patterns.
After discovering new insights, update your memory with:
- Architecture decisions and rationale
- Key file paths and their roles
- Common patterns used in this codebase
```

## Auto Memoryとの関係

| 項目 | Auto Memory | Agent Memory Frontmatter |
|------|-------------|--------------------------|
| 対象 | Claude Code本体 | 個々のカスタムAgent |
| 保存先 | `~/.claude/projects/<project>/memory/` | スコープにより異なる（上記参照） |
| 共通点 | `MEMORY.md` + トピック別ファイルの構造 | 同じ構造 |
| 先頭200行がコンテキストに含まれる | はい | はい |

## キーポイント

- Agentが「育つ」仕組み。使えば使うほどメモリが蓄積され、プロジェクトのコンテキストに詳しくなる
- `MEMORY.md` は先頭200行までがコンテキストに含まれるので、簡潔に保つことが重要
- トピック別に別ファイルを作成し、`MEMORY.md` からリンクする構造が推奨される

## 参考リンク

- [Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog.md)
