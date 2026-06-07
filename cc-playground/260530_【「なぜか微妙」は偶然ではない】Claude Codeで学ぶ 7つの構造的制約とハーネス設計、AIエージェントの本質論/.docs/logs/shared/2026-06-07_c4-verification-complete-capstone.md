---
date: 2026-06-07 08:31:48
type: work
topic: c4-verification-complete-capstone
session: C-4 外部検証器 end-to-end 検証 全完了 capstone (全レイヤー索引 + 最終判定)
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [coder, verify-test-fork, enforcing-strict-tdd-cycle, llm-debate, explain-in-html, handoff, logging]
related_plan_id: 2026-06-02-external-verifier-gap-closure
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_log_ids:
  - 2026-06-02_c4-external-verifier-audit-and-plan
  - 2026-06-02_c4-external-verifier-implementation
  - 2026-06-02_c4-external-verifier-e2e-oracle-walkthrough
  - 2026-06-02_c4-external-verifier-e2e-session
  - 2026-06-05_c4-root-resolution-fix
  - 2026-06-06_c4-root-fix-agent-reverification
  - 2026-06-07_c4-failure-path-prep-and-gate-concepts
  - 2026-06-07_c4-failure-path-verification-results
related_log:
  - .docs/logs/shared/2026-06-02_c4-external-verifier-audit-and-plan.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-implementation.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-oracle-walkthrough.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-session.md
  - .docs/logs/shared/2026-06-05_c4-root-resolution-fix.md
  - .docs/logs/shared/2026-06-06_c4-root-fix-agent-reverification.md
  - .docs/logs/shared/2026-06-07_c4-failure-path-prep-and-gate-concepts.md
  - .docs/logs/shared/2026-06-07_c4-failure-path-verification-results.md
---

# C-4 外部検証器 end-to-end 検証 — 全完了 capstone

> C-4「自己申告は完了の証拠にならない」対策の外部検証器 (oracle 群 + coder/verify-test-fork 配線) を、4レイヤーで実機検証し全完了。本ログは各レイヤーの最終判定 + 構成ログへの索引 + 概念学びの集約 (未来の自分の入口)。

## 概要

- 対象: `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` の検証器5本 (assert-tests-unchanged / assert-coverage / assert-no-cycles / record-loop-iteration / assert-loop-budget) と、それを呼ぶ `~/.claude/agents/coder.md` + `~/.claude/skills/verify-test-fork/SKILL.md` の配線。
- ゴール: 「coder の自己申告でなく、捏造不能な物理事実 (git hash / カバレッジ数値 / import グラフ / ループ台帳) で完了を gate する」が、**実機で機能するか** を end-to-end 検証する。
- 結果: **全レイヤー PASS = C-4 end-to-end COMPLETE**。

## 内容

### 最終判定 (レイヤー別)

| レイヤー | 判定 | 何を確認したか | 構成ログ |
|---|---|---|---|
| oracle層 | ✅ PASS | 検証器5本が pass=0 / 違反=1 / fail-closed=2 を実プロジェクトで両方向実証 | e2e-oracle-walkthrough / e2e-session |
| agent層 happy path | ✅ PASS | coder が自律で検証器を発火、親が物理痕跡+再実行で独立裏取り (falsy GREEN でない) | e2e-session |
| root課題(M) 修正 | ✅ FIXED & AGENT-VERIFIED | coder.md 5箇所+verify-test-fork に `--root="{WORK_DIR}"` 注入。monorepo配下バグ条件で実 coder を回し頂点非汚染を実証 | root-resolution-fix / root-fix-agent-reverification |
| agent層 failure path | ✅ PASS (3/3) | F2改ざんBLOCK(手動再現) / F1調整ループ+llm-debate(seed半手動) / F4カバレッジ非ブロック。メインが独立突合 | failure-path-prep-and-gate-concepts / failure-path-verification-results |

### この検証スレッドで起きた重要イベント

