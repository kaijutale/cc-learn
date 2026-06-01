---
date: 2026-06-02 01:31:50
type: work
topic: prohibition-critical-thinking-dedup
session: 脱迎合ルールの重複整理(Prohibition × critical-thinking)
related_skill: [logging]
related_log_ids: [2026-06-01_rules-progressive-disclosure]
related_log: [2026-06-01_rules-progressive-disclosure.md]
---

# 脱迎合ルールの重複整理 — Prohibition × critical-thinking-checklist

> CLAUDE.md `## Prohibition` と `rules/critical-thinking-checklist.md` に分散していた「脱迎合」の二重定義を整理。純粋重複(イエスマン独立行・指摘/反論2行)を解消し、禁止×能動規範の両建ては"対"と明示して維持。

## 概要

前回の rules/ 段階的開示点検([[2026-06-01_rules-progressive-disclosure]])で「critical-thinking は普遍ルールゆえ KEEP」と判定した後、かもねが「Prohibition との重複は?」と深掘りした流れ。脱迎合(媚びるな)が2ファイルに散在しているのを発見し、案a で整理した。

## 内容

### 重複分析

- **真の重複**: 脱迎合が Prohibition(「迎合」「イエスマン」)と critical-thinking(「同意が楽でも黙らない」)に分散。Prohibition 内部でも「イエスマン」独立行が「迎合」と完全同義で重複。
- **補完(重複でない)**: Prohibition「曖昧回答禁止/ヘッジ禁止」と critical-thinking「反論は根拠付き」は対象が違う(回答のヘッジ vs 反論の質)→ 過剰検出しない。
- 弊害: 正典の曖昧さ・更新ドリフト・always-load 同士の二重消費。

### before/after(案a)を提示 → かもねが実装

| ファイル | 変更 | 実施 |
|---|---|---|
| CLAUDE.md `## Prohibition`(L51) | 「イエスマン」独立行を削除し列挙に統合: `…見下し・迎合・イエスマン` | かもね手動(`Edit(**/CLAUDE.md)` deny のため) |
| rules/critical-thinking-checklist.md(L9) | 指摘/反論の2行を1行に統合、`(「迎合禁止」の能動面)` 注記で Prohibition と対を明示 | かもね編集 |

役割: 分析・before/after・レビューはわたし。実装はかもね。

### レビュー(2サイクル)

- **1回目チェック → ❌ 差し戻し**: 統合"後"の行を追加したが、統合"元"の旧行(旧L9)と「反論は根拠付き」(旧L13)を消し忘れ。重複が解消されず逆に10→11行に増加。
- **2回目チェック → ✅ 合格**: 旧L9・旧L13 が削除され統合行のみ残存。9行。情報欠損ゼロ、`・`(問題/より良い代替の並列)保持。
- Prohibition 側も grep 確認 → 既に列挙統合済み。両ファイル整合。

## 設計意図

- 脱迎合を完全に1箇所へ集約せず、**「禁止(Prohibition)」と「能動規範(critical-thinking)」の両建てを"対"と明示して維持**。理由: LLM には negative(媚びるな)と positive(楽でも指摘せよ)の両方が効く。完全排除は能動性を削ぐ。重複の弊害(正典曖昧・ドリフト)は"対"の明示で消し、二重消費は意図的補強として許容。
- (b)案(Prohibition から迎合を抜き critical-thinking に集約)は却下: 媚び系の禁止語列挙(忖度・お世辞・迎合…)から1語だけ抜くと網羅性が崩れ不自然。

## 副作用

- なし(後方互換・ルールの意味は保持)。critical-thinking L9 が参照する Prohibition「迎合禁止」は実在し、リンク切れなし。

## 重要発見(Gotcha)

- **統合編集の典型失敗「新行を足して旧行を消し忘れ」**: 重複解消のつもりが逆に増える。検出の鍵は**行数の方向**(削減のはずが +1 なら消し忘れを疑う)。
- **語の一致 ≠ 重複**: 「迎合」は3箇所(L44 認知バイアス耐性=受動 / L51 行動禁止=能動 / critical-thinking=能動規範)に出るが、**観点が違えば補完**。同一語の出現だけで重複判定すると過剰検出になる。L44 は「入力プロンプトのバイアスに左右されない受動耐性」で L51 の「自分が媚びない能動禁止」とは別物 → 触らないのが正解。

## 関連ファイル

- `~/.claude/CLAUDE.md` L51 — Prohibition、「迎合・イエスマン」列挙統合(かもね手動編集、Edit deny)
- `~/.claude/rules/critical-thinking-checklist.md` L9 — 指摘/反論統合行(10→9行)
