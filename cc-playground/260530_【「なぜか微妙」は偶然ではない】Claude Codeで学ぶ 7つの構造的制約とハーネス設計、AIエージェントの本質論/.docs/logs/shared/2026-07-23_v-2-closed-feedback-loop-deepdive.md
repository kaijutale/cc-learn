---
date: 2026-07-23 02:16:52
type: study
topic: v-2-closed-feedback-loop-deepdive
session: V-2「フィードバックループを閉じる」単独深掘り (取り入れフェーズ第9弾 — step3 scan は 07-22 12:15 取得・中断退避、本セッションで step4 から再開。完了順は 7→8→10→9 と前後する)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-2 = 1864〜1892行、関連: V-1.3 入口で絞る 1846〜1862 / V-2.1 観測可能な完了条件 1894〜 / V-2.2 二層チェック)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-22_v-1-3-narrow-options-before-inference-deepdive, 2026-07-21_v-1-2-feedback-speed-law-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-22_v-1-3-narrow-options-before-inference-deepdive.md, .docs/logs/shared/2026-07-21_v-1-2-feedback-speed-law-deepdive.md]
---

# V-2「フィードバックループを閉じる」単独深掘り — 判定: 取り入れ済み (3必須要素を実測確証) · 反例 = 意図的に「開いた」ループが安全/意味論境界に存在

> 核心の構造事実: note の閉ループ3要素 (①数値化合格基準 ②構造化フィードバック ③最大ループ回数+人間エスカレーション) が **同一箇所で揃う完全閉ループは 2 実装** — `coder.md` (implement→verify 最大3周 + coverage 80/75、note の 3-5 回に一致) と `executing-ai-development-workflow` (再レビュー最大2回 → 人間)。加えて収束型 (numeric max 無し・HITL 打切) が 2 (`harness-adoption-audit` / `accumulating-reviewer-feedback`)。反例狩り (scan §E の「検証は走るが修正ループに繋げない」12候補) の収穫は、大半が **意図的に開いたループ** — git-sync reminder・credstore・self-eval・essence 提案系は「機械では閉じず人間が閉じる」設計 (auto-push や自動昇格は安全/意味論境界ゆえ禁止) で gap でなくトレードオフ。真の残差は 2 件: [Low] `hook_stop_plan_externalization_check` が「plan 配置の検証をどの層も担っていない」と自認する開いたループ / [Low] plugin `ralph-loop` が default 無限 (最大ループ回数の安全弁が opt-in)。記事超え: 閉ループの **合格基準・上限そのものを第三者監査**する oracle (`assert-loop-budget.sh` = 上限遵守を物理記録から照合 / `assert-tests-unchanged.sh` = 偽 GREEN 検出) — note が説く「ループを回す」の一段上、「ループが誤魔化されていないか」を閉じる層。

## 概要

取り入れフェーズ第9弾。親バッチ (2026-07-20 V章一括) の V-2 行は既に「✅ 3要素すべて実在」判定済み。本深掘りは skill step 2 規律 (既存 ✅ の再確認でなく差分・反例を掘る) に従い、(a) 3要素の**実測確証** (scan にトレース)、(b) 「検証は走るが閉じていない開いたループ」の**能動的反例狩り**、(c) 記事の枠を超えた実装差分、に集中する。step3 (ハーネス実測 scan) は 07-22 12:15 に read-only Explore へ委譲済み・中断退避 (`~/.claude/jobs/13a8fc90/tmp/v2-loop-scan-report.md`、19KB 生存確認)。scan 鮮度: 第10弾監査が 12:39 以降の hook 層 0 変更を確認済みゆえ現在も有効。

## 内容

### note V-2 の定義 (1864〜1892 行)

- 一行サマリー: 「チェックするだけでなく、結果を Claude Code に返して修正→再チェックのループを回す」(1866)
- たとえ: 体重計に乗るだけ vs 食事を変える (1868〜1874)
- 基本構造: 「生成 → 検証 → 合格基準を満たすか判定 → 不合格ならエラー内容を注入して修正 → 再検証」(1880)
- **3必須要素** (1884〜1886):
  1. 数値化された合格基準 (exit 0 / lint エラー0件 / レビュースコア85点以上)
  2. 構造化されたフィードバック (「src/api.ts:42 - 型不一致」のように箇所・内容明示、LLM が何を修正すべきか一意)
  3. 最大ループ回数 (無限ループの安全弁、3-5回、上限で人間エスカレーション)
