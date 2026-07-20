---
date: 2026-07-20 16:56:46
type: study
topic: v-1-1-failure-promotion-ladder-deepdive
session: V-1.1「失敗を仕組みに昇格させる」単独深掘り (取り入れフェーズ第5弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-1.1 = 1775〜1824行、関連: K系 1325〜1330 昇格サイクル)
related_skill: [logging, accumulating-reviewer-feedback]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md]
---

# V-1.1「失敗を仕組みに昇格させる」単独深掘り — 判定: 取り入れ済み・4層ラダー全段実装 + 昇格の駆動機構まで機械化

> V章バッチ (a84436e) で1行照合済みの V-1.1 を単独深掘り。**Level 0〜3 の昇格ラダーは全段実装済み**、さらに「昇格を駆動する機構」(再発の決定論計数 + HITL提案 + 昇格の実歴史) まで持つ。かいじゅうの問い「Gotcha も昇格の1つか」への答え = **Yes、ただし Level 1 (注意喚起の段) — 昇格の到達点でなく出発点かつ蓄積の場**。note 自身が L1 を「Gotchas セクションに追記 (自然言語の注意喚起)」と定義 (text.md 1329)。

## 概要

取り入れフェーズ第5弾 (V章内の V-1.1 を単独で). かいじゅうの先行質問「skills の Gotcha セクションも『失敗を仕組みに昇格させる』の1つか」を核に、note の Level 0〜3 ラダーを実物と1段ずつ厳密対応させ、昇格を駆動する機構を実読した。

## 内容

### 先行質問への回答: Gotcha は Level 1 (注意喚起の段)

note の昇格ラダー (text.md 1329-1330) は L1 をこう定義: 「Gotchas セクションに追記 (自然言語の注意喚起) → 再発する (注意喚起では防げなかった) → 次の段へ」。**つまり Gotcha は note 自身が明示する Level 1 そのもの**。ただし重要な二面性:

- **到達点ではない**: Gotcha は自然言語ゆえ確率的に無視されうる (L1 の限界)。「仕組みに昇格させる」の**出発点**であって完成形ではない
- **蓄積の場である**: `accumulating-reviewer-feedback` skill が review findings を Gotcha へ反映し、再発を計数し、閾値超えで上位段への昇格を提案する — **Gotcha はラダーを登る待機列 (staging ground)**

### Level 0〜3 の厳密対応 (実測)

| note Level | 性質 | かいじゅうのハーネスでの実体 | 強制力 |
|---|---|---|---|
| **L0 口頭指示** | セッション跨がない・確率的に忘却 | メイン会話での指摘 (本セッションの Q&A 群がこれ) | 最弱 |
| **L1 注意喚起** | 自然言語・毎回注入されるが無視されうる | **rules 11本 + SKILL の Gotcha 62本** (must/should/avoid 3ラベル + bullet-bold 構造を機械強制) | ★★ |
| **L2 スクリプト検証** | exit code で合否確定・実行は任意 | `verify-adr.sh` (手動 backstop) / `validate-knowledge.py` / `check-essence-sync.sh` / `check-gotcha-recurrence.sh` | ★★★ |
| **L3 Hook/CI ゲート** | 通過必須・LLM 回避不能 | **hook 31本 (PreToolUse block 15本含む) + deny 177本** | 最強 |

### 昇格を「駆動する」機構 — ここが記事超えの核心

note のラダーは「2回起きたら1段上げる」を**人間の記憶**に委ねる。ハーネスは昇格の駆動を機械化している:

1. **再発の決定論計数 (L1 内の昇格トリガー)**: `check-gotcha-recurrence.sh` が Gotcha bullet の `(再発: YYYY-MM-DD)` マークを計数。**閾値 default=1** (初回失敗 + 再発1回 = **通算2回目** = note の「2回起きたら」と厳密一致)。exit 0=候補なし / 1=候補あり / 2=エラー。「同じ失敗か」の意味照合は LLM、マークの計数・閾値判定はスクリプト、という原則5 (決定論的制御) の分業を明文化
2. **双方向の再発センサー (issue #66)**: Sensor A = hook-fire-ledger が **L3 の hook 発火**を計数 (今月 recurrence 535行、「既に昇格済みだが上流の自然言語が綻んでいる」検出) / Sensor B = `check-gotcha-recurrence.sh` が **L1 の Gotcha 再発**を計数 (「まだ昇格していないが2回目」検出)。**ラダーの上段と下段を別センサーで監視**
3. **昇格提案は HITL・自動昇格なし (段階2.5)**: `accumulating-reviewer-feedback` が閾値超え Gotcha を「昇格候補」として AskUserQuestion 提案。severity 別ルーティング (Critical=即時 / High=48h / Medium=N=3蓄積 / Low=記録のみ)。**改修禁止 skill** (three-elements-harness / orchestrating-team-development / essence reviewer 系) は Categorize 段階で Apply 対象外
4. **昇格の実歴史 (記録済み)**: ADR 検証は L2 (手動 verify-adr.sh) → L3 (`hook_pre_commit_adr_gate` commit gate, #146) へ実際に昇格。その判断自体が ADR-0002 に永続化 — ラダーが図でなく運用として回った証跡

### 記事超え 4点 (V-1.1 固有)

1. **「2回」の機械計数**: note の昇格トリガー (2回起きたら) が人間の記憶依存なのに対し、`check-gotcha-recurrence.sh` の threshold=1 が通算2回目を決定論判定 — note の基準値と厳密一致
2. **L1 の段自体が構造化・検証可能**: Gotcha は自由記述でなく must/should/avoid + bullet-bold を機械強制 (`gotcha-format-guideline.md`)。「腐敗しやすい自由記述」を L1 の段で既に排除
3. **上段・下段の二重監視**: 「昇格すべきか (L1 再発)」と「昇格したが上流が綻んでいるか (L3 多発火)」を別センサーで観測
4. **反Goodhart + 改修禁止ガード**: 発火数を昇格シグナルと混同しない明文 + 特定 skill の自動改修禁止 — ラダー運用が指標ハック・暴走反映に堕ちない

### 残差

- note の具体例「テストファイル書き換えを L3 で block」に厳密一致する hook は無い (`Edit(*.test.ts)` deny は未配線)。ただし worktree write guard 群・essence gate 等のテーマ別 L3 は稼働。テスト整合性違反の再発実績が無いため、昇格ラダー原則に従い L3 化は未実施 (これ自体が原則の正しい適用)
- **判定: 取り入れ済み**。V-1.1 はハーネスの「自己成長」機構の中核で、note のラダー図より一段動的 (駆動機構まで実装)

## 関連ファイル

- `.docs/references/260405_…/text.md` (1775〜1824行 V-1.1 本体、1325〜1330 昇格サイクル定義) — 照合基準
- `~/.claude/skills/accumulating-reviewer-feedback/SKILL.md` — 昇格提案の5段階フロー + 段階2.5 再発照合 (実読)
- `~/.claude/skills/accumulating-reviewer-feedback/scripts/check-gotcha-recurrence.sh` — 再発の決定論計数 (threshold=1 = 通算2回、実読)
- `~/.claude/.docs/decisions/0002-adr-gate-deterministic-trigger.md` — L2→L3 昇格の実歴史 (記録済み判断)
- `.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md` — V章バッチ (本深掘りの親)
