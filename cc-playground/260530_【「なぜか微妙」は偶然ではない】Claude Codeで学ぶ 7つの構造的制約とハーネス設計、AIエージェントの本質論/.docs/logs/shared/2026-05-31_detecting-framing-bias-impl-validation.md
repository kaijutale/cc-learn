---
date: 2026-05-31 16:09:16
type: validation
topic: detecting-framing-bias-impl-validation
session: C-2/C-3 防御強化 (PLAN A)
target: detecting-framing-bias (master+2fork+2agent の6ファイル Devil's Advocate 装置) の grayzone 孫起動・フレーム独立性・反インフレの実機検証
verifier: メインClaude (Opus 4.8, 1M context)
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_skill: [detecting-framing-bias, framing-advocate-merit-fork, framing-advocate-risk-fork, llm-debate, llm-debate-reviewer, logging]
related_agent: [framing-advocate-merit, framing-advocate-risk]
related_log_ids: [2026-05-31_blinding-review-prompt-impl-validation, 2026-05-31_c2-c3-defense-skills-planning]
related_log: [2026-05-31_blinding-review-prompt-impl-validation.md, 2026-05-31_c2-c3-defense-skills-planning.md]
---

# detecting-framing-bias 実装 + grayzone/独立性/自己欠陥検出

> C-2/C-3 防御 skill 2本のうち ③ detecting-framing-bias を新規実装。同一対象を利点/リスクの独立 context:fork で評価し Lead が相殺する Devil's Advocate 装置 (6ファイル)。grayzone 孫起動・フレーム独立性・反インフレを実機検証。**ドッグフーディング (自分自身を評価対象に) で実在の設計欠陥3件を自己検出し、即 master に反映**した。

---

## 検証目的

1. detecting-framing-bias を 6ファイル (master + merit/risk fork + merit/risk agent + reference) で新規作成する。
2. plan A の最大リスクだった skill→subagent **孫起動 grayzone** が動くかを実機確認する (master で束ねる前に fork 単体で)。
3. 2 fork の **フレーム独立性** (merit/risk が互いの論点に言及しない = context:fork が効く) を確認する。
4. **反インフレ** (risk fork が「問題なし」で逃げず実在の欠陥を出す) を確認する。

## 検証環境

| 項目 | 値 |
|---|---|
| 作成先 | `~/.claude/skills/detecting-framing-bias/` + `framing-advocate-{merit,risk}-fork/` + `~/.claude/agents/framing-advocate-{merit,risk}.md` |
| 呼出元 cwd | 260530 学習 PJ |
| 検証ツール | Skill preprocessor (bang 構文 + context:fork 孫起動) / quick_validate.py |
| セッション | メインClaude Opus 4.8 (1M context) |
| 入力契約 | `.docs/framing/CURRENT/subject.md` (llm-debate の topic.md と別パス) |
| テンプレ源 | llm-debate (master) / llm-debate-reviewer (fork) / llm-debater-implementer (agent) |

## 実測結果サマリ

| 指標 | 自実測 | 期待値/参照値 | 一致度 |
|---|---|---|---|
| grayzone 孫起動 (merit-fork 単体) | 孫が起動し [Merit Frame Analysis] 返却 | llm-debate 同型で動く | ✅ |
| grayzone 孫起動 (E2E で merit+risk 並列) | 両孫が独立起動・返却 | 動く | ✅ |
| フレーム独立性 | merit は利点のみ / risk はリスクのみ、互いに非言及 | context:fork 分離 | ✅ |
| 反インフレ (risk) | risk が実在欠陥3件を提示 (🟡) | 問題ゼロを疑う | ✅ |
| bang 構文 deny (master) | date/pwd/ls/cat 全展開 | deny なし | ✅ |
| quick_validate (master) | Skill is valid! | valid | ✅ |
| quick_validate (fork 2本) | context/subagent で NG | **偽陽性** (既存 fork 3本も同一) | ⚠️ |
| 配線 (fork subagent ↔ agent name) | 完全一致 | 一致 | ✅ |
| BALANCED VERDICT 組成 | 🟡 条件付きを相殺生成 | 相殺可能 | ✅ |
| 自己欠陥検出 | risk が3欠陥発見→対処 | (想定外) | ✅ 望外の成果 |

## 各Stage 詳細結果

### Stage 1: 6ファイル作成 (agent→fork→reference→master の順)

- **結果**: ✅
- **観測**: handoff 指定順で作成。agent 2体 (opus / tools[Read,Grep,Glob,Bash] / Edit・Write 非装備 / color merit=green・risk=red)、fork 2本 (context:fork + subagent)、reference (framing-guidelines.md)、master。
- **学び**: agent の核心は「フレームを振り切る≠捏造 (誇張と虚偽は別)」。利点/リスクを最大強度で打ち出すが事実は曲げない。これが反インフレと両立する条件。

### Stage 2: grayzone 孫起動 実機検証 (plan A 最大リスク)

- **結果**: ✅ 孫が返る
- **観測**: framing-advocate-merit-fork を単体 Skill 起動 → `Skill completed (forked execution)` + 孫 (framing-advocate-merit) が利点5件の構造化分析を返却。bang 構文 (date/pwd/cat subject/git status) も全展開。
- **学び**: skill→subagent 孫起動は公式 grayzone だが llm-debate と同じ構造なら現バージョンで動く。master で束ねる前に fork 単体で確認したことで、grayzone の不確実性を master 統合前に隔離できた。

### Stage 3: 静的検証 + quick_validate 偽陽性の識別

- **結果**: ✅ (master valid) / ⚠️ (fork は既知偽陽性)
- **観測**: master は `Skill is valid!`。fork 2本は `Unexpected key(s): context, subagent`。だが既存の動く fork (llm-debate-reviewer / gep-code-reviewer-fork / auditing-aio-fork) 全3本が**同一エラー**を出すことを確認 → quick_validate.py が fork 拡張 (context/subagent) を許可キーに含まない既知の限界と判明。context/subagent を消すと fork が壊れるため**消さない**。
- **学び**: static 検証ツールの NG を鵜呑みにせず、既存の動く資産と比較して偽陽性を識別する。fork skill の真の検証は static でなく実機 (Stage 2/4)。

### Stage 4: E2E (master → 2fork 並列 → Lead 相殺)

- **結果**: ✅
- **観測**: subject に「③自身の6ファイル構成の妥当性」を置き master 起動 → Step2 で merit/risk fork を1メッセージ並列起動 → merit 🟢(利点5件) / risk 🟡(リスク3件) が**互いに一切言及せず**返却 → Lead が相殺し BALANCED VERDICT 🟡 条件付きを生成。
- **学び**: フレーム独立性が物理的に効いている (merit 出力が risk 論点を含まない)。Lead 相殺で「フレーム不変の核心」(両極に残る論点) を抽出できた。

### Stage 5: ドッグフーディングによる自己欠陥検出 → 即対処

- **結果**: ✅ 望外の成果
- **観測**: risk fork が③自身に対し実在の設計欠陥3件を提示:
  1. **Lead 残存 C-2**: master は subject を fork 起動「前」に bang 構文で全文注入するため、相殺する Lead 自身が提示フレームにアンカーされる。fork を分離しても統合者が無防備。
  2. **degraded silent failure**: 孫起動 grayzone がバージョン更新で静かに壊れると fork が空/片側で返り、フェイルセーフ不在のため Lead が片側だけで BALANCED と僭称しうる。
  3. **死蔵リスク**: 高コストゆえ最も C-2 に脆弱な急ぎの場面でスキップされる。
- **対処** (即 master に反映): ① Step 4.0「Lead 自身のアンカー補正」追加、② Step 3 フェイルセーフ (必須トークン+points≥3、欠落で⚪差し戻し) 追加、③ Gotcha に3欠陥 + Observability に lead_anchor_note/failsafe_passed 追加。

## 重要発見

1. **Devil's Advocate 装置が自分の欠陥を炙り出した**。③自身を subject に置いた E2E で、risk fork が「統合者 Lead 自身に C-2 が残存する」という、設計者 (わたし) が見落としていた単一障害点を指摘。装置の存在意義 (バイアス自己検出) がドッグフーディングで実証され、かつ即改善に繋がった。反インフレ (risk が忖度せず欠陥を出す) が効いた直接の証拠。
2. **grayzone は llm-debate 同型なら現バージョンで動く**。skill→subagent 孫起動 (merit-fork 単体 / E2E 並列の両方) が成功。ただし「degraded silent failure」は将来バージョンで顕在化しうるため Step 3 フェイルセーフを装備。
3. **quick_validate は fork skill を完全検証できない**。context/subagent を許可キーに持たず、既存の動く fork 全部が同じ NG。static ツールの限界 = 真の検証は実機。authoring-skills の quick_validate.py を fork 対応に更新する案は別途 (協調ハーネス資産のため L1 判断要)。
4. **ground truth verifier の不在**。本装置には「中立判断が本当に中立か」を外部検証する手段が無い (TDD/audit と違い検証可能工程ですらない)。偽中立のリスクを自覚し、Lead アンカー補正 + フェイルセーフ + 高ステークス限定で緩和する設計とした。

## 改善候補 (次フェーズ持ち越し)

- **① ③ 両 skill を empirical-prompt-tuning で磨く** (plan B-9.6 / A の検証残): バイアスを排した実行者に fork 指示を渡し、フレーム振り切りの強度・捏造誘発の有無・Lead アンカー補正の実効性を反復評価。
- **① blinding × ③ framing の合成テスト**: blinding 中立化出力を subject.md に流す二重防御パイプラインの E2E (plan B-9.5)。
- **quick_validate.py の fork 対応**: context/subagent を許可キーに追加する保守的修正 (L1 判断後)。

## 結論

③ detecting-framing-bias 完成 (6ファイル、master valid、142行、全機能を実機確認)。plan A 最大リスクの grayzone 孫起動は実機突破、フレーム独立性・反インフレも実証。ドッグフーディングで自己欠陥3件を検出し即 master に反映 ── 「動いた」を超えて「自分の穴を塞いだ」。既存契約 (judging-review-severity の L1、llm-debate 系) は非参照・非改変。① と ③ で C-2/C-3 防御 skill 2本が揃った。残りは両 skill の empirical 磨きと合成テスト。

## 関連ファイル

- `~/.claude/skills/detecting-framing-bias/SKILL.md` — master (収集 bang 構文4 + Step1-5 + Step3フェイルセーフ + Step4.0アンカー補正)
- `~/.claude/skills/detecting-framing-bias/references/framing-guidelines.md` — C-2理論・対象種別観点・非対称の読み方・相殺手順
- `~/.claude/skills/framing-advocate-{merit,risk}-fork/SKILL.md` — 2 fork (context:fork + subagent)
- `~/.claude/agents/framing-advocate-{merit,risk}.md` — 2 agent (opus / Edit・Write非装備 / 反捏造原則)
- `.docs/framing/CURRENT/subject.md` — E2E 検証用サンプル (③自身の6ファイル構成を評価対象に)
- `.docs/plans/2026-05-31-c2-c3-defense-skills.md` — PLAN A (本実装の設計根拠)
