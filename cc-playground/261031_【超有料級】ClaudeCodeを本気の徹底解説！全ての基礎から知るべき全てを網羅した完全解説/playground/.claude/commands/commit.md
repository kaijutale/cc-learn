---
name: commit
description: Conventional Commits形式でコミットメッセージを生成し、コミットを実行する
argument-hint: [コミットメッセージのヒントや追加指示（省略可）]
disable-model-invocation: true
allowed-tools: Bash(git *), Read
---

# Git Commit コマンド

Conventional Commits形式に準拠したコミットを実行する。

## 重要なルール

**以下のメッセージは絶対にコミットメッセージに追加しないこと**:
- `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- `Co-Authored-By: Claude <noreply@anthropic.com>`

## ユーザーからの追加指示

$ARGUMENTS

## 実行フロー

### Step 1: 現在の状態を確認

以下のコマンドを実行して現状を把握する：

```bash
git status
git diff
git diff --cached
git log --oneline -5
```

### Step 2: 変更内容を分析

上記の出力を分析し、以下を特定する：
- 変更されたファイルの種類（実装、テスト、ドキュメント、設定など）
- 変更の目的（新機能、バグ修正、リファクタリングなど）
- 影響範囲（スコープ）

### Step 3: Conventional Commits Prefix を選択

| Prefix | 用途 |
|--------|------|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（フォーマット等） |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステムや外部依存の変更 |
| `ci` | CI設定の変更 |
| `chore` | その他の変更（srcやtestに影響しない） |
| `revert` | 以前のコミットの取り消し |
| `add` | 新規ファイル・パッケージの追加 |
| `update` | 既存機能の更新・改善 |
| `remove` | ファイル・機能の削除 |

### Step 4: コミットメッセージを生成

**フォーマット**:
```
<type>(<scope>): <subject>

<body>
```

- `<type>`: 上記Prefixから選択
- `<scope>`: 変更の影響範囲（省略可）
- `<subject>`: 変更内容の簡潔な説明（50文字以内推奨）
- `<body>`: 詳細な説明（省略可、72文字で折り返し）

### Step 5: ユーザーに確認

提案したコミットメッセージをユーザーに提示し、以下を確認：
- メッセージ内容が適切か
- ステージングするファイルは正しいか
- 修正が必要な場合は指摘を受ける

### Step 6: ステージングとコミット実行

**重要**: `git add -A` は使用しない。個別にファイルをステージングする。

```bash
git add <file1>
git add <file2>

git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject>

<body>
EOF
)"
```

### Step 7: 結果を報告

コミット完了後、以下を表示：
- コミットハッシュ
- コミットメッセージ
- 変更されたファイル数

## 注意事項

- ステージングされていない変更がある場合は、何をステージングするか確認する
- 複数の目的が混在する変更は、分割コミットを提案する
- 不明な点があればユーザーに確認する
