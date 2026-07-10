# Harness Diagnosis: ~/.claude (ハーネス本体)

> 評価基準: [diagnosis-rubric](../skills/review-harness/diagnosis-rubric.md)
> 診断日: 2026-07-04-1809
> 対象: /Users/camone/.claude （baseline取得 run 1/2 — 対象① ハーネス本体）

## ハーネス構成サマリ

| 項目 | 現状 |
|------|------|
| CLAUDE.md | 112行 / ポインタ多数（rules 10本 + `.docs/progressive-disclosure/` へ「詳細は Read」で退避）/ インライン手順は高頻度のみ（Secrets 3層・Git・Commit・Persona） |
| Permissions | allow 41件 / deny 68件 / ask 28件 / defaultMode: default |
| Hooks | PreToolUse 9 / PostToolUse 9 / Stop 6 / PostCompact 5 / SessionStart 3 / SubagentStop 4 / 他（UserPromptSubmit・失敗系・PermissionRequest）。自作 hook スクリプト 約24本 |
| Skills | 89件（オーケストレーター/ワークフロー/fork/reference 混在。fork・manual-only 29件は description に「明示呼出専用・自動誘発なし」を明記、8件は `skills-disabled/` に退避） |
| MCP | 4-5接続（brave-search / chrome-devtools / context7 / firecrawl / claude-in-chrome）。`ENABLE_TOOL_SEARCH=true` により tool 定義は deferred（常駐せず ToolSearch でオンデマンド展開） |
| Memory | 6プロジェクト。`~/.claude` 自身は index 付き4エントリで整理済。`autoMemoryEnabled: false`（手動キュレーション） |
| Agents | カスタム 32件（team-* / debater-* / llm-debater-* / framing-advocate-* / gep-* / essence reviewers 等、5-Role 分離＋fork verifier 体系） |
| Plugins | 3件（`ralph-loop`=有効 / `typescript-lsp`=有効 / `claude-mem`=無効）。typescript-lsp は LSP を、ralph-loop は反復ループコマンドを提供 |

## スコアサマリ

| カテゴリ | 指標 | スコア | 小計 |
|---------|------|--------|------|
| **A. 帯域効率** | A1 ✅ A2 ✅ A3 ✅ A4 ⚠️ A5 ✅ | 9/10 | 90% |
| **B. 検証の堅牢性** | B1 ✅ B2 ✅ B3 ✅ B4 ✅ B5 ✅ | 10/10 | 100% |
| **C. 権限と信頼境界** | C1 ✅ C2 ✅ C3 ✅ C4 ✅ C5 ✅ | 10/10 | 100% |
| **D. 知識と記憶** | D1 ⚠️ D2 ✅ D3 ✅ D4 ✅ D5 ✅ | 9/10 | 90% |
| **E. 環境設計** | E1 ✅ E2 ✅ E3 ✅ E4 ✅ E5 ✅ | 10/10 | 100% |
| **総合** | | 48/50 | **96%** |

> 全25指標が「対象」。ハーネス本体はまさにハーネスなので「—（対象外）」は該当なし。

### グレード

**S（90%+）— ハーネス設計が成熟。微調整のフェーズ**

7カテゴリのうち C（権限）・B（検証）・E（環境）が満点。残る改善余地は A4（スキルメニューの幅）と D1（排除宣言の薄さ）の⚠️2点のみ。構造的な穴（❌）はゼロ。

## 検出されたアンチパターン

> 優先順位 C>B>A>D>E に従い記述。❌はゼロ。⚠️のみ2件（A4 → D1）。

### A4. エージェントの選択肢が不必要に広がっていないか ⚠️

**検出事実**: skills が 89件。うち 29件が description に「明示呼出専用・自動誘発なし」を明記して *ソフトに* 自動発動を抑制しているが、`disable-model-invocation: true` で *構造的に* 抑制しているのは 2件のみ。fork skill（例: `framing-advocate-merit-fork`）は `context: fork` + `subagent:` 構成で、抑制は description の文言に依存している。

