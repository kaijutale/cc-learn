機能名: GTR セットアップと練習タスク完了

- セッション名: GTR Demo App 並列開発
- 日付: 2026-02-04 09:53:12
- 概要: GTR（Git Worktree Runner）をインストールし、並列開発のデモ環境を構築。練習用issueを作成し、camoneが5つの基本コマンドを習得した。
- 実装内容:
  1. GTRのインストール（git clone + シンボリックリンク作成）
  2. gtr-demoリポジトリの作成と初期化
  3. worktreeの作成（feature-frontend, feature-backend）
  4. GTRの設定（エディタ: Antigravity, AI: Claude）
  5. AntigravityのCLIをPATHに追加
  6. GitHub issueに5つの練習タスクを作成
  7. camoneが全issueを完了
- 設計意図:
  - GTRの基本コマンドを順番に学べるように、list → new → editor → ai → rm の順でissueを作成
  - 各issueには具体的な手順と期待される結果を記載し、初めてでも迷わないようにした
  - Antigravityをデフォルトエディタに設定することで、camoneの開発環境に合わせた
- 副作用:
  - `~/git-worktree-runner/` にGTRがクローンされている
  - `/opt/homebrew/bin/git-gtr` と `/opt/homebrew/bin/antigravity` にシンボリックリンクが作成されている
  - `gtr-demo-worktrees/` ディレクトリが作成されている（worktree用）
- 関連ファイル:
  - try/gtr-demo/ - メインリポジトリ
  - try/gtr-demo-worktrees/ - worktree格納ディレクトリ
  - GitHub issues: https://github.com/camoneart/cc-learn/issues/2 〜 6

## 覚えた基本コマンド

| コマンド | 用途 |
|----------|------|
| `git gtr list` | worktree一覧確認 |
| `git gtr new <branch>` | worktree作成 |
| `git gtr editor <branch>` | エディタで開く |
| `git gtr ai <branch>` | Claude Code起動 |
| `git gtr rm <branch>` | worktree削除 |

## 学んだポイント

- GTRは `git gtr` とセットで使う（`gtr` 単体では動かない）
- worktreeは `<リポジトリ名>-worktrees/` に自動作成される
- デフォルトブランチは `main` が必要（`master` だとエラー）
- PATHにあるコマンドならカスタムエディタとして使える

---

## gtr config コマンドの学習

- 日付: 2026-02-04 15:30:09
- 概要: `git gtr config` コマンドの使い方を学び、グローバル設定を行った
- 実装内容:
  1. `git gtr config` の各サブコマンド（get/set/add/unset/list）を学習
  2. 設定キーの種類と用途を理解
  3. `--global` オプションの意味（ローカル vs グローバル設定）を理解
  4. グローバル設定を実施（editor: antigravity, ai: claude）
- 設計意図:
  - グローバル設定を使うことで、新しいプロジェクトでも毎回設定する手間を省く
  - エディタとAIツールは個人の好みなのでグローバル、フックやコピー設定はプロジェクト固有なのでローカルという使い分け
- 副作用:
  - `~/.gitconfig` にgtrのグローバル設定が追加された
- 関連ファイル:
  - ~/.gitconfig（グローバル設定）

### gtr config サブコマンド一覧

| コマンド | 用途 |
|----------|------|
| `git gtr config get <key>` | 設定値を取得 |
| `git gtr config set <key> <value>` | 設定値を設定 |
| `git gtr config add <key> <value>` | 複数値設定に値を追加 |
| `git gtr config unset <key>` | 設定値を削除 |
| `git gtr config list` | 全設定を一覧表示 |

### 主な設定キー

| キー | 説明 |
|------|------|
| `gtr.editor.default` | デフォルトエディタ |
| `gtr.ai.default` | デフォルトAIツール |
| `gtr.worktrees.dir` | worktree保存先 |
| `gtr.hook.postCreate` | 作成後フック（複数値可） |
| `gtr.copy.include` | コピー対象ファイル（複数値可） |

### --global オプション

| オプション | 適用範囲 | 保存場所 |
|-----------|---------|---------|
| なし | そのリポジトリだけ | `.git/config` |
| `--global` | 全リポジトリ | `~/.gitconfig` |