- アンチパターン = 「開いたループ」: lint を走らせエラー表示して終わり、検証結果が Claude に返されず修正ループが閉じていない (1876, 1888)
- 閉じたループ: Hook/オーケストレーターがエラー内容をコンテキストに注入し、LLM に修正させ、再検証するまでを**強制する** (1888〜1892)

### ハーネス実体の対応表 (Explore scan 実測)

| note 要素 | ~/.claude の実体 | scan 実測 |
|---|---|---|
| 完全閉ループ (3要素同一箇所) | `agents/coder.md` | implement→verify 最大3周 (l.27-28,71) / 合格=`Result: GREEN ✅` (l.115) + `assert-coverage.sh --line-min 80 --branch-min 75` (l.199) / 超過=`3周GREEN未達→failure_escalation_report` 親へ (l.265-267) |
| 完全閉ループ (3要素同一箇所) | `skills/executing-ai-development-workflow` | 再レビュー最大2回 (l.276) / 終了条件=`Critical/High 指摘ゼロ + 機械検証 pass` (l.277)・Verdict `pass/pass-with-fixes/fail` (l.198) / 超過=`人間にエスカレーション（無限ループの構造的防止）` |
| 収束型 (numeric max 無し・HITL 打切) | `skills/harness-adoption-audit` (本 skill) | 合格=`指摘ゼロに収束` (l.55) / フィードバック=severity 付き判定ログ / 超過=`無限後退は step 8 の HITL で打ち切る` |
| 収束型 (HITL 駆動) | `skills/accumulating-reviewer-feedback` | 再発閾値 `check-gotcha-recurrence.sh` (2回目で昇格候補) / HITL 3択 (accept/defer/dismiss、`自動昇格なし`) |
| ①数値化合格基準 | exit code / coverage / verdict | `verify-adr.sh` exit 0/1/2 / `assert-coverage.sh` line80/branch75 / essence verdict C/H/M/L 件数 / GREEN 判定 |
| ②構造化フィードバック注入 | hook が context へ返す | deny 系: `hook_pre_commit_essence_gate.sh` の `permissionDecisionReason` 構造化 JSON / `hook_pre_commit_adr_gate.sh` の失敗理由逐語 / advisory 系: `hook_post_lint.sh` の `additionalContext` 診断 / `hook_stop_words.sh` が該当行を `grep -F -C 1` で添付 |
| ③最大ループ回数+エスカレーション | ループ上限 | coder 3周 (note 3-5 に一致) / exec-workflow 2回 / 収束型は HITL 打切 |

> **注 (step6 開示)**: 「完全閉ループ2実装」は *独立したループ* の数え方。同一の TDD ループは `skills/enforcing-strict-tdd-cycle/SKILL.md` l.120-132 (RED→GREEN→調整ループ最大3周→3周未達で失敗エスカレーション) にも逐語で現れる — これは coder.md (L2 実行体) を L3 skill 側から記述したもの。逐語で「3要素が同一箇所」のファイルは厳密には3つだが、同一ループの二重計上を避け coder.md 1本に畳んでいる。

### 3必須要素の個別照合 (実測確証)

**要素① 数値化された合格基準 — 取り入れ済み.** scan D 層に「失敗箇所明示型 script」6本 (`verify-adr.sh` exit 0/1/2、`assert-loop-budget.sh` exit 0/1/2、`assert-coverage.sh`、`assert-tests-unchanged.sh`、`assert-no-cycles.sh`、`record-loop-iteration.sh`)。合格基準は全て数値/exit code = note の「いい感じになったら完了、ではループが終わらない」を回避。

