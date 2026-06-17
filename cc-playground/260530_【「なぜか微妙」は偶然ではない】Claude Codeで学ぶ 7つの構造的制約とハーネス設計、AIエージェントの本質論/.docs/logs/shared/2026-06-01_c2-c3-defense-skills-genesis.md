---
date: 2026-06-01 04:10:42
type: work
topic: c2-c3-defense-skills-genesis
session: C-2/C-3 防御 skill の作成経緯 (なぜ・どう作ったか)
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_skill: [blinding-review-prompt, detecting-framing-bias, framing-advocate-merit-fork, framing-advocate-risk-fork]
related_agent: [framing-advocate-merit, framing-advocate-risk]
related_log_ids: [2026-05-31_c2-c3-defense-skills-planning, 2026-05-31_blinding-review-prompt-impl-validation, 2026-05-31_detecting-framing-bias-impl-validation, 2026-05-31_empirical-tuning-and-composition-e2e, 2026-05-31_c2-c3-defense-skills-session-summary]
related_log: [2026-05-31_c2-c3-defense-skills-planning.md, 2026-05-31_blinding-review-prompt-impl-validation.md, 2026-05-31_detecting-framing-bias-impl-validation.md, 2026-05-31_empirical-tuning-and-composition-e2e.md, 2026-05-31_c2-c3-defense-skills-session-summary.md]
---

# C-2/C-3 防御 skill ── 作成の経緯 (なぜ・どう作ったか)

> 「7つの構造的制約」のうち C-2(フレーミング/アンカー)と C-3(迎合)への構造防御として skill 2本を作った、その動機と作成プロセス、そして終盤に得た最大の教訓(L1不可侵の視野狭窄 → ハーネス改修ポリシーの転換)を一本に束ねた経緯ログ。検証の詳細は related_log の5本に委ね、本ログは「なぜ・どう・学び」に焦点を絞る。

## 概要

note記事『7つの構造的制約』の学習から、AIエージェントが構造的に抱える弱点 C-2/C-3 に「気をつける」ではなく道具(skill)で構造的に抗うことを目的に、防御ツール2本を新規作成した。作成対象は `~/.claude/` グローバルハーネス実体(8ファイル)。

## なぜ作成に至ったか (動機・起点)

1. **起点 = 7つの構造的制約の学習**: AIエージェントが構造的に抱える弱点 C-1〜C-7 のうち、C-2(提示のされ方=フレーミング/アンカーに判断が引きずられる)と C-3(相手に忖度する=迎合)に注目した。
2. **ハーネス実体の grep 照合で穴を特定**: C-2 への対処は本来4つ(①ブラインドレビュー / ②独立コンテキスト検証=三角測量 / ③フレーミング・アンカー認識 / ④インフレ禁止)。camone のハーネスを実体照合した結果:
   - **②独立コンテキスト・④インフレ禁止 = `context:fork` で物理実装済み(✅)**
   - **③フレーミング・①ブラインド = 原則は明文化されているが自動機構が薄い(△)**
3. **△2点を構造強化したい (camone 依頼)**: 「原則がある」だけでは偏りは防げない(偏っている本人には偏りが見えない)。自動で働く道具に落とす。

## どのように作成したか (設計判断・プロセス)

### 設計手法そのものが C-2 対処の実践
- 調査を Explore 2体で独立実行 → Plan 1体で統合。これ自体が「②三角測量(独立コンテキストで複数評価)」の実践で、3者の結論が収束した。

### 2本の役割分担 (攻め口を逆に)
- **① blinding-review-prompt = 変換 skill**: レビュー入力から著者情報・期待結論を機械除去する「盲検化」。変換なので master 単体(fork 不要)。C-3迎合+C-2アンカーを「入力から錨を剥がす」方向で防ぐ。
- **③ detecting-framing-bias = 評価 skill**: 同一対象を利点役/リスク役の独立 `context:fork` で評価し相殺する Devil's Advocate。評価なので fork 構成(独立コンテキスト必須)。C-2フレーミングを「出力を両極に振って相殺」方向で防ぐ。
- 入力から錨を剥がす(①)と 出力を両極に振る(③)で、同じ C-2/C-3 を挟み撃ち。

### 作成順と検証 (リスク小→大)
1. **① 先**(2ファイル、リスク小): 最大懸念だった「!構文内の `${VAR:-default}` deny」を実機で否定(gep Gotcha 非再現)→ scripts 退避不要。
2. **③**(6ファイル、agent→fork→reference→master の順): skill→subagent 孫起動 grayzone を実機突破。**ドッグフーディング(③ に ③ 自身を評価させる)で自己欠陥3件を検出→即修正**。
3. **empirical 収束**: 白紙 subagent で曖昧さ検出→修正→再評価。
4. **①×③ 合成**: ① の中立化出力を ③ subject に流す二重防御を実 PR で実証。

