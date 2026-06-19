---
date: 2026-06-19 16:28:11
type: work
topic: phase5-hooks-low-fix
session: harness-hooks-phase5
related_plan_id: 2026-06-15-harness-hooks-bug-fix
related_plan: .docs/plans/2026-06-15-harness-hooks-bug-fix.md
related_skill: [creating-gtr-worktree, explain-in-html, handoff, logging]
related_log: [2026-06-18_phase4-hooks-medium-17-fix.md]
---

# Phase 5: ハーネス hook Low 22件 + 5根因の構造対処

> gtr worktree で実施。Low 16修正 + 2既修正 + #5据置 + 2精査無変更 + 5根因規約ガイド新設。PR #21 マージで監査60件を一巡。live反映は ~/.claude が別branch+WIP のため保留 (HITL: 何もしない)。

## 概要

hook 60件監査の最終フェーズ。Critical 3(#4)/ High 18(#15,#19)/ Medium 17(#20)に続く Low 22件 + 5根因の構造対処。PR #21 マージ済 = origin/main に60件すべて反映。今回から worktree を **gtr** (`gtr new`/`gtr rm`) で正道運用 (Phase 1-4 の plain git worktree から是正)。

## 内容 (5バッチ + 設計、worktree fix/hooks-low-phase5)

### B1 根因4横断 (38bd447) — #1,10,11,12,13,14,15,20
nocasematch + `.mts/.cts` (emoji/lint/line_limit) / plans_redirect に `*.MD`,`*.markdown` / fm_schema CRLF・BOM・行末空白を正規化 / stop_handoff CRLF 正規化。検出側の拡張=取りこぼし是正ゆえ over-block なし。

### B2+B3 (9376120) — #2,#8
read_secret の dir パターン (.ssh/.aws/.gcp/.azure/.config-gcloud) を末尾アンカー `(/|$)` 化し末尾スラッシュなしの dir 参照も捕捉 / stop_words 口調ルールに全角疑問符版を追加 (半角しか拾わなかった穴)。

### B4 個別 (cc404b0) — #3,4,6,16,17,18,19
pre_commands command `//empty` (#3) / generated_ban に gh pr comment,review,merge 追加 (#4) / **hardcode が MultiEdit edits[].new_string を検査** (#6, Phase4 で matcher に MultiEdit 足したが hook が読まなかった穴) / mcp_notify 非mcp guard (#16) / bang_selfref 語中感嘆符除外 `(^|space)!` + 出現数カウント (#17,18) / compact+stop handoff の `stat -f` に GNU `stat -c %Y` フォールバック (#19、同根 sibling も同時)。

### #5 据え置き (HITL)
generated_ban の散文誤block (禁止署名を文中で言及するだけの commit を誤block)。Prohibition級ガードを緩めると本物がすり抜ける回帰リスク → 強度優先で broad 維持。Phase4 #13/#4 と同じ「安全側で据置」判断。

### B5 uncertain 2件 — 精査の上 変更なし
#22 external_input の mcp__ 分岐は matcher が WebFetch|WebSearch ゆえ未到達だが、コメント付き意図的防御コード (matcher拡張時の二重タグ防止) → 削除せず。#21 stop_plan_archive の STOP_HOOK_ACTIVE guard は他Stop hook も未採用・mv冪等で実害低 → 据置。

### 設計の締め (fe0ad03)
`.docs/hook-authoring-guide.md` 新設。5根因 (文章をregexで読む/fail-open/命名決め打ち/境界の数え違い/変数素展開) ごとに禁止パターン+規約+実例+チェックリストを固定。再発防止層の前段。

### 検証
各 hook を /tmp で両方向 (取りこぼし→捕捉 / over-block→緩和 + 正常系維持)。rules を hook が live パス直読みするため、rules 変更 (#2/#8) はパターンが hook 内 or grep 単体で照合可能な範囲で確認。全13 shell hook `bash -n` 通過、変更JSON妥当。

## 副作用 / 重要な学び (Gotcha級・横展開価値)

1. **gtr の worktree 配置**: `~/.claude` repo の worktree が gtr の管理root `/Users/camone/dev/claude-code/.worktrees/claude-code-learn/` 配下に解決され、命名 (claude-code-learn/fix-hooks-low-phase5) はやや紛らわしいが機能は正常 (registered worktree、hook群在)。後始末は `gtr rm <branch>` で metadata 込み整合。Phase1-4 の plain git worktree (自前 `~/.claude-wt/`) から gtr へ是正。
2. **self-poisoning 再発**: 口調 keyword を「解説のため引用しただけ」の応答文に live stop_words が反応し応答を一度差し戻した。**#8/根因1 (文章を機械的に読む→引用と実使用を区別不能) の生きた実例**。回避: 修正対象語を地の文に literal で書かない (Phase3 Gotcha と同じ)。完全には消せぬ構造的限界。
3. **live反映は他者branch状態で保留**: マージ後に ~/.claude が別branch (fix/hooks-stop-words-half-hedge) + WIP だった。pull/切替は他者作業を壊すため実施せず、origin/main に委ね branch同期時の自然統合に任せた (HITL: 何もしない)。他エージェント作業の非破壊原則。
4. **rules-referencing hook の faithful test** (Phase4 継承): hook が live rules を直読みするため、worktree の rules 変更は hook を /tmp コピー+rulesパス差替で検証する必要がある。

## 残課題 (本フェーズ外・別取り組み)

再発防止層の本丸=「**hook 実装を検証する hook/テスト**」の恒久化 (今回手動の /tmp 両方向検証の自動化)。`.docs/hook-authoring-guide.md` はその前段 (規約固定)。`/review-harness` の死角 (配線済みかまでしか見ない) を「実装が動くか」へ広げる別 PR とする。

## 関連ファイル

- .docs/plans/2026-06-15-harness-hooks-bug-fix.md — plan (Phase 5 を済に更新)
- .docs/output/explain-in-html/260619_pr21-hooks-fix-plain.html — PR #21 わかりやすい解説HTML
- PR #4/#15/#19/#20/#21 — kaijutale/claude-harness (監査60件 全Phase)
- ~/.claude/.docs/hook-authoring-guide.md (merge後) — 5根因規約ガイド
