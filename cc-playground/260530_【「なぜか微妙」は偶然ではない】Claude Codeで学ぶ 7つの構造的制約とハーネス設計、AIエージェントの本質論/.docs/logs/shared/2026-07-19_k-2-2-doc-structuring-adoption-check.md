---
date: 2026-07-19 21:21:11
type: study
topic: k-2-2-doc-structuring-adoption-check
session: K-2.2 取り入れ確認 (取り入れフェーズ第1弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (K-2.2 = 1574〜1629行)
related_skill: [pickup, logging]
related_log_ids: [2026-07-19_global-harness-changelog-review]
related_log: [.docs/logs/shared/2026-07-19_global-harness-changelog-review.md]
---

# K-2.2「ドキュメントは捨てるのではなく構造化する」取り入れ確認 — 判定: 取り入れ済み・改修見送り

> note K-2.2 の推奨 (3層ドキュメント構造 + ADR パターン) を `~/.claude` 実態と照合。**機能実効ベースで取り入れ済み**と判定し、唯一の gap 候補「変更頻度の明示ラベリング」は**名目 gap (実害なし)** として改修見送り。取り入れフェーズ (K-2.2→K-2.3→K-2.4) の第1弾完了。

## 概要

07-19 未明の handoff で合意した「取り入れフェーズ」の開始点 = K-2.2。前セッションの予備調査は「大部分導入済み、唯一の gap 候補 = 変更頻度ラベリング」までを ls/find レベルで立てていた。本セッションはその宣言どおり **中身を読んで** gap の有無を確定した (「動く」≠「取り入れ済み」— 機能実効まで見る、の実践)。

記事 K-2.2 の推奨は 2 本:

1. **3層ドキュメント構造** — 変更頻度で分ける (Layer 1 原則=年単位 / Layer 2 戦術・ADR=四半期〜月 / Layer 3 実行・SKILL.md=週〜日)
2. **ADR パターン** — 「何を決めたか」だけでなく「なぜ決めたか」「何を却下したか」を記録

背後の主張: 避けるべきは「腐敗しやすく検証不能な自由記述」、残すべきは「構造化され検証可能な文書」。

## 内容

### 照合結果: 3層すべて実在し、統制の重さも層で分かれている

| 記事の層 (変更頻度) | `~/.claude` の対応物 | 安定性の宣言 / 統制 | 実測根拠 |
|---|---|---|---|
| Layer 1 原則 (年単位) | `.docs/essence/essence-docs/` (harness/skill/ui/agent の4本) | README が「**数学の公式のように不変**」「プロジェクト・技術スタック・時代に依存しない」と明示宣言。更新は週1の PR 駆動ループ (`proposing-essence-updates`) + HITL のみ | essence-docs/README.md 実読。`essence-review-records/` に直近 2026-07-18 の稼働記録 |
| Layer 2 戦術 (四半期〜月) | `.docs/decisions/` (ADR 0001/0002 + `_TEMPLATE.md`) | frontmatter `status` ライフサイクル (proposed→accepted→deprecated/superseded) + `created`/`updated` 日付。**却下代替案セクションは `hook_pre_commit_adr_gate.sh` → `verify-adr.sh` (fail-closed, exit 0/1/2) が commit 時に機械強制** (#146) | `_TEMPLATE.md` + ADR-0001 実読。gate/script の実在は 07-19 probe で実測済 (handoff 記載) |
| Layer 3 実行 (週〜日) | `skills/*/SKILL.md` (71本) + `.docs/progressive-disclosure/` (11本) + hooks | `accumulating-reviewer-feedback` による Gotcha 蓄積ループ (HITL accept/defer)、hooks はテスト必須 (`hooks/test/cases/`) | `ls skills | wc -l` = 71、progressive-disclosure 11本 |

ADR は記事のサンプル (ADR-003 Redis) と同じ要素 (Context / Decision / 却下代替案 / Consequences) に加え、記事に無い **撤退条件 (Reversal) セクション**と**機械強制**を持つ。**Layer 2 は記事の"推奨"水準を超えている** (記事はテンプレ提示止まり、機械強制までは言っていない)。

### gap 候補「変更頻度の明示ラベリング」の判定 — 名目 gap であり実害 gap ではない

実測: 「変更頻度 / 年単位 / 週単位 / 四半期 / 原則層 / 戦術層 / 実行層」で `~/.claude` の主要ドキュメント (.docs/README.md、essence-docs/README.md、CLAUDE.md、progressive-disclosure/ 全11本) を grep → **0 件**。文字通りの頻度語ラベルは存在しない。3層を1箇所で俯瞰するマップ文書も無い。

しかし記事がラベリングで達成したい**機能**は 3 つとも別の (多くはより強い) 機構で充足済み:

1. **「どの文書が安定か読者に分かる」** → 各層の入口が自己宣言している (essence README の不変宣言 / ADR frontmatter の `status` / SKILL.md は手順書という性質自体が実行層を示す)。ADR の per-document status は層一括の頻度ラベルより粒度が細かい
2. **「層ごとに更新の重さが変わる」** → essence = PR + HITL (重) / ADR = 機械ゲート (重) / skills = feedback ループ + HITL (中) / hooks = テスト必須。頻度ラベルが暗黙に要求する「安定層ほど変更審査が重い」構造がプロセスとして実装済み
3. **「腐敗防止 = 検証可能性」** → `verify-adr.sh` / `check-essence-sync.sh` / hook 回帰テスト。自由記述の腐敗リスクは「手順正本ポインタ」運用 (ログでなく正本ドキュメントへ誘導) で緩和済み

**見送り理由**: 頻度語ラベルだけを足しても機械は読まず参照実態も生まれない = 飾り。`~/.claude` 自身が運用する原則1「無駄な概念を登場させない」(.docs/README.md が L2 6カテゴリ器の先回り設置を却下した際の根拠) に抵触する。過去の観測レビュー (07-11〜07-19) でもドキュメント層の混同・stale 参照に起因する issue は 0 件で、実害の証跡が無い。

**保留提示 (却下ではない)**: `.docs/README.md` に 3層対応表 ~10行を足す案は onboarding 価値が残る。ただし各入口の自己宣言と重複するため優先度は低い。採否はかいじゅう判断。

### 重要発見 (記事には書かれていないレベル)

- **「安定層」ほど更新ループは高頻度に回っている逆説**: essence-docs は「不変」を宣言しつつ、週1の陳腐化点検 (`proposing-essence-updates`) が回る。安定性とは「変更されないこと」ではなく「**変更が統制されていること**」— 記事の頻度ラベル (年単位=触らない) より実態は一歩先を行く。頻度でラベルするより「変更の入口 (PR+HITL / 機械ゲート / feedback loop)」でラベルする方がエージェント環境では実効的
- **ラベルの代替は「入口の自己宣言 + 統制の重さの差」**: 記事の3層は「読者が頻度を知る」ための静的ラベルだが、ハーネスでは「書き手 (エージェント) が変更しにくさに直面する」動的構造の方が腐敗防止として強い

## 関連ファイル

- `.docs/references/260405_…/text.md` (1574〜1629行) — K-2.2 本文 (照合の基準)
- `~/.claude/.docs/essence/essence-docs/README.md` — Layer 1 の不変宣言 + 週1更新フロー (実読)
- `~/.claude/.docs/decisions/_TEMPLATE.md`, `0001-claude-md-detail-placement.md` — Layer 2 の実物 (実読)
- `~/.claude/.docs/README.md` — L2 器の adopt-on-use 判断 + ADR 機械検証の建付け (実読)
- `.claude/handoff-state.md` — 前セッションの予備調査とフェーズ計画 (本ログはその step 1-2 の完了報告)
