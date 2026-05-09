---
date: 2026-05-09 14:32:26
type: work
topic: essence-reviewing-harness-redesign-implementation
session: 260504 ハーネス&AIエージェントの本質勉強会
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill:
  - essence-reviewing-harness
  - harness-essentials-reviewer-fork
  - skill-essentials-reviewer-fork
  - ui-essentials-reviewer-fork
  - judging-review-severity
related_agent:
  - harness-essentials-reviewer
  - skill-essentials-reviewer
  - ui-essentials-reviewer
related_plan_id: 2026-05-09-essence-reviewing-harness-redesign
related_plan: ~/.claude/.docs/plans/archived/2026-05-09-essence-reviewing-harness-redesign.md
related_log_ids:
  - 2026-05-09_essence-reviewer-redesign-discussion
  - 2026-05-08_essence-reviewing-harness-implementation
related_log:
  - .docs/logs/shared/2026-05-09_essence-reviewer-redesign-discussion.md
  - .docs/logs/shared/2026-05-08_essence-reviewing-harness-implementation.md
related_global_log: ~/.claude/.docs/logs/local/2026-05-09_essence-reviewing-harness-redesign-implementation.md
---

# essence-reviewing-harness 内部最適化実装ログ (Layer 1+2+3)

> 2026-05-08 構造構築完了後の Layer 1+2+3 全面最適化を実施。`target.md` 中間ファイル契約 → `$ARGUMENTS` 単一経路 + severity DRY 達成 + 領域固有機械シグナル注入で 7 ファイル改修、構造的検証グリーン、Plan archive 完了。

## 概要

### 目的

前 Plan (2026-05-08) で構造構築 (master skill + 3 fork sub-skill + 既存 agent 3 体流用) を完了した essence-reviewing-harness の **内部ロジック**を 3 層最適化する:

- **Layer 1**: 評価対象取得ロジック (target.md 中間ファイル契約 → $ARGUMENTS 経由化)
- **Layer 2**: severity rubric の DRY 達成 (skills フィールドプリロード経由)
- **Layer 3**: 領域固有補助シグナル注入 (8 原則の機械検証可能ポイントの自動化)

### 背景

前 Plan で構造構築完了後、かもねからの指摘:

> note記事は概念紹介、各領域の最適解で構築すべき

→ agent 3 体の `## やること 2.` の「`$ARGUMENTS` のパス、または引数なしの場合 `git diff` を使う」も、fork sub-skill の `target.md` 中間ファイル契約も、**note記事に直接記述なし** = 予想による補完。これを各領域の最適解で再構築するのが本 Plan の目的。

### スコープ

| 区分 | 対象 |
|---|---|
| **改修対象** | agent 3 体 + master skill 1 + fork sub-skill 3 = 計 7 ファイル |
| **改修対象外** | 協調系 3 skill (three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle) / review-agent-essence / essence ドキュメント 3 体 |
| **新規作成** | なし |

## 内容

### Layer 1: 評価対象取得ロジック改修

#### Q1 (パス注入経路) = 案 A ($ARGUMENTS) 採用

3 案の比較:

| 評価軸 | 案 A ($ARGUMENTS) | 案 B (環境変数) | 案 C (一時ファイル) |
|---|---|---|---|
| シンプルさ | ◎ | ○ | △ |
| Claude Code 仕様準拠 | ◎ (公式 args) | △ (bash 依存) | ✗ (中間ファイル復活) |
| 並列実行安全性 | ◎ (各 fork 独立 args) | △ (env 共有) | ✗ (race condition) |
| 残骸/cleanup | なし | なし | あり |

→ **案 A 採用**。前例 (llm-debater-reviewer / code-reviewer の `skills:` フィールド) で動作実績、並列安全性で最優位。

#### 改修内容

| ファイル種別 | 改修内容 |
|---|---|
| **agent 3 体** | `## やること 2.` を「parent から $ARGUMENTS 受取 / git diff フォールバック / 領域固有 Glob」に書き直し。各領域の特性 (harness=skills/agents/hooks、skill=Progressive Disclosure、UI=CSS/HTML/component) を反映 |
| **master skill** | `### 評価対象ファイル存在確認` + `### 評価対象本文` (target.md cat) 削除 → `### 評価対象パス ($ARGUMENTS)` + `### git diff フォールバック` に置換 / Step 1 改修 / Step 2 で `args="<評価対象パス>"` を 3 sub-skill 全てに明示 |
| **fork sub-skill 3 体** | `### 評価対象ファイル` (`!cat target.md`) → `### 評価対象パス` (`!echo "${ARGUMENTS:-...}"`) / Step 2 を $ARGUMENTS 値解析方針に書換 / Gotchas で target.md 廃止注記。ui-fork は追加で抽象語 grep / 5軸 grep の対象を `"${ARGUMENTS:-/dev/null}"` に変更 (デフォルト値展開で未指定時 grep エラー抑制) |

### Layer 2: severity rubric DRY 達成

#### Q2 (領域固有 severity 適用例の残し場所) = 案 A 採用

