---
date: 2026-05-10 08:42:25
type: work
topic: visualizing-as-html-skill-development
session: Claude Code Opus 4.7 (1M context)

# 移動しない参照
related_article: https://note.com/masa_wunder/n/nf4cf2e257da2?from=notice
related_skill: [visualizing-as-html, logging, authoring-skills, visualizing-article, changelog, article-explainer]

# 移動しうる参照 (path + ID ハイブリッド)
related_plan_id: zippy-cuddling-crab
related_plan: ~/.claude/plans/zippy-cuddling-crab.md
---

# visualizing-as-html skill の Phase 1 〜 Phase 3.5 段階的実装

> note 記事「Claude Code は Markdown より HTML 出力？！」の主張 (人間向け成果物は HTML) を skill 化。spec mode → general mode → pr mode と対応領域を段階拡大、Core Dogma + interaction + vertical rhythm まで仕込んで `/visualizing-as-html /logging` で本番起動成功。

## 概要

**目的**: note 記事 (Anthropic Claude Code チームの Thariq Shihipar による「The Unreasonable Effectiveness of HTML」を日本語要約・拡張した記事) の主張 — 人間向け最終成果物は HTML、AI ↔ AI は Markdown のハイブリッド運用 — を、汎用 skill として永続化する。

**背景**:

- 1M context window + Opus 4.7 でトークン単価差が誤差化、最適化軸が「トークン削減」→「人間の認知負荷削減」へ移動
- 記事の最小プロンプトテンプレ (6制約: self-contained / inline / 外部CDN禁止 / viewport+JP fonts / dark mode / a11y) を skill 化することで、毎回プロンプト書き直しの摩擦を消す
- skill/agent 定義の HTML 化からスタートし、汎用 MD/inline/PR URL まで段階的に拡張

**期待成果**: skill/agent 定義 + 5シーン (解説/レポート/サマリ/ダッシュボード/プロトタイプ) + GitHub PR の全てを `/visualizing-as-html <input>` 1コマンドで HTML 化できる体制。

## 内容

### Phase 1: spec mode 実装 (skill/agent 定義 → 1枚 HTML)

**作成物** (`~/.claude/skills/visualizing-as-html/`):

- `SKILL.md` (125行) — frontmatter + 責務境界 + workflow + Gotchas + Reference Navigation
- `references/html-template-spec.md` (318行) — HTML shell + palette/typography/a11y/wireframe/markdown rendering rules
- `references/resolver-rules.md` (125行) — 入力名 → ファイルパス解決ルール (5階層 + plugin find ベース)

**主要設計**:

- 入力 4分類: `<plugin>:<target>` / `/<name>` / `<file-path>` / inline content
- Resolver 検索順序: global skill → global agent → project skill → project agent → plugin (cache の `find` で柔軟解決、version directory 対応)
- 8px 左端 accent bar で type 識別 (skill=sky、agent=color フィールド mapping、plugin=slate)
- 共通インフラ DRY (palette / font / spacing / radius / type scale / a11y)

**demo 出力**:

- `output/skill-commit.html` (473行)
- `output/agent-code-reviewer.html` (260行)

### Phase 1 の self-reference バグと修正

**症状**: `/visualizing-as-html /orchestrating-team-development` 実行時に「Shell command permission check failed for pattern "!`<command>`": Unrecognized redirect shape」エラーで skill 起動が完全失敗。

**根本原因**: SKILL.md の Gotchas 節で `!`-syntax (bang + backtick + コマンド + backtick) を解説するために `` !`<command>` `` という literal を書いていた。Claude Code の preprocessor は skill 起動時に SKILL.md を読んで `!`-syntax を実コマンドとして実行するため、placeholder `<command>` を shell の input redirect (`<`) として誤解釈 → 不正な redirect shape でエラー。**自己参照の罠**。

**修正**: literal pattern を全て prose 記述に置換 (例: 「bang プレフィクス + バッククォート括りシェルコマンド形式」)。`!` の直後に backtick を置かない方針で全ファイル書き換え。

