---
date: 2026-07-20 09:18:56
type: study
topic: k-2-4-config-externalization-adoption-check
session: K-2.4 取り入れ確認 (取り入れフェーズ第3弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (K-2.4 = 1677〜1693行)
related_skill: [logging]
related_log_ids: [2026-07-20_k-2-3-observability-adoption-check, 2026-07-19_k-2-2-doc-structuring-adoption-check]
related_log: [.docs/logs/shared/2026-07-20_k-2-3-observability-adoption-check.md, .docs/logs/shared/2026-07-19_k-2-2-doc-structuring-adoption-check.md]
---

# K-2.4「ルールをコードに埋め込まず設定ファイルに分ける」取り入れ確認 — 判定: 取り入れ済み・改修見送り

> note K-2.4 の推奨 (方針の外部化 — 制御方針をコードから切り出し設定ファイルへ。diff/移植/監査/バージョン管理を可能にする。SKILL.md もその一形態) を `~/.claude` 実態と照合。**4層の外部化 (permissions 248本 / hook配線50本 / 方針データJSON 3本 / SKILL.md 71本+rules 11本) + git 管理で取り入れ済み**。「構造化文書の機械検証」は記事超え。note の例「テスト緑でなければ commit しない」の全体ゲート不在は**意図的見送りの記録済み判断** (05-30 gap 分析) であり gap ではない。K-2 系サブセクション (K-2.1〜K-2.4) はこれで全弾完了。

## 概要

取り入れフェーズ第3弾。記事 K-2.4 の推奨 (1677〜1693行、たとえ = レシピとオーブン):

1. **方針の外部化** — ワークフロー方針 (「計画フェーズではコードを編集しない」「テストが通らなければコミットしない」等) をコードにハードコードせず、設定ファイル (YAML等) へ切り出す
2. 外部化の利得 = **diff 一発で方針比較・移植・監査・バージョン管理**
3. **Skill/SKILL.md も方針の外部化の一形態** — 手順を変更しても runtime のコードは変わらない
4. 制御方針は「腐敗しやすい自由記述」でなく「**実行可能で検証可能な構造化文書**」として管理

照合は settings.json の機械集計・hooks/rules/ の実測・hook スクリプトの参照 grep で行った (2026-07-20)。

## 内容

### 照合結果: 方針の外部化は 4 層構造で実装済み

| 外部化の層 | 実体 | 実測値 (2026-07-20) | note との対応 |
|---|---|---|---|
| 権限方針 | `settings.json` permissions | **allow 41 / deny 177 / ask 30 = 248本** の宣言的リスト。例: `Bash(git push:*)` deny =「push はかいじゅうのみ」という運用方針が散文でなく設定 | 方針の外部化そのもの |
| 発火方針 | `settings.json` hooks 配線 | 10 イベント種・50本 — どの hook がいつ発火するか (matcher 含む) が設定側 | オーブン(スクリプト)とレシピカード(いつ焼くか)の分離 |
| 判定データ | `hooks/rules/*.json` 3本 (`hook_stop_words_rules.json` / `hook_pre_commands_rules.json` / `essence_gate_paths.json`) | **hook 4本が読む** (stop_words / pre_commands / essence_gate / worktree_bash_write_guard、grep で参照実証)。禁止語リスト・コマンド規則・対象パスという変更頻度の高い方針データがコードから分離 | レシピカードの本体 |
| 手順方針 | `skills/*/SKILL.md` 71本 + `rules/*.md` 11本 | 手順・応答方針の構造化文書。変更しても runtime (Claude Code 本体) は不変 | note が明示する「SKILL.md = 方針の外部化の一形態」 |

補助: 閾値等のパラメータは env seam で外出し (`HOOK_FIRE_REPORT_THRESHOLD` / `HOOK_FIRE_REPORT_INTERVAL` 等、fire_report ヘッダで実測済み) — default はコード内にあるが上書き可能。

### 利得 4 点 (diff / 移植 / 監査 / バージョン管理) の実装

- `~/.claude` 自体が git リポジトリ (remote = `github.com/kaijutale/claude-harness`、`git remote -v` 実測)。**方針変更 = commit/PR として diff レビューされる** — 「diff 一発で方針の違いが分かる」を毎日運用している
- 07-11〜07-19 の観測レビューシリーズは、まさに**方針 diff の監査**をセッション横断でやっていた実績 (変更履歴を C-1〜C-7 で批評)
- 移植: `establishing-knowledge-persistence` 等の skill が他プロジェクトへ方針一式を scaffold する仕組みを持つ

### 記事超え: 「検証可能な構造化文書」の機械強制

note は「実行可能で検証可能な構造化文書として管理する」と言うだけで、検証の実装までは求めない。ハーネスは構造化文書**自体を hook が機械検証**する:

- `hook_post_skill_frontmatter_schema` — SKILL.md の frontmatter を schema 検証 (計装済み hook 20本の一員)
- `hook_validate_claudemd` — CLAUDE.md のポインタ実在検証
- `hook_pre_commit_settings_churn_normalize` — settings.json 自体の変更を正規化 (設定ファイルの管理装置)
- hooks 回帰テスト 47 ケース

### note の例 2 つとの照合 (重要な但し書き)

- 「**計画フェーズではコードを編集しない**」→ Claude Code の Plan Mode (製品機能) + `hook_pre_plan_output_convention` (plan 出力規約、ExitPlanMode 発火は #124 で live 実証済み) — 方針が設定+hook として存在 ✓
- 「**テストが通らなければコミットしない**」→ **全体ゲートとしては不在。ただし gap ではなく意図的見送りの記録済み判断** (05-30 gap 分析で test/lint のグローバル deny は見送り — 学習サンドボックス等への一律適用が過剰なため)。テーマ特化の commit gate (adr gate / essence gate) は別途稼働中。「導入しない」という方針判断自体が記録されている点で K-2.2 (判断理由の永続化) と整合

### 残差判定

- 方針の一部 (env seam の default 値・判定ロジック本体) はコード側に残るが、**変更頻度の高い判定データは JSON 分離済み / 安定したロジックはコード側**という切り分けは合理的で、全量 YAML 化は過剰 (原則1「無駄な概念を登場させない」)。改修不要
- **判定: 取り入れ済み・改修見送り**。これで K-2 系 (K-2.1 Progressive Disclosure ✓ / K-2.2 3層構造+ADR ✓ / K-2.3 観測面 ✓ / K-2.4 方針外部化 ✓) 全弾完了

## 関連ファイル

- `.docs/references/260405_…/text.md` (1677〜1693行) — K-2.4 本文 (照合の基準)
- `~/.claude/settings.json` — permissions 248本 + hooks 配線 50本 (機械集計)
- `~/.claude/hooks/rules/` — 方針データ JSON 3本 (ls + 参照 grep)
- `~/.claude/rules/` 11本 / `~/.claude/skills/` 71本 — 手順方針の構造化文書
- `.docs/logs/shared/2026-07-20_k-2-3-observability-adoption-check.md` — 前弾 (K-2.3)
