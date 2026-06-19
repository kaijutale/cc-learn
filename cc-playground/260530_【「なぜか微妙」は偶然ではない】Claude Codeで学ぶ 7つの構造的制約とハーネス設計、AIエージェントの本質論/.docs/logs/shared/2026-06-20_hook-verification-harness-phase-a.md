---
type: work
date: 2026-06-20
topic: hook検証層の恒久化 Phase A — 基盤 + 参照実装2本
related_plan: .docs/plans/2026-06-19-hook-verification-harness.md
related_pr: kaijutale/claude-harness#24
scope: global-harness (~/.claude/hooks/test/)
status: completed
---

# hook検証層 Phase A 作業ログ

## 背景

60件監査の修正検証は Phase1-5 で全て手動 `/tmp` 実施 → セッション終了で蒸発し恒久的な再発防止になっていなかった。`/review-harness` は「hook が配線されているか」までしか見ず「実装が実際に動くか(検知漏れ・過剰ブロック)」は死角。旧 plan L150「再発防止層の恒久化」を本 plan に分離し着手。

確定設計(かいじゅう承認): 全24hook均等網羅 / essence-gate に統合(壊れた hook は commit 不可)。

## やったこと(Phase A)

`~/.claude/hooks/test/` に検証層の土台を新設(gtr worktree feat/hook-verification-harness):

- `lib/harness.sh`: hook 起動ラッパ + stdin JSON builder。`run_hook` が stdout/stderr/exit code を捕捉。
- `lib/assert.sh`: `assert_deny`/`assert_allow`/`assert_syntax` + `summary`。
- `run-all.sh`: `cases/` discover + 集計 + `--changed <hook>...` 差分実行。
- `cases/test-hook_pre_read_secret_check.sh`: 新規14ケース。
- `cases/test-hook_pre_commit_essence_gate.sh`: 旧 `test-essence-gate.sh` を lib 形式へ移行(10ケース維持、c9ace2b 回帰2件含む)。旧ファイルは trash で削除。

検証: 24 assertions 全緑。`--changed` 差分実行・未カバー警告・基盤 `bash -n` も確認。essence-gate commit gate も通過。commit b47f67e → PR #24。

## 発見・学び(次フェーズと再発防止の核)

### 1. hook_pre_commands の read-only 誤遮断バグ(Phase B の獲物)
調査用の `find`/`ls`(read-only)が「保護パスへのbash書込禁止」ルールに誤遮断された。根因:

    第1パターン: (>|>>)\s*[^|]*\.claude/(settings|hooks)

`2>/dev/null` の `>` と、後続の `.claude/hooks` パスが**同一行に共存**し、間にパイプが無いため `[^|]*`(パイプ以外を貪欲に食う)が橋渡しして誤マッチ。リダイレクト先は `/dev/null` で書込でも何でもない。典型的な根因1(正規表現で構造を読む)。
→ Phase B で hook_pre_commands テストの第一号ケース(誤遮断を pin)+ 修正(コマンドを `&&`/`;`/`|` で分割し各セグメント判定、or リダイレクトターゲットを境界で区切る)。

### 2. committer の test gate は bash hook を見ない(Phase C の意義確定)
`committer` の Test Gate は `vitest.config*`/`jest.config*` がある時だけ `pnpm vitest/jest` を走らせる(JS/TS 限定)。claude-harness に JS config は無いので**発火しない**。つまり bash hook を検証する test gate は現状どこにも存在しない。
→ essence-gate(既に hook commit を gate)に「変更hookのテスト緑」を必須化するのが、bash hook の唯一の test gate になる。Phase C の必然性が立証された。

### 3. 旧テストの live 決め打ち → 相対解決で改善
旧 `test-essence-gate.sh` は `HOOK="$HOME/.claude/hooks/..."` と live 固定で、worktree で修正した hook ではなく live をテストしてしまう設計だった。`lib/harness.sh` の `HOOKS_ROOT` をテスト位置から相対解決(`lib/` の2階層上 = `hooks/`)することで、live でも worktree でも「その repo の hook」を対象にする。essence-gate が commit 対象の hook を検証する用途(Phase C)で必須。

### 4. PreToolUse deny は2系統 → 両方を deny とみなす
- exit code 2 (+ stderr) — read_secret 等 fail-closed 型
- stdout の `permissionDecision:"deny"` — commands/essence_gate 型
`assert_deny` は両系統を検出する。これを知らずに stdout だけ見ると read_secret 型の deny を取りこぼす。

### 5. over-block を踏まないテスト運用
worktree のパス(`/Users/.../.worktrees/.../hooks/test/`)は `.claude/` を含まないため上記ルールにマッチせず、`bash run-all.sh` を安全に起動できる。さらに run-all 内部の `bash <hook>` は subprocess ゆえ PreToolUse Bash hook の検査対象外(検査されるのはトップレベルのコマンド文字列のみ)。

## 成果物

- PR #24 (kaijutale/claude-harness): Phase A 一式。
- plan 進捗: Phase A `[x]`。

## 次のステップ

- PR #24 マージ待ち(かいじゅう判断で一区切り)。
- マージ後、別ブランチで Phase B(全24hook テスト、B1-B4 バッチ + 上記バグ1の pin/修正)→ Phase C(essence-gate 統合)→ Phase D(検証 + live反映 + 旧 plan completed 遷移)。
