---
title: Agent Teams 検証 - CHANGELOG v0.1.2 draft
type: knowledge
category: decisions
status: active
created: 2026-04-15
updated: 2026-04-15
rationale: "Agent Teams 並列実行の検証タスクとして、v0.1.2 CHANGELOG の draft を team-documenter が作成"
related_team: trilayer-v012-review
---

# Agent Teams 検証 - CHANGELOG v0.1.2 draft

## 本 draft の位置付け

本ファイルは three-elements-harness (trilayer) **v0.1.2** リリースに向けた CHANGELOG 候補 section の **draft** である。正式な `~/.claude/skills/three-elements-harness/CHANGELOG.md` への反映は **team lead の承認後** に行う (Scope boundary 節参照)。

参考フォーマットは既存 v0.1.1 section (`CHANGELOG.md` 冒頭) に準拠。

## [0.1.2] - planned

Patch リリース候補。`review-agent-essence` の残留指摘 5 件のうち、破壊的変更を伴わない **観測系 / 検証系 / frontmatter additive** の 3 件を反映する。**破壊的変更なし** (予定)。schema / validator の既存ロジックは変更せず、追加のみ。

### Phase 0: 契約明文化

- v0.1.2 の目的を **「観測手段と受容判定の追加」** に限定する
- 判断ロジック本体 (priority_rules DSL 評価器 / failure_replanner の spec 差分提案) は v0.2.0 に譲る
- contract change は frontmatter の additive のみ。v0.1.1 validator との後方互換完全維持
- v0.1.2 は **独立リリース** ではなく、v0.2.0 マイルストーンへの安全な踏み石として位置付ける

### Changed (予定)

