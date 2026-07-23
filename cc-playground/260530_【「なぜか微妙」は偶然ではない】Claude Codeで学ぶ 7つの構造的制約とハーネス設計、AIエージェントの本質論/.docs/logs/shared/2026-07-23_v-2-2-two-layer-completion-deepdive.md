---
date: 2026-07-23 12:37:05
type: study
topic: v-2-2-two-layer-completion-deepdive
session: V-2.2「完了判定を behavior と structure の二層にする」単独深掘り (取り入れフェーズ第12弾 — V章の最終ユニット)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-2.2 = 1906〜1949行、関連: V-2.1 観測可能な完了条件 1894〜1904 / V-2 閉ループ 1864〜1892 / S-1 信頼境界 1951〜)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-23_v-2-1-observable-completion-conditions-deepdive, 2026-07-23_v-2-closed-feedback-loop-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-23_v-2-1-observable-completion-conditions-deepdive.md, .docs/logs/shared/2026-07-23_v-2-closed-feedback-loop-deepdive.md]
---

# V-2.2「behavior と structure の二層完了判定」単独深掘り — 判定: 取り入れ済み (note の具体例3種すべて実装実在) · 記事超え = 強制度の勾配 (配置=block / 行数=warn) と structure 概念のメタ層拡張 / 反例 = structure 側の機械 gate が behavior 側より弱い非対称 Low×4

> 核心の構造事実: note V-2.2 の構造チェック具体例 3 種 — **500行制限 / 循環依存 / 配置準拠** — は `~/.claude` に全て実装として実在する (`hook_post_file_line_limit.sh` LIMIT=500 warn / `assert-no-cycles.sh` DFS 三色 + `validate-knowledge.py` の ticket depends_on DFS / `hook_pre_plans_redirect.sh` block+リダイレクト再指示)。二層 AND は `orchestrating-team-development/SKILL.md` L192-203 に **「検証の二層構成（V-2.2）」と note の節番号を冠した正典節**として明文化 — 「片方のみ pass は**不完了**」を明記し、担い手も agent 分離 (team-tester=behavior / team-reviewer=structure、後者は tools から Edit/Write 除外で構造的 read-only)。記事超えは 2 点: (1) **強制度の勾配** — note は構造チェックを一律「CI や Hook で自動実行」だが、ハーネスは配置 (決定論判断) = block、行数 (凝集度=意味論判断) = warn と、チェックの決定可能性に応じて強制度を変える。(2) **structure 概念のメタ層拡張** — コードの構造 (行数/循環/配置) に加え、**設計原則層** (essence verdict が skill/agent/hook の commit を gate) と**文書グラフ層** (ticket depends_on の循環検出) にまで二層判定を延長。反例狩りの収穫は「structure 側の機械 gate が behavior 側より系統的に弱い」非対称 Low×4 — いずれも自認済み (SKILL 逐語「完全自動化は次段階」) or 意図的 warn 設計。

## 概要

取り入れフェーズ第12弾、V章の最終ユニット。親バッチ (2026-07-20 V章一括) の V-2.2 行は「✅ behavior = hooks テスト47・team-tester VERIFY / structure = hook_post_file_line_limit・hook_pre_plans_redirect・validate-knowledge.py 循環検出・essence review。5-Role 分離が二層を担当エージェントでも分離」と判定済み。本深掘りは (a) note の具体例 3 種の実装実測、(b) 「二層のどちらかが欠ける完了経路」の能動的反例狩り、(c) 記事超え差分、に集中。ハーネス実測 (step3) は read-only Explore へ委譲 (8軸 scan)。

## 内容

### note V-2.2 の定義 (1906〜1949 行)

- 一行サマリー: 「テストが通る」だけでなく「コードが保守しやすい構造か」も完了条件に入れる (1908-1912)
- たとえ: 建築の完了検査 — 機能検査 (水が出る・電気がつく) と構造検査 (耐震基準・配管が図面どおり)。「機能検査だけ通っても、構造検査に落ちる建物は『完成』とは言えない」(1914-1921)
- 見落とされる問題: 責務の肥大化 / テスト容易性の欠如 / パターンの逸脱 (1931-1933)
- 定量根拠: Needle in the Repo (arXiv:2603.27745) — **13.3% のケースで機能テスト合格だが構造チェック不合格**。「7件に1件は『動くが保守できない』」(1935)
- 二層の表 (1941-1943): 動作チェック=「仕様どおり動くか」(npm test exit 0, curl /health → 200) / 構造チェック=「将来も保守できるか」(1ファイル500行以下、循環依存なし、既存ディレクトリ構造に準拠)
- 実装指示 (1945): 「構造チェックは CI や Hook で自動実行する（ファイルサイズ制限、`npx madge --circular` による循環依存検出、新規ファイルの配置チェック等）」
- 正本 (agent-essence.md L123-125): 「behavior oracle（仕様適合）と structural oracle（責務分割・テスト容易性）を分離し、両方を満たして初めて完了とする」

