---
date: 2026-06-15 16:22:45
type: work
topic: explain-in-html-diff-component
session: worktree-context-and-gtr-copy-qa
related_skill: [explain-in-html, logging]
related_log_ids: [2026-06-15_gtr-copy-include-skill-flow]
related_log: [2026-06-15_gtr-copy-include-skill-flow.md]
---

# explain-in-html に before/after diff 部品を実装

> GitHub PR "Files changed" 風の unified view diff 部品 (削除=red 薄背景 / 追加=green 薄背景) を explain-in-html skill に組み込み、静的・見た目・overflow の3段検証を通過。

## 概要

explain-in-html skill (質問・トピックを単一 HTML で視覚解説する skill) に、解説内容に before/after がある場合の **コード差分 UI** を足したいという要望。GitHub の PR Files changed のように削除行/追加行が一目で分かる表示を、既存の固定美学 (review-harness 一致: warm slate + red/amber/green) を壊さずに新部品として組み込んだ。

## 内容

### 実装

| ファイル | 変更 |
|---|---|
| `templates/base.html` | diff 部品 CSS (`.diff` / `.diff-head`+tally / `.diff-row`+`.del`(red 薄背景)/`.add`(green 薄背景) / 2列行番号ガター / `.diff-hunk`) を `.quote` と `footer` の間に組み込み + CHEATSHEET に HTML パターンを記載 |
| `SKILL.md` | Step2 部品表 / Step5 自己診断 / Output Examples (before/after 例) / Gotchas (3項目) / Last verified の5箇所に反映 |

### 表示方式の決定

unified (1カラム、削除→追加を縦に並べる) と split (2カラム左右対比) を AskUserQuestion (preview 付き) で提示し、**unified を採用**。理由: wrap 幅 920px では split の各カラムが窮屈で横スクロールが頻発する。GitHub デフォルトも unified。

### 検証 (3段)

1. **静的**: italic 混入 0 / placeholder 残 0 / 放射状グラデ glow 保持 / diff CSS 定義あり
2. **見た目** (chrome-devtools スクショ): 削除行=赤薄背景+`−`+旧番号、追加行=緑薄背景+`+`+新番号、コンテキスト行=両番号、ファイルヘッダー+tally。warm slate に調和し GitHub PR そのものの見た目
3. **overflow 実測** (evaluate_script): `page.overflowsX: false` (ページは横に広がらない) / 長い行の diff-body のみ `hasInternalScroll: true` (scrollW 876 > clientW 854)。diff コンテナ 856px = wrap 920 − padding。はみ出しなし

## 設計意図

- **既存 red/green を流用**: パレットに削除=red・追加=green が既にあり、diff の意味論 (削除/追加) と完全一致。新色を持ち込まず固定美学を維持
- **unified 固定**: skill をシンプルに保つ (1部品1仕事)。split を併載すると部品が2種に増え選択コストが生じる
- **`.diff-body{overflow-x:auto}` + `.diff-row{min-width:max-content}`**: 長い行は diff 内部で横スクロール、ページ全体は崩さない。実測で実証
- **2列行番号ガター ([旧][新])**: GitHub Files changed に忠実 (コンテキスト=両方 / 削除=旧のみ / 追加=新のみ)

## 副作用

- グローバル skill (`~/.claude/skills/explain-in-html/`) の改修。trigger・placeholder・既存部品は不変ゆえ後方互換
- diff 部品は before/after がある時のみ使う任意部品。既存の解説生成には影響なし

## 重要発見

- **fullPage スクショは overflow 内容を展開して撮る**: 長い行が画面端まで伸びて「はみ出している」ように見えたが、実際は diff-body 内スクロール。見た目だけで判断すると誤診する。`evaluate_script` で `scrollWidth` vs `clientWidth` を実測して初めて「ページは横スクロールしない」と確定できた。UI 検証は **目視 + DOM 実測の二段** が要る
- **背景ジョブで claude-in-chrome は拡張未接続 → chrome-devtools は CDP 接続で動く**: ブラウザ目視が要る局面では、背景ジョブでは chrome-devtools (new_page + take_screenshot + evaluate_script) が代替手段になる

## 関連ファイル

- `~/.claude/skills/explain-in-html/templates/base.html` — diff 部品 CSS + CHEATSHEET パターン
- `~/.claude/skills/explain-in-html/SKILL.md` — 部品表・自己診断・Output Examples・Gotchas・更新履歴
- `~/.claude/jobs/<job>/tmp/diff-test.html` — 検証用テスト HTML (job クリーンアップで消える一時物)