- **`references/three-layer-contract.md`**: Agent Teams flag 有効時の Macro / Micro 並列実行証跡の残し方を Section として追記。v0.1.1 で独立化した Section 2.4 (Macro が team-\* を直接呼ばない原則) の補足として、並列実行時の不変条件を明文化
- **`references/manifest-schema.md`**: append-only フィールドの **読取時検証ルール** を schema 文書に追記 (T-2.3 統合判断を委任しない / #3 対応)

### Added (予定)

- **`scripts/validate-trilayer.py --check-append-only` オプション**: 既存 manifest の履歴 (git log) と現行値を照合し、削除・改変・順序入替を検出する検証モード。既存の semver / placeholder / enum 検査と並列で実行可能 (#3 対応)
- **`references/opus-fixed-kpi.md`**: Macro / Micro 両層を Opus 固定で運用する設計決定 (v0.1.0 §Design decision) の **KPI 定義**。検証指標 (判断精度 / 推論深度 / 失敗率) とサンプリング頻度を明記 (#4 対応)
- **`references/agent-teams-flag.md`**: Agent Teams flag (`settings.json` 側の並列実行 flag) を trilayer manifest 側でどう記録するかの方針。`execution_mode` additive field の採用理由と、flag 無効時の fallback 動作を明記 (#7 対応)

### Frontmatter additive fields (予定)

v0.1.2 で追加される frontmatter フィールド (optional / 既存 parser との互換性維持):

- `execution_mode`: string — `single | agent-teams` の並列実行モード記録 (#7)
- `team_id`: string — Agent Teams で動く際の team 識別子 (#7)
- `kpi_ref`: string — Opus 固定 KPI 文書への参照 (`references/opus-fixed-kpi.md#<anchor>`) (#4)

### Known limitations (v0.1.2 でも継続)

- **priority_rules の YAML DSL 評価器** は依然 v0.2.0 送り (v0.1.x は手動判断を維持)
- **failure_replanner の spec 差分提案機能** も v0.2.0 送り
- **Macro 自動再起動経路** (scheduler.enabled=true の実効化) も v0.2.0 以降
- macOS / Linux のみ対応 (Windows scheduler 層は見送り継続)

### Verification (予定)

- `python3 scripts/validate-trilayer.py --check-append-only` → **GREEN** であることをリリース条件に含める
- 既存 v0.1.0 / v0.1.1 の `.docs/trilayer/{manifest, macro-policies, status}.yml` に対する後方互換を確認
- EKP `validate-knowledge.py` への影響なし (skill 内部の references/ は走査対象外)

## Remaining review items の v0.1.2 / v0.2 仕分け

v0.1.1 で未対応の 5 件について、v0.1.2 (patch) と v0.2.0 (minor) のどちらで扱うか。判断基準は **破壊的変更の有無** と **判断ロジック本体への触手の有無**。

| #   | 項目                          | 対応バージョン | 理由                                                                                     |
| --- | ----------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| #1  | priority_rules DSL 評価器     | **v0.2.0**     | パーサ・評価器の実装は minor 相当の機能追加。v0.1.x の patch スコープを超える           |
| #3  | append-only 読取時検証        | **v0.1.2**     | 既存 validator への option (`--check-append-only`) 追加で実現可能。破壊的変更なし       |
| #4  | Opus 固定検証 KPI             | **v0.1.2**     | references/ への文書追加と frontmatter additive のみ。schema / 評価器は非変更            |
| #5  | failure_replanner spec 差分提案 | **v0.2.0**     | 設計書 §8 要決定事項との関連があり、判断ロジック本体の変更を伴う。minor 相当              |
| #7  | Agent Teams flag 記録         | **v0.1.2**     | frontmatter additive field (`execution_mode` / `team_id`) 追加のみ。既存 parser と互換 |

**v0.1.2 スコープ**: #3 / #4 / #7 (3 件 / 観測・検証・記録系)
**v0.2.0 スコープ**: #1 / #5 (2 件 / 判断ロジック本体)

この仕分けは v0.1.1 の「破壊的変更なし / 文書系のみ」の patch 原則を v0.1.2 でも踏襲する前提に基づく。team-lead が「#1 も v0.1.2 に前倒し」等の判断をした場合は本 draft を破棄し再生成が必要。

## Agent Teams 検証への言及

本 decision log 自体が **Agent Teams の物理並列実行検証の証跡** である。具体的には:

1. 本ファイル生成時、team-lead (main Claude) から **tester** と **documenter** が同一メッセージ内で同時 spawn された
2. tester と documenter は同一 team (`trilayer-v012-review`) に属しつつ、**別ファイルを独立に書く**
3. 相互ファイル干渉がないことは team role の scope boundary (5-Role Separation) によって構造的に保証される
4. 5-Role Separation の team-tester (RED) と team-documenter (doc) は責務が交差しない

上記が `references/three-layer-contract.md` Section 2.4 の「Macro が interactive モードでも team-\* を直接 Invoke しない (必ず `orchestrating-team-development` 経由)」原則と **独立して成立** する点を本検証で確認する。両原則は直交するため、並列 spawn が可能でも Macro 直接呼び出しは禁止されたまま。

脚注: 本 draft は skill `generating-doc-from-diff` の I/O contract (diff → doc) を、review-items → draft に **手順型として援用** した適用例である。情報源の優先順位 (コミットメッセージ / テスト / spec / blame / コード本体) のうち、本タスクでは **CHANGELOG.md v0.1.1 section** を最上位情報源として採用した。

## Scope boundary

- 本 draft は **提案段階**。正式な `~/.claude/skills/three-elements-harness/CHANGELOG.md` 編集は **team-lead による承認後**
- 本 draft 生成は `.docs/knowledge/decisions/` 配下のみへの Write に限定。**他の decision log / README / SKILL.md には一切触れない**
- 仕分け判断 (v0.1.2 vs v0.2) は team-documenter の推論であり、**最終判断は team-lead に委ねる**
- 本 draft 自体は trilayer の manifest / macro-policies / status には **影響しない** (skill 外部の decision log であるため)
- 並列実行中の姉妹 agent (tester) の生成物には **Read / Edit / Write いずれも行わない**
