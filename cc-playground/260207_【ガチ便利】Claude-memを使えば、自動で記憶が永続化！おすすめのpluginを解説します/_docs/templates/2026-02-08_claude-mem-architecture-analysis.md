機能名: claude-mem アーキテクチャ分析

- セッション名: claude-mem-plugin解説
- 日付: 2026-02-08 17:30:47
- 概要: claude-memプラグインの内部構造を調査し、各コンポーネント（MCPサーバー、Hooks、Skills、Worker Service）の役割と関係性を明確にした。特にmcp-searchのenable/disable時のコンテキスト消費への影響を実機検証した。
- 実装内容:
  - claude-memプラグインの4コンポーネント構成を特定（MCPサーバー、Hooks、Skills、Worker Service）
  - mcp-searchが提供する5つのツール（search, timeline, get_observations, save_memory, __IMPORTANT）を確認
  - 3段階ワークフロー（search → timeline → get_observations）によるトークン節約設計を理解
  - mcp-search disabled時でもHooks+Worker Serviceが独立して記録を継続することを確認
  - mcp-search enabled/disabled切り替え時のコンテキスト消費を/contextで実測し、差がないことを検証
- 設計意図:
  - claude-memの各コンポーネントの責務分離を正しく理解するための調査
  - 「disabledにすればコンテキスト節約になる」という仮説を実証実験で検証
- 副作用:
  - なし。調査・検証のみで、設定やコードの変更は行っていない
- 関連ファイル:
  - `~/.claude/plugins/cache/thedotmack/claude-mem/9.1.1/.mcp.json`
  - `~/.claude/plugins/cache/thedotmack/claude-mem/9.1.1/hooks/hooks.json`
  - `~/.claude-mem/settings.json`

## 検証結果まとめ

### claude-memプラグインの構成

| コンポーネント | 種類 | 役割 |
|---|---|---|
| mcp-search | MCPサーバー | メモリの検索・取得ツールを提供 |
| Hooks | PostToolUse / SessionStart | ツール実行の記録・過去の記憶の注入 |
| Skills | mem-search, make-plan, do | ユーザーが呼び出せるコマンド |
| Worker Service | バックグラウンドデーモン | 観察の処理・DB保存 |

### mcp-search enable/disable の影響

| 観点 | enabled | disabled |
|---|---|---|
| コンテキスト消費 | 変わらない（deferred loading） | 変わらない |
| 記憶の記録 | Hooksで継続 | Hooksで継続 |
| 記憶の検索 | 可能 | 不可 |
| 推奨 | connectedのままでOK | メリットほぼなし |

### 重要な発見

- MCPサーバーのツールはdeferred loading（遅延読み込み）のため、connectedでもToolSearchで明示的に読み込むまでコンテキストを消費しない
- そのため「disabled にしてコンテキスト節約」という戦略はこのケースでは効果がない
