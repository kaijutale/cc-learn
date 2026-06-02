---
date: 2026-06-02 14:48:39
type: observation
topic: subagent-parallel-coordination
session: C-4外部検証器 Phase C
target: Phase C で general-purpose subagent 3体を並列起動した協調の実地挙動 (競合回避・自己検証・継続依頼・発見の伝播)
verifier: メインClaude (Opus 4.8 1M)
related_skill: [enforcing-strict-tdd-cycle]
related_agent: [coder]
related_log_ids: [2026-06-02_c4-external-verifier-implementation]
related_log: [.docs/logs/shared/2026-06-02_c4-external-verifier-implementation.md]
---

# subagent 3体並列協調の実地観測 (C-4 外部検証器 Phase C)

> 「幹直列・枝並列」の枝部分で general-purpose subagent 3体を並列起動。完全自律協調でなく **メイン駆動の協調** がどう機能したかの観測。

---

## 検証目的

Phase C で P1/P2/P3 の oracle 本体を独立 subagent に並列委託した際、(1) 競合をどう回避したか (2) subagent の自己申告をメインがどう扱ったか (3) 委託先の発見をどう活用したか (4) 継続依頼がどう動いたか を実地で観測する。実装内容そのものは別ログ (related_log) に記録済み、本ログは **協調メカニズムの挙動** に絞る。

## 検証環境

| 項目 | 値 |
|---|---|
| メイン | Claude Code Opus 4.8 (1M context) |
| subagent | general-purpose × 3 (oracle-p1=P1coverage / oracle-p2=P2cycles / oracle-p3=P3loop) |
| 起動方式 | 1メッセージ内で Agent ツール3つ同時 (foreground 並列) |
| 継続 | SendMessage (agentId 経由) |
| 委託範囲 | 独立 oracle 本体+テスト+fixture のみ。coder.md (4タスク競合) は委託せずメイン集約 |

## 実測結果サマリ

| 観測点 | 結果 | 備考 |
|---|---|---|
| 3体並列起動 | ✅ | 1メッセージ同時、各独立コンテキスト |
| ファイル競合 | ✅ ゼロ | 別ファイル分割、各 subagent が mtime で「他を触ってない」を自己証明 |
| 自己検証 (自己申告) | ✅ | 各 exit code 付き報告 (17/7/9 PASS) |
| メイン第三者検証 | ✅ | run-all で再実行 = 55ケース (自己申告を鵜呑みにせず) |
| 継続依頼 | ✅ | agentId で resume (name 指定は不可だった) |
| 発見の上流伝播 | ✅ | P1 subagent が lib バグ発見 → メインが根本修正 |

## 各Stage 詳細結果

### Stage 1: 並列起動と競合回避設計

- **結果**: ✅
- **観測**: 3体を1メッセージで起動。prompt で「触っていいファイル」「絶対触らないファイル (coder.md/verify-test-fork/既存基盤)」「run-all.sh は実行しない (並列干渉回避、自分のテストを直接 bash 実行)」を明示。
- **学び**: 競合回避は「ファイル分割」だけでなく「run-all 不使用 (各自のテスト直接実行)」の指示が効いた。3体が同時に run-all すると他の書きかけテストを拾って FAIL する過渡状態が起きるため。

### Stage 2: 自己申告 + Stage 3: メイン第三者検証 (2段構え)

- **結果**: ✅
- **観測**: 各 subagent は「17/7/9 PASS, exit 0」と exit code 付きで自己申告。メインはそれを鵜呑みにせず run-all で全6ファイル一括再実行 → 55ケース全PASS を独立確認。
- **学び**: これは C-4「自己申告は完了の証拠にならない」を **マルチエージェントに適用** した形。subagent の「できました」= 自己申告 (信頼度中)、メインの run-all = 第三者の物理検証 (信頼度最高)。委託しても最終 gate はメインが握る。

### Stage 4: 継続依頼 (SendMessage)

- **結果**: ✅ (1回つまずいた)
- **観測**: P2 の静的 .ts fixture が TS LSP ノイズを出すと判明 → 同じ subagent に継続依頼。`to: "oracle-p2"` (name) は `No agent named ... addressable` で失敗。`to: <agentId>` で resume 成功 (background 再開→完了通知)。
- **学び**: **完了した background agent の resume は name 不可、agentId 必須**。新規 spawn と継続は別経路。

### Stage 5: 発見の上流伝播

- **結果**: ✅
- **観測**: P1 subagent が「lib の parse_coverage_pct pytest branches が metric 無視で行%を返す」バグを自力で発見し、自分の本体側で fail-closed 回避。メインはこれを受けて lib 本体を根本修正 + 回帰ケース追加 (subagent の本体回避は二重防御として残置)。
- **学び**: subagent の発見が「自分の回避」で終わらず、メインに伝播して **根本修正** に繋がった。委託の副産物として共有基盤の品質が上がる。

## 重要発見

1. **完了 background agent の resume は agentId 必須** (name 不可)。SendMessage で継続する時の実務的な罠。
2. **C-4 のマルチエージェント適用**: 委託先の「PASS しました」を最終証拠にせず、メインが run-all で第三者再検証する2段構え。委託しても完了 gate はメインが握る。
3. **competing 回避 = ファイル分割 + run-all 不使用**: 同一ファイルを触るタスク (coder.md) は並列せずメイン集約、独立ファイルのみ並列。並列中は各自のテストを直接実行 (run-all は全体統合用にメインが最後に1回)。
4. **改修中ハーネスを使わない**: 改修対象が TDD ハーネス (coder/fork skill) 自身なので、それを使わず汎用 general-purpose で委託 (自分を改修中に動かす再帰の回避)。

## 改善候補

- 並列 oracle 作成の subagent prompt テンプレ化: 「触らないファイル明示 / run-all 不使用・自テスト直接実行 / exit code 自己申告 / mtime で非干渉自己証明」。次に検証器を並列増設する時に再利用。
- subagent への「報告フォーマット」指定 (最終メッセージ=構造化データ) は、メインが結果を機械的に集約するのに有効だった。

## 結論

subagent 並列協調は「独立ファイル分割 + メイン集約 (競合タスク) + メイン第三者再検証」の3点で機能した。完全自律協調ではなく **メイン駆動の協調** (起動・集約・最終 gate はメイン)。C-4 の「自己申告を信用しない」原則はマルチエージェントでもそのまま適用でき、委託の旨味 (独立コンテキスト+並列) と完了保証 (メイン物理検証) を両立できた。
