---
type: implementation-log
title: essence-reviewing-harness 第3次改修 (ハブ-スポーク化 + 永続化指示 + scripts追加 + Gotcha追記)
date: 2026-05-10
session_id: 2026-05-10_essence-reviewing-harness-A-D-execution
related_plans:
  - ~/.claude/.docs/plans/archived/2026-05-09-essence-reviewing-harness-redesign.md
related_logs:
  - .docs/logs/shared/2026-05-09_essence-reviewing-harness-redesign-implementation.md
  - ~/.claude/.docs/logs/local/2026-05-09_essence-reviewing-harness-redesign-implementation.md
status: completed
note_article_alignment:
  - page_11_feedback_loop
  - page_20_deterministic_control_methods
  - page_21_step_completion_persistence
  - page_22_avoid_overconstraint
---

# essence-reviewing-harness 第3次改修ログ

## 概要

2026-05-09 の自己レビュー (Lead 統合判断: 🟡 条件付き適合、Critical 1 + High 3 + Medium 2) で検出された全指摘に対する改修を A〜D の 4 候補としてまとめ、適切な順序で順次実施した。

実施範囲:
- **A** SKILL.md ハブ-スポーク化 (Critical 1 解消)
- **B-1** レビュー結果永続化指示の組込 (High 1 解消)
- **B-2** scripts/parse-target-path.sh 追加 (High 1 解消、note 記事 step5「1つ置き換え」原則準拠で 1 本のみに reframe)
- **C** $ARGUMENTS literal 置換 Gotcha 追記 (Medium 1 解消、軽量版)
- **D** 整地 + 実装ログ + handoff (本ファイル)

## 実施内容

### A: SKILL.md ハブ-スポーク化 (Critical 解消)

**改修前**: master skill `essence-reviewing-harness/SKILL.md` 197 行モノリス、`references/` `scripts/` 完全欠落

**改修後**: master skill 72 行ハブ + references/ 4 ファイル分離

| ファイル | 行数 | 役割 |
|---|---|---|
| `SKILL.md` (ハブ) | 72 | frontmatter + 概要 + 設計の核心要約 + !構文注入 + ナビゲーション |
| `references/orchestration-protocol.md` | 69 | Step 1-6 詳細手順 (Lead 責務) |
| `references/output-format.md` | 95 | 出力 template + 永続化仕様 + severity 凡例 |
| `references/gotchas.md` | 47 | 11 件の落とし穴 (棲み分け / parameter expansion / literal 置換 / grayzone 等) |
| `references/connection-patterns.md` | 54 | パターン A/B/C + 強制力レベル比較 |
| 合計 | 337 | (元 197 行から増加だが責務分離による良い増加) |

**Skill 領域 原則4「Progressive Disclosure」適合**: ハブ ~30 行理想からは大きいが、orchestrator 系 skill としては妥当範囲 (72 行)。ハブで WHAT + ナビゲーション、references/ で HOW (詳細手順 / 出力 template / Gotchas / パターン) という分離が成立。

### B-1: レビュー結果永続化指示の組込 (High 解消)

**改修内容**: master skill に **Step 6 (永続化)** を追加。Lead 統合判断完了後、`Write tool` で結果を以下に書出:

```
~/.claude/.docs/essence-review-runs/<YYYY-MM-DD_HHMMSS>_<target-slug>.md
```

組込先:
- `references/orchestration-protocol.md` の Step 6 セクション (詳細仕様)
- `references/output-format.md` の「永続化」セクション
- `SKILL.md` (ハブ) の「指示」セクションに Step 6 言及

**Harness 領域 原則3「記憶の外部化」適合**: 次回 essence-reviewing-harness 起動時、Lead が前回判定を `Read` 可能になり、単調収束 (毎回同じ Critical を出して永遠に未解決) を断絶できる。

**未検証**: 実際に Lead (= Claude) が Step 6 を実行するかは次セッションでの実機検証が必要。指示記述完了レベル。

### B-2: scripts/parse-target-path.sh 追加 (High 解消、note 記事準拠で 1 本のみ)

**reframe 経緯**: 当初 3 スクリプト (parse / aggregate / detect) を提案したが、note 記事 page 22「制約しすぎない — 計画時は緩く、実行時にフィードバックで締める」原則を踏まえて 1 本に絞った。

| 候補 | 採否 | 理由 |
|---|---|---|
| `parse-target-path.sh` | ✅ **採用** | 「1→1」原則完全適合、入力 (`$ARGUMENTS`) → 出力 (種別 + 解決済絶対パス) が完全に決定論的 |
| `aggregate-severity.py` | ✗ 見送り | 入力が LLM 出力 (確率的)、Lead 質的判断の機械化リスク |
| `detect-domain-conflict.py` | ✗ 見送り | 矛盾の「定義」が定性的、過剰決定論化リスク |

