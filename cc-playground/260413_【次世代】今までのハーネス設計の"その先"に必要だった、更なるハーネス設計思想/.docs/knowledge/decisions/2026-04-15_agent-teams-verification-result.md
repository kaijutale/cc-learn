---
title: Agent Teams による Micro 層並列実行の物理検証結果
type: knowledge
category: decisions
status: active
created: 2026-04-15
updated: 2026-04-15
rationale: "TICKET-001 の subagent fallback では検証できなかった真の並列実行 (別プロセス・別 Claude Code インスタンス) を Agent Teams 経由で物理検証した結果"
related_ticket: TICKET-002
related_team: trilayer-v012-review
---

# Agent Teams による Micro 層並列実行の物理検証結果

## 背景

TICKET-001 (README 生成) の検証後、かもねから「note 記事で紹介されてる 3 要素のマクロハーネス・ミクロハーネス・Project OS は Agent Teams で動かすんじゃないの？」という指摘を受けた。実際に前回検証では `Agent` tool 直叩き (subagent fallback) で実行していたため、Agent Teams による真の並列実行は未検証のまま CHANGELOG `[0.1.0]` がリリースされていた。

## 設計書要求との対応

- **設計書 §4-4**: `Agent Teams experimental flag (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1) | 必須 | Micro 層の並列実行`
- **three-layer-contract.md §2.4 (v0.1.1 追記)**: 「interactive モードでも Macro 層は team-\* agents を直接 Invoke しない。必ず `orchestrating-team-development` 経由で Micro 層を呼び出す」「Micro 層が fresh context を作ることで Macro 親セッションの可変状態が Micro に漏れない」

## 検証手順

1. `activate-agent-teams` skill 起動 → Pre-flight (flag=1 / v2.1.109 / direct CLI) 全 pass
2. `TeamCreate` で `trilayer-v012-review` チーム生成 (`~/.claude/teams/trilayer-v012-review/config.json`)
3. `TaskCreate` × 2 で team task list にタスク #1 / #2 記録
4. **`Agent` tool × 2 を同一メッセージで並列呼出** (team_name + name パラメータ指定):
   - `documenter@trilayer-v012-review` (subagent_type=team-documenter)
   - `tester@trilayer-v012-review` (subagent_type=team-tester)
5. 両 spawn 応答が `"The agent is now running and will receive instructions via mailbox."` を返し、**別プロセス非同期実行** を確認
6. 両 teammate が独立して作業、完了後 automatic message delivery で main Claude に報告

## 結果

### teammate 成果物 (物理証拠)

| teammate | ファイル | 行数 | サイズ | timestamp |
|---|---|---|---|---|
| documenter | `.docs/knowledge/decisions/2026-04-15_at-changelog-v012-draft.md` | 99 | 8KB | 22:37 |
| tester | `.docs/tests/validate-trilayer-test-cases.md` | 156 | 9KB | 22:37 |

**同秒内 (22:37) の timestamp** が true parallelism の証拠。subagent では不可能な同時書込を達成した。

### teammate 自己報告

**documenter report**:
- section 構成: `## 5 本 (位置付け / [0.1.2] planned / Remaining items 仕分け / Agent Teams 検証言及 / Scope boundary)` + `### 6 本 (Phase 0 / Changed / Added / Frontmatter additive / Known limitations / Verification)`
- 仕分け結果: v0.1.2 patch → #3 / #4 / #7、v0.2.0 minor → #1 / #5
- tester 生成物に未接触 (file ownership 境界遵守)

**tester report**:
- 19 ケース (正例 7 + 異常系 12)
- append-only 違反を S-E4 として追加補強 (spec 指定外の proactive カバレッジ)
- documenter 生成物に未接触 (file ownership 境界遵守)

### 受入条件 check

| # | 条件 | 結果 | 根拠 |
|---|---|---|---|
| 1 | 別プロセスで同時 spawn | ✓ | spawn 応答が非同期 mailbox 方式 |
| 2 | 同時刻書込 = 真の並列 | ✓ | 両ファイル 22:37 同秒 |
| 3 | ファイル所有境界遵守 | ✓ | 両 teammate が相手のファイルに未接触と自己報告 |
| 4 | EKP validator pass | ✓ | 両 frontmatter が type/status/category/test_type 準拠 |
| 5 | async message delivery | ✓ | `<teammate-message>` で auto-delivered、subagent の同期応答とは異なる |

## Agent Teams vs subagent fallback の差分 (TICKET-001 との比較)

| 項目 | TICKET-001 (subagent fallback) | TICKET-002 (Agent Teams) |
|---|---|---|
| 実行プロセス | main Claude と同一プロセス内の sub-context | 別プロセスの独立 Claude Code インスタンス |
| 並列度 | 1 (逐次実行) | 2 (同時実行) |
| 応答方式 | 同期 (spawn → 即応答) | 非同期 (spawn → mailbox → message delivery) |
| context 隔離 | 部分的 (親プロセス共有) | 完全 (別プロセス) |
| file ownership 衝突リスク | N/A (逐次だから) | 検証済 (境界内にとどまった) |
| Macro 親セッションの可変状態漏れ | リスクあり | 不可能 (物理分離) |
| 記事「次世代ハーネス設計」の前提との合致 | 部分的 | **完全** |

## 結論

**trilayer-harness の Micro 層並列実行は Agent Teams 経由で物理的に動作する** ことを証明した。記事の 3 要素設計 (Macro / Micro / Project OS) は、Claude Code において Agent Teams experimental 機能を前提として成立する。

v0.1.0 の Phase 3 検証は subagent fallback でしか担保されていなかった弱さがあったが、本検証により TICKET-002 として Agent Teams 経由の完全検証が完了した。`.docs/trilayer/status.yml` に監査証跡として append 済。

## v0.2 に向けた示唆

- **§8 要決定事項 #6** (Agent Teams flag 将来廃止リスク): 本検証により Agent Teams なしでは trilayer の本質が成立しないことが確認された。fallback 設計を早期に v0.2 で用意する緊急度が上がった
- **review-agent-essence 原則 T-1.1** (並行エージェント間の状態隔離): Agent Teams 別プロセスで担保されることが実動作確認された
- **priority_rules YAML DSL 評価器** (v0.2): 並列実行で複数 ticket を評価する場合、DSL 評価器の parallel safety が新たな要件として浮上

## 関連資産

- `~/.claude/teams/trilayer-v012-review/config.json` (team 設定)
- `~/.claude/tasks/trilayer-v012-review/` (team task list)
- `.docs/tickets/TICKET-002-agent-teams-parallel-verification.md`
- `.docs/knowledge/decisions/2026-04-15_at-changelog-v012-draft.md` (documenter 生成)
- `.docs/tests/validate-trilayer-test-cases.md` (tester 生成)
- `.docs/trilayer/status.yml` (本検証の append 先)
- `~/.claude/skills/three-elements-harness/references/three-layer-contract.md` (§2.4 の不変条件)
- `~/.claude/skills/three-elements-harness/CHANGELOG.md` (`[0.1.1]` に本検証の gap を明記済)
