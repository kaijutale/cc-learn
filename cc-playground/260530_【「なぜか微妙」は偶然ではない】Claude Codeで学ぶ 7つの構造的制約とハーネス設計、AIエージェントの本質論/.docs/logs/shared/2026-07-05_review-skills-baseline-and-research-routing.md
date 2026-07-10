---
date: 2026-07-05 09:57:02
type: work
topic: review-skills-baseline-and-research-routing
session: 未設定
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md
related_skill: [review-harness, review-agent-essence, essence-reviewing-orchestrator, conducting-research-phase, creating-gtr-worktree, explain-in-html, logging, handoff]
related_agent: [Explore, Plan, claude-code-guide, harness-essentials-reviewer, skill-essentials-reviewer, ui-essentials-reviewer]
related_plan_id: 2026-07-03-review-skills-enhancement
related_plan: .docs/plans/2026-07-03-review-skills-enhancement.md
related_log_ids: []
related_log: []
---

# review系skill強化セッション: issue起票 → research routing敷設 (PR #85) → baseline取得 7run

> 3日間 (07-03〜07-05) のセッション成果の記録。issue 12件起票・research置き場の実在検証と可視化改修 (PR #85 merge済)・
> 改修前 baseline 7run の取得まで。次は issue #73 実装サイクル (kaiju 判断3点が先行)。

## 概要

review系skill 3系統 (review-harness / review-agent-essence / essence協調一式) の強化プロジェクトの前半戦。
調査 (Phase 0) → 設計 (Phase 1) → issue化までを完了し、実装 (Phase 2) の前提となる baseline を確保した。
途中、調査成果物をログ置き場へ誤配置した事故から「research 置き場の実在検証」が派生し、
可視化改修 (PR #85) として先行着地した。

## 内容

- **issue 起票 (07-03 17:31-32)**: #73〜#83 の11件を一括起票 (P0×2 / P1×4 / P2×5、ラベル P0/P1/P2/HITL 新設)。
  出典は `.docs/research/review-skills-gap-analysis.md` (Explore 3体調査) と plan
- **research 置き場の実在検証 (07-04)**: 7層検証で「定義・配線・器は実在、運用実績・常駐露出・到達可能性は不在」と確定。
  Claude Code v2.1.200 のコード解析で skill 一覧の文字数バジェット (既定約8,000字) と生存スコア
  (使用回数 × 7日半減期) による description 落ち機構を特定。skill 棚卸しを #84 として起票
- **PR #85 (07-04〜05)**: rules/research-phase.md 新設 + plan-workflow 接続 + conducting-research-phase の
  トリガー/Gotcha 補強。worktree + branch + PR の流儀で kaiju レビューを経て merge (ab44586)。
  ※本体直接改修 → 差し戻し → worktree 再適用の経緯あり (プロセス是正)
- **baseline 取得 (07-05)**: 7run を直列実行、成果物13件を `.docs/baselines/review-skills-2026-07/` へ確保
  - review-harness → ~/.claude: S/96% ×2 (総点一致、⚠️は A4+D1 → A2+A4 で入替わり)
  - review-harness → 本プロジェクト: S/96% → S/98% (⚠️は A4+D3 → D1 で完全入替わり)
  - review-agent-essence → logging skill: △8 → △6 (S-1.1 判定が「最優先改善」⇔「強み」で真逆に反転)
  - orchestrator (3領域) → logging skill: 🟡 Critical 0 / High 1 / Medium 6 / Low 4 (9/9 step + verdict整合 exit 0)
- **baseline からの実測知見**: 総点・verdict は安定、指標・原則レベルの個別判定は大きく揺れる。
  改修後の合否判定は「総点が分散帯内 + 個別変動が PR の意図で説明可能」の二段で見る

## 設計意図

- baseline を issue 着手前に取得: 「現状の質を落とさない」の合否を宣言でなく比較で判定するため。
  改修が入る前の main でしか取れない
- orchestrator の baseline run は logging skill を対象に固定: review-agent-essence と同一対象にし系統間比較を可能にするため

## 副作用

- **新 High 1件 (issue 未登録)**: logging skill「shared/ 直書き禁止」とプロジェクト CLAUDE.md「全ログ shared/」の
  無裁定衝突を orchestrator baseline が検出。本ログの書込自体もこの衝突に直面し、
  プロジェクト CLAUDE.md (明示的なプロジェクト固有指示) を優先して shared へ記録した — 恒久裁定は kaiju 判断待ち
- **essence-gate への影響**: High=1 の record が最新となったため、~/.claude への次 commit が block されうる
- 判断保留3点は `.claude/handoff-state.md` の blockers に機械可読で記録済み

## 関連ファイル

- .docs/research/review-skills-gap-analysis.md — Phase 0 調査の正本 (07-04 に logs から移設・追認済み)
- .docs/plans/2026-07-03-review-skills-enhancement.md — 実行計画 (status: implementing。※.docs/plans/ は gitignored)
- .docs/baselines/review-skills-2026-07/ — baseline 成果物13件 (run別ラベル付き)
- .docs/output/explain-in-html/260704_review-skills-gap-analysis.html — 調査解説
- .docs/output/explain-in-html/260704_research-place-existence-audit.html — 実在検証 + 改善意見
- .docs/output/explain-in-html/260704_issues-73-84-creation-timeline.html — issue 起票タイムライン
- .docs/output/explain-in-html/260705_post-merge-85-worklog.html — merge 後作業ログ
- ~/.claude/.docs/essence-review-records/2026-07-05_005459__Users_camone_.claude_skills_logging.md — orchestrator baseline record
- https://github.com/kaijutale/claude-harness/pull/85 — research routing 改修 (MERGED)
- https://github.com/kaijutale/claude-harness/issues/73 〜 84 — 強化 issue 12件
