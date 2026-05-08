---
date: 2026-05-09 07:23:00
type: work
topic: essence-reviewer-redesign-discussion
session: メイン Claude Code Opus 4.7 (1M context)

related_article: ~/.claude/.docs/references/note-articles/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill:
  - essence-reviewing-harness
  - harness-essentials-reviewer-fork
  - skill-essentials-reviewer-fork
  - ui-essentials-reviewer-fork
  - judging-review-severity
  - llm-debate-reviewer
related_agent:
  - harness-essentials-reviewer
  - skill-essentials-reviewer
  - ui-essentials-reviewer
  - llm-debater-reviewer
  - code-reviewer

related_plan_id: 2026-05-09-essence-reviewing-harness-redesign
related_plan: ~/.claude/.docs/plans/2026-05-09-essence-reviewing-harness-redesign.md
related_log_ids:
  - 2026-05-08_essence-reviewing-harness-implementation
  - 2026-05-08_essence-reviewer-integration-decision
related_log:
  - ~/.claude/.docs/logs/local/2026-05-08_essence-reviewing-harness-implementation.md
  - ~/.claude/.docs/logs/local/2026-05-08_essence-reviewer-integration-decision.md
---

# Essence-Reviewer 内部ロジック最適化議論 + Layer 1+2+3 改修 Plan 作成

> 前 Plan (2026-05-08) で構造構築完了の essence-reviewing-harness について、かもねからの「skills フィールド未設定」「note記事に target.md / git diff の記述なし」「各領域の最適解で構築すべき」という連続指摘を経て、内部ロジック全面最適化の新 Plan (2026-05-09) を作成したセッション。

## 概要

### 経緯

前セッション (2026-05-08) で essence-reviewing-harness を新規構築し、 master skill 1 + fork sub-skill 3 の 4 ファイル (合計 753 行) を作成。subagent 3 体は流用 (改修禁止 memory に従い)。Task #1-#6 完了済、plan archive 済の状態で本セッション開始。

`/pickup` で handoff-state.md から状態復元後、かもねから以下の連続指摘:

1. **skills フィールド未設定**: 既存 essence-reviewer agent 3 体に `skills:` フィールドがない理由は意図的か?
2. **target.md 必須の冗長性**: 評価対象は既存ファイルなのに、なぜ別途 target.md を作る?
3. **note記事の徹底調査要求**: 「note記事の内容全部を reference として、レビューアパターンの方針を判断して」
4. **「git diff フォールバック」の出典問い**: 私が「note記事の精神に整合」と主張したが、本当に note記事に書いてあるか?
5. **「note記事は概念紹介、各領域の最適解で構築」**: 既存 agent 定義の `$ARGUMENTS or git diff` も予想による補完、note準拠で見直すべき
6. **「レビューア = subagent か skill か」**: 私が subagent 3 体で作ったが本当は skill だったのでは?

これらの指摘を受けて議論を重ね、最終的に Layer 1+2+3 全面最適化 Plan を作成。handoff まで実施。

### 結果

- 新 Plan ファイル作成: `~/.claude/.docs/plans/2026-05-09-essence-reviewing-harness-redesign.md` (status: planning)
- handoff-state.md 更新 (2026-05-09T07:15:00+09:00)
- 次セッションで `/pickup` → Phase 2 (Layer 1 改修) 着手の流れ

## 内容

### 1. note記事 PDF 全 32 ページ Read

`/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260504_.../docs/references/sources/pdf/260404_...pdf` を pages 1-20 + 21-40 で全量 Read。

主要セクション:
- page 1-3: 概要、ハーネスエンジニアリング 2 要素 (評価者 + 評価基準)
- page 4-6: 本質ドキュメントの設計思想、領域別 (agent/skill/ui/video-essentials.md)
- page 7-9: 5 原則の本質表
- page 9-12: **レビューアパターンとフィードバックループ** (page 9 に基本構造図、page 11 に複数レビューア + コンテキストフォーク)
- page 12-15: **コンテキストフォークとサブエージェント設計** (page 12-13 に 4 役割表、page 14-15 にマゴエージェント)
- page 16-23: 決定論的制御 vs 確率的制御
- page 24-28: Gotcha セクション、記憶の外部化、Skill Creator の強化
- page 28-30: Q&A
- page 30-32: まとめ

### 2. 「git diff」の出典問題

