---
date: 2026-07-23 03:01:02
type: study
topic: v-2-1-observable-completion-conditions-deepdive
session: V-2.1「観測可能な完了条件」単独深掘り (取り入れフェーズ第11弾 — V-2 第9弾の直後)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-2.1 = 1894〜1904行、関連: V-2 閉ループ 1864〜1892 / V-2.2 二層チェック 1906〜1943 / C-4 自己申告≠完了)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-23_v-2-closed-feedback-loop-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-23_v-2-closed-feedback-loop-deepdive.md]
---

# V-2.1「観測可能な完了条件」単独深掘り — 判定: 取り入れ済み (exit-code oracle 体系で確証) · 記事超え = exit 2「検証できなかった」の第三状態 / 反例 = 完了を書込で定義する Low×3

> 核心の構造事実: note V-2.1「完了を『ファイル修正』でなく観測可能な挙動 (exit 0 / curl 200 / test pass) で定義し AND 結合する」は、ハーネスで **exit-code を物理的完了条件に使う 6 実装** (verify-adr / assert-coverage / assert-tests-unchanged / assert-loop-budget / assert-no-cycles / coder.md 配線) + **AND 結合の完了条件 4 箇所** + **自己申告→観測に置換する 6 実装** として深く実装済み。記事を超える発明が 1 点: note は exit code を pass/fail の二値で使うが、ハーネスは **exit 2 =「検証できなかった」を「合格」に化けさせないための第三状態** を全 oracle に持つ (verify-adr.sh L7「検証できなかったを合格に化けさせない」)。反例狩り (scan §7) の収穫は Low×3: [Low] handoff が完了を「ファイル書込」で定義し書込後の YAML パース健全性を assert しない / [Low] essence-gate の verdict 源 (critical_count) が Lead 自己申告で原則11 の非対称性を残す (validate-verdict-consistency.sh で機械補償済) / [Low] review 系 skill が soft-K 発火を事後の機械検証で区別できないと自認。いずれも観測可能でない完了だが、mitigated or self-admitted。

## 概要

取り入れフェーズ第11弾。親バッチ (2026-07-20 V章一括) の V-2.1 行は「✅ critical-thinking rule の状態変更独立確認 = AND 結合の実測完了条件 / handoff status / verify skill (E2E駆動) / K-2.3 の観測面が前提装置」と判定済み。本深掘りは skill step 2 規律 (既存 ✅ の再確認でなく差分・反例) に従い、(a) exit-code 完了条件の実測確証、(b) 「観測可能でない完了 (self-report で closed)」の能動的反例狩り、(c) 記事超え差分、に集中する。ハーネス実測 (step3) は read-only Explore へ委譲。

**親バッチ照合での差分1点**: バッチは前提装置に「verify skill (E2E駆動)」を挙げたが、scan 実測で `~/.claude/skills/verify/` ディレクトリは**不在**。E2E 駆動 verify の実体は `verify-test-fork` (Playwright 実行) + built-in `/verify` skill (roster 記載、`~/.claude/skills/` 外)。バッチ記述の軽微な精密化。

## 内容

### note V-2.1 の定義 (1894〜1904 行)

- 一行サマリー: 「ファイルを修正した」ではなく「curl で200が返る」「テストが pass する」で完了を定義 (1896)
- 「ファイルを修正しました」は完了の証拠にならない。「API が200を返す」は証拠になる (1902)
- exit code は物理的事実であり偽造できない (1904)
- 複数を AND 結合: `npm run build` exit 0 AND `npm test` exit 0 AND `curl /health` → 200 (1904)
- C-4「LLM の『完了しました』は信頼できない」の具体化 (1898)
- 正本 (agent-essence.md L120-121): 「完了はコード差分ではなく観測可能な挙動で定義する。Web: accessibility tree / DOM snapshot、CLI: stdout / exit code、API: HTTP response / schema、Infra: logs / metrics / traces」

### ハーネス実体の対応表 (Explore scan 実測)

