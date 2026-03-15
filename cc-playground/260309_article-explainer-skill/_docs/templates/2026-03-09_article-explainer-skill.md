機能名: article-explainer スキル

- 日付: 2026-03-09 18:33:13
- 概要: 技術記事URLを渡すだけで高品質な日本語解説を自動生成するClaude Codeスキルの新規作成。Quick/Standard/Deepの3モードで解説深度を調整可能。ターミナル出力（ASCII図解）とMDファイル保存（Mermaid図）の両方に対応。
- 実装内容:
  - `init_skill.py` でスケルトン生成後、不要なディレクトリ（scripts/, assets/）を削除
  - `SKILL.md`: 5ステップワークフロー（コンテンツ取得→記事分析→日本語解説生成→MDファイル保存→実装ログ作成）を定義
  - `references/output-templates.md`: Quick/Standard/Deep Diveの3モード別出力テンプレート、ASCII/Mermaid図解ルール、メタデータヘッダー仕様を定義
  - `package_skill.py` でバリデーション通過を確認
- 設計意図:
  - ワークフロー型スキル構造を採用（`translating-technical-articles` と同パターン）
  - コンテンツ取得の優先順位（Firecrawl MCP → Brave Search MCP → WebFetch）は既存スキルと統一
  - 出力テンプレートを `references/` に分離し、SKILL.md本体を軽量に保つ設計
  - 該当しないセクション（比較表、コード例など）は省略可能にし、テンプレートの柔軟性を確保
- 副作用:
  - スキル実行時に `_article-notes/` ディレクトリがプロジェクトルートに自動作成される
  - 外部URLへの依存（Firecrawl MCP等でのコンテンツ取得）
- 関連ファイル:
  - `~/.claude/skills/article-explainer/SKILL.md`
  - `~/.claude/skills/article-explainer/references/output-templates.md`
