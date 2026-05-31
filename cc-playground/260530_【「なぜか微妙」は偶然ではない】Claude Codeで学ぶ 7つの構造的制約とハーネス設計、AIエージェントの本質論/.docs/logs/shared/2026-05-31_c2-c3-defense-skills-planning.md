---
date: 2026-05-31 14:29:05
type: work
topic: c2-c3-defense-skills-planning
session: 未設定
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, llm-debate, gep-code-reviewer-fork, judging-review-severity, empirical-prompt-tuning, handoff, logging]
related_agent: [Explore, Plan]
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_log_ids: [2026-05-31_orchestrator-and-workflow-qa]
related_log: [2026-05-31_orchestrator-and-workflow-qa.md]
---

# C-2/C-3 防御強化 skill 2本の plan 策定 (detecting-framing-bias ③ / blinding-review-prompt ①)

> ハーネスの C-2 対処を実体 grep 照合 → ③フレーミング・①ブラインドが △ と判明 → 新規 skill 2本で強化する plan を Explore×2 + Plan×1 の独立コンテキスト設計で策定。実装は次セッションに handoff。本依頼自体が「②マルチコンテキスト検証(三角測量)」の実践だった。

## 概要

前ログ (orchestrator-and-workflow-qa) の C-2 学習を受けて、camone が「△評価だった③フレーミング/アンカー認識と①ブラインドレビューを構造強化したい」と依頼。Subagent A=③、Subagent B=① を独立コンテキストで同時起動 → 統合設計 → plan 確定 → 実装着手前に handoff、までを実施。実装フェーズ(skill 8ファイル新規作成)は未着手。

## 内容

### 1. C-2 対処の実体照合 (plan の前提となった現状診断)

`~/.claude/` を grep 横断し、note記事の C-2 対処4打ち手をマッピング:
- **② 独立コンテキスト検証(三角測量)= ✅**: context:fork が TDD/essence/llm-debate/PR レビュー全部の土台。`executing-ai-development-workflow:170`「独立コンテキスト = ダブルブラインド査読」。
- **④ インフレ禁止 = ✅**: 「問題ゼロは疑う」「全軸A は赤信号」が複数 skill に浸透。
- **③ フレーミング/アンカー認識 = △**: `agent-essence.md:26-27` に原則記載のみ。Devil's Advocate 型(メリット/リスク両フレーム反転)の自動機構が無い。
- **① ブラインドレビュー = △**: 「問題ゼロは疑う」質的原則はあるが、(a) 正解/期待結論を伏せる入力設計、(b) 指摘数下限の量的強制、が無い。

### 2. plan 策定プロセス (三角測量の実践)

- Explore agent×2 を独立コンテキストで並列起動 (A=③素材、B=①素材)。各々 plan ファイルを出力。
- Plan agent×1 で統合設計 (frontmatter/I/O契約/命名/共存リスク/検証法を詰め)。
- 3者の結論が「新規作成(L2デフォルト)・L1不可侵・既存テンプレ踏襲」で**収束** = 独立検証で同じ結論に達した(三角測量が効いた証拠)。

### 3. plan の中身 (確定)

**③ detecting-framing-bias** (master + 2fork + 2agent = 6ファイル):
- 同一対象をメリット側フレーム/リスク側フレームの context:fork で独立評価し、Lead が相殺統合 (BALANCED VERDICT)。
- 入力契約 `.docs/framing/CURRENT/subject.md` (llm-debate のファイル契約踏襲、ただし別パス)。
- llm-debate との棲み分け: llm-debate=役割分離(UI/実装/テスト…)、framing=同一関心のフレーム反転(肯定↔否定 valence軸)。意図的に別物。

**① blinding-review-prompt** (master + reference = 2ファイル、fork なし):
- レビュアーに著者意図/PR description/期待結論/author名を伏せた中立プロンプトを生成 + 複雑度から指摘数下限 K を機械算出。
- 入力契約 env-var `BLINDING_REVIEW_TARGET` (gep の env-var系統踏襲)。
- 指摘下限は judging-review-severity でなく**本skillに self-contained** (severity分類と件数下限は別概念、混ぜるとL1汚染)。
- fork なしの理由: これは「対象→中立化文字列+K」の決定論的**変換** skill (③=評価だから fork、①=変換だから master のみ)。

**2つの関係**: 同じ C-2/C-3 でも攻め口が逆(①=入力からアンカーを剥がす / ③=出力を両フレームに振って相殺)。重複でなく相補。①の出力を③の subject.md に流す合成も可能だが疎結合(frontmatter 依存は持たせない)。

## 設計意図

- **なぜ新規作成か**: harness-modification-policy L2(新規作成がデフォルト)。既存 fork skill 改修は judging-review-severity(10 agent参照のL1資産)への波及リスクがある。新規なら契約ゼロリスク。
- **3階層モデルが判断に効いた**: この日の Q&A で確立した「手段-原理-本質」の3階層。「別ファイルに分けるか」で迷った時、camone が「分離が必要なのは設計プロセス(subagent分離で達成済み)であってファイル本数(手段)ではない」と整理 → plan は1ファイルのまま確定。本質と手段の取り違えを camone が正した。

## 副作用

- **未着手の grayzone 2つ** (実装時に実機検証必須):
  - ①: `${BLINDING_REVIEW_TARGET:-HEAD~1..HEAD}` が !構文内で Bash permission deny されるか (gep Gotchaに前例)。deny なら scripts/ 退避に分岐。
  - ③: skill→subagent 孫起動は公式 grayzone (CCバージョン更新時要再検証)。
- **handoff の記述ミスを発見**: handoff-state.md に「plan ファイルは .docs/plans/ なので追跡可能」と書いたが、このPJの .gitignore が `.docs/plans/` を ignore しているため**実際は追跡不可**。plan は git 管理外(ローカルのみ)。plan-workflow.md の「アーカイブ運用」とテンションがあるが、本PJ固有の .gitignore 設定が優先されている状態。
- **未コミット2点**: 本plan ファイル(ignore済=コミット不可)、LLMバイアスHTML(260531_llm-hidden-bias-cot.html、追跡可能だが未コミット)。

## 関連ファイル

- `.docs/plans/2026-05-31-c2-c3-defense-skills.md` — 策定した plan 本体 (PLAN A=③ / PLAN B=① のセクション分け。ただし .gitignore で git 管理外)
- `.claude/handoff-state.md` — 実装フェーズへの引き継ぎ (status: planning、次の最初の一手を記載)
- `.docs/output/explain-in-html/260531_llm-hidden-bias-cot.html` — 本plan の動機となった C-2(隠れバイアス)の HTML 解説
- `.docs/logs/shared/2026-05-31_orchestrator-and-workflow-qa.md` — 前ログ (本作業の前提となった概念Q&A)
- `~/.claude/skills/{llm-debate,gep-code-reviewer-fork,judging-review-severity}/SKILL.md` — plan のテンプレ源 / L1不可侵資産
