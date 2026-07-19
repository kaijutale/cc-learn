---
date: 2026-07-20 03:51:41
type: study
topic: k-2-3-observability-adoption-check
session: K-2.3 取り入れ確認 (取り入れフェーズ第2弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (K-2.3 = 1630〜1676行)
related_skill: [logging]
related_log_ids: [2026-07-19_k-2-2-doc-structuring-adoption-check, 2026-07-16_global-harness-changelog-review]
related_log: [.docs/logs/shared/2026-07-19_k-2-2-doc-structuring-adoption-check.md, .docs/logs/shared/2026-07-16_global-harness-changelog-review.md]
---

# K-2.3「観測面を設計する」取り入れ確認 — 判定: 取り入れ済み・改修見送り (盲点1件を記録)

> note K-2.3 の推奨 (5チャネル観測面設計 + 「観測できないものは制御できない」) を `~/.claude` 実態と照合。**5チャネル充足 + 原則の規範化で取り入れ済み**、うち3点 (二階の観測面 / 発火数の意味論 / 自己汚染防止) は記事水準超え。残差1件「レア条件ゲートの沈黙を平和/死亡で機械区別できない」は**実害未確定の自覚済み盲点として記録のみ** (かいじゅう判断 2026-07-20、issue化・改修とも見送り)。

## 概要

取り入れフェーズ第2弾。記事 K-2.3 の推奨は: ①エージェントが世界を認識する **5チャネル** (ファイルシステム / コマンド / ログ / API / UI) を意識的に設計する ②原則「**観測できないものは制御できない**」(観測面は検証ループ V-2 の前提、自己申告 C-4 の排除) ③「何を観測できて何を観測できないかを意識する。観測できないチャネルに気づいたら、それは設計上の盲点」。

照合はすべて実測 (ls / grep / JSONL 集計 / hook スクリプト実読) で行った。

## 内容

### 5チャネル照合 — ハーネス文脈への置き換えで全チャネル実在

観測対象がアプリでなくハーネス自身のため、API/UI は機能等価物で照合した。

| note チャネル | ハーネスでの実体 | 実測値 (2026-07-20) |
|---|---|---|
| ファイルシステム (命名規約で発見可能) | `hook_<イベント>_<名>.sh` / `skills/*/SKILL.md` / `.docs/` 型別ディレクトリ | hooks 31本すべて命名規約準拠 |
| コマンド (exit code / 構造化出力) | `verify-adr.sh` の exit 0/1/2 意味論 (検証失敗と実行不能を混ぜない)、hook テスト 47 ケース | 「exit code だけ見るテスト禁止 (assert_out = exit + 必須/禁止文字列)」まで明文化 = **記事超え** |
| ログ (構造化・Grep 可能) | **hook-fire-ledger** (`.docs/hook-fire-ledger/2026-07.jsonl`、ts/hook/rule/decision/sensor 付き月次 JSONL) + `credstore-ledger.jsonl` | 今月 658 行。decision 内訳 block 445 / warn 193 / advice 20。sensor 内訳 recurrence 535 / liveness 5 |
| API (ヘルスチェック) | HTTP API 無し。機能等価物2つ: **hook-liveness** (live 発火証跡文書) + **heartbeat** (観測センサー自体の dry-run 自己診断、issue #68) | 「集計ゼロ=平和」と「集計ゼロ=センサー死亡」を SessionStart で機械区別 |
| UI (ダッシュボード) | ハーネス自体に UI 無し。人間向け等価物 = statusline + SessionStart 注入レポート3種 (git-sync-reminder / hook_fire_report 月次閾値 / credstore_orphan_report) | 本セッション冒頭で git-sync-reminder の live 発火を実際に観測 |

settings.json の hook 配線は 10 イベント種・計 50 本 (PreToolUse 15 / PostToolUse 9 / Stop 9 / SessionStart 6 他)。

### 原則「観測できないものは制御できない」— 実痛から学んだ規範化

- ハーネスはこの原則を **07-16 の「配備≠実効」3クラス確定** (sandbox 202本 dead config / HOME 狙い deny 7本不発 / 9 hook 通知の沈黙死) で実地に踏んでいる。対策として liveness 証跡・heartbeat が作られた経緯が fire_report ヘッダに自己記録されている:「旧実装は jq/aggregator 不在を沈黙 skip しており、それ自体が #68 の指摘した無音死の盲点だった」
- note の Before/After (「動くはずです」→ 実測で答える) は rules に規範化済み: critical-thinking「状態変更は成功メッセージを信じず独立確認 (HEAD hash・ファイル存在・件数) で landed を検証」+ probe-before-persist (保存前の外部裏取り)

### 記事に無い上乗せ 3点

1. **二階の観測面**: 記事は「観測面を作れ」まで。ハーネスは「観測面自体が死んだことを観測する」heartbeat を持つ (センサー全段の dry-run 自己診断、死亡報告は定例報告と別 throttle — 共有すると死亡が沈黙する盲窓が生まれるため分離、と設計理由まで明文)
2. **発火数の意味論の規律**: 月次閾値レポートは「rule X が N 回発火 = 上流の自然言語規律が綻んでいるサイン」として改修判断材料を機械供給しつつ、「多発火を昇格シグナルと混同しない」(Goodhart 警戒、原則13) を明文化
3. **観測面の自己汚染防止**: ledger の matched_context (stop word 本文等) を stdout に出さない — 出すとセッションコンテキストに入り Stop hook が誤発火する「観測装置が観測対象を汚す」事故を設計で予防

### 残差 (自覚済み盲点として記録のみ — かいじゅう判断 2026-07-20)

計装カバレッジ突合の実測: hooks 31本中、`ledger_append` 計装済み 20本 / 今月台帳出現 15本。

- 未計装 11本 = センサー/通知系。「計装対象は昇格済みの決定論 rule」という設計意図どおりで gap ではない
- **計装済みだが今月発火ゼロの 5本** (hook_pre_commit_adr_gate / hook_post_fork_disable_lint / hook_pre_hardcode_hygiene_check / hook_stop_plan_externalization_check / hook_session_start_hook_fire_report※) がレア条件ゲート。ゼロ=「発火条件が来ていない (平和)」が妥当だが、**レア条件ゲートの沈黙を平和/死亡で機械区別する装置は無い** (liveness 証跡は issue #124 の 1本のみの個別作成方式)。※fire_report は死亡時のみ append する reporter で常時ゼロが正常
- 実害の緩和要素: 47 テストケースが機能面を、配備検証 (観測レビューシリーズ) が配線面をカバー
- 記事自身が「観測できないチャネルに気づいたら、それは設計上の盲点だ」と言う — 本残差はその「気づき」に該当し、記録すること自体が記事の要求水準を満たす。issue 化・改修は見送り (実害未確定のため)

## 関連ファイル

- `.docs/references/260405_…/text.md` (1630〜1676行) — K-2.3 本文 (照合の基準)
- `~/.claude/.docs/hook-fire-ledger/2026-07.jsonl` — 構造化発火台帳 (実読・集計)
- `~/.claude/.docs/hook-liveness/hook_pre_plan_output_convention.md` — live 発火証跡の実物 (実読)
- `~/.claude/hooks/hook_session_start_hook_fire_report.sh` — 月次閾値レポート + heartbeat (ヘッダ実読)
- `~/.claude/settings.json` — hook 配線 10 イベント種 50本 (機械集計)
- `.docs/logs/shared/2026-07-19_k-2-2-doc-structuring-adoption-check.md` — 前弾 (K-2.2)
