---
date: 2026-07-01 16:31:45
type: work
topic: k1-typed-memory-4types-harness-audit
session: 未設定
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, logging]
related_agent: [general-purpose]
related_log_ids: [2026-05-30_note-harness-gap-analysis]
related_log: [2026-05-30_note-harness-gap-analysis.md]
---

# note K-1「型付き記憶パターン(4型の永続記憶)」の解説HTML作成 + ハーネス構築状況の全数調査

> noteK-1の4型(user/feedback/project/reference)を正本p.64-67で確定し、~/.claude/実体を全数センサス。feedback=5/project=4/reference=1で構築済、user型のみmemory層0件(=欠落でなく設計判断、CLAUDE.md+rulesが代替)。成果を explain-in-html でHTML化。

## 概要

かいじゅうの依頼: noteの「K-1. 記憶の外部化」の型付き記憶パターン(4型の永続記憶)について、(1)4型の記憶分類の解説、(2)kaijuハーネスでの4型構築状況の徹底調査(未構築があればその解説)を、解説HTMLにする。

正本は画像PDF(124p、テキストレイヤー無・当環境にOCRツール無)。メインコンテキスト保護のため2エージェント並行:

- **pdf-k1-reader** (general-purpose): K-1を画像認識で逐語精読 → 4型定義を p.66 で確定
- **memory-harness-probe** (general-purpose): ~/.claude/配下のmemory実体を全数センサス

成果物: `.docs/output/explain-in-html/260701_typed-memory-4-types.html` (6セクション、自己診断ISSUES:none)。

## 内容

### 4型の定義 (正本 p.66 確定)

| type | 用途 | 寿命 | 例(正本ママ) |
|---|---|---|---|
| user | ユーザーの属性・好み | 長期(ほぼ不変) | シニアエンジニア、Go得意、React初心者 |
| feedback | 実際の失敗からの教訓 | 中期(解消まで) | テストは実DBを使う。モックで事故った |
| project | 進行中の状態 | 短〜中期(タスク完了まで) | リリースフリーズ 3/5開始 |
| reference | 外部リソースへのポインタ | 中期(リソース有効な間) | バグはLinearのINGESTで追跡 |

思想: 型があることで用途と寿命が明確になり検索性・保守性が上がる。型なしだと半年後に「何の教訓か/まだ有効か」が分からない →「型は記憶の棚卸しを可能にする」。K-1章扉はステートレス制約への対処(「毎朝記憶がリセットされる同僚」のたとえ)。図は「記憶の外部化 — 4つの引き出し」メタファーで同内容を二重提示。

### ハーネスでの構築状況 (~/.claude/ 全数センサス)

frontmatterの `type:` を権威に集計(ファイル名接頭辞はゆるい慣習で非権威):

| 型 | 構築状況 | 実体 |
|---|---|---|
| feedback | 構築済 | native memory 5件 |
| project | 構築済 | native 2 + MEMORY.md直書き2 = 4件 |
| reference | 構築済 | native memory 1件 |
| user | memory層は未構築(0件) | CLAUDE.md + ~/.claude/rules/ が代替 |

- 格納: `~/.claude/projects/<slug>/memory/` に Markdown + frontmatter。グローバル `~/.claude/memory/` は不在。
- `autoMemoryEnabled: false` (手動キュレーション)。自動分類hookは不在。読込はon-demand、SessionStart自動注入なし。

### user型「未構築」の解釈 (ヘッジせず分解)

- **memory層のuser型ファイル: 0件(未構築)** — 事実。
- **user型の責務(persona/username/規約/行動規範): 充足済み** — `~/.claude/CLAUDE.md` + `~/.claude/rules/*.md` が担当。
- 理由: rulesは system prompt に常時ロード = 不変user知識の最適置き場。memoryのuser型は二重管理で冗長。寿命「長期」の知識を常時ロード側に置くのは、4型「寿命で分ける」思想にむしろ忠実。

## 重要発見

- **gap-analysisログ(2026-05-30)の陳腐化を検出・訂正**: 「claude-code-learn/memory = 4型memory実体(完全一致)」は現状と乖離。2026-06-08の整理でclaude-code-learn/memoryはfeedback型のみに圧縮済。4型は複数project memoryに分散、user型はどこにも実在しない。
- **「スキーマ4型 ≠ 実体4型」を峻別すべき**: 型定義(スキーマ)は user/feedback/project/reference の4型completeだが、インスタンス化された実体はuser型0件。「4型ある」の主張はスキーマ層の話で、実体層ではuser未構築。
- 型定義(スキーマ)の正本は `establishing-knowledge-persistence` skill のMEMORYテンプレ(L109-127) + `review-harness` 診断テンプレ。

## 設計意図

- user型をmemoryに作らないのは意図的。DRY(二重管理回避) + 常時ロード最適配置 + `autoMemoryEnabled:false` の手動キュレーション運用と一体の判断。記事の4型を「機能充足」で読めばuser型も充足済み、「memoryファイル存在」で読めばuser型のみ未充足。

## 副作用

- 特になし(HTML生成 + ログのみ、既存破壊なし)。
- 補足: memory実体側に軽微な綻び2点をprobeが検出(claude-code-learn/MEMORY.mdのdangling索引1件、frontmatterスキーマ2世代混在)。本作業では観測のみで是正せず(スコープ外)。

## 関連ファイル

- `.docs/output/explain-in-html/260701_typed-memory-4-types.html` — 生成した解説HTML(成果物)
- `.docs/references/sources/pdf/260405_...pdf` — 正本(K-1 p.64-71、うち4型は p.66)
- `.docs/logs/shared/2026-05-30_note-harness-gap-analysis.md` — 先行調査(今回その記述の陳腐化を検出・訂正)
- `~/.claude/skills/establishing-knowledge-persistence/SKILL.md` — 4型スキーマの正本(L109-127)
- `~/.claude/projects/*/memory/` — 4型memory実体(センサス対象)
- `~/.claude/settings.json` — `autoMemoryEnabled: false`(手動キュレーションの根拠)
