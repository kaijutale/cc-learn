---
date: 2026-06-30 10:22:59
type: work
topic: good-plan-5elements-and-adr-container
session: 良い計画の5要素 → 要素3「判断理由」ADRコンテナ新設
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, orchestrating-team-development, establishing-knowledge-persistence, creating-gtr-worktree, logging]
related_plan_id: 2026-06-28-adr-decision-record-container
related_plan: .docs/plans/2026-06-28-adr-decision-record-container.md
---

# 良い計画の5要素 — 要素3「判断理由」を埋める第一級 ADR コンテナの設計・実装・完了確認

> note 260405 T-2.1「良い計画の5要素」の Q&A から、唯一第一級の器が無い要素3「判断理由」を特定。横断的 ADR コンテナを設計・plan 化し、隔離 worktree で別セッションが実装 → PR #58 マージ。本セッションで完了確認 + worktree 後始末まで完結。

## 概要

- 背景: 5要素 (目的/前提/判断理由/検証/進捗) のハーネス担当を照合する過程で、要素3「判断理由」だけ第一級の器が無い (構造的最弱点) と判明。ハーネス全体分析でも orchestrating 単体分析でも、最弱点は一貫して要素3。
- 目的: 要素3「判断理由」(なぜこの方法か + 却下した代替案) を埋める第一級 ADR (Architecture Decision Record = 設計判断記録) コンテナを後方互換で新設する。
- 結果: PR #58 として claude-harness の main にマージ済み (commit 58570d8)、push 済み。本作業はクローズ。

## 内容

### 1. Q&A フェーズ (5要素の理解と gap 特定)

- 「良い計画の5要素とは何か / なぜ必要か」を explain-in-html で複数 HTML 化 (5要素の WHAT/WHY、TODO リストとの違い)。
- orchestrating-team-development が束ねる skill は5要素のうち「目的・前提・検証」を担い、「進捗・判断理由」は指揮者自身の機構 (共有タスクリスト/フェーズゲート/review-deferred.md) が担うと整理。
- handoff-state.md は引き継ぎ書「全体」ではなく要素5「進捗」+ 各器への索引。note の「単一の自己完結した引き継ぎ書」はハーネスでは分散実装 (handoff + spec/ticket + build-test-protocol) で、束ねるのは pickup + lineage の実行時組み立て。最弱点は要素3。

### 2. 設計・plan フェーズ

- ADR は横断的関心 (solo/TDD/team/debate 全モードで使う) ゆえ orchestrating-team-development には「所有」させず、establishing-knowledge-persistence を後方互換拡張する方針に。
- AskUserQuestion で4設計分岐を確定:
  - D1 所有者 = establishing-knowledge-persistence 拡張 (standalone skill は不採用)
  - D2 モデル = 第一級 `type: decision` @ `.docs/decisions/NNNN-<slug>.md` (category 案は validator 強制が効かず却下)
  - D3 検証 = frontmatter + 「却下した代替案」セクションの存在・非空を機械強制 (type:decision のみ)
  - D4 呼び出し配線 = plan-workflow + orchestrating Step7 を配線、coder は条件付き先送り
- Explore 3体 (既存判断理由機構 / 知識永続化レイヤー+検証 / 呼び出し元+改修ポリシー) + Plan 1体で調査・設計 → plan を `.docs/plans/2026-06-28-adr-decision-record-container.md` に外部化。

### 3. 実装・マージ (隔離 worktree、別セッション)

- main 直接改修を誤って試みた → かいじゅうの指摘で中止 (branch first 原則)。
- 隔離方式に「worktree + 別 session 起動」を選択。gtr worktree を作成し `CLAUDE_CONFIG_DIR=<worktree> claude` で別セッションを起動 (gtr ai は env 未設定で隔離不可ゆえ手動起動)。
- 別セッションが Phase A (validate-knowledge.py の type:decision 追加 + validate_decision_body) / Phase B (plans README の related_decisions、plan-workflow rule、orchestrating Step7 の opt-in ADR emission + skill-io-contract 副作用宣言) を実装。Phase C (coder 配線) は先送り。
- 隔離 fixture + 隔離 git repo で検証 11/11 PASS → PR #58 squash マージ (main 58570d8)、push。

