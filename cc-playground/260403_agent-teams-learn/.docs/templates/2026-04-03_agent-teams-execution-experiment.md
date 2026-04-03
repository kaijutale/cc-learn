機能名: Agent Teams 実行実験 — プロジェクト調査チームの起動と運用

- セッション名: agent-teams-learn
- 日付: 2026-04-03 17:27:11
- 概要: activate-agent-teamsスキルを使い、実際にAgent Teamsを起動してプロジェクト調査を実施。2人のチームメイト（file-explorer / config-analyzer）を並列起動し、チームリードとしてオーケストレーションを行った。併せてGhosttyターミナルでのtmuxペイン分割の非表示問題を調査・特定した。
- 実装内容:
  - TeamCreate でチーム `project-investigator` を作成
  - TaskCreate で2つのタスク（ファイル構成調査 / CLAUDE.md設定分析）を登録
  - Agent (team_name指定, subagent_type: Explore) で2名のチームメイトを並列起動
  - TaskUpdate でオーナー割当 + SendMessage で作業開始指示
  - file-explorer: ディレクトリツリー・ファイル役割・Git履歴・プロジェクト規模を報告
  - config-analyzer: idle状態でリマインド送信後、CLAUDE.md分析・ルール優先順位・グローバル設定との統合関係を詳細報告
  - shutdown_request で両チームメイトをクリーンに終了
  - Ghostty + teammateMode: "tmux" でペイン分割が不可視となる問題を調査・原因特定
- 設計意図:
  - Agent Teamsのワークフロー全体（作成→タスク登録→起動→割当→通信→完了→終了）を一通り体験し、動作原理を理解する
  - Subagentsとの違い（独立プロセス・メッセージベース非同期通信・tmux pane実体）を実感する
  - idle通知の意味とチームリードの催促パターンを実践で学ぶ
- 副作用:
  - Ghosttyから直接起動した場合、teammateMode: "tmux" はデタッチドtmuxセッションとして動作し、ペイン分割が見えない（機能は正常動作する）
  - config-analyzerがidle通知のみで報告を送信しなかったケースあり。リマインド送信で解決したが、Exploreエージェントの報告タイミングが不安定な可能性
- 関連ファイル:
  - `.claude/settings.json` — CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"
  - `~/.claude/settings.json` — グローバル設定（teammateMode: "tmux" は ~/.claude.json に保存）
  - `~/.claude/teams/project-investigator/config.json` — チーム設定（自動生成）

## 学習メモ

### Agent Teamsワークフロー順序
1. TeamCreate → チーム + タスクリスト自動生成
2. TaskCreate → 作業項目登録
3. Agent (team_name) → チームメイト起動（独立インスタンス）
4. TaskUpdate (owner) → タスク割当
5. SendMessage → 作業指示・催促・コミュニケーション
6. TaskUpdate (completed) → 完了記録
7. SendMessage (shutdown_request) → チームメイト終了
8. TeamDelete → チームリソース削除（config.json, inboxes/, タスクリスト）

### 終了フローの注意点（実験で判明）
- shutdown_requestだけではチームリソース（~/.claude/teams/, ~/.claude/tasks/）が残る
- TeamDeleteは全メンバー終了後にのみ実行可能（アクティブなメンバーがいるとfail）
- Clean upしないと~/.claude/teams/にゴミが溜まり続ける
- 「Shut down teammates」と「Clean up the team」は別操作。公式ドキュメントでも明確に分離されている

### teammateMode対応状況（2026-04-03時点）
| ターミナル | Split Pane | 備考 |
|---|---|---|
| tmux | 対応 | ネイティブCLI |
| iTerm2 | 対応 | AppleScript (it2 CLI) |
| Ghostty | 未対応 | v1.3.0でAppleScript追加済み、Issue #24189で進行中 |
| VS Code / Windows Terminal | 未対応 | in-processモードのみ |

### 回避策
- `tmux new -s claude` 内でClaude Code起動 → ペイン分割が見える
- `claude --teammate-mode in-process` → ペイン分割なし、Shift+Downで切替
- gx-ghostty（コミュニティ製シム）→ AppleScript + Accessibility APIで模倣
