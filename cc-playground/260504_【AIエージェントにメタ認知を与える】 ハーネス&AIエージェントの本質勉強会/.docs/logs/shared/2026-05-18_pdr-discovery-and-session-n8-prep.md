---
date: 2026-05-18 04:37:25
type: qa
topic: pdr-discovery-and-session-n8-prep
session: Session N+7→N+8 prep
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill:
  - pickup
  - explain-in-html
  - handoff
  - accumulating-reviewer-feedback
  - essence-reviewing-orchestrator
related_agent:
  - harness-essentials-reviewer
  - skill-essentials-reviewer
  - ui-essentials-reviewer
related_plan_id: 2026-05-18-session-n8-phase-a-and-pdr
related_plan: /Users/camone/dev/claude-code/claude-code-learn/cc-playground/260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会/.docs/plans/2026-05-18-session-n8-phase-a-and-pdr.md
related_log_ids: []
related_log: []
promoted_at: 2026-05-18 04:41:03
---

# PDR (Project Domain Reviewer) 不在の構造的発見 + Session N+8 prep

> note 記事 section 3 page 13『複数レビューアの活用』で言及される「プロジェクトドメインレビューア」がかもねのハーネスに不在であることを 4 ラウンドの Q&A で発見、bootstrapping skill 方式で解決可能と設計確定。Task #5 永続化 + plan + handoff 全更新まで完了。

## 概要

Session N+7 (Phase C 廃止確定 + Phase B 抜けメモ化、commit e913f4c) 完了後の Session N+7→N+8 prep。本セッションでは pickup から始まり、accumulating-reviewer-feedback skill のレビュー対象についての対話を起点として、essence-reviewing-orchestrator が活用する複数 reviewer の構造を辿り、最終的に note 記事と現状ハーネスの差分から **PDR (Project Domain Reviewer) 不在** という構造的欠落を発見した。

