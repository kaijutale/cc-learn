---
name: project-domain-reviewer-fork
description: >
  Project Domain Review — project-essence-orchestrator (master skill) からの明示呼出専用 (Skillツール経由のみ)。
  context:fork + subagent:project-domain-reviewer で評価対象への「本プロジェクト固有ドメインルール (.docs/identity/)」観点からの照合分析を孫エージェントに委譲する。
  description マッチによる自動誘発は想定しない (project-essence-orchestrator skill 内からのみ起動)。
context: fork
subagent: project-domain-reviewer
---

# Project Domain Reviewer (Fork Skill)

project-essence-orchestrator (master skill) から呼び出される孫エージェント起動 skill。親コンテキストを切り離し、project-domain-reviewer をフレッシュコンテキストで起動して評価対象への **本プロジェクト固有ドメインルール (.docs/identity/)** の照合分析を返す。

## 設計の核心

- **!コマンド構文 (決定論的注入)**: 評価対象パスを master skill から `$ARGUMENTS` 経由で受取 + identity 存在検証 + Anti-Goals 照合を skill 自身が自律取得
- **context:fork による分離**: 普遍軸 (harness/skill/UI) reviewer の判断に引きずられないよう、孫は完全独立コンテキストで起動。固有軸 (プロジェクトドメイン) の純粋性を物理的に保証
- **project-domain-reviewer agent の役割流用**: 既存 agent 定義 (`.claude/agents/project-domain-reviewer.md`) を完全無変更で利用。Read/Grep/Glob/Bash 読み取り専用、Edit/Write 非装備で構造的に書込不能、judging-review-severity rubric プリロード済
- **反インフレ原則の維持**: agent 側「問題ゼロは疑う」「全軸 OK は赤信号」原則を本 skill でも厳格適用
- **Claude Only 原則**: 外部 AI は使わず、project-domain-reviewer (Claude Opus) が役割分離による視点独立性を担う

## Critical Analysis Phase — プロジェクトドメイン視点での評価対象照合

### 開始時刻
!`date +%s`

### 親セッションの作業ディレクトリ (PARENT_CWD、cwd 継承対策の Layer 1)
!`pwd`

### 評価対象パス (master から $ARGUMENTS で受取、空なら master でフォールバック解決済か確認)
!`echo "$ARGUMENTS"`

### identity 存在検証 (PDR の前提条件、欠落時は ⚪ 判定保留)
!`ls .docs/identity/*.md 2>/dev/null || echo "(identity 不在 → 評価軸なし、判定保留 ⚪)"`

### 評価対象が project-charter の Anti-Goals に該当するか機械検証 (スコープ外作成の検出)
!`grep -nA12 '作らないもの' .docs/identity/project-charter.md 2>/dev/null || echo "(project-charter.md 不在)"`

### 現在の git status (作業ツリー文脈、評価対象がリポジトリ内なら関連)
!`git status -sb 2>/dev/null || echo "(not a git repo)"`

---

## 指示 (project-domain-reviewer への評価対象提示)

project-domain-reviewer は プロジェクトドメインレビュー専任 agent (Edit/Write 非付与で構造的に書込不能、identity を評価軸にプリロード、反インフレ原則「問題ゼロを疑う」を継承)。以下の手順で評価対象を分析し、identity 適用マトリクス + severity 付き構造化テキストで返答する。

### Step 0: 作業ディレクトリ固定 (cwd 継承対策の Layer 2、必須)

最初に以下を実行:
```
cd "<上記 PARENT_CWD セクションに表示された絶対パス>"
```

### Step 1: 評価基準 (identity) の全量 Read

```
Read .docs/identity/project-charter.md
Read .docs/identity/harness-identity.md
Read .docs/identity/skill-identity.md
```

identity の全選択を把握する。`### identity 存在検証` セクションで identity が 1 つも検出されなかった場合は、判定保留 ⚪ を返して終了 (PDR の前提条件未達)。

### Step 2: 評価対象の特定と Read

上記 `### 評価対象パス` の `$ARGUMENTS` 値を確認し、以下の方針で評価対象を確定:
- **パスがファイル**: そのまま Read
- **パスがディレクトリ**: Glob で関連ファイルを列挙、優先度順に Read
- **`$ARGUMENTS` が空 (master でフォールバック解決済)**: master 戻り値で示された変更ファイル群を Read。それも未確定なら `### 現在の git status` を参考に判定保留シグナル ⚪ を返す

### Step 3: identity 適用判定 (機械シグナル援用)

上記 `### 評価対象が project-charter の Anti-Goals に該当するか機械検証` の出力を判定の客観根拠として活用 (LLM 主観に頼らない)。

identity の各選択について、評価対象との **関連度** を判定:
- **高**: 評価対象がこの選択に直接関わる
- **中**: 部分的に関わる
- **低**: 周辺的にしか関わらない
- **-**: 関連なし (機械的適用は禁止、ノイズになる)

関連度「高/中/低」の選択のみ判定:
- **○**: identity の選択に沿っている
- **△**: 部分的に沿っているが乖離余地
- **×**: identity の選択に違反

### Step 4: severity rubric 適用 + 指摘

