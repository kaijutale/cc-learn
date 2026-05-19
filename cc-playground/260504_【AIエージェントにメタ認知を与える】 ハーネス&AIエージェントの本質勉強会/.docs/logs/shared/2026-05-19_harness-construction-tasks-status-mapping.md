---
date: 2026-05-19 09:08:12
type: work
topic: harness-construction-tasks-status-mapping
session: Session N+9 — harness 構築タスク棚卸し

related_article: .docs/output/main-points.md
related_skill: [logging]
related_log_ids: [2026-05-10_essence-article-main-points-and-harness-tasks]
related_log: [.docs/logs/shared/2026-05-10_essence-article-main-points-and-harness-tasks.md]
---

# Harness Construction Tasks — 既存資産との突合せによる消し込み

> `.docs/tasks/harness-construction-tasks.md` の 22 タスクに対し、 かもねハーネスの既存実装資産 (skill 群 + agent 群 + hook 群 + CLAUDE.md ルール群) を突合せ、 確実に裏取れた 13 タスクに ✅ + 実装済み資産パスを追記、9 タスクは留保した。

## 概要

main-points.md §2〜§6 から抽出された 22 個のハーネス構築タスクファイル (P0/P1/P2 混在) に対し、 「既存資産の存在を根拠とした消し込み」 を実行する作業。 タスクファイル自身の最終節 (234 行目) に「✅ 印 + 該当エージェント名を追記して消し込むこと」 と明記された運用ルールに従った。

判定方針:

- ✅ + 実装済み資産パス: skill / agent / hook / ファイル の **存在を直接確認** できたもの
- 留保 (チェックなし): 構造はあっても **中身の内容走査が必要** なもの、 または **運用フェーズ未着手** のもの

判定基準を「資産の存在」に絞ったのは、`feedback_no-reflexive-concession` (反射的撤回禁止 / 根拠ある判断) と `feedback_reference-workflow-no-improvise` (参照元軸でマッピング、独自フレーム化禁止) の両方を守るため。

## 内容

### 消し込み済み 13 タスク

| ID | タスク | 実装済み資産 |
|----|--------|--------------|
| A1 | 領域別 essentials.md 棚卸し | `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` |
| A2 | essentials vs identity 分離 | essentials = `~/.claude/.docs/essence/` (普遍) / identity = `.docs/identity/` (固有) |
| B1 | 3 領域レビューア整備 (4 軸目のみ保留) | `{harness,skill,ui}-essentials-reviewer` agent |
| B3 | fork 経由呼出 | `{harness,skill,ui}-essentials-reviewer-fork` + `essence-reviewing-orchestrator` |
| C1 | 4 役割棚卸し | Explore / Plan + `spec-based-development` / `team-implementer` + `coder` / `team-reviewer` + 3 essence-reviewer |
| C2 | 圧縮版 essentials | `essence-for-implementer` skill (24 原則 reference、team-implementer 専用) |
| C3 | マゴエージェント | `coder` → `{red-test,implement,verify-test}-fork` → `team-{tester,implementer}` + `coordination-harness-integrity-fork` |
| C4 | Claude Only 方針 | `~/.claude/CLAUDE.md` の `## Harness` セクション |
| D3 | Hooks による強制 | `hook_pre_commit_essence_gate.sh` + 8 hooks + `installing-hook-presets` skill |
| E2 | FB 蓄積フロー | `accumulating-reviewer-feedback` skill (HITL Lv2/Lv3 切替) |
| E3 | 進捗外部化 | `handoff` + `pickup` + `logging` skill (YAML frontmatter 機械可読化) |
| E4 | Skill Creator | `authoring-skills` + `authoring-agent-definitions` + `authoring-claude-md` + `skill-essentials.md` + `skill-essentials-reviewer` |
| F1 | 本番/開発分離 | settings.json `permissions.deny` + `hook_pre_read_secret_check.sh` + `receiving-secret` の 3 層 |

### 留保 9 タスク

| ID | タスク | 留保理由 |
|----|--------|----------|
| A3 | 5 原理の網羅チェック | essentials.md の中身を逐次照合する必要あり、本セッションでは未走査 |
| B1 (4 軸目) | プロジェクトドメインレビューア要否判断 | `.docs/identity/project-charter.md` を軸とした判断が必要 |
| B2 | レビューア終了条件明文化 | 各 reviewer agent の frontmatter / 冒頭の中身走査が必要 |
| B4 | 「最後の 20 点」運用 | 運用フェーズで実測効果確認が必要 |
| D1 | 決定論化候補洗い出し | 自分のワークフローから 3 つ以上ピックアップする能動運用が必要 |
| D2 | 10 ステップ以上の進捗 JSON 外部化 | orchestrating-team-development / enforcing-strict-tdd-cycle の内部実装走査が必要 |
| D4 | 計画/実行制約強度の分離 | 運用フェーズで意識的切替の実測が必要 |
| E1 | Gotcha 蓄積 | 直近 1 ヶ月の skill 利用頻度 Top3 特定 + 各 skill の `## Gotcha` セクション実装が必要 |
| G1 | PR 駆動 5 ステップ | `discord-notification-test.md` が別タスク化されている = 未着手フェーズ |
| G2 | 四半期定例 | 運用未開始 |
| G3 | HITL ポリシー明文化 | PR テンプレに「論文信頼性チェック欄」が未整備 |