### 4. 完了確認・後始末 (本セッション)

- 徹底調査で完了確認: 計画7ファイル全反映 (行番号で実在確認)、`main...origin/main` 同期 0/0、gh PR #58 MERGED。squash マージゆえ `branch --merged` は「未マージ」表示だが内容は 58570d8 で main に在り、という見かけの矛盾も解消。
- worktree 撤収: 未追跡 HTML 2本 (PR影響分析/essence-sync解説) を本体側 `.docs/output/explain-in-html/` へ退避 → `gtr rm --force` → `git branch -D` → 孤立ディレクトリ (残骸は MCP auth キャッシュ1個のみ) を trash。
- 撤収時の `M settings.json` はキー (`tui`/`skipAutoPermissionPrompt`) の並び替えのみ・意味的変化ゼロと判定し discard。
- 最終: harness worktree 一覧は main 一本のみ、完全クローズ。

## 設計意図

- orchestrating に所有させない: 判断理由は全開発モード横断の関心。1ワークフローに閉じると他モードで記録されず、解こうとした問題 (要素3が二級) を再生産する。所有者は workflow-neutral な知識永続化レイヤー、各ワークフローは呼び出し元。
- first-class type:decision: `category: decision` 案は validator が category を強制しない (VALID_CATEGORY 辞書が無い) ため ADR が二級のまま。要素3に「第一級の家」を与える狙いに直結する。
- 却下案セクションの機械検証: 却下した代替案を欠いた決定記録は「決定の言い換え」にすぎない (要素3の specific gap)。record-design-decision.py の必須 rationale をセクションレベルに写し、存在・非空のみ検査 (内容の質は機械決定不能ゆえ判定しない)。
- coder 先送り (条件付き): 戦術的 green-phase 編集は ADR 非該当 (diff 復元可・代替案なし・非アーキ)。丸ごと emit は低信号で器を汚し発見性を損なう。価値があるのは coder が llm-debate で「案A vs 案B」を解決した時のみゆえ、その debate 解決パスに限定して将来再検討。

## 副作用

- plan 出力先: hook `hook_pre_plans_redirect.sh` が `~/.claude/plans/` を block → プロジェクトローカル `.docs/plans/` へ誘導 (plan モード指定先と衝突するが、かいじゅう運用どおり)。
- gtr が worktree を予想外の base (`~/dev/claude-code/.worktrees/...`) に作成。ただし git-common-dir = `~/.claude/.git` で repo identity は正しく検証済み。
- 本作業の正本 plan・解説 HTML はサンドボックス PJ (本リポジトリ) に、ADR 実装コードは claude-harness リポジトリに、と成果物が2リポジトリに分かれる (サンドボックスが思考を記録、ハーネスが実装を持つ、という本 PJ の役割分担に整合)。

## 関連ファイル

- `.docs/plans/2026-06-28-adr-decision-record-container.md` — 本作業の plan (正本、7ファイルの差分・検証手順・契約保全・リスクまで自己完結)
- `.docs/output/explain-in-html/260628_good-plan-5-elements-why.html` — 5要素の WHAT/WHY 解説
- `.docs/output/explain-in-html/260628_orchestrating-team-dev-plan-5-elements.html` — orchestrating が束ねる skill と5要素の対応
- `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` — A1 実装先 (type:decision + validate_decision_body)、claude-harness 側
- `~/.claude/skills/orchestrating-team-development/SKILL.md` — B3 実装先 (Step7 opt-in ADR emission)、claude-harness 側
- claude-harness PR #58 (main 58570d8) — ADR コンテナ新設の実装本体
