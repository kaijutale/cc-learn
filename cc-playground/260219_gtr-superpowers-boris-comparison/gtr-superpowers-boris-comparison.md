# gtr・Superpowers・Boris氏活用術の比較と使い分けガイド

> gtr、Superpowers、Boris氏のClaude Code活用術の3つの違いと使い分けのベストプラクティス

---

## 1. 3つの全体像

| | **gtr** | **Superpowers** | **Boris氏の活用術** |
|---|---------|----------------|-------------------|
| **本質** | git worktreeの**操作ツール** | AIエージェントの**開発ワークフロー** | Claude Codeの**実践的Tips集** |
| **レイヤー** | インフラ（道具） | プロセス（仕組み） | ナレッジ（知恵） |
| **例えるなら** | 高性能な包丁 | レシピブック | シェフの経験則 |
| **作者** | CodeRabbit社 | Jesse Vincent (obra) | Boris Cherny (Claude Code開発者) |
| **形態** | CLIツール（Bash製） | Claude Codeプラグイン | ブログ記事・Tips集 |
| **インストール** | `brew install git-gtr` | `/plugin install superpowers` | CLAUDE.md等に手動反映 |

> 3つは競合関係ではなく、レイヤーが異なる。組み合わせて使うもの。

---

## 2. 各ツール・ナレッジの詳細

### A. gtr（Git Worktree Runner）

#### 概要

`git worktree`の操作を劇的に簡単にするCLIツール。CodeRabbit社が開発。

#### 核心的な価値

- ワークツリーの作成・削除・管理をシンプルなコマンドに
- `.env`などの設定ファイルを自動コピー
- `npm install`等のポストフックを自動実行
- エディタ（Cursor等）やAIツール（Claude Code等）を同時起動
- `gtr cd`でワークツリー間をサクサク移動

#### 素のgit worktree vs gtr

```bash
# 素のgit worktree（面倒）
git worktree add ../my-project-feature -b feature
cd ../my-project-feature
cp ../.env .
npm install
cursor .

# gtr（一発）
git gtr new feature --editor --ai
```

#### 主なコマンド

```bash
git gtr new feature-auth --editor --ai  # 作成 + エディタ + AI起動
git gtr list                            # 一覧表示
git gtr rm feature-auth                 # 削除
git gtr run feature-auth npm test       # コマンド実行
git gtr copy feature-auth -- ".env*"    # ファイルコピー
git gtr clean --merged                  # マージ済みをクリーンアップ
gtr cd feature-auth                     # ワークツリーに移動
```

#### セットアップ

```bash
# インストール
brew tap coderabbitai/tap
brew install git-gtr

# 設定
git gtr config set gtr.editor.default cursor
git gtr config set gtr.ai.default claude

# シェル統合（~/.zshrcに追加）
eval "$(git gtr init bash)"
eval "$(git gtr completion zsh)"
```

#### メリット

- ブランチ切り替えのコンテキストスイッチング排除
- 複数の機能を同時に開発・テスト可能
- 設定ファイルの自動コピー・初期化スクリプトの自動実行
- エディタ・AIツールとの統合がワンコマンド

#### デメリット・注意点

- 各ワークツリーが`node_modules`等を独立保持 → ディスク容量消費
- デフォルトブランチが`main`である必要あり
- Windows PowerShellは未サポート（Git Bash/WSLなら可）

---

### B. Superpowers

#### 概要

Claude Code向けの包括的な開発ワークフロープラグイン。AIエージェントに「設計 → 計画 → 実装 → レビュー」の体系的プロセスを踏ませる。

#### 核心的な価値

- ブレインストーミングで仕様を明確化（YAGNI原則で削ぎ落とす）
- 計画作成でタスク分割と依存関係を整理
- サブエージェント駆動開発で各タスクを独立エージェントに割り当て
- 2段階レビュー（仕様準拠チェック → コード品質チェック）
- TDD（テスト駆動開発）が組み込まれた設計

#### コアスキル一覧

| スキル | 役割 |
|--------|------|
| `brainstorming` | ソクラテス式対話で仕様を詰める |
| `writing-plans` | 実装計画を詳細に作成 |
| `executing-plans` | バッチ処理で段階的に実装 |
| `subagent-driven-development` | 各タスクを独立サブエージェントで実行 |
| `using-git-worktrees` | git worktreeの自動セットアップ |
| `requesting-code-review` | 2段階コードレビュー |
| `dispatching-parallel-agents` | 複数エージェントの並行実行 |

#### 基本的なワークフロー

```bash
# 1. 仕様を詰める
/superpowers:brainstorm

# 2. 計画を作成
/superpowers:write-plan

# 3. 計画を実行（TDD + 2段階レビュー）
/superpowers:execute-plan
```

#### セットアップ

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

#### メリット

- 品質保証（TDD、2段階レビュー）が仕組みとして組み込まれている
- サブエージェント駆動でコンテキスト効率が高い
- ブレインストーミングで「作る前に考える」を強制
- モジュール式で拡張可能

#### デメリット・注意点

- 学習コスト（各スキルの理解が必要）
- Claude Code依存（他の環境では使えない）
- 小さなタスクにはオーバーキル
- git worktreeスキルはgtrほど高機能ではない

---

### C. Boris氏のClaude Code活用術

#### 概要

Claude Code開発者であるBoris Cherny氏が公開した実践的なTips集。全23選。

#### 核心的な内容（カテゴリ別）

##### 並列開発

