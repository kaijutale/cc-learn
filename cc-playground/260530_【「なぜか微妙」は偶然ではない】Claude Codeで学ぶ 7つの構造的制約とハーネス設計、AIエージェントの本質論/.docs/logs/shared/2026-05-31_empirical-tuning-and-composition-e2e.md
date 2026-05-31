---
date: 2026-05-31 16:27:46
type: validation
topic: empirical-tuning-and-composition-e2e
session: C-2/C-3 防御強化 (empirical 磨き + ①×③ 合成)
target: ①③ skill の empirical-prompt-tuning 評価 (白紙 subagent) + ①×③ 二重防御パイプラインの合成 E2E
verifier: メインClaude (Opus 4.8, 1M context) + 白紙 general-purpose subagent ×2
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_skill: [blinding-review-prompt, detecting-framing-bias, framing-advocate-merit-fork, framing-advocate-risk-fork, empirical-prompt-tuning]
related_agent: [framing-advocate-merit, framing-advocate-risk]
related_log_ids: [2026-05-31_blinding-review-prompt-impl-validation, 2026-05-31_detecting-framing-bias-impl-validation]
related_log: [2026-05-31_blinding-review-prompt-impl-validation.md, 2026-05-31_detecting-framing-bias-impl-validation.md]
---

# empirical 磨き + ①×③ 合成 E2E

> ①③ を白紙 subagent で empirical 評価 → 本物の指示曖昧さを検出・修正。さらに ① の中立化出力を ③ の subject に流す二重防御パイプライン (C-3 著者除去 → C-2 フレーム相殺) を合成 E2E。**「.md だから安全」というフレーミング (C-2) を ③ が相殺し、実在の危険 (live skill 削除疑い) を炙り出した** ── 二重防御の目的を実証。

---

## 検証目的

1. empirical-prompt-tuning に従い、①③ を**バイアスを排した白紙 subagent** に動かしてもらい、指示の曖昧さ・捏造誘発・独立性を実測する。
2. ① blinding の中立化出力を ③ の `.docs/framing/CURRENT/subject.md` に流し、「C-3 著者バイアス除去 → C-2 フレーム相殺」の二重防御パイプライン (plan B-9.5) が疎結合で成立するか E2E。

## 検証環境

