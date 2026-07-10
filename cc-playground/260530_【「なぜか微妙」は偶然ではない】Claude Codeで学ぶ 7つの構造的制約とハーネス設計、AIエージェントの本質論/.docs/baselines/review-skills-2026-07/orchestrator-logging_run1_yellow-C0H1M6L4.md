[Essence Review Result] ~/.claude/skills/logging — type別テンプレートでログを canonical log root へ統一記録し /promote-log で昇格する記憶外部化 skill (306行単一ファイル)

> 実行文脈: review系skill強化プラン (issue #73-#83) の baseline 取得 run。固定対象 logging skill への
> 3領域レビューを改修前 main で記録し、以後の各 PR の合格判定 (verdict 比較) の物差しとする。

## 3 領域サマリ

| 領域 | 結論 | 主な指摘 (severity 最高) |
|---|---|---|
| Harness (15 原則) | 🟡 CONDITIONAL | 配置先ルールの優先順位未定義 — プロジェクト CLAUDE.md「全ログ shared/」と skill「shared/ 直書き禁止」が無裁定で衝突・顕在化済み (High) |
| Skill (13 原則) | 🟡 CONDITIONAL | 検証の LLM 判断依存 (date/H2/ファイル名一致が散文頼み・2026-06-13 に実失敗歴) ほか Medium 4件 |
| UI (9 原則) | ⚪ DEFER | UI 成果物ゼロにつき全 9 原則 関連度「-」(スコープ外の正当判定、機械 grep で裏取り済み) |

## 領域横断分析

### 共通する懸念 (複数領域で検出)
- 配置先ルールの衝突・優先順位未定義 (検出領域: Harness=High, Skill=Medium) — 同一事象を両領域が独立検出
- 成果物検証 (date形式/ファイル名一致/必須H2) の LLM 遵守依存 (検出領域: Harness, Skill) — 実失敗歴 (2026-06-13) 付き
- description 内の死んだ系譜参照 (logging-implementation / logging-validation-result は現存せず) (検出領域: Harness=Low, Skill=Medium)
- 単一ファイル 306 行の progressive disclosure 未適用 (検出領域: Harness=Low, Skill=Medium)

### 矛盾する判断 (領域間で対立)
- 配置先衝突の severity: Harness は High (顕在化済み・最重要契約が確率裁定に委ねられている)、Skill は Medium — 解消方針: **High を採用** (git status に shared/ 直書き untracked が実在する顕在事実を優先)
- 死んだ系譜参照の severity: Harness は Low (トリガー非寄与の歴史情報)、Skill は Medium (常駐コンテキストを全セッションで消費) — 解消方針: **Medium を採用** (常駐 description は毎セッション課金される帯域であり、Low の「軽微な体裁」を超える)
- monolith 構造: Harness は「現状維持も妥当な範囲」(Low)、Skill は references/ 分離推奨 (Medium) — 解消方針: **条件付き Medium** (分離推奨。ただし高頻度・全テンプレ参照 skill ゆえ、分離後の実ロード量を測ってから確定する条件を付す)

### Step 3.5 検査記録
- 検査A (片面性): High 指摘の文脈適用性は成立 — 衝突は仮説でなく顕在化済み (over-spec ではない)。bias_detected: false
- 検査B (領域間矛盾): 上記 3 件を裁定済み
- 検査C (逆方向見落とし): 非該当 (3 領域全 🟢 ではない)

## Lead 統合判断

### 結論
🟡 条件付き適合 — Critical 0 / High 1 / Medium 6 / Low 4

### 根拠 (3 領域を踏まえた構造的判断)
決定論シェルによる canonical root 解決・ID+path ハイブリッド参照・成長する Gotcha と、記憶外部化 skill としての設計水準は高く、Critical 級の原理違反は 3 領域いずれも検出しなかった。ただし「shared/ 直書き禁止」という skill の最重要契約が、プロジェクト CLAUDE.md の逆指示と無裁定のまま衝突しており (High・顕在化済み)、守りたい契約ほど確率的裁定に委ねられている逆転がある。検証の散文依存 (実失敗歴あり)・死んだ系譜の常駐消費・monolith 化は「増築の負債」として Medium 群を構成する。UI 領域の ⚪ は「問題ゼロ」でなく「判定対象ゼロ」であり、verdict をインフレさせない。

### 反インフレチェック (Lead 視点)
- 全領域 OK だったか: NO
- 検出された Critical/High の領域横断的影響評価: High 1 件 (配置先優先順位未定義) は logging 単体でなく「グローバル skill × プロジェクト CLAUDE.md」の一般問題の顕在例 — 他のグローバル skill にも同型の衝突が潜在しうる (横断的教訓)。

### 統合改善提案 (優先順位付き)
1. 配置先優先順位の明文化 (対応領域: 横断/High) — skill 本文に override 契約 1 行 (「プロジェクト CLAUDE.md が配置先を明示指定する場合はそちらが優先」等) を追加するか、プロジェクト側ルールを skill 契約に整合させる。どちらでもよいが決定論的に一方へ倒す
2. ログ整合性 validator の新設 + resolver 一本化 (対応領域: 横断/Medium) — `scripts/validate-log.sh` (必須 field・日付一致・必須 H2 の機械検証) と `scripts/resolve-log-root.sh` (4 箇所コピペの一本化)
3. description の死んだ系譜文の削除 (対応領域: Skill/Medium) — 系譜は本文か Gotcha へ移設し、常駐 description をトリガー + 契約に絞る
4. references/ 分離 (対応領域: Skill/Medium・条件付き) — type 別テンプレ約 120 行の切出し。高頻度参照ゆえ実ロード量の事前見積を条件とする
5. worktree→本体回収の最終マイルゲート (対応領域: Harness/Medium) — handoff/pickup に「.docs/logs/ untracked 検出→回収提案」を 1 行組込
6. Low 群 — 「重要な注意事項」節の再掲削除・gitignore 警告と Gotcha 例外の本体統合

### 条件 (🟡 の場合のみ、適合のための前提条件)
- 改善提案 1 (配置先優先順位) を解消すること — High が残る限り「条件付き」から昇格しない
- 改善提案 2 の validator 新設まで実施すれば、skill 自身が説く決定論的制御に自己準拠する

## Observability

```yaml
Observability:
  tool_uses_count: 17
  file_writes_count: 1
  duration_sec: 760
  sub_skill_invocations: 3
  sub_skill_durations: [106, 109, 114]
  domains_evaluated: ["harness", "skill", "ui"]
  critical_count: 0
  high_count: 1
  medium_count: 6
  low_count: 4
  lead_freedom_indicator: balanced
  persisted_to: "~/.claude/.docs/essence-review-records/2026-07-05_005459__Users_camone_.claude_skills_logging.md"
```
- 3 sub-skill の起動順: 並列 (1 メッセージ内 3 Skill 呼出。ui のみ孫 agent 完了が非同期で後着)
