---
date: 2026-06-15 14:58:15
type: work
topic: gtr-copy-include-skill-flow
session: worktree-context-and-gtr-copy-qa
related_skill: [creating-gtr-worktree, logging]
---

# worktree のコンテキスト/設定共有の理解と gtr.copy.include 確認フローの skill 化

> 同一worktreeでのコンテキスト非共有、`git worktree add` と `gtr` の copy 挙動差を Q&A で確定し、`creating-gtr-worktree` skill に `gtr.copy.include` 未設定時の AskUserQuestion 確認フローを組み込んだ。

## 概要

「同じワークツリーでペイン分割して2つの Claude を起動したらコンテキストは共有されるか」という素朴な疑問から出発し、worktree とコンテキスト/設定の関係を段階的に掘り下げた。最終的に、gitignore された `.claude/` を worktree へ運ぶ運用上の落とし穴を、`creating-gtr-worktree` skill に確認フローとして恒久化した。

## 内容

### Q&A で確定した事実

| 問い | 結論 |
|---|---|
| 同一worktreeでペイン分割し2セッション起動 → コンテキスト共有? | 共有されぬ。会話履歴は各 claude プロセスのメモリに閉じ、プロセスごとに独立。ワークツリー(ファイル)共有はコンテキスト共有の根拠にならない |
| このPJで `git worktree add` → `.claude/CLAUDE.md` はコピーされる? | されぬ。このPJ自身の `.gitignore:2 .claude/` で ignored。`git worktree add` は追跡ファイルのみ展開 |
| gtr は `.gitignore` を無視してコピーする? | 自動では無視しない。土台の git は gitignore 尊重。gtr が gitignore を超えるのは `gtr.copy.include` に明示登録したパターンのみ。現状そのキーは未設定 → 何も運ばない |
| copy されたファイルは commit/PR に漏れる? | 漏れぬ。`.gitignore` は追跡ファイルでブランチに乗るため、全worktreeで ignored が効く。コピー後も ignored のまま staging に乗らない |
| `gtr.copy.include` は複数指定できる? | できる。multi-valued key。`gtr config add` の繰り返しで列挙。scope は --local / --global / .gtrconfig の3種 |

### skill 改修 (creating-gtr-worktree)

`gtr new` 前に copy 設定を確認するフローを恒久化:

1. **Workflow step 2 を新設** — gitignore された `.claude/` があるのに `gtr.copy.include` 未登録なら、AskUserQuestion で「運ぶか / どの scope か (local / global / skip)」を問う
2. **description 正確化** — 「auto-copies env/config files」(条件を伏せた誤解を招く表現) を「copy.include がマッチしたものを copy、未登録なら AskUserQuestion で確認」に修正
3. **Gotchas に2項目** — (a) 未設定だと worktree が `.claude/` 無しで黙って生成されPJ固有指示を全喪失 (b) scope を安易に --global にせず --local を先頭選択肢に

## 設計意図

- 確認を **`gtr new` の前** に置いた理由: worktree 生成後に `.claude/` 欠落に気づくと、第2セッションが既に誤った前提で動き出す。生成前ゲートが安全
- scope を AskUserQuestion で選ばせる理由: `gtr.copy.include --global` は全リポジトリの worktree に波及する。意図せぬ波及を防ぐため、--local (このPJ限定) を既定の先頭に
- 後方互換を維持: trigger 文言・呼び出し方・既存 step は不変。step を1つ挟み番号を繰り下げただけ

## 副作用

- グローバル skill (`~/.claude/skills/`) の改修。machine固有 path 混入なし、`quick_validate.py` 通過を確認済み
- description 変更により session 起動時の skill metadata が更新される (trigger キーワードは保持ゆえ発火条件は不変)

## 重要発見 (推測の罠)

- この一連で、メインClaude は **3回 推測で誤り、検証で訂正** した: (1)「.claude/ は checked into codebase だから追跡対象」→ 実際は gitignore、(2)「gtr が .claude/ を自動コピー」→ 実際は copy.include 設定依存・現状未設定、(3)「copy.include は global に効く」→ --local でPJ単位も可能
- 教訓: skill の description 文言 ("auto-copies") や system-reminder の分類 ("checked into the codebase") を鵜呑みにせず、`git ls-files` / `git check-ignore` / `gtr config list` で実機確認する。今回の skill 改修は、この「推測の罠」を後続の自分が踏まないための構造化でもある

## 関連ファイル

- `~/.claude/skills/creating-gtr-worktree/SKILL.md` — 改修対象 (description / Workflow step 2 / Gotchas)
- `.docs/references/sources/pdf/260405_*.pdf` — 本PJの主題 (7つの構造的制約) ※今回の直接の出典ではないがハーネス設計文脈として連なる
