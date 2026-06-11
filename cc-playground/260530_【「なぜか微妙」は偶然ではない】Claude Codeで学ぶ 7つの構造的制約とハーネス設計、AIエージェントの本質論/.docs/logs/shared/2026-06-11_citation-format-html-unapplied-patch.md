---
date: 2026-06-11 22:19:05
type: qa
topic: citation-format-html-unapplied-patch
session: citation-format-diff-html-review

related_skill: [explain-in-html, logging]
related_log: [2026-06-01_harness-modification-policy-note-gap-fix.md]
---

# explain-in-html の diff HTML が「適用済み」を騙る — 実ファイル未修正の発覚

> `260611_citation-format-diff.html` は `~/.claude/rules/citation-format.md` への patch を「適用済み (+7/-3)」として描いていたが、実ファイルは 0 行も変更されていなかった。HTML は実ファイルを base にせず、空想の「修正後の姿」を描画していた。

## 概要

かいじゅうが `260611_citation-format-diff.html` を読み、「実ファイル `~/.claude/rules/citation-format.md` の該当箇所、修正されてなくない?」と指摘。HTML の主張と実ファイルの現状を突き合わせて検証した。

結論: かいじゅうの指摘が正しい。**実ファイルは一切修正されていない。** HTML が「適用済み patch」として表示した変更は実機に反映されておらず、絵に描いた餅だった。

## 内容

### HTML の主張 (260611_citation-format-diff.html)

- statbar: `1 File Changed` / `+7 Lines Added` / `−3 Lines Removed` / `0 Dead Paths Left`
- 削除 (−) したと主張: L11 `- glob パス (例: ...note-articles/NNNNNN_*.pdf)`、L14 `適用例: harness-modification-policy.md の「## 出典 (note 参照先)」`
- 追加 (+) したと主張: 形式テンプレ化した glob パス行、`## 検証 (書いた本人が辿れることを実機確認する)` 節 (L16-18)

### 実ファイルの現状 (Read で確認)

実ファイル `~/.claude/rules/citation-format.md` は 14 行 (+ 末尾) で終わり、以下の食い違いを確認:

| HTML の主張 | 実ファイル現状 |
|---|---|
| L11 削除: `note-articles/NNNNNN_*.pdf` 例 | **L11 に残存** (削除されていない) |
| L14 削除: `適用例: harness-modification-policy.md の出典節` | **L14 に残存** (削除されていない) |
| L16-18 追加: `## 検証` 節 | **存在しない** |

### 決定的証拠: ctx 行すら実ファイルと不一致

HTML の「変更なし (ctx)」行も実ファイルと食い違っていた:

- HTML L3:「その略記は、**別セッション** / 別PJ の…」
- 実ファイル L3:「その略記は、**当該プロジェクト文脈を持たない別セッション** / 別PJ の…」
- HTML L5: 末尾 `(CLAUDE.md Harness 節)` が欠落

→ この diff は**実ファイルを base にして生成されていない**。存在しない「修正後の姿」を空想で描いた図。

### 教訓

- explain-in-html (および類似の diff 可視化) は、**実ファイルを Read せずに「修正後の姿」を描ける**。HTML が `+N/-M` と数字を出しても、それは実適用の証拠にならない。
- 皮肉: 「実在を確かめてから書け」という検証規範を謳う HTML 自身が、実機未確認のまま生成されていた。原則を、原則を書く自分自身に適用できていなかった典型例。
- diff HTML を生成したら、**実ファイルへの適用は別アクションとして明示的に実行・検証する**必要がある。可視化 = 適用ではない。

### 未決事項 (このログ時点では未着手)

HTML を正とするか実ファイルを正とするか、かいじゅうの指示待ち。選択肢を提示済み:
- (A) HTML 通りに実ファイルを直す (検証推奨案: 腐った例の修正 + `## 検証` 節追加。ただし追加する出典パスの実在を実機確認してから)
- (B) HTML を実態に合わせる (「未適用の提案 patch」表記に直す or 破棄)

わらわの推奨は (A)。実ファイルに今も実在せぬパスが「例」として残っており、これは citation-format ルール自身の違反状態のため。

## 関連ファイル

- `~/.claude/rules/citation-format.md` — 検証対象の実ファイル。L11/L14 に実在せぬパス例が残存中 (未修正)
- `.docs/output/explain-in-html/260611_citation-format-diff.html` — 未適用 patch を「適用済み」と描いた diff HTML
- `.docs/output/explain-in-html/260611_session-file-audit.html` — 同セッションで開いた audit HTML (本件とは別)
