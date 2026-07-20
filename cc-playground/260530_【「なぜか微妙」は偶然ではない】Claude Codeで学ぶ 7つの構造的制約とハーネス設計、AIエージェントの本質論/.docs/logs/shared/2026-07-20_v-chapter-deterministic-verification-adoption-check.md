---
date: 2026-07-20 10:13:45
type: study
topic: v-chapter-deterministic-verification-adoption-check
session: V章「検証と矯正」取り入れ確認 (取り入れフェーズ第4弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V章 = 1695〜1950行)
related_skill: [logging]
related_log_ids: [2026-07-20_k-2-4-config-externalization-adoption-check, 2026-07-20_k-2-3-observability-adoption-check]
related_log: [.docs/logs/shared/2026-07-20_k-2-4-config-externalization-adoption-check.md, .docs/logs/shared/2026-07-20_k-2-3-observability-adoption-check.md]
---

# V章「検証と矯正 — 確率を決定論で上書きする」取り入れ確認 — 判定: 取り入れ済み・改修見送り (7ユニット全照合)

> note V章 (V-1 決定論ファースト / V-1.1 昇格ラダー / V-1.2 フィードバック速度 / V-1.3 入口で絞る / V-2 閉ループ / V-2.1 観測可能な完了条件 / V-2.2 二層チェック) を `~/.claude` 実態と照合。**7ユニットすべて取り入れ済み**、うち4点は記事超え (①PreToolUse=「ツール直後」より速い「行為の前」の検査 ②再発検知の機械化=「2回起きたら」を台帳がカウント ③昇格の反Goodhart規律 ④意味論判断の No/Yes 境界の明文化)。CI 層の不在は記録済みの構造的判断であり gap ではない。

## 概要

取り入れフェーズ第4弾。かいじゅう指定で V章 (章単位、7ユニット) を一括照合。照合材料の大半は K-2.3/K-2.4 調査の実測を再利用し、新規 probe は 3 点 (ENABLE_TOOL_SEARCH / skills-disabled 本数 / recurrence センサー行数) のみ。

## 内容

### ユニット別照合結果 (全実測)

