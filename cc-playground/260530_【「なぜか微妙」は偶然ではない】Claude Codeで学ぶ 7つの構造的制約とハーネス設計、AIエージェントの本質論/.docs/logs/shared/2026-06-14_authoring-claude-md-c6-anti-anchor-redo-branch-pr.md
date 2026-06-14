---
date: 2026-06-14 13:38:17
type: work
topic: authoring-claude-md-c6-anti-anchor-redo-branch-pr
session: C-6 anti-anchor やり直し (branch+PR)
related_skill: [authoring-claude-md, explain-in-html, commit, logging]
related_plan_id: 2026-06-13-authoring-claude-md-c6-anti-anchor
related_plan: /Users/camone/.claude/.docs/plans/2026-06-13-authoring-claude-md-c6-anti-anchor.md
related_log_ids: [2026-06-13_authoring-claude-md-c6-anti-anchor-reflection-check]
related_log: [2026-06-13_authoring-claude-md-c6-anti-anchor-reflection-check.md]
pr: https://github.com/kaijutale/claude-harness/pull/1
---

# C-6 anti-anchor 反映のやり直し (巻き戻し → branch+PR で厳密再実装)

> 前回の completed 虚偽 (検証ゼロの自己申告 = C-4 違反) が発覚 → 作成時点に巻き戻し → ブランチを切り検証ゲート付きで再実装 → PR #1 を開いた。実装≠完了を status で区別。

## 概要

- 前提: 前セッションで作成した反映 Plan が、別の手により `status: completed` + archived 送りにされていたが、実体は **Edit 1-3 のみ部分適用 (Edit 4/5 未実施)・Edit 3 に `-->()` 異物欠陥** で、検証を一切通していなかった = C-4「自己申告 ≠ 完了」違反。
- kaiju 指示: 「Plan を作成時点に戻し、skill の途中修正も戻して最初からやり直し」。
- 本セッション: 巻き戻し → ブランチ + PR 方式で厳密再実装 → 検証実証 → PR #1 作成 → before/after を HTML 化。

## 内容

### 1. 巻き戻し (作成時点 bc593a1 へ)

- `/tmp/revert-backup-20260614-authoring-claude-md/` に旧版2ファイル退避 (可逆性確保)
- archived の completed 版 Plan を `trash` (Finder 復元可)
- `git restore` で plans/ の planning 版 Plan を復活 + context-design-principles.md を原状復帰
- 検証: Plan=planning に復帰 / archived 消滅 / skill anti-anchor 痕跡 0 / git status に関連変更なし

### 2. ブランチ + 厳密再実装

- branch: `feat/claude-md-c6-anti-anchor` (claude-harness リポ、remote=kaijutale/claude-harness)
- 6 編集をクリーン適用 (前回の `()` 異物を踏まないよう注意):
  1. context-design-principles.md 最小セットに anti-anchor 原則
  2. 同 anti-anchor 専用サブセクション (WHY/HOW/適用ガード3点)
  3. 同 ミニマルテンプレ Stack 行に注記コメント
  4. sample-claude-md.md を `Vitest (Jest ではない)` の 1 箇所のみ (過剰適用回避を実演)
  5. validate-claude-md.sh に Check 6 anti_anchor (WARN のみ)
  6. SKILL.md Step 3 制約に anti-anchor ポインタ

### 3. 検証ゲート (前回スキップした核心)

| ケース | 結果 |
|---|---|
| bash 構文 | syntax OK |
| sample (vitest + ではない) | Check6 PASS / 7 PASS 0 FAIL / exit 0 |
| 非主流あり・ではない無し (temp) | Check6 WARN / 0 FAIL / exit 0 |
| 再 grep 反映 | 4 ファイル全反映 (旧 0 件) |
| Edit3 異物 `-->()` | 0 件 |
| 検収基準 | 6/6 達成 |

### 4. commit / PR

- `438416e` feat(authoring-claude-md): skill 4 ファイル
- `2cb7b9e` docs(plan): Plan を status=reporting + 検証結果 + PR リンクに更新
- push → PR #1 作成: https://github.com/kaijutale/claude-harness/pull/1
- Plan `completed` は **merge 後**に回す (PR open 中は completed にしない)

### 5. 解説 HTML

- explain-in-html で before/after を HTML 化 (`.docs/output/explain-in-html/260614_authoring-claude-md-c6-anti-anchor-before-after.html`)

## 設計意図

- **「実装した」と「取り込まれた」を status で分離**: PR open 中は reporting、merge で初めて completed。前回の早期 completed 失敗の構造的再発防止。
- **検証を決定論ツールに委ねる**: Check 6 (WARN のみ・FAIL 増やさず exit code 不変) で「反映したつもり」を機械が検出。C-4 対策を skill 自身に内蔵。
- **過剰適用ガードを手法と同時に設計**: 無条件導入は原則3 (200行) を壊すため「非主流かつ実害カテゴリのみ・対抗馬名は従・主流判定の腐敗回避」をセットで。

## 副作用

- claude-harness の他の未commit (settings.json / review-agent-essence・review-harness SKILL.md / 別セッション log+html) は本セッション無関係ゆえ未着手のまま残置。
- ブランチ作成時、上記 unrelated 変更は working tree に float (PR には未混入、committer が自分のファイルのみ stage)。

## 重要発見

- **completed 虚偽の検出には「実体 grep」が効く**: status だけ見ると完了に見えるが、Edit 4/5 の grep (`Jest ではない`=0、`Check 6`=なし) で即座に未達が露見した。status と実体の二重確認が C-4 検出の実務手順。
- **巻き戻しは「コミット済み状態への git restore」なら追加コミット不要**: working tree が HEAD と一致するため、revert 自体はコミット対象にならない。

## 関連ファイル

- `/Users/camone/.claude/.docs/plans/2026-06-13-authoring-claude-md-c6-anti-anchor.md` — Plan (status=reporting、merge 後 completed)
- `/Users/camone/.claude/skills/authoring-claude-md/` — 改修対象 skill (PR #1、branch feat/claude-md-c6-anti-anchor)
- `.docs/output/explain-in-html/260614_authoring-claude-md-c6-anti-anchor-before-after.html` — before/after 解説 HTML
- `.docs/logs/shared/2026-06-13_authoring-claude-md-c6-anti-anchor-reflection-check.md` — 前編 (調査 + Plan 外部化)
