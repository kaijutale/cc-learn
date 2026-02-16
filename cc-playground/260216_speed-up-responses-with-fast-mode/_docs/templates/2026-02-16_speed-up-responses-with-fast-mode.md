機能名: Speed up responses with fast mode 翻訳

- セッション名: (未設定)
- 日付: 2026-02-16 22:27:36
- 概要: Claude Code公式ドキュメント「Speed up responses with fast mode」を日本語に翻訳。ファストモードの機能、料金、使い方、要件、レート制限などの情報を日本語で参照できるようにするため。
- 実装内容: Firecrawl MCPで原文を取得し、translating-technical-articlesスキルのワークフローに従い、レイアウト・構造を保持したまま日本語に翻訳。テーブル、リスト、リンク、コードブロックなどの構造を維持。
- 設計意図: 技術用語（ファストモード、エフォートレベル、エクストラユーセージ等）はカタカナ表記を基本とし、初出時に括弧で補足説明を付与。固有名詞（Claude Code、Opus 4.6、Pro/Max/Team/Enterprise等）は原文のまま保持。
- 翻訳のポイント:
  - 「fast mode」→「ファストモード」で統一
  - 「effort level」→「エフォートレベル」で統一
  - 「extra usage」→「エクストラユーセージ」とし、初出時に「追加利用分」と補足
  - 「research preview」→「リサーチプレビュー」で統一
  - 料金表やコマンド例はそのまま保持
- 副作用: 原文のアンカーリンク（#toggle-fast-mode等）は英語のまま保持。ページ内リンクとしては機能しないが、原文参照時の利便性を優先。
- 関連ファイル:
  - 翻訳ファイル: `speed-up-responses-with-fast-mode.md`
  - 原文: https://code.claude.com/docs/en/fast-mode
