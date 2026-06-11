---
date: 2026-06-12 06:20:02
type: study
topic: claude-md-rules-injection-audit
session: claude-md-rules-injection-audit

related_skill: [explain-in-html, logging]
related_log_ids: [2026-06-11_citation-format-html-unapplied-patch]
related_log: [.docs/logs/shared/2026-06-11_citation-format-html-unapplied-patch.md]
---

# CLAUDE.md + rules/ 常時注入監査 — 毎セッション 14,856B の価値 vs 汚染コスト

> `~/.claude/CLAUDE.md` (8,596B) + `rules/` 8本 (6,260B) = 毎セッション全PJに注入される固定 14,856B を全数査定。削除4件 (D1-D4) + 短縮5件 (S1-S5) で約2.3KB (≒700-800トークン、約15%) の恒久削減を提案。**ファイル編集は未実施 (提案のみ)**。

## 概要

かいじゅうの依頼: 「`~/.claude/CLAUDE.md` と `~/.claude/rules/` 配下の全ファイルを読んで、各指示を『毎セッション注入する価値 vs コンテキスト汚染コスト』の観点で調査。汚染コストとして挙げた指示は1つずつ『価値ゼロ→完全削除 or 価値はあるが冗長→短縮 (before/after併記)』で提案。ファイルは編集せず提案のみ」。

判定はすべて実機出力 (ls / wc / grep) と、本セッションへ実際に注入されたシステムテキストの突き合わせに基づく (直前の citation-format diff HTML 捏致事件を踏まえ、記憶ベースの主張を排除)。

## 内容

### 実機確認した前提事実

