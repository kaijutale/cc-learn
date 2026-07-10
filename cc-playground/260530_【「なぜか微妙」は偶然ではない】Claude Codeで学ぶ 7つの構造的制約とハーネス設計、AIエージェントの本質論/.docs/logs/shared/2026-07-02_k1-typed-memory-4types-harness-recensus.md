---
date: 2026-07-02 04:10:00
type: work
topic: k1-typed-memory-4types-harness-recensus
session: 未設定
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md
related_skill: [explain-in-html, logging, establishing-knowledge-persistence, review-harness]
related_agent: [general-purpose]
related_log_ids: [2026-07-01_k1-typed-memory-4types-harness-audit]
related_log: [2026-07-01_k1-typed-memory-4types-harness-audit.md]
---

# note K-1「型付き記憶パターン(4型の永続記憶)」解説HTML再作成 + ハーネス実体の新鮮な全数センサス

> 2026-07-01の同主題調査を惰性で写さず、~/.claude/を当日フレッシュに全数再センサス。二層(スキーマ vs 実体)フレームを新設し、旧版の「project 4件」を「型付き2 + 型無し直書き2」に精緻化。新スキーマ薄さ発見(4型は裸見出しのみ、用途/寿命はharnessに無く正本のみ)とuser型=設計判断の移設証拠を追加。成果物 260702_typed-memory-4-types.html。

## 概要

かいじゅうの再依頼: noteの「K-1. 記憶の外部化」の型付き記憶パターン(4型)について、(1)4型の記憶分類の解説、(2)kaijuハーネスでの4型構築状況の徹底調査(未構築があればその解説)を、解説HTMLにする。

前日(2026-07-01)に同名HTML + 調査ログが既存。だがハーネス状態は日々ドリフトする(現にそのログ自身が2026-05-30分析の陳腐化を検出済)ため、当日フレッシュに再調査。メインコンテキスト保護のため general-purpose 2体を並行起動:

- **memory実体センサス**: `~/.claude/projects/*/memory/` + グローバル + MEMORY.md を全数、frontmatter `type:` で分類集計。
- **スキーマ/配線調査**: 4型スキーマの定義箇所(establishing-knowledge-persistence SKILL + review-harness)、settings.json の memory 設定、hook 配線、user型の実配置(CLAUDE.md/rules)。

成果物: `.docs/output/explain-in-html/260702_typed-memory-4-types.html`(7セクション、自己診断 全pass)。日付が違うため260701は非破壊で温存。

## 内容

### 4型の定義 (正本 text.md L1311-1315)

| type | 用途 | 寿命 | 例(正本ママ) |
|---|---|---|---|
| user | ユーザーの属性・好み | 長期(ほぼ不変) | シニアエンジニア、Go得意、React初心者 |
| feedback | 実際の失敗からの教訓 | 中期(解消まで) | テストは実DBを使う。モックで事故った |
| project | 進行中の状態 | 短〜中期(タスク完了まで) | リリースフリーズ 3/5開始 |
| reference | 外部リソースへのポインタ | 中期(リソース有効な間) | バグはLinearのINGESTで追跡 |

貫く軸は「寿命」。型があることで用途と寿命が明確になり検索性・保守性が上がる →「型は記憶の棚卸しを可能にする」。

### ハーネス実体の全数センサス (2026-07-02 フレッシュ)

型付き native 記憶 8件 + 型無し MEMORY.md 6件 = 全14件。グローバル `~/.claude/memory/` は不在(記憶は100%プロジェクト別)。

| 型 | 型付き実体 | 置き場 |
|---|---|---|
| feedback | 5 | native(2プロジェクトに分散) |
| project | 2 (+2) | native型付き2 + MEMORY.md直書き状態2(型無し: ninmu/toybox 休止中) |
| reference | 1 | native 1 |
| user | 0 | memory層は空。CLAUDE.md + rules/ が代替 |

