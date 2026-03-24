機能名: Agent Teams 公式ドキュメント＆記事の解説セッション

- セッション名: （未設定）
- 日付: 2026-03-24 23:36:50
- 概要: Claude Code Agent Teamsの公式ドキュメント（code.claude.com/docs/en/agent-teams）とリファレンスPDF記事を元に、Agent Teamsの主要概念を体系的に学習・解説するセッション
- 実装内容:
  - 表示モード（In-process vs Split panes）の比較と使い分け指針の解説
  - デリゲートモード（Shift+Tabで切り替え、リーダーを調整専用に制限）の解説
  - Permission（権限）の伝播の仕組み（リーダー→メンバーへのコピー、bypassPermissionsの全員伝播リスク）の解説
  - `--dangerously-skip-permissions` フラグの意味と危険性の解説
  - Permission Mode（権限モード）全5種類（default, acceptEdits, plan, dontAsk, bypassPermissions）の解説
  - Shift+Tabで切り替えられる3モードとsettings.json/CLIでのみ設定可能な2モードの整理
  - かもねの現在の設定（defaultモード + 充実したallow/denyルール）の確認と評価
- 設計意図: Agent Teamsは実験的機能であり、権限やモードの理解が安全な運用の前提となるため、基盤概念から丁寧に積み上げる形で解説を構成した
- 副作用: なし（解説のみのセッション、コード変更なし）
- 関連ファイル:
  - `.docs/references/claude-code-agent-teams-parallel-development.pdf` - リファレンスPDF記事
  - 公式ドキュメント: https://code.claude.com/docs/en/agent-teams
  - 公式ドキュメント: https://code.claude.com/docs/en/permissions