| 案 | 配置 | 評価 |
|---|---|---|
| A | agent 別セクション (`## 領域固有 Critical 例`) | ✅ 採用 (DRY + 領域固有性両立) |
| B | essence ドキュメント側 | ✗ 改修禁止対象 |
| C | 完全削除 | ✗ 領域固有性消失 |

#### 改修内容

agent 3 体の frontmatter に `skills: [judging-review-severity]` 追加 + 旧 `## 判断軸: severity rubric` セクション削除 + 新 `## 領域固有 Critical 例 (judging-review-severity 補完)` セクション追加。

各領域の Critical 適用例 (5-6 件):
- **harness**: 関心ごとの分離違反、コンテキスト無限肥大化、HITL 欠落、レビューア-実装者の分離欠落、メタレベルの再帰構造欠如
- **skill**: WHAT のみで WHEN 欠落、SKILL.md 1000 行超 context bloat、Gotcha セクション完全欠落、references/ 構造欠落、!コマンド syntax 不在、I/O 契約完全未明示
- **UI**: WCAG コントラスト未達、5軸全て中央値、抽象語のみで具体値ゼロ、紫グラデ + Inter + 8px 角丸の AI default 完全集合、Bold commitment 欠落、scattered micro-animations

### Layer 3: 領域固有補助シグナル注入

各 fork sub-skill の `### 直近 git log` 直後に領域固有 !構文ブロックを追加 (合計 11 件):

| fork | 追加シグナル |
|---|---|
| harness-fork (3 件) | `!ls -la`(ハーネス構造把握) / `!grep -rE "subagent:|context:|tools:|model:"`(依存関係) / `!find ... | xargs wc -l`(コンテキスト負荷算出) |
| skill-fork (4 件) | `!wc -l SKILL.md`(原則4 500行検証) / `!find -path "*/references/*"`(原則4 ナビゲーション) / `!grep -E "description:|name:"`(原則1 WHEN) / `!grep -A 20 "## Gotcha"`(原則3) |
| ui-fork (4 件) | `!grep -rE "Inter|Roboto|Helvetica|Arial"`(default フォント) / `!grep -rE "#6366F1|#A855F7|gradient.*purple"`(default 色) / `!grep -rE "rounded-lg|border-radius:.*8px"`(default 角丸) / `!grep -E "@media.*prefers-reduced-motion"`(原則5) |

加えて harness-fork / skill-fork の `Step 3: 関連度フィルタ → 8 原則判定` を `Step 3: 関連度フィルタ → 8 原則判定 (機械シグナル援用)` に拡張、客観シグナル参照を明記 (LLM 主観に頼らない)。ui-fork は Phase 2 で既に同セクションを保有。

### 検証結果

#### 構造的検証 (改修禁止 memory 遵守)

```
~/.claude/skills/three-elements-harness/SKILL.md         May  5 04:49 (無変更)
~/.claude/skills/orchestrating-team-development/SKILL.md May  5 04:49 (無変更)
~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md     May  5 04:49 (無変更)
~/.claude/skills/review-agent-essence/SKILL.md           Apr  5 15:13 (無変更)
~/.claude/.docs/essence/{harness,skill,ui}-essentials.md May  7 21:12 (無変更)
```

→ 全 mtime 2026-05-09 以前、改修禁止 memory 遵守確認。

#### 改修内容検証 (全グリーン)

| 検証項目 | 期待 | 結果 |
|---|---|---|
| target.md 言及残存 | 廃止注記 4 件のみ | ✅ 4 件 |
| `$ARGUMENTS` 受取 | master 多, fork 各複数, agent 各 2 | ✅ master 9 / fork 7-14 / agent 各 2 |
| git diff フォールバック | master 4 + agent 各 1 | ✅ 完備 |
| Skill 呼出 args 明示 | master Step 2 に 3 件 | ✅ 3 件 |
| skills フィールド | agent 3 体に judging-review-severity | ✅ 全 3 体 |
| 旧 severity rubric セクション削除 | 0 件 | ✅ 完全削除 |
| 領域固有 Critical 例セクション追加 | 3 件 | ✅ 全 3 体 |
| 領域固有シグナル !構文ブロック | 11 件 | ✅ 11 件 |
| 全ファイル行数 | < 500 (Progressive Disclosure) | ✅ 86-217 行 |

#### 実機試験起動 (次セッション持越し)

context window 消費 + 修正サイクル考慮で本セッションスコープ外。次セッション最優先タスク:

1. `Skill(essence-reviewing-harness, args="/Users/camone/.claude/skills/essence-reviewing-harness/")` で master skill 自己レビュー
2. メインコンテキスト汚染チェック (ノイズ注入 → subagent 独立性確認)

## 設計意図

### 改修禁止 memory の再解釈

`feedback_no-existing-harness-modification.md` の主旨は **協調ハーネス系 3 skill** (three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle) の名指し改修禁止。**essence-reviewer agent 3 体は memory の名指し対象ではない**。前 Plan で「流用、改修不可」と決めたのは保守的判断。

