---
title: Opus 固定判断の検証 KPI (§8 #13)
type: knowledge
category: kpi
status: active
created: 2026-04-15
updated: 2026-04-15
rationale: "Claude Opus 固定方針 (§8 #1 CLOSED) の品質監視装置"
related_decision: .docs/plans/2-layer-harness-framework-construction.md#8-1
harness_version: "0.2.0"
---

# Opus 固定判断の検証 KPI

## 背景

three-elements-harness の設計書 `.docs/plans/2-layer-harness-framework-construction.md` §8 要決定事項 **#1 外部マクロツール接続方針** は、**CLOSED (Claude Opus 固定、OpenCrew / GPT-5.4 等不採用)** として決着している。

しかし `review-agent-essence` skill による agent-essence 原則レビュー (2026-04-15) では、本判断が **「信念レベル」** との指摘を受けた。具体的に:

> 判断の根拠が「エコシステム統一」「推論能力」「個人用スコープ」の 3 点で、**すべて回避の理由** であり **積極的な検証可能根拠ではない**。記事「次世代ハーネス設計」が自ら掲げる「検証しやすい形で仮説を置く」立場からの乖離として再考の余地がある。

この指摘に対し、**判断を覆すのではなく、判断を監視する KPI を注入する** ことで整合性を取るのが本 KPI の設計趣旨。§8 #1 (CLOSED) は保持したまま、§8 **#13 (新設 OPEN)** として本 KPI を導入する。

## 指標

本 KPI は 3 つの数値で Opus 固定判断の運用品質を測定する:

| 指標 | 閾値 | 計測方法 |
|---|---|---|
| `ticket_success_rate_min` | **>= 0.80** | 測定窓内の `status_transition to=done / (to=done + to=failed)` |
| `replan_chain_max_avg` | **<= 2.5** | 測定窓内の failure_replanner 起動回数の平均 retry_chain 長 |
| `measurement_window_days` | **30 日** | 集計窓 (rolling) |

### 成功率 (ticket_success_rate_min)

Claude Opus 固定で運用した ticket のうち、正常に done に至った割合。閾値 0.80 は「5 本に 1 本まで失敗は許容、それ以下は品質低下」の経験則から設定。

**計算式**: `done / (done + failed)` (ただし window 30 日以内、tzinfo 付きタイムスタンプのみ)

### retry chain 平均長 (replan_chain_max_avg)

Opus が失敗した ticket のうち、どれくらいの深さで retry が必要になったかの平均。chain が深い = 1 回の失敗で復帰できず複数回のやり直しが必要 = モデルが境界条件を把握できていない兆候。閾値 2.5 は「平均 2.5 回以内で復帰」が目安。

## 計測主体

`~/.claude/skills/three-elements-harness/scripts/status-poller.py#compute_opus_validity_kpi()` が定期実行時 (cron / LaunchAgent / manual) に本 KPI を計算する。

入力:
- `.docs/trilayer/status.yml` の `entries` (status_transition action のみ抽出)
- `.docs/trilayer/macro-policies.yml#kpi.opus_fixation_validity` の閾値設定

出力:
- **閾値 OK**: console 出力のみ、status.yml への書き込みなし
- **閾値割れ**: `status.yml` に `kpi_drift_detected` エントリを append + 本ドキュメント (decisions/ 相当) に再検討ログを追記

## 閾値割れ時の動作

1. `status-poller.py` が drift を検知
2. `status.yml` に `kpi_drift_detected` エントリを append (`append_kpi_drift_entry()`)
3. `.docs/knowledge/decisions/YYYY-MM-DD-kpi-drift-opus-fixation.md` に詳細ログを記録 (手動 or v0.3 で自動)
4. **drift が 2 週連続** で発生した場合のみ、§8 #1 (Opus 固定) の再検討を検討するトリガーとなる
5. 再検討した結果、方針変更が必要と判断された場合は `.docs/plans/2-layer-harness-framework-construction.md` §8 #1 を OPEN に戻し、OpenCrew / 他モデルの採用判断を改めて行う

## 初回測定

- **計測開始**: v0.2.0 リリース + 30 日後 (= 測定窓 1 周完走後)
- **初回評価**: リリース後 45 日目にユーザー (かもね) が status.yml のサンプル数を確認。サンプルが 10 件未満の場合は評価を延期する

## 本 playground での現状 (self-apply 検証)

v0.2.0 リリース時点の計測結果:

```
opus KPI: success_rate=1.00 (>= 0.80, sample=2/2 in 30d)
status: OK no drift detected
```

playground の v0.1.0 dogfooding 中に発生した `status_transition to=done` 2 件を観測対象として、成功率 100% でクリア。ただし **サンプル数 2 件は統計的に不十分** で、意味のある評価は v0.2.0 リリース後の実運用データを待つ必要がある。

## 関連

- 設計書: `.docs/plans/2-layer-harness-framework-construction.md#8-1` (§8 #1 Opus 固定 CLOSED)
- 更新プラン: `.docs/plans/three-elements-harness-v0.2-update-plan.md#4` (本 KPI の §8 #13 新設決定)
- 実装: `~/.claude/skills/three-elements-harness/scripts/status-poller.py#compute_opus_validity_kpi`
- 設定: `.docs/trilayer/macro-policies.yml#kpi.opus_fixation_validity`
- レビュー原則: agent-essence **E-2 (ルールより理由で汎化する)**

## 注意事項

- 本 KPI は **Opus 固定判断を覆すための根拠ではない**。品質監視装置として機能し、閾値割れ時のみ **再検討の検討** を始める
- **サンプル数が少ない** (< 10 件) 状態では drift 判定自体が信頼できない。初期運用では数値に一喜一憂せず、サンプルが十分溜まってから判断する
- 本 KPI の閾値 (0.80 / 2.5) はプロジェクトごとに `macro-policies.yml` で調整可能。本 playground はデフォルト値を採用
