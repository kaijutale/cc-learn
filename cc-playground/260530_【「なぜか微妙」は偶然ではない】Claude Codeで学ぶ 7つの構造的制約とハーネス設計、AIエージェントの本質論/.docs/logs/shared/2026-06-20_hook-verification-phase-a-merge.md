---
date: 2026-06-20 05:06:41
type: work
topic: hook-verification-phase-a-merge
session: Phase A マージ後の後始末 + #25 統合課題の確定
related_plan_id: 2026-06-19-hook-verification-harness
related_plan: .docs/plans/2026-06-19-hook-verification-harness.md
related_log_ids: [2026-06-20_hook-verification-harness-phase-a]
related_log: [2026-06-20_hook-verification-harness-phase-a.md]
related_skill: [creating-gtr-worktree, handoff, logging]
---

# hook検証層 Phase A — マージ後の後始末と #25 統合課題

> PR #24(検証層基盤)と PR #25(文脈考慮マッチング)が squash マージされ、live 反映も既済。後始末を完了し、両者の統合課題を Phase B へ確定申し送り。実装詳細は前ログ参照、本ログはマージ後に確定した知見に絞る。

## 概要

前ログ(Phase A 実装)の続編。PR #24 を作成・push した直後にかいじゅうが #24/#25 の両方をマージしたため、(1) マージ方式の確認、(2) live 反映要否の判断、(3) worktree 片付け、(4) #24 と #25 の関係確定、を実施した記録。

## 内容

### マージ確定とlive反映
- **#24** squash マージ = `bfa92b1`(検証層 Phase A)、**#25** squash マージ = `8863257`(文脈考慮マッチング)。
- `~/.claude` local HEAD == origin/main == `bfa92b1` で完全同期 = **#24/#25 は既に live に反映済**。追加の live 作業は不要だった。
- 教訓: squash マージのため worktree の元 commit `b47f67e` は `origin/main..HEAD` に hash 違いで残って見えるが、内容は `bfa92b1` に保全済。`git log origin/main..HEAD` 非空 ≠ 未マージ内容(squash の副作用)。マージ commit oid を `gh pr view --json mergeCommit` で確認するのが確実。

### 後始末
- worktree `feat-hook-verification-harness` を `gtr rm`、local branch を `git branch -D`(squash ゆえ `-d` は未マージ判定で拒否、内容マージ済を確認の上 `-D`)。
- 残務(かいじゅう判断・未着手): remote branch `origin/feat/hook-verification-harness` の削除(push)、#25 worktree `fix-hooks-context-aware-false-positives` の整理。

### #24 と #25 の関係(Phase B の前提として確定)
両 PR とも同じ `hooks/test/` を触るがファイル衝突なし。マージ後に以下が確定:
1. **アーキテクチャの二系統共存**: #24 = `lib/` + `cases/` + `run-all.sh`(構造化)、#25 = `test-context-aware-hooks.sh`(単一ファイル・21テスト)。#24 の run-all は `cases/test-*.sh` のみ discover ゆえ **#25 の21テストは網羅外**。→ Phase B で cases/ 形式へ統合。
2. **over-block バグは #25 で未修正(diff で確証)**: わらわが Phase A で実証した「保護パス書込 rule の `2>/dev/null` 貪欲マッチ誤遮断」は #25 の対象外。#25 は security 5 rule を全文走査維持とし、`ignore_quoted` は advisory 2 rule のみ付与。#25 のテスト L168 が `echo hi > ~/.claude/settings.json → deny`(正当な書込 deny)を固定している。→ Phase B で read-only 誤爆だけ緩和し、この L168 deny は壊さない。
3. **テスト対象は最新版**: #25 が `hook_pre_commands.sh`(ignore_quoted 追加)/ `hook_stop_words.sh`(コードスパン除去)を変更済。Phase B のテストは `bfa92b1` 時点を対象に。

## 設計意図(マージ優先度を #25→#24 と判断した理由)

- #25 は fix(誤爆=正当操作の誤ブロック、継続中の実害)、#24 は feat(再発防止の基盤)。実害を止める fix を先に。
- #25 は小さく後方互換(`ignore_quoted` opt-in、security rule 不変)でリスク低。
- #24(検証層)は後発で全体を包含する側ゆえ、#25 後にリベースして #25 のテストを取り込むのが自然。
- 結果: かいじゅうが #25(19:38)→ #24(19:48)の順でマージ。推奨どおり。

## 副作用 / 懸念

- `hooks/test/` に2系統のテスト基盤が並んだまま(統合は Phase B 持ち越し)。それまでは run-all が #25 テストを拾わない死角が残る。
- ローカル/リモートの branch・worktree 残骸はかいじゅう判断待ち(わらわの権限外操作)。

## 関連ファイル

- ~/.claude/hooks/test/(lib/cases/run-all、live = bfa92b1) — #24 検証層
- ~/.claude/hooks/test/test-context-aware-hooks.sh — #25 の21テスト(統合対象)
- .docs/plans/2026-06-19-hook-verification-harness.md — Phase A 行マージ済に更新済
- .claude/handoff-state.md — Phase B 課題3点を申し送り済(status=completed)
