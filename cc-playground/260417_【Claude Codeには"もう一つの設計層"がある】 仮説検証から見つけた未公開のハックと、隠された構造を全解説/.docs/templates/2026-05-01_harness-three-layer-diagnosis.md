---
feature: harness-three-layer-diagnosis
session: 未設定
date: 2026-05-01 14:39:37
---

# ハーネス3層補完関係の診断 (Hooks / Skills(fork) / Subagent(Skill tool))

## 概要

記事「Claude Codeにはもう一つの設計層がある」の主張 —— 「Hooksはイベント駆動の受動的チェックに強く、Skills方式は能動的にフェーズを回すワークフロー制御に適し、両者は補完関係」—— に対し、かもねの現行ハーネスでこの3層が実際に成立しているかを実測診断した。

診断対象は以下の3観点:

1. Hooksによる受動的チェック
2. Skills (frontmatter `context: fork` + `subagent:`) による能動的ワークフロー
3. Subagent (`tools: Skill`) による能動的ワークフロー

結論: **3層とも実装済み・動作可能な構成になっている**。ただし agent 側に1点の非対称性を観測した（後述「副作用」参照）。

## 実装内容

### 1. Hooks (受動的チェック) — 実測済み

`~/.claude/settings.json:101-225` で5イベントにフック登録済み。

| Event       | Matcher            | 役割                                                      |
| ----------- | ------------------ | --------------------------------------------------------- |
| PreToolUse  | `Bash`             | `hook_pre_commands.sh` (禁止コマンド構造ブロック)         |
| PostToolUse | `Edit\|Write`      | `hook_post_lint.sh` + `hook_post_emoji_check.sh`          |
| PostToolUse | `mcp__.*`          | `hook_post_mcp_notify.sh` (外部入力通知)                  |
| PostToolUse | `WebFetch\|WebSearch` | `hook_post_external_input_notify.sh`                   |
| Stop        | `""`               | `hook_stop_words.sh` + `hook_stop_handoff_check.sh`       |
| PostCompact | `""`               | `hook_validate_claudemd.sh` + `hook_post_compact_handoff_check.sh` |
| SubagentStop| `""`               | 通知のみ                                                  |

→ tool実行直後・session終端・compaction後という「判断不要のイベント点」で自動発火。記事の言う「受動的チェック」の典型形。

### 2. Skills (context: fork + subagent フィールド) — 実測済み

frontmatter で `context: fork` + `subagent: <name>` を持つ skill を9本確認:

| Skill                       | subagent                  | 用途              |
| --------------------------- | ------------------------- | ----------------- |
| `red-test-fork`             | `team-tester`             | TDD RED           |
| `implement-fork`            | `team-implementer`        | TDD GREEN         |
| `verify-test-fork`          | `team-tester`             | TDD verify        |
| `auditing-aio-fork`         | `team-auditor`            | AIO監査           |
| `auditing-nextjs-security-fork` | `team-auditor`        | Next.jsセキュリティ監査 |
| `llm-debate-reviewer`       | `llm-debater-reviewer`    | レビュー視点議論  |
| `llm-debate-ui-designer`    | `llm-debater-ui-designer` | UI/UX視点議論     |
| `llm-debate-tester`         | `llm-debater-tester`      | テスト視点議論    |
| `llm-debate-implementer`    | `llm-debater-implementer` | 実装視点議論      |
| `llm-debate-documenter`     | `llm-debater-documenter`  | ドキュメント視点議論 |

→ 親コンテキストを切り離して孫エージェントに能動委譲するパターンが完備。記事の「能動的ワークフロー制御」がここで実現されている。

### 3. Subagent (tools に Skill) — 実測済み

`~/.claude/agents/coder.md:11-19` で `tools: [Read, Edit, Write, Glob, Grep, Bash, Skill]` を確認。`red-test-fork → implement-fork → verify-test-fork` を順次skill呼出する戦術オーケストレーターとして動作する設計。

