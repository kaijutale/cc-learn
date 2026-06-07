---
date: 2026-06-07 03:47:04
type: work
topic: c4-failure-path-prep-and-gate-concepts
session: C-4 failure path 検証の準備 + ゲート概念の整理
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, handoff, logging, coder, verify-test-fork]
related_plan_id: 2026-06-02-external-verifier-gap-closure
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_log_ids:
  - 2026-06-06_c4-root-fix-agent-reverification
  - 2026-06-02_c4-external-verifier-e2e-session
related_log:
  - .docs/logs/shared/2026-06-06_c4-root-fix-agent-reverification.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-session.md
---

# C-4 failure path 検証の準備 + ゲート概念の整理

> failure path (失敗系) 検証を別セッションで回せるよう c4-e2e-sandbox に指示書 (RUN-ME.md F2+F1+F4) と roundHalfEven spec を仕込み。併せて「ズル対策の本質 = 判断しない機械のゲート」を Q&A で整理し、理解用 HTML 2 本を生成。

## 概要

- C-4 end-to-end 検証の残り = agent層 failure path。これを別セッションで実行できるよう準備した (実行自体は cwd 制約で別セッション必須)。
- 並行して、かいじゅうとの Q&A で「failure path で何を・なぜ検証するか」の概念を整理。理解用 HTML 解説 2 本を生成。

## 内容

### 1. 準備した検証一式 (c4-e2e-sandbox)

- `RUN-ME.md` を **failure path 版 (F2+F1+F4, 155行)** に置換。別セッションの Claude が読んで実行する指示書。
- `.docs/specs/CURRENT/spec.md` を **roundHalfEven (銀行丸め)** に差し替え (F1 誘発用)。旧 add spec は `.docs/specs/BACKUP/spec-add.md` へ退避。
- sandbox 状態: clean RED (src/lib 空) / `.git` 無し (monorepo 配下バグ条件=root回帰も同時確認) / vitest+coverage-v8 導入済 / monorepo 頂点クリーン (汚染ベースライン)。
- 検証3本の設計:
  - **F2 (改ざんBLOCK・手動再現・C-4核心)**: red-test→`--record`→テスト改ざん(MODIFIED/DELETED)→偽GREEN→`--baseline` で TAMPERED exit1。対照(無改ざん→exit0)で gate の選択性も確認。
  - **F1 (調整ループ+llm-debate・自律)**: 本物の coder に roundHalfEven を解かせ、初回最小実装が `2.5→2` を外す→verify FAIL→Loop2 で llm-debate 自律発火、を観察。1周GREENなら spec厳格化/seed フォールバック。
  - **F4 (カバレッジ不足・任意)**: under-tested 実装で coverage exit1 → 非ブロック報告。

### 2. 理解用 HTML 解説 2 本

- `260606_c4-failure-path-verification.html` — failure path で何をしようとしているか (自動運転の例え、F1/F2/F4)。
- `260607_c4-5-gates-and-anomalies.html` — 異常時とは (coderが立て直す系 vs ゲートが弾く系) + 5ゲートを1つずつ + 異常→ゲート早見表。

### 3. 概念整理 (Q&A で深掘りした本質)

- **ズル (F2) = 報酬ハッキング = LLM が「合理的な理由」でルールを迂回する現象への対策**。「実装を直すより、テストを緩める方が早い (合理的)」でゲートを抜こうとする。かいじゅう自身の `rules/decisive-answers.md`「合理的に見える理由でルールを迂回する→迂回経路そのものを塞ぐ」と **同型**。
- **失敗 (F1/F4) ≠ ズル**。F1=一発で解けない(能力・試行)、F4=網羅不足。これは"迂回"でなく"未達"で、coder の自己修正 (立て直し) の領分。failure path は「ズル対策(F2)」と「立て直し(F1/F4)」の2系統が混ざる。
- **対策の2段構え**:
  1. 主体の分離 (別コンテキスト subagent に検証させる) = 身内びいき (実装バイアス) を断つ。
  2. **機械のゲート (LLMでない oracle スクリプト) が物理事実で判定** = 自己申告そのものを塞ぐ。← F2/C-4 の本丸。
- **「別 subagent に評価させる」だけでは不十分**: subagent も LLM → 改ざんテストを実行すれば素直に「通った」と報告 → 偽GREEN を見逃す。LLM に LLM をチェックさせると **自己申告の連鎖**。だから最後は非LLMの機械で塞ぐ。
- **「見張り役」より「ゲート」が正確**: ゲートは判断しない。条件 (物理事実) を満たすかで機械的に開閉 (exit 0/1)。判断しないからこそ買収・忖度・合理的迂回が効かない。空港の金属探知機 (人の警備員でなく) の比喩。coder が自分でゲートを通る (呼ぶ) が、合否は機械が下すので自己申告にならない。
- **ゲートの限界**: ゲート化できるのは「正解が客観的に判定できる工程」(git hash, 数値, import解析) だけ。設計の良し悪し・美学などの意味的判断はゲート化不能 → LLMレビュー/人間 (HITL) の領分。

## 設計意図

- **roundHalfEven を F1 に選んだ理由**: 曖昧さでなく「明示的だが最小実装が踏み外しやすい厳密要件」で Loop2 突入確率を上げる。`Math.round(2.5)===3` vs spec `2.5→2` で初回実装が必ず外す設計。
- **F2 を手動再現にする理由**: coder は一気通貫で走り自分でテスト改ざんしない。改ざんは「baseline記録後〜GREEN照合前」の外部事象なので純自律では誘発不可。誇張せず手動と明記。
- **後始末を「掃除しない・痕跡保全」にした理由**: 前回 (2026-06-06 root再検証) coder が clean RED 掃除して親の独立再検証を阻害した教訓。

## 副作用 / 残課題

- failure path 本体は **未実行** (別セッション)。結果は handoff frontmatter で持ち帰り → メインが合否判定。
- ~/.claude の root 修正 (coder.md/verify-test-fork) と このPJのログ/HTML は未commit (kaiju 依頼時のみ)。

## 関連ファイル

- `c4-e2e-sandbox/RUN-ME.md` — failure path 検証指示書 (F2+F1+F4)
- `c4-e2e-sandbox/.docs/specs/CURRENT/spec.md` — roundHalfEven (F1用) / `BACKUP/spec-add.md` — add 退避
- `.docs/output/explain-in-html/260606_c4-failure-path-verification.html`
- `.docs/output/explain-in-html/260607_c4-5-gates-and-anomalies.html`
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/` — oracle 群 (検証対象、変更なし)
- `.claude/handoff-state.md` — 本セッション末の状態
