---
date: 2026-06-12 09:48:13
type: work
topic: global-instructions-slimming-audit
session: Claude Code Fable 5
related_skill: [explain-in-html, logging, commit]
---

# グローバル指示スリム化監査の実施と適用結果検証

> ~/.claude/CLAUDE.md + rules/ 8本 (毎セッション注入 14,856B) の全54指示を「注入価値 vs 汚染コスト」で査定。提案13件 (削除5 + 短縮8) が全て適用され、12,369B へ 2,487B (16.7%) 削減。

## 概要

毎セッション無条件に注入されるグローバル指示を「注入する価値が汚染コストを上回るものだけ」に絞り込むための監査。判定基準は「その指示が消えたら実際に壊れる挙動・起きる事故があるか」で、skill / hook / 他 rule からの依存参照を settings.json と grep で全て実測した。優先順位は「誤削除 > 冗長見逃し」── 迷った判定は維持に倒し、迷いを明記した。

## 内容

### 監査を支えた実測事実 2 つ

1. **rules/*.md は全 8 ファイルが毎セッション全文自動注入される** (セッションへの注入内容で実証)。よって CLAUDE.md 側の「reference: rules/X.md」だけの節は同一情報への二重注入であり、削除しても挙動は変わらない。これが削除候補 5 件の根拠。
2. **「壁と地図」構造**。rm・curl/wget・秘密ファイル・一括置換・amend・plans 出力先・ヘッジ語・絵文字コメント・生成署名は hook + permissions.deny が「壁」として機械ブロック済み。CLAUDE.md の対応指示は「壁の地図」(壁に当たる前に代替路を示す案内) であり、見かけ重複でも消すと壁に反復衝突して停滞するため維持。

### 判定結果 (54指示)

| 判定 | 件数 | 内訳 |
|---|---|---|
| 維持 | 41 | 壁の地図 / hookで表現不能な判断基準 / 実事故の再発防止 |
| 削除候補 | 5 | D1-D4: Build/Test・Critical Thinking・Multi-Agent Safety・Frontend Aesthetics の道標節、D5: Docs 出典表記行 (全て二重注入) |
| 短縮候補 | 8 | S1 回答構造例示 / S2 Persona性格 / S3 ブラウザMCP 3行 / S4 Gotcha内容3項 / S5 citation-format.md / S6 decisive-answers.md 例示 / S7・S8 道標断片 |

### 迷って維持に倒した判定 (明記)

- **一括置換禁止**: hook と三重防御だが「書く前の抑止」価値で維持
- **S6 の短縮幅**: decisive-answers.md は「簡潔なルールは合理化で迂回される」実敗から生まれた防壁。禁止語リストと迂回パターン3つは不可侵とし、例示のみ圧縮
- **S2 Persona**: 美学の領域ゆえ「任意」と付した

### 適用結果の検証 (かいじゅう自身が手動適用、permissions.deny により Claude は CLAUDE.md 編集不可)

| ファイル | Before | After | 差分 |
|---|---|---|---|
| CLAUDE.md | 8,596B | 6,918B | −1,678B |
| rules/citation-format.md | 985B | 482B | −503B |
| rules/decisive-answers.md | 2,398B | 2,092B | −306B |
| rules/ その他6本 | 2,877B | 2,877B | 変更なし |
| **合計** | **14,856B** | **12,369B** | **−2,487B (16.7%)** |

- 13 提案すべての適用を Read で照合し確認。S2 は提案以上に圧縮されていた (肩書行 + ナルシスト 2 行も削除、依存なしを確認済みで問題なし)
- 削減が見込み (15%) を上回ったのはこの Persona 追加圧縮分
- 依存整合: rules/ 8 本健在、CLAUDE.md → decisive-answers.md 参照健在、口調節 (stop hook の口調禁止ルールが依存) 健在

### 重要発見 (記事には書かれていないレベル)

- **CLAUDE.md と rules/ の二重道標は「気付かれない汚染」の典型**。rules/ 自動注入は Claude Code の仕様であり、注入内容を実際に見ない限り重複に気付けない
- **hook で守られた禁止事項でも CLAUDE.md 側の指示は消せないものが多い**。hook は「実行時の拒否」しかできず、「書く前の抑止」「代替手段の提示」「判断基準 (凝集度・対象拡張子)」は文章にしか担えない
- ~/.claude は git 管理外。グローバル指示の変更履歴は残らないため、大規模改変時は本ログのような外部記録が唯一の復元手がかりになる

## 関連ファイル

- `~/.claude/CLAUDE.md` — 監査対象本体 (適用済み)
- `~/.claude/rules/citation-format.md`, `~/.claude/rules/decisive-answers.md` — 短縮適用済み
- `.docs/output/explain-in-html/260612_global-instructions-slimming-audit.html` — 監査レポート HTML (全54指示の filter-table + before/after 対比)