### ハーネス実体の対応表 (Explore scan 実測)

| note の具体例 | ~/.claude の実体 | scan 実測 (逐語トレース) |
|---|---|---|
| 1ファイル500行以下 | `hooks/hook_post_file_line_limit.sh` (56行) | PostToolUse Edit\|Write\|MultiEdit。L38 `LIMIT=500`。**warn 型** — L7「block ではなく warn (exit 2 で助言) = 運用負荷ゼロ、分割するか否かは人/Claude が凝集度で判断」。対象はコード拡張子 allowlist (ts/js/py/sh 等 28 種、md/json/yaml は対象外) |
| 循環依存なし (madge) | `enforcing-strict-tdd-cycle/scripts/assert-no-cycles.sh` (207行) | L3「循環依存検出 oracle (P2, structure 側)」L4-9「behavior oracle (テストが通るか) と対になり…LLM の『循環ありません』を信用せず、ソースの実テキストから import グラフを構築して物理検出」。DFS 三色 (L156)、exit 0/1/2。**madge は任意補完で authoritative でない** (L66-77) |
| 循環依存 (文書グラフ版) | `establishing-knowledge-persistence/scripts/validate-knowledge.py` | L43「tickets: 循環依存の検出（depends_on グラフの DFS）」`detect_dependency_cycles` L359-401、検出時 L784-789 で NG 出力 + error 加算 |
| 既存ディレクトリ構造に準拠 | `hooks/hook_pre_plans_redirect.sh` (69行) | PreToolUse Write\|Edit\|MultiEdit。**block 型** — `~/.claude/plans/*.md` への書込を exit 2 で reject し「代替パス: $PROJECT_ROOT/.docs/plans/$BASENAME」を再指示 (L49-52, L59-67)。archived/ は除外 |
| 二層の AND (正典) | `orchestrating-team-development/SKILL.md` | L192-203 節名「**検証の二層構成（V-2.2）**」。L194「以下の二層を両方通過して初めて『検証合格』と判定する」、L203「**片方のみ pass は不完了**。レビュー層（Step 6）に丸投げしない」。L313 表「構造 oracle 不合格（V-2.2）→ 実装者に差し戻し（behavior pass でも構造退行は不完了）」 |
| 二層の担い手分離 | `agents/team-tester.md` / `agents/team-reviewer.md` | tester = RED/VERIFY 専任・実装コードを読まない (L50)。reviewer = 責務分離/命名/カバレッジ等の structure 観点 (L27-34)・「コードを書かない（tools: から Edit/Write を除外済み。構造的に不可能）」(L38) |
| structure 層の commit gate | `hooks/hook_pre_commit_essence_gate.sh` (809行) | skill/agent/hook 改修 commit に self-eval verdict (Critical=0 ∧ High=0) を要求 (L677-693)、self-eval 不在 (L625-639)・陳腐化 (L783-806)・hook テスト赤 (L293-311)・essence-sync ドリフト (L317-397) で deny。適用パスは `essence_gate_paths.json` の skills/agents/hooks 限定 |

### 個別照合 (実測確証)

**(1) note の具体例 3 種すべて実装実在 — 取り入れ済み.** 500行 (hook, LIMIT=500) / 循環依存 (コード + 文書グラフの 2 実装) / 配置チェック (plans redirect, block+再指示)。note の 1945 行「ファイルサイズ制限、madge による循環依存検出、新規ファイルの配置チェック」の 3 例に 1:1 で対応物がある。

**(2) 二層 AND の明文化 — 取り入れ済み (note の節番号を自覚的に採用).** orchestrating-team-development が「検証の二層構成（V-2.2）」と note 由来の節番号を冠して正典化。behavior oracle (test pass ∧ lint clean ∧ branch-validator Missing=0) と structure oracle (500行 / 関数50行 / 循環依存 / 重複) を定義し、「片方のみ pass は不完了」。behavior oracle は Step 5.5 で機械判定 (L214「いずれかが fail なら Step 6 に進まず差し戻し」)。

**(3) 担い手の二層分離 — 取り入れ済み (記事に無い層).** 5-Role Separation が二層を検査項目でなく **agent の責務**として分離: team-tester (behavior、実装を読まない) / team-reviewer (structure 観点、Edit/Write 非所持で構造的 read-only)。二層の独立性を「別々のチェックリスト」でなく「別々のコンテキスト+権限」で担保。

