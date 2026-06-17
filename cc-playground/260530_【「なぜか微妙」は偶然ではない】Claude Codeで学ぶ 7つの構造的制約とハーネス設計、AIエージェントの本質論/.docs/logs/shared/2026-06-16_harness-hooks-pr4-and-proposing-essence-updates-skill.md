---
date: 2026-06-16 01:41:03
type: work
topic: harness-hooks-pr4-and-proposing-essence-updates-skill
session: proposing-essence-updates-build
related_skill: [authoring-skills, creating-gtr-worktree, visualizing-as-html, logging, essence-reviewing-orchestrator, review-agent-essence]
related_agent: [general-purpose]
related_plan_id: 2026-06-15-proposing-essence-updates
related_plan: .docs/plans/2026-06-15-proposing-essence-updates.md
related_log_ids: [2026-05-24_llm-7-constraints-c-prefix-meaning]
---

# ハーネス hook Critical 3 修正 (PR #4) + proposing-essence-updates skill 構築

> harness-hooks-bug-audit からの続き。(1) hook Critical 3 を PR #4 化、(2) essence-docs 更新提案ハーネス `proposing-essence-updates` を build、(3) その self-review reviewer を選定。複数の hook over-block バグを実走で踏んだ。

## 概要

前セッション (harness-hooks-bug-audit) で 60 件の hook バグを監査・plan 化済みの状態から再開。本セッションで以下を実施:

1. **hook Critical 3 修正 → PR #4**: emoji 検知 / secret テンプレ誤ブロック / essence-gate 散文誤読の 3 つを修正
2. **`proposing-essence-updates` skill 構築**: essence-docs (評価基準) の陳腐化点検 + 不足補充を PR ドラフトとして提案する更新ハーネス。①収集→②提案→③通知 を自動化、④レビュー→⑤マージは HITL
3. **self-review reviewer の選定**: review-agent-essence vs essence-reviewing-orchestrator を 2 agent 並列で徹底調査し、orchestrator に決定

## 内容

### 1. hook Critical 3 → PR #4

- **emoji** (`hook_post_emoji_check.sh`): `grep -nP` を `/usr/bin/perl -CSD` に移植 + Unicode 範囲拡張 (00A9/00AE/2122/2B00-2BFF/1F000-1FAFF/FE0F)。box-drawing は範囲外で誤検知回避
- **secret** (`hook_pre_read_secret_check.sh`): `.env` 判定の前にテンプレ除外ガード `/\.env\.(example|sample|template|dist)$ && exit 0` を挿入。実 secret は DENY 維持
- **essence-gate** (`hook_pre_commit_essence_gate.sh`): glob `*_self-eval-v*.md` → `*.md` (命名ドリフト追従) / 散文 grep → 機械可読 `critical_count`/`high_count` 行頭アンカー優先 + fallback + fail-closed
- **手順**: 全修正を `/tmp/hook-fix-tests/` で reproduce→fix→verify→正常系維持 の 4 段検証 → worktree `fix/harness-hooks-critical-3` で適用 → byte-identical 確認 → 端末 commit (essence-gate 回避) → push → **PR #4**
- **PR #4 解説 HTML**: `visualizing-as-html` pr モードで before/after diff 付き解説を生成 (`.docs/output/260615_pr-kaijutale-claude-harness-4.html`)

### 2. proposing-essence-updates skill 構築

- **plan**: `.docs/plans/2026-06-15-proposing-essence-updates.md` (8 phase + 設計決定 + リスク)
- **設計決定 (HITL)**: 収集ソース=自前ノート+Web / 主目的=陳腐化点検+不足補充 / 通知=Discord webhook / 起動=cron(~3日)
- **build (本セッション直接 Write)**: SKILL.md (Workflow型 hub) + references 5本 (collection-protocol / proposal-format / notification-spec / hitl-boundary / cron-setup) + scripts 2本 (notify_discord.sh = python3 urllib で curl/wget 回避 / collect_baseline.sh) + config.example.json
- **検証**: `quick_validate.py`「Skill is valid!」/ bash -n OK / collect_baseline が live essence の 13 原則を読込
- **配置**: gtr worktree `feat/proposing-essence-updates` (claude-harness、PR 予定)

### 3. reviewer 選定 (essence-reviewing-orchestrator に決定)

2 agent 並列調査の結論:
- **review-agent-essence**: 単一 fork (general-purpose)、基準 `agent-essence.md` (C/T/K/V/S/E 39 見出し、2026-04-05 凍結)。Goodhart=独立原則なし / HITL=断片 / citation=ゼロ。Lead 統合層なし (Lead-bias なし)。軽量
- **essence-reviewing-orchestrator**: 3 fork (harness/skill/ui) 並列 + Lead 統合。基準 essence-docs (32 原則、version 管理・継続更新の正本)。HITL(6)/Goodhart(13)/メタ再帰(8) を独立原則で持つ。Lead-bias あり (fresh session で中和)
- **判断**: orchestrator。理由 = skill の核心 (HITL境界/Goodhart耐性/citation/メタ再帰) を独立原則で評価できる唯一 + skill+harness 多領域 fit + Step 3.5 検査C が「評価基準を書き換える skill の再帰問題」を構造的に突く + authoring-skills の self-eval 契約準拠。**self-review はフレッシュセッション必須** (Lead = 実行セッション ゆえ build セッションで回すと自作物バイアスが統合層に残る)