**要素② 構造化されたフィードバック — 取り入れ済み.** scan A-2 の block 系 15本が context へ構造化理由を返す。逐語例: essence-gate `[essence-gate] block: essence 正本と下流要約の原則数がドリフトしています (check-essence-sync.sh exit 1)` (scan l.44)、adr-gate `[adr-gate] block: ADR の検証に失敗しました (verify-adr.sh exit 1 = 検証失敗)。` (hook 本体 l.185 で直接確認)。note の「src/api.ts:42 - 型不一致」形式 (箇所+内容) に対応。**本セッションでも実演**: `hook_stop_words.sh` が「たも」検出時に該当文脈行を添えて差し戻し、あたしが即自己修正 = 要素②の実発火。

**要素③ 最大ループ回数+人間エスカレーション — 取り入れ済み (2 実装が完全一致).** coder の「最大3周 (調整→verify)」(scan B, l.71) は note の「3-5回」に一致。超過時 `for-else: break せず3周完走=GREEN未達 → return failure_escalation_report` (scan l.76) で親へ。exec-workflow は「再レビュー最大2回 → 人間エスカレーション」。収束型2本 (harness-adoption-audit / accumulating-reviewer-feedback) は numeric max を持たず HITL で打ち切る = 「上限で人間へ」の意味論版。

### 反例狩り (開いたループ — scan §E の12候補をストレステスト)

note のアンチパターンは「開いたループ」(測るだけで行動を変えない)。scan §E は「検証/検出は走るが Claude への修正ループを強制しない」12件を列挙 — これを1件ずつ「gap か、意図的トレードオフか」で裁く:

**意図的に開いたループ (gap ではない — 機械で閉じず人間が閉じる)**:
- `hook_session_start_git_sync_reminder.sh`: 未commit/未push を検出 → 通知 + echo のみ (scan l.121)。**まさに「体重計に乗るだけ」**だが、閉じるには auto-push が要り「push実行はかいじゅうのみ可」の安全規則に反する → **意図的に人間が閉じるループ**。(本セッションで実際に毎ターン発火し、あたしが push を handoff = 人間側で閉じた)
- `skills/accumulating-reviewer-feedback` / `review-harness` self-eval: 永続化するが反映は HITL (accept/defer/dismiss)、`自動昇格なし` (scan l.129)。「昇格の価値があるか」は意味論判断ゆえ機械で閉じない設計 (V-1.1 と同じ境界)
- `skills/proposing-essence-updates`: PR ドラフトまで作り `②③完了で必ず停止`、④⑤ (レビュー/マージ) は HITL (scan l.130)。essence 正本への自動 commit を禁じる評価基準保護 (C-5)
- `agents/coder.md` coverage 判定: 未達を検出しても `coder はテストを書けないためブロックせず親にエスカレーション` (scan l.128) → スコープ境界。エスカレーション自体が閉じ機構
- `hook_session_start_credstore_orphan_report.sh` / `hook_session_start_hook_fire_report.sh`: Keychain 孤児 / hook センサー死亡を検出 → 報告のみ fail-open (scan l.119-120)。自動回収は危険ゆえ人間へ

**advisory 注入 (loop は注入されるが強制はされない — severity 依存の階層化)**:
- `hook_post_lint.sh` / `hook_post_emoji_check.sh`: 診断を `additionalContext` で返すが deny/block しない、修正は「モデル判断」(scan l.126)。**note の「強制する」を満たさない**が、これは gap でなく **severity 別の階層化** — 安全critical (essence/adr/secret/worktree) は deny で強制閉ループ、style-advisory (emoji/行数warn) は注入止まり。note の閉ループ二値を「強制 vs 助言」の勾配に精密化している

