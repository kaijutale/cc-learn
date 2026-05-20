---
name: project-essence-orchestrator
description: >
  4 領域 (ハーネス/skill/UI/プロジェクトドメイン) の essence + identity レビューを並列起動して統合判断を返す master skill (プロジェクトローカル)。
  既存 essence-reviewing-orchestrator (グローバル 3 領域 = 普遍軸) に固有軸 (project-domain = .docs/identity/) を加えた 4 領域版。
  context:fork 経由で各 reviewer を呼出し、メインコンテキストを汚さず純粋な領域別評価を実行する。
  「project essence レビュー」「4 領域 essence」「全領域 + ドメインレビュー」「project-essence-orchestrator 起動」等で発動。
  Skill ツール経由の明示呼出を推奨 (高コスト fork 起動のため意図せぬ発火を避ける)。
---

# Project Essence Orchestrator (Master Orchestration Skill, Project-Local)

メイン Claude から明示呼出されるオーケストレーター skill。`context:fork` ベースの reviewer fork を並列起動し、評価対象への **普遍軸 3 領域 (essence: harness/skill/UI) + 固有軸 1 領域 (identity: project-domain)** からの照合分析を集約して **Lead (= 本 skill 実行中の Claude)** が統合判断を返す。

既存 essence-reviewing-orchestrator (グローバル 3 領域) は **無改修**。本 skill はプロジェクトローカルの 4 領域版として独立し、4 軸目 (project-domain) を加える。note 記事「複数レビューアの活用」の UI/プロジェクトドメイン/ハーネス 3 reviewer 例示のうち、固有軸 = プロジェクトドメインを統合する位置付け。

## I/O 契約 (skill タイプ: Workflow / orchestrator)

| 項目 | 仕様 |
|---|---|
| **入力** | `<args>` (= `$ARGUMENTS`、評価対象パス)。空なら git diff フォールバック → 不確定なら user に質問 |
| **出力** | 4 領域統合判断 (Lead 統合 = 構造化 Markdown) + 永続化ファイル 1 件 |
| **永続化先** | `$HOME/.claude/.docs/project-essence-review-runs/<YYYY-MM-DD_HHMMSS>_<target-slug>.md` (Step 6 で Write) |
| **エラー時挙動** | sub-skill 失敗 → 残領域で続行 + 欠落明示 / identity 不在 → project-domain は ⚪ 判定保留 / validate 未完了 → 該当 step に戻る |
| **依存** | fork 3-4 体 (`harness/skill/ui-essentials-reviewer-fork` = グローバル + `project-domain-reviewer-fork` = プロジェクトローカル) + 評価基準 (`~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` + `.docs/identity/`、いずれも改修禁止) |
| **副作用** | 永続化ファイル + progress JSON 書出のみ (それ以外は read-only、評価対象には触れない) |

## Orchestration Phase — 評価対象の決定論的注入

### 開始時刻 (duration 計測用)
!`date +%s`

### 親セッションの作業ディレクトリ (sub-skill が継承、cwd 継承対策の Layer 1)
!`pwd`

### 評価対象パス (`<args>` 経由、生入力)
!`echo "$ARGUMENTS"`

### 評価対象パスの決定論的解析 (parse-target-path.sh、Lead は type=/path= を採用)
!`bash .claude/skills/project-essence-orchestrator/scripts/parse-target-path.sh "$ARGUMENTS"`

### git diff フォールバック (type=empty の場合に評価対象を補完)
!`git diff --stat HEAD~1..HEAD 2>/dev/null | head -20 || echo "(no diff or not a git repo)"`

### UI 領域の要否判定 (ui-identity.md 存在時のみ ui-essentials-reviewer-fork を並列に含める)
!`ls .docs/identity/ui-identity.md 2>/dev/null && echo "UI 領域: 対象 (ui-identity あり)" || echo "UI 領域: skip (ui-identity 不在 = 本プロジェクトは UI 制作しない Anti-Goal)"`

### identity 存在検証 (project-domain 軸の前提条件)
!`ls .docs/identity/*.md 2>/dev/null || echo "(identity 不在 → project-domain は ⚪ 判定保留)"`

### 進捗追跡 JSON 初期化 (ステップ抜け対策)
!`bash .claude/skills/project-essence-orchestrator/scripts/init-progress.sh "$ARGUMENTS"`

### progress_json パス (Lead 用ピン留め)
!`ls -t ~/.claude/.docs/project-essence-review-runs/*_progress.json 2>/dev/null | head -1`

---

## ナビゲーション (共通設計は既存 essence orchestrator references を流用)

本 skill は essence-reviewing-orchestrator と同型構造。重複を避け、共通設計は既存 references を参照する:

| 詳細 | 参照先 |
|---|---|
| 設計の核心 6 項目 + エラーマトリクス | `~/.claude/skills/essence-reviewing-orchestrator/references/design-rationale.md` |
| Step 1-6 ハブ + 進捗追跡 JSON 共通仕様 | `~/.claude/skills/essence-reviewing-orchestrator/references/orchestration-protocol.md` |
| Step 詳細 (入口/分析/判断/永続化) | `~/.claude/skills/essence-reviewing-orchestrator/references/step-{1-2,3-3.5,4-5,6}.md` |
| Gotchas (parameter expansion / literal 置換 / grayzone 等) | `~/.claude/skills/essence-reviewing-orchestrator/references/gotchas.md` |
| 普遍軸 essence 24 行最小要約 | `~/.claude/skills/essence-reviewing-orchestrator/references/essence-summary.md` |
| **固有軸 identity (本プロジェクトの自己定義)** | `.docs/identity/{project-charter,harness-identity,skill-identity}.md` |

