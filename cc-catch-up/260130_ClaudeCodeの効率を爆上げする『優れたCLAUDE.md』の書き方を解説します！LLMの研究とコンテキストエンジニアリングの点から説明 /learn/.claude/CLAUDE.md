# プロジェクト概要

このプロジェクトは〇〇のためのWebアプリケーションです。

## 技術スタック

- Frontend: Next.js 15 + TypeScript
- Backend: （未定）
- Database: （未定）

## コマンド

```bash
pnpm dev      # 開発サーバー起動
pnpm build    # ビルド
pnpm test     # テスト実行
pnpm lint     # Lint実行
```

---

## 詳細ドキュメント（Progressive Disclosure）

以下のドキュメントには、特定のタスクに関する詳細な指示が含まれています。
**作業を始める前に、該当するドキュメントを読んでください。**

| ドキュメント | 読むタイミング |
|------------|--------------|
| `_docs/agent_docs/frontend.md` | フロントエンドのコンポーネント作成、UI実装、スタイリング作業を行う時 |
| `_docs/agent_docs/backend.md` | API実装、サーバーサイドロジックを扱う時 |
| `_docs/agent_docs/test.md` | テストコードを書く時 |
| `_docs/agent_docs/tdd.md` | TDDで開発を進める時 |
| `_docs/agent_docs/design.md` | 設計判断やアーキテクチャに関わる時 |

### 例：フロントエンド作業の場合

1. まず `_docs/agent_docs/frontend.md` を読む
2. 記載されている規約・パターンに従って実装する
3. 参照先（`file:line`形式）があれば、そのコードも確認する
