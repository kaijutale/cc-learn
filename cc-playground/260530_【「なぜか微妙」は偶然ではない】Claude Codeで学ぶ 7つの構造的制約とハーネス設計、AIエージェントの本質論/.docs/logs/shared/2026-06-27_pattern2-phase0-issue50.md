---
date: 2026-06-27 04:34:34
type: work
topic: pattern2-phase0-issue50
session: note T-1 パターン2 分析 → issue #50 Phase 0 実装完結
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [conducting-research-phase, orchestrating-team-development, spec-based-development, enforcing-strict-tdd-cycle, handoff, logging, commit, explain-in-html]
related_log_ids: [2026-06-25_t1-separation-of-concerns-qa]
related_log: [2026-06-25_t1-separation-of-concerns-qa.md]
---

# note パターン2(Phase分離)分析 → ハーネスの欠け Phase 0 を issue #50 で補完・完結

> 前回(2026-06-25)T-1 質疑(パターン1=実装済み)の続編。パターン2 の唯一の欠け=Phase 0(調査→research.md)を特定し、claude-harness issue #50 として実装→レビュー2本→PR #51 マージ→後始末まで完結。ハーネスは記事パターン2 を完全実装した。

## 概要

記事 260405「T-1 関心ごとの分離」のパターン2「Phase分離による逐次分割」(調査→設計→実装→検証)を、かいじゅうのハーネスと照合。Phase 1-3 は実装済み、**Phase 0(調査→research.md)のみが欠け**ていた。この欠けを対話で特定 → ハーネス改修 issue #50 化 → 実装支援 → 完結まで伴走した記録。

## 内容

### 分析フェーズ(対話で特定)

- パターン2 の4 Phase とハーネスを5層(調査/仕様/設計/実装/検証)で照合
- Phase 1-3(spec策定→実装→検証)は `orchestrating-team-development` が束ねて実装済み。`enforcing-strict-tdd-cycle` は spec.md だけ読む構造で「実装は設計だけ」が成立済
- `orchestrating-team-development` は起動すると Execution Mode 選択 → spec策定から始まり、**調査(research.md)フェーズを持たない**(SKILL.md 一次確認)
- 欠けは「調査の独立ファイル化 research.md」と「調査↔設計の2段分離」のみ

### 実装フェーズ(issue #50 → PR #51、worktree の別 Claude が実施)

- worktree 隔離: ハーネス改修ゆえ plain worktree では不十分、`CLAUDE_CONFIG_DIR=<worktree> claude` で設定dir化して初めて隔離
- 案B 確定(担い手): **所有=オーケストレーター**(発火判断・統合判断 T-2.3)、**読み手=spec-based-development**(research.md を前提資料として読む)。案A(spec係を担い手)却下=統合判断を末端に押し込む / 案C(新設計skill)却下=肥大化
- 新規 `conducting-research-phase`: 重い調査を subagent委譲 or read-only 規律で実施 → `.docs/research/<topic>.md`(facts only、設計判断は出力契約で排除)、親へは要約のみ。発火は重い調査限定(軽いは Explore/メイン都度=過剰分割防止)
- レビュー2本(harness-essentials + skill-essentials)で High 1 + Medium 6 を修正
- PR #51 squash マージ(`b58e0a2`)→ 本体反映 → ログ commit(`bfcb96a`)→ worktree 撤収(`--force`、全保全 verify 済)

## 設計意図

- **案B の核心**: 「research.md を読んで何が spec に効くか」は統合判断 → オーケストレーターが所有(`orchestrating-team-development` の「統合の主体は team-* に委譲しない」と整合)。読む作業だけ spec-based-development に残し、判断権を中枢に引き上げた
- **Plan Mode は調査の手段の1つに過ぎず、本筋は context 隔離**(subagent/read-only)。記事 Phase 0 の「Plan Mode: 実行系無効」を、より本質的な「生データを子に隔離+要約だけ返す」で実装(260426 典拠)
- **後方互換 opt-in**: research.md 不在時は既存フロー byte-identical

## 副作用(重要な学び — 観測した失敗/非対称性)

- **第一版に契約破壊が潜んでいた**: research.md frontmatter が `validate-knowledge.py` を破壊(type欠落/status enum外)、しかも SKILL.md が「整合」と虚偽記載 → 独立レビュー2本が捕捉 → 既存スキーマ準拠(validator 非改修=契約ゼロ変更)で修正、実機 exit 0 実証。教訓: **「動く」≠「契約を壊さない」**。検証せず断言しない
- **仕様(spec=WHAT)と設計(plan=HOW)は別物**: ハーネスの spec.md は仕様+設計のハイブリッド、記事の plan.md は設計のみ。「記事 plan.md = spec.md」は不正確(重なるのは設計部分だけ)。ハーネスは上流を「仕様」に畳む流儀、記事は「調査/設計」に割る流儀
- **「読む」と「所有」の動詞区別**: research.md を読むのは spec-based-development、所有(発火・統合判断)はオーケストレーター。HTML 解説の「案B=オーケストレーターが所有」の見出しだけ見て「読むのもオーケストレーター」と混同しやすいが、本文は2つを分けている
- **squash マージの worktree 撤収**: 固有 commit が hash 相違で「未マージ」に見えるが内容は本体入り。`gtr rm` は untracked で停止(安全弁)→ 全保全 verify 後 `--force`

## 関連ファイル

- `.docs/logs/shared/2026-06-25_t1-separation-of-concerns-qa.md` — 前回 T-1 質疑ログ(パターン1=実装済み確認)、本ログの前編
- `.docs/references/sources/pdf/260405_…本質論.pdf` — 記事本体、パターン2 は p52
- `.docs/output/explain-in-html/260626_issue-50-phase0-research-before-after.html` — Before/After 解説(cc-learn 退避分)
- `.docs/output/explain-in-html/260627_research-md-owner-vs-reader.html` — 「読む vs 所有」解説(cc-learn 退避分)
- claude-harness(参考、別リポ): PR #51 / issue #50 / `skills/conducting-research-phase/SKILL.md` / merge `b58e0a2` / log commit `bfcb96a`
