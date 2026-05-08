---
date: 2026-05-08 21:52:21
type: qa
title: Skill の `context: fork` フィールド解説 — 機能・使い方・subagent との関係
status: completed
topic: skill-context-fork-explanation
session: ハーネス&AIエージェントの本質勉強会
related_article: ~/dev/claude-code/claude-code-learn/cc-playground/260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会/.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill:
  - ~/.claude/skills/red-test-fork/SKILL.md
  - ~/.claude/skills/implement-fork/SKILL.md
  - ~/.claude/skills/verify-test-fork/SKILL.md
  - ~/.claude/skills/auditing-aio-fork/SKILL.md
  - ~/.claude/skills/auditing-nextjs-security-fork/SKILL.md
  - ~/.claude/skills/harness-essentials-reviewer-fork/SKILL.md
  - ~/.claude/skills/skill-essentials-reviewer-fork/SKILL.md
  - ~/.claude/skills/ui-essentials-reviewer-fork/SKILL.md
  - ~/.claude/skills/coordination-harness-integrity-fork/SKILL.md
  - ~/.claude/skills/llm-debate/SKILL.md
related_agent:
  - ~/.claude/agents/coder.md
  - ~/.claude/agents/team-tester.md
  - ~/.claude/agents/team-implementer.md
  - ~/.claude/agents/team-auditor.md
related_log:
  - 2026-05-08_essence-reviewing-harness-implementation.md
  - 2026-05-08_about-grandchild-agent-doc.md
---

# Skill の `context: fork` フィールド解説 (Q&A ログ)

> Skill フロントマターの `context: fork` フィールドについての Q&A。`subagent` とのペア使用、verifier-driven workflow での活用、`!構文` との二重ガード構造を整理。

## 概要

「ハーネス&AIエージェントの本質勉強会」セッション内での質問:
> skillsのcontext: forkフィールドについて教えて。どんな機能？どのように使う？subagentフィールドとセットで使うのが基本？

`claude-code-guide` agent に委譲して回答を得た。本ログはその回答を体系的に整理したもの。

## 内容

### Q1. `context: fork` とは何か

Skill フロントマターのフィールドで、**Skill が起動する孫エージェント (subagent) に対して、親セッションの会話履歴・コンテキストを一切引き継がず、フレッシュで独立したコンテキストウィンドウで起動する**ための宣言。

| 側面 | デフォルト (未指定) | `context: fork` |
|------|---------------------|-----------------|
| 親コンテキスト引き継ぎ | あり (会話履歴含む) | なし (ゼロリセット) |
| リソース | 親と同じウィンドウ使用 | 独立した別コンテキスト |
| メモリ・バイアス | 親思考の影響あり | Skill 注入情報のみで判断 |
| 戻り値 | 全コンテキスト含む詳細 | 構造化サマリー |
| メインへの影響 | 親が肥大化リスク | 親は影響なし |

### Q2. 記述形式 (正確な構文)

```yaml
---
name: red-test-fork
description: >
  TDD red phase — coder agent からの明示呼出専用。
  context:fork + subagent:team-tester で RED テスト作成を孫エージェントに委譲する。
context: fork
subagent: team-tester
---
```

**構文ルール**:
- `context: fork` は単独行で記述 (ネスト構造ではない)
- `subagent: <agent-name>` とセットで使用
- フロントマター内の行順は任意 (YAML 解析)

### Q3. `subagent` フィールドとの関係

**ほぼ必ずセット**で使う。理由は `context: fork` 単独だと「フレッシュコンテキストで誰を起動するのか」が決まらないため。

ユーザー環境 (`~/.claude/skills/`) で観測される実装パターン:

| Skill | subagent | 用途 |
|-------|----------|------|
| `red-test-fork` | team-tester | spec → RED テスト作成 (実装影響ゼロ) |
| `implement-fork` | team-implementer | RED → GREEN 実装 (テスト作成影響ゼロ) |
| `verify-test-fork` | team-tester | 実装後のテスト実行判定 (実装バイアスゼロ) |
| `auditing-aio-fork` | team-auditor | AIO 監査 Verdict 出力 |
| `harness-essentials-reviewer-fork` | harness-essentials-reviewer | ハーネス原則照合 |

`context: fork` を**単独で使うケースはほぼない** (誰を起動するか不明なため)。

### Q4. 典型ユースケース

#### a. TDD の Red-Green-Verify サイクル

```
coder agent (親)
  ↓ /red-test-fork (context:fork + subagent:team-tester)
  └─ team-tester (子①、別コンテキスト)
     → spec のみ見てテスト設計、RED で返却
  ↓ /implement-fork (context:fork + subagent:team-implementer)
  └─ team-implementer (子②、別コンテキスト)
     → RED テスト見て最小実装、GREEN で返却
  ↓ /verify-test-fork (context:fork + subagent:team-tester)
  └─ team-tester (子③、子①とは完全別コンテキスト)
     → 実装者思考ゼロでテスト実行、PASS/FAIL 判定のみ
```

**core benefit**: 各フェーズで前フェーズの思考に汚染されない。`team-tester` を 2 度使っても全く別コンテキストで起動 (red 作成時と verify 実行時は視点が独立)。

#### b. Audit (監査) 領域での活用