**永続記憶**: `~/.claude/projects/.../memory/feedback_skill-self-reference-bang-syntax.md` に保存、`MEMORY.md` インデックス更新。今後新規 skill 作成時に同種の罠を回避できるよう設計教訓として残した。

**検証**: `python3 -c "re.compile(r'!\`([^\`]+)\`')"` 全ファイル走査でヒット 0 を確認。

### Phase 2: general mode 追加 (任意 MD / inline → 1枚 HTML)

**追加対応**:

- input 5分類化 (URL 判定は Phase 3 で追加、Phase 2 では plugin/name/file/inline)
- general mode で content から layout を **AI 委任で content-driven 選択**:
  - 解説資料 (default、h2/h3 多数 + 段落主体)
  - レポート (KPI 表中心)
  - サマリ (timeline)
  - ダッシュボード (tile grid)
  - プロトタイプ (mockup 指示語)

**新規ファイル**:

- `references/general-mode-spec.md` (206行) — 入力分類 + layout 検出 heuristics + 5 layout テンプレ + metadata card 仕様

**設計判断**:

- かもね AskUserQuestion 結果: 「**1個の general mode 追加 (AI が content から layout 推測)**」を選択。5専用 mode に分けると skill 肥大化 + 分岐管理コスト増、article 思想 (内容に合うレイアウトを自分で選ぶ) と整合する High Freedom 案を採用。
- spec mode は完全 backward-compat (既存 `/commit` `/code-reviewer` 等は1文字も挙動変えず動作)

**demo 出力**: `output/main-points.html` (542行) — note 記事要約自身を general mode/解説資料 layout で render する完全 dogfood。

### Phase 3: pr mode 追加 (GitHub PR URL → 1枚 HTML)

**かもね質問発端**: 「PR とかもいけんの？例: `/visualizing-as-html PR-URL`」→ 当時は dispatch logic が URL を捌けず未対応、article 主張 (HTML が向く典型パターン第2項目「コードレビューまとめ」) のド真ん中なので Phase 3 として追加。

**追加対応**:

- input 5分類化に **URL 判定を最優先**で追加 (URL の `:` が plugin namespace 検出より前にスキップされないと誤分類されるため)
- `gh pr view <url> --json title,body,state,labels,author,createdAt,updatedAt,mergedAt,baseRefName,headRefName,additions,deletions,commits,files,reviews,comments,url,number` で1コマンド全データ取得
- PR layout (general-mode-spec.md §3.6 に追加): hero (state chip + labels) + META card + 4 sections (Description / Commits / Files Changed / Reviews & Comments)

**新規ファイル**:

- `references/url-fetch-spec.md` (143行) — URL detection 正規表現 / gh CLI コマンド / JSON フィールドマッピング / エラーハンドリング 5シナリオ / GHE 対応 / Phase 4 拡張余地

**設計判断**:

- 中庸案採用: シンプル案 (擬似MD → summary layout 流用) と リッチ案 (タブ + diff inline) の中間で、専用 PR layout を新設するが diff 本体は省略してサマリのみ。
- 3制約 例外: PR body 内 attached image (`user-images.githubusercontent.com`) のみ `<img src>` 直リンク許容 (Phase 4 で base64 inline 化検討)。

**demo 出力**: `output/pr-anthropics-claude-code-45866.html` (393行、後に Phase 3.5 で 505行に拡張) — anthropics/claude-code PR #45866 (MDM templates) を実 fetch して render。

### Phase 3.5: Core Dogma + interaction + vertical rhythm ポリッシュ

**かもね指摘発端**: 「いくつか html 作成してもらったけど **インタラクティブ (js) はない** のね」+「note 記事に参考になる Prompt があった、Prompt の内容・構成が skill の内容に参考になりそう」→ 2 改善方向 (interaction 拡張 + 記事 Prompt 6制約の skill 冒頭格納) を Phase 3.5 として吸収。

**A: Interactive 許可拡張**:

- `html-template-spec.md §9` を「JS 最小限 (dark/light + smooth scroll のみ)」から **interaction 許可拡張版** に書き換え
- 許可リスト: dark/light toggle / TOC active highlight / code copy ボタン / `<details>` 折りたたみ / **タブ切替** / smooth scroll / reduced-motion 尊重
- 禁止維持: 外部 CDN / framework / localStorage / form submission / eval / analytics