**実装**: Bash スクリプト (~80 行)、6 ケース判定:
1. 引数空 → `type=empty`
2. 絶対パス + ファイル → `type=file`
3. 絶対パス + ディレクトリ (`*/.claude/skills/*` パターン) → `type=skill_dir`
4. 相対パス → `realpath` で絶対パス変換
5. skill 名のみ → `~/.claude/skills/<name>/` に解決試行 → `type=skill_name`
6. どれでもない → `type=unknown`

**動作テスト** (5 パターン全 pass):
| Test | 入力 | 期待 type | 結果 |
|---|---|---|---|
| 1 | (空) | empty | ✅ empty |
| 2 | `/Users/camone/.claude/skills/essence-reviewing-harness/` | skill_dir | ✅ skill_dir |
| 3 | `essence-reviewing-harness` | skill_name | ✅ skill_name |
| 4 | `/Users/camone/.claude/skills/essence-reviewing-harness/SKILL.md` | file | ✅ file |
| 5 | `/nonexistent/path` | unknown | ✅ unknown |

**Skill 領域 原則7「決定論的処理は scripts に逃がす」適合**: 「1→1」原則完全適合の処理のみ scripts 化、Lead の質的判断 (severity 集計 / 矛盾検出) は LLM に残すバランス。

**未統合**: master SKILL.md からの !構文呼出統合は次セッション持越し (現状の `!echo "$ARGUMENTS"` でも Lead 解析可能)。

### C: $ARGUMENTS literal 置換 Gotcha 追記 (Medium 解消、軽量版)

**改修内容**: 本格 escape 工事ではなく、`references/gotchas.md` と SKILL.md ハブに以下の Gotcha 追記:

> **`$ARGUMENTS` literal 置換の副作用** (2026-05-09 実機検証で発覚): Skill ツールの `$ARGUMENTS` 置換は SKILL.md **全文** に作用する naive substitution。説明文中の `$ARGUMENTS` 文字列も引数値で塗り替えられるため、文脈的に不自然な日本語になる箇所が発生する。回避策候補: 説明文では `<args>` 等の別表記を使う、または Markdown コードブロック (`` `$ARGUMENTS` ``) で囲む (要実機検証)

SKILL.md ハブ内の説明文では一部 `<args>` 別表記を試行採用 (実機検証は次セッション)。

## 検証結果

### 構造検証 (実施済、全グリーン)

- 行数: SKILL.md 72 / orchestration-protocol 69 / output-format 95 / gotchas 47 / connection-patterns 54 = 合計 337 行
- parameter expansion 残存: **なし** (`grep -rn '\${ARGUMENTS' essence-reviewing-harness/` → 0 件)
- references/ ディレクトリ存在: ✅
- scripts/ ディレクトリ存在 + 実行権付与: ✅ (`-rwxr-xr-x`)
- parse-target-path.sh 5 パターン動作テスト: ✅ 全 pass

### 動作検証 (未実施、次セッション持越し)

- 改修後の essence-reviewing-harness 実機起動 (master + 3 fork 並列、Lead 統合判断 + Step 6 永続化)
- ノイズトークン汚染チェック (前セッション同等手法、subagent 独立性確認)
- Step 6 永続化が実際に Lead により実行されるか確認
- `$ARGUMENTS` literal 置換問題が `<args>` 表記で回避されているか確認

## 改修禁止系 mtime 確認 (全 2026-05-10 以前)

