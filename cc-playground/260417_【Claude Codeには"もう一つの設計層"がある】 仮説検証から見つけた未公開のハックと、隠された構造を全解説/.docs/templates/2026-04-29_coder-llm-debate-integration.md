---
title: coder agent への llm-debate skill 組込 (Phase 1 最小実装)
date: 2026-04-29
session: Session 7 (Phase 1 implementation)
related_plan: ~/.claude/plans/plan-twinkly-raccoon.md
related_note: 260417 note記事「Claude Codeには"もう一つの設計層"がある」ロードマップ⑥「LLM Debate 応用」
related_files:
  - ~/.claude/agents/coder.md (主修正、+94行)
  - ~/.claude/skills/llm-debate/SKILL.md (呼出仕様、修正なし)
  - ~/.claude/skills/llm-debate-{ui-designer,implementer,tester,reviewer,documenter}/SKILL.md (修正なし)
  - ~/.claude/agents/llm-debater-*.md (修正なし、5体)
status: phase-1-implemented
phase_2_status: pending
---

# 概要

coder agent (TDD Tactical Orchestrator) に llm-debate skill を **Loop 2/3 突入時の条件付き** で組み込んだ。

note 記事 (まさお氏) の引用:
> 「コーダーやレビュアーなどの専門サブエージェントにLLM Debateスキルをプリロードしておくパターンも考えられます。実装中に判断に迷うポイントが出てきた際、サブエージェント自身がLLM Debateを呼び出して多角的な検討を行い、その結論をもとに作業を続行する。」

を、最小実装で実証する Phase 1。

## 背景: なぜ Phase 1 を実装したか

組込前の状態確認 (Session 7 冒頭):

- ✅ llm-debate skill (master + sub 5) は実装済み・全14検証完走 (Apr 27, Session 6)
- ✅ llm-debater-* 5体 (議論される側 agent) は実装済み
- ❌ **呼ぶ側 (coder agent) に組み込まれていない** → 「再利用可能なモジュール」が潜在状態のまま (片想い状態)

llm-debate skill の description に「メインClaude / **coder agent からの明示呼出専用**」と明記されているが、coder.md 本体には呼出導線が一切なく、片想い状態だった。今回の組込で導線を確立した。

# 修正対象

**`/Users/camone/.claude/agents/coder.md` (1ファイルのみ)**

llm-debate skill 側は !構文 (`!cat .docs/debate/CURRENT/topic.md`) の決定論的注入のおかげで coder 側からは prompt 不要で呼出可能 → skill 側修正は **完全不要** → 影響範囲を coder.md 1ファイルに局所化できた。

## 修正5箇所

### 1. Step 4 説明 (line 115-)

Loop 別の判断分岐を明文化:
- `loop_count == 0` (Loop 1/3 失敗): 局所ミス想定 → 議論なしで coder 自身が adjust
- `loop_count == 1` (Loop 2/3 突入): 方針疑義想定 → llm-debate 呼出 + topic.md 動的生成 + BACKUP 退避
- `loop_count == 2` (Loop 3/3 突入): 同様に再呼出 (前回と異なる failure log + 調整履歴で議題再構築)

### 2. Step 5 ループ制御コード (line 131-)

```python
for loop_count in range(ADJUST_LOOP_MAX):
    ...
    if loop_count >= 1:
        # 1. 旧 topic.md を BACKUP に退避
        Bash("mkdir -p .docs/debate/BACKUP && mv ... 2>/dev/null || true")
        # 2. 議題を動的生成
        Write(".docs/debate/CURRENT/topic.md", build_debate_topic(...))
        # 3. llm-debate 呼出 (prompt 不要)
        debate_guidance = Skill("llm-debate")
        debate_count += 1
    self.adjust_source_code(..., debate_guidance=debate_guidance)
    if debate_guidance:
        debate_impact.append({...})
```

`debate_count` と `debate_impact[]` は Phase 2 計測用の追跡変数。

### 3. Step 5 補助セクション (新規、line 202-)