## 重要発見 (grayzone / 非対称 / 監査の死角)

- **grep=ugrep の罠**: 監査は「BSD grep で `grep -P` 不発・絵文字検知ゼロ」と断じたが、この機では **PATH 上の `grep` が ugrep 7.5.0 (PCRE 対応)** ゆえ実際は動く = 監査の誇張。だが `/usr/bin/grep` (システム BSD grep) は `-P` 非対応ゆえ、PATH に Homebrew を含まぬ文脈では fail-open=検知ゼロが実在。**「動くものを壊れと決めつけない」検証の重要性**を実証
- **essence-docs gitignored → 既統合の二段誤認**: 当初「essence-docs を PR 提案」前提が main で成立せぬ (gitignored) と判明し依存ブロッカーと警告 → だが `chore/consolidate-essence-docs` が **PR #5 で既マージ済み**と再判明。原因は **local main が origin/main より 10 commit stale** だったこと。`git branch -f main origin/main` で同期 → feat worktree を更新後 main 起点で再作成。**stale な local 状態で読むと誤った blocker 警告を生む**
- **essence-gate self-block (chicken-and-egg)**: hook 修正の commit を、未修正の essence-gate hook が阻む。原因は stale な self-eval (5/14) の **散文「Critical 1 / High 3」(v1 apply 前の過去値) を誤読** = まさに修正対象のバグ。端末 commit (Claude 専用 hook を非経由) で回避
- **currency 混同 (要訂正)**: 13 原則・Goodhart の中身は **2026-05-24〜28 に投入** (v2.0/v2.1)。PR #5 (6/15) は essence-docs を **repo 統合 (gitignore 解除・subtree 化) した作業**で中身投入ではない。当方の時期混同を調査 agent が指摘・訂正
- **GTR_WORKTREES_DIR frozen**: Claude の tool-bash は非対話で **chpwd フックが発火せず env が launch 時値 (claude-code-learn) に frozen**。`~/.claude` から gtr new すると誤配置 → インライン env override (`GTR_WORKTREES_DIR=/Users/camone/.worktrees/.claude`) で回避 (インラインは gtr 本体には届く、hook には届かぬ点が対照的)
- **hook over-block を自分で踏んだ (監査の実証)**: ① `skill-bang-selfref-lint` が SKILL.md 内の `!`構文 prose を検出 (正当 = 自己参照トラップ防止) ② `stop_words` が「くりゃれ」(口調禁止、正当) と「追...」2文字 (部分一致誤検知、false positive) で発火。後者は監査が hook_stop_words の最大欠陥として挙げた **部分一致 over-block** そのもの。**監査で机上指摘したバグを実走で体験**

## 設計意図

- **proposing-essence-updates の HITL 境界 (④⑤ 人間・merge 禁止)** = 「AI が自分の採点基準を自分で書き換えて自分に満点をつける」Goodhart 循環崩壊の構造的歯止め。skill は PR + 通知で必ず停止
- **citation 必須** (出典遡及不能な候補は捨てる) = README が説く「無確認マージ → 幻覚原則の混入」の防止
- **reviewer = orchestrator かつ fresh session** = fork 3 体は context:fork で独立だが Lead (統合) は実行セッション。build セッションで回すと作者バイアスが統合層に残るため、Lead ごと独立させる

## 副作用 / 積み残し

- **PR #4**: レビュー待ち (fix/harness-hooks-critical-3 → main)
- **proposing-essence-updates**: 未コミット (worktree)。self-review (フレッシュセッション) → 修正 → PR化 → cron 登録 → webhook 設定 が未。handoff に記載済み
- **監査 HTML 3 枚** (260614 essence-gate / 260614 21hook / 260615 完全版) がプロジェクト repo で未 commit
- **branch/worktree 残存**: chore/consolidate-essence-docs (PR #5 マージ済) / chore/stop-words-trim-3rules の cleanup は任意
- **hook 修正の残り**: Critical 3 のみ完了。High 18 / Medium 17 / Low 22 (stop_words 部分一致 over-block 含む) は Phase 2-5 未着手

## 関連ファイル

- `/Users/camone/.worktrees/.claude/feat-proposing-essence-updates/skills/proposing-essence-updates/` — 新 skill 本体 (SKILL.md + references + scripts + config.example.json)
- `.docs/plans/2026-06-15-proposing-essence-updates.md` — skill build の plan (status: implementing)
- `.docs/plans/2026-06-15-harness-hooks-bug-fix.md` — hook 修正 plan (Phase 1 = PR #4 完了)
- `.docs/output/260615_pr-kaijutale-claude-harness-4.html` — PR #4 解説 HTML
- `.claude/handoff-state.md` — handoff (next = フレッシュセッションで orchestrator self-review)
- PR #4: https://github.com/kaijutale/claude-harness/pull/4
- 評価対象 path (self-review 用): `/Users/camone/.worktrees/.claude/feat-proposing-essence-updates/skills/proposing-essence-updates`
