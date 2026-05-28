---
date: 2026-05-28 19:01:18
type: work
topic: explain-in-html-v3-to-v4-upgrade
session: 260528_MarkdownよりHTML出力

related_article:
  - https://note.com/masa_wunder/n/n3bf723c195ee
  - https://note.com/masa_wunder/n/nf4cf2e257da2
  - https://thariqs.github.io/html-effectiveness/
  - https://x.com/trq212/status/2052809885763747935
related_skill: [explain-in-html]
related_plan_id: 2026-05-28-explain-in-html-upgrade
related_plan: .docs/plans/2026-05-28-explain-in-html-upgrade.md
---

# explain-in-html v3 → v4 大規模アップグレード (Warm Paper · Interactive)

> Thariq Shihipar (Anthropic Claude Code、2026-05-08、8M views) 「The Unreasonable Effectiveness of HTML」の 5 本柱を取り込み、interactive components 8 種類 + print mode を追加。Warm Paper 美学 (terracotta + teal + 丸ゴシック + ドット方眼) は完全維持。

## 概要

camone 個人 skill `/explain-in-html` (`~/.claude/skills/explain-in-html/`) を v3 (Warm Paper) → v4 (Warm Paper · Interactive) に大規模アップグレード。

**動機**: 現状の v3 は固定美学による AI slop 回避には成功していたが、Thariq の 5 本柱のうち **双方向性と context 幅** がほぼ未実装。100 行超 HTML を出すのに TOC が無い、copy-to-prompt の双方向ループが切れている、collapsible が無く情報密度が潰れる、print 対応が無い、severity 色分けが `.verdict-row` 内に閉じている等の構造的欠落があった。

**結果**: Thariq 5 本柱 (情報密度 / 視覚的明快さ / 共有のしやすさ / 双方向性 / context 幅) と 5 大ユースケース (audit / plan / research / dynamic / dashboard) すべてに対応するコンポーネントを追加。base.html は 591 行 → 1289 行 に拡張、inline vanilla JS 7 関数 (~4KB) を追加、print CSS と font fallback chain も強化。

## 内容

### 改修方針 (camone 確定、AskUserQuestion 4 問で決定)

| 観点 | 選択 |
|---|---|
| スコープ | Phase A+B+C フル (全 interactive 機能追加) |
| 既存処理 | 部分再設計OK (整合性優先、ただし既存 class 名は不変) |
| JS | 中度の vanilla JS (~4KB、5KB予算) |
| Google Fonts | 両立 (CDN維持 + fallback chain強化 + font-display:swap) |

### 不変条件 (完全維持)

- Warm Paper 美学: terracotta + teal + warm dark brown + Zen Maru Gothic + Zen Kaku Gothic New + JetBrains Mono + ドット方眼背景 + italic 禁止
- Reader-First 原則: 専門用語は括弧書き、略称は初出時に正式名併記
- Single column editorial: max-width 880px、card grid (3-column) 禁止、SaaS hero-features-CTA禁止
- 5 軸 commitment: density:dense / formality:formal / era:modern / warmth:warm / color_intensity:vivid

### 修正/新規ファイル一覧

#### 1. (改訂) ~/.claude/skills/explain-in-html/SKILL.md

- frontmatter description を v4 仕様に更新 (19 コンポーネント、6 ユースケース対応明記)
- Step 2 拡張: Thariq 6 ユースケース判定 (audit / plan / research / dynamic / dashboard / explainer) を追加
- **Step 3.5 新設: Interaction Layer Injection** — TOC / copy-btn / copy-prompt-bar / slider-control / filter-table / anno-code の採用判定
- Step 5 (自己診断) を identity test 15 項目 → 20 項目に拡張 (v4 interactive 5 項目追加)
- Reference Navigation 表に新規 references 2 本追加
- Gotcha 末尾に v4 関連の 12 項目追加
- Last verified を `2026-05-28 (v4 Warm Paper · Interactive へ移行)` に更新

