---
date: 2026-06-13 23:55:16
type: qa
topic: authoring-claude-md-c6-anti-anchor-reflection-check
session: C-6 anti-anchor 反映調査
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [review-agent-essence, authoring-claude-md, logging]
related_plan_id: 2026-06-13-authoring-claude-md-c6-anti-anchor
related_plan: /Users/camone/.claude/.docs/plans/2026-06-13-authoring-claude-md-c6-anti-anchor.md
---

# C-6 anti-anchor 手法は authoring-claude-md に反映されているか (調査 + Plan 外部化)

> note C-6「明示的なデフォルト宣言」の anti-anchor 手法 (`Jest ではない` 等で主流を明示排除) が CLAUDE.md 作成 skill に反映されているかを /review-agent-essence で調査 → 未反映 (×) を確定し、反映 Plan を外部化。実装は HITL ゲートで停止。

## 概要

- 問い: note C-6「訓練データの断崖」サブセクション「明示的なデフォルト宣言」の After 例が示す anti-anchor 手法 (非主流の選択肢を使う時、主流側を `Vitest (Jest ではない)` `fetch (axios ではない)` と明示排除してアンカーを上書きする) が、CLAUDE.md 作成 skill (`authoring-claude-md`) に反映されているか。
- 手段: `/review-agent-essence` (agent-essence 評価基準による設計レビュー、fork 実行)。
- 結論: 未反映 (×)。

## 内容

### 調査結果 (機械検証)

- skill 全ファイル (SKILL.md + references/ 7本 + scripts/) を `ではない|Jest|axios|デフォルト宣言|アンカ|主流|断崖|cutoff|訓練データ` で grep → ヒット 0 件。手法・C-6 制約・「主流選択肢の明示排除」の発想いずれも記述なし。
- 反例が同梱: `references/sample-claude-md.md` の「良いサンプル」が `Vitest` / `Supabase` / `Drizzle ORM` を anti-anchor マーカーなしで裸列挙 = 手法未適用の見本が「お手本」として配られている二重の穴。

### 原則適用 (要点)

| 原則 | 重要度 | 判定 |
|---|---|---|
| C-6 訓練データの断崖 | 高 | × anti-anchor 宣言の記述が皆無 |
| C-2 入力バイアスの増幅 | 高 | × 主流ライブラリ名のアンカー問題に無対処 |
| K-2 / E-2 | 中 | △ 土台はあるが C-6 文脈の理由づけ欠落 |
| 原則3 Less is More | 高 | ○ 200行を validate-claude-md.sh で機械検証 |

### 意思決定

- AskUserQuestion で次アクションを確認 → kaiju が「Plan作成 (推奨)」を選択。
- 反映 Plan を `~/.claude/.docs/plans/2026-06-13-authoring-claude-md-c6-anti-anchor.md` に外部化 (status: planning)。
- Plan の骨子 = skill 配下 5 箇所の後方互換編集:
  1. context-design-principles.md 最小セットに anti-anchor 原則追加
  2. 同ファイルに anti-anchor 専用サブセクション (適用ガード込み) 新設
  3. ミニマルテンプレート Stack 行に任意注記
  4. sample-claude-md.md を `Vitest (Jest ではない)` の 1 箇所のみ是正 (ガード実演)
  5. validate-claude-md.sh に Check 6 (WARN のみ、FAIL 増やさず exit code 不変) 追加
- 実装 (Phase 3) は HITL ゲートで停止中 (kaiju の GO 待ち)。

### 重要発見 (記事に書かれていないレベル)

- 「手法の有無」と「手法の正しさ」は別: 単に anti-anchor を skill に足すと別原則を壊す。レビューが 2 つの見落としを抽出:
  - 過剰適用 → 全 Stack 行が `X ではない` で膨張し原則3 (200行・電報スタイル) と正面衝突。
  - 「主流」判定が cutoff 依存で腐る (K-2)。対抗馬名ハードコードは古い情報=ノイズ化。
  - 対処 = 「非主流 かつ アンカー誤爆の実害があるカテゴリのみ」適用 + 「判断理由を主・対抗馬名を従」の書式ガードを手法とセットで入れる。
- 契約照合: authoring-claude-md は協調網 (harness-modification-policy:90-92) 非依存の単体 skill = L2/L3。全変更が加算・後方互換。validate は WARN のみ追加で exit code 不変 → 呼出側契約を壊さない。
- C-4 (自己申告 ≠ 完了) 対策を内蔵: 「反映したつもり」を防ぐため validate に決定論 WARN を相乗りさせ、生成 CLAUDE.md が実際に anti-anchor を含むかを機械検出に委ねる設計とした。

## 関連ファイル

- `/Users/camone/.claude/.docs/plans/2026-06-13-authoring-claude-md-c6-anti-anchor.md` — 反映 Plan (本ログの主成果物、実装待ち)
- `/Users/camone/.claude/output/essence-review-2026-06-13-2040.md` — essence レビュー本文
- `/Users/camone/.claude/output/essence-review-2026-06-13-2040.html` — 同 HTML
- `/Users/camone/.claude/skills/authoring-claude-md/references/context-design-principles.md` — 改修対象 (Edit 1-3)
- `/Users/camone/.claude/skills/authoring-claude-md/references/sample-claude-md.md` — 改修対象 (Edit 4、現状は反例)
- `/Users/camone/.claude/skills/authoring-claude-md/scripts/validate-claude-md.sh` — 改修対象 (Edit 5)
- `.claude/handoff-state.md` — 本セッションの引き継ぎ記録 (status: blocked)
