---
name: Verifiable Workflow Enumeration
generated_at: 2026-05-01
project_root: /Users/camone/dev/claude-code/claude-code-learn/cc-playground/260417_Claude-Code-設計層検証
project_type: meta-harness 検証用 (production app ではない)
scanned_skills: 65
scanned_agents: 25
total_candidates: 15
fork_ready: 7
conditional: 4
out_of_scope: 4
generator_skill: enumerating-verifiable-workflows
generator_version: initial
---

# Verifiable Workflow Enumeration Report

このプロジェクト固有の状況: **meta-harness 検証プロジェクト**。production app ではないため、test/lint/audit の verifier 候補は限定的 (検出された test ファイル: `./sample-nextjs-vitest/src/lib/formatRelativeTime.test.ts` 1個のみ、package.json/lighthouserc/playwright.config/openapi なし)。

代わりに「**ハーネス資産自体**(~/.claude/skills/, ~/.claude/agents/) の検証可能性」を主対象として列挙する。

---

## A. Verified (fork化済) — 既に spec→implement→verify→adjust ループ確立

| skill | subagent | 完成度 |
|---|---|---|
| **red-test-fork** | team-tester | ✅ 100% |
| **implement-fork** | team-implementer | ✅ 100% |
| **verify-test-fork** | team-tester (フレッシュ起動) | ✅ 100% |
| **auditing-aio-fork** (本日新設) | team-auditor | ✅ 100% |
| **auditing-nextjs-security-fork** (本日新設) | team-auditor | ✅ 部分 (env/import系のみ機械修正可) |

オーケストレーター: `coder` agent (TDD領域) / `orchestrating-team-development` (workflow 領域)

---

## B. Verifier単独 (調整ループ未自動化) — fork化最有力候補

| skill | 5軸スコア | 推奨アクション | 機械修正可能領域 | 人判断領域 |
|---|---|---|---|---|
| **auditing-aio** | ✅✅✅✅✅ (5/5) | **本日 fork 化済 → A群 移行** | なし (verifier専念) | 修正方針 |
| **auditing-nextjs-security** | ✅✅✅⚠️✅ (4/5) | **本日 fork 化済 → A群 移行** | env変数削除 / server-only import追加 | Server Action認証 |
| **auditing-web-quality** | ✅⚠️⚠️⚠️⚠️ (1/5) | fork化対象外 | なし | UI/UX判断は context-dependent (主観領域) |
| **branch-validator** | ✅⚠️✅⚠️✅ (3/5) | 条件付き候補 | spec drift 検出 | AC↔code 意味マッピング (LLM 意味判断) |

### 5軸判定の根拠

**auditing-web-quality** (1/5):
- exit code: ✅ Chrome DevTools の console error 数で判定可能
- diff: ❌ visual diff は閾値設定が困難
- 構造化出力: ❌ レポートが Markdown ベース、parse 困難
- spec化: ❌ UI/UX「正解」の定義は context-dependent
- retry安全性: ❌ ブラウザ起動の副作用大

**branch-validator** (3/5):
- exit code: ✅ Missing数=0 で判定可能
- diff: ⚠️ git diff は機械的、AC照合は LLM 判断
- 構造化出力: ✅ JSON 出力可能
- spec化: ⚠️ AC は spec にあるが解釈に幅
- retry安全性: ✅ 副作用なし

---

## C. 未着手 (5軸スコア順)

### 優先度: 高 (5/5 完全機械判定可能)

- **a11y自動検証**: 5/5 → fork化即実施推奨
  - 提案skill: `a11y-fork`
  - 検証器: axe-core CLI (exit code + JSON 出力)
  - 機械修正可能: aria-label 不足 / alt 属性追加 / heading hierarchy 修正
  - subagent候補: 既存 `team-auditor` 流用 (skills に `a11y-rules` 追加)

- **依存ライセンス適合**: 5/5 → fork化即実施推奨
  - 提案skill: `license-compliance-fork`
  - 検証器: `license-checker` CLI (exit code)
  - 機械修正可能: 許可ライセンスリストとの diff
  - subagent候補: `team-auditor` 流用

### 優先度: 中 (4/5 条件付き)

- **パフォーマンス予算**: 4/5 → 条件付き
  - 提案skill: `perf-budget-fork`
  - 検証器: Lighthouse CI (exit code + JSON)
  - 注意: 環境依存 (CI/local で差異)、自動retry 注意 (副作用: ブラウザ起動コスト)
  - 5軸: ✅✅✅✅⚠️ (retry安全性のみ ⚠️)

