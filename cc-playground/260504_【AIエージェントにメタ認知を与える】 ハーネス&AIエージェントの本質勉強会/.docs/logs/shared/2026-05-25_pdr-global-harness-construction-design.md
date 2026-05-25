---
date: 2026-05-25 09:42:00
type: qa
topic: pdr-global-harness-construction-design
session: PDR グローバル構築 plan 策定セッション

related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill: [pickup, logging, handoff, bootstrapping-project-identity, project-domain-reviewer-fork, project-essence-orchestrator]

related_plan_id: 2026-05-25-pdr-global-harness-construction
related_plan: .docs/plans/2026-05-25-pdr-global-harness-construction.md
related_log_ids: [2026-05-07_identity-scaffold-reviewer-plan, 2026-05-18-session-n8-phase-a-and-pdr]
---

# PDR (プロジェクトドメインレビューア) を ~/.claude/ に正しく構築する — 設計セッション

> 学習PJ `.claude/` に誤配置された PDR 系を、note出典に立ち返って監査。「単純移設NG、de-projectize + グローバル化 + 重複排除」と結論し plan 外部化。グローバルPDR = ドメイン知識ゼロの汎用機構という原則を確立。実装は未着手 (Phase 0 Open Decision 3件が次の判断)。

## 概要

**背景**: pickup で前回 in_progress (essence-doc PR駆動フロー Phase 1/2) を復元中、未commit の `.gitignore` 変更 (`.claude/*`+whitelist → `.claude/` 一括ignore) を検出。handoff に記録なし。

**camone の方針提示**: この whitelist で PDR系を本学習PJに追跡したのは過去Claudeの誤り。PDR (project-identity / project-domain-reviewer) は学習PJでなく `~/.claude/` に作るべきだった。plan立てて作り直す。

**わたしの初動ミスと camone の指摘**: 中身を読まず「machine固有path無し → 移設可能」だけで移設推奨 → camone「単純に場所を移動で解決なのか？中身を確認していない。僕は疑う」。これは正当。「動く(移せる)≠最善」を自分で破った。

**目的**: note出典に立ち返り PDRの本質を理解 → 中身監査 → plan策定 → handoff更新。

## 内容

### Step 1-2: note の本質理解 / PDRの正体

- note記事 (masa_wunder) 全32ページ + excalidraw + Meta-Harness論文 (arXiv:2603.28052) 要旨を読了。
- **PDR = セクション3「複数レビューアの活用」の3レビューア (UI/プロジェクトドメイン/ハーネス) の1つ**。担当 = プロジェクト固有ルール遵守確認。
- 設計根拠 = セクション2「本質ドキュメント vs プロジェクトアイデンティティ — 2つのドキュメントを混ぜない」+ Q&A「原理原則(本質)とプロジェクト固有知識(アイデンティティ)は分けて管理。本質には普遍的真実のみ、固有ルールは別のドメイン知識ドキュメント」。
- レビューアには両方渡すが**ファイル自体は分割**が望ましい (note明言)。

### Step 3: 中身監査 (Findings)

| # | severity | Finding | 対処 |
|---|---|---|---|
| F1 | 🔴 | `project-domain-reviewer.md` L45-52 に本学習PJ固有 identity (UI制作しない/Claude Only/Opus固定 等) がハードコード | de-projectize: runtime で `.docs/identity/` から導出 |
| F2 | 🟠 | project版scripts 3/4が global `essence-reviewing-orchestrator/scripts/` と完全一致 (`init-progress.sh` のみ差分=永続化dir名) | global 再利用、重複排除 |
| F3 | 🟡 | 4領域 `project-essence-orchestrator` が既存3領域 `essence-reviewing-orchestrator` と二重化 | 併存方針を人間判断 |
| F4 | 🟢 | PDRロジックは健全 (I/O契約/observability/進捗JSON/反インフレ/!構文の決定論注入) | 作り直し不要、的を絞った是正 |
| F5 | 🟢 | 本PJに `.docs/identity/` 実在 (charter/harness/skill、ui無) = 実テスト台。`bootstrapping-project-identity`(global)が入力生成 | end-to-end検証がこのPJで可能 |