### 記事超え点 (V-2.2 固有)

1. **強制度の勾配 — 決定論/意味論境界を構造チェック内部に適用**: note は構造チェックを一律「CI や Hook で自動実行」と説く。ハーネスは**チェックの決定可能性で強制度を変える**: 配置準拠 (パスの正誤 = 決定論) は block+リダイレクト再指示、行数 (分割すべきかは凝集度 = 意味論判断) は warn — hook 自身が L50 で「軸: 分割は凝集度(単一責務)で判断。行数は合図であって上限ではない」と設計理由を注入する。V-2 で見た「強制 vs 助言」の勾配を structure 層内部でも実装。
2. **structure 概念のメタ層拡張**: note の structure はコードのメトリクス (行数/循環/配置)。ハーネスは (a) **設計原則層** — essence verdict (Critical/High=0) を skill/agent/hook の commit 条件にする = 「ハーネス自身の保守可能性」を structure チェック化、(b) **文書グラフ層** — ticket depends_on の循環検出 = 知識ベースの構造健全性、へ二層判定を延長。
3. **madge 非依存の自前 DFS**: note は `npx madge --circular` を名指すが、assert-no-cycles.sh は**無依存の自前 DFS が authoritative で madge は任意補完** (L66-77)。npm 依存なしで動く物理検出 = 検証手段自体の可搬性を上げた実装判断。
4. **定量根拠の逆写像**: note の「13.3% が機能合格・構造不合格」に対し、ハーネスは behavior pass 後に structure oracle で差し戻す明文ルール (L313) を持つ — 「7件に1件」の漏れを workflow の差し戻し分岐として設計に織り込み済み。

### 反例狩り (二層のどちらかが欠ける完了経路 — scan §7 の 6 候補を裁定)

**by-design / 記録済みトレードオフ (gap でない)**:
- **500行 warn は意図的** (上記記事超え① — 凝集度は意味論判断ゆえ block しない設計宣言が hook 内に逐語である)
- **一般プロジェクトのコード commit が essence_gate の適用外** (apply_paths = skills/agents/hooks 限定): essence_gate は「ハーネス自身の改修」を守る gate であり、アプリコードの二層は workflow 層 (orchestrating の Step 5.5 + structure oracle) が担う役割分担。hook を全 commit に広げると essence verdict を無関係な commit に要求する誤射になる

**真の残差 (structure 側の機械 gate が behavior 側より弱い非対称 — いずれも Low)**:
- **[Low] structure oracle の機械エントリポイント不在**: behavior 側には `run-behavior-oracle.sh` (exit 0/1/2 の機械判定) が在るが、対になる `run-structure-oracle.sh` 相当は**不在** (grep 実測)。structure oracle の実行は orchestrator の運用依存。ただし SKILL 自身が L203 で「構造 oracle が機械的に検証できない項目は…手動で確認する運用で補う（**完全自動化は次段階**）」と自認済み = 記録されたロードマップ
- **[Low] assert-no-cycles.sh がどの commit hook にも未配線**: 循環依存検出は workflow 手順として列挙されるのみで、commit 時の自動強制なし。同上の「次段階」に含まれる
- **[Low] coverage 検証が任意**: enforcing-strict-tdd-cycle L149「coverage validation は coder サイクル完了後の**任意計測**」— behavior (GREEN) だけで TDD サイクルが完了扱いになりうる。閾値・実行手段 (assert-coverage.sh) は実在し、任意性は記録済み
- **[Low] essence_gate の逆非対称**: skill/agent/hook 改修 commit に structure 層 (verdict) は要求するが behavior 層 (テスト pass) の要求は部分的 — hook-test gate (c) は「変更 hook のテストが**赤なら** block」で、テスト**不在**は warn に留める (L289「検証テスト未カバーの hook を commit (検証なしで通過)」を stderr 可視化)。死角を silent にしない設計は在るが、強制はしない
- **[観測] ハーネス自身の 500行超が 6 本**: allowlist 対象拡張子で 500行超 = 6 本 (最長 = essence_gate 本体 809行、validate-knowledge.py 804行 ほか test 3本 + churn_normalize 546行)。「合図であって上限ではない」設計ゆえ違反ではないが、**構造チェックの実装自身に分割検討の合図が最も強く鳴っている**緊張として記録 (warn hook は Write/Edit 時のみ発火で遡及スキャンなし — 既存超過は鳴らない)

### 残差 / 改善候補