`build_debate_topic()` の議題テンプレートを Markdown 仕様書として明文化。プレースホルダ:
- `{feature}`: feature 名
- `{loop_iteration}`: 現在のループ番号 (2 or 3)
- `{failure_summary}`: verify-test-fork 戻り値要約
- `{adjust_history_summary}`: self.recent_edits 要約

「**生成責務の境界**」を明記: build_debate_topic() は議題の枠を整えるだけで、結論を誘導する文言を入れない (5視点の独立性を担保するため)。

### 4. Step 6 戻り値フォーマット (line 231-)

成功/失敗両方のレポートに以下フィールド追加:
- `Debate count: <N> / 2`
- `Debate impact:` (Loop 2 / Loop 3 ごとの Lead 統合判断要約 + adjust_changed フラグ)

失敗時の Suggested action に `llm-debate 履歴確認 (.docs/debate/BACKUP/topic-<feature>-loop*.md)` を追加。

### 5. やらないこと + Gotchas

「やらないこと」3項目追加 (item 10-12):
- Loop 1/3 失敗時の llm-debate 呼出禁止
- llm-debate 戻り値の盲従禁止
- 親 agent 側での議題ファイル生成禁止

「Gotchas」5項目追加:
- 議題ファイルライフサイクル (cwd 依存 / BACKUP 自動削除禁止)
- Skill("llm-debate") 呼出時 prompt 不要
- debate_guidance 反映ポリシー (盲従禁止、coder の最終判断責務)
- maxTurns 抵触リスク (1サイクル最大 10 Opus 起動)
- Phase 1 最小実装スコープ + 撤退条件明記

# 設計判断 (Plan からの転記)

## なぜ Loop 2/3 突入時のみか

- Loop 1 失敗 = typo / 境界値 / import漏れ等の局所ミスが大半 → 議論コスト (Opus 5並列) を払う価値が薄い
- Loop 2 以降の失敗 = 実装方針の誤りが疑われる → 5視点議論の費用対効果が成立する

「迷い自己申告」型 trigger は不採用 (LLM の検出精度未検証、過剰検出/過小検出リスク)。

## なぜ topic.md BACKUP 退避

Phase 2 撤退判定 (偽陽性率測定) のための **議題本文と adjust 結果の対応関係** が必要。CURRENT 上書きだけだと過去議題が消えて事後検証不能。BACKUP 自動削除は Gotchas で禁止。

## なぜ llm-debate skill 側を修正しなかったか

llm-debate skill の !構文 (`!cat .docs/debate/CURRENT/topic.md`) は決定論的注入で、coder 側から prompt 不要。skill 側修正は完全に不要 → 影響範囲を coder.md 1ファイルに局所化できた。

これは Phase 6 (llm-debate skill 構築、Apr 27) の設計が **再利用可能性を意識していた成果** と言える。

## なぜ Claude Only (外部AI不使用)

CLAUDE.md `## Harness` 原則: 判断品質の一貫性・再現性担保、契約/課金/プライバシー境界の単純化。note記事原典のマルチベンダー (Codex/Cursor/Claude) 構造は採用せず、役割分離 (llm-debater-* 5体それぞれが固有判断辞書をプリロード) で視点独立性を再現。

# Phase 2 への引き継ぎ事項

## 計測対象指標 (4軸)

| 指標 | 計測方法 |
|---|---|
| GREEN到達率 | 3-5 features × baseline (debate なし) / debate ありの2回ずつ |
| 方針変更率 | debate_impact[].adjust_changed_direction の比率 |
| コスト | Opus 起動数 / 1サイクル平均 |
| 偽陽性率 | debate 呼出で adjust 方針変わらず比率 |

## 撤退条件 (多軸総合判定)

3条件のうち **2つ以上該当** で Phase 3 展開せず撤退:

- ❌ GREEN 到達率改善 < 10pp
- ❌ 偽陽性率 > 50%
- ❌ コスト倍率 > 2x

撤退時は coder.md の Phase 1 修正を `git revert` で巻き戻す。