→ **結論: 単純移設でなく relocate + de-projectize(F1) + de-duplicate(F2) + orchestrator方針確定(F3)**。コンセプト/実装の大半は健全 (F4) なので teardown しない。

### Step 4-5: plan外部化 + handoff更新

- `.docs/plans/2026-05-25-pdr-global-harness-construction.md` (status: planning) に Phase0-4 + Findings + 確定判断 + 残論点 + 制約。
- handoff status を planning に。related_plan を PDR plan に、essence-doc フローは related_plan_deferred で保留明示。

### 追加Q&A 1: グローバル汎用性をどう担保するか

**camone の懸念**: PDR はPJ固有のドメイン知識を見るのに、グローバルハーネス (汎用でなければならない) としてどう構築する？

**応答 — 中核原則「グローバルPDR = ドメイン知識ゼロの汎用機構」**:
- グローバル (`~/.claude/`) に置くのは**レビューの仕組み (ロジック)** だけ: identity読込 / マトリクス構築 / severity適用 / 反インフレ / fork隔離 / observability。
- ドメイン知識 (固有ルール本体) は100% project-local `.docs/identity/` に置き、PDR は起動時に cwd から読むだけ。
- 既存グローバル essence reviewer と同型: `harness-essentials-reviewer` が8原則をハードコードせず `~/.claude/.docs/essence/harness-essentials.md` を読むのと同じ。違いは評価基準ファイルの置き場所のみ (essence=グローバル1部/普遍、identity=PJごと/固有)。
- F1 de-projectize はまさにこの原則違反 (本PJ identity 混入) をゼロにする作業。
- **severity calibration の置き場所3層**: (a) グローバルhardcode ❌現状 / (b) 汎用カテゴリ+runtime identity導出 ⭕推奨 / (c) severity判定もidentityに宣言 ◎最クリーンだが schema変更要。

### 追加Q&A 2: なぜ `identity` というディレクトリ名か

**camone の問い**: identity という名前の意図は？

**応答 (出典は `.docs/identity/README.md` に明文化済、わたしの今回命名ではない)**:
- 出典 = note の用語「プロジェクトアイデンティティ」+ 既存グローバル skill `bootstrapping-project-identity`。
- 意図 = **essence (不変の本質) と対をなす概念ペア**。essence=「数学の公式のように不変で誰が見ても正しい原理原則」、identity=「このPJは何で、何を選んだか (時代・好みで変わってよい)」。
- 中身 (project-charter / harness-identity / skill-identity) は**選択・自己定義**であって問題領域の事実知識ではない → `domain`/`knowledge` より `identity` が忠実。
- **発見した不一致**: reviewer=`project-DOMAIN-reviewer` / dir=`identity` で名前が割れている。note自身が両用語使用 (セクション2「アイデンティティ」/ セクション3「ドメインレビューア」/ Q&A「ドメイン知識ドキュメント」) を継承。統一するなら dir改名でなく reviewer を `project-identity-reviewer` に寄せる方が筋。plan の naming Open Decision に追記。

### 日付ミスの是正

- plan/handoff を旧handoff (前回2026-05-22セッション) の日付のまま書いていた。実際の本セッションは **2026-05-25**。plan ファイル名・frontmatter・body・handoff・memory の該当日付を 2026-05-25 に修正 (別planの実ファイル名 `2026-05-22-essence-doc-pr-driven-flow.md` は本当に5/22作成なので不変)。

## 関連ファイル

- `.docs/plans/2026-05-25-pdr-global-harness-construction.md` — 本セッション成果の plan (status: planning)
- `.claude/handoff-state.md` — status: planning に更新 (gitignored)
- `.docs/references/sources/pdf/260404_*.pdf` — note記事本体 (PDR出典)
- `.docs/identity/README.md` — identity 命名意図の出典 (essence との対概念)
- `.claude/agents/project-domain-reviewer.md` — F1 de-projectize 対象 (移設元)
- `.claude/skills/project-{essence-orchestrator,domain-reviewer-fork}/` — 移設元 (Phase 3 で untrack 予定)
- `~/.claude/projects/.../memory/feedback_audit-content-before-relocating-harness-component.md` — 本セッションのフィードバック永続化 (移設判断は中身監査してから)