#### 2. (改訂) ~/.claude/skills/explain-in-html/templates/base.html (591 → 1289 行)

**CSS 追加 (13+ 新規 class)**:

- `.scroll-progress` — 上端 1px terracotta バー
- `.toc` / `.toc-list` / `.toc-link` / `.toc-toggle` — sticky sidebar 目次 (≥1100px sticky、≤1099px drawer)
- `details.collapsible` / `.collapsible-content` — 折り畳み (height transition、`<details>` ベース progressive enhancement)
- `.copy-btn` / `.copy-btn.copied` — clipboard ボタン (terracotta outline pill + teal checkmark feedback)
- `.copy-prompt-bar` / `.copy-prompt-bar.copied` — footer 固定帯
- `.severity-badge` + 7 modifiers (`crit` / `high` / `med` / `low` / `info` / `pass` / `harmless`) — standalone severity badge
- `.anno-code` / `.anno-line` (`.diff-add` / `.diff-del`) / `.anno-margin` / `.anno-note` — inline 注釈付きコード
- `.diff-block` / `.diff-line.{add,del,ctx}` — レビュー用 diff 表示
- `figure.svg-diagram` / `.svg-legend` — inline SVG ラッパ
- `.filter-table` / `.filter-table-controls` / `.filter-input` / `.filter-chip` / `.sort-indicator` — 検索/ソート可能テーブル
- `.slider-control` / `.slider-output` / `.slider-formula` — 動的モデル可視化
- `.cover-page` — print 専用表紙
- `:focus-visible` — キーボード操作対応
- `@media (prefers-reduced-motion: reduce)` — モーション抑制
- `@media print` — Warm Cream 地に warm dark brown 本文 (反転だが accent 色維持)

**インラインJS 7 関数 (~4KB)**:

1. `initCopyButtons()` — `navigator.clipboard.writeText` + fallback
2. `initCopyPromptBar()` — `<title>` + `<h1>` + section を markdown 風に組み立て clipboard へ
3. `initTOCScrollSpy()` — IntersectionObserver で active link 切替
4. `initFilterTables()` — input/chip による絞り込み + th ソート (data-attr ベース)
5. `initSliders()` — whitelist 正規表現 `^[\d\s+\-*/().x]+$` 通過後に `Function()` 評価
6. `initCollapsibles()` — `<details>` の native 動作 + height transition 補助
7. `initScrollProgress()` — `requestAnimationFrame` throttle で `scaleX` 更新

**font-family 強化**:
- Body: `'Zen Kaku Gothic New', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Meiryo', sans-serif`
- Display: `'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', 'Hiragino Maru Gothic Pro', 'YuKyokasho', 'Yu Gothic UI', sans-serif`
- Mono: `'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace`

#### 3. (改訂) ~/.claude/skills/explain-in-html/references/aesthetic-identity.md

- 新章「Font loading」追加 — fallback chain 強化、font-display:swap の根拠、preload 不採用理由
- 新章「Interaction states」追加 — hover/focus-visible/active/.copied 状態の identity 定義
- 新章「Print identity」追加 — Warm Cream 反転 + accent 色維持 + cover-page 仕様
- Identity test 15 項目 → 20 項目 (v4 interactive 5 項目追加)
- 美学系譜に v4 を追加 (v3 → v4 は純粋追加、palette 不変)

#### 4. (改訂) ~/.claude/skills/explain-in-html/references/component-library.md

- v3 既存 11 コンポーネント維持、v4 新規 8 コンポーネント追記 (No.12-19)
- 既存 `.data-table` → `.filter-table` への昇格基準明記 (>10 行 or 比較軸 >3)
- 既存 `.code-block` → `.anno-code` への昇格基準明記 (5 行以上 + 解説必要)
- 既存 `.verdict-row .severity` 4 段階 → 7 段階に拡張、`.severity-badge` standalone 化
- Selection matrix に Thariq 5 大ユースケース行追加
- Composition checklist に v4 interaction layer 判定項目追加
- Composition anti-patterns に v4 関連 8 項目追加