- **[Low] structure oracle の機械化非対称** (上記 4 件の総括): behavior = 機械 gate (Step 5.5 / run-behavior-oracle) が閉じるが、structure = warn + 運用依存 + commit 未配線。「完全自動化は次段階」と正典に自認済みゆえ、gap でなく記録されたロードマップ。昇格の引き金は「構造退行が behavior pass のまま merge された実事故」の発生 (V-1.1 再発待ち規律)
- **[観測] 500行超 6 本**: 意味論判断 (凝集度) に委ねられた合図ゆえ改修不要。ただし essence_gate 809行は block 分岐 12 種 (ledger ラベル実測) を単一ファイルに抱える — 将来 essence_gate を触る際に分割を検討する材料として記録
- 意味論注記: 「どこまでを structure チェックとして機械強制するか」の線引き自体が意味論判断 (凝集度・重複・責務分割は決定論 detector を書きにくい)。行数=warn / 配置=block の勾配はこの境界の正しい実装で、V-1.2 / V-2 / V-2.1 と同じ決定論/意味論境界に帰着する

判定: 取り入れ済み — note の具体例 3 種 (500行/循環依存/配置) すべてに実装が実在し、二層 AND は「検証の二層構成（V-2.2）」の名で正典化、「片方のみ pass は不完了」と担い手分離 (tester/reviewer) まで揃う。記事超えは強制度の勾配・structure 概念のメタ層拡張・madge 非依存 DFS・差し戻し分岐の設計織込み。残差は「structure 側の機械 gate が behavior 側より弱い」非対称 Low×4 + 観測 1 で、いずれも自認済みロードマップ or 意図的 warn 設計。**これで V章 (V-1〜V-2.2) 全 7 ユニットの深掘りが完了**。

## 独立検証 (step6) の記録

fresh な read-only reviewer (code-reviewer) が全 load-bearing 主張を実ファイルと1件ずつ照合。**捏造・誇張・トレース不能はゼロ** — 監査が最も警戒すべき計数主張「500行超6本」(awk NR>500 で実測再現し内訳まで完全一致)・「809/804行」・「run-structure-oracle.sh 不在」(find/grep) はすべて独立再現された。verdict は **(b) 要修正 (Low のみ)** — 引用精度5件を検出し、各修正を裏取りして反映済み:

1. **[Low] 行番号ズレ4件**: 凝集度の軸 L52→**L50** (2箇所) / 二層引用 L193→**L194** / assert-no-cycles structure 宣言 L2→**L3** (2箇所) → 全訂正
2. **[Low] 対応表の行数 +1×3本**: 57/70/208 → **56/69/207** (Read 表示行の転記による測定不統一 — 大きい2本 [809/804] は正確で小さい3本のみ +1。検証者の助言どおり行数は wc -l / awk NR を正本にすべき) → 全訂正
3. **[Low] block 分岐数 11→**12** (ledger ラベル実測: committer-args-unparseable / hook-test-red / essence-sync-drift / essence-sync-unverifiable / launch-form-drift / predicate-missing / commit-tree-ambiguous / record-name-violation / self-eval-missing / verdict-unparseable / verdict-unqualified / self-eval-stale) → 訂正

**収束の扱い**: 5件はすべて引用精度レベル (判定「取り入れ済み」の骨格・全計数主張は実体で完全支持)。citation-only 修正への2周目独立検証はコスト不均衡ゆえ見送り、意味論の最終 backstop は step 8 の人間 content-review に委ねる。

## 関連ファイル

- `~/.claude/hooks/hook_post_file_line_limit.sh` — 500行 warn (L38 LIMIT / L7 warn 設計宣言 / L50 凝集度の軸)
- `~/.claude/hooks/hook_pre_plans_redirect.sh` — 配置 block+リダイレクト (L59-67 reject メッセージ)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/assert-no-cycles.sh` — コード循環依存 DFS (L3-9 structure 側宣言 / L66-77 madge 任意)
- `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` — 文書グラフ循環 (L359-401 detect_dependency_cycles)
- `~/.claude/skills/orchestrating-team-development/SKILL.md` — 二層の正典節 (L192-203「検証の二層構成（V-2.2）」/ L313 差し戻し表)
- `~/.claude/agents/team-tester.md` / `team-reviewer.md` — 二層の担い手分離 (reviewer は Edit/Write 非所持)
- `~/.claude/hooks/hook_pre_commit_essence_gate.sh` — structure 層 commit gate (block 条件 a-e) + `hooks/rules/essence_gate_paths.json` (適用パス)
- `~/.claude/skills/three-elements-harness/scripts/run-behavior-oracle.sh` — behavior 側の機械エントリポイント (structure 側対応物は不在 = 残差)
- `.docs/references/260405_…/text.md` (1906〜1949行) — V-2.2 照合基準
- `.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md` — 親バッチ (V-2.2 の ✅ 1行判定)
