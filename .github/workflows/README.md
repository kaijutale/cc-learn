# GitHub Actions Workflows

## pr-stats.yml

PRが作成・更新されたとき、変更ファイル一覧と行数統計を自動コメントするワークフロー。

- トリガー: PR作成時（opened）、PR更新時（synchronize）
- AI API: 不使用（完全無料）
- sticky comment対応: 更新時は既存コメントを上書き
