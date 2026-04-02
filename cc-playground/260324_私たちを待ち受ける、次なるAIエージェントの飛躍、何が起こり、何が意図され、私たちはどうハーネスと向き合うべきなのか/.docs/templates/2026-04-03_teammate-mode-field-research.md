機能名: teammateModeフィールドの調査・解説

- セッション名: （未設定）
- 日付: 2026-04-03 07:59:41
- 概要: Claude Code Agent TeamsのteammateModeフィールドについて、公式ドキュメント・Web検索・参照PDF記事を横断して調査し、設定値・挙動・設計意図を整理した
- 実装内容:
  - teammateModeフィールドの3つの値（auto / in-process / tmux）と各挙動を調査
  - 設定場所（~/.claude.json またはCLIフラグ --teammate-mode）を特定
  - split panes対応ターミナル（tmux, iTerm2）と非対応ターミナル（VS Code統合, Windows Terminal, Ghostty）を整理
  - まさおさんのPDF記事「1人×N Agent Team（構造的スケール）」との接続を解説
  - teammateModeが「表示専用」であり協調ロジックとは分離されている設計を確認
- 設計意図: teammateModeはAgent Teamsの「見え方」のみを制御する設定。協調ロジック（タスク分配・メッセージング）と表示を分離することで、ターミナル環境に依存しない移植性を確保している
- 副作用: なし（調査・解説のみ）
- 関連ファイル:
  - .docs/references/pdf/next-ai-agent-leap-and-harness.pdf（まさおさんの参照記事）
  - ~/.claude.json（teammateModeの設定場所）