判定「△/×」の項目に severity を付ける (judging-review-severity rubric)。本プロジェクト固有の Critical 例:
- 🔴 **Critical**: identity の明示選択への根本違反 (Anti-Goals 違反 / 外部 AI 連携 / 手動 git / logs local 直行 / モデル混在 / CLAUDE.md 重複)
- 🟠 **High**: identity 選択違反だが影響範囲が局所的
- 🟡 **Medium**: identity の精神からの逸脱、明示選択違反ではない
- 🟢 **Low**: スタイル・改善余地

### Step 5: 反インフレチェック

**問題ゼロは疑う**: 1 件も問題が出なかった場合、見落としを能動的に探し直す。特にプロジェクトドメイン領域では:
- Anti-Goals の表面的遵守 (構造的にはスコープ内だが、精神に反する future infra の作り込み等)
- identity 選択の暗黙違反 (明示されていないが harness-identity の精神から外れる選択)
- essence (普遍) と identity (固有) の取り違えによる見落とし

### 重要: essence との混同禁止

「コンテキストは有限資源」「関心の分離」等の普遍原理は **essence reviewer の責務** であり、本 reviewer では判定しない。本 reviewer は identity (このプロジェクトの固有選択) のみを見る。

---

## 出力フォーマット (master への戻り値)

```
[Project Domain Review] <評価対象1行サマリ>

## 結論
<🟢/🟡/🔴/⚪> <推奨アクション 1-2行>

## identity 適用マトリクス

| identity 選択 | 関連度 | 判定 | severity | 根拠 |
|---|---|---|---|---|
| Anti-Goals (UI 制作しない / 外部公開しない 等) | 高/中/低/- | ○/△/×/- | Critical/High/Medium/Low/- | <根拠 file:line> |
| Claude Only (外部 AI 連携禁止) | ... | ... | ... | ... |
| Opus 固定 (multi-agent) | ... | ... | ... | ... |
| logs shared 直行 | ... | ... | ... | ... |
| committer 統一 (手動 git 禁止) | ... | ... | ... | ... |
| CLAUDE.md と identity の責務分離 | ... | ... | ... | ... |

## 主要な指摘

### 強み (○ 判定の中で特に評価できる点)
- <強み1>

### 改善提案 (△/× 判定への対応)
- 🔴 Critical:
  - <問題1>: <詳細> — 改善提案: <具体策>
- 🟠 High:
  - <問題1>: <詳細> — 改善提案: <具体策>
- 🟡 Medium:
  - <問題1>: <詳細> — 改善提案: <具体策>
- 🟢 Low:
  - <問題1>: <詳細> — 改善提案: <具体策>

### 見落としリスク (反インフレチェック結果)
- 全軸 OK だったか: <YES/NO>
- YES の場合: 能動的に探した「見落とし候補」: <検出 or 「真に問題なし」と確信した根拠>
- NO の場合: スキップ

## 総評 (2-3文)

Observability:
  tool_uses_count: <N>        # Read/Bash/Grep/Glob 使用回数の合計
  file_writes_count: 0        # 批評専任 (Edit/Write 非装備で構造的に 0 固定)
  duration_sec: <N>           # 報告直前に date +%s で計測、開始時刻との差
  files_read: <N>             # 補助情報、tool_uses_count の内訳
  domain: project-domain
  selections_evaluated: <N>   # 関連度 高/中/低 の合計 (- は除く)
  critical_count: <N>
  high_count: <N>
```

**duration 計測**: 完了報告の直前に Bash で `date +%s` を実行し、開始時刻との差を記録。

## Gotchas

- **context:fork により親 (master skill) の会話履歴は引き継がない**
- **評価対象パス受渡し方式**: master skill から `$ARGUMENTS` 経由で渡される (絶対パス推奨、ディレクトリ/ファイルのいずれも許容)
- **反インフレ原則の厳格適用**: 「問題なし」結論は赤信号として扱い、必ず再検討する (agent 側「全軸 OK は赤信号」原則を継承)
- **cwd grayzone 対策**: Step 0 の cd 必須 (`feedback_skill-fork-asymmetry.md` 参照)。identity の相対パス `.docs/identity/` は cwd = プロジェクトルート前提
- **project-domain-reviewer は Edit/Write 非付与で構造的に書込不能** (agent 定義側で除外済、`.claude/agents/project-domain-reviewer.md` の tools フィールド参照)
- **観点独立性は役割分離で保証**: 同モデル (Claude Opus) でも identity プリロードにより「プロジェクトドメイン視点」固有の分析が出る
- **essence (普遍) と identity (固有) の混同禁止**: 本 fork は固有軸専任。普遍原理は harness/skill/ui-essentials-reviewer-fork の責務
- **identity 不在時は ⚪ 判定保留**: 評価軸が存在しないのに無理に判定しない (bootstrapping-project-identity skill で identity 生成が前提条件)
- **プロジェクトローカル配置**: 本 skill は `.claude/skills/` 配置 (グローバル `~/.claude/` ではない)。skill は Personal > Project の優先順位だが、本 skill 名はグローバルに存在しないため衝突せず認識・呼出可能