**影響**: 89件のスキル description は毎セッション「自動発動候補メニュー」としてコンテキストに載る。description による抑制は確率的（LLM が読んで従う前提）で、決定論的なガードではない。メニュー幅そのものがエージェントの選択判断リソースを消費し続ける。ただし allow は wildcard でなくスコープ済（`Bash(git status:*)` 等の限定形）、8件は `skills-disabled/` に退避済のため、実害は「mis-invocation」ではなく「決定面の幅」に限定される。

**関連原則**: (→V-1.3) 選択肢は推論前に絞る / (→C-1.1) コンテキストの能動的管理 / (→V-1.1) 失敗（＝誤発動）は description でなく仕組みで塞ぐ

**改善案**:
manual-only / fork の 27件（29件中、未フラグ分）に hard フラグを追加する。`disable-model-invocation: true` は *自動* 発動のみを止め、master→fork の `Skill(name)` 明示呼出は従来どおり通るため契約を壊さない。

```yaml
# 例: skills/framing-advocate-merit-fork/SKILL.md の frontmatter
---
name: framing-advocate-merit-fork
description: "..."
context: fork
subagent: framing-advocate-merit
disable-model-invocation: true   # ← 追加。明示呼出のみ許可、自動発動を構造的に遮断
---
```

一括検出:
```bash
# manual-only を謳うが hard フラグ未設定の skill を洗い出す
comm -23 \
  <(grep -rl '明示呼出専用\|自動誘発なし' ~/.claude/skills/*/SKILL.md | sort) \
  <(grep -rl 'disable-model-invocation: *true' ~/.claude/skills/*/SKILL.md | sort)
```

---

### D1. 暗黙の前提に頼っていないか ⚠️

**検出事実**: CLAUDE.md の Stack 節は「Primary: TypeScript(ESM), Next.js(App Router). pkg manager→リポジトリ指定」と *主要技術は明示* しているが、非主流選択を排除する「〜ではない」宣言がない。deny/ask に `jest.config` `vitest.config` `prettier` `eslint` が個別登場し暗黙にツールチェーンを示唆はするが、明文の排除宣言ではない。

**影響**: 統治対象プロジェクトで新セッションの Claude が「pnpm か npm か」「Vitest か Jest か」を訓練データの最頻値（npm・Jest 側）へ寄せる余地が残る。global ハーネスとして「pkg manager→リポジトリ指定」で per-repo に委譲する設計自体は正当だが、global 既定としての排除宣言があれば per-repo 未宣言時のフォールバック品質が安定する。

**関連原則**: (→C-6) 訓練データの断崖 / (→C-2) 暗黙のデフォルトは入力バイアスの一種

**改善案**:
CLAUDE.md の Stack 節に排除宣言を1〜2行足す。allow に現れる実際の選択（pnpm・Vitest）と整合させる。

```markdown
## Stack
- Primary: TypeScript(ESM), Next.js(App Router). pkg manager→リポジトリ指定。既存パターン遵守
- 既定（per-repo で上書き可）: pnpm（npm/yarn ではない）/ Vitest（Jest ではない）
```

---

## 強み

