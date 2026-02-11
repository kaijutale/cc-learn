# Boris Cherny's 23 Moves - Claude Code活用術23選

> Claude Code開発者 Boris Cherny (@bcherny) が語る、実際の活用術
>
> 原文: https://x.com/bcherny/status/2007179832300581177
> まとめサイト: https://howborisusesclaudecode.com

---

# Part 1: 2025年12月（13 Tips）

## Chapter 01: 環境 & セットアップ

### 01. 5つのClaudeを並列実行

- ターミナルで**5つのClaude Codeインスタンス**を同時実行
- 同じリポジトリの別々の**gitワークツリー**を使い、タブに1〜5の番号を付けて管理
- iTerm2のシステム通知で、どのClaudeが入力待ちかを把握

```bash
git worktree add ../my-repo-2 feature-branch-1
git worktree add ../my-repo-3 feature-branch-2
```

### 02. Web & モバイルでも並列セッション

- ターミナルに加え、**claude.ai/code で5〜10セッション**を追加実行
- `&`コマンドや`--teleport`フラグでローカル↔Web間のワーク移動が可能
- 朝はiOSアプリからセッション開始 → 出社後デスクトップで再開

### 03. 全てにOpus + Thinkingを使う

- **Opus（thinking有効）を常時使用**
- Sonnetより遅いが、操舵が少なく済み、ツール使用が優秀
- 結果的に小さいモデルより速い

> "It's the best coding model I've ever used. Less steering + better tool use = faster overall results." — Boris Cherny

---

## Chapter 02: 知識の蓄積

### 04. 共有CLAUDE.md

- チームで**1つのCLAUDE.mdファイルをGitリポジトリにチェックイン**
- 週に複数回チーム全員が更新
- Claudeが間違いを犯した時にドキュメント化し、同じミスの再発を防止

```markdown
# CLAUDE.md の例
## コーディング規約
- テストは必ずvitest を使う
- console.logではなくloggerを使う
- 型はanyを使わない
```

### 05. コードレビューで@.claude

- PRレビュー時に**@.claude をタグ付け**し、学びをCLAUDE.mdに直接追加
- Claude Code GitHub Actionを使用
- レビューのたびにClaude自体が賢くなる **「Compounding Engineering」**
- 使うほどチーム全体の生産性が上がるフライホイール効果

---

## Chapter 03: ワークフロー

### 06. Plan Modeから始める

- ほとんどのセッションを**Plan Mode（Shift+Tab ×2）**で開始
- Claudeと計画を何度もやり取りして納得するまで練る
- その後、auto-accept editsモードに切替え → 一発実装

| ステップ | 操作 |
|---------|------|
| Plan Mode ON | `Shift+Tab` ×2 |
| Auto-accept ON | `Shift+Tab` ×1 |

### 07. スラッシュコマンドで高速化

- `.claude/commands/` にスラッシュコマンドを作成しGitにチェックイン
- インラインBashにより`git status`などを事前計算
- 余分なモデル呼び出しを削減

```markdown
# .claude/commands/commit-push-pr.md
以下のgit情報を元にコミット→PR作成して:
$(git status)
$(git diff --cached)
```

### 08. サブエージェントで定型作業自動化

- `.claude/agents/` にサブエージェントを配置
- PRレビューの定型ワークフローを自動化

| エージェント | 役割 |
|------------|------|
| code-simplifier | 完成したコードをシンプルに整理 |
| verify-app | 詳細なE2Eテスト手順を実行 |

サブエージェントはメインのコンテキストウィンドウを消費しない。

---

## Chapter 04: システム設定

### 09. PostToolUseフックでフォーマット

- **PostToolUseフック**でコードを自動フォーマット
- Claudeは90%は綺麗なコードを生成するが、残りの10%をフックがカバー
- CIのフォーマットエラーを防止

### 10. 安全なコマンドを事前許可

- `--dangerously-skip-permissions` は**使わない**
- `/permissions`で安全なBashコマンドを事前許可
- 設定は`.claude/settings.json`に保存しチーム共有

```
Bash(npm test:*)  # ワイルドカードで安全なコマンドパターンを許可
```

### 11. 外部ツール連携（MCP）

- Claude Codeが**Slack、BigQuery、Sentry**など既存ツールと自律的に連携
- MCPサーバー経由でメッセージ送信、分析クエリ実行、エラーログ取得
- `.mcp.json`でバージョン管理しチーム全体でアクセス可能

### 12. 長時間タスクの管理

3つのアプローチを使い分ける:

| # | アプローチ | 説明 |
|---|----------|------|
| 1 | バックグラウンドエージェント | タスク完了後に別エージェントでレビュー |
| 2 | Stopフック | フックを使って特定条件でClaudeを停止 |
| 3 | ralph-wiggumプラグイン | サンドボックスで`--permission-mode=dontAsk`を使い中断なく実行 |

---

## Chapter 05: 最も重要な活用術

### 13. 検証手段を与える ⭐

> "Give Claude a way to verify its work... it will 2-3x the quality of the final result." — Boris Cherny

Borisが**「最も重要」**と断言する活用術。Claudeに自分の作業を確認する手段を与えることで、最終結果の品質が**2〜3倍**に向上する。

**検証手段の例:**

