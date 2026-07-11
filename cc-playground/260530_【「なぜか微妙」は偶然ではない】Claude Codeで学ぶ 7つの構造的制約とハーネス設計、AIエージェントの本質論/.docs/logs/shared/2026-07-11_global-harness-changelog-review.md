---
date: 2026-07-11 12:52:26
type: study
topic: global-harness-changelog-review
session: グローバルハーネス変更履歴の確認 (260530 学習PJ セッション)

related_skill: [logging, pickup]

related_log_ids: [2026-07-09_rules-progressive-disclosure-plan, 2026-07-10_issue-94-claude-md-progressive-disclosure]
related_log: [.docs/logs/shared/2026-07-09_rules-progressive-disclosure-plan.md, ~/.claude/.docs/logs/local/2026-07-10_issue-94-claude-md-progressive-disclosure.md]
---

# グローバルハーネス変更履歴レビュー (2026-06-27〜07-11)

> `~/.claude` の直近 2 週間を git log + `.docs/logs/local/` で実測確認。**#94 (CLAUDE.md 60行化) は並行セッションで完了・本体反映済み**。本PJ handoff の「次: #94 着手」は陳腐化し、次アクションは #110 Phase 0 へ直行に変わった。

## 概要

かいじゅう指示で `~/.claude/.docs/logs/` のグローバルスコープ変更履歴を確認。ハーネス側は 2026-07-09〜11 に worktree 並列セッションで大量の issue を消化しており、本PJ (260530) 側の前提が複数更新されていた。すべて `git -C ~/.claude log` / `gh issue view` / `wc -l` / `ls` の実測で裏取り済み (2026-07-11 12:45 頃)。

## 内容

### 1. #94 完了 — CLAUDE.md Progressive Disclosure (最重要)

- **PR #123 マージ済み (2026-07-10)、#94 CLOSED、本体反映済み** (実測: `wc -l ~/.claude/CLAUDE.md` = 60)
- 112→60 行のポインタ型へ圧縮 (K-2.1)。憲法 5 節 verbatim 保持、詳細は `.docs/progressive-disclosure/` 5 ファイル新設 (git-workflow / tool-routing / agent-protocol / secrets-model / harness-policy)
- ハーネス初 ADR `0001-claude-md-detail-placement.md` (.docs/ 直接ポインタ採用 / rules/ 経由却下)
- 独立レビュー (code-reviewer, フレッシュコンテキスト): CONDITIONAL→GO。レビュアーのパッチ数え漏れを coordinator 検算で検出、C1 の「実在しない承認」(捏造) を棄却しつつ指摘の事実は採用 —「報告の根拠」と「指摘の事実」の分離裁定
- 全 33 ルール脱落ゼロを識別語の機械照合で検証

### 2. #94 の後続 issue 群

| issue | 状態 | 内容 |
|---|---|---|
| #125 | OPEN | ADR テンプレ未整備 drift (establishing-knowledge-persistence の三重ズレ) |
| #126 | OPEN | hook_validate_claudemd に .docs/ ポインタ検証を追加 (レビュー D1) |
| #127 | CLOSED | マージ後検証 — 検証1 (起動時注入の実減) 3/3 PASS / 検証2 (想起プローブ) で Docs系 A1 **read-miss FAIL 確定** → #131 で修正 |
| #131 | CLOSED | References 6 ポインタを repo 相対 → `~/.claude/` 絶対形へ (他PJ cwd での read-miss 解消) |

### 3. 並行 worktree バッチ (2026-07-11, PR #134/#135/#136 マージ)

- **#128** (CLOSED): stop-words 口調禁止の裸「たも」が「〜たもの」に部分一致で誤発火 → 修正
- **#130** (CLOSED): `hook_pre_worktree_bash_write_guard.sh` に**実行 bit が無く登録済みのまま空回り (fail-open) を実測** → 修正 + 登録 script 実行 bit の機械チェックを test に追加
- **#131** (CLOSED): 上記

### 4. その他の変更

- **#93** (CLOSED, 7/9): probe-before-persist rule + persist 時 hook — 本PJ の 7/10 handoff 書き出し時にも発火を実観測済み。rules/ は **11本116行** に増加 (paths ゼロのまま)
- **#86 由来**: logging skill に「プロジェクト CLAUDE.md の断定形配置指定 → override」契約が正式反映 (本ログが shared/ 直書きである根拠)
- **command-handoff rule 改訂** (7/11 かいじゅうFB): 受け渡し書式を 🎁 マーカー + ===== 境界形へ、placeholder 形式化 (コピー範囲不明瞭の再発防止)
- **#77** (PR #122): empirical tuning レビュー改修 / **#98/#82/#83/#84** 等も 7/9 に並行消化
- settings: model を `claude-fable-5[1m]` へ切替。gitignore: .DS_Store 全階層無視

### 5. 本PJ (260530) への影響 — 前提の更新

1. **handoff の next_phase「#94 着手」は陳腐化** → 次アクションは **#110 Phase 0 (canary 実測) へ直行**
2. **#127 検証2 が #110 Phase 0 の先行実例**: read-miss を「挙動指紋」で立証する方法論 (ダミー repo 単独測定・汚染なし新セッション) が確立済み — Phase 0 設計で再利用可能
3. **#130 の教訓が #124 設計に直結**: hook は実行 bit 欠落で fail-open に沈黙する — #124 (Tier B hook 併用) 実装時は機械チェック必須
4. **#110 の実装環境が変化**: CLAUDE.md 60行版 + PD 層が本体反映済みのため、rules/ paths 化は「PD 体系の第 2 弾」として素直に接続する

### 学び (ハーネス側ログから継承)

- **伝達チャネルの実測** (#94 ログ): worktree セッションから将来セッションへ確実に届く機械可読チャネルは **GitHub issue のみ** (PR コメントは自動では届かない、handoff は gitignored + 本体書込 guard 対象)
- **hook 決定論の実演** (#94 ログ): stop-words hook は「引用」文脈でも発火 = 決定論 gate は使用/言及を区別しない。それが迂回合理化を許さぬ強み

## 関連ファイル

- `~/.claude/.docs/logs/local/2026-07-10_issue-94-claude-md-progressive-disclosure.md` — #94 実装ログ (正本)
- `~/.claude/.docs/logs/local/2026-07-11_issue-{128,130,131}-*.md` — 並行バッチの work ログ 3 件
- `~/.claude/.docs/decisions/0001-claude-md-detail-placement.md` — ハーネス初 ADR
- `~/.claude/.docs/progressive-disclosure/` — PD 詳細層 (10 ファイル: #94 新設 5 + rules/ 既存 PD 5)
- `.claude/handoff-state.md` — 本PJ handoff (next_phase 要更新: #94 着手 → #110 Phase 0)
- GitHub: kaijutale/claude-harness #94/#123 (merged) / #125 #126 #110 #124 (OPEN) / #127 #128 #130 #131 (CLOSED)