**B: Core Dogma セクション**:

- SKILL.md 冒頭に **「Core Dogma — 記事の最小 Prompt 6制約」** セクション追加 (~13行)
- 記事の最小プロンプト 6制約 (1ファイル / 外部禁止 / viewport+fonts / High Freedom layout / dark mode / a11y) を **絶対遵守ルール** として明文化
- 「思想層 (Core Dogma) → 実装層 (references/)」の DRY 役割分離が成立

**C: Vertical rhythm 改定 (詰め込み感解消)**:

- かもねフィードバック「セクション間の余白がもう少しほしい、詰め込んでる感」→ 8px grid で1段階昇格
- h2 上余白合計: 72px → **92px** (margin-top 56 + padding-top 36)
- p margin-bottom: 14px → **20px**
- code-block margin: 14px 0 18px → **24px 0 32px**
- hr margin: 28px → **40px**
- `html-template-spec.md §2` に「Vertical rhythm」subsection 追加で目安値を仕様化 (88-100px が記事系の心地よい範囲)

**Phase 3.5 demo 更新**:

- `pr-anthropics-claude-code-45866.html` (393 → 505行): 4タブ切替 (Description / Commits / Files / Reviews) + branch chip / commit hash クリックで copy + toast 通知
- `main-points.html` (542 → 654行): TOC active highlight (IntersectionObserver) + code copy ボタン x4 + toast

### 本番起動 1: `/visualizing-as-html /logging`

**実行**: `output/skill-logging.html` (712行 / 25KB) を生成。

**含めた要素**: 8 trigger chips + 4 spec sheet 行 + 12 h2 sections + 6 tables + 4 code copy ボタン + 5 auto-inject 装飾 + 1 WARN block。Phase 3.5 全機能フル装備。spec compliance 全クリア (禁止全0 / 必須全1+)。

### 本番起動 2: `/logging` (このログ自身)

CLAUDE.md project override により `.docs/logs/shared/` に直接書き込み (通常 skill のデフォルトは local/、本プロジェクトのみ shared に保存し Git 追跡対象とする方針)。

## 設計意図

### 1. 「思想層」と「実装層」の分離 (Core Dogma + references/)

skill 起動時に AI が真っ先に読む位置 (SKILL.md 冒頭) に Core Dogma 6制約を置くことで、Phase 4 以降で大改修が入っても **絶対動かない錨** として 6制約を保持。実装層 (references/) は具体的な palette / spacing / wireframe を持つが、これは Core Dogma 6制約の「実装具体例」に過ぎないという階層化。

### 2. mode 拡張は「dispatch logic + 専用 layout 追加」の2段階

新 mode 追加 (general → pr → 将来 issue/任意URL) は (a) dispatch logic に分類分岐を追加 + (b) general-mode-spec.md に layout 仕様を追加、の2段階で完結する設計にした。**Workflow Step 1〜5 の骨格は維持** されるため、新 mode 追加で skill 全体が肥大化しにくい。

### 3. URL 判定を dispatch 最優先に置く

`https://...` は `:` を含むため、plugin namespace 検出 (`<plugin>:<target>`) より前にスキップしないと誤分類される。Phase 3 設計時に「URL 判定が最優先」を resolver-rules.md と SKILL.md Workflow Step 1 で明示し、将来の input type 追加時にもこの順序が前提になるよう仕様化。

### 4. 自己参照の罠を memory feedback として永続化

Phase 1 の `!`<command>`` literal バグは「skill 内で skill 自身の syntax を documenting する」自己参照型 prompt injection。今後新規 skill 作成時に同じ罠にハマらないよう、`feedback_skill-self-reference-bang-syntax.md` に「**literal パターンを書かず prose 記述する**」「**完全パターンは regex `!\`[^\`]+\`` で機械検証**」を保存。

### 5. PR mode の image 例外を明示的に「3制約の例外」と記録

