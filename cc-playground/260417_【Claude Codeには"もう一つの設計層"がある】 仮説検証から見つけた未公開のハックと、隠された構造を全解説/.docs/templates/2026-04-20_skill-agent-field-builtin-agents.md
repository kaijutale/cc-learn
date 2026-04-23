---
feature: skill-agent-field-builtin-agents
session: 未設定
date: 2026-04-20 10:50:37
---

# SKILL frontmatter `agent:` フィールドと組み込みエージェントの関係

## 概要

Skill の frontmatter にある `agent:` フィールドで指定可能な値と、組み込みエージェント（`Explore` / `Plan` / `general-purpose`）の関係を整理する学習Q&Aセッション。「読み取り専用エージェントのみ指定可能？」という疑問から出発し、3つの組み込みエージェントの役割分離と `general-purpose` の中立性まで到達した。

## 実装内容

### Q1. skillの `agent:` フィールドに指定できるのは読み取り専用エージェントのみ？

**A. いいえ。以下のすべてが指定可能。**

| 種別 | 例 | 権限 |
|---|---|---|
| 組み込み読み取り専用 | `Explore`, `Plan` | 書き込み不可 |
| 組み込み汎用 | `general-purpose`（デフォルト） | 全ツール可 |
| カスタム | `.claude/agents/*.md` のエージェント名 | agent定義に準拠 |

- `agent:` は `context: fork` とセットで機能する（fork なしだと無視される）
- 未指定時のデフォルト = `general-purpose`
- 実証: `~/.claude/skills/review-harness/SKILL.md:5` が `agent: general-purpose` で、書き込み可能な汎用エージェント使用

### Q2. `general-purpose` に `Explore` と `Plan` は含まれる？

**A. いいえ、3つとも独立した別エージェント。**

環境の組み込みエージェント定義より：

| エージェント | ツール権限 | 用途 |
|---|---|---|
| `Explore` | 全ツール except `Agent, ExitPlanMode, Edit, Write, NotebookEdit` | 高速コードベース探索専用 |
| `Plan` | 全ツール except `Agent, ExitPlanMode, Edit, Write, NotebookEdit` | 実装計画設計専用 |
| `general-purpose` | `*`（全ツール） | 複雑調査・マルチステップタスク汎用 |

`Explore` / `Plan` は Edit/Write/NotebookEdit が除外されている → 読み取り専用として機能。
`general-purpose` は `*` = 全ツール所持 → 書き込み可能。

### Q3. `general-purpose` の意味は？

**A. 汎用目的エージェント。特定役割に最適化されていない万能型。**

公式定義:
> General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks.

- **ツール権限**: `*`（全ツール、制約なし）
- **得意分野**: 複雑調査、コード検索、マルチステップタスク
- **使いどき**: 「最初の数回で正解ファイルが見つかる自信がない」open-ended 探索
- **位置づけ**: 他の専門エージェント（`code-reviewer`, `frontend-developer` 等）がロール焼き込み型なのに対し、`general-purpose` は**役割バイアスなし + 全権限**の白紙エージェント
- `Agent()` 呼び出しで `subagent_type` 省略時のデフォルトになる理由 = 中立で汎用だから

## 設計意図

### skill設計における `agent:` 選択の指針

1. **読み取りのみで十分**な調査系skill → `agent: Explore` を明示
   - **効果**: Claudeが「うっかり Edit/Write 呼ぶ」事故を型レベルで防止
   - **構造的安全保証**: 権限逸脱をagent選択で担保する設計パターン

2. **計画立案のみ**のskill → `agent: Plan`
   - 書き込み禁止＋計画最適化プロンプトの二重効果

3. **書き込み必要**だが親コンテキストは汚したくない → `agent: general-purpose` + `context: fork`
   - 中庸の選択肢。別コンテキストで全権限動作

4. **ドメイン特化**が必要 → カスタム `.claude/agents/*.md` を定義して指定

### 設計原則

- エージェント選択 = **権限の構造的制約** の表明
- 名前の似た `general-purpose` と `Explore/Plan` は「同じ汎用系の権限違いバリアント」ではなく**最初から別エージェント**として定義されている
- `general-purpose` 選択時は全権限ゆえに事故リスクを意識すべき（書き込みを想定していない文脈でも Write できてしまう）

## 副作用

- 今回のQ&Aで `general-purpose` の「全権限」という特性を明文化したことで、今後 skill 作成時に安易に `agent: general-purpose` を選ぶ判断が減る可能性がある。権限を絞る選択肢（`Explore`/`Plan`）を先に検討する判断フローが推奨される。
- カスタムサブエージェント指定時の権限合流ルール（skill側 `allowed-tools` と agent 側ツール権限の優先順位）は公式ドキュメント未明記。実測検証が必要な領域として残る。

## 関連ファイル

- `/Users/camone/.claude/skills/review-harness/SKILL.md` — `agent: general-purpose` 指定の実例
- `/Users/camone/.claude/skills/review-agent-essence/SKILL.md` — 同上
- `/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260417_【Claude Codeには"もう一つの設計層"がある】 仮説検証から見つけた未公開のハックと、隠された構造を全解説/.docs/templates/2026-04-19_skill-subagent-relationship-map.md` — skill/subagent関係マップの先行学習ログ（参照用）
- `/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260417_【Claude Codeには"もう一つの設計層"がある】 仮説検証から見つけた未公開のハックと、隠された構造を全解説/.docs/templates/2026-04-19_skill-preload-vs-invoke-precedence.md` — skill起動経路の先行学習ログ
- 公式ドキュメント: https://code.claude.com/docs/en/skills.md — `agent:` フィールドの一次情報源
