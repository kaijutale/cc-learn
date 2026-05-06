---
date: 2026-05-07 00:34:45
type: work
topic: identity-scaffold-reviewer-plan
session: essence-aware reviewer subagent 設計準備
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill: [logging, handoff]
related_agent: [Explore, Plan]
related_plan_id: subagent-team-harness-essentials-md-har-binary-feigenbaum
related_plan: /Users/camone/.claude/plans/subagent-team-harness-essentials-md-har-binary-feigenbaum.md
related_log_ids: [2026-05-06_essence-docs-v1-creation]
related_log: [.docs/logs/shared/2026-05-06_essence-docs-v1-creation.md]
---

# essence と identity の対応設計 + reviewer subagent 計画

> essence/ (グローバル不変原則) と1:1対応する identity/ ディレクトリを本プロジェクトに試作。命名衝突 (`agent` vs `agents/`) を発見し、領域別 reviewer subagent 新規作成 plan を確定。/handoff まで完了。

## 概要

`~/.claude/.docs/essence/` v1.0 (2026-05-06作成、3領域の不変原理原則) に対して、本プロジェクトで「プロジェクトアイデンティティ」を試作するセッション。

試作の過程で2つの問題が発覚:
1. essence の `agent-essentials.md` の "agent" が `~/.claude/agents/` ディレクトリと意味衝突
2. PDF原則「各領域に専用レビューア」が essence v1.0 では宣言のみで未設置

これらの解決として、`agent` → `harness` へのリネーム + 領域別 reviewer subagent 3つの新規作成 plan を策定。実装は次セッション (/pickup 後) で行う。

## 内容

### 1. identity/ ディレクトリ4ファイル新規作成 (`<PJ>/.docs/identity/`)

- `README.md` — essence と identity の対応関係宣言、育て方、アンチパターン
- `project-charter.md` — このプロジェクトの自己定義 (目的・スコープ・必須参照PDF)
- `agent-identity.md` — essence/agent 8原則 ↔ プロジェクト選択 1:1対応 (次セッションで `harness-identity.md` にリネーム予定)
- `skill-identity.md` — essence/skill 8原則 ↔ プロジェクト選択 1:1対応
- `ui-identity.md` は意図的に作らず README で「N/A」明示 (本プロジェクト UI 制作スコープ外)

### 2. グローバル memory 追加

- `feedback_no-existing-harness-modification.md` 新規追加 (マルチエージェント協調系の既存 skill/subagent は改修禁止、新規作成原則)
- `MEMORY.md` 索引にエントリ追加

### 3. plan 立案 (Plan Mode Phase 1〜5)

| Phase | 内容 |
|---|---|
| 1: Explore | 既存 reviewer 系 5 subagent 構造調査 (team-reviewer / code-reviewer / team-auditor / debater-reviewer / llm-debater-reviewer) + リネーム影響範囲特定 (essence 4 + identity 3 ファイル) |
| 2: Plan agent | 設計検証 + 10個の見落とし観点抽出 (identity リネーム整合性、旧 skill 衝突、subagent name 28文字、video未対応 等) |
| 3: Review | AskUserQuestion ×2 で判断確定 |
| 4: Final Plan | `/Users/camone/.claude/plans/subagent-team-harness-essentials-md-har-binary-feigenbaum.md` 書き出し |
| 5: ExitPlanMode | 承認、Auto mode 一時起動後 handoff へ移行 |

### 4. かもねの判断確定 (AskUserQuestion 経由)

| 判断点 | 結論 |
|---|---|
| 命名規約 | `{領域}-essentials.md ↔ {領域}-essentials-reviewer.md` (1:1対応、`team-` プレフィックスなし) |
| 領域名 | `harness` (旧 `agent` をリネーム、命名衝突解消) |
| identity 同時リネーム | 今回も対応 (`agent-identity.md` → `harness-identity.md`) |
| 既存 review-agent-essence skill | 本plan の対象外 (scope外、改修禁止原則) |
| 発火戦略 | 控えめ自動発火、領域名限定トリガーフレーズ (5-7個) |

### 5. handoff 実行

- `<PJ>/.claude/handoff-state.md` 書き出し
- 当初 UTC `2026-05-06T15:24:47Z` で記述 → かもねの指摘 (「ここは日本だで」) で JST `2026-05-07T00:24:47+09:00` に修正

## 設計意図

- **essence と identity の役割分離**: essence (普遍原則) と identity (プロジェクト固有選択) を別管理。両者を混ぜると essence の再利用性が崩壊するため (essence/README 既述)
- **subagent 1:1対応**: PDF原則「領域ごとに独立したファイル + 各領域に専用レビューア」を構造化。`team-` プレフィックスを付けないことで Agent Teams 協調網への結合を強要せず、単体起動向きに設計
- **scope外明示**: 既存 review-agent-essence skill は協調網組込済の可能性があるため触らない (改修禁止原則)。新規 reviewer 群と並行運用、棲み分け議論も今 plan には含めない (将来問題発生時に別 plan で対応)
- **plan archive 時のリネーム**: plan ファイル名がplan mode自動生成 (`...-binary-feigenbaum.md`) で意味薄なため、archive 時に `2026-05-07_essence-reviewer-subagents-creation.md` へリネーム

## 副作用

本セッションで発生したかもねからの判断ミス指摘 (将来同じミス再生防止のため記録):

| 判断ミス | 内容 | 対応 |
|---|---|---|
| skill/subagent 曖昧 | 「専用レビューア」を skill/subagent どちらか曖昧にした | subagent と明示確認、plan に記述 |
| 命名引きずり | subagent 命名で既存 `team-` 系列に揃えようとした | プレフィックスなし命名に修正 |
| 命名衝突未検知 | `team-essence-agent.md` と書いて `agents/` との衝突に気づかなかった | 領域名リネーム (harness) で根本解決 |
| 改修禁止違反 | 既存 review-agent-essence を「素材として流用」と提案 | 改修禁止原則を memory 化、scope外明示 |
| 過剰設計 | review-agent-essence の話題を引き込み plan を膨らませた | scope外として削除、本plan から除外 |
| 所在地考慮なし | handoff-state.md で `date -u` (UTC) を機械選択 | JST に修正 |

判断保留中: JST 機械選択ミスを memory に残すか (`feedback_datetime-jst-not-utc.md`)、かもねからの明示判断待ち。

## 関連ファイル

- `<PJ>/.docs/identity/README.md` — identity ディレクトリ設計思想
- `<PJ>/.docs/identity/project-charter.md` — プロジェクト自己定義
- `<PJ>/.docs/identity/agent-identity.md` — essence/agent 対応 (次セッションで `harness-identity.md` へリネーム)
- `<PJ>/.docs/identity/skill-identity.md` — essence/skill 対応
- `<PJ>/.claude/handoff-state.md` — handoff スナップショット (JST修正済)
- `/Users/camone/.claude/plans/subagent-team-harness-essentials-md-har-binary-feigenbaum.md` — 承認済 plan
- `/Users/camone/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_no-existing-harness-modification.md` — 改修禁止原則 memory
- `~/.claude/.docs/essence/agent-essentials.md` — リネーム対象 (次セッション、`harness-essentials.md` へ)
- `~/.claude/.docs/essence/skill-essentials.md` — 内部参照書換対象 (次セッション)
- `~/.claude/.docs/essence/ui-essentials.md` — 内部参照書換対象 (次セッション)
- `~/.claude/.docs/essence/README.md` — 表更新対象 (次セッション)
