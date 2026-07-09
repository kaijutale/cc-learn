---
date: 2026-07-09 13:56:16
type: work
topic: rules-progressive-disclosure-plan
session: rules/ PD化計画の設計意見・paths仕様裏取り・PD系issue棚卸し

related_article: https://github.com/kaijutale/claude-harness/issues/110
related_skill: [pickup, explain-in-html, logging]
related_agent: [claude-code-guide]

related_log_ids: [2026-07-08_claude-md-60line-rules-paths-and-handoff]
related_log: [.docs/logs/shared/2026-07-08_claude-md-60line-rules-paths-and-handoff.md]
---

# rules/ Progressive Disclosure 化計画 — issue #110 への設計意見と paths 仕様の裏取り

> issue #110 (rules/ の paths 化) にいきなり着手せず計画を先行。公式仕様の裏取りで「paths は Read 時のみ発火・Write 非発火」が判明し、原案 26 行削減 → Tier A 13 行先行 + Tier B は hook 併用へ分離する意見を HTML 化した。

## 概要

前セッション (2026-07-08) で起票した issue #110「全 rules/ を精査し PD 系統に paths frontmatter 付与」について、かいじゅうの指示で実装前の計画フェーズを実施。設計意見を explain-in-html で外部化し、あわせて #99 の close 判定と PD 系 issue の棚卸しを行った。

## 内容

### 1. paths frontmatter 仕様の裏取り (claude-code-guide agent)

公式ドキュメント (code.claude.com/docs/en/memory.md) + GitHub issues を調査させた結果:

| 項目 | 判明内容 |
|---|---|
| 構文 | YAML 配列 glob、brace expansion 可 (記載あり) |
| 発火条件 | **マッチするファイルの Read 時のみ**。Write/Edit では発火しない (anthropics/claude-code #23478) |
| 起動時消費 | paths 付きは起動時に載らず遅延注入 |
| glob 解決基準 (グローバル rule) | **公式記載なし** — project root 基準か home 基準か不明 |
| git worktree での挙動 | **公式記載なし** |
| subagent への注入 | **公式記載なし** |
| paths: の信頼性 | 一部構成で効かず undocumented な `globs:` のみ動く報告 (#17204) |

### 2. 設計意見 (issue #110 原案からの修正 5 点)

- **削減幅を 26 行 → 13 行に半減**: 成立するものだけ正直に見積もる
- **Tier A (paths 化 3 本 13 行)**: frontend-aesthetics / build-test-protocol / harness-modification-policy
  - build-test-protocol の glob はテスト限定 → **コード全域** (`**/*.{ts,tsx,js,jsx,mjs,cjs,py,go,rs,sh}`) へ拡大。テストを読まぬセッションこそ検証をサボるため、門をテストファイルに置くのは本末転倒
  - harness-modification-policy の glob は `~/.claude/**` (home 絶対) → **リポジトリ相対レイアウト** (`{skills,agents,hooks,essence,rules}/**`) へ。glob 解決基準が未文書 + worktree で home 絶対は不発の恐れ
- **Tier B (保留 2 本 13 行)**: plan-workflow / research-phase は「新規ファイルの書き先を指示する rule」で、Write 非発火の仕様と構造的に矛盾 (鶏卵問題)。当面注入維持、恒久策は ExitPlanMode への PreToolUse hook 等の決定論注入を別 issue で設計
- **核 84 行は死守** (decisive-answers 31 / command-handoff 27 / multi-agent-safety 12 / critical-thinking-checklist 11 / citation-format 3) — 原案どおり
- **Phase 0 (実測検証) を必須ゲート化**: worktree + `CLAUDE_CONFIG_DIR` 隔離で合言葉入り canary rule を置き、(a) 起動時不注入 (b) マッチ Read で注入 (c) Write 単独で不注入 (d) paths: が自環境で効くか (e) subagent 継承 を観測可能な挙動で確認

実装フェーズ: Phase 0 実測 → Phase 1 Tier A 適用 (1 rule = 1 コミット、PR + HITL) → Phase 2 Tier B の hook 併用設計 (別 issue) → Phase 3 数セッション観測・調整。

### 3. issue 棚卸し

- **#99 close**: 「CLAUDE.md 60 行の地図」例示スケッチは #94 v3 に完全包含 (per-section スタブ形式は #94 で却下・集約 References 採用済み) と判定 → duplicate として close 済み
- **PD 系 OPEN issue は #94 (CLAUDE.md 本体) と #110 (rules/) の 2 本のみ** (全 issue のタイトル + 本文検索で確認)
- **隣接 issue #93 に注意**: PD 系ではないが Phase 1 で rules/ に新 rule を追加する計画 (probe-before-persist)。rules/ の起動時注入量を増やす方向で #110 と相互作用 → #110 実装時に同じ基準 (核か paths 化か) で仕分けること

## 設計意図

- 前セッションでツール結果の捏造が多発した反省から、本セッションは「推測で glob を書かない」を徹底 — 公式仕様の裏取りを agent に委譲し、適用前の Phase 0 canary 実測 (合言葉方式 = 観測可能な挙動での判定) を計画の必須ゲートに置いた
- 原案のまま 5 本一括適用すると plan-workflow / research-phase が「いちばん効いてほしい場面 (新規作成の直前) で確実に不在」になる静かな死を踏むところであった。paths の発火条件 (Read のみ) と rule の役割 (書く前に効くべきか) の適合判定が仕分けの本質

## 副作用

- Tier A 適用後も「既存ファイルを一切 Read せず新規 Write する」ケースでは rule 不在の隙間が残る (常駐 skill description で補完、Phase 3 で頻度観測)
- `paths:` が効かないバージョン報告 (#17204) があるため、canary 結果次第で undocumented `globs:` 併記の判断が必要になりうる

## 関連ファイル

- `.docs/output/explain-in-html/260708_rules-progressive-disclosure-plan.html` — 本計画の設計意見 HTML (仕分け表・Tier カード・フェーズ計画・リスク)
- `.docs/research/progressive-disclosure-adoption-rationale.md` — PD 採用根拠の横断調査 (前セッション作成)
- https://github.com/kaijutale/claude-harness/issues/110 — 実装タスク原案 (本計画で v2 化候補)
- https://github.com/kaijutale/claude-harness/issues/94 — 親 issue (CLAUDE.md 60 行化 v3)
- https://github.com/anthropics/claude-code/issues/23478 / https://github.com/anthropics/claude-code/issues/17204 — paths の既知制限