- `~/.claude/skills/three-elements-harness/SKILL.md` (Apr 23)
- `~/.claude/skills/orchestrating-team-development/SKILL.md` (May 5)
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` (May 5)
- `~/.claude/skills/review-agent-essence/SKILL.md` (Apr 5)
- `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` (May 7)

→ 全て本セッションで無変更維持 (`feedback_no-existing-harness-modification.md` 遵守)

## 主要な技術的発見 (本セッション固有の知見)

### 1. Bash parameter expansion の grayzone 境界
- `${VAR:-default}` (デフォルト値展開) → Claude Code Bash permission の `Contains expansion` で deny
- `$VAR` 単体参照 → OK
- 前例 `deriving-test-from-spec/SKILL.md` L25 の 2026-04-21 改修コメントに同問題が documented されていた

### 2. subagent 独立性の物理的保証 (2026-05-09 実機検証で実証)
- 親 context にノイズトークン (CONTAMINATION_PROBE_*) 7 種注入 → 3 fork 戻り値全てで非出現
- `context: fork` は親コンテキスト参照を物理的に切断している (LLM の自己抑制ではなく構造保証)

### 3. `$ARGUMENTS` literal 置換の副作用 (2026-05-09 実機検証で新発見)
- Skill ツールの `$ARGUMENTS` 置換は SKILL.md **全文** に作用する naive substitution
- 説明文中の `$ARGUMENTS` 文字列も引数値で塗り替えられる
- 回避策候補: `<args>` 別表記、コードブロック escape (両方とも要実機検証)

### 4. 構造的検証 ≠ 動作検証
- 前セッション (2026-05-09) で「全グリーン」だった構造検証が、実機では `Contains expansion` で起動失敗
- 動かしてみないと絶対見つからない種類のバグ
- 動作検証は構造検証の上位互換 (構造検証は前提条件)

### 5. note 記事 step5 「制約しすぎない」原則の reviewer インフレ抑制効果
- 自己レビューで Critical 1 + High 3 + Medium 2 を出した結果に対して「全部対応」を機械的に推奨するのは reviewer インフレ
- 「Critical だから即対応」は machine-reading 的判断であり、本当の Lead 統合判断は「reviewer 指摘 × 本当に困っているか × コスト × 学習価値」の 4 軸でフィルタリング
- 今回のセッションで具体例として: `aggregate-severity.py` / `detect-domain-conflict.py` は note 記事原則的に過剰、見送り判断

### 6. スクリプト vs Hooks の概念整理
- スクリプト = HOW (処理の中身)
- Hooks = WHEN + 強制力 (起動契機、AI を bypass する強制機構)
- note 記事 page 20 の「決定論的制御の手段」表は強制力の 5 段階階段 (Hooks > バリデーション > !コマンド > チェックリスト > スクリプト)
- skill-essentials-reviewer fork は「scripts に逃がす」のみ言及、Hook 化観点を見落としていた (reviewer の盲点として記録)

## 次セッション持越し

### 必須検証
1. **改修後 essence-reviewing-harness 実機起動** (B-1 Step 6 永続化が実際に走るか確認)
2. **`$ARGUMENTS` literal 置換問題が `<args>` 表記で回避されているか実機確認**

### 改善候補 (時間があれば)
1. master SKILL.md からの parse-target-path.sh !構文呼出統合 (B-2 完全版)
2. Hook 化検討: `~/.claude/settings.json` の `Stop` Hook で「essence-reviewing-harness 終了時に永続化を強制」
3. essence ドキュメント側 (`skill-essentials.md`) への「note 記事 step5 制約しすぎない原則」反映
4. memory `feedback_no-existing-harness-modification.md` 更新: 「改修禁止対象は協調ハーネス系 4 skill (three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle / review-agent-essence) と essence ドキュメント 3 種のみ」を明確化

### 発見済バグの追跡
- `$ARGUMENTS` literal 置換の根本回避 (現状は Gotcha 追記のみ、escape 工事は未着手)

## 関連ファイル (本改修)

### master skill
- `~/.claude/skills/essence-reviewing-harness/SKILL.md` (72 行ハブ)

### references/ (4 ファイル新規作成)
- `~/.claude/skills/essence-reviewing-harness/references/orchestration-protocol.md`
- `~/.claude/skills/essence-reviewing-harness/references/output-format.md`
- `~/.claude/skills/essence-reviewing-harness/references/gotchas.md`
- `~/.claude/skills/essence-reviewing-harness/references/connection-patterns.md`

### scripts/ (1 ファイル新規作成)
- `~/.claude/skills/essence-reviewing-harness/scripts/parse-target-path.sh`

### 改修対象外 (完全無変更維持)
- `~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/SKILL.md` (前セッションで `$ARGUMENTS` 単一経路化済)
- `~/.claude/agents/{harness,skill,ui}-essentials-reviewer.md` (前セッションで skills プリロード追加済)
- 改修禁止系 (上記 mtime 確認セクション参照)

## Observability

```yaml
session_observability:
  total_files_created: 5    # references/ 4 + scripts/ 1
  total_files_modified: 1   # SKILL.md (197 → 72 行)
  total_lines_before: 197
  total_lines_after: 337    # (72 + 69 + 95 + 47 + 54)
  hub_compression_ratio: 0.366   # 72/197 (ハブ部分)
  parameter_expansion_remnants: 0
  script_test_pass_rate: 1.0     # 5/5
  todo_completed: 5         # A, B-1, B-2, C, D
  reviewer_inflation_avoided: true   # 3 候補スクリプトのうち 2 を note 記事原則で見送り
  meta_self_review_to_implementation_loop: true   # 自己レビュー → 改修 → 永続化指示組込
```
