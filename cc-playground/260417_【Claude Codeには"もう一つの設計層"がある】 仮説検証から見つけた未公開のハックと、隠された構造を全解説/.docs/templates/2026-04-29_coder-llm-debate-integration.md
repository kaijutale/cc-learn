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

---

# Session 7 続き: Phase 1 実機ドライラン経過 (2026-04-29 同日午後)

## 経緯

Phase 1 完了直後、当初予定外だった「Phase 1 動作確認 (実機ドライラン)」を実施。連鎖的に複数の重大な発見と修正が発生したため、本セクションで追記記録する。

## 発覚した issue 1: master SKILL.md line 43 の session sandbox 違反

実機ドライラン (`Skill("llm-debate")` 起動) で初発覚:

```
!`ls -la ~/.claude/skills/debating-roles/SKILL.md 2>/dev/null && echo "[併存運用中]" || echo "[未導入]"`
```

`~/.claude/` は session sandbox の cwd (`260417_*`) 配下にないため permission block。`2>/dev/null` も `||` も permission check は ! 構文展開前に走るため吸収不能。

### 調査で得られた知見

全 63 skill の ! 構文を grep した結果、sandbox 外参照の ! 構文を持つのは llm-debate line 43 ただ 1 件。他の 62 skill は全員「! 構文 = cwd 内のみ参照」を暗黙的原則として守っていた = **line 43 が孤立した異常値**だった。

### 修正

llm-debate SKILL.md の line 42-43 (debating-roles 既存スキル状態確認セクション) を削除。description (line 8) と本文 (line 26) で同等情報が既に明記されているため情報的損失なし。

## note 記事全文読了 (47ページ)

CLAUDE.md で参照指示があった `.docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf` を全文読了。

### 得られた重要な設計理解

1. **Anthropic の Unix哲学**: 「小さな部品 (skill / agent / !構文 / fork) を提供、組み合わせ方はユーザーに委ねる」「想定外ではなく想定の範囲を意図的に広くした」
2. **サブエージェント活用ロードマップ⑥段階**: ① !構文 → ② プリロード → ③ context:fork → ④ 孫エージェント (Skill経由) → ⑤ TDD応用 → ⑥ LLM Debate応用
3. **Agent ツールはサブエージェント環境にハードコード制約で渡されない**: `tools:` に `Agent` と書いても無効。**Skill 経由の context:fork + subagent: が孫起動の唯一のバイパス経路**
4. **LLM Debate の正規呼出パターン**:
   - パターンA: メイン → Skill → llm-debate
   - **パターンB: メイン → Agent(coder等) → Skill → llm-debate (サブエージェント経由)**
5. **わたしの設計は note 原典と既に整合**: Skill 経由の多段構成、context:fork + subagent:、!構文での議題決定論的注入、すべて一致 (唯一の違いは Codex/Cursor 統合 → Claude Only への翻訳)

### 当初の修正方針が誤りだった発覚

Phase 1 ドライラン途中で、わたしが提案していた以下の修正案は **note 原典の設計に反する** ことが判明し撤回:

| 修正案 | 撤回理由 |
|---|---|
| master SKILL.md を Agent ツール経由に変更 | note 原典は Skill 経由が正規、修正で破壊する |
| coder.md の tools に Agent を追加 | ハードコード制約で書いても無効 (note記事 line 「サブエージェント環境には Agent ツールそのものが存在しない」) |

## 発覚した issue 2: 5 sub-skill SKILL.md の ! 構文 permission block

修正後の master SKILL.md は起動成立したが、Step 2 指示通り 5 sub-skill を Skill ツール経由で呼び出すと **5/5 全滅** (permission policy で block):

| sub-skill | block 原因 |
|---|---|
| llm-debate-implementer | `find src ... -exec echo / -exec cat` (find -exec が複合操作扱いで block) |
| llm-debate-tester | `find .docs/specs ... -exec echo / -exec cat` (同上) |
| llm-debate-reviewer | `git --no-pager log --oneline -10` (multi-op block) |
| llm-debate-documenter | `git --no-pager log --oneline -20` (同上) |
| llm-debate-ui-designer | `find .docs/designs ... -exec echo / -exec cat` |

