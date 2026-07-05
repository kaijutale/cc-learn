---
date: 2026-07-05 13:54:43
type: qa
topic: restartable-handoff-adr-lifecycle-qa
session: K-1.1 Restartable Handoff / ADR ライフサイクル
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/
related_skill: [handoff, pickup, orchestrating-team-development, establishing-knowledge-persistence, logging]
related_log_ids: [2026-06-30_good-plan-5elements-and-adr-container, 2026-07-01_k1-typed-memory-4types-harness-audit]
related_log: [2026-06-30_good-plan-5elements-and-adr-container.md, 2026-07-01_k1-typed-memory-4types-harness-audit.md]
---

# K-1.1 Restartable Handoff と ADR ライフサイクルの Q&A

> 記事 K-1.1「3点セット引き継ぎ」の kaiju ハーネス実装状況を確認し、そこから派生した ADR (設計判断記録) の作成タイミング・plan との違い・作成経路・実運用実績までを調査した対話ログ。結論: 3点セットは実装済み(記事以上)だが pickup 自動発火が唯一の欠落。ADR は事象駆動 opt-in で実運用実績ゼロ。

## 概要

reference 記事 (260405) の K-1.1 Restartable Handoff セクションを起点に、次の5問を順に掘った:

1. 記事の「3点セット引き継ぎ (git log + 進捗ファイル + 実行計画)」は kaiju ハーネスで実装できているか
2. 3点セットの要素③ ADR (設計判断記録) はいつ作成されるのか
3. 「選択を伴い却下案がある設計判断が発生した瞬間」とは具体的にいつか
4. plan モードで plan.md に設計を出すのに、なぜ別途 ADR ファイルが要るのか
5. ADR は orchestrating-team-development 経由でしか作られないのか / 過去の作成実績はあるか

調査は Explore agent 2〜3本にファイル横断を委譲し、記事側定義と `~/.claude/` 実装を照合する方式で進めた。

## 内容

### Q1: 記事の3点セット引き継ぎは kaiju ハーネスで実装できているか

記事 K-1.1 の定義 (三問対応):

| 記事の材料 | 答える問い | 記事の具体例 |
|---|---|---|
| Git log | 何をしたか | `git log --oneline -20` |
| 進捗ファイル | どこまで終わったか | todo.md のチェックボックス / Phase 番号 |
| 実行計画 | 次に何をすべきか | plan.md に残ステップと判断基準 |

kaiju ハーネスの実装状況 (照合結果):

| 材料 | 実体 | 判定 |
|---|---|---|
| ① git log | handoff が `session_commits`/`ahead_count` を frontmatter に固定化、pickup が git log と突合し rebase 痕跡/commit 失念を検出 | 実装済み (記事以上) |
| ② 進捗ファイル | `.claude/handoff-state.md` の status/next_phase/last_completed_phase/phase_order。YAML frontmatter で機械可読、Stop/PostCompact hook が status で鮮度分岐監視 | 実装済み (記事以上) |
| ③ 実行計画 | `.docs/plans/YYYY-MM-DD-<topic>.md` (5フェーズ status・削除禁止・自動アーカイブ)、判断理由は ADR に分離、handoff `related_plan` で②と連結 | 実装済み (記事以上) |

**結論**: 3点セットは3つとも実装済みで、記事の水準を上回る。**唯一の構造的欠落は「ロード (pickup) の自動発火」** — SessionStart hook は handoff-state.md を参照せず、pickup は手動起動 skill のみ。save は自動・監視付き、load は手動という非対称。埋めるなら SessionStart hook への「軽い誘導注入」(status≠completed かつ新しい時のみ pickup を促す一文) が最小コストの一手だが、新規開始時のノイズとのトレードオフを含むため未実施。

### Q2: ADR (③実行計画の判断理由分離先) はいつ作成されるか

**事象駆動であって段階駆動ではない**。「実体的な設計判断 (選択を伴い却下した代替案があるもの) が発生した瞬間」がトリガー。plan-workflow の特定フェーズ・コミット・handoff のいずれにも紐付いていない。opt-in (任意)。

- **作成と検証は別タイミング**:
  - 作成 = 判断が生じた瞬間 (人間/Claude が手で切り出す)
  - 検証 = コミット時。KP 有効プロジェクトの pre-commit フックが `validate-knowledge.py` で `type: decision` を機械検証 (「却下/代替案」見出しの存在 + 実体 15 文字以上)。plan は `type` を持たず対象外 (意図的)

### Q3: 「発生した瞬間」の具体化

時計上の時点ではなく、次の3条件が同時に揃った認知的瞬間:

1. 選択肢が2つ以上あった
2. 理由をもって一つ採用した
3. 残りを却下した (理由も言える)