ただし `team-auditor.md` は `tools` に Skill を含まず、`skills:` フィールドで `auditing-aio` / `auditing-nextjs-security` を事前assign する別パターン（自動ロード型）。これは「auditorは verdict 専念で外部skill 呼ばない」という意図的な設計と整合する。

## 設計意図

### 診断軸を「frontmatter / settings.json の実物照合」に置いた理由

記事の主張は概念モデルとして語られるが、ハーネスに本当に実装されているかは**設定ファイルとfrontmatterを直接読むしか確証が取れない**。description文言で「fork化」と書かれていても、frontmatter に `context: fork` が無ければ動かない。逆に、Skill ツールが agent の tools に列挙されていなければ、その agent は能動的に skill を呼べない。

つまり「3層の補完関係が成立している」は次の3条件の AND で判定できる:

1. `settings.json:hooks.*` に複数イベントが登録されている
2. 1本以上の skill が frontmatter に `context: fork` + `subagent:` を持つ
3. 1本以上の agent が `tools` に `Skill` を含む

実測でこの3条件すべてが満たされていることを確認した。

### 「Skill tool」と「skills frontmatter」を区別した理由

両者は表層の見た目が似ているが意味が真逆である。

- `tools: [..., Skill]` (agent側): その agent が **能動的に** skill を呼び出せる
- `skills: [...]` (agent側): agent 起動時に該当 skill が **事前assign** される（受動）

記事の「能動的ワークフロー制御」に対応するのは前者。後者は「その agent が何の能力で起動するか」の宣言であって、ワークフローを駆動する力は持たない。`coder.md` (前者型) と `team-auditor.md` (後者型) でこの違いがそのまま設計選択として現れている。

## 副作用

### 観測された非対称性: team-auditor.md に Skill tool が無い

`team-auditor.md` の `tools` は `[Read, Grep, Glob, Bash]` のみで Skill を含まない。これは現状「auditor は verdict 専念」の設計と整合するが、将来「auditor 内からさらに別の skill を fork 起動したい」要件が出てきた瞬間に**追加が必須**になる構造的制約として記録しておく価値がある。

判断基準は明確:

- 永続的に verdict 専念 → 現状維持で正解
- 将来 skill 連鎖を許す可能性あり → `tools` に Skill を追加

今回の診断では「現状の設計選択として一貫性がある」ところまで確認し、変更は行わなかった。

### 記事主張との関係

記事は「Hooks vs Skills」を排他ではなく補完関係として提示するが、実測すると **3層構造**で読むほうが正確だった:

- 強制力レイヤー (Hooks): harness が握る、Claude は逆らえない
- 能動制御レイヤー (Skill tool 持ちの agent): Claude 本体が握る judgment OS
- 委譲実行レイヤー (fork skill): 孫エージェントに切り離して実行する道具

この3層が機能分離されているからこそ、責務が混ざらない。

## 関連ファイル

- `~/.claude/settings.json` — Hooksの5イベント登録元
- `~/.claude/skills/llm-debate/SKILL.md` — fork skill master、5視点議論をオーケストレート
- `~/.claude/skills/llm-debate-{reviewer,ui-designer,tester,implementer,documenter}/SKILL.md` — fork sub-skill 5本
- `~/.claude/skills/red-test-fork/SKILL.md` — TDD RED の fork skill
- `~/.claude/skills/implement-fork/SKILL.md` — TDD GREEN の fork skill
- `~/.claude/skills/verify-test-fork/SKILL.md` — TDD verify の fork skill
- `~/.claude/skills/auditing-aio-fork/SKILL.md` — AIO監査 fork skill
- `~/.claude/skills/auditing-nextjs-security-fork/SKILL.md` — Next.jsセキュリティ fork skill
- `~/.claude/agents/coder.md` — `tools: Skill` 持ち、TDDサイクル戦術オーケストレーター
- `~/.claude/agents/team-auditor.md` — `tools: Skill` 無し、`skills:` 事前assign 型 (非対称性の観測対象)
- `~/.claude/hooks/hook_pre_commands.sh` 他 11本のhookスクリプト群