- **API契約適合**: 4/5 → 条件付き
  - 提案skill: `api-contract-fork`
  - 検証器: `dts-bundle-generator` + `tsc --noEmit` で OpenAPI ↔ TypeScript types diff
  - 5軸: ✅✅✅⚠️✅ (spec化 ⚠️: OpenAPI 定義の網羅性)

### 優先度: 低 (3/5 条件付き、実施判断は project 別)

- **E2E spec実装一致**: 3/5 → 条件付き
  - 提案skill: `e2e-match-fork`
  - 検証器: `defining-user-flows` skill 産出の `flow.md` ↔ Playwright spec の対応一致 (custom script 必要)
  - 5軸: ✅⚠️⚠️✅✅ (diff/構造化出力 ⚠️)

- **DesignDD適合**: 3/5 → 条件付き
  - 提案skill: `design-match-fork`
  - 検証器: Playwright visual diff or Chromatic (HTML/Storybook ↔ 実装)
  - 注意: visual diff の閾値設定が必要、閾値次第で偽陽性多発
  - 5軸: ⚠️✅⚠️✅✅ (exit code/構造化 ⚠️)

### 対象外 (4要素パターン適用不可)

- **UI美学判断** — 主観領域、機械検証不可 (`team-ui-designer` の責務、判断辞書 `injecting-ui-aesthetic` で代替)
- **プロンプト品質** — 部分のみ可 (`empirical-prompt-tuning` skill が両面測定で近似してる)
- **ドキュメント可読性** — 主観領域 (Flesch reading ease 等で間接的測定は可能だが限定的)
- **Refactoring 完了判断** — 「リファクタリング後の品質」は 100% 機械化困難 (review-agent-essence で代替)

---

## 推奨着手優先順 (本プロジェクトでの次の一手)

| 順 | アクション | 理由 |
|---|---|---|
| 1 | **本日新設 fork skill 2つの実プロジェクト動作テスト** | 既存資産活用、追加コストゼロ |
| 2 | `a11y-fork` skill 新設 | 5/5 完全機械判定、`team-auditor` agent 流用可能 (新規 agent 不要) |
| 3 | `license-compliance-fork` skill 新設 | 5/5 完全機械判定、`team-auditor` 流用 |
| 4 | `perf-budget-fork` skill 新設 (条件付き) | Lighthouse CI 環境を持つ project でのみ |
| 5 | `api-contract-fork` skill 新設 (条件付き) | OpenAPI 持つ project でのみ |
| 6 | `e2e-match-fork` / `design-match-fork` 新設 (慎重判断) | 偽陽性率の事前検証必須 |

---

## 自己参照ループの適用

本レポートは `.docs/specs/CURRENT/` に配置されたため、後続 `spec-based-development` skill から参照可能。次の流れで自動接続:

```
verifiable-workflows-spec.md (本レポート)
    ↓ spec-based-development が参照
ticket 化 (例: TICKET-100 a11y-fork skill 新設)
    ↓ orchestrating-team-development 経由
fork skill 実装 → team-auditor 流用検証 → 完了
```

これにより「思いつきベースの skill 増殖」が「機械列挙ベースの skill 追加」に変わる。

---

## このプロジェクト固有の制約

- **Production app ではない**: package.json / lighthouserc / openapi 等が存在しない (シグナルファイル走査で確認)
- **唯一の test 資産**: `./sample-nextjs-vitest/src/lib/formatRelativeTime.test.ts` (Vitest デモ用と推察)
- **検証対象は主にハーネス資産自体**: ~/.claude/skills/ (65個) + ~/.claude/agents/ (25体) の品質検証が中心
- **`review-agent-essence` skill が既存**: ハーネス品質検証の verifier として既に確立 (今回 Plan B 改良対象でも実証済み)

---

## Observability (skill 自己観測)

```yaml
tool_uses_count: 1            # Write 1回のみ
file_writes_count: 1
file_writes_list:
  - .docs/specs/CURRENT/verifiable-workflows-spec.md
duration_sec: 31              # 1777614607 - 1777614576
scanned_skills_count: 65
scanned_agents_count: 25
candidates_total: 15
candidates_by_category:
  verified: 5      # A群
  verifier_only: 4 # B群 (うち 2 は本日 A群 移行)
  greenfield: 6    # C群
  out_of_scope: 4
five_axis_distribution:
  "5/5": 2         # a11y / license-compliance
  "4/5": 3         # auditing-nextjs-security / perf-budget / api-contract
  "3/5": 3         # branch-validator / e2e-match / design-match
  "2/5以下": 1     # auditing-web-quality
project_specific_notes:
  - production app ではない (meta-harness 検証用)
  - シグナルファイル不足のためレポートは「ハーネス資産」中心
```