| 手段 | 内容 |
|------|------|
| テストコード | 実装後にテストを実行して確認 |
| Chrome拡張 | UIをブラウザで開いてスクショ撮影→比較→反復 |
| リンター/ビルド | CIパイプラインをローカルで再現 |
| E2Eテスト | サブエージェントで網羅的にテスト |

**核心**: フィードバックループを閉じること。「書いて終わり」ではなく「書いて、確認して、直して」のサイクルを回す。検証できないものは出荷しない。

---

# Part 2: 2026年1月（10 Tips）

## Chapter 06: 並列処理と計画の深化

### 14. もっと並列で

- **git worktree**を使って3〜5のワークツリーを同時起動し、それぞれで独立したClaudeセッションを実行
- Claude Codeチームは**checkoutよりworktreeを推奨**
- シェルエイリアス（`za`, `zb`, `zc`）でワークツリー間をワンキーで移動するユーザーも

```bash
git worktree add ../repo-a feature-a
git worktree add ../repo-b feature-b

alias za='cd ../repo-a'
alias zb='cd ../repo-b'
```

### 15. 複雑なタスクは必ずPlan Modeから

- Plan Modeに十分な時間を投資して、Claudeが**一発で実装できる**ようにする
- 上級者は**1つのClaudeに計画を書かせ、別のClaudeにスタッフエンジニアとしてレビューさせる**

> "A good plan is really important to avoid issues down the line." — Boris Cherny

---

## Chapter 07: 知識基盤の強化

### 16. CLAUDE.mdに投資する

- Claudeを修正するたびに「**CLAUDE.mdを更新して、同じミスをしないようにして**」と指示する
- Claudeは自分でルールを書くのが上手い
- タスク別のノートディレクトリを用意し、CLAUDE.mdからポイントする方法も有効

### 17. 自分のSkillsを作る

- カスタムSkillsをGitにコミットして**プロジェクト横断で再利用**
- チームへの推奨：
  - 毎日使うタスクをskills/commandsに変換
  - `/techdebt`コマンドで重複コードを削除
  - Slack/GDrive/Asana/GitHubの7日分を集約する同期コマンド
  - dbtモデルを書くanalytics-engineerエージェント

---

## Chapter 08: 実践力の向上

### 18. Claudeはバグの大半を自力で直す

- **Slack MCP**を有効にして、バグスレッドをそのまま貼り付ける
- 「直して」と言うだけでコンテキスト切り替えが不要に
- Dockerログが分散システムのトラブルシューティングに驚くほど効果的

### 19. プロンプティングをレベルアップ

3つのテクニック：

| # | テクニック | 内容 |
|---|----------|------|
| 1 | Claudeに試験させる | 「変更点を厳しく質問して、テストに合格するまでPRを出すな」 |
| 2 | やり直しを要求 | 「知っていることを全て踏まえて、一から洗練された解決策を実装して」 |
| 3 | 詳細な仕様を書く | 曖昧さを減らすために詳細な仕様を書く |

> "Don't accept the first solution. Push Claude to do better—it usually can." — Boris Cherny

---

## Chapter 09: 環境とエージェント

### 20. ターミナル & 環境設定

- **Ghostty**ターミナルを推奨（同期レンダリング、24bitカラー、Unicode対応）
- `/statusline`でステータスバーをカスタマイズ（コンテキスト使用量、gitブランチ表示）
- **音声入力**（macOSの`fn`×2）でプロンプティングを3倍速に

### 21. サブエージェントを活用する

3つの活用法：

| # | 活用法 | 内容 |
|---|-------|------|
| 1 | 計算力の追加 | 「サブエージェントを使って」と追記するだけで追加の計算リソースを投入 |
| 2 | コンテキスト保護 | 個別タスクをオフロードしてメインエージェントのコンテキストをクリーンに保つ |
| 3 | 権限リクエスト管理 | フックでOpus 4.5に権限リクエストをルーティングし、攻撃スキャンと安全な操作の自動承認を実行 |

---

## Chapter 10: データと学習

### 22. データ分析にClaudeを使う

- Claude Code + `bq` CLIでリアルタイムにメトリクスを抽出・分析
- チームで共有BigQueryスキルを運用
- CLI、MCP、APIアクセスがある任意のデータベースに応用可能

> "Personally, I haven't written a line of SQL in 6+ months." — Boris Cherny

### 23. Claudeで学ぶ

4つの学習戦略：

| # | 戦略 | 内容 |
|---|------|------|
| 1 | 説明的出力 | `/config`で"Explanatory"や"Learning"出力スタイルを有効化 |
| 2 | HTMLプレゼンテーション | 不慣れなコードをビジュアルなHTMLスライドで解説させる |
| 3 | ASCIIダイアグラム | プロトコルやコードベースの構造をASCII図で理解 |
| 4 | 間隔反復学習 | Claudeにフォローアップ質問をさせ、知識のギャップを特定するスキルを構築 |

---

## 参考リンク

- [Boris's original thread](https://x.com/bcherny/status/2007179832300581177)
- [How Boris Uses Claude Code](https://howborisusesclaudecode.com)
- [Claude Code Docs](https://code.claude.com/docs)
- [Claude Code Best Practices](https://github.com/shanraisshan/claude-code-best-practice)