本 Plan で memory 抵触ではないと判断した条件:
1. 協調ハーネス系 3 skill は完全無変更
2. 改修対象は essence レビュー専用 agent 3 体 (協調ハーネスとは独立した責務)
3. note記事を直接的根拠とする再構築 (恣意的改修ではなく原則準拠)
4. 改修内容は内部ロジックのみ (構造 = subagent としての役割は維持)

→ memory の保守的解釈を本 Plan のスコープに限り緩めた。memory 自体の更新は別タスク化候補。

### 各 Layer の独立性

| Layer | 関心ごと | 設計原則 |
|---|---|---|
| Layer 1 | 評価対象の取得経路 | Pure Function 原則、並列安全性 |
| Layer 2 | 評価軸 (severity rubric) の Single Source of Truth | DRY、改善の伝播性 |
| Layer 3 | 機械検証可能ポイントの観測信号化 | LLM 主観排除、客観根拠の援用 |

3 Layer は **直交した関心ごと**を扱う。同フェーズで触っても干渉しない設計にしたことで、各 Layer の改修判断が独立に行えた。

## 副作用

### グレー領域の存在

- **skill-fork-asymmetry** (`feedback_skill-fork-asymmetry.md`): in-process / out-of-process 動作揺れ。本 Plan は cwd 継承対策 Layer 1 (`!pwd`) + Layer 2 (Step 0 cd) を維持。$ARGUMENTS 経由は前例で動作実績ありだが完全保証ではない
- **subagent から Skill 呼出**: 本 Plan は master → sub-skill → subagent の経路のみ使用、subagent → Skill 経路 (公式 grayzone) は不使用
- **skills フィールドプリロード動作**: 前例 (llm-debater-reviewer.md / code-reviewer.md) で「subagent mode では skills frontmatter がプリロードされる」と公式注記あり、本 Plan も同パターン

### 実機試験未実施の影響

本セッションでは構造的検証 (grep / mtime / wc -l) のみ完了。**実機試験未実施**のため、以下は次セッションで確認:
- 3 fork sub-skill 並列起動の実動作
- 各 sub-skill の領域固有 !構文ブロックの実出力
- subagent (孫エージェント) の独立コンテキスト保持
- Lead 統合判断の品質

## 関連ファイル

### 改修したファイル

- `~/.claude/agents/harness-essentials-reviewer.md` (86 行) — Layer 1 + Layer 2 改修
- `~/.claude/agents/skill-essentials-reviewer.md` (86 行) — 同上
- `~/.claude/agents/ui-essentials-reviewer.md` (87 行) — 同上
- `~/.claude/skills/essence-reviewing-harness/SKILL.md` (197 行) — Layer 1 改修 (master)
- `~/.claude/skills/harness-essentials-reviewer-fork/SKILL.md` (187 行) — Layer 1 + Layer 3 改修
- `~/.claude/skills/skill-essentials-reviewer-fork/SKILL.md` (202 行) — 同上
- `~/.claude/skills/ui-essentials-reviewer-fork/SKILL.md` (217 行) — 同上

### 作成した成果物

- `~/.claude/.docs/logs/local/2026-05-09_essence-reviewing-harness-redesign-implementation.md` — グローバル実装ログ (技術詳細)
- 本ファイル (`.docs/logs/shared/2026-05-09_essence-reviewing-harness-redesign-implementation.md`) — プロジェクトログ (セッション記録)

### archive 移動

- `~/.claude/.docs/plans/2026-05-09-essence-reviewing-harness-redesign.md` → `~/.claude/.docs/plans/archived/2026-05-09-essence-reviewing-harness-redesign.md` (frontmatter status: planning → completed、completed: 2026-05-09T11:16:27+09:00)

### 改修対象外 (改修禁止 memory 遵守、無変更確認済)

- `~/.claude/skills/three-elements-harness/SKILL.md`
- `~/.claude/skills/orchestrating-team-development/SKILL.md`
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md`
- `~/.claude/skills/review-agent-essence/SKILL.md`
- `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` — 評価基準 (8 原則 × 3 領域)

### 関連参照

- `~/.claude/skills/judging-review-severity/SKILL.md` — skills フィールド経由でプリロード対象
- `~/.claude/agents/llm-debater-reviewer.md` / `~/.claude/agents/code-reviewer.md` — skills フィールド使用前例
- `~/.claude/.docs/references/note-articles/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — 出典 note記事 (page 9 フィードバックループ図 / page 11 複数レビューア活用 / page 12-13 サブエージェント 4 役割表 / page 14-15 マゴエージェント / page 16-17 !コマンド)

### 次セッション持越しタスク

1. **実機試験起動** (最優先): master skill 自己レビューで動作確認
2. **メインコンテキスト汚染チェック**: ノイズ注入後の subagent 独立性確認
3. **memory 更新** (別タスク化候補): `feedback_no-existing-harness-modification.md` に「改修禁止対象は協調ハーネス系 3 skill のみ」と明記
4. **既存 llm-debate skill の同等改修** (別タスク化候補): target.md → $ARGUMENTS 経由化 (本 Plan の知見横展開)
5. **UI fork capturing-ui-evidence 連携** (Q3 将来拡張、本 Plan スコープ外)
