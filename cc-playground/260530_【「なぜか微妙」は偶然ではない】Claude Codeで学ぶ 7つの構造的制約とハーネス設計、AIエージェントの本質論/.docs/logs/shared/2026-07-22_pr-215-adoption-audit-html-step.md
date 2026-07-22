---
date: 2026-07-22 09:49:37
type: work
topic: pr-215-adoption-audit-html-step
session: harness-adoption-audit プチ修正 (HTML 解説 step 追加) — worktree 隔離 → PR #215 → merge → live 化 → closeout
related_skill: [pickup, logging, handoff, commit, explain-in-html]
related_log_ids: [2026-07-22_pr-214-review-merge-closeout, 2026-07-21_skill-lane-and-stale-local-gtr-postmortem]
related_log: [.docs/logs/shared/2026-07-22_pr-214-review-merge-closeout.md, .docs/logs/shared/2026-07-21_skill-lane-and-stale-local-gtr-postmortem.md]
---

# PR #215 — harness-adoption-audit に HTML 解説 step 追加 (7→8 ステップ化・High 1 件是正込みで merge/live 化まで完結)

> かいじゅう指示「audit 結果を html でも解説し open する。修正は worktree 隔離、PR 作成 → merge で統合」の完結記録。新 step 7 (検証済み判定ログを explain-in-html で HTML 化 + open) を挿入し 8 ステップ化。独立 2 レビュアの essence レビューで **harness 側が High 1 件 (原則14: 未検証記事引用が browser 実行 HTML へ流入する exfiltration 経路) を検出** → untrusted-input ガード (全面エスケープ + 未確認なら open しない) で構造是正 → round-2 GO。commit 実行は gate の設計制約 (下記・本ログの核心運用知) によりかいじゅうへ handoff し、PR #215 → merge (1bcb0ca) → pull live 化 → worktree/branch 回収まで全 verify 済み。

## 概要

