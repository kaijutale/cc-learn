[Claude Codeのドキュメント](https://code.claude.com/docs/en/memory)

# .claude/rules/ と Agent Skills の違いと使い分け

**公開日:** 2025年12月10日（v2.0.64で.claude/rules/が追加）

**参照ドキュメント:**
- https://code.claude.com/docs/en/memory
- https://code.claude.com/docs/en/skills

---

## 概要

Claude Code v2.0.64で`.claude/rules/`のサポートが追加された。これはAgent Skillsとは異なる目的を持つ機能であり、適切に使い分けることでより効果的にClaudeをカスタマイズできる。

---

## 1. .claude/rules/ とは

### 目的
**指示・ルール・制約**をClaudeに与えるためのモジュール化されたシステム。

### 特徴
- **自動的に常時適用**される
- 大規模プロジェクト向けの**分割管理**が可能
- **パス固有のルール**を設定できる（YAMLフロントマターの`paths:`フィールド）

### 基本構造
```
.claude/rules/
├── code-style.md      # コーディング規約
├── testing.md         # テストのルール
├── security.md        # セキュリティ方針
└── api/
    └── rest-api.md    # API固有のルール
```

### パス固有ルールの例
```yaml
---
paths: src/api/**/*.ts
---
# APIルール
- すべてのエンドポイントにバリデーションを実装する
- エラーレスポンスは統一フォーマットを使用する
```

### グロブパターン対応
- `**/*.ts` - すべてのTypeScriptファイル
- `src/**/*` - srcディレクトリ以下すべて
- `{src,lib}/**/*.ts` - srcまたはlibディレクトリ以下のTS

### 配置場所
| 場所 | 適用範囲 |
|------|----------|
| `./.claude/rules/` | プロジェクト全体（チーム共有） |
| `~/.claude/rules/` | ユーザーの全プロジェクト（個人設定） |

---

## 2. Agent Skills とは

### 目的
**能力・機能**をClaudeに追加するためのモジュール型パッケージ。

### 特徴
- **Claudeが必要に応じて判断して使う**（自律的）
- 手続き的な知識・ワークフローを定義
- コード実行も含められる
- `allowed-tools`でツール制限が可能

### 基本構造
```
.claude/skills/
└── creating-api-endpoint/
    ├── SKILL.md           # 必須：メタデータと手順
    ├── templates/         # オプション：テンプレートファイル
    └── scripts/           # オプション：実行可能スクリプト
```

### SKILL.mdの例
```yaml
---
name: creating-api-endpoint
description: REST APIエンドポイントを作成する。APIを追加したいときに使用。
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
---
# REST APIエンドポイント作成手順

## 手順
1. `routes/`に新しいファイルを作成
2. コントローラーを実装
3. バリデーションを追加
4. テストを書く

## 参照
詳細は `./templates/` を確認
```

### 配置場所
| 場所 | 適用範囲 |
|------|----------|
| `.claude/skills/` | プロジェクトSkill（チーム共有） |
| `~/.claude/skills/` | 個人用Skill（全プロジェクト） |
| プラグイン経由 | プラグインSkill |

---

## 3. 比較表

| 項目 | `.claude/rules/` | Agent Skills |
|------|------------------|--------------|
| **目的** | 指示・ルール・制約を与える | 能力・機能を追加する |
| **起動方法** | 自動的に常時適用 | Claudeが必要に応じて判断 |
| **内容の性質** | 「こうしなさい」というガイドライン | 「こうやってできるよ」という手順書 |
| **パス制限** | `paths:`で特定ファイルにのみ適用可能 | なし |
| **ツール制限** | なし | `allowed-tools`で制限可能 |
| **コード実行** | なし | スクリプトをバンドル可能 |
| **段階的開示** | なし（全て読み込み） | あり（必要に応じて読み込み） |

---

## 4. 使い分けガイド

### `.claude/rules/` を使うべき場面

| ユースケース | 例 |
|-------------|-----|
| コーディング規約を守らせたい | ESLint設定に準拠、命名規則 |
| 特定ディレクトリにだけルールを適用 | `src/api/`にはAPI設計ルール |
| チーム全体で常に適用したいポリシー | セキュリティ方針、ブランチ戦略 |
| CLAUDE.mdが肥大化してきた | 分割してメンテナンス性向上 |

### Agent Skills を使うべき場面

| ユースケース | 例 |
|-------------|-----|
| 複雑なタスクの手順を教えたい | デプロイ手順、環境構築 |
| 繰り返し使うワークフローを定義 | PR作成、コードレビュー |
| セキュリティ制約を設けたい | 読み取り専用Skill |
| 決定論的な処理をさせたい | スクリプト実行 |

---

## 5. 実践的な例

### 例1: コミットメッセージのルール

**rulesとして設定（常に適用したい場合）**
```markdown
# .claude/rules/git-commit.md
---
paths: "**"
---
# Gitコミットメッセージルール
- Conventional Commits形式を使用
- 日本語で記述
- 以下のprefixを使用: feat, fix, docs, style, refactor, test, chore
```

### 例2: Next.jsセットアップ

**Skillとして設定（必要なときだけ使いたい場合）**
```markdown
# .claude/skills/setting-up-nextjs-project/SKILL.md
---
name: setting-up-nextjs-project
description: Next.jsプロジェクトを最新のベストプラクティスでセットアップする。新規プロジェクト作成時に使用。
---
# Next.jsプロジェクトセットアップ

## 手順
1. `npx create-next-app@latest`を実行
2. TypeScript、ESLint、Tailwind CSSを有効化
3. App Routerを使用
4. ...
```

---

## 6. メモリの階層構造

Claude Codeは以下の優先順位でメモリを読み込む：

```
1. Enterprise policy（最高優先度）
   └── 組織全体の指示（IT/DevOps管理）
2. Project memory
   └── ./CLAUDE.md または ./.claude/CLAUDE.md
3. Project rules ← NEW!
   └── ./.claude/rules/*.md
4. User memory
   └── ~/.claude/CLAUDE.md
5. Project memory (local)（最低優先度）
   └── ./CLAUDE.local.md
```

---

## 7. まとめ

- **rules** = 「ルール・制約」を与える（常時適用、パス制限可能）
- **skills** = 「能力・手順」を追加する（必要時に自律的に使用）

どちらも大規模プロジェクトでCLAUDE.mdが肥大化するのを防ぎ、モジュール化された管理を可能にする。目的に応じて適切に使い分けることで、より効果的にClaudeをカスタマイズできる。