#### 5. (新規) ~/.claude/skills/explain-in-html/references/interaction-patterns.md

9 章構成の JS パターン仕様書:
- Why inline vanilla JS (採用/不採用理由、5KB予算)
- Pattern 1-7: 各 JS 関数の擬似コード + HTML 例 + 失敗時挙動
- Accessibility (キーボード操作、ARIA、`prefers-reduced-motion`)
- CSP notes (fail-soft 設計、`'unsafe-inline'` 前提、CSP strict 環境での降格挙動表)

#### 6. (新規) ~/.claude/skills/explain-in-html/references/use-case-templates.md

6 ユースケース (audit / plan / research / dynamic / dashboard / explainer) の骨格テンプレ集:
- 各ユースケースで「想定読み手と目的」「推奨コンポーネントセット」「骨格 outline」「例トピック」「Anti-patterns」を明記
- ユースケース判定フロー (Step 2 で使用) を末尾に
- v4 component-library との対応表

#### 7. (新規) .docs/plans/2026-05-28-explain-in-html-upgrade.md

設計 plan ファイル (frontmatter で status: completed、verification 結果も埋め込み)。

#### 8. (新規・検証用) .docs/output/explain-in-html/260528_thariq-html-5-pillars.html (1381 行、49KB)

実機検証用に生成した HTML。 explainer ユースケースで、TOC + scroll-progress + cover-page + collapsible + severity-badge 7 段階を投入。

### 実機検証結果

20 項目 identity test を機械検証 (grep ベース):