具体シーン: AskUserQuestion で1案選ばれた時 / 「XかYか」の議論が理由付きで決着した時 / plan の `## 判断理由・却下した代替案` に手が動いた時 / レビュー見送りが設計理由で確定した時。**自動検知装置は無く、判断者が「今3条件が揃った」と気づいて初めて器に落とす** — これが opt-in の本当の意味。発生していない例: 唯一解の自明実装 / 好み・些末 (変数名・タイポ) / diff から復元できる戦術的選択。

### Q4: plan.md があるのに ADR を別ファイルにする理由

ADR は plan.md とは別の独立ファイル (`.docs/decisions/NNNN-<slug>.md`)。「重複した別ファイル」ではなく役割・寿命・粒度が違う:

| 観点 | plan.md | ADR (`.docs/decisions/`) |
|---|---|---|
| 寿命 | 短命 (完了で archived/ へ mv) | 長命 (プロジェクトが続く限り) |
| 粒度 | 1タスク=1ファイル (複数判断が混在) | 1判断=1ファイル (`ADR-NNNN` 安定番号で参照) |
| 機械検証 | 対象外 (type 無し) | validator が却下案セクションの非空を強制 |

判断理由は**まず plan 本文に書く**。そのうち「タスクを超えて後から追跡したい実体的な決定」だけを ADR に昇格。昇格は稀ゆえ二重記録にはならない。一言で: plan =「今回どう作るか」(使い捨て)、ADR =「このプロジェクトは何を決めたか」(残す)。

### Q5: ADR は orchestrating 経由でしか作られないか / 実績はあるか

**No。作成経路は3つ**、orchestrating はその1つに過ぎず、しかもその中の ADR emit すら opt-in (emit しなければ byte 単位同一):

1. 手動記録 (基本経路 — 人間/メイン Claude)
2. plan ワークフロー経由 (`## 判断理由・却下した代替案` からの切り出し)
3. orchestrating-team-development の指揮者 Step 7 / Step 5 gep-gate (設計/アーキレベルの見送り時 opt-in emit)

ADR 生成専用の skill/コマンドは存在しない。スキーマ・validator・テンプレを所有するのは `establishing-knowledge-persistence` (器を提供する側であって作成主体ではない)。

**実運用実績調査** (`~/.claude` + cc-playground 全体を `type: decision` grep + `decisions` ディレクトリ find で横断):

| ヒット | 正体 | 実績か |
|---|---|---|
| `260324/.../examples/l2-knowledge-persistence/decisions/001-cart-storage.md` | 学習用サンプル ADR (架空EC・Redis 採用、frontmatter 無し) | 教材のみ (唯一 ADR の体裁を持つ実ファイル) |
| `~/.claude/skills/.../knowledge-categories.md` | ADR テンプレ正本 | 規定文書 |
| `260530/.docs/plans/archived/2026-06-28-adr-decision-record-container.md` | ADR コンテナ新設の plan (本文に ADR の YAML 例を含みヒット) | 計画 (ADR 実体ではない) |
| `260413/.docs/knowledge/decisions/` | 名前だけ decisions のログ置き場 (中身は verification result/changelog/smoke test) | ログ類 (ADR 命名でも type: decision でもない) |

**結論**: 本番 ADR の作成実績はゼロ。器 (`.docs/decisions/`)・作法 (テンプレ)・機械検証 (validator) は整備済みだが、まだ一度も実運用で書かれていない。このプロジェクト (260530) 自体は `.docs/decisions/` ディレクトリすら未作成 (器を作る計画のアーカイブがあるのみ)。ADR の形を眺めたいなら唯一の実物 `001-cart-storage.md` を参照。

## 関連ファイル

- `~/.claude/skills/handoff/SKILL.md` — 引き継ぎ状態の書き出し (save)。frontmatter 機械可読化
- `~/.claude/skills/pickup/SKILL.md` — 引き継ぎ状態の復元 (load)。手動起動のみ (自動発火なし = 唯一の欠落)
- `~/.claude/hooks/hook_stop_handoff_check.sh` / `hook_post_compact_handoff_check.sh` — handoff の鮮度を status 分岐で監視
- `~/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md` — ADR テンプレ/validator の正本
- `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` — pre-commit で type: decision を機械検証
- `~/.claude/skills/orchestrating-team-development/SKILL.md` (Step 7 sub-3 / sub-5) — 設計レベル見送り時の opt-in ADR emit
- `~/.claude/rules/plan-workflow.md` / `~/.claude/.docs/plans/README.md` — plan と ADR の役割分担 (plan は type 無しで validator 対象外)
- `.../260324_.../examples/l2-knowledge-persistence/decisions/001-cart-storage.md` — 唯一の ADR 実物 (学習用サンプル)
- `.docs/logs/shared/2026-06-30_good-plan-5elements-and-adr-container.md` — ADR コンテナ新設の経緯 (前提ログ)
- `.docs/logs/shared/2026-07-01_k1-typed-memory-4types-harness-audit.md` — K-1 記憶型の監査 (親制約 K-1 の関連ログ)
