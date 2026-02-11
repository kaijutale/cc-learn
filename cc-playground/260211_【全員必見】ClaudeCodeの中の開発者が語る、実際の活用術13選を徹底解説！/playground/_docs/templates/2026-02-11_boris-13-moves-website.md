機能名: Boris活用術13選レトロフューチャリズムWebサイト

- セッション名: boris-13-moves
- 日付: 2026-02-11 15:51:15
- 概要: Claude Code開発者Boris Chernyの活用術13選を学習するためのWebサイトを構築
- 実装内容:
  - レトロフューチャリズム（ネオン効果、グリッドライン背景、スキャンライン）デザインのスクロールストーリー型Webサイト
  - HTML + CSS + JS シングルファイル構成（依存なし）
  - ダークモード、JetBrains Mono / Space Grotesk / Syne フォント使用
  - Intersection Observerによるスクロールトリガーアニメーション
  - 右サイドのナビゲーションドット（ツールチップ付き）
  - プログレスバー、アンビエントグローオーブ、ノイズテクスチャ
  - 13個のTipをChapter分け（環境&セットアップ、知識の蓄積、ワークフロー、システム設定、最重要）
  - レスポンシブ対応、prefers-reduced-motion対応
- 設計意図: designing-beautiful-frontendsスキルのガイドラインに従い、汎用テンプレ感を排除。CLI/ターミナルツールであるClaude Codeのテーマに合わせてレトロフューチャリズム（サイバーパンク系）を採用。AskUserQuestionでユーザーの好みを事前確認
- 副作用: なし
- 関連ファイル: try/index.html