**真の残差 (自認された開いたループ / 上限欠如)**:
- **[Low] `hook_stop_plan_externalization_check.sh`**: plan 外部化を検証するが明示的に非 block (scan l.123)、かつ `終端に検証が無い / 場所の検証はどの層も担っていない` と**自認**。検証は走るが closure を強制せず、plan 配置の正しさをどの層も閉じていない = note のアンチパターン「開いたループ」に最も近い。ただし warn 型は意図的 (`棄却の判断はモデルに委ねる`) ゆえ Low
- **[Low] plugin `ralph-loop` の default 無限**: `MAX_ITERATIONS=0` (default unlimited) = `plugins/…/ralph-loop/scripts/setup-ralph-loop.sh` l.10、逐語 `No manual stop - Ralph runs infinitely by default!` は同 script l.50 の `--help` ヒアドキュメント内 (step6 で直接確認 — scan は逐語を `commands/ralph-loop.md` へ誤帰属していたが同ファイルは18行で該当なし。真の在処は setup script) = note 要素③「最大ループ回数=無限ループの安全弁」を**default で欠く**。ただし外部 plugin (claude-plugins-official) で opt-in、`--max-iterations` と completion-promise の override あり、かつ自作の `camone-ralph-loop` は fresh session 方式で別系統。ハーネス自作部の gap ではなく取込み plugin の既定値ゆえ Low

### 記事超え点 (V-2 固有)

1. **ループ健全性の第三者監査**: note は「最大ループ回数を設ける」まで。ハーネスは `assert-loop-budget.sh` で**上限が実際に守られたかを物理記録から監査** (scan l.111: `len(iterations)<=loop_max` / 単調増加 (飛び番=誤魔化し検出) / GREEN記録後の追加なし、`coder-loop.json` を `record-loop-iteration.sh` の物理記録と照合し in-memory 自己申告を排除)。「ループを回す」の一段上、「ループの安全弁が誤魔化されていないか」を閉じる層
2. **合格基準の反ハッキング**: 閉ループの pass 基準 (GREEN) 自体が、テスト改ざんで偽装されうる。`assert-tests-unchanged.sh` (RED指紋照合) が偽 GREEN を検出 (scan l.112, coder l.199 `exit 1=改ざん→偽GREEN失敗扱い`)。note の閉ループが前提する「合格=真」を、C-5 報酬ハッキング対策で裏打ち
3. **閉ループを「監査」というメタ作業へ適用 (自己実証)**: 本 skill (harness-adoption-audit) の step6 独立検証ゲートは、判定ログ生成 → 独立 verifier が実体照合 → トレース不能を注入 → 修正 → 再検証を指摘ゼロまで回す = V-2 の閉ループを**監査そのものに適用**。本ログ作成過程が実例 (このあと step6 が発火する)
4. **公式ループ再発火の choke point 制御**: `hook_stop_handoff_check.sh` が `stop_hook_active==true` で沈黙する公式ループ防止契約を実装、実測 40 周超の再発火を抑制 (scan l.61) = 閉ループの「暴走側」を止める安全弁も別途装備

### 残差 / 改善候補

- **[Low] `hook_stop_plan_externalization_check` の自認する開いたループ**: plan 配置検証を強制する層が無い。閉じるなら Stop 段で plan 配置を deny 判定する hook を足せるが、`棄却はモデルに委ねる` 設計 (意味論判断) ゆえ現状は意図的 warn 止まり。昇格は「plan 誤配置の再発実績」が出た時 (V-1.1 の再発待ち規律と整合)
- **[Low] plugin ralph-loop default 無限**: 自作部でなく取込み plugin の既定値。運用上は `--max-iterations` 指定 or `camone-ralph-loop` (fresh session 方式) を使う慣行で緩和。plugin 既定を書き換えるかは HITL 判断
- 意味論注記: 「どのループを機械で閉じ、どれを人間に委ねるか」の選別は意味論判断 (auto-push 禁止・自動昇格禁止・essence 自動 merge 禁止はいずれも安全/評価基準保護の境界)。ゆえに「開いたループ=gap」と一律に扱わない (skill Gotcha「意味論検査の不在を gap 扱いするな」と同型)

判定: 取り入れ済み — note の閉ループ3要素は完全閉ループ2実装 (coder / exec-workflow) で同一箇所に揃い、収束型2本が意味論版の上限 (HITL打切) を担う。要素①②③すべて scan にトレース可能。反例狩りで挙がった「開いたループ」12件のうち大半は auto-push/自動昇格/自動 merge を禁じる安全・意味論境界による**意図的な開放**でトレードオフ、真の残差は Low 2件 (plan 外部化検証の自認欠落 / plugin ralph-loop の default 無限)。記事超えは「ループ健全性そのものを監査する oracle」(assert-loop-budget / assert-tests-unchanged) = note の一段上の閉じ。

