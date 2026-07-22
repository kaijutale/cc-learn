---
date: 2026-07-22 12:39:43
type: study
topic: v-1-2-feedback-speed-differential-reaudit
session: V-1.2 差分再監査 (取り入れフェーズ第10弾 — 第7弾の差分フォロー。第9弾 V-2 は HITL 指示により中断中で、完了順は 10→9 と前後する)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-1.2 = 1826〜1844行、関連: V-1.1 = 1785〜1824行 昇格ラダー / V-2 = 1864〜1893行 閉ループ)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-21_v-1-2-feedback-speed-law-deepdive, 2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-22_v-1-3-narrow-options-before-inference-deepdive]
related_log: [.docs/logs/shared/2026-07-21_v-1-2-feedback-speed-law-deepdive.md, .docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-22_v-1-3-narrow-options-before-inference-deepdive.md]
---

# V-1.2「フィードバックは速いほど強い」差分再監査 (第7弾フォロー) — 判定: 取り入れ済み継続 (hook 層 0 変更で全主張再確証) · 差分 = 意味論検査の workflow-local 前倒し

> 核心の構造事実: 第7弾 (07-21 12:22 実測) 以降の差分窓に入った commit は 8 本 (merge 3 含む) で、**settings.json / hooks/*.sh に触れたものは 0 件** — 第7弾の 4 段トポロジー実測 (段0 前倒し / 段2 畳み込み / 段3 CI 不在 / 反例①②) は全て現在も byte 単位で成立する。差分の実体は skill 層に集中 — 非 merge 5 commit 中 3 本が harness-adoption-audit skill の新設 (21f8e67、**第7弾執筆のわずか約 2 時間後**) と強化、残る doc 層 2 本は V-1.2 非関与 — で、その step 6 独立検証ゲートは第7弾が「最遅の人間段に住む (前倒しできない)」と結論した**意味論検査 (事実主張の実体照合) を、commit 前の独立 agent 段へ workflow-local に前倒し**した — 第8弾で実誤り (deny 内訳の誤算入、本文 3 箇所の断定) を commit 前に捕捉した実測証拠つき。反例狩りの収穫は 2 件: [Low] 第7弾トポロジー表が既存の段0 advisory hook (probe-before-persist、07-09 から配線済み) を欠いていた補正 / [Low] 意味論前倒しの射程が skill 経由 commit に限られる workflow-local 性 (トレードオフとして記録)。

## 概要

取り入れフェーズ第10弾。呼出は `/harness-adoption-audit V-1.2` — V-1.2 は第7弾 (2026-07-21_v-1-2-feedback-speed-law-deepdive) で深掘り済みのため、skill step 2 の規律 (既存 deepdive があれば再確認でなく差分を掘る) に従い**差分再監査モード**で回した。差分窓 = 第7弾の実測時刻 (07-21 12:22) 以降のハーネス変更。第9弾 (V-2) は本監査の HITL 優先指示により step 3 完了時点で中断中 (scan 成果物は退避済み)、完了順は 10→9 と前後する。ハーネス実測は read-only Explore サブエージェントに委譲 (差分窓限定 scan)。

**自己言及の開示**: 本差分の核心は harness-adoption-audit skill 自身 (本監査を回している workflow そのもの) に関する主張を含む。skill の Gotcha「自己監査回避」に従い、自己言及主張は step 6 の fresh 独立検証者が実ファイルと突合する (著者の自己申告で closed にしない)。

## 内容

### 差分窓の実測 (07-21 12:22 → 07-22 12:39)

窓内 commit は 8 本 (Explore scan 実測、`--since="2026-07-21 12:00"` で列挙し境界 12:22 以前の非 merge は無しを確認):

| commit | 日時 | 内容 | 層 |
|---|---|---|---|
| 21f8e67 | 07-21 14:14 | harness-adoption-audit skill 新設 (SKILL.md + output-contract.md + essence record v1) | skill |
| a0fb306 | 07-21 15:48 | isolation doc §1 に -C どこからでも追記 (#211 続き) | doc |
| 10d30b5 | 07-21 15:51 | skill 強化: verifier harden (検証者 3 条件明文化・Explore 除外・三段 fail-close) + record v2 | skill |
| 89d1a01 | 07-21 15:52 | skill 全体像の解説 HTML 回収 (.docs/output) | doc |
| 44170ec | 07-21 20:27 | merge PR #213 | merge |
| 545724c | 07-22 00:49 | merge PR #214 | merge |
| 28fc0c7 | 07-22 09:46 | skill へ HTML 解説 step 追加 (workflow 7→8 ステップ化) + record | skill |
| 1bcb0ca | 07-22 09:48 | merge PR #215 | merge |

**settings.json / hooks/*.sh を変更した commit = 0 件** (scan 実測: `git log --since -- settings.json 'hooks/*.sh'` が空)。未 commit の追跡変更 2 件 (M CLAUDE.md / M settings.json) も V-1.2 に非関与と確認済み: CLAUDE.md は References 誘導行の 1 項目 1 行分割のみ (6 行 +4/-2、内容増減なし)、settings.json は `"model": "claude-fable-5[1m]"` の 1 行追加 (model 指定 churn)。ほかに未追跡のセッション生成物 3 件 (local ログ 2 本 + output HTML 1 本) があるが hooks/settings.json には非接触。

### 第7弾主張の再確証 (hook 層 4 点 — 全て成立)

| 第7弾の主張 | 現在値 (scan 再実測) | 判定 |
|---|---|---|
| `.git/hooks/` にネイティブ git フック未インストール (段2 は段0 へ畳み込み) | 14 エントリ全て `*.sample`、実体フック 0 件 | 成立 |
| 段3 (CI) 不在 = 記録済み構造判断 | `~/.claude/.github` ディレクトリ自体が不存在 | 成立 |
| 反例① `hook_validate_claudemd.sh` は SessionStart:compact のみ配線 | settings.json 内出現 1 箇所 (line 580)、`"matcher": "compact"` 配下のみ | 成立 (Low 据え置き、昇格なし = V-1.1 再発待ち規律と整合) |
| 反例② `validate-knowledge.py` はハーネス repo 未配線 | 手動コピー配布方式のまま、`~/.claude` 常設 pre-commit 無し (本セッション V-2 用 scan でも同値) | 成立 (構造制約 据え置き) |

hook 層 0 変更ゆえ、第7弾の 4 段トポロジー (段0 発明 / 段2 畳み込み / 原則 1〜3 の照合結果) は再測定でも全て維持。**差分監査の答えが「変わっていない」で終わらないのは、V-1.2 に関与する変更が全て skill 層 (harness-adoption-audit の 3 commit) に積まれたから** (doc 層 2 本は V-1.2 非関与) — 以下が本監査の核心。

### 差分の核心: step 6 独立検証ゲート = 意味論検査の前倒し (第7弾結論の更新)

第7弾の結論 (l.67): 「この事実主張は真か」の意味論照合は決定論 detector にできず、**「正しく最遅の意味論レビュー段に住んでいる」** — 根拠は PR #212 の捏造 (`autoMemoryEnabled=true`、実値 false) が PR 化後の人間駆動レビュー段で初めて捕捉された実例 (第7弾 l.65 の枠組み。#212 記録上の近接検出者は、人間が駆動した多層レビュー内で spawn された盲検 LLM レビュアー)。

その執筆の約 2 時間後 (21f8e67、07-21 14:14) に生まれた harness-adoption-audit skill の step 6 は、この配置を動かした:

- **何が前倒しされたか**: 「判定ログの全事実主張が `~/.claude` の実体にトレースできるか」= まさに #212 型の意味論検査。step 6 は commit の**前**に fresh 独立サブエージェント (read-only) へ検証させる (SKILL.md l.50 逐語: 「独立トレーサビリティ検証ゲート (fail-close) — commit の前に、書いた判定ログを fresh な独立サブエージェントに渡し、全ての事実主張が `~/.claude` の実体に本当にトレースできるかを独立検証させる」)。
- **速度差の実測**: #212 (第7弾の根拠例) は捏造が PR 化後の人間駆動多層レビュー (近接検出者は盲検 LLM レビュアー) で検出 = 段4 のタイミング・コスト大。第8弾 (V-1.3、07-22) では step 6 が「deny 丸ごと消し 0 件」という load-bearing な誤断定 (本文 3 箇所に及ぶ — 第8弾ログ l.44) を **commit 前に捕捉** = 修正者 LLM・コスト小。収束までの検証巡回は第8弾の commit message (1e81043) に「3 round 収束」と記録。同型の誤り (実測値の誤記) の検出点が段4 → commit 前へ移動した実測ペア。
- **V-1.2 の語彙で言うと**: 原則2「修正者が LLM 自身であるほど速い」が意味論検査にも適用された。ただし手段は決定論 hook でなく**確率的な独立 LLM 検証** — 収束規定 (l.55「直した主張は step 6 に再投入する…指摘ゼロに収束するまで繰り返し、無限後退は step 8 の HITL で打ち切る」) と検証者 3 条件 (l.51: full 読解可 / audit 可 / Edit・Write 非所持) で確率性を補強し、最終 backstop は依然 HITL (段4)。
- **第7弾結論の正確な更新**: 「意味論検査は決定論 hook に移せない」は不変 (今回も hook 化されていない — 検証ゲートは skill workflow 規律 = L1 相当)。更新されるのは「ゆえに最遅段に住むしかない」の側 — **意味論検査でも、独立 agent を検証者に立てれば段4 より手前 (commit 前) で回せる**。ラダーに「決定論ゲート (段0-2) と人間レビュー (段4) の間の中間段」が生えた。

### 記事超え点

1. **意味論検査の中間段の発明**: note の 4 段表は意味論検査 (設計妥当性・事実性) を「人間レビュー (コスト大)」に置く。ハーネスは決定論/意味論の境界を保ったまま、独立 agent 検証という中間段を挟み、意味論フィードバックの一部を commit 前 (修正者=LLM) へ前倒しした。第7弾の記事超え4点 (段0 発明 等) に積み増す第 5 の超え。
2. **段0 advisory という形 (第7弾からの補完)**: `hook_pre_probe_before_persist.sh` (07-09 追加・配線、第7弾実測時点で既存) は、知識永続化 Write/Edit の**直前**に probe 規律を additionalContext で注入し exit 0 で通す (実装逐語: 「PreToolUse の exit 2 は tool を block するため使わない。」/ allowlist 外・jq 不在等は全て fail-open)。意味論的な正確性検査そのものは強制できないから block しないが、**規律の注入タイミングだけは最速段 (行為の前) に置く** — 「検査を前倒しできないなら、検査の準備 (probe 喚起) を前倒しする」という原則1 の変奏。本セッション実測 (セッション実行時の観測、静的ファイルから再現不可): handoff 編集 2 回で実発火し、2 回とも編集後の外部裏取り (ls-remote / git status 再測) を誘発した。

### 残差 / 改善候補

- **[Low] 第7弾トポロジー表の欠落補正**: 第7弾の段0 行は「PreToolUse block 群」6 種を列挙したが、同時点で配線済みだった段0 **advisory** (`hook_pre_probe_before_persist.sh`、8722909 = 07-09 追加) を含めていない。ハーネスの gap ではなく**前回監査ログの網羅欠け**の補正 (本差分監査で発見・本ログが記録)。段0 には block 群と advisory 群の 2 種があると読み替えるのが正確。
- **[Low] 意味論前倒しの workflow-local 性**: step 6 ゲートが守るのは本 skill 経由の判定ログ commit だけで、一般の知識永続化 commit に意味論トレーサビリティ検証を課す機構は無い (汎用 pre-commit の意味論ゲートは LLM 検証を全 commit に課すことになりコスト・決定論性の両面で不成立 — probe-before-persist rule + HITL が補償する記録済み設計)。gap でなくトレードオフとして記録。
- 第7弾の残差 3 件 (反例① Low / 反例② 構造制約 / 段3 CI 不在) は全て現状維持で severity 変更なし — 窓内に昇格トリガー (再発実績) が無いことも V-1.1 の再発待ち規律と整合。

判定: 取り入れ済み継続 — hook 層 0 変更で第7弾判定は全点再確証され、差分窓の変更 (全て skill 層) はむしろ V-1.2 の適用範囲を意味論検査へ拡張する方向 (step 6 = commit 前の独立 agent 検証、第8弾で実効を実測済み) に働いた。残差は Low 2 件 (第7弾表の補正 / workflow-local 性のトレードオフ記録)。

## 関連ファイル

- `~/.claude/settings.json` — hooks 配線 (差分窓内 0 変更 / claudemd = line 580 compact のみ / probe hook 配線は 07-09 から)
- `~/.claude/hooks/hook_pre_probe_before_persist.sh` — 段0 advisory の実体 (exit 0 fail-open、block しない設計宣言の逐語)
- `~/.claude/skills/harness-adoption-audit/SKILL.md` — step 6 (l.50 fail-close / l.51 検証者 3 条件 / l.55 収束規定)。21f8e67 新設 → 10d30b5 harden → 28fc0c7 HTML step
- `~/.claude/.git/hooks/` — .sample 14 本のみ (段2 不在の再確証)
- `.docs/logs/shared/2026-07-21_v-1-2-feedback-speed-law-deepdive.md` — 第7弾 (本差分監査の基準点。段0 列挙 6 種・意味論最遅段の結論)
- `.docs/logs/shared/2026-07-22_v-1-3-narrow-options-before-inference-deepdive.md` — 第8弾 (step 6 が commit 前に誤りを捕捉した実測記録、l.44)
- `.docs/logs/shared/2026-07-21_pr-212-multilayer-independent-review-validation.md` — #212 捏造の人間段検出 (前倒し前の比較点)