| note 要素 | ~/.claude の実体 | scan 実測 (逐語トレース) |
|---|---|---|
| exit code = 物理的完了条件 | oracle 群 6 実装 | `verify-adr.sh` L57-59 (exit 0/1/2) / `assert-coverage.sh` L24 / `assert-tests-unchanged.sh` L25 / `assert-loop-budget.sh` L21 / `assert-no-cycles.sh` L22-24 / `coder.md` L193,199,271 が exit code で判定 |
| 複数条件の AND 結合 | 4 箇所 | orchestrating-team-dev L189,210-216 (behavior∧structure 二層 + review AND直列) / coder L190-203 (GREEN∧改ざん無∧coverage) / verify-test-fork L90-102 (Unit∧E2E∧integrity) / designing-frontends L133 (V-2.1 gate: 色ヒストグラム距離∧閾値) |
| 「ファイル修正」は証拠でない = 自己申告を観測に置換 | 6 実装 | `assert-tests-unchanged.sh` L82 (git hash-object 物理指紋) / `record-loop-iteration.sh` L5-8 (in-memory カウンタを物理ファイル化) / `assert-loop-budget.sh` (物理記録照合) / `assert-coverage.sh` L5-9 (runner 出力のみ、LLM 文章を受けない) / `validate-knowledge.py` L636 (updated を git log と照合) / verify-test-fork L83 (親 coder の独立再実行) |
| 状態変更の独立確認 | rule | `rules/critical-thinking-checklist.md` L12「状態変更 (commit/push/PR/write) は成功メッセージを信じず独立確認 (HEAD hash 変化・ファイル存在・件数) で landed を検証」 |
| hook 層の観測可能 gate | 3 hook | `hook_pre_commit_adr_gate.sh` L28-30 (verify-adr exit で approve/deny) / `hook_pre_commit_essence_gate.sh` L257 (変更 hook の検証テストが赤なら deny) / `hook_post_lint.sh` L54-71 (tsc --noEmit / eslint exit で閉ループ) |

### 個別照合 (実測確証)

**(1) 完了を観測可能な挙動で定義 — 取り入れ済み.** oracle 群が exit code (物理量) を完了判定に使う。判定根拠は「exit code (機械判定) のみ。エージェントの『成功しました』報告は証拠にしない」(orchestrating-team-dev L216 逐語)。設計原則は verify-adr.sh L7「検証できなかったを合格に化けさせない」= note の「ファイル修正は証拠でない」を fail-closed 側から実装。

**(2) AND 結合 — 取り入れ済み.** note の「build exit 0 AND test exit 0 AND curl 200」に対応する AND 結合が 4 箇所。特に orchestrating-team-dev は behavior oracle (テスト全 PASS ∧ lint exit 0 ∧ branch-validator Missing=0) と structure oracle を両方通過して初めて合格 (L210-214)、さらに team-reviewer ∧ gep-review の AND 直列ゲート (L257)。

**(3) C-4 自己申告の観測置換 — 取り入れ済み (記事の一段深く).** 6 実装のうち 4 本 (assert-tests-unchanged / assert-coverage / assert-loop-budget / record-loop-iteration) が C-4 を逐語で引用、残り 2 本 (validate-knowledge.py は英語 + 別表現、verify-test-fork は C-4 ラベル + 近縁句) は C-4 ラベル参照。`assert-tests-unchanged.sh` L4-7「自己申告は完了の証拠にならない…git hash 照合で物理検出」/ `record-loop-iteration.sh` L5-8「in-memory カウンタ (自己申告構造) を物理ファイルに append し第三者が照合」/ verify-test-fork L83「真の gate は親 coder の独立再実行、孫の自己申告だけに完了を委ねない」= 実行者と判定者の分離。

### 記事超え点 (V-2.1 固有)

1. **exit 2 =「検証できなかった」の第三状態の発明**: note は exit code を pass/fail の二値で使う。ハーネスの全 oracle は **exit 2 (実行不能 / config error)** を持ち、「検証しなかった」を「合格 (exit 0)」に化けさせない (verify-adr.sh L7 の設計原則 + L254-271 の解釈境界で「渡した件数」≠「検証された件数」を exit 2 で分離 / assert-coverage.sh L25 「fail-closed: 誤って 0% や合格にしない」)。観測可能な完了条件が満たすべき「偽の観測 (走らなかった検査が緑を返す)」への防御 = note に無い精密化。
2. **自己申告構造の物理外部化**: note は「観測可能条件を使え」まで。ハーネスは in-memory 自己申告 (coder の ADJUST_LOOP カウンタ) を `record-loop-iteration.sh` で物理ファイルへ外部化し、`assert-loop-budget.sh` が git 外の物理記録から照合 = 自己申告の構造そのものを分解。
3. **実行者と判定者の分離**: verify-test-fork の孫の Observability は self-report (可視化) に留め、真の gate は親 coder の独立 --baseline 再実行 (L83)。観測可能条件を「誰が観測するか」まで設計。
4. **V-2.1 を意味論的品質へ適用**: designing-beautiful-frontends は「distinctive」(主観的品質) を **色ヒストグラム距離という観測可能な数値**に置換し「V-2.1 observable completion gate」と明示ラベル (SKILL.md L133-137 / compare-design-variants.py L181-185)。note のコード例 (exit/curl) を超え、デザイン品質にまで観測可能完了を適用。
5. **本セッションの自己実証**: 本監査自体が critical-thinking-checklist L12 を実践 — commit landed を HEAD hash で検証し、f110dd6 の git 異常を成功メッセージでなく `git merge-base --is-ancestor` の機械判定で解決した (V-2 第9弾 step8 の実例)。

