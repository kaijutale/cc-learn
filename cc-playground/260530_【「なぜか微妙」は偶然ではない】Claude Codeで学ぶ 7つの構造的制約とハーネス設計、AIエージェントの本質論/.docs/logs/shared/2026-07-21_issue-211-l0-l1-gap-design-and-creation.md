---
date: 2026-07-21 11:35:42
type: work
topic: issue-211-l0-l1-gap-design-and-creation
session: 取り入れフェーズ Phase A — L0→L1 昇格トリガーの gap 発見・設計・起票
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-1.1 昇格ラダー)
related_skill: [logging, commit, handoff]
related_log_ids: [2026-07-20_v-1-1-failure-promotion-ladder-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md]
---

# issue #211 — 失敗の昇格ラダー L0→L1 捕捉トリガーの gap 発見・設計・起票

> V-1.1 深掘りから派生した「昇格ラダーで唯一機械化されていない段 = L0→L1」の gap を、**gtr の実ミスが生きた実証**として突きつけられ、rule (hook でない) による設計を固めて issue #211 として起票した Phase。read-path 原則 (Gotcha は読まれる場所に置け) がこの Phase の最大の収穫。

## 概要

V-1.1 (昇格ラダー) の深掘り中に、かいじゅうから「L0→L1 への昇格きっかけがハーネスに無いのでは」と問われ、gap を確定 → 設計 → issue #211 起票までを行った。設計途中で **あたし自身が L0→L1 の問題を実演** する事故が起き (gtr ミス)、それが issue の正当性を live で証明した。

## 内容

### gap の確定: L0→L1 は昇格ラダーで唯一機械化されていない段

- L1→L2/L3 は機械化済み (`check-gotcha-recurrence.sh` の再発計数 + `accumulating-reviewer-feedback` の HITL 昇格提案)
- **L0→L1 (口頭指摘 → Gotcha 記載) の引き金だけが未整備**。Claude が「これ前も言われた」と気づかなければ取りこぼす。L0 はセッションで揮発 = 取りこぼし = 永久消失

### なぜ hook で作れないか (3 理由)

1. **意味論**: 「同じミスか」の判定はミスの意味理解が要る → bash hook (文字列照合) では不可
2. **機械 detector 不在**: L0 のミスを機械計数するには先に detector が要る → detector がある時点で既に L2/L3 に昇格済み (鶏と卵)
3. **セッション揮発**: L0 は跨セッションで消える → 跨いで数えるには永続ストア = それを作った時点で既に L1 生成

→ 結論: L0→L1 の引き金は機械でなく **応答規律 (rule)**。全自動 capture は L1 肥大を招くため意図的にしない。既存の `check-gotcha-recurrence.sh` パイプラインに書式を揃えて流し込む (車輪の再発明をしない)。

### 生きた実証: gtr ミス (L0→L1 gap そのものを踏んだ)

- worktree 隔離起動コマンドで `git gtr go issue-211` を「作成コマンド」として渡したが、`go` は既存 worktree への移動専用。作成は `git gtr new` が先 → "Worktree not found" で失敗
- かいじゅう証言: このミスは**セッション跨ぎで 3 回以上再発**。だが各セッションは L0 揮発ゆえ、あたしは毎回「初回」と誤認していた
- **C-1 (コンテキスト帯域) + L0 揮発の合わせ技**の典型例。issue #211 が机上の空論でないことを、設計直後に本人が実演した

### read-path 原則 (この Phase 最大の収穫)

- かいじゅうの詰め:「参照してないファイルに Gotcha を置いても意味ない」→ 完全に正しい
- **昇格先は、その失敗の意思決定時に実際に読まれるファイルを選ぶ。読まれない場所への Gotcha は read-miss で無効** (載せた ≠ 読まれた。ADR-0001 と同型)
- 参照グラフ実測で裏取り: gtr ミスの読み経路は `rules/multi-agent-safety.md` (常時注入) → `harness-worktree-isolation.md §1` の **1 ホップ**。`creating-gtr-worktree` skill は §1 からの **2 ホップ目**で辿られなかった (= read-miss の発生点)
- ゆえに Gotcha 昇格先は **isolation.md §1 にインライン** (creating-gtr-worktree skill でなく)。当初「いずれか適切な方」と雑に言ったのをかいじゅうが正し、参照グラフ実測で §1 一択に確定

### issue #211 起票

- `gh issue create -R kaijutale/claude-harness` で起票 (本文は保護パス回避のため `--body-file`)。#211 OPEN を独立確認 (`gh issue view`)
- 内容: 背景 / なぜ hook でないか / 提案 (rule 1本追加・hook 増設ゼロ) / 既存機構への接続表 / 限界 (確率的・L1 相当) / read-path 原則

## 設計意図

- 「消える確率論 (L0)」→「残る確率論 (L1)」への橋を規律で架ける。決定論ガードレール化 (100%発火) は目指さない — L0 の意味論判断は本質的に確率的だから
- 昇格の是非判断は人 + LLM (HITL) に残す = 反 Goodhart。V-1.1 で確認した「再発が起きてから昇格」の規律に自分自身も従う (Semgrep issue を却下したのと同じ理由)

## 関連ファイル

- issue #211 (kaijutale/claude-harness) — 起票した gap
- `~/.claude/rules/multi-agent-safety.md` — read-path の常時注入入口 (→ isolation.md §1 を 1 ホップで指す)
- `~/.claude/.docs/progressive-disclosure/harness-worktree-isolation.md` §1 — Gotcha 昇格先 (read-path 実測で確定)
- `.docs/output/explain-in-html/260720_l0-to-l1-promotion-trigger-plan.html` — 改修方針の視覚化 (この Phase の成果物)
- `.docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md` — 派生元 (V-1.1)