| 観点 | 期待 | 実測 | 結果 |
|---|---|---|---|
| placeholder 残存 (`{{`) | 0 hit | 0 hit | ✅ |
| NEVER use 色 (#ffffff/#000000/#3b82f6/#a855f7/#dc3545/#f44336) | 各 0 hit | 各 0 hit | ✅ |
| NEVER use フォント (Inter/Roboto/Arial) | 各 0 hit | 各 0 hit | ✅ |
| Zen Maru Gothic | ≥1 hit | 9 hit | ✅ |
| Zen Kaku Gothic New | ≥1 hit | 4 hit | ✅ |
| JetBrains Mono | ≥1 hit | 32 hit | ✅ |
| --copper (terracotta) | ≥1 hit | 77 hit | ✅ |
| --moss (teal) | ≥1 hit | 20 hit | ✅ |
| #1c1a17 (warm dark brown) | ≥1 hit | 1 hit | ✅ |
| #f3ede1 (ivory) | ≥1 hit | 1 hit | ✅ |
| dot pattern | ≥1 hit | 1 hit | ✅ |
| JST timestamp | ≥1 hit | 4 hit | ✅ |
| .toc nav | 1 | 1 | ✅ |
| scroll-progress | ≥1 | 4 | ✅ |
| cover-page | ≥1 | 5 | ✅ |
| details.collapsible | ≥1 | 3 | ✅ |
| severity-badge | ≥1 (7 段階表示) | 17 | ✅ |
| inline script | 1 | 1 | ✅ |

ブラウザで `open` 確認済。

## 設計意図

### なぜ v3 美学を完全維持したか

memory `feedback_spidey-aesthetic-scope-explain-in-html-only.md` の方針 (美学固定は explain-in-html 専用 identity、scope creep 禁止) を厳守。Thariq referenceは「機能・構造」を取り込むためのもので、美学方向性の変更ではない。Warm Paper の terracotta + teal + 丸ゴシック + ドット方眼は LLM デフォルト出力に存在しない unique pair であり、その独自性こそが AI slop 回避の核心。

### なぜ既存 class 名を変えず、新規 class のみ追加したか

過去出力 HTML (`.docs/output/explain-in-html/` 内の v3 ファイル群) を再生成不要にするため。各 HTML は独立 self-contained で生成時の美学を凍結保持する性質を持ち、後から開いても視覚崩壊しない設計を維持した。

### なぜ vanilla JS (framework なし) か

Thariq の self-contained 原則を最大限尊重。framework (React/Vue/Alpine 等) は build 必須または CDN 依存になり、「リンク 1 本でブラウザに開いたら即動作」を損なう。inline JS は ~4KB で全機能カバー、CSP strict 環境では JS が止まるが HTML/CSS は通常表示 (fail-soft)。

### なぜ Google Fonts CDN を維持したか

Hiragino fallback は macOS 限定、Windows/Linux 環境では「丸み」identity が失われる懸念。Google Fonts CDN 維持 + fallback chain 強化 (Yu Gothic UI / Meiryo 追加) で、CDN 切断時も「丸ゴシック近似」フォントに段階降下するよう設計。`font-display: swap` 維持で FOIT を回避、FOUT を許容。

### なぜ 5KB JS 予算を設けたか

「美学固定 skill」の枠を超えないため。framework なしの vanilla JS なら 7 関数で 4KB に収まる。これ以上は機能追加よりも削減を優先する budget。

## 副作用

### 既存 v3 出力 HTML は古い美学のまま

過去の `.docs/output/explain-in-html/` 内の v3 ファイルは v4 美学に自動更新されない (放置で履歴的価値あり)。camone が個別に依頼した時のみ v4 で再生成する方針 (plan §6 に明記)。

### inline JS 5KB は将来膨らむ可能性

新機能追加で 8KB を超えると skill の趣旨を逸脱する。Gotcha と budget で明示済だが、将来のアップグレードで monitor 必要。

### CSP strict 環境 (Slack web 等) では interactive 機能が動かない

fail-soft 設計で HTML/CSS は維持されるが、copy-btn / filter-table / slider 等は操作不能になる。Gotcha と interaction-patterns.md に明記済。

### Google Fonts CDN 切断時は美学体験が劣化

fallback chain 強化で「丸ゴシック近似」までは段階降下するが、Zen Maru Gothic そのものではない。

## 関連ファイル

- `~/.claude/skills/explain-in-html/SKILL.md` — 改訂 (description + workflow + identity test + Gotcha)
- `~/.claude/skills/explain-in-html/templates/base.html` — 改修 (591 → 1289 行)
- `~/.claude/skills/explain-in-html/references/aesthetic-identity.md` — 改訂 (3 章追加 + identity test 20 項目化)
- `~/.claude/skills/explain-in-html/references/component-library.md` — 改訂 (11 → 19 コンポーネント)
- `~/.claude/skills/explain-in-html/references/interaction-patterns.md` — 新規 (JS パターン仕様書、9 章)
- `~/.claude/skills/explain-in-html/references/use-case-templates.md` — 新規 (6 ユースケース骨格テンプレ)
- `.docs/plans/2026-05-28-explain-in-html-upgrade.md` — 設計 plan (status: completed)
- `.docs/output/explain-in-html/260528_thariq-html-5-pillars.html` — 実機検証用 HTML (1381 行、49KB、20 項目 identity test 全 pass)

## 学び (Gotcha候補)

- **cp で新規作成したファイルは Edit tool が「未読」扱い**。最初に Read してから Edit する必要がある。複数 Edit を投げる前に Read 必須
- **font-family 強化は replace_all で安全に一括置換**。パターン A `'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif` とパターン B `'Zen Maru Gothic', sans-serif` は互いに subset でないので、それぞれ replace_all 可能
- **v3 既存 class 名は完全維持、v4 新規 class のみ追加**することで後方互換性を確保。`.data-table` → `.filter-table` は class 名差し替えではなく「上位互換として並列共存」
- **Plan agent の出力は memory に照らして取捨選択する**。今回は scope creep (README 追加等) を削除し、camone memory feedback_spidey-aesthetic-scope-explain-in-html-only に従って scope を skill 内に限定した
- **logging skill のデフォルトは local/ だが project CLAUDE.md が override する場合あり**。memory feedback_logging-shared-override-in-this-pj.md に従い、本プロジェクトでは直接 shared/ に書く