### 反例狩り (観測可能でない完了 — scan §7 をストレステスト)

note のアンチパターンは「ファイル修正しました = 完了」。scan §7 の「self-report で closed にしている箇所」を裁く:

**gap ではない (mitigated / by-design)**:
- fork 系 skill の `Observability (self-report:)` ブロック (verify-test-fork L113 ほか red/implement-fork 等 5 ファイル): tool_uses_count / file_writes_count 等は孫の自己申告だが、**真の gate は親の独立再実行** (L83 明記) で self-report は可視化用。実行者/判定者分離で mitigated
- review-harness / review-agent-essence のルーブリック列挙 (L105「完了判定が全て LLM の自己申告…外部検証なし」を ❌ 判定として列挙): これは診断側が反例型を**知っている**証拠で gap でない

**真の残差 (観測可能でない完了 — いずれも Low)**:
- **[Low] handoff の完了 = ファイル書込**: `handoff/SKILL.md` L87「書き出し内容のサマリーを表示し『ハンドオフ完了』と報告」。完了トリガは handoff-state.md への Write 実行そのもので、書込後の **YAML パース健全性の assert が無い** (Gotcha L91 は「pickup/Stop hook が yq/awk で機械パース、形式逸脱で機能停止」と警告するのに、書込直後にパース可能かを検査しない)。note の「ファイル修正は証拠でない」の影が残る。ただし L16 で git status/未push を観測、かつ「状態を書く」タスクの成果物はファイル自体ゆえ Low
- **[Low] essence-gate の verdict 源が Lead 自己申告**: `essence-reviewing-orchestrator/references/step-6.md` L97「critical_count/high_count は essence-gate が verdict 源に採用する数値だが Lead 自己申告ゆえ結論の散文 verdict とズレうる (原則11 = Lead 自身の Observability に決定論計測が無い非対称性)」。commit gate が self-report を源にする非対称。ただし `validate-verdict-consistency.sh` (L93-96 で critical/high count 突合、L120 で MISMATCH 出力) が機械突合して補償
- **[Low] soft-K 発火の事後検証不能**: `review-agent-essence` L174 / `review-harness` L251 が「soft-K『真に余地なし』分岐は内的正当化に留まりレポートに痕跡が残らず、走らせたかを事後の機械検証で区別できない」と**自認**。観測可能でない完了判定の自認された死角

### 残差 / 改善候補

- **[Low] handoff の書込後健全性 assert 欠落**: 書込直後に `yq`/`awk` でパース可能かを assert すれば「ファイル書込」から「有効な handoff」へ観測可能性が上がる。ただし壊れた handoff は次 pickup が検出するため実害は次セッション頭に顕在化 = 遅延はするが検出はされる。昇格は「壊れた handoff の再発実績」が出た時 (V-1.1 再発待ち規律)
- **[Low] essence-gate verdict 源の自己申告性**: 原則11 の非対称性として記録済み。validate-verdict-consistency.sh が補償するが、源自体を決定論計測に置き換えるのは Lead の Observability 計測機構が要り大きい。トレードオフとして据え置き
- **[Low] soft-K 事後検証不能**: review skill が self-eval フェーズを持たない構造由来。自認済みの死角、gap でなく記録
- 意味論注記: 「何を観測可能条件にできるか」は対象の性質による (デザインの distinctive すら色ヒストグラム距離で観測化した一方、soft-K の内的正当化のような意味論判断は観測化しにくい)。V-2.1 の限界は V-1.2/V-2 と同じ意味論/決定論境界