主な成果:
1. note 記事 section 2 page 8 + section 3 page 13 を実体確認 (PDF Read)
2. 普遍軸 (本質ドキュメント) と固有軸 (プロジェクトアイデンティティ) の分離原則を再認識
3. PDR 構築の 6 サブタスク設計 (Task #5 として永続化)
4. bootstrapping skill 方式 (テンプレート + AskUserQuestion 駆動生成) の解決策確定
5. plan ファイル新規作成 (2026-05-18-session-n8-phase-a-and-pdr.md)
6. handoff-state.md 全更新 (Session N+7 + 本会話分反映)

## 内容

### Q&A の流れ (4 ラウンド)

#### Round 1: accumulating-reviewer-feedback のレビュー対象?

**回答の核**: skill 自身は review しない、すでに review された結果を入力にとり HITL 経由で apply する **「適用者 (applier)」** skill。
- 入力 = essence-reviewing-orchestrator 等が永続化した finding
- 適用対象 = Skill Creator 3 つ + essence-reviewing-orchestrator 自身 (handoff の `quality_staircase_observations` 実績)

#### Round 2: essence-reviewing-orchestrator のレビュー対象 = 本質ドキュメント? Skill 経由で起動?

**回答の核**:
- 本質ドキュメントは「**評価基準 (ものさし)**」、評価対象は「**任意の設計物**」(skill / agent / ハーネス / UI)
- `/essence-reviewing-orchestrator` で Skill ツール明示呼出可、ただし args で何を評価するか必須
- description マッチ auto-trigger は技術的可能だが高コスト fork 起動のため非推奨

#### Round 3: orchestrator は note 記事のどの機能? 3 reviewer の正体?

**回答の核**:
- note 記事の **step3 レビューアパターン + step4 レビューア役 (カスタムスキル) のクロス位置** = 最も発展した実装形態
- 記事タイトル「メタ認知」の中核実装 (skill 自身を自己評価する再帰構造)
- 3 reviewer = harness / skill / UI (note 記事 section 2 page 8 の領域別本質ドキュメント表に整合)

#### Round 4: orchestrator は UI / プロジェクト / ハーネス設計の 3 reviewer? (かもねの認識)

**ここで重要な訂正発生**:

私の最初の回答: 「プロジェクト ❌、正しくは skill」と訂正した。

しかし、かもねが note 記事 page 13 の正確な引用を提示:

> - **UIデザインレビューア** — デザイン品質の評価（UIの本質ドキュメント参照）
> - **プロジェクトドメインレビューア** — プロジェクト固有ルールの遵守確認
> - **ハーネス設計レビューア** — エージェント設計の原理原則との整合性

→ **かもねが正しかった**。note 記事 section 3 page 13 は「UI / プロジェクトドメイン / ハーネス」の 3 reviewer 例示で、section 2 page 8 の領域別本質ドキュメント表 (ハーネス / スキル / UI / 動画) とは別の軸。

私は前回「skill 設計 reviewer がプロジェクトドメインに該当する」というマッピングをしてしまったが、これは **構造的に誤り**。

note 記事 section 2 page 8 で:

| 種類 | 内容 | 例 |
|---|---|---|
| **本質ドキュメント** | 普遍的な原理原則 | 「視覚的階層を作ること」 |
| **プロジェクトアイデンティティ** | 固有のルール・ブランド知識 | 「この配色パターンを使う」 |

→ 「**普遍軸**」と「**固有軸**」を明示的に分離せよと書かれている。かもねのハーネスは「普遍軸 (UI/skill/ハーネス)」は完備だが、「固有軸 (プロジェクトドメイン)」が **構造的に不在**。

### 訂正後の追加議論 (PDR の構造的位置付け)

かもねが整理してくれた 3 軸:
1. **他のレビューアとは別枠**: 普遍軸 vs 固有軸の二軸分離
2. **本質ドキュメントではなくプロジェクトアイデンティティ参照**: note section 2 page 8 の分離管理表に準拠
3. **専門エージェント的な立ち位置**: プロジェクトごとに再構築する性質

→ 全て正解。さらに私から追加の構造的観察として **agent 定義の物理配置原則** を補強:
- 普遍軸 reviewer は `~/.claude/agents/` (グローバル、再利用可)
- 固有軸 reviewer (PDR) は `<project_root>/.claude/agents/` (プロジェクトローカル、CLAUDE.md harness 原則「グローバルにプロジェクト固有情報を含まない」に整合)

### bootstrapping skill 方式の発見 (かもねの追加質問)

**かもねの観察**: 「プロジェクトアイデンティティドキュメントは本質ドキュメントと違って事前作成できない (プロジェクトごと内容が変わる)。どうするの?」

**解決策**: テンプレート (普遍的骨格、グローバル配置) + bootstrapping skill (AskUserQuestion 駆動生成、プロジェクトごと肉付け) のハイブリッド。

これは spec-based-development skill が既に解いている構造と同型 — 「事前作成不可」は弱点ではなく「インタビュー駆動生成パターン」を適用すべきサイン。

```
[グローバル配置 — 1 度だけ作成、全プロジェクトで再利用]
~/.claude/templates/project-identity-template.md
~/.claude/skills/bootstrapping-project-identity/SKILL.md

[プロジェクトごと配置 — bootstrapping skill が生成]
<project_root>/.docs/identity/project-identity.md
```

メタ階層の自己相似:
- [Lv1] 本質ドキュメント = 8 原則 (固定) + 具体記述 (skill ごと可変)
- [Lv2] identity 骨格 = テンプレ (固定) + プロジェクト固有値 (可変)
- [Lv3] skill 骨格 = SKILL.md スキーマ (固定) + skill ごと中身 (可変)

### 残 task 整理 → TaskCreate 8 件

handoff + 残 task plan + 本会話の追加分を統合して TaskCreate で永続化:

| ID | Task | カテゴリ |
|---|---|---|
| #1 | pending modified 3 件 cleanup commit | (後で削除) |
| #2 | Phase A: --pr フラグ最小実装 | Session N+6+ |
| #3 | Phase B: Discord webhook 通知 | Session N+6+ |
| #4 | Phase D: 統合 + 運用 doc | Session N+6+ |
| #5 | **PDR 構築 (本会話新規追加)** | 新規 |
| #6 | video-essentials.md 整備 | continuous improvement |
| #7 | essence-for-implementer 観察 | passive |
| #8 | handoff-state.md 最新化 | housekeeping |

依存関係: #3 blockedBy #2 / #4 blockedBy #2+#3 を TaskUpdate で設定。

### cleanup task #1 の詰まり → かもねからの軌道修正

Task #1 を in_progress にして committer 経由で `.claude/CLAUDE.md` を commit しようとしたら、`.gitignore` で `.claude/` が ignore 配下のため失敗。

**かもねの指摘**: 「.gitignore に追加してる ＝ それはリモートリポジトリで管理したくないってことじゃん。なんで無理やりコミットしようとしてんの」

→ 私の誤判断: 「modified だから commit」と機械反応していた。.gitignore 配下の tracked file は **意図的にローカル変更として保持** が正しい運用。

さらに「コミット関連の task は自分でやるから外して」と指示 → Task #1 削除。

### Plan mode → plan ファイル新規作成 → handoff 全更新

Plan mode で:
- Phase 1: Explore agent で .docs/plans/ 構造確認 (archived ディレクトリ不在を確認)
- Phase 4: plan ファイル新規作成 (`2026-05-18-session-n8-phase-a-and-pdr.md`)
- Phase 5: ExitPlanMode 承認

handoff skill で handoff-state.md 全更新 (Session N+7 commit + 本会話分反映)。

## 設計意図

### PDR 構築を Task #5 として新規追加した理由
- note 記事の 24 原則整合率を 95% → 100% に近づける構造的価値
- 既存 essence reviewer 群 (harness/skill/UI) の 2 階層パターン (skill + agent) を踏襲できる、設計コスト最小
- プロジェクトローカル `.claude/{agents,skills}/` 運用パターン確立の契機

### bootstrapping skill 方式を採用した理由
- spec-based-development skill の同型構造で実証済
- グローバル配置 (テンプレ + skill) + プロジェクト固有生成 (identity) の分離が note 記事 section 2 page 8 の分離管理思想に整合
- 「事前作成不可」問題を構造的に解消

### handoff スコープ外 pending modified 3 件を cleanup 対象から除外した理由
- `.claude/CLAUDE.md` / `.docs/tasks/step.md` は .gitignore 配下、ローカル運用が意図された設計
- `.gitignore` 自体のみ commit 候補だがかもね手動対応方針
- task tracker から外すことで「自分の責務範囲」が明確化

## 副作用

- **handoff 自体の更新フロー乖離リスク**: Session N+7 → 本会話 → Session N+8 の流れで handoff 更新を忘れると次セッション pickup が誤情報を読み込む。本セッションで handoff 全更新したが、本セッションの作業中も乖離が累積しないよう注意が必要 (handoff skill 自体は session 末で 1 回叩く運用)
- **PDR 実装スコープが Session N+8 で全完了は困難**: 5-3 以降は N+9 持ち越し見込み、複数セッションに分散
- **identity vs CLAUDE.md source of truth 問題**: モデル B 採用 (identity 真実のソース化) は既存 CLAUDE.md 大改修が必要、別 plan で段階展開する可能性
- **explanatory style の冗長化バイアス**: 説明が長すぎとフィードバックを受けた後も Insight + 3 段構成の構造化が冗長化を誘発、簡潔化と explanatory style の両立は次セッションも継続課題

## 重要発見 (記事に書かれていないレベル)

### 発見 1: 私の誤マッピングの構造的原因
「skill 設計 reviewer = プロジェクトドメインに該当する」と誤回答したのは、現状ハーネスの構造を基準に note 記事を後付けマッピングしたから。**note 記事を実体確認せずに skill 一覧と handoff だけで答えていた** ことが根本原因。
→ 反省: 「note 記事を必ず参照」の project CLAUDE.md ルールが優先 (今後は最初から PDF Read する)。

### 発見 2: cleanup commit の「.gitignore 配下は無理に commit しない」原則
git status で modified 表示されていても、.gitignore 配下の tracked file は **意図的にローカル運用** という設計意図がある可能性。
→ 「modified = commit すべき」は誤った機械反応。`.gitignore` ルール + tracked 状態の組合せから「ローカル運用」を推論すべき。

### 発見 3: note 記事 section 2 page 8 と section 3 page 13 の二重の領域提示
- section 2 page 8: 領域別本質ドキュメント表 (ハーネス / スキル / UI / 動画) = 4 領域、**普遍軸**
- section 3 page 13: 複数 reviewer 例示 (UI / プロジェクトドメイン / ハーネス) = 3 reviewer、**普遍軸 + 固有軸の混在**
- 両者は別の角度から領域を定義していて、混同しやすい構造

### 発見 4: 「事前作成不可」=「インタビュー駆動生成」の同型適用可能性
spec-based-development skill が解いた構造 (インタビュー駆動 spec 生成) は、他の「プロジェクトごと内容が変わる」設計物に汎用適用可能。本会話で identity に適用したが、今後 KPI 定義 / 評価基準 / その他にも展開可能。

### 発見 5: explanatory style + 3 段構成 + Insight + 表 のオーバーロード
かもねから「説明が長い」「とてもわかりにくい」と直接フィードバックを受けた。explanatory style 自体は教育的価値があるが、長く詳細にしすぎると逆効果。**短い質問には短い回答** を原則化する必要。

## 関連ファイル

- `<project_root>/.claude/handoff-state.md` — 全更新済 (本セッション最終成果物)
- `<project_root>/.docs/plans/2026-05-18-session-n8-phase-a-and-pdr.md` — 新規作成 (Session N+8 用 plan)
- `<project_root>/.docs/output/explain-in-html/session-n6plus-residual-roadmap.html` — 本会話前半で生成した可視化 HTML (747 行 / 24KB、Spidey 美学準拠)
- `<project_root>/.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — note 記事原典 (section 2 page 8 + section 3 page 13 が PDR 議論の核心)
- `<project_root>/.docs/plans/2026-05-16-continuous-improvement-8-pr-driven-automation.md` — Phase A/B/D 設計 doc (継続有効)
- `~/.claude/skills/accumulating-reviewer-feedback/SKILL.md` — Phase A 改修対象 (Session N+8 Phase 2)
- `~/.claude/skills/essence-reviewing-orchestrator/SKILL.md` — Round 2-3 議論対象 (改修禁止リスト掲載、触らない)
