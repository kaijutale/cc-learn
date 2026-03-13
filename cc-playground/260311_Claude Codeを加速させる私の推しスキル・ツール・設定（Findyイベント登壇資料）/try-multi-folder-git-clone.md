# Multi-Folder Git Clone 試用メモ

## 概要

Zenn記事「Claude Codeを加速させる私の推しスキル・ツール・設定」で紹介されていた
Raycast拡張機能「Multi-Folder Git Clone」を試した記録。

- リポジトリ: https://github.com/tonkotsuboy/multi-folder-git-clone
- 参考記事: https://zenn.dev/ubie_dev/articles/claude-code-tips-findy-2026

## インストール方法

Raycast Storeには未公開のため、開発者モードでインストール:

```bash
cd /tmp
git clone https://github.com/tonkotsuboy/multi-folder-git-clone.git
cd multi-folder-git-clone
npm install
npm run dev  # Raycastに開発用拡張として登録される
```

## 試した結果

### クローン結果

`camoneart/cc-learn` リポジトリで実行。デフォルト設定（`~/git/github.com/`）で3つのクローンが生成された:

```
~/git/github.com/camoneart/
  ├── cc-learn/       # 1つ目
  ├── cc-learn-2/     # 2つ目（自動採番）
  └── cc-learn-3/     # 3つ目（自動採番）
```

### 確認事項

- 各ディレクトリは独立した完全な git clone（`.git/` を個別に保持）
- 全て同じリモート `origin` に紐づいている
- 各ディレクトリで独立して `git push` / `git pull` / PR作成が可能

## git worktree との比較

| 観点 | git worktree | 複数クローン |
|------|-------------|-------------|
| ディスク効率 | 良い（.git共有） | 悪い（全コピー） |
| 独立性 | .git共有による制約あり | 完全独立 |
| エディタでの扱い | やや分かりにくい | 普通のフォルダとして直感的 |
| セットアップ | `git worktree add` | このツールでワンクリック |

## 学び

- 「並列開発 = git worktree」という固定観念にとらわれる必要はない
- 技術的最適解（worktree）より体験的最適解（複数クローン）を選ぶ判断もある
- 毎日使う開発環境こそ「認知負荷の低さ」で選ぶ価値がある