## 評価ログ保存先 (Phase 2 で作成)

`.docs/templates/2026-04-29_coder-llm-debate-eval.md` (本ログとは別ファイル)

## Phase 3 展開先候補 (検証後判定)

優先順:
1. reviewer 系 (`code-reviewer.md` / `team-reviewer.md`) — severity 判定の分岐
2. PM agent (`llm-debater-pm.md` + `llm-debate-pm` sub-skill 新設後) — 仕様解釈の分岐
3. frontend-developer 系 — `team-ui-designer` と責務競合リスクで慎重展開

# Open Questions (実機検証で確定)

1. **adjust_source_code() への debate_guidance 反映方法**
   - 現状の擬似コードでは「追加コンテキストとして注入」とだけ記述
   - 実機検証で「Lead 統合判断の結論セクションだけ抽出」「全文を adjust 前のシステム指示として渡す」のどちらが効果的か実測

2. **maxTurns 抵触リスク**
   - 1サイクル最大 2回 debate × 各 5 並列 Opus = 10 起動
   - 既存検証ログ (Apr 28) では 5並列起動が 5-10秒/回で実測済 → 2回でも 30秒以内に収まる想定
   - Phase 2 ドライランで初回確認推奨

3. **debate 呼出による「議論盲点」の発生**
   - 5視点全員が同じ盲点を持つケース (例: spec の解釈が共通して誤っている)
   - 撤退条件の偽陽性率が高い時、視点不足が原因か trigger 条件が悪いかの切り分けが必要

# 検証結果 (Phase 1 完了判定)

| 項目 | 期待 | 実測 |
|---|---|---|
| coder.md 行数 | 500行以内 | 298行 ✅ |
| Step セクション数 | 7 (1-6 + 5補助) | 7 ✅ |
| frontmatter 健全性 | 破損なし | OK ✅ |
| llm-debate 言及箇所 | 0 → 16+ | 16 ✅ |
| 修正ファイル数 | 1 (coder.md のみ) | 1 ✅ |

実機ドライランは Phase 2 評価実行時に同時実施 (本実装ログのスコープ外)。

# 関連メモリ (CLAUDE.md auto memory)

- `feedback_skill-fork-asymmetry.md` — fork skill の cwd 継承対策 → topic.md 配置時の cwd 確認に反映
- `feedback_disable-model-invocation-blocks-skill-tool.md` — llm-debate skill に `disable-model-invocation:true` 不付与 (既に適用済) → Skill ツール明示呼出が確実に動く
- `feedback_multi-agent-debate-design.md` — 視点多様性は役割分離、全員 Opus 固定 → llm-debate 設計と一致
- `feedback_logging-implementation-scope.md` — logging-implementation は学習・知識整理も対象 → 本ログもこの方針で記述

# 関連検証ログ (.docs/templates/)

- `2026-04-27_llm-debate-skill-build.md` — llm-debate skill 初版構築ログ
- `2026-04-27_llm-debate-skill-verify-full.md` — sub-skill 5体動作検証
- `2026-04-28_llm-debate-session-summary.md` — 5並列起動の実測時間 (5-10秒)

# 結論 (Phase 1 終了時点)

note 記事の理想「専門サブエージェントが LLM Debate を呼び出して自律的に意思決定」を、最小実装 (Loop 2/3 条件付き発火 + topic.md 動的生成 + BACKUP 履歴保全) で実装した。

ただし、note 記事の前提は「**Codex/Cursor/Claude の異ベンダー議論で観点独立性を物理的に担保**」であり、わたしのハーネスは Claude Only 原則で **役割分離による視点独立性に置き換えている**。同モデル5体での議論精度がベンダー横断議論と同等かは Phase 2 で実測検証する。

撤退条件を多軸 (GREEN改善 / 偽陽性率 / コスト倍率) で固めることで、「実装したから使い続ける」サンクコスト的継続を構造的に防いでいる。Phase 2 で 3 条件中 2 つ該当したら Phase 3 に行かず撤退する。
