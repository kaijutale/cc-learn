---
date: 2026-07-21
type: design-brief
topic: harness-adoption-audit-skill
purpose: 「note セクション → 自ハーネス実装照合 → 判定ログ」の反復 workflow を global skill 化するための設計ブリーフ
target_location: ~/.claude/skills/ (global・harness実体)
lane: worktree + PR (main から直接作成不可 = deny #173)
author_context: V-1.2 深掘り (2026-07-21) をあたし(ブルマ)が実際に回した手順の externalize
---

# 設計ブリーフ: harness-adoption-audit skill (global)

> 隔離セッション (env+cwd 両向き + /login 済み) でこのブリーフを Read → `authoring-skills` skill を使って `~/.claude/skills/harness-adoption-audit/SKILL.md` を作成 → commit → PR。essence review gate を通す。

## 1. なぜ作るか (根拠)

「note のあるセクション → 自ハーネス (`~/.claude`) で実装済みか / どう実装されてるか → 判定 + 実データ + 残差」という**同一構造の手作業を直近3日で7回**繰り返した (実データ):

- `2026-07-19_k-2-2-doc-structuring-adoption-check`
- `2026-07-20_k-2-3-observability-adoption-check`
- `2026-07-20_k-2-4-config-externalization-adoption-check`
- `2026-07-20_v-chapter-deterministic-verification-adoption-check`
- `2026-07-20_v-1-1-failure-promotion-ladder-deepdive`
- `2026-07-20_s-chapter-trust-boundary-permissions-adoption-check`
- `2026-07-21_v-1-2-feedback-speed-law-deepdive`

残り予定: V-1.3 → V-2 → V-2.1 → V-2.2 → E章 → 巻末チェックリスト (最低6回)。**過去7 + 未来6**。これは V-1.1「失敗(反復手作業)を仕組みに昇格させる」の自己適用。

## 2. 何をする skill か (責務)

**入力**: 記事セクションの参照 (text.md のパス + 行範囲 or セクションID)、監査対象ハーネス (既定 `~/.claude`)、ログ出力先。
**出力**: 判定ログ 1本 (取り入れ済み / gap + severity + 実データ + 残差)。
**やらないこと**: ハーネスの改修 (監査専念・verifier)。判定の捏造 (実データにトレースできない主張)。

## 3. workflow (固定6ステップ = V-1.2 で実際に踏んだ手順)

1. **記事セクション Read**: text.md の指定行範囲を読む。関連セクション (前後・参照先) も掴む。
2. **親バッチlog照合**: 既存の `*-adoption-check` / `*-deepdive` log に該当セクションの1行判定が既にあるか確認。**あれば深掘りは「✅ 再確認」でなく差分を掘る**方針にする (重複回避)。
3. **ハーネス実測スキャンをサブエージェント委譲**: `Explore` or `general-purpose` agent に `~/.claude` の該当領域を Read/Grep/Bash で洗い出させる。**判断させず事実 (ファイルパス・トリガー・検査内容) だけ**を構造化テキストで返させる。→ メインコンテキスト保護 (critical-thinking: 調査スコープ限定・委譲)。
4. **判定 + 反例狩り**: 取り入れ済み / gap を severity 付きで。**「問題ゼロを疑う」で能動的に反例を探す** (review inflation 防止)。原則単位・段単位でストレステストし、「本来もっと早い/強い場所で守れるのに守れてない」箇所を探す。
5. **判定ログを確立済み frontmatter 形式で書く** (§4 の contract)。
6. **committer で単一ファイル commit → push は handoff** (push はかいじゅう専用)。

## 4. 出力 contract (frontmatter + 節構造。既存logと機械一貫させる)

frontmatter 必須キー: `date` / `type: study` / `topic` / `session` (「…単独深掘り (取り入れフェーズ第N弾)」) / `related_article` (text.md パス + **行範囲を明記**) / `related_skill` / `related_log_ids` / `related_log`。

本文節構造 (V-1.1 / V-1.2 log 準拠):
- タイトル (判定を含む): `# <セクション>単独深掘り — 判定: <取り入れ済み/gap> …`
- `> ` blockquote サマリー (核心1段落)
- `## 概要`
- `## 内容` (note の定義 → ハーネス実体の対応表 → 原則/段の個別照合)
- `### 記事超え点`
- `### 残差 / 改善候補` (severity 付き)
- `判定:` 明記
- `## 関連ファイル` (照合したハーネス実ファイルを列挙)

## 5. Gotcha (必ず SKILL.md 末尾に must/should/avoid で入れる)

- **must**: ハーネス実測は必ずサブエージェント委譲 (理由: メインコンテキスト保護。ハーネスは巨大で直読は汚染)
- **must**: **全ての事実主張は scan 出力 or 直接 Read にトレースできること** (理由: 2026-07-21 PR #212 で `autoMemoryEnabled=true` と書いたが実値 false = 捏造。独立レビューでのみ検出された。実測ラベルは自動で真にならない)
- **should**: 反例を能動的に狩る・問題ゼロを疑う (理由: バッチの1行 ✅ を再確認するだけでは深掘りの価値ゼロ)
- **should**: 親バッチlog を先に照合 (理由: 重複作業回避・差分に集中)
- **avoid**: severity を付けず「なんとなく取り入れ済み」で締める (理由: 判定の機械可読性が死ぬ)
- **avoid**: 意味論検査 (事実性・設計妥当性) の不在を gap 扱いする (理由: 意味論は最速段/hook に移せない構造限界 = 正しい配置。V-1.2 原則1の限界・V-1.1 issue #211 と同じ境界)

## 6. 命名・スコープ・配置

- 候補名: `harness-adoption-audit` (or `auditing-harness-adoption`。既存 `auditing-*` 系の命名に寄せるなら後者)
- global 汎用性 (harness-policy §13): 特定記事パスをハードコードしない。記事パス・ログ出力先は**引数 or 起動時に受ける**。machine 固有絶対パス禁止 (`~/.claude` / `$HOME` 形式のみ)。
- 既存の近縁 skill と衝突しないこと: `review-harness` (25アンチパターン診断) / `harness-essentials-reviewer` (essence原則照合) とは別物 = **「外部ベストプラクティス記事 vs 自ハーネス実装」の照合**が固有の核。SKILL.md 冒頭で差別化を明記。

## 7. 完成後

- この学習PJ側の handoff / 次回 V-1.3 深掘りから、この skill を起動して回す。
- project-local へ降ろす必要はない (global = 全記事学習PJで再利用可)。