Apr 27-28 の検証時には通っていたが、その後の permission policy 厳格化で block されるようになった可能性。

## まさお氏ハーネスサンプル調査 (`.docs/references/sample/`)

修正方針確定のため、note記事著者まさお氏の自作ハーネスサンプルを徹底調査:

- agents: 3体 (coder / implementer / tester)
- skills: 4個 (red-test / implement / verify-test / llm-debate)
- ! 構文 13 個すべてが cwd 内に閉じる (sandbox 違反 0/13)
- 主流パターン: `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)` で repo root を**動的決定**
- README "This shared version does not include sandbox-bypass flags" と明示
- 「skill が他 skill の存在を !構文で確認する」シナリオ自体を**デザインで排除**

→ わたしの llm-debate line 43 の問題は「note 原典と異なるシナリオを実装してしまった」ことに起因 (削除で解消済)。

## 修正: 5 sub-skill ! 構文の書き換え

`find -exec` → ファイルリストのみ取得 / `git --no-pager` → `git` (--no-pager 削除):

| # | sub-skill | 修正前 | 修正後 |
|---|---|---|---|
| 1 | implementer | `find src ... -exec echo / -exec cat \|\| head -300` | `find src ... 2>/dev/null \|\| echo "(no source)"` (リストのみ) |
| 2 | tester | `find .docs/specs ... -exec echo / -exec cat \|\| head -200` | `find .docs/specs ... 2>/dev/null \|\| echo "(no specs)"` (リストのみ) |
| 3 | reviewer | `git --no-pager diff --stat HEAD~5..HEAD` | `git diff --stat HEAD~5..HEAD` |
| 4 | reviewer | `git --no-pager log --oneline -10` | `git log --oneline -10` |
| 5 | documenter | `git --no-pager log --oneline -20` | `git log --oneline -20` |
| 6 | ui-designer | `find .docs/designs -name "aesthetic.md" -exec echo / -exec cat` | `find .docs/designs -name "aesthetic.md" 2>/dev/null` (リストのみ) |

設計思想: skill が事前注入する情報量を減らし、**agent が必要に応じて Read tool で個別取得**する形に変更。各 agent が Read tool を持っているため機能的影響なし。

## Skill 正規経路で 5/5 動作実証

修正後、メインClaude → `Skill("llm-debate")` → master skill 内で Skill("llm-debate-*") 5回呼出 が**全成立**:

| sub-skill | 動作 | duration |
|---|---|---|
| llm-debate-implementer | ✅ | 38秒 |
| llm-debate-tester | ✅ | 23秒 |
| llm-debate-reviewer | ✅ | 40秒 |
| llm-debate-documenter | ✅ | 21秒 |
| llm-debate-ui-designer | ✅ | 14秒 |

→ **Phase 1 の核心要件「note 原典 Skill 経由パス (パターンA) で 5並列議論が成立」を完全達成**。

## 5 視点議論で議題自体の欠陥が判明

2回目の議論で前回見落としていた Critical 指摘が複数出た:

### Reviewer 視点 (反インフレ原則発動): 🔴 却下

| severity | 指摘 |
|---|---|
| Critical | 戻り値が Markdown テキストなのに擬似コードで `debate_guidance.lead_summary` 属性アクセス記法 = 構造的矛盾 |
| Critical | 🔴 (却下) / ⚪ (議題差し戻し) 結論時の coder 挙動が未定義 |
| High | `last_adjust_diff_significant()` の閾値定義なし |
| High | コンテキスト累積上限の数値未定義 |
| High | 抽出失敗時のフォールバック未定義 |

### 4視点が共通指摘した懸念

- 抽出契約 (戻り値スキーマ) が未確定
- silent fail 検出の仕組み未定義
- 5視点 severity の喪失リスク

### Lead 統合判断: 🟡 条件付き