運用: `autoMemoryEnabled: false`(settings.json:502、手動キュレーション)、第三者記憶プラグイン無効(:464)、SessionStart自動注入なし、自動分類hookなし、読込on-demand。

### スキーマ層の薄さ (新発見)

4型は `establishing-knowledge-persistence/SKILL.md:120-123` の MEMORY テンプレに **裸の見出し**(`## user` 等)としてのみ定義 + `review-harness/diagnosis-report-template.md:22` の型別カウント欄。**用途/寿命の意味付けはハーネスのどこにも無い**(skills全体を `寿命` でgrep=0件)。その意味は正本(記事 text.md:1321)にしか存在しない。型検証スクリプトも無し。→「スキーマは名札どまり」。

## 重要発見

- **旧版(260701)の「project 4件」を精緻化・訂正**: 260701は型付き2とMEMORY.md直書き2を合算し「4」と表現。フレッシュ調査で、直書き2件(ninmu/toybox)は `type:` frontmatter を持たない → 型付き実体には数えない。正確には「型付き2 (+型無し直書き状態2)」。schema-vs-instance の二層区別を強化する好材料。
- **二層フレーム新設**: スキーマ層(型定義)と実体層(記憶インスタンス)は独立。混同すると「4型あるか」の答えが濁る。スキーマ層=定義あり(但し薄い)、実体層=user 0件。
- **user型=設計判断の証拠を強化**: アーカイブ済 plan `2026-05-23-memory-citation-antipattern-cleanup.md:33-40` に、横断的 feedback 記憶を意図的に rules/CLAUDE.md へ移設した記録。user型がmemoryに無いのは手抜かりでなく文書化された移設判断。
- **観測した綻び(観測のみ・是正スコープ外)**: (1)frontmatter 2世代混在(type最上位1件 / metadata入れ子7件 → `grep '^type:'` は8件中1件しか拾えない)、(2)dangling索引1件(claude-code-learn MEMORY.md → feedback_reference-resolvable-path.md 不在)、(3)孤立ファイル0件。

## 設計意図

- HTML作法: explain-in-html skill準拠。CSS完全一致を保証するため、承認済260701のhead(<style>) + copyボタンJSを機械抽出して再利用(template <style> == 260701 <style> をpython照合、7984字identical)。本文のみ二層フレームで刷新。italic 0・placeholder 0・wrap 1・section 01-07・footer素っ気なし 全pass。
- user型を memory に作らないのは意図的。DRY(二重管理回避) + 常時ロード最適配置 + `autoMemoryEnabled:false` 手動運用と一体。記事4型を「機能充足」で読めばuser型も充足済み、「memoryファイル存在」で読めばuser型のみ未充足。

## 副作用

- 特になし(HTML生成 + ログのみ、既存破壊なし)。260701は温存。
- 記憶実体の綻び2点は観測のみで是正せず(スコープ外)。

## 関連ファイル

- `.docs/output/explain-in-html/260702_typed-memory-4-types.html` — 生成した解説HTML(成果物)
- `.docs/output/explain-in-html/260701_typed-memory-4-types.html` — 前日の同主題版(温存、本作業で精緻化・訂正)
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】…/text.md` — 正本(K-1 L1280-1357、4型表 L1311-1315)
- `~/.claude/skills/establishing-knowledge-persistence/SKILL.md` — 4型スキーマの定義(L120-123 裸見出し)
- `~/.claude/skills/review-harness/diagnosis-report-template.md` — 型別カウント欄(L22)
- `~/.claude/projects/*/memory/` — 4型memory実体(センサス対象、全14件)
- `~/.claude/settings.json` — `autoMemoryEnabled:false`(L502)、記憶プラグイン無効(L464)
- `~/.claude/.docs/plans/archived/2026-05-23-memory-citation-antipattern-cleanup.md` — user型相当をrules/へ移設した設計判断の記録
