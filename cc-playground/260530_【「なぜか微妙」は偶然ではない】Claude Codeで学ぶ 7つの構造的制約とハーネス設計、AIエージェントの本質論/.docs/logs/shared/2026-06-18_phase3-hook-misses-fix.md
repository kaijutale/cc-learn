---
date: 2026-06-18 15:18:42
type: work
topic: phase3-hook-misses-fix
session: harness-hooks-phase3
related_plan_id: 2026-06-15-harness-hooks-bug-fix
related_plan: .docs/plans/2026-06-15-harness-hooks-bug-fix.md
related_skill: [logging, creating-gtr-worktree, explain-in-html]
related_log: [2026-06-17_stray-edit-harvest-and-worktree-cleanup.md]
---

# Phase 3: ハーネス hook 取りこぼし系 High 9件 修正

> read-only サブエージェント確認 → 3バッチ実装 → /tmp 実機検証 → worktree → PR #19 マージまで完走。検証器が「取りこぼす/誤検知する」9件を後方互換で解消。

## 概要

ハーネス hook 60件監査の Phase 3「取りこぼし系 High 9件」を完走。Phase 1 (Critical 3, #4) / Phase 2 (3層保護, #15) の続き。全件 I/O契約 (exit code / JSON / stderr) を保つ後方互換修正。

## 内容

### Batch A (846ff25, 機械的・低リスク)
- 3-1 read_secret: 秘密パターン先頭の `/` を `(^|/)` 化。filename-only / 相対パス (.netrc / .npmrc / .aws/credentials / id_rsa) を捕捉。テンプレ許可・正規ファイル誤ブロックなしを両方向検証。
- 3-4 generated_ban: 禁止文言ゲートに `git -C <path>` / `git -c k=v` 越しのオプションを許容。
- 3-5 fork_lint: frontmatter の引用符・末尾コメント付き `context: fork` も検出。
- 3-8 validate_claudemd: パス抽出をバッククォート code-span 内に限定し散文の偽陽性を排除。

### Batch B (836140a, word-split / 空ガード必須)
- 3-3 pre_commands / 3-6 matcher: `for ... in $VAR` の未クォート展開を `while IFS= read -r` + `[ -z ] && continue` 空ガードへ。空文字 `grep -qF ""` 全マッチ事故の回避が肝。
- 3-6 matcher: ASCII語=`grep -qiwF` 語境界マッチ (部分語誤爆回避) / 非ASCII=固定文字列マッチ (正規表現メタ文字も literal) に出し分け。

### Batch C (fe43593, 観測変化・要レビュー)
- 3-2 hardcode: 除外を行単位から match単位 (`grep -noE` + `:`アンカー) へ。同一行混在でも実パスを取りこぼさない。
- 3-7 session_git: origin/main 未取得時 `git rev-parse --verify` で確認し、未push数を `0` と誤表示せず「不明」明示。
- 3-9 handoff: frontmatter の inline flow array `blockers: [a, b]` をパース可能に拡張 (block-style も維持)。compact_handoff は blockers 解析を持たぬため横展開不要。
- 3-6 語リスト: 短く曖昧な停止語を複合・文末形へ調整 (HITL選択「複合語/文末形に限定」)。decisive-answers が許可する正規の分解形まで巻き込む過剰ブロックを回避。

### 検証
Batch A 24項目 / B 8項目 / C 10項目 全グリーン、過剰ブロックゼロ、`bash -n` 全OK、契約不変。hook を /tmp にコピーし JSON 入力で直接実行 (live ~/.claude は不変)。

## 設計意図

- scattered 多hook 修正: 確認段階は read-only サブエージェントに委譲しメインコンテキスト保護、実装段階は security/nuance (secret hook・空ガード・matcher 出し分け) ゆえ自前バッチ管理。
- バッチ分割は subagent 推奨順 (機械的 → word-split → 観測変化) でレビュー可能な commit 粒度に。

## 副作用 / 重要な学び (Gotcha級・横展開価値)

1. **ツール呼び出し構文ミスで作業者が複数回ターンを空転**: 地の文に呼び出しタグを書いてしまい不発。tool_use ブロックとして発行せねば実行されぬ。再発防止: 呼び出しは正規 tool_use 形式のみで出す。
2. **live (未修正) stop_words hook が作業者自身の発言をブロックする自家中毒**: 修正対象の語を地の文で言及した瞬間 Stop hook が反応しターン強制継続。3-6 過剰ブロックの live 実証。教訓: assistant text を走査する live hook を編集中は merge まで trigger 語を地の文で書かない。Stop hook は tool_use / tool_result は走査せず text content のみ走査ゆえ、テストデータはファイル内容 (Write) で扱えば安全。
3. **停止語リスト変更は HITL 必須**: 利用者の応答ルール (decisive-answers 等) に直結するため、機械的修正と分離して人間判断を仰ぐ。

## 関連ファイル

- .docs/plans/2026-06-15-harness-hooks-bug-fix.md — 本作業の plan (Phase 3 を済に更新)
- PR #4 (Phase1) / #15 (Phase2) / #19 (Phase3) — kaijutale/claude-harness
- ~/.claude/hooks/ の9 hook + rules/hook_stop_words_rules.json — 修正対象 (merge 済、live 反映済)