外部CDN禁止という Core Dogma §2 を厳格に守ると PR body 内の `user-images.githubusercontent.com` が壊れる。完全 self-contained 化には base64 inline が必要 (Phase 4 候補) だが Phase 3 では「**例外として直リンク維持**、teammate が GitHub login 済前提」という妥協を明記。例外を明示することで「制約を破った理由」が後追い可能。

## 副作用

### 既知の課題 (Phase 4 候補)

- **PR body 内 image の base64 inline 化**: 完全 self-contained 化、現状は teammate が GitHub login 済前提
- **GitHub Issue / Discussion / 任意 URL 対応**: 現 Phase 3 では PR のみサポート、Phase 4 で `/article-explainer` 委譲 or 自前 fetch 拡張
- **巨大 PR の `--full` flag**: 100+ files / 100+ commits の超大型 PR で全件表示オプション
- **GitHub Enterprise URL の正規表現拡張**: 現 `github.com` 限定、Phase 4 で `github\.[^/]+` に
- **layout 誤判定時の `--layout=` flag override**: heuristic 検出が境界 content で迷う場合の人間介入

### `.docs/output/` の前バージョン demo が消失していた現象

skill-logging.html を生成した時点で、Phase 1〜3.5 で作った skill-commit.html / agent-code-reviewer.html / main-points.html / pr-anthropics-claude-code-45866.html が `.docs/output/` から見えなくなっていた。harness の checkpoint 機能、または環境クリーンアップの影響と推測。再生成は `/visualizing-as-html /commit` 等の各コマンドで可能。

### skill 全体のサイズ拡大

- Phase 1 終了時: 568 行 (3 files)
- Phase 3.5 終了時: 1209 行 (5 files、SKILL.md 209 / html-template-spec.md 442 / general-mode-spec.md 288 / url-fetch-spec.md 143 / resolver-rules.md 127)
- authoring-skills の「hub thin / spoke thick」原則準拠 (SKILL.md は 209行 = 500行制限の半分以下、references で詳細を分散)

## 関連ファイル

### skill 本体 (`~/.claude/skills/visualizing-as-html/`)

- `SKILL.md` (209行) — Core Dogma + 責務境界 + Workflow 5 ステップ + Gotchas + Reference Navigation
- `references/html-template-spec.md` (442行) — HTML shell + palette/font/spacing/radius/type scale + Vertical rhythm + a11y + markdown rendering + JS interaction 許可リスト + Anti-patterns + General Mode Reference
- `references/general-mode-spec.md` (288行) — 入力分類 + layout 検出 heuristics + 5+1 layout テンプレ (解説資料 / レポート / サマリ / ダッシュボード / プロトタイプ / PR) + metadata card + inline 制約
- `references/url-fetch-spec.md` (143行) — URL detection / gh CLI コマンド / JSON マッピング / エラーハンドリング / GHE / Phase 4 拡張余地
- `references/resolver-rules.md` (127行) — spec mode 専用 resolver、5階層 + plugin find ベース

### plan ファイル

- `~/.claude/plans/zippy-cuddling-crab.md` — Phase 1 → Phase 3 の段階的計画ログ (Phase 3 計画状態で停止、Phase 3.5 と本番起動は plan 化していない)

### 永続記憶

- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-self-reference-bang-syntax.md` — `!`-syntax 自己参照の罠と回避策
- 同 `MEMORY.md` — 上記へのインデックス追加

### プロジェクト内成果物 (`.docs/output/`)

- `main-points.md` — note 記事の要点まとめ (skill 化前の元情報、Phase 2 demo の入力にもなった)
- `skill-logging.html` (712行) — 直近の demo 出力、Phase 3.5 全機能適用版
- (過去 demo は harness checkpoint で消失、必要なら再生成可能)

### プロジェクト CLAUDE.md

- `.claude/CLAUDE.md` — 「`/logging` skill の保存先を `.docs/logs/local/` から `.docs/logs/shared/` に override」ルール (本ログ作成の根拠)

### 元情報

- note 記事: https://note.com/masa_wunder/n/nf4cf2e257da2?from=notice
- Anthropic Thariq Shihipar「The Unreasonable Effectiveness of HTML」(原典、本記事の元ネタ)