## 独立検証 (step6) の記録

fresh な read-only reviewer (code-reviewer) が全 load-bearing 主張を実ファイルと1件ずつ照合。**verdict = (a) 全主張トレース可** — 判定の背骨 (coder 3周+coverage 80/75+escalation / exec-workflow 再レビュー2回+終了条件+Verdict / assert-loop-budget の3判定 / assert-tests-unchanged 偽GREEN検出 / essence・adr gate の構造化 deny / plan-externalization の非block自認 / ralph-loop default 無限 / settings.json 配線整合) はすべて実ファイルで独立確認、矛盾・トレース不能ゼロ。結論「取り入れ済み」+ 残差 Low×2 は維持。

指摘は substance でなく **citation 精度の5件**で、本ログに反映済み (修正はいずれも実データを直接 Read で裏取りしてから適用):

1. **[Medium] ralph-loop 逐語の誤帰属**: scan が `commands/ralph-loop.md` へ帰属させていたが同ファイルは18行で該当なし。真の在処 `scripts/setup-ralph-loop.sh` l.10 (`MAX_ITERATIONS=0`) / l.50 (逐語) へ訂正。結論 (default 無限) は不変
2. **[Low] adr-gate 逐語の切り詰め**: `= 検証失敗` を補完し完全形に (hook l.185)
3. **[Low〜Medium] 「2実装」の framing**: enforcing-strict-tdd-cycle が同一ループの3つ目の逐語出現である旨を注記 (上記「注」)
4. **[Low] scan §C/§D の閉ループ列挙が非網羅**: `authoring-claude-md` の error-retry 小閉ループ (validate-claude-md.sh FAIL→最大1回再試行) 未列挙 / block hook 実数は three-elements-harness の PreToolUse block 2本 (`block-team-in-macro` / `restrict-macro-writes`) を含め 15 より多い可能性。いずれも判定を覆さない
5. **[Low] scan 由来の未再検証な数値**: `hook_stop_handoff_check`「40周超」等はサンプル照合のみで load-bearing でない

**収束の扱い**: 5件はすべて citation/framing レベル (substance の矛盾・トレース不能ゼロ) で、各修正を直接 Read で裏取りして適用済み。citation-only 修正に対する2周目の独立 subagent 起動はコスト不均衡ゆえ見送り、意味論の最終 backstop は step 8 の人間 content-review に委ねる (fail-close の意味論軸)。

## 関連ファイル

- `~/.claude/jobs/13a8fc90/tmp/v2-loop-scan-report.md` — step3 実測 scan 退避 (本判定の一次データ正本、19KB、07-22 12:15 取得)
- `~/.claude/agents/coder.md` — 完全閉ループ実装 (3周 + coverage 80/75 + failure_escalation、要素①②③が同一箇所)
- `~/.claude/skills/executing-ai-development-workflow/SKILL.md` — 完全閉ループ (再レビュー最大2回 → 人間)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/assert-loop-budget.sh` — ループ上限遵守の第三者監査 (記事超え①)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/assert-tests-unchanged.sh` — 偽 GREEN 検出 (記事超え②)
- `~/.claude/hooks/hook_pre_commit_essence_gate.sh` / `hook_pre_commit_adr_gate.sh` — 構造化フィードバックを deny 理由で注入 (要素②)
- `~/.claude/hooks/hook_stop_plan_externalization_check.sh` — 自認する開いたループ (残差 Low)
- `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/ralph-loop/scripts/setup-ralph-loop.sh` — default 無限ループ (l.10 `MAX_ITERATIONS=0` / l.50 逐語。残差 Low、step6 で誤帰属訂正)
- `.docs/references/260405_…/text.md` (1864〜1892行) — V-2 照合基準
- `.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md` — 親バッチ (V-2 の ✅ 1行判定、本深掘りの基準点)
