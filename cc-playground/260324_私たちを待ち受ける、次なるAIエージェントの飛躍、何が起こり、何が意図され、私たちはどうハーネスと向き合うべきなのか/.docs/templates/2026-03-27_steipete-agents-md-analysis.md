機能名: steipete AGENTS.MD 実物分析（PDF記事との比較検証）

- セッション名: N/A
- 日付: 2026-03-27 23:22:57
- 概要: PDF記事「私たちを待ち受ける、次なるAIエージェントの飛躍」でsteipeteのAGENTS.MDについて述べられている主張を、GitHub上の実物（steipete/agent-scripts/AGENTS.MD、172行/8.46KB）と突合し、正確性を検証。併せてPDF記事が扱っていない実物固有のディテールを抽出・整理した。
- 実装内容:
  - Firecrawl MCPで https://github.com/steipete/agent-scripts/blob/main/AGENTS.MD を取得
  - PDF記事の4つの主張（電報スタイル、バグ駆動テスト、Frontend Aesthetics制約、注意力の有限性の自己適用）を実物と照合
  - 実物固有の発見を4カテゴリで整理:
    1. 個人エコシステム全公開（SSH先Mac、Sonos、X CLI、Obsidian vault等）
    2. oracle（セカンドオピニオン）― 別モデルにバンドルして相談する仕組み
    3. ドキュメント駆動（コーディング前にdocs listを実行する指示）
    4. マルチエージェント安全規約（git status/diff確認、小コミット、他エージェント変更の尊重）
  - AGENTS.MD全体の構造マップ（13セクション）を作成
  - PDF記事の主張 vs 実物の一致度を表形式で整理（4項目すべて「正確」と判定）
- 設計意図: かもねの質問「steipeteのバグ駆動テストは実際どういう感じ？」に対し、記事の二次情報ではなく一次ソースを取得して比較検証するアプローチを採用。記事の信頼性を実証しつつ、記事が扱わない実践的ディテール（oracle、ドキュメント駆動等）も発掘した。
- 副作用: なし（読み取り・分析のみ、コード変更なし）
- 関連ファイル:
  - 参照元: https://github.com/steipete/agent-scripts/blob/main/AGENTS.MD
  - 参照元: `.docs/references/pdf/next-ai-agent-leap-and-harness.pdf`
  - 過去の関連ログ: `.docs/templates/2026-03-26_skill-consolidation-telegraph-style.md`（電報スタイル統合）
  - 過去の関連ログ: `.docs/templates/2026-03-26_claude-md-update-from-agents-md.md`（CLAUDE.mdアップデート）