## 重要な学び ── L1不可侵の視野狭窄とポリシー転換

本セッションの最大の教訓。**作成プロセスそのものに偏りがあった**。

### 何が起きたか
- わたし(Claude)は「L1不可侵 = 既存を一切壊さない」と**過剰解釈**し、①③ を既存ハーネス(`executing-ai-development-workflow` の Review、`gep` 等)に**後方互換で組み込む選択肢を検討せず**、完全独立 skill に倒した。
- 結果、①③ は「明示呼出 / 手動で前段に挟む」しか使われない = **死蔵リスク**(③ 自身が自己評価で指摘した弱点そのもの)。

### なぜ誤りか
- `harness-modification-policy.md` は「守りたいのは協調網の連鎖崩壊防止であって**アップグレードの禁止ではない**」「判断軸は『アップグレードか新規作成か』ではなく『契約を壊すか否か』」と明記。**後方互換な組み込みはむしろ推奨**されている。
- ①③ を既存ワークフローの Review 前に呼ぶ1行を足すのは、既存動作を壊さない後方互換改修であり、L1(契約破壊)違反ではない。やれた。検討すらしなかったのが視野狭窄。

### 構造的原因 (3つ)
1. **古い memory に引きずられた**: `feedback_no-existing-harness-modification`(2026-05-06 由来)が「絶対改修禁止・必ず新規作成」という強い絶対則のまま。relocation(2026-05-24)で policy が「契約破壊だけ禁止」に柔らかくなった後も未更新で、pickup 時にこの古い memory が新 policy より強く効いた。
2. **L2(新規作成デフォルト)を絶対則として運用**: 本来 L2 はリーダー裁量で例外可の指針なのに、例外を取れない壁のように扱った。
3. **policy の核心(判断軸=契約破壊か否か)を素通り**: 表層の「新規作成デフォルト」だけ拾った。

### 帰結 ── ハーネス改修ポリシーの転換
- この会話を受けて、ハーネス改修のデフォルトが反転した:
  - **旧**: 契約破壊は不可、**新規追加がデフォルト**
  - **新**: 既存を参照し契約を壊さず**後方互換に改修して深めるのがデフォルト**。契約を壊す時だけ新規作成。
- = デフォルトを「新規作成(独立に倒れやすい)」から「後方互換改修(組み込みに倒れる)」へ。視野狭窄の再発防止。

## 次の一手 (未完の残タスク)

1. **①③ を既存ハーネスに後方互換組み込み**: `executing-ai-development-workflow` の Review 前段に ①、設計判断ステップに ③ を、既存動作を壊さない形で配線。死蔵リスクの解消。今度は「契約を壊すか否か」の正しい軸で設計する。
2. **古い memory の更新**: `feedback_no-existing-harness-modification` を新 policy に揃える(「絶対改修禁止」→「契約破壊だけ禁止・後方互換組み込み推奨」)。視野狭窄の根本原因を断つ。memory更新を先にやるのが筋(根本を断たないと 1 でalso古い memory に引かれる)。

## 情報源 (このハーネスを辿れる場所)

| カテゴリ | 場所 |
|---|---|
| skill/agent 実体 (8ファイル) | `~/.claude/skills/{blinding-review-prompt, detecting-framing-bias, framing-advocate-merit-fork, framing-advocate-risk-fork}/` + `~/.claude/agents/framing-advocate-{merit,risk}.md` |
| 検証ログ (5本) | `.docs/logs/shared/2026-05-31_*` (related_log 参照) |
| plan | `.docs/plans/2026-05-31-c2-c3-defense-skills.md` |
| 解説HTML / subject | `.docs/output/explain-in-html/260531_c2-c3-defense-skills.html` / `.docs/framing/CURRENT/subject.md` |
| commit | `420fcda` → `37cbb24` → `993a73e` |
| 本経緯ログ | `.docs/logs/shared/2026-06-01_c2-c3-defense-skills-genesis.md` |

## 関連ファイル

- 検証詳細は related_log の5本(planning / ①impl / ③impl / empirical+合成 / session-summary)
- 設計の判断文脈は related_plan(PLAN A+B)
- ポリシー本体は `~/.claude/rules/harness-modification-policy.md`、その出典分析は会話ログ(L1/L2/L3 = note記事260222『次世代エージェント設計』の動的オーケストレーション3層が構造の出典、「改修禁止」の魂は 2026-05-06 essence/失敗体験)
