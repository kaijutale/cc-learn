機能名: プロジェクト構造整理とGitリモート設定修正

- 日付: 2026-02-17 18:52:19
- 概要: playground/サブディレクトリに格納されていたプロジェクトファイルをルート直下に移動し、ディレクトリ構造をフラット化。また、GitリモートURLをHTTPSからSSHに切り替え、push時の認証エラーを解消。

- 実装内容:
  - ディレクトリ構造のリファクタリング
    - playground/.claude/CLAUDE.md → .claude/CLAUDE.md
    - playground/_docs/templates/2026-02-15_cc-appunto-kanban-app.md → _docs/templates/2026-02-15_cc-appunto-kanban-app.md
    - playground/_idea/all-idea.md → _idea/all-idea.md
    - playground/_idea/app-plan.md → _idea/app-plan.md
  - GitリモートURL変更
    - 変更前: https://github.com/camoneart/cc-learn.git
    - 変更後: git@github.com:camoneart/cc-learn.git
  - Gitコミット:
    - `4527942` refactor: playground/サブディレクトリからプロジェクトルートへファイル構成を移動

- 設計意図:
  - playground/の1階層ネストを廃止し、プロジェクトルートから直接 .claude/, _docs/, _idea/ にアクセスできるようにした
  - SSH形式への切り替えにより、Claude Code等の非対話型環境からもpush可能に（HTTPS方式は対話的なトークン入力が必要で、非対話型環境では"Device not configured"エラーが発生していた）

- 副作用:
  - 同リポジトリ(cc-learn)の他のローカルクローンがある場合、そちらはHTTPSのまま（必要に応じて個別に切り替えが必要）
  - playground/ディレクトリが完全に削除されたため、過去のコミット参照時にパスが変わっている点に注意

- 関連ファイル:
  - .claude/CLAUDE.md
  - _docs/templates/2026-02-15_cc-appunto-kanban-app.md
  - _idea/all-idea.md
  - _idea/app-plan.md
