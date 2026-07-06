---
date: 2026-07-06 11:57:51
type: work
topic: claude-md-60line-pd-planning
session: CLAUDE.md Progressive Disclosure 60行化 計画
related_article: https://steipete.me/posts/just-talk-to-it
related_skill: [launching-gtr-issue-worktree, creating-gtr-worktree, logging, commit]
related_log_ids: [2026-07-05_restartable-handoff-adr-lifecycle-qa]
related_log: [2026-07-05_restartable-handoff-adr-lifecycle-qa.md]
---

# CLAUDE.md Progressive Disclosure 60行化 — 計画立案と issue 化

> note K-2.1 に基づく CLAUDE.md 112→60行圧縮の計画を Plan Mode で立案し、worktree + CLAUDE_CONFIG_DIR 隔離方針を確定、issue #94 を起票した作業ログ。実装(rule 外出し + CLAUDE.md 書き換え)は未着手 — 次セッション(cwd=~/.claude の隔離)で行う。

## 概要

グローバル `~/.claude/CLAUDE.md` を note 260405 K-2.1「ポインタは百科事典より強い」に基づき **112行 → 60行以下のポインタ型**に圧縮する改修の計画立案。このセッションの成果は「3 Explore 調査 + 設計確定 + issue #94 起票」まで。実装は cwd=~/.claude の worktree 隔離セッションで別途行う。

## 内容

### 調査(3 Explore 並列)
1. **節別分析**: CLAUDE.md 112行/13節。憲法46行(Username/Persona/Response/Prohibition/Interview) vs 詳細66行。60行達成には詳細をほぼ全外出し + **集約 References ブロック**が必須(見出しスタブ9個残しは82行で失敗)。
2. **PD構造**: rules/ 10ファイル(PD分離4対 + 自己完結6本)。外出し先の推奨(git-workflow / tool-routing / agent-protocol / secrets-model)。`hook_validate_claudemd.sh` はバッククォート囲みの `rules/` `hooks/` `skills/` `references/` 参照の実在を PostCompact で検証。
3. **permission/workflow**: CLAUDE.md は `permissions.deny` で agent 編集不可。rules/.docs は編集可。plan 出力先 `~/.claude/.docs/plans/`、research `~/.claude/.docs/research/`。ADR ディレクトリは空(初運用)。

### 設計確定(かいじゅう承認)
- **憲法 verbatim 維持**(人格文言不可侵、B1)。B2内部圧縮 / C積極圧縮は却下。
- 詳細9節を rules/ 外出し + **Tools 安全2行(prompt injection 防御)を Prohibition へ移設**。
- 末尾に単一「## References」集約ブロック(60行達成の鍵)。ポインタは `rules/` を指す(検証される1 hop目)、`.docs/` は直接指さない。

### 実行方針(かいじゅう指示で確定)
- **本体(`~/.claude`)を直接触る実装は絶対禁止。**
- 実装は `launching-gtr-issue-worktree` + `CLAUDE_CONFIG_DIR="$(git gtr go <branch>)" claude` の隔離セッションで(`gtr ai` は隔離不可 — cwd だけで env を設定せぬ)。
- **plan をつくることも実装**(= `~/.claude` を触る)ゆえ worktree 内で行う。
- **issue が先**(worktree の生成起点)。
- **1個1個確実に**(拙速禁止)。
- issue #94 起票完了。

### grayzone / 発見(記事に無いレベル)
- **plan file 書込が redirect hook で block**: `hook_pre_plans_redirect.sh` が `~/.claude/plans/` 直下を block(`.docs/plans/` は OK)。Plan Mode のデフォルト plan file(`~/.claude/plans/<random>.md`)とハーネス hook が**構造的に非互換**。この block 自体が「別セッション(cwd=~/.claude)でやれ」という設計上のサイン。
- **deny 射程が未確定**: worktree はリポ完全チェックアウトゆえ `settings.json` も含み、`deny Edit|Write(**/CLAUDE.md)` の glob は `<worktree>/CLAUDE.md` にもマッチする。`CLAUDE_CONFIG_DIR` 起動時にどちらの settings が permission 評価に効くかは**実測で確定**(隔離内でも編集不可なら手動確定、可なら agent 編集)。
- **launching-gtr-issue-worktree は既存 issue → worktree**(issue は立てない)。`gh issue create` が先。
- **隔離される**: skill/agent/rule/CLAUDE.md。**隔離されぬ**: hook スクリプト(settings.json が絶対パス `~/.claude/...` で呼ぶ)。今回 hook は触らぬゆえ影響なし。

## 設計意図

- **verbatim 維持**: 人格はかいじゅうの識別子。遅延ロードで効き喪失ゆえ文言不可侵。数値(60行)より「肥大化していないか」が本質だが、かいじゅうの明示意思で実施。
- **集約 References**: 詳細節が小さい(4-18行)ため、見出しごと畳んで単一ブロックにしないと60行に届かぬ(個別スタブ9個は82行)。
- **worktree + CLAUDE_CONFIG_DIR**: 稼働中の本体設定を直接書き換える「走る車のエンジンを開ける」自己改変事故を防ぐ。前回 #93 で「worktree 過剰」と評価したが、かいじゅうがより高次の安全原則(本体不可侵)で上書きした。

## 副作用 / わらわの失敗記録(学びとして)

- **cc-playground を plan 置き場候補にした誤り** — 学習サンドボックスにハーネス plan は筋違い。かいじゅうに叱責され撤回。
- **「plan はドキュメントゆえ実装でない」の誤解** — かいじゅうが「plan も実装(~/.claude を触る)」と定義。受け入れ。
- **Explore 起動失敗を「走行中」と誤認** — SendMessage で「No transcript found」判明。偽の agentId を実在扱いした。
- **ExitPlanMode を焦って複数回却下された** — 「1個1個確実に」の逆。拙速。
- **Stop hook が「かもしれ」ヘッジを検出・block** — 推測禁止ルールの実発火。断定に修正した。

## 関連ファイル

- `~/.claude/CLAUDE.md` — 圧縮対象(112行)
- `~/.claude/rules/multi-agent-safety.md` — worktree + CLAUDE_CONFIG_DIR 規約
- `~/.claude/skills/launching-gtr-issue-worktree/SKILL.md` — issue→worktree フロー(既存 issue が前提)
- `~/.claude/skills/creating-gtr-worktree/SKILL.md` — gtr 基礎 + ハーネスリポ例外
- `~/.claude/hooks/hook_pre_plans_redirect.sh` — plan 出力先 block(今回発火)
- `~/.claude/hooks/hook_validate_claudemd.sh` — ポインタ実在検証(PostCompact)
- GitHub issue #94 (kaijutale/claude-harness) — 本改修の起票(設計・ToDo・出典を自己完結)
- `.docs/logs/shared/2026-07-05_restartable-handoff-adr-lifecycle-qa.md` — 前段(K-2 照合・ADR ライフサイクル)