## 設計意図

### なぜ「資産の存在」だけを根拠としたか

「タスク完了 = 構造的に出来上がっている」 と 「タスク完了 = 中身まで品質基準を満たしている」 は別問題。 後者まで踏み込むと本セッションの時間枠を超え、 結果として 22 タスク全てに不確かな ✅ が並ぶ inflated state report に陥る。

そこで「存在を直接確認できたものだけ ✅」という最低ラインで切ったことで、 9 タスクの留保理由が **次セッションで何を走査すれば消し込めるか** という具体的アクションに変換された。 これは `feedback_no-reflexive-concession` 由来の「指摘されたら根拠を持って維持」原則の応用。

### なぜ各タスクに「実装済み資産パス」を追記したか

タスクファイル 234 行目に「✅ 印 + 該当エージェント名を追記して消し込むこと」 と明記されていたから。 これにより:

1. **再確認時の grep 一発性**: 「`harness-essentials-reviewer` がどのタスクに紐付くか」 を逆引きできる
2. **資産削除時の影響範囲特定**: もし将来 `essence-for-implementer` skill を統廃合するなら、 C2 が再開ペンディングになることが瞬時に分かる
3. **新規プロジェクトへの移植準備**: 13 ✅ タスクのうち、 ハードコード path (`~/.claude/`) で紐付いているものは別プロジェクトでも再利用可能、 プロジェクト固有 path (`.docs/identity/` 等) で紐付いているものはそのプロジェクト固有

### 留保 9 タスクの構造的特徴

- **3 つの未着手** (D1 / G1 / G2 / G3): 運用フェーズ・PR 駆動・四半期定例 — いずれも「実行」 が必要で「構造」 では完結しない
- **4 つの内容走査ペンディング** (A3 / B2 / D2 / E1): essence.md / reviewer.md / orchestrator skill / 個別 skill の Gotcha セクション — 中身を読まないと判定不能
- **2 つの能動判断ペンディング** (B1 4 軸目 / D4): プロジェクトドメイン reviewer 要否 / 計画-実行制約強度の意識的切替 — どちらも「考えて決める」 作業

→ 残課題が 3 系統に綺麗に分かれており、 着手順序は **能動判断 → 内容走査 → 運用** が自然な流れ。

## 副作用

### B1 4 軸目 (プロジェクトドメインレビューア) の判断が宙吊り

現状 essence-reviewer は 3 領域 (harness/skill/UI) 構成だが、 main-points.md §3 では「プロジェクトドメインレビューア」 が 4 軸目候補として明記されている。 ただしこの軸は **プロジェクト横断で定義できない** (プロジェクト固有 identity を見る必要がある) ため、 globalsharedな essence-reviewer の枠組みに乗せるべきか、 各プロジェクトの project-charter.md にレビュー基準を持たせて project ローカル reviewer として実装すべきか、 設計判断がまだ。

→ 次セッションで `.docs/identity/project-charter.md` を読んで判断材料を集めるのが現実的。

### G1 PR 駆動 5 ステップが未着手のまま

タスクファイル末尾の参照に `discord-notification-test.md` (G1 の通知フェーズ検証タスク) が別ファイル化されていることから、 G1 は「収集 → 提案 → 通知 → レビュー → 取り込み」 のうち **通知フェーズだけが部分検証中** と推測。 5 ステップ全体の実装ロードマップがまだない。

→ G1 は P1 タスクだが、 実装すべきインフラ (PR 自動作成 + Discord 通知 + HITL レビューゲート) が広範なので、 plan ファイル化が必要レベルの規模。 本セッションでは扱わない。

## 関連ファイル

- `.docs/tasks/harness-construction-tasks.md` — 本セッションで 13 ✅ を追記したタスクファイル
- `.docs/output/main-points.md` — タスク群の参照元 (§2-§6)
- `.docs/identity/{harness,skill}-identity.md` + `project-charter.md` — A2 の identity 側
- `~/.claude/.docs/essence/{harness,skill,ui}-essentials.md` — A1 の essentials 側
- `~/.claude/agents/{harness,skill,ui}-essentials-reviewer.md` — B1 の 3 reviewer
- `~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/` — B3 の fork skill 群
- `~/.claude/skills/essence-reviewing-orchestrator/` — B3 の master skill
- `~/.claude/skills/essence-for-implementer/` — C2 の圧縮版
- `~/.claude/skills/accumulating-reviewer-feedback/` — E2 の FB 蓄積フロー
- `~/.claude/skills/coordination-harness-integrity-fork/` — C3 の構造整合性検証
- `~/.claude/hooks/hook_pre_commit_essence_gate.sh` — D3 の essence gate
- `~/.claude/settings.json` の `permissions.deny` — F1 の L1 壁
- `.docs/tasks/discord-notification-test.md` — G1 の通知フェーズ検証 (別タスク、未消化)