- 5つのClaude並列実行（git worktree + iTerm2）
- Web/モバイルで追加セッション（claude.ai/code）
- シェルエイリアス（`za`, `zb`, `zc`）でワークツリー間移動

##### 計画と実装

- **必ずPlan Modeから開始**（`Shift+Tab` x2）
- 計画を練ってからauto-acceptモードで一発実装
- 複雑なタスクは「1つ目のClaudeに計画、2つ目にレビュー」

##### 知識の蓄積（Compounding Engineering）

- CLAUDE.mdをチーム共有しGitにチェックイン
- ミスの度に「CLAUDE.mdを更新して同じミスをしないようにして」と指示
- PRレビューで@.claude → 自動的にCLAUDE.mdに反映

##### 自動化

- スラッシュコマンド（`.claude/commands/`）で定型作業を高速化
- サブエージェント（`.claude/agents/`）でレビュー・テスト自動化
- PostToolUseフックで自動フォーマット

##### 検証（最重要）

> "Give Claude a way to verify its work... it will 2-3x the quality of the final result." — Boris Cherny

- テストコード、Chrome拡張でのスクショ比較、リンター/ビルド、E2Eテスト
- 検証できないものは出荷しない

##### 外部連携

- MCP経由でSlack・BigQuery・Sentry連携
- `.mcp.json`でバージョン管理しチーム共有

##### その他

- Opus + Thinkingを常時使用（結果的に最速）
- `/permissions`で安全なコマンドを事前許可
- Ghosttyターミナル推奨
- 音声入力（macOS `fn` x2）でプロンプティング3倍速

---

## 3. 3つの関係図

```
+-------------------------------------------------+
|          Boris氏の活用術（知恵）                  |
|   Plan Mode / CLAUDE.md / 検証 / MCP連携         |
|                                                 |
|  +------------------+  +---------------------+  |
|  |   gtr（道具）      |  | Superpowers（仕組み） |  |
|  |                  |  |                     |  |
|  | worktree作成     |  | brainstorm          |  |
|  | エディタ起動     |  | write-plan          |  |
|  | AI起動          |  | execute-plan        |  |
|  | ファイルコピー   |  | 2段階レビュー        |  |
|  | クリーンアップ   |  | サブエージェント      |  |
|  +------------------+  +---------------------+  |
|         ^ 環境構築          ^ 開発プロセス        |
+-------------------------------------------------+
```

---

## 4. シーン別の使い分けガイド

### シーン1: 小さなバグ修正・単発タスク

```
使うもの: Boris氏の活用術のみ
```

- Plan Modeで計画 → auto-acceptで実装 → テストで検証
- gtrもSuperpowersも不要。シンプルに1セッションで完結

### シーン2: 中規模の機能開発（1~3ファイル）

```
使うもの: Boris氏の活用術 + Superpowers
```

1. `/superpowers:brainstorm` で仕様を詰める
2. `/superpowers:write-plan` で計画作成
3. Plan Modeで計画レビュー
4. `/superpowers:execute-plan` でTDD実装
5. 検証手段（テスト・スクショ）で品質確保

### シーン3: 大規模開発・複数機能の並列開発

```
使うもの: 3つ全部！
```

1. **gtr**で環境構築
   ```bash
   git gtr new feature-auth --editor --ai     # 認証機能
   git gtr new feature-dashboard --editor --ai # ダッシュボード
   git gtr new feature-api --editor --ai       # API改修
   ```
2. **各ワークツリーでSuperpowers**を使って開発
   ```bash
   # ワークツリー1で
   /superpowers:brainstorm → write-plan → execute-plan

   # ワークツリー2で（同時進行）
   /superpowers:brainstorm → write-plan → execute-plan
   ```
3. **Boris氏の活用術**を土台にした設定
   - CLAUDE.mdでルール共有
   - PostToolUseフックで自動フォーマット
   - サブエージェントでレビュー
   - 検証手段を必ず提供

### 判断フローチャート

```
タスクの規模は？
|
+- 小さい（タイポ修正、1関数追加）
|  -> Boris Tips だけで十分
|
+- 中くらい（1機能、数ファイル）
|  -> Boris Tips + Superpowers
|
+- 大きい（複数機能、並列開発）
   -> Boris Tips + Superpowers + gtr
```

---

## 5. 重要なポイント3つ

### 1. Boris氏の活用術は常に土台になる

gtrやSuperpowersを使うかどうかに関わらず、Plan Mode・CLAUDE.md・検証の3原則は毎回適用すべき。特に「検証手段を与える」はBoris氏が「最重要」と断言しているポイント。

### 2. gtrとSuperpowersのworktreeスキルは重複する

Superpowersにもgit worktreeスキルがあるが、gtrの方がエディタ統合・ファイルコピー・シェル補完など圧倒的に高機能。並列開発をガチでやるならgtrを使い、Superpowersは「プロセス管理」に専念させるのがベスト。

### 3. 3つを組み合わせると「フライホイール効果」が生まれる

gtrで素早く環境構築 → Superpowersで品質の高い開発プロセス → Boris Tipsで得た知見をCLAUDE.mdに蓄積 → 次回の開発がさらに速くなる。この循環が回り始めると、開発効率が加速度的に上がっていく。

---

## 6. 参考リンク

- **gtr**: https://github.com/coderabbitai/git-worktree-runner
- **Superpowers**: https://github.com/obra/superpowers
- **Boris氏の活用術**: https://howborisusesclaudecode.com/
