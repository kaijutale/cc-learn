---
date: 2026-07-12 17:42:00
type: study
topic: global-harness-changelog-review
session: 今日のグローバルハーネス変更履歴の確認 (260530 学習PJ、2026-07-11 レビューの続編)

related_skill: [logging, pickup]

related_log_ids: [2026-07-11_global-harness-changelog-review, 2026-07-12_issue-110-rules-paths-progressive-disclosure, 2026-07-12_issue-124-plan-output-convention-hook]
related_log: [.docs/logs/shared/2026-07-11_global-harness-changelog-review.md, ~/.claude/.docs/logs/local/2026-07-12_issue-110-rules-paths-progressive-disclosure.md, ~/.claude/.docs/logs/local/2026-07-12_issue-124-plan-output-convention-hook.md]
---

# グローバルハーネス変更履歴レビュー続編 (2026-07-11 午後〜07-12)

> **本PJ で計画した #110 (rules/ paths 化) と #124 (Tier B hook 注入) が両方とも並行セッションで実装完了・CLOSED**。Phase 0 実測が設計判断を 2 箇所上書きし (globs: 併記却下 / 測定器交換)、独立レビュー 4 巡が「是正が生んだ欠陥」2 件を摘出した。前日レビュー (2026-07-11) の続編。

## 概要

前回レビュー (7/11 12:52) 以降の `~/.claude` 変更を git log + logs/local + 現物 (gh issue / grep / wc) で実測確認 (2026-07-12 17:40)。第 2 波 (#125/#126/#137、7/11 午後) と第 3 波 (#110/#124、7/12) の 2 レーンが完走していた。

## 内容

### 1. #110 完了 (PR #143) — 本PJ 計画の実装結果

- **Phase 0 実測 5 項目確定** (canary + headless 30 回超、transcript の `nested_memory` 機械判定): (a) 起動時 載らない (b) マッチ Read で載る (c) Write 単独 載らない (d) `paths:` 有効・brace 展開可・**glob は project root 相対** (e) subagent は自読で自 context 注入 (親には来ない)
- **実測が設計を 2 箇所上書き** (Phase 0 必須ゲートの価値の実証):
  1. **`globs:` 併記は却下** — 認識されず frontmatter 無視で**常時注入化** (併記していたら削減効果消滅の逆効果を出荷するところだった)
  2. **自己申告測定は偽陰性** — canary token 報告方式は注入済みでも報告漏れ (haiku 3 回中 2 回)。transcript 機械判定へ交換
- Tier A 3 本へ paths 付与 (1 rule = 1 commit)。かいじゅう指摘起点で harness-modification-policy の paths に `CLAUDE.md` + `settings.json` を追加 (pointer 契約の頂点 + hook 配線表)
- 適用後 10 ケース + live 正負 2 ケース全通過。**起動時注入 110→97 行**。本文無改変・frontmatter のみゆえ可逆
- **Phase 3 (運用観測) は未実施のまま Close** — 不発観測時は frontmatter 削除で戻す

### 2. #124 完了 (PR #145/#148) — 鶏卵問題の hook 解決

- `hooks/hook_pre_plan_output_convention.sh` 新設: ExitPlanMode の PreToolUse で出力先規約を `additionalContext` 決定論注入 (cwd・当日日付を実行時解決した絶対パス)。非 block・fail-open・tool_input 非依存
- **独立レビュー 4 巡で High 4 件**、うち 2 件は**是正自身が生んだ欠陥**: ①liveness 計装が別の稼働センサー (emoji check) を月次報告から無言脱落させた → `decision` (執行強度) と `sensor` (集計意味論) の軸分離で解決 ②順序ゲートの述語が代理指標 (rule 本文の文字列) で、#110 の実装手段 (paths 付与 = 本文残存) を素通り — 「Goodhart を防ぐ機構自身が Goodhart」→ 述語を起動時注入状態へ差替
- **実測で覆った前提 3 件**: ①ExitPlanMode の tool_input に plan 本文は無い ②headless では ExitPlanMode 自体が露出しない (発火実測は対話のみ) ③**`CLAUDE_CONFIG_DIR` 変更で Keychain 認証は継承されない — multi-agent-safety rule の「macOS は認証 Keychain 継承」は誤り** → issue #147。隔離検証は project 側 `.claude/settings.json` (gitignored) 登録経路で代替
- 派生 issue: **#144** (経路終端の検証ゲート不在) / **#147** (Keychain 誤記修正) / **#149** (Tier B 引き継ぎ — rule 撤去は順序ゲート付き)
- **現状は帯域純増** (rule + hook 併存 4 箇所)。節約成立は #149 で rule を外してから

### 3. 第 2 波 (7/11 午後、PR #139/#140/#141)

- **#125** CLOSED: ADR `_TEMPLATE.md` を ship、列挙面に decisions/ 追加、placeholder 素通り validator 修正
- **#126** CLOSED: hook_validate_claudemd に `.docs/**.md` ポインタ検証 + 相対形警告 (#131 統合) — PD 化 CLAUDE.md のポインタ壊れ自動検出
- **#137** CLOSED: essence gate の staleness 判定を mtime → git blob 基準の二相化 (gtr worktree での全 block FP 解消)

### 4. 本PJ (260530) への影響

1. **handoff の next_phase「#110 Phase 0 着手」は再び陳腐化** — #110/#124 とも完了。260530 発の PD ワークストリーム (#94→#110→#124) は**全て実装済み**となり、残タスクはハーネス側の #144/#147/#149 と #110 Phase 3 観測
2. **本PJ の計画の答え合わせ**: v2 化で入れた「Phase 0 必須ゲート」が globs: 併記案 (v2 本文に残っていた) を実測で却下 — ゲートが無ければ逆効果を出荷していた。「原案の glob 修正 2 点 (コード全域・リポジトリ相対)」はそのまま採用された
3. **注入 ≠ 遵守**: rule が注入されてもモデルが従わない例を実測で観測 — 60 行化 Q&A (2026-07-11) の「行数はトークンと指示数の代理指標」論と同根。Phase 3 観測の主対象
4. 検証方法論の教訓: 「自己申告は偽陰性を出す → 機械証跡 (transcript attachment) で判定」— 本PJ の「合言葉方式」提案より一段強い形で実装された

## 関連ファイル

- `~/.claude/.docs/logs/local/2026-07-12_issue-110-rules-paths-progressive-disclosure.md` — #110 実装ログ (正本)
- `~/.claude/.docs/logs/local/2026-07-12_issue-124-plan-output-convention-hook.md` — #124 実装ログ (正本)
- `~/.claude/rules/{frontend-aesthetics,build-test-protocol,harness-modification-policy}.md` — paths 付与済み現物 (2026-07-12 17:40 grep 確認)
- `~/.claude/hooks/hook_pre_plan_output_convention.sh` — #124 hook 本体
- GitHub: kaijutale/claude-harness #110 #124 #125 #126 #137 (全 CLOSED、gh 実測) / OPEN 残: #144 #147 #149
- 前日レビュー: `.docs/logs/shared/2026-07-11_global-harness-changelog-review.md`