| 項目 | 値 |
|---|---|
| 評価手法 | empirical-prompt-tuning (新規 subagent dispatch、自己再読 NG) |
| 実行者 | 白紙 general-purpose subagent ×2 (設計者意図を知らせず指示文のみで実行) |
| 統合 | メインClaude Opus 4.8 (1M) |
| ① シナリオ | 実 PR #44 を blinding で中立化 |
| ③ シナリオ | ドッグフーディングと別対象 (CI 型カバレッジ90%ゲート) を利点フレーム評価 |
| 合成シナリオ | ① 出力 (PR #44 中立化) → ③ subject → 両極評価 |

## 実測結果サマリ

| 指標 | 自実測 | 期待値 | 一致度 |
|---|---|---|---|
| ① 要件達成 (白紙 subagent) | 5/5 ○ | 全達成 | ✅ |
| ① が炙り出した本物の曖昧さ | 2点 (著者情報の境界 / PRモードK入力) | (検出が目的) | ✅ 有意 |
| ③ 要件達成 (白紙 subagent) | 4/4 ○ | 全達成 | ✅ |
| ③ 捏造・両論併記 | ゼロ (片側徹底・事実立脚) | ゼロ | ✅ |
| 合成 ①→③ 接続 | subject 注入成立 | 疎結合合成 | ✅ |
| 合成 二重防御 | ① 著者除去 + ③ フレーム相殺 | 機能 | ✅ |
| 合成 BALANCED VERDICT | 🔴 (フレーム感度=極大) | 相殺生成 | ✅ |
| Step 4.0 アンカー補正 | Lead 第一印象「推奨寄り」を割引 | 自己C-2除去 | ✅ |

## 各Stage 詳細結果

### Stage 1: ① blinding の empirical (白紙 subagent)

- **結果**: ✅ 5/5 達成、本物の曖昧さ2点を検出
- **観測**: 白紙 subagent が PR #44 を中立化。著者情報除去・K式・反迎合定型文・diff保持・Observability すべて ○ (tool_uses 11、再試行1)。だが指示文に**本物の曖昧さ**を発見:
  1. **メタ著者情報 vs コンテンツ著者名の境界** (最大の迷い): diff hunk 本文に `camone`/セッション名が**コンテンツとして**含まれる。§2 除去 (@author/Copyright) にも §3 保持 (hunk本体) にも跨り、境界が未明文化。実行者所感「『剥がすのは VCS/PR が構造的に付与するメタのみ』と1行あれば迷いが消える」。
  2. **PR モードの K 入力源未記載**: Step 4 は --stat/--numstat 前提だが収集 bang 構文は local 前提。PR では gh pr view の数値を使う旨が未記載。
- **対処**: blinding-rules §2 に「除去の境界」注記追加 + SKILL Step 4 に PRモード K 入力 (gh pr view additions/deletions/changedFiles) 追記。
- **学び**: 要件 5/5 達成でも、実行者は裁量補完で曖昧さを乗り越えていた。empirical はこの「隠れた迷い」を炙り出す。設計者には見えない盲点 (自分が書いた境界は自明に見える)。

### Stage 2: ③ framing-advocate の empirical (白紙 subagent)

- **結果**: ✅ 4/4 達成、軽微な曖昧さ1点
- **観測**: 白紙 subagent が CI 型カバレッジゲートを利点フレーム評価。リスク非言及 (片側徹底)・最低3件 (4件)・捏造ゼロ・反例すべて ○ (tool_uses 5、再試行0)。制約 (既存是正必要) を「欠点」でなく「負債可視化の駆動因」に反転 = 設計意図通り。不明瞭点: 「反例 (楽観の前提)」と「リスク」の境界が軽微に曖昧。
- **対処**: framing-advocate-merit/risk agent の反例セクションに「前提を示すだけで崩れた場合の損害評価には踏み込まない」と境界明確化。
- **学び**: ③ の片側徹底・反捏造は白紙実行者でも再現。指示が明確。subject.md とインライン指示の食い違いは empirical 設定由来 (本番 master→fork 経路では subject.md が唯一対象)。

### Stage 3: ①×③ 合成 E2E (二重防御パイプライン)

- **結果**: ✅ 接続成立 + 二重防御機能 + 危険検出
- **観測**: ① の中立化出力 (PR #44、著者除去済み) を ③ subject.md に配置 → ③ 起動で master に注入成立 → merit/risk fork 並列起動。
  - **merit 🟢**: 負債純減(-46行)・世代交代・学習トレース永続化 (4件)
  - **risk 🔴**: live skill 削除 (.claude/skills/ が空と実地調査)・ダングリング参照30+・レビューゼロ self-merge (4件)
  - **真逆の結論**。フレーム不変の核心 = 「削除」の本質。merit は description からの推測、risk は find 実地調査ベース。
  - **Lead 相殺** (Step 4.0 適用): わたしの第一印象「推奨寄り (.md だから安全)」を記録 → これが risk の暴いた「最大の罠」と一致 → 割引いて risk の事実を重視 → **BALANCED VERDICT 🔴**、フレーム感度=極大。
- **学び**: ① で著者を剥がし (誰の PR か不明) + ③ で「.md だから安全」フレーミングを相殺 → 二重防御が「フレームに誤魔化されず危険を検出」を実証。これは plan の C-2/C-3 防御の目的そのもの。

## 重要発見

1. **empirical が設計者の盲点を炙り出した**。① は要件 5/5 達成だったが、白紙 subagent は「メタ著者情報とコンテンツ著者名の境界」という、設計者 (わたし) には自明に見えて実は未定義だった穴で迷った。「動く」と「曖昧さがない」は別。バイアスを排した実行者でしか見えない。
2. **二重防御が C-2 を実地で相殺した**。合成 E2E で ③ が「ドキュメントのみ=安全」というフレーミング (C-2) を相殺し、risk フレームが「live skill 破壊」を暴いた。同じ PR がフレーム次第で 🟢↔🔴。元判断のフレーム感度=極大 = C-2 に極度に脆弱だったことを定量的に示せた。
3. **Step 4.0 (Lead アンカー補正) が実動した**。改善で追加した自己 C-2 除去手順が、わたし自身の「推奨寄り」第一印象を割り引かせた。ドッグフーディングで自己検出 → 改善 → 次の実行で効果確認、のループが回った。
4. **③ が PR #44 の実在の問題を指摘した (要事実確認)**。risk fork が「live skill 削除 + ダングリング参照」を実地調査で報告。ただし risk はフレーム振り切り役なので誇張の可能性あり、事実確認は別途。**risk の自己申告を鵜呑みにしない**のが反インフレと表裏。

## 改善候補 (次フェーズ持ち越し)

- **empirical 再評価 (収束確認)**: ①③ の修正後に新規 subagent で再評価し、不明瞭点ゼロが連続2回出るか (完全収束)。今回は iter 1 で本物の曖昧さ検出・修正までで「80点リソース打ち切り」。
- **risk が指摘した PR #44 実問題の事実確認**: `cc-changelog-ja/.claude/skills/` が本当に空か、削除された skill が live 正本だったかを git/ls で検証 (③ の機能確認とは別タスク)。
- **commit**: 検証ログ3本 + subject.md + skill 実体の取り込み判断 (かもね依頼待ち)。

## 結論

①③ の empirical 磨きで本物の指示曖昧さを検出・修正 (① 著者境界 + PRモードK、③ 反例境界)。①×③ 合成パイプラインが疎結合で成立し、二重防御 (C-3 著者除去 → C-2 フレーム相殺) が「フレーミングに誤魔化されず危険を検出する」ことを実 PR で実証。Step 4.0 アンカー補正も実動。C-2/C-3 防御 skill 2本が実装→実機検証→empirical 磨き→合成 E2E まで到達。残るは empirical の完全収束 (再評価) のみで、これはリソース打ち切りで次セッションに defer。

## 関連ファイル

- `~/.claude/skills/blinding-review-prompt/` — ① (empirical で著者境界 + PRモードK を追記)
- `~/.claude/skills/detecting-framing-bias/` — ③ master (Step 4.0 アンカー補正 + フェイルセーフ)
- `~/.claude/agents/framing-advocate-{merit,risk}.md` — ③ agent (empirical で反例境界を明確化)
- `.docs/framing/CURRENT/subject.md` — 合成 E2E 用 (① 出力 = PR #44 中立化を ③ 入力に)
- `.docs/logs/shared/2026-05-31_blinding-review-prompt-impl-validation.md` — ① 実装ログ
- `.docs/logs/shared/2026-05-31_detecting-framing-bias-impl-validation.md` — ③ 実装ログ

---

## 追記: empirical iter2 (収束確認) 2026-05-31

iter1 の修正後を **新しい白紙 subagent** で再評価 (過適合チェック兼: ①=PR#45 / ③=date-fns 統一判断、いずれも iter1 と別シナリオ = hold-out)。

| skill | iter1 の不明瞭点 | iter2 (再評価) の結果 |
|---|---|---|
| ① 著者境界 (critical) | 「最大の迷い」 | ○ **一意に確定** (§2 境界規定で迷い消失)、再試行 1→0 |
| ① PRモードK 入力 | 補完を要した | ○ gh pr view 規定どおり使用 |
| ③ 反例↔リスク境界 | 軽微に曖昧 | ○ **不明瞭点なし**、新規ゼロ |

- **③: 厳密収束** — iter2 で新規不明瞭点ゼロ + 過適合チェック (date-fns) で精度100%維持 + 再試行0/tool_uses2。
- **①: 本質収束 + 軽微残** — critical (著者境界) の解消を再評価で実証。新規2件 (署名スキャン grep パターン / 言語内訳 PR 取得経路) は non-critical・裁量補完可能 → blinding-rules Gotcha に将来候補として記録し「80点リソース打ち切り」。
- **完全収束の主目的 = 「修正が効いたかの第三者実証」は達成**。「修正した」を「本当に直った」に変える工程を、白紙 subagent の再評価で確認できた。plan B-9.6 / A-6.7 の empirical 検証を完了とみなす。

### 結論 (追記)

C-2/C-3 防御 skill 2本 (①③) が **作成 → 実機検証 → ドッグフーディング自己改善 → empirical 収束 → ①×③ 合成** の全工程を完了。plan (PLAN A+B) が閉じた。残るのは Git への取り込み判断 (検証ログ群 + subject) のみ。
