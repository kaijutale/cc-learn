---
name: Verifiable Workflow Enumeration
generated_at: 2026-05-21
project_root: /Users/camone/dev/claude-code/claude-code-learn/cc-playground/260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会
scope: global ~/.claude/ harness (handoff next_phase D1 — 決定論化候補の洗い出し)
scanned_skills: 78
scanned_agents: 28
total_candidates: 12
fork_ready: 6
conditional: 4
out_of_scope: 8
implemented: 6   # C1〜C6 すべて (2026-05-21 完了・稼働中)
---

# Verifiable Workflow Enumeration Report (global harness scope)

> 目的: グローバルハーネス (`~/.claude/`) で **確率的制御 (LLM 判断) に任せている工程**のうち、
> **正解が客観的に検証可能 (exit code / diff / grep)** で **決定論的制御 (Hook / script) へ移せる候補**を機械列挙する。
> scope は「ハーネス自体の不変条件」。アプリ開発レベルの検証 (a11y/license/perf 等) は out-of-scope (後述)。

---

## A. Verified — 既に spec→implement→verify→adjust ループ確立 (fork化済)

`context: fork` + `subagent:` を frontmatter に持つ確定済み verifier-driven workflow。

| workflow | fork skill | subagent (孫) | 完成度 |
|---|---|---|---|
| TDD red/green/verify | red-test-fork / implement-fork / verify-test-fork | team-tester / team-implementer | 100% |
| AIO 監査 | auditing-aio-fork | team-auditor | 100% |
| Next.js セキュリティ監査 | auditing-nextjs-security-fork | team-auditor | 100% |
| essence (harness/skill/UI) | harness/skill/ui-essentials-reviewer-fork | 各 essentials-reviewer | 100% |
| 協調ハーネス整合性 | coordination-harness-integrity-fork | team-reviewer | 100% |
| LLM debate 5視点 | llm-debate-{ui-designer,implementer,tester,reviewer,documenter} | llm-debater-* | 100% |
| (project-local) ドメインレビュー | project-domain-reviewer-fork | project-domain-reviewer | 100% (グローバル外) |

→ **このカテゴリは D1 対象外** (既に決定論的 verifier に委譲済み)。

---

## B. Verifier単独 (調整ループ or fork未自動化) — fork化候補

| workflow | 現状 | 5軸 | 判定 |
|---|---|---|---|
| **auditing-web-quality** | Chrome DevTools MCP ベース、fork なし | exit⚠️ diff✅ 構造⚠️ spec✅ retry⚠️ (2-3/5) | **条件付き** — MCP は exit code を返さず状態を持つ。fork 化は可能だが verifier の合否を JSON 化する前処理が必要 |
| **branch-validator** | 独立 validator skill (context:fork なし) | exit✅ diff⚠️ 構造✅ spec✅ retry✅ (4/5) | **条件付き** — ブランチ名 regex は決定論的。既に script 的だが Hook (PreToolUse Bash on `git checkout -b`) 化で前倒し検証可 |
| **review-harness** | `context: fork` だが subagent なし (in-context fork) | exit⚠️ diff⚠️ 構造⚠️ spec✅ retry✅ (2/5) | **対象外寄り** — 25 アンチパターンの多くが意味判断、grep 化困難 |

---

## C. 未着手 — Hook/script化候補 (グローバル CLAUDE.md 不変条件) ★D1 本命★

CLAUDE.md / rules / memory が定義する不変条件のうち、**現状は LLM が記憶で守っているが grep/wc で客観検証でき、Hook 未カバー**のもの。
(emoji-in-code / secret-block / essence-gate / plan-redirect / stop-words / CLAUDE.md-validate は **既に Hook 化済 = 対象外**)