判定: 取り入れ済み — exit-code oracle 6実装 + AND 結合 4箇所 + 自己申告→観測置換 6実装で V-2.1 は深く実装され、判定根拠を「exit code のみ、成功しました報告は証拠にしない」と明文化。記事超えは exit 2 (検証できなかったの第三状態) と自己申告の物理外部化と V-2.1 のデザイン品質への適用。残差は observable でない完了の Low×3 で、いずれも mitigated (独立再実行 / 機械突合) or self-admitted。

## 独立検証 (step6) の記録

fresh な read-only reviewer (code-reviewer) が全 load-bearing 主張を実ファイルと1件ずつ照合。**捏造・存在しない主張はゼロ** (引用内容は全て実体に存在)。ただし verdict は **(b) 要修正** ── 行番号引用の誤りと量化子の過大を5件検出。各修正を直接 Read で裏取りして反映済み:

1. **[Medium] verify-adr の「記事超え①」逐語の行番号誤り**: 設計原則「検証できなかったを合格に化けさせない」を L28 と記載したが実際は **L7** (L28 は区切りコメント行)。ログ内 4 箇所で反復していた誤り → 全て L7 へ訂正。おそらく `hook_pre_commit_adr_gate.sh` L28 (同原則を継承) との取り違え。**内容 (設計原則の実在) は真、行番号のみ誤り**
2. **[Low-Medium] 「6実装すべて C-4 逐語」の過大**: 実際は **4/6 が逐語** (assert-tests-unchanged / assert-coverage / assert-loop-budget / record-loop-iteration)、残り 2 は C-4 ラベル参照 (validate-knowledge.py 英語+別表現 / verify-test-fork ラベル+近縁句) → 訂正
3. **[Low] validate-verdict-consistency の行番号**: count 突合は L93-96/L120 (L166 は duration 突合) → 訂正
4. **[Low] assert-coverage の行ズレ**: 「fail-closed…」逐語は L25 (L26-28 はそれが導入するリスト) → 訂正
5. **[Low] 計数の census 表示**: 「exit-code oracle 6実装」は 5 スクリプト + coder.md (agent 配線) の混在、「AND 結合 4箇所」は代表列挙 (orchestrating の review AND直列を item1 に畳込・essence-gate 二層を別箇所化せず) で、他にも AND 結合は存在する。**列挙インスタンスは全て実在**するが確定計数でなく**代表列挙**と読むべき (虚偽ではない、網羅性の僅かな過大表示)

**収束の扱い**: 5件はすべて citation/計数レベル (捏造・矛盾ゼロ、判定「取り入れ済み」の骨格は実体で支持) で、各修正を直接 Read で裏取りして適用済み。citation-only 修正に対する2周目の独立 subagent 起動はコスト不均衡ゆえ見送り、意味論の最終 backstop は step 8 の人間 content-review に委ねる。

## 関連ファイル

- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` — exit-code oracle 群の集約 (assert-coverage/tests-unchanged/loop-budget/no-cycles + record-loop-iteration)。README「C-4 対策。完了判定を AI の自己申告でなく」
- `~/.claude/skills/establishing-knowledge-persistence/scripts/verify-adr.sh` — exit 0/1/2 の三状態、L7「検証できなかったを合格に化けさせない」(記事超え①)
- `~/.claude/agents/coder.md` — GREEN∧改ざん無∧coverage の AND 結合完了 (L190-203)
- `~/.claude/skills/orchestrating-team-development/SKILL.md` — behavior∧structure 二層 + review AND 直列、L216「exit code のみ、成功しました報告は証拠にしない」
- `~/.claude/skills/verify-test-fork/SKILL.md` — Unit∧E2E∧integrity、L83 実行者/判定者分離 (記事超え③)
- `~/.claude/skills/designing-beautiful-frontends/scripts/compare-design-variants.py` — 色ヒストグラム距離を V-2.1 observable gate 化 (記事超え④)
- `~/.claude/rules/critical-thinking-checklist.md` — L12 状態変更の独立確認 (本セッションで自己実証)
- `~/.claude/skills/handoff/SKILL.md` — L87 完了=書込 (残差 Low)
- `~/.claude/skills/essence-reviewing-orchestrator/references/step-6.md` — L97 verdict 源の自己申告非対称 (残差 Low)
- `~/.claude/.docs/essence/essence-docs/agent-essence.md` — V-2.1/V-2.2 正本定義 (L120-125)
- `.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md` — 親バッチ (V-2.1 の ✅ 1行判定、本深掘りの基準点)