| note ユニット | 推奨の核心 | `~/.claude` での実装 | 判定 |
|---|---|---|---|
| **V-1 決定論ファースト** | 機械判定できるものは LLM に任せない。基準 =「入力と正解の間に確定的写像があるか」 | essence **原則5「決定論的制御の優位性」が正本** (ADR-0002 が引用)。決定論ツール群 = hooks 31本 / verify-adr.sh / validate-knowledge.py / check-essence-sync.sh / deny 177本。**No/Yes 境界の明文化**: probe-before-persist rule が「内容の真偽は機械判定しない (意味論判断ゆえ)」と宣言 — note の分類表の境界そのもの | ✅ 記事超え (境界の明文化) |
| **V-1.1 失敗の昇格ラダー** | L0口頭→L1注意書き→L2スクリプト→L3 Hook/CI。同じ失敗が2回で昇格 | ラダー実在: L1=rules 11本+SKILL Gotchas / L2=verify-adr.sh 手動 backstop / L3=hook 31本+deny 177。**昇格の実歴史**: ADR検証は L2(手動script)→L3(commit gate #146) へ昇格、その判断自体が ADR-0002。**「2回起きたら」の機械化**: 台帳 sensor=recurrence 535行 (再発検知の機械化 PR #67)。昇格候補は accumulating-reviewer-feedback が HITL 提案 (段階2.5、**自動昇格なし**)。fire_report が「発火数を昇格シグナルと混同しない (原則13 Goodhart)」と明文 | ✅ 記事超え (再発の機械カウント + 反Goodhart) |
| **V-1.2 フィードバック速度** | 同じ検査は最速の場所へ (ツール直後→プリコミット→CI→人間) | 速度階層実在: **PreToolUse 15本 (行為の前 = note の最速「ツール直後」よりさらに前段)** → PostToolUse 9本 (直後) → pre-commit gates (adr/essence) → Stop 9本 (セッション末) → HITL (PR レビュー)。軽量検査 (emoji/行数) は直後、重い検証 (ADR) は commit 時 — 「軽量を手前に」準拠。**CI 層は不在 = 記録済み判断** (.docs/README:「CI 無し」、pre-commit gate + テスト47で補償) | ✅ (CI 不在は構造的判断) |
| **V-1.3 入口で絞る** | 使えないツールは呼んでから拒否でなく最初から見せない。Plan Mode が実装例 | 3 実装: ① **subagent の tools 付与** (team-ui-designer/debater-pm は Bash 非付与 等 — メニューから消す) ② **skills-disabled/ 28本** (managing-skills で skill をメニュー外へ移動) ③ **ENABLE_TOOL_SEARCH=true** (deferred tools — 必要なツールの schema だけ load)。Plan Mode + hook_pre_plan_output_convention も稼働。deny 177 は note の言う通り「最終防衛線」の位置づけ | ✅ 3経路で実装 |
| **V-2 閉ループ** | 生成→検証→判定→エラー注入→修正→再検証。3要素 = 数値化合格基準 / 構造化フィードバック / 最大ループ回数 (3-5回、超過で人間へ) | 3要素すべて実在: 合格基準 = exit 0/1/2・GREEN 判定・self-eval verdict (GO/CONDITIONAL/NO-GO + C/H/M/L 件数) / 構造化フィードバック = hook deny メッセージ・verify-adr の失敗理由が context へ注入 / **最大ループ = coder agent「implement→verify 最大3回」** (note の 3-5 回に一致)、超過で HITL。実演: 本セッションでも probe hook →誤記検出→訂正→再検証のループが 2 回閉じた | ✅ |
| **V-2.1 観測可能な完了条件** | 完了は観測可能な挙動 (exit 0 AND 200) で定義。AND 結合 | critical-thinking rule「状態変更は独立確認 (HEAD hash・ファイル存在・件数) で landed を検証してから完了報告」= AND 結合の実測完了条件。handoff frontmatter status / verify skill (E2E駆動)。K-2.3 で確認済みの観測面が前提装置 | ✅ |
| **V-2.2 二層チェック (behavior+structure)** | テスト通過 (動く) + 保守可能性 (500行制限・循環依存・配置準拠) の両方で完了 | behavior = hooks テスト47・team-tester VERIFY・verify skill / structure = **hook_post_file_line_limit (行数制限 — note の例そのもの)**・**hook_pre_plans_redirect (新規ファイル配置チェック — 同)**・validate-knowledge.py の循環依存検出 (文書グラフ)・essence review (原則照合)。5-Role 分離が二層を担当エージェントでも分離 (tester=behavior / reviewer=structure) | ✅ |

### 記事超え 4点 (要約)

1. **「ツール直後」より速い層**: note の最速はツール実行直後だが、PreToolUse hook は**行為が起きる前**に block する — 修正コスト 0 の層を持つ
2. **「2回起きたら」の機械化**: note は再発カウントを人間の記憶に頼るが、ハーネスは台帳の recurrence センサー (535行) が再発を機械検出する
3. **昇格の反 Goodhart 規律**: 発火数↑を昇格シグナルと混同しない明文 — 昇格ラダーが指標ハックに堕ちるのを防ぐ
4. **No/Yes 境界の明文化**: 「意味論判断は機械化しない」を rule に明記 — note の分類表 (LLMに任せるべきか) の境界宣言を運用に埋め込み済み

### 残差

- CI 層の不在 (V-1.2): `~/.claude` は CI を持たない — .docs/README に記録済みの構造的判断 (素の validator が全停止するため配線不能、補償 = pre-commit gate + テスト 47 + 手動 backstop)。プロダクト PJ では CI は別途持てるため、ハーネス自体の gap とは判定しない
- コードの循環依存検出 (madge 相当) はハーネス自体に非該当 (bash スクリプト群ゆえ)。文書参照グラフの循環検出は validator が実装済み (#150)
- **判定: 取り入れ済み・改修見送り**

### 付記: 直前 Q&A「diff 一発・移植」の実測 (K-2.4 補強)

- 方針ファイルの変更履歴: hook_stop_words_rules.json **11回** / hook_pre_commands_rules.json 9回 / essence_gate_paths.json 2回 / settings.json **46回** — 方針だけが繰り返し改訂され、diff は方針行のみを映す (直近 diff 実物で確認: 禁止語 3 行削除 + オプション 1 行追加、sh は無傷)
- 移植は条件付き Yes: 方針ファイル (SKILL.md/rules/JSON) はコピーで移植可能・establishing 系 skill が scaffold 装置を持つ。ただし認証は継承されない (#156 複製方式撤回)・絶対パス依存の適応が要る — 「diff 一発」は完全成立、「移植」は方針層に限り成立

## 関連ファイル

- `.docs/references/260405_…/text.md` (1695〜1950行) — V章本文 (照合の基準)
- `~/.claude/.docs/hook-fire-ledger/2026-07.jsonl` — recurrence センサー 535行 (grep 実測)
- `~/.claude/skills-disabled/` — 28本 (ls 実測、入口絞りの実物)
- `~/.claude/settings.json` — ENABLE_TOOL_SEARCH=true (grep 実測)
- `.docs/logs/shared/2026-07-20_k-2-4-config-externalization-adoption-check.md` — 前弾 (実測データ再利用元)
