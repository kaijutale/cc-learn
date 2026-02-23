機能名: camone-ralph-loop スキルにインタビューフェーズ追加

- セッション名: camone-ralph-loop-interview-upgrade
- 日付: 2026-02-23 16:33:59
- 概要: camone-ralph-loop スキルの SKILL.md に「Phase 0: Interview & PROMPT.md Generation」フェーズを追加。ユーザーの曖昧なリクエストから AskUserQuestion でインタビューし、高品質な PROMPT.md を自動生成するワークフローを組み込んだ。仕様駆動開発（trq212氏の手法）をRalph Loopに応用。
- 実装内容:
  - Phase 0 として「Interview & PROMPT.md Generation」セクションを追加
  - インタビュー要否の判断基準を明記（曖昧→必須、具体的→省略可）
  - 6観点のインタビュープロセス（要件、技術スタック、ファイル構成、検証手段、エッジケース、完了条件）
  - PROMPT.md の構造化テンプレート（6セクション: Task, Requirements, Tech Stack, File Structure, Verification, Completion）
  - 5項目の品質チェックリスト
  - Step番号の整理（1-4 → 0-3）
  - Monitor セクションのディレクトリ名修正（.ralph/ → .ralph-loop/）
  - 旧 Prompt Best Practices セクションを Phase 0 に統合・削除
- 設計意図:
  - PROMPT.md の品質が Ralph Loop の成果品質を決定するため、人間任せにせず Claude Code が主導してインタビュー → 生成する仕組みに
  - claude -p は会話コンテキストを持たないため、PROMPT.md 単独で完結する品質が必須。チェックリストでそれを担保
- 副作用: なし。bashスクリプトは変更なし、SKILL.md（スキル定義）のみの変更
- 関連ファイル:
  - ~/.claude/skills/camone-ralph-loop/SKILL.md（スキル定義・変更対象）