私が「note記事の精神に沿うと git diff フォールバックが自然」と主張したが、かもねから「git diff についてはnoteのどの箇所に記載されてた?」と問われ、note記事内に「git diff」という具体記述は **無い** ことを認めた。

正しい認識:
- note記事は **抽象的原則** (フィードバックループ・コンテキストフォーク・本質ドキュメント) を提示
- 評価対象の具体的渡し方 (引数 / git diff / 中間ファイル) は note記事に書かれていない
- 「git diff」は既存 agent 定義 (2026-05-07作成) の `$ARGUMENTS or git diff` 由来 = 予想による補完
- 私の論理飛躍: agent 定義の記述と note記事の精神を暗黙に結合して「note由来」と誤認

### 3. レビューア = subagent or skill の確定

かもねからの「subagent で作ってしまったが、本当は skill だったのでは?」という根本問いに対し、note記事 page 12-13 の「サブエージェントの 4 つの役割」表を再読:

```
| 役割              | 何をするか           | なぜ分離するか      | Claude Code の対応機能 |
|-------------------|---------------------|---------------------|------------------------|
| 探索者 (Explorer) | 情報収集・コードサーチ | 不要な情報排除     | Explore agent          |
| 計画者 (Planner)  | オーケストレーション | プロンプト分離     | Plan mode              |
| 実装者 (Executor) | 成果物作成           | 集中               | general-purpose agent  |
| レビューア (Reviewer) | 品質評価・フィードバック | 本質ドキュメント評価 | カスタムスキル ★    |
```

→ note記事は **「レビューア = カスタムスキル」と明示**。

### 4. 用語整理 (note記事 vs Claude Code)

最終的にかもねの整理が note記事 + Claude Code 仕様の両方を満たす解釈:

| 概念 | note記事の用語 | Claude Code の実体 |
|---|---|---|
| メインから分離された実行単位 (役割概念、広義) | **サブエージェント** | (機能セット全般) |
| レビューア役割の実装 = 呼出インターフェース | **カスタムスキル** | **skill** (`context: fork + subagent` 持ち) |
| レビューア役割の実装 = 実体 | (note記事に直接の用語なし、page 14-15「マゴエージェント」相当) | **subagent** (agents/*.md) |

→ note記事「**レビューア = カスタムスキル**」は Claude Code 上では:

```
レビューア = レビューアskill + subagent
              ↑              ↑
              呼出手段        実体
            (context:fork    (agents/〇〇-reviewer.md)
             + subagent)
```

このセットで初めて note記事の「コンテキストフォークで呼び出されるサブエージェント」役割が成立する。

→ 私の現状実装 (`*-fork/SKILL.md` + `agents/*-reviewer.md`) は **完全にこの構造**。維持する。

### 5. Layer 1+2+3 改修方針確定

構造維持 (skill + subagent のセット) を前提に、内部ロジック 3 レイヤーを各領域最適解で再構築:

| Layer | 内容 |
|---|---|
| Layer 1 (評価対象取得) | target.md 廃止、$ARGUMENTS + git diff フォールバック + 領域固有 Glob/grep に変更 |
| Layer 2 (severity rubric 重複解消) | agent から `## 判断軸` セクション削除、`skills: [judging-review-severity]` フィールド追加 |
| Layer 3 (領域固有補助情報注入) | harness/skill/UI 各 fork skill に領域固有の機械シグナル注入 (Glob/grep/wc -l) |

### 6. 改修禁止 memory の再解釈

memory `feedback_no-existing-harness-modification.md` の主旨:
- マルチエージェント協調ハーネス (3 協調 skill) は名指しで改修禁止
- essence-reviewer agent 3 体は **memory の名指し対象ではない**

→ note記事を直接的根拠とする再構築なら、agent 3 体改修は memory 抵触ではないと再解釈。Plan 内に正当化記述済。

### 7. Plan ファイル作成

`~/.claude/.docs/plans/2026-05-09-essence-reviewing-harness-redesign.md` を Write。frontmatter (related_previous_plan / related_memory / related_existing_skills 等) + 本文 (Context / 用語整理 / 3 Layer 改修プラン / memory 再解釈 / ロードマップ / 検証方法 / Open Questions / Reference)。

### 8. handoff 実施

`.claude/handoff-state.md` を 2026-05-09T07:15:00+09:00 で上書き。8 ステップの「次のステップ」を順序付き記述、リスク/注意点に議論で得た知見を反映。

## 設計意図

### なぜ Layer 1+2+3 全面最適化を選んだか

かもねからの「各領域の最適解で構築すべき」という指摘が本質的だった。同一テンプレート機械適用 (3 fork skill が構造的にほぼ同型) は note記事「複数レビューアの活用 (各領域専門)」の精神に反する。

- Layer 1 (評価対象取得): target.md vs $ARGUMENTS の二重実装解消 + 領域別最適化
- Layer 2 (severity rubric): agent 内蔵 vs `judging-review-severity` skill の DRY 違反解消
- Layer 3 (領域固有補助情報): 機械シグナル (default 検出 / Progressive Disclosure 検証 / 依存関係抽出) で各領域の専門性強化

3 つを同時に Plan に含めることで、ハーフ改修による「中途半端な状態」を避ける。

### なぜ構造 (skill + subagent) を維持するか

note記事 page 13「レビューア = カスタムスキル」と page 14-15「マゴエージェント」の両方を Claude Code 仕様で実装するには、**skill (呼出) + subagent (実体)** のセットが必要:

- skill 単体: note記事「カスタムスキル」直接準拠だが、subagent としての再利用性なし
- skill + subagent (現状): note記事構造に整合 + subagent が他 skill から再利用可能 (例: TDD workflow からの呼出)

過剰実装ではなく、note記事 + Claude Code 仕様の現実的統合。

### なぜ次セッションで実装するか

今セッションは議論が長く (note記事 PDF 全 32 ページ Read、5 ラウンドの議論)、コンテキスト豊富。実装は ~2 時間想定で、フレッシュなセッションで集中するのが安全。handoff 経由で永続化。

## 副作用

### 改修禁止 memory の保守的解釈の緩和

前 Plan で「essence-reviewer agent 3 体は流用、改修不可」と決めたが、note記事準拠改修のため再解釈で改修可能とした。Plan 内に正当化記述済 (協調ハーネス系 3 skill は完全無変更、改修対象は essence レビュー専用 agent 3 体のみ)。

memory 自体の更新は本 Plan のスコープ外、次回セッションで必要なら別タスク化。

### 議題ファイル契約 (target.md) 廃止予定

`/Users/camone/.docs/essence-review/CURRENT/target.md` ディレクトリは Phase 2 改修後に不要になる。前 Plan で運用想定だった「かもねが手動配置」フローが廃止される。

### skills フィールド経由の !構文展開動作 (グレー領域)

Plan Open Question Q4: agent 3 体に `skills: [judging-review-severity]` 追加時、agent 起動で skill が事前展開されるか不確定。Phase 3 実装時に試験確認、不安定なら案 B (現状維持) フォールバック。

## 関連ファイル

- 新 Plan: `~/.claude/.docs/plans/2026-05-09-essence-reviewing-harness-redesign.md` — Layer 1+2+3 全面最適化計画
- 前 Plan (archive 済): `~/.claude/.docs/plans/archived/2026-05-08-essence-reviewing-harness.md` — 構造構築 (前セッション完了)
- 前 Plan の実装ログ: `~/.claude/.docs/logs/local/2026-05-08_essence-reviewing-harness-implementation.md` — 構造構築の実装記録
- 前々セッションの判断ログ: `~/.claude/.docs/logs/local/2026-05-08_essence-reviewer-integration-decision.md` — 組込み判断の経緯
- handoff-state.md: `<cwd>/.claude/handoff-state.md` — 2026-05-09T07:15:00+09:00 上書き
- note記事 PDF (プロジェクト): `/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260504_.../.docs/references/sources/pdf/260404_...pdf` — 主出典 (page 12-13 の表 + page 14-15 のマゴエージェント)
- 改修対象 master skill: `~/.claude/skills/essence-reviewing-harness/SKILL.md` (195 行)
- 改修対象 fork skill 3 体: `~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/SKILL.md` (172/182/204 行)
- 改修対象 agent 3 体: `~/.claude/agents/{harness,skill,ui}-essentials-reviewer.md` — 内蔵 severity rubric 削除 + skills フィールド追加対象
- 評価基準 (改修対象外): `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` — 8 原則
- 設計参考 (skills フィールド使用例): `~/.claude/agents/llm-debater-reviewer.md` (`skills: [judging-review-severity]`)
- 設計参考 (fork skill パターン): `~/.claude/skills/llm-debate-reviewer/SKILL.md`
- 改修禁止 memory: `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_no-existing-harness-modification.md` — Plan 内で再解釈
