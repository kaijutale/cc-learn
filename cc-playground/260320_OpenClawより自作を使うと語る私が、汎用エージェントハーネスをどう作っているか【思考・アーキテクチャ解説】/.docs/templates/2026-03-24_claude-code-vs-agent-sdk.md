機能名: Claude Code と Claude Agent SDK の違い解説

- セッション名: なし（未設定）
- 日付: 2026-03-24 00:36:22
- 概要: ハーネス学習プロジェクトの一環として、Claude Code（完成されたエージェントハーネス製品）とClaude Agent SDK（カスタムエージェント構築用フレームワーク）の違いを整理・解説した
- 実装内容:
  - Claude Code と Claude Agent SDK の定義・目的・対象者・機能・使い分けを比較表で整理
  - 両者の関係性を図解（Claude APIを基盤として、Claude Codeは「使うツール」、Agent SDKは「作るためのフレームワーク」）
  - ケルベロスハーネス設計との関連性を示唆（Agent SDKがハーネス自作の道具箱に相当）
- 設計意図: 統合設計書（cerberus-harness-unified-spec.md）ではClaude Agent SDKを前提技術としている。Claude Code自体が「Anthropicが作ったハーネスの完成品」であり、Agent SDKが「自分のハーネスを作るための道具箱」であるという位置づけを明確にすることで、ケルベロスハーネス設計の意義（なぜ既製品があるのに自作するのか）をより深く理解するための基盤知識とした
- 副作用: なし
- 関連ファイル:
  - `.docs/spec/cerberus-harness-unified-spec.md` - ケルベロス統合設計書（Claude Agent SDKを前提技術として記載）
  - `.docs/references/260204_masao_汎用エージェントハーネス設計_思考とアーキテクチャ解説.pdf` - 元記事PDF