**4 領域版固有の差分** (本 skill が essence orchestrator に追加する点) は下記「指示」セクションに inline。

## 指示 (Lead = 本 skill 実行中の Claude への責務)

Lead は以下の手順で **3-4 領域並列レビュー**を実行する。共通の Step 詳細は上記 references 参照、4 領域版の差分のみ以下に明示:

1. **Step 1 評価対象確定**: 上記 `### 評価対象パス` を確認、空なら git diff フォールバック or ユーザー質問
2. **Step 2 並列起動 (3-4 fork、1 メッセージ内発火)**:
   - 必須 3: `Skill(harness-essentials-reviewer-fork)` + `Skill(skill-essentials-reviewer-fork)` + `Skill(project-domain-reviewer-fork)`、各 `args="<評価対象>"`
   - 条件付き: `### UI 領域の要否判定` が「対象」なら `Skill(ui-essentials-reviewer-fork)` も追加 (本プロジェクトは通常 skip)
3. **Step 3 戻り値分析**: 各領域の原則/identity マトリクス + severity 付き指摘を抽出
4. **Step 3.5 領域横断チェック**: **普遍軸 (harness/skill/ui essence) と固有軸 (project-domain identity) の関係を整理**。特に「essence は満たすが identity の選択に反する」or「identity は満たすが essence 原則違反」の交差ケースを検出。共通懸念・矛盾も抽出
5. **Step 4 Lead 統合判断**: 領域横断 Critical 優先 / 反インフレ (全領域 🟢 は赤信号) / 矛盾解消 / Claude Only 維持。**普遍軸と固有軸の混同を防ぐ** (essence 原則違反と identity 選択違反は別レイヤーとして報告)
6. **Step 5 出力**: 下記「出力フォーマット」に従う
7. **Step 6 永続化** (3 段必須): mkdir → Write tool で `$HOME/.claude/.docs/project-essence-review-runs/` に保存 → `bash .claude/skills/project-essence-orchestrator/scripts/validate-all-steps.sh "<progress_json>"` で 9 step 完走を機械検証

各 step 完了時に `bash .claude/skills/project-essence-orchestrator/scripts/mark-step-completed.sh "<progress_json>" "<step_id>"` で進捗 JSON を更新。

## 出力フォーマット (4 領域統合判断)

```
# Project Essence Review: {対象名}

> 評価基準: essence/{harness,skill,ui}-essentials.md (普遍軸) + .docs/identity/ (固有軸)

## 総合判断
<🟢/🟡/🔴/⚪> <推奨アクション 2-3行>

## 領域別サマリ

| 領域 | 軸 | 判定 | Critical | High | 一言 |
|---|---|---|---|---|---|
| harness | 普遍 | 🟢/🟡/🔴/⚪ | <n> | <n> | ... |
| skill | 普遍 | ... | ... | ... | ... |
| UI | 普遍 | (skip if ui-identity 不在) | ... | ... | ... |
| project-domain | 固有 | ... | ... | ... | ... |

## 領域横断の論点 (Step 3.5)
- 普遍軸と固有軸の交差ケース: <essence は満たすが identity 違反、等>
- 共通懸念: <複数領域で繰り返し出た指摘>
- 矛盾: <領域間で評価が割れた点と Lead の解消>

## 領域別詳細
(各 fork の戻り値を領域ごとに要約)

## Lead 統合所見 (2-3文)

Observability:
  domains_evaluated: <3 or 4>
  total_critical: <n>
  total_high: <n>
  duration_sec: <n>
  ui_domain: <included / skipped>
```

## Gotcha

- **must**: 「全領域 🟢」は赤信号 (反インフレ原則違反候補、Lead は能動的に見落としを探す)
- **must**: 外部 AI (GPT/Gemini/Codex/Cursor 等) 連携は禁止 (Claude Only 不変原則、CLAUDE.md `## Harness` 遵守)
- **must**: **普遍軸 (essence) と固有軸 (identity) の混同禁止**。「Opus 固定」「kebab-case」は identity 違反、「コンテキスト有限資源」は essence 違反として別レイヤーで報告
- **must**: UI 領域は `ui-identity.md` 存在時のみ並列に含める。本プロジェクトは「UI 制作しない」Anti-Goal のため通常は 3 領域 (harness/skill/project-domain)
- **must**: 評価対象パスは `$ARGUMENTS` 経由で絶対パス渡し (各 fork に伝播)
- **should**: Critical 検出時は Step 4 末尾で HITL チェックポイントを発火 (片面性バイアス解消)
- **avoid**: `${VAR:-default}` を !構文内で使わない、`$VAR` 単体参照のみ (Contains expansion deny で hook が発火しない、essence orchestrator Gotcha 継承)
- **avoid**: 既存 essence-reviewing-orchestrator (グローバル 3 領域) の改修 (memory `feedback_no-existing-harness-modification` 準拠、本 skill は独立した 4 領域版)
- **scripts 相対パス**: 本 skill は master (非 fork) のため cwd = プロジェクトルート前提で `.claude/skills/project-essence-orchestrator/scripts/` を相対参照 (essence orchestrator は `~/.claude/...` 絶対だが本 skill は project ローカル配置)
- **永続化先分離**: グローバル 3 領域 review は `essence-review-runs/`、本 skill 4 領域 review は `project-essence-review-runs/` (混在防止)
