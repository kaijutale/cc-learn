# Project Analyzer Memory

## プロジェクト概要

**プロジェクト名**: Claude Code Rulesデモ・学習プレイグラウンド

このプロジェクトはClaudeコードの新機能（Rules、Subagent、メモリ管理）の実装パターンを学習・実践するためのショーケースプロジェクト。

## 技術スタック

- **言語**: TypeScript（推奨）、Markdown
- **開発環境**: Claude Code
- **外部パッケージ**: なし（クラウドネイティブな環境）

## ディレクトリ構造と役割

| ディレクトリ | 役割 |
|-------------|------|
| `.claude/` | Claude Code設定・ルール・Subagent定義 |
| `.claude/rules/` | TypeScript規約とコメント規約 |
| `.claude/agents/` | project-analyzerとcode-explainerのSubagent定義 |
| `_docs/templates/` | 実装ログの保存先（Git管理対象） |
| `try/` | 試験的な実装・学習用ディレクトリ |

## 定義されたRules

1. **typescript.md**: TypeScriptファイル（*.ts, *.tsx）に自動適用
   - 型安全性（any禁止、unknown推奨）
   - camelCase/PascalCase/UPPER_SNAKE_CASEの命名規則
   - import type の使用

2. **comments.md**: 全ファイルに適用
   - JSDoc（export関数・クラス必須）
   - TODOコメント許可
   - 絵文字・コード行のコメントアウト禁止

## Subagent設定

### project-analyzer
- **description**: プロジェクト構造の技術スタック・依存関係を分析
- **model**: haiku（軽量・高速）
- **memory**: project（セッション間で蓄積）
- **tools**: Read, Glob, Grep, Bash

### code-explainer
- **description**: コードの解説を行う
- **model**: sonnet（高精度）
- **memory**: project（セッション間で蓄積）
- **tools**: Read, Glob, Grep

## Git管理方針

- `_docs/templates/`はGit管理対象
- 実装ログはローカル作業記録

## 参考リソース

- [ClaudeCodeの新機能Rulesの使い方](https://www.youtube.com/watch?v=slN-Ms8rdxw&t=1s)
- [Claude Rulesの公式ベストプラクティス](https://note.com/masa_wunder/n/n60c2ec107c52)