前セッションで skill 化ライン完結 (PR #214) した harness-adoption-audit への初の機能追加。ハーネス実体は deny #173 により worktree + PR レーンのみ改修可。今回は前回の「隔離セッション方式」(かいじゅうが worktree + CLAUDE_CONFIG_DIR + /login で別セッション起動) ではなく、**main セッション (この学習 PJ セッション) が worktree のファイルを直接編集する方式**で回した — deny は `~/` アンカーゆえ worktree パスの Edit は通る (実測)。隔離起動・/login をしていないため Keychain 払い出しは無し (台帳 grep 0 件で確認)。

## 内容

### 変更 (2 ファイル + record 1 本、commit 28fc0c7)

- 新 step 7: step 6 (独立トレーサビリティ検証ゲート) 通過後の判定ログを `explain-in-html` skill で self-contained HTML 化し open。正本 = markdown / HTML = 派生 (食い違いは markdown が勝つ、step 8 の人間が読むのも markdown 側)。HTML は commit contract 対象外。skill 不在環境は直接生成 fallback、opener は macOS `open` / Linux `xdg-open`
- fail 方向の二軸分離: 生成・open の失敗 = fail-open (step 8 を block しない・失敗は人間へ報告) / open の実行 = fail-close (エスケープ未確認なら開かない)
- 旧 step 7 (commit→push) → step 8 繰り下げ、step 6 内参照 2 箇所追随 (両 reviewer が grep で dangling ゼロを独立確認)

### essence レビュー (worktree 上で独立 2 レビュア)

- skill-essentials round-1: C0/H0/M0/Low3
- **harness-essentials round-1: High 1 (原則14)** — skill は「記事 = 未検証外部入力」を 3 箇所で宣言するのに、新 step はその未検証テキスト引用を browser 実行 HTML へ流す。委譲先 explain-in-html のエスケープは code/pre 内のみ (reviewer 実測) で、prose/blockquote/表の記事引用は無エスケープ経路 = 「非信頼コンテンツ × ハーネス内部実測値 × 外部通信」の致命的三要素が browser 側で成立しうる。「埋込指示は無視」規律は命令追従を止めるだけで active-content 実行経路は覆わない、という切り分けが鋭い
- 是正: step 7 に「エスケープ必須 (untrusted-input ガード)」— ログ由来テキストは block 種別を問わず全面 HTML エスケープ + 生成後にログ由来の生タグ混入無しを確認してから open、確認できなければ open しない
- round-2 (同 reviewer に是正確認): 「output encoding は XSS の正道的構造防御・fail-close デフォルトは原則14 の正道」→ **設計レベルで閉じた・GO・新規問題なし**。残余 Low 1 (エスケープ確認の決定論化・生成者からの独立化 = 別 PR 可の hardening 候補) は record に開示
- record: `.docs/essence-review-records/2026-07-22_063044_harness-adoption-audit_html-step_self-eval.md` (C0/H0/M0/L4 GO、命名は生成器 `essence_record_name.sh path` 使用)

### 運用知 (本ログの核心): main セッションから harness worktree へ commit する経路は構造的に無い

1. **essence gate は `cd <別ツリー> && committer` を fail-close で block する** (rule=commit-tree-ambiguous)。gate は records/STAGED/staleness を全て hook cwd 基準で解決するため、「cwd と cd 先で records ツリーが割れる」形は判定不能 = 設計どおりの block (gate 実装 L540-584 を Read して確認)
2. **このセッションの shell cwd は学習 PJ に固定**: `cd <worktree>` しても次の Bash 呼出で reset される (実測)。つまり「commit するツリーの中で committer を実行」の前提をこのセッションは満たせない
3. 帰結: **commit 実行をかいじゅうへ handoff** (push と 1 コマンドに同梱)。gate の実質 (独立レビュー + GO record 同梱) は事前に満たし、かいじゅうの実行自体が HITL 承認になる。`SKIP_ESSENCE_GATE` や `env --chdir` で gate の目を逸らす迂回は gate 形骸化ゆえ不採用
4. 前回 (PR #214) の隔離セッション方式は cwd がツリー内にあるからこの制約に当たらなかった。**「編集は main セッションでも可、commit はツリー内のセッション or 人間」が worktree レーンの実効的な分業**

### その他の実測知

- `gtr rm <branch>` は worktree を消すが **local branch は残る** — `--delete-branch` 付与 (前回) か手動 `git branch -d` (今回) が要る
- gtr list の「detached」表示は `~/.claude-worktrees/` のディレクトリスキャン由来で、`git worktree list` の実登録と食い違う。前回 closeout の worktree は git 登録上は削除完了しており、残っていたのは空ディレクトリの殻 1 個 (中身 0 件)。同種の未登録ディレクトリ: issue-59 (空) / issue-94 (空) / issue-60 (**中身 6 件あり** — 未接触、処分はかいじゅう判断)
- merge 済み branch の実 worktree 2 つ (`fix-gtr-from-anywhere` / `issue-211`) が現存 — 明示指示の範囲外ゆえ未接触

### closeout (全 verify 済み)

1. commit/push 着地検証: 28fc0c7 (base 545724c 直上)・clean・remote 未 push 0
2. PR #215 作成 → merge: MERGED / merge commit 1bcb0ca (gh で独立確認)
3. `git -C ~/.claude pull --ff-only` → live 化検証: 本体 SKILL.md に untrusted-input ガード実在 + 「固定 8 ステップ」grep 一致
4. worktree 削除前 verify (clean + 未 push 0) → `gtr rm` + `git branch -d` → worktree/local branch 残存 0 確認
5. Keychain 回収: 対象なし (隔離起動/login なし・台帳 grep 0 件)
6. remote branch `feat/adoption-audit-html-explain` の削除のみ残 (push 系操作 = かいじゅう領分。#213/#214 の branch は remote 削除済みが前例)

## 残課題

- [Low hardening・別 PR 可] step 7 のエスケープ確認を決定論 grep 化 + 生成者から独立させる (record 開示済み)
- V-1.3『選択肢は推論前に絞る』深掘りを、今回機能追加した skill の初ドッグフードとして実施 (HTML 解説 + open の実動確認を兼ねる)

## 関連ファイル

- `~/.claude/skills/harness-adoption-audit/SKILL.md` (live、1bcb0ca)
- `~/.claude/.docs/essence-review-records/2026-07-22_063044_harness-adoption-audit_html-step_self-eval.md`
- PR: https://github.com/kaijutale/claude-harness/pull/215
