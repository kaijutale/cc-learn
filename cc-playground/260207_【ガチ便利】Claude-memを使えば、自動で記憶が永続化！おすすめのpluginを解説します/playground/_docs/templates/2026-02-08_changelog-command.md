機能名: /changelog カスタムスラッシュコマンド

- セッション名: changelog-implementation
- 日付: 2026-02-08 06:45:34
- 概要: Claude Codeのアップデート後に「何が変わったか」を日本語で即座に把握するためのカスタムスラッシュコマンドを実装
- 実装内容:
  - `/Users/aoyamaisaoosamu/.claude/commands/changelog.md` を新規作成
  - YAMLフロントマターでname, description, argument-hint, allowed-toolsを定義
  - 4ステップのワークフロー: CHANGELOG取得 → バージョン抽出 → カテゴリ分類 → 日本語解説
  - gh CLI（第一優先）とWebFetch（フォールバック）の2段階取得戦略
  - awk による必要セクションのみの抽出でコンテキスト節約
  - 引数パターン: なし（最新）/ バージョン番号 / all（直近5バージョン）
- 設計意図:
  - Skill・Subagentではなくカスタムスラッシュコマンドを選択（初回コンテキスト消費ゼロ、1ファイルで完結）
  - CHANGELOG全文をコンテキストに入れず、awkで必要部分だけ抽出する設計（コンテキストウィンドウの節約）
  - 単なる翻訳ではなく「ユーザーにとっての意味」を解説する方針
  - commit.mdの既存パターン（YAMLフロントマター + ステップ形式）に合わせた構造
- 副作用: なし
- 関連ファイル:
  - `/Users/aoyamaisaoosamu/.claude/commands/changelog.md`（新規作成）