- **信頼境界が「金庫の鍵を机に置かない」水準で閉じている（C1/C3 満点）**: `settings.json` `CLAUDE.md` `hooks/*` `hooks/rules/*` が deny 保護され、エージェントは自分の deny リスト・品質のものさし（eslint/tsconfig/vitest/jest/prettier/biome/CI）を書き換えられない。deny > ask の優先順位も効いており、project 版 `.claude/settings.json` は ask（確認）、user 版は hard deny という二層設計。
- **生成者≠評価者が「文言」でなく「構造」で分離（E3/T-1.1）**: reviewer・verifier・advocate 系が `context: fork` + subagent で親コンテキストから物理隔離され、`block-team-in-macro.sh` / `restrict-macro-writes.sh` hook が Macro 層での Task 発火・書込を機械的に禁止。迎合レビューが起きる経路そのものを塞いでいる。
- **過去の失敗が prompt でなく hook に昇格済（B5/V-1.1）**: emoji-in-code 禁止・生成コメント禁止・ハードコードパス検査・500行検査・skill frontmatter schema・stop-words 検査が PostToolUse/PreToolUse hook で決定論的に強制。「気をつけて」の再注意ではなく再発不能化されている。
- **帯域を積極管理（A2/A5）**: `ENABLE_TOOL_SEARCH=true` で重い MCP tool 定義を常駐から外し ToolSearch でオンデマンド化。長セッション対策も handoff/pickup/logging/plans/Memory + PostCompact での CLAUDE.md 再検証と handoff 復元まで揃う。

## Quick Wins — 今日できる改善

### 1. manual-only / fork スキルに `disable-model-invocation: true` を付与（A4対応、15-30分）

上記 A4 の一括検出コマンドで未フラグ分を洗い出し、frontmatter に1行追加。master→fork の明示呼出は壊れない（自動発動のみ遮断）。89件メニューの決定面を実効的に狭める最短手。

### 2. CLAUDE.md Stack に排除宣言を追記（D1対応、5分）

上記 D1 改善案の2行を追加。allow に実在する pnpm/Vitest と整合させ、per-repo 未宣言時のフォールバックを固定する。※CLAUDE.md は自身が deny 保護対象のため、かいじゅう自身の編集が必要。

### 3. バックアップ残骸を trash（E4衛生、5分）

`settings.json.bak` / `skills.backup-2026-05-05/` / `hooks/hook_post_file_line_limit.sh.bak-260521` / `hooks/hook_stop_plan_promote_reminder.sh`（settings 未参照の孤児疑い）等の残骸が蓄積。E4 の GC 機構は稼働しているが、対象自体の掃除は手動。`trash` で除去（`rm` 事故防止）。

```bash
# 参照されていない孤児 hook / backup を確認してから trash
grep -o 'hook_[a-z_]*\.sh' ~/.claude/settings.json | sort -u   # settings が参照する hook 一覧
ls ~/.claude/hooks/*.sh ~/.claude/*.bak ~/.claude/skills.backup-* 2>/dev/null
# 差分を確認のうえ: trash <孤児ファイル>
```

## 次のステップ — 中期的な改善

- **スキルライブラリの定期棚卸し（A4 の構造対応）**: 89件は個人ハーネスとしては最大級。四半期ごとに「直近90日で発動0回」のスキルを `skills-disabled/` へ退避する運用を `managing-skills` skill に組み込み、決定面の自然増を GC する。
- **排除宣言を統治テンプレートに昇格（D1 の横展開）**: 単発の CLAUDE.md 追記でなく、`authoring-claude-md` skill の Stack セクション雛形に「排除宣言（〜ではない）」を必須項目化し、以後生成される全 project CLAUDE.md で一貫させる。

## 総評

本ハーネスは 96%・グレード S の成熟した設計で、権限・信頼境界（C）／検証（B）／環境設計（E）が満点。とりわけ「自分の deny リスト・品質のものさし・CLAUDE.md を書き換えられない」自己改変防御と、`context: fork` + hook による生成者/評価者の物理分離は、迎合と報酬ハッキングの経路を構造レベルで断っている。残る改善余地は⚠️2点のみ——A4（89件スキルの決定面を description のソフト抑制に依存、hard フラグは2件だけ）と D1（主要技術は宣言済だが排除宣言が薄い）で、いずれも Quick Wins で今日クローズ可能。診断はファイルベースの静的解析ゆえの限界がある: 89スキルが実際に全て使われているか（休眠率）、fork 委譲時の実ワークフロー品質、暗黙知の真の網羅性は静的には測れず、run 2/2（対象②）との突合と実運用ログでの裏取りを推奨する。