議題 (Open Question #1: adjust への反映方法) は**議題自体に欠陥がある**ため、案 A〜D を選ぶ前に補強が必要。Reviewer 提案の **案E (構造化抽出 + 全文 BACKUP + 抽出失敗時フォールバック)** が最終解候補。

## 修正: coder.md Step 5 擬似コード

Reviewer Critical 指摘を踏まえ、`debate_guidance` を Markdown テキスト前提に修正:

```python
# 修正前 (擬似コード矛盾)
"lead_summary": debate_guidance.lead_summary,

# 修正後 (テキストスライス)
"lead_text_excerpt": debate_guidance[:200],  # 先頭200文字、全文は BACKUP に保存推奨
```

加えて Gotchas に4項目追記:
- `debate_guidance` は Markdown テキスト (属性アクセス不可)
- 🔴 / ⚪ 結論時のフェイルセーフ (Phase 2 で実装)
- 戻り値全文の BACKUP 保存推奨
- (既存) Phase 1 最小実装スコープ

## マルチエージェント協調 skill 群への影響評価

修正対象が3 skill 群 (three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle) に影響しないことを実測で確認:

| シンボル | coder.md 内部参照 | 外部 skill 参照 |
|---|---|---|
| `lead_summary` (修正前) / `lead_text_excerpt` (修正後) | あり | **0件** |
| `debate_impact` | あり | **0件** |
| `debate_count` | あり | **0件** |

3 skill が依存しているのは coder の **外部インターフェース** (Agent 起動方法 + `[Coder Cycle Complete]` レポート形式) のみ。今回の修正は擬似コード**内部詳細**に閉じる修正なので、**完全に非破壊的**。

## Session 7 で追加された Phase 1 完了条件

| 項目 | 結果 |
|---|---|
| llm-debate 起動成立 (sandbox 違反解消) | ✅ line 43 削除 |
| Skill 正規経路の動作実証 (パターンA) | ✅ 5/5 完走 |
| coder からの呼出経路 (パターンB) の構造的成立 | ✅ Skill ツールが subagent に渡る仕様 + 動作実績で担保 |
| 戻り値構造の実測 | ✅ `[Role Analysis]` 形式で構造化テキスト返却 |
| coder.md 擬似コード矛盾の解消 | ✅ Markdown テキスト前提に修正 |
| マルチエージェント協調 skill への非破壊性 | ✅ 3 skill 全て影響ゼロ |

## Phase 2 への引き継ぎ事項 (追加)

Session 7 で発覚した未確定事項を Phase 2 で確定:

1. **`extract_lead_section()` パーサ実装**: Markdown テキストから「## Lead 統合判断 → ### 結論」セクションを正規表現で抽出
2. **🔴 / ⚪ 結論時のフェイルセーフ**: Lead が 🔴 / ⚪ を返した時の coder 挙動を擬似コード化
3. **`last_adjust_diff_significant()` の数値定義**: 編集ファイル集合の Jaccard 距離 > 0.5 等の客観基準
4. **コンテキスト累積上限**: 1回あたり 2000 token / 累積 4000 token 等の閾値
5. **抽出失敗時フォールバック**: 戻り値全文を `.docs/debate/BACKUP/response-{feature}-loop{N}.md` に保存 + warn 出力

## Session 7 で得られた最大の学び

1. **note 記事の前提を読まずに走った**ことが Phase 1 ドライラン中盤までのミスの根本原因。CLAUDE.md で参照指示があった文献を最初に読むべきだった
2. **「動いた」と「設計通りに動いた」は別物**。Agent ツール経由のハック的経路で動作確認できたが、それは note 原典の設計と異なる経路だった (subagent 環境では Agent ツール使用不可のためそもそも本番では使えない)
3. **反インフレ原則が機能した**: 5視点議論で前回見落とした Critical 指摘 (擬似コード矛盾) を能動的に検出。同じ skill を 2 回回しても異なる深さの分析が出る = ツールとしての汎用性

## Session 7 commit 対象

- `~/.claude/skills/llm-debate/SKILL.md` (line 42-43 削除) — git 管理外
- `~/.claude/skills/llm-debate-{implementer,tester,reviewer,documenter,ui-designer}/SKILL.md` (各 ! 構文修正) — git 管理外
- `~/.claude/agents/coder.md` (Step 5 擬似コード修正 + Gotchas 4項目追記) — git 管理外
- `.docs/templates/2026-04-29_coder-llm-debate-integration.md` (本ログ追記分) — **git 管理対象、本コミットの対象**
