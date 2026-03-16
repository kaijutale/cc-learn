機能名: GitHub Actions学習・初体験

- セッション名: github-actions-study
- 日付: 2026-03-09 17:21:08
- 概要: まさお氏のGitHub Actions勉強会記事を読み、GitHub Actionsの基礎を学習。実際にワークフローを作成・実行してGitHub Actionsを初体験した。さらにテンプレートリポジトリの作成まで実施。
- 実装内容:
  - 記事の内容を対話形式で学習（CI/CD、GitHub Actions、ワークフロー、イベントトリガー、AI API連携の理解）
  - PR Stats自動コメントワークフロー（pr-stats.yml）を作成し、cc-learnリポジトリにPR #34として動作確認
  - テンプレートリポジトリ（my-project-template）を作成し、テンプレートからのリポジトリ作成を体験
- 設計意図:
  - AI API不要（無料）で動作するワークフローを選択。MAXプラン（サブスク）環境でAPI従量課金なしで活用できる構成にした
  - actions/github-script@v7を使いGitHub APIのみで完結させることで、外部依存をゼロにした
  - sticky comment（既存コメント上書き）を自前実装し、PRがコメントで溢れない設計にした
  - テンプレートリポジトリにワークフローを含めることで、今後の新規プロジェクトで自動化済みの状態からスタートできるようにした
- 副作用:
  - cc-learnリポジトリにfeat/pr-stats-workflowブランチとPR #34が残っている（未マージ）
  - my-project-templateリポジトリがGitHub上に作成済み（テンプレート設定ON）
  - test-from-templateリポジトリがGitHub上に残っている（削除権限エラーで未削除）
  - ローカルに /Users/camone/dev/my-project-template が残っている
- 関連ファイル:
  - /Users/camone/dev/claude-code/claude-code-learn/.github/workflows/pr-stats.yml
  - /Users/camone/dev/claude-code/claude-code-learn/.github/workflows/README.md
  - /Users/camone/dev/my-project-template/.github/workflows/pr-stats.yml
  - /Users/camone/dev/my-project-template/.gitignore

## 学習ポイントまとめ

- GitHub Actions = 汎用自動化プラットフォーム。CI/CDはその用途の1つ
- ワークフロー定義: .github/workflows/にYAMLを置いてpushするだけで動く
- AI API連携部分（Claude Code Action、GLM Summary）はAPI従量課金が必要。MAXプランではカバーされない
- AI APIなしでも、テスト・リント・デプロイ・統計コメント等の自動化は十分実用的
- secrets.〇〇_API_KEYが出てきたら外部有料サービスを使っている目印
- テンプレートリポジトリ: is_template設定で有効化。名前ではなく設定で決まる。作成時に1回コピーされるだけで同期はしない