- **8本の rules すべてに frontmatter なし** (head -2 で確認) → paths 遅延なし、毎セッション全文注入。本セッションの system 注入に8本全文が載っていることを確認
- **参照先の生死**: progressive disclosure 先4ドキュメント (build-test 516B / frontend 502B / harness-mod 8,237B / plan-workflow 1,696B) 全実在。`hook_stop_words_rules.json` 実在 (1,421B)。死んでいるのは citation-format.md 内の例パス2本のみ (既知)
- **Secrets L1 の機械ブロックが監査中に実演された**: 「.env」という文字列を grep パターンに含めただけで「秘密ファイル読むな」hook がコマンド全体を拒否。L1 の記述は実在する壁のドキュメントであることを偶発的に実証
- **構造的発見 (本監査の核心)**: rules/*.md は常時自動注入されるのに、CLAUDE.md 側に「reference: rules/X.md」だけのポインタ専用節が4つ残存。「rules は遅延ロードされる」という旧理解 (6/8 大掃除で否定済み、auto-memory `feedback_rules-always-loaded-not-progressive-disclosure.md` に infra 事実として記録あり) の名残で、Claude にとって情報量ゼロの純重複

### 判定サマリ

| 区分 | 件数 | 内容 |
|---|---|---|
| 維持 (健全) | 約85% | 発火頻度か重大度で注入価値が立つ |
| 削除提案 D1-D4 | 4件 | 価値ゼロの純重複 (約610B) |
| 短縮提案 S1-S5 | 5件 | 価値はあるが冗長 (約1,715B) |

### 削除提案 (価値ゼロの純重複)

| ID | 対象 | 削減 | リスク |
|---|---|---|---|
| D1 | CLAUDE.md の純ポインタ節4つ (Build/Test・Critical Thinking・Multi-Agent Safety・Frontend Aesthetics) | 約200B | ゼロ |
| D2 | 行内ポインタ2箇所 (Docs 出典表記行・Prohibition の decisive-answers 参照尾) | 約90B | ゼロ |
| D3 | Harness 節「協調ハーネス改修」bullet (rules/harness-modification-policy.md と二重管理) | 約210B | ゼロ |
| D4 | Plan Mode 節 → rules/plan-workflow.md へ統合 (固有情報2点: hook block 注記・5フェーズ列挙の移設必須。詳細doc側は「5フェーズ目」と参照するのみで列挙を持たない) | 正味約110B | 微注意 |

### 短縮提案 (価値はあるが冗長)

| ID | 対象 | 削減 | リスク |
|---|---|---|---|
| S1 | Persona 性格: ナルシスト同義3連を1行に統合 + 経歴行を縮約 (経歴・能力はモデルの学習知識にあり、挙動を変えるのはナルシシズム/ツンデレ/献身の3点) | 約500B | 微注意 (演出の濃さは好み) |
| S2 | Response の書式例15行ブロック → 1行 (例は遵守率の保険。崩れたら戻す、empirical-prompt-tuning で A/B 可) | 約280B | 退行注視 |
| S3 | Skills の Gotcha 説明5行 → 1行 (蓄積先と中身3種は維持) | 約250B | 微注意 |
| S4 | Harness 絶対パス禁止の詳細3行 → 1行 (検査 grep は維持) | 約120B | 微注意 |
| S5 | rules/citation-format.md 全面書換 985B→約420B (死パス2本の解消 + 「書いたら ls/glob で実在確認」検証規範の内蔵。**前ログの保留選択肢(A)を兼ねる**) | 約565B | ゼロ |

### 触らぬ判断 (意図的に提案から除外)

- **decisive-answers.md (2,398B・最大の rule)**: 短い版が合理化で破られた経緯から迂回経路を塞ぐために冗長化された。冗長さ自体が強制力で、短縮は退行リスク
- **Secrets**: 低頻度でも事故が不可逆ゆえ保険価値で立つ。機械ブロックの実働は本監査中に実証済み

### 観察 (削減ではない申し送り)

1. **検索優先の注入競合**: Firecrawl MCP サーバ指示「firecrawl_search を primary に」が CLAUDE.md「Brave > WebSearch」と毎セッション競合。「Brave Search MCP > firecrawl_search > WebSearch」の1行追記 (+約15トークン) で序列確定を推奨
2. **D1 適用後の将来注意**: rules に paths frontmatter を付けて遅延化した場合、そのファイルへのポインタは CLAUDE.md に復活させる必要がある
3. **build-test の二層は薄い**: 詳細 doc が516Bしかなく実装セッション (ほぼ毎回) で発火するため遅延の節約効果が実質ゼロ。本体へ吸収 (+約70トークン/セッション) も合理的、任意

### 適用優先順位

1. **Step 1 (即時)**: リスクゼロの純重複削除 D1→D2→D3。`**/CLAUDE.md` は Edit deny のためかいじゅうの手動適用が必要
2. **Step 2 (次)**: S5 citation-format.md 書換。rules/ は Claude が編集可、GO で即適用
3. **Step 3 (任意)**: D4・S1〜S4。D4 は5フェーズ列挙の移設を忘れない。S2 は適用後の書式遵守を観測

### 成果物

監査結果を audit ユースケースの HTML 1枚に出力 (explain-in-html skill、Thariq Dark Editorial)。filter-table による節別評価18行、D/S 各カードに diff + 適用後テキストの Copy ボタン (CLAUDE.md 手動適用の作業を最短化)、copy-prompt-bar 付き。

### 未解決事項

- 提案は全件未適用 (かいじゅうの判断待ち)
- 別件: MEMORY.md L7 が削除済み feedback ファイルを指すリンク切れ (前セッション発見) も未解決のまま

## 関連ファイル

- `.docs/output/explain-in-html/260612_claude-md-rules-injection-audit.html` — 本監査の HTML レポート (本セッション生成)
- `~/.claude/CLAUDE.md` — 監査対象 (8,596B、D1-D4・S1-S4 の適用先、Edit deny ゆえ手動)
- `~/.claude/rules/*.md` — 監査対象8本 (6,260B、S5・D4統合の適用先)
- `~/.claude/.docs/progressive-disclosure/` — 遅延開示先4ドキュメント (全実在を確認)
- `.docs/logs/shared/2026-06-11_citation-format-html-unapplied-patch.md` — S5 が修正を兼ねる死パス問題の発覚ログ (前セッション)