1. **実装(前提)**: 検証器5本 + lib + tests/fixtures + 配線。oracle 55ケース実機 PASS。
2. **oracle層 walk-through**: 検証器単体を実プロジェクトで pass/gate 両方向確認。
3. **agent層 happy path**: 別セッションで coder 実起動 → 自律発火を独立裏取り。
4. **root課題(M) 発見→修正→再検証**: end-to-end 検証が「coder が `--root` を渡さず monorepo配下で git-toplevel 誤解決する」設計課題を炙り出し → `--root="{WORK_DIR}"` 注入で根本修正 → 実 coder で monorepo非汚染を実証 (バグ修正は harness-modification-policy 上許容、後方互換)。
5. **failure path**: F2/F1/F4 を別セッションで実機検証、メインが物理痕跡+独立再走で PASS(3/3) 確定。

### 概念学び (なぜ C-4 が効くか)

- **ズル = 報酬ハッキング = LLM が「合理的な理由」でルールを迂回する現象**。「実装を直すよりテストを緩める方が早い (合理的)」で gate を抜こうとする。`rules/decisive-answers.md`「迂回経路そのものを塞ぐ」と同型。
- **対策の本丸 = 判断しない機械のゲート**。別 subagent (LLM) に検証させても、改ざんテストを実行すれば素直に「通った」と報告 → 自己申告の連鎖。最後は **LLMでない検証スクリプトが物理事実で開閉** (exit 0/1) して塞ぐ。「見張り役」でなく「金属探知機(ゲート)」。
- **ゲート化の限界**: 客観判定できる工程 (hash/数値/import) だけ。意味的判断 (設計の良し悪し/美学) はゲート化不能 → LLMレビュー/HITL の領分。
- **失敗(F1/F4) ≠ ズル(F2)**: F1/F4 は "未達" で coder の自己修正の領分、F2 は "不正" で gate の領分。failure path は両系統を含む。
- **ゲートは実装者自身のミスも捕まえる**: F1 で coder の loop-budget 監査が自分の state 混在を true-positive 検出→自己是正した実例。

### 留保 (誇張せず記録)

- F1 の Loop2 突入は **seed による半手動誘発** (純自律では roundHalfEven を1周GREENで解決 = coder が賢い)。
- F2 は構造上 **手動再現** (coder は自分でテスト改ざんしないため、検証者が人為注入)。
- F2 の改ざん検出 fresh 再走はメインでは未 (evidence のパス不一致)。red-baseline 実SHA + TRANSCRIPT 整合 + 既実証 oracle で高信頼確認。

## 設計意図 (この検証運用から得た再利用知)

- **検証セッションは掃除しない・痕跡保全**: 1回目 (root再検証) は coder が clean RED 掃除して親の独立再検証を阻害 → 2回目 (failure path) は evidence/ 保全を RUN-ME に明記 → メインが独立突合できた。
- **別セッション報告はファイル経由**: 長文チャットでなく log/handoff に書いてパス渡し→読ませる (memory: report-via-file-not-chat-dump)。
- **検証用 sandbox は作業PJ内**: $HOME 直下は乖離+揮発で消えた → PJ直下 + git init で root 問題回避 (memory: verification-artifacts-in-project)。

## 副作用 / 残課題 (任意)

- sandbox (c4-e2e-sandbox) を次ラウンド前に clean RED 復帰 (working src/lib に F4 footprint 残置)。
- RUN-ME(b) の DELETED 経路文言を改訂 (ファイル内ケース削除=MODIFIED 扱いの注記)。
- 未commit 整理 (kaiju 依頼時): ~/.claude (root修正、非gitリポ=ディスク上) + 本PJ (.gitignore + ログ8本 + HTML5本)。

## 関連ファイル

- `~/.claude/agents/coder.md` — Step5 で検証器発火 (root修正済)
- `~/.claude/skills/verify-test-fork/SKILL.md` — 可視化 --baseline (root修正済)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` — 検証器5本 + lib + tests
- `c4-e2e-sandbox/` — 検証用 sandbox (.docs/evidence/ に F1/F2/F4 痕跡保全)
- 上記 related_log 8本 — 各フェーズ詳細
- `.claude/handoff-state.md` — status=completed