```
orchestrator (親、「修正しよう」思考あり)
  ↓ auditing-aio-fork (context:fork + subagent:team-auditor)
  └─ team-auditor (別コンテキスト)
     → 修正方針を見ずに純粋に rule 判定
     → Verdict (GO/NO-GO/CONDITIONAL) 出力
```

#### c. Essence Review (設計原則審査)

```
essence-reviewing-harness (master skill、親)
  ├─ harness-essentials-reviewer-fork → harness-essentials-reviewer (別コンテキスト)
  ├─ skill-essentials-reviewer-fork → skill-essentials-reviewer (別コンテキスト)
  └─ ui-essentials-reviewer-fork → ui-essentials-reviewer (別コンテキスト)
```

3 レビュアーが互いの意見に影響されず、各々独立して原則照合を実施。

### Q5. `!構文` と fork のシナジー (二重ガード)

`!` 接頭辞付きシェルコマンドは Skill 読込時に実行され、出力が Skill 本文に展開される:

```markdown
### spec 内容
!`cat .docs/specs/CURRENT/spec.md`

### 既存テストファイルリスト
!`find src -maxdepth 8 -type f -name "*.test.ts"`
```

**fork + !構文の連携**:
1. Skill 読込時 (fork 前) に `!構文` が情報を Skill 本文に注入
2. fork で子エージェントを別コンテキスト起動
3. 子は Skill 本文の注入情報のみ参照 (親の会話履歴は見えない)

→ 親依存の論理的排除 (`!構文`) と物理的隔離 (`fork`) の二重ガード。

### Q6. 注意点・落とし穴

#### a. 「明示呼出専用」「description マッチ自動誘発なし」

多くの fork skill には:
> description マッチによる自動誘発は想定しない (coder.md の workflow 内からのみ起動)

**理由**: fork skill は親エージェント内の workflow 制御構造の一部。casual な description マッチで勝手に fork されると親コンテキストの制御が失われる。

#### b. fork 子エージェントの権限制限

子 (team-tester, team-implementer 等) は意図的に:
- `skills: []` 空 (更なる孫呼出禁止)
- `tools: Read/Write/Edit/Bash/Grep/Glob` のみ (Skill tool 非装備)

**目的**: 無限再帰防止、責務明確化。

#### c. 出力フォーマットの軽量化

fork 子の戻り値は要約形式:

```
[RED Complete] feature-name
Framework: vitest
Test file: src/__tests__/feature.test.ts
RED count: 8
All RED: ✅
Failure reason check: ✅
```

理由: 親が孫コンテキストの会話履歴を受け取らない (fork の性質)。親が判断に必要な情報は構造化サマリーのみ。

## 設計意図

`context: fork` は単なるパフォーマンス機能ではなく、**マルチエージェント協調における認知バイアス排除の物理的実装**。

3 つの「fork が大事な理由」:

1. **認知バイアス排除 (Verification Integrity)**: RED → GREEN → Verify サイクルで、実装者の「通るはずという期待」が verify 判定を甘くする問題を物理的に排除
2. **コンテキストウィンドウ効率化 (Token Management)**: 並行した複数フェーズの作業 (red・implement・verify の 3 並列等) で親の肥大化を防ぐ
3. **責務の物理的隔離 (Separation of Concerns)**: 子の Edit/Write 権限制限、Skill tool 非装備により「誰が何をするか」が SKILL.md + agent 定義で明示される

## 副作用

- fork 子は親の会話履歴を一切見ないため、**Skill 本文に必要情報を全て !構文で注入する設計**が必須。これを怠ると子が情報不足で動けない
- fork 子の戻り値が要約のみなので、親が「詳細を見たい」場合は子に結果ファイルを書き出させ、親が `!cat result.md` で再注入する迂回パターンが必要

## 関連ファイル

- `~/.claude/skills/red-test-fork/SKILL.md` — TDD red phase の典型的 fork skill 実装例
- `~/.claude/skills/essence-reviewing-harness/SKILL.md` — master skill から複数 fork を並列起動するパターン
- `~/.claude/agents/coder.md` — fork skill を順序通りに呼び出す親 agent (workflow 制御の実例)
- `~/.claude/agents/team-tester.md` — fork で起動される子エージェント側の権限制限実装 (`skills: []`, `tools` 限定)
- `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — 元記事 PDF
- `.docs/logs/shared/2026-05-08_essence-reviewing-harness-implementation.md` — 並列 fork による essence review 実装ログ

## 重要発見

- **同じ subagent (team-tester) を 2 回使っても別コンテキストになる** → red 作成と verify 判定で視点独立性が成立する設計の核心
- **fork は記事には明示されていないが、Anthropic 公式 Skill 仕様の拡張機能**。description マッチを意図的に切ることで「呼出箇所の制御権を親に握らせる」点が運用知
- `context: fork` 単独使用ケースはほぼない (subagent とのペアが事実上必須) という運用上の同義性

## 結論

`context: fork` は「**孫エージェントを親コンテキストから物理隔離して起動する宣言**」で、`subagent` とのペア使用が基本パターン。verifier-driven workflow (TDD・audit・essence review 等) で**認知バイアス排除**と**責務物理隔離**を実現する。`!構文` で親依存を論理的に排除しつつ `fork` で物理隔離する二重ガード構造が、本ハーネス設計の肝になっている。