| # | 候補 | 検証関数 | 5軸 | 推奨実装 | 既存資産との関係 |
|---|---|---|---|---|---|
| C1 | **hardcode-hygiene-check** (`/Users/<user>/` in skills/agents) ✅**実装済 2026-05-21** | `grep -rE '/Users/[^/]+/' ~/.claude/{skills,agents}/` → 非0 で fail | ✅✅✅✅✅ **5/5** | **PreToolUse(Write\|Edit)** = `~/.claude/hooks/hook_pre_hardcode_hygiene_check.sh` (本番稼働、6ケース実起動検証 PASS、settings.json 配線済) | CLAUDE.md に grep 検査明記済。**本セッションで手動実行した工程**を決定論化完了。プレースホルダ (`/Users/.../`, `/Users/<user-name>/`) 除外・skills/agents スコープ限定・fail-open 設計 |
| C2 | **generated-comment-ban** ("🤖 Generated with Claude Code") ✅**実装済 2026-05-21** | commit/PR コマンドに禁止文言検出で fail | ✅✅✅✅✅ **5/5** | **PreToolUse(Bash)** = `hook_pre_generated_comment_ban.sh` (稼働中、6ケース検証 PASS) | CLAUDE.md「禁止コメント」。git commit/committer/gh pr を検査、Co-Authored-By は許可 |
| C3 | **fork-disable-model-invocation-lint** (`context:fork` + `disable-model-invocation:true` の矛盾) ✅**実装済 2026-05-21** | frontmatter 両キー検出で fail | ✅✅✅✅✅ **5/5** | **PostToolUse(Write\|Edit on SKILL.md)** = `hook_post_fork_disable_lint.sh` (稼働中、5ケース検証 PASS) | memory [[feedback_disable-model-invocation-blocks-skill-tool]] の構造化 |
| C4 | **file-line-limit** (500行超で警告) ✅**実装済 2026-05-21** | `wc -l` > 500 で warn (block ではなく warn) | ✅✅✅✅✅ **5/5** | **PostToolUse(Write\|Edit)** = `hook_post_file_line_limit.sh` (稼働中、4ケース検証 PASS、生成/データ系除外) | CLAUDE.md `## Agent Protocol`「ファイル500行以内」(全ファイル対象、ハーネス限定でない、無修飾「ファイル」に忠実) |
| C5 | **skill-bang-selfref-lint** (SKILL.md 本文の !構文 自己参照) ✅**実装済 2026-05-21** | regex `` !`[^`]+` `` 検出で warn | ✅⚠️✅✅✅ **4/5** | **PostToolUse(Write\|Edit on `*/SKILL.md`)** = `hook_post_skill_bang_selfref_lint.sh` (稼働中、4ケース検証 PASS) | memory [[feedback_skill-self-reference-bang-syntax]]。意図的注入と区別不能のため block でなく warn |
| C6 | **skill-frontmatter-schema** (`name:`/`description:` 必須) ✅**実装済 2026-05-21** | frontmatter 必須キー検査 | ✅⚠️✅✅✅ **4/5** | **PostToolUse(Write\|Edit on SKILL.md)** = `hook_post_skill_frontmatter_schema.sh` (稼働中、5ケース検証 PASS) | authoring-skills の規約を機械強制。Claude の skill 認識失敗を予防 |

---

## D. Out-of-scope (このパスでは着手しない)

### D-1. アプリ開発レベル検証 (ハーネスが実アプリを駆動する時に着手)
このプロジェクトは学習/ハーネス構築用でアプリコードを持たないため、以下は **保留** (実アプリ project で発火):
- a11y-fork (axe-core) / license-compliance-fork / perf-budget-fork (Lighthouse CI) / api-contract-fork (OpenAPI↔TS) / e2e-match-fork / design-match-fork (visual diff)

### D-2. 主観領域 (4要素パターン適用不可)
- UI 美学 / プロンプト品質 / ドキュメント可読性 — 客観的合否定義が不能、LLM 判断 (debate/essence) に委譲が正解

---

## 推奨着手優先順 (D1 → 次フェーズ実装)

1. **(✅ C1/C2/C3/C4 完了 2026-05-21・稼働中)** 5/5 候補 4件すべて Hook 化・settings.json 配線済:
   - C1 `hook_pre_hardcode_hygiene_check.sh` (PreToolUse Write\|Edit) / C2 `hook_pre_generated_comment_ban.sh` (PreToolUse Bash)
   - C3 `hook_post_fork_disable_lint.sh` / C4 `hook_post_file_line_limit.sh` (PostToolUse Edit\|Write)
   - **設置手順** (hooks/ も settings.json も Write/Edit deny): /tmp 正本 Write → 実起動検証 → camone が `!` で installer/wire script 実行 → 本番パス再検証。詳細 [[feedback_hooks-deny-install-via-tmp-cp]]
2. **(✅ C5/C6 完了 2026-05-21・稼働中)** `hook_post_skill_bang_selfref_lint.sh` / `hook_post_skill_frontmatter_schema.sh` — PostToolUse SKILL.md、warn 型。**C カテゴリ Hook 化候補 6件 (C1〜C6) すべて完了**
4. **(条件付き・fork)** B auditing-web-quality-fork — MCP 状態を JSON 化する前処理を設計してから
5. **(保留)** D-1 アプリレベル — 実 project 発火時
6. **(対象外)** D-2 主観領域

### 着手の構造的注意 (CLAUDE.md 準拠)
- Hook 層選択はデフォルト L2、**被害大 or 失敗実測時のみ hooks 化** ([[feedback_harness-layer-selection]])。
  C1-C4 は「事故れば全 skill 汚染 / commit 履歴汚染」= 被害大なので Hook 化が妥当。
- 既存協調ハーネス系 skill/agent は **改修禁止**、新基準には新規 Hook 作成 ([[feedback_no-existing-harness-modification]])。
- グローバル skills/agents に machine 固有 path を書かない (C1 が守らせる対象を C1 自身が破らない)。

---

## Observability (self-report)

```yaml
tool_uses_count: 8
file_writes_count: 1
file_writes_list:
  - .docs/specs/CURRENT/verifiable-workflows-spec.md
duration_sec: ~300
scanned_skills_count: 78
scanned_agents_count: 28
candidates_total: 12
candidates_by_category:
  verified: 7        # A (fork化済 workflow 群)
  verifier_only: 3   # B (auditing-web-quality / branch-validator / review-harness)
  greenfield: 6      # C (C1-C6 Hook/script化候補)
five_axis_distribution:
  "5/5": 4     # C1 C2 C3 C4
  "4/5": 3     # C5 C6 branch-validator
  "3/5": 0
  "2/5": 2     # auditing-web-quality review-harness
  "<=1/5": 0
```
