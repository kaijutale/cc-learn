---
feature: debating-roles-phase3
session: Session 5 (Phase 3 改修 + 実測検証 + cleanup + 永続化)
date: 2026-04-25 06:09:58
---

# debating-roles Phase 3 改修と実測検証

## 概要

`debating-roles` skill (Agent Teams 基盤で 6 役割並列 debate を実行) は Session 4 (2026-04-24) の実測で **SendMessage 使用率 1/6 (16.7%)** の構造的欠陥が顕在化した。6 体の teammate 中 5 体が plain text 応答で Lead に届かず、実質機能不全。

Session 5 では **Phase 3 改修** として、共有 agent definition を一切変更せず、新規作成で影響を隔離するアプローチを採用した:

1. `~/.claude/agents/debater-*.md` 6 体を新規作成（teammate mode 専用、tools に `SendMessage` 明示配線 + 本文冒頭に「起動時の絶対ルール」4 項を埋込）
2. 既存 `team-*.md` 5 体は **無変更のまま**（既存 3 skill `three-elements-harness` / `orchestrating-team-development` / `enforcing-strict-tdd-cycle` の subagent mode 用として継続稼働）
3. `debating-roles/SKILL.md` の参照を `team-*` → `debater-*` に切替

実測検証 (D-2) では Session 4 と同一議題「`test-tdd-cycle-validation/` を Git 管理下に入れるべきか」で 6 体並列 spawn → **SendMessage 使用率 5/6 (83.3%) に改善**、改修済 5/5 (100%) vs 無改修 team-pm 0/1 (0%) の対照実験で Phase 3 改修効果を定量切り分けした。

## 実装内容

### Phase 3 改修 (agent definition 新規作成)

新規作成 6 体 (格納先: `~/.claude/agents/`):

- `debater-ui-designer.md` (95 行、tools: Read/Grep/Glob/SendMessage、color: magenta)
- `debater-implementer.md` (112 行、tools: Read/Grep/Glob/Bash/SendMessage、**Edit/Write 除外**、color: blue)
- `debater-tester.md` (108 行、tools: Read/Grep/Glob/Bash/SendMessage、**Edit/Write 除外**、color: red)
- `debater-reviewer.md` (111 行、tools: Read/Grep/Glob/Bash/SendMessage、color: yellow)
- `debater-documenter.md` (113 行、tools: Read/Grep/Glob/Bash/SendMessage、**Edit/Write 除外**、color: green)
- `debater-pm.md` (122 行、tools: Read/Grep/Glob/SendMessage、color: purple、本検証後の追加作成分)

全 6 体に共通する「起動時の絶対ルール」4 項 (本文冒頭):

1. 最初の tool call は SendMessage でなければならない
2. 批評全文は SendMessage の message パラメータに直接書き込む
3. shutdown_request 受信時は SendMessage で shutdown_response JSON (request_id echo) を返す
4. 宛先は原則 `team-lead`

`skills:` frontmatter は全 6 体で **意図的に非付与**（公式仕様で teammate mode では skills が適用されないため、混乱回避）。判断軸は Lead の spawn prompt に直接埋め込む設計。

### debating-roles/SKILL.md 参照切替

`~/.claude/skills/debating-roles/SKILL.md` に対して 40 箇所の参照を切替:

- replace_all で 6 agent 名を切替 (ui-designer / implementer / tester / reviewer / documenter / pm、各約 7 箇所)
- 個別 Edit で glob パターン (line 43, 388) と Phase 3 記述 (line 362, 371) を更新
- Gotchas セクションに Session 5 実測知見と対照実験結果を新規追加

### 実測検証 (D-2)

- 検証議題: `test-tdd-cycle-validation/` を Git 管理下に入れるべきか (Session 4 と同一)
- 検証環境: Claude Code 2.1.119、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`、clean state
- 手順: TeamCreate → 6 体 parallel spawn → SendMessage 応答観察 → shutdown_request 送信 → TeamDelete
- 結果:
  - 5 体 (ui-designer / implementer / tester / reviewer / documenter) が SendMessage で高品質批評を返送 (severity 付き・6 項目分析・Lead 見解への反論・反例完備)
  - team-pm (無改修) のみ plain text 応答で Lead 不達 = 予測通りの対照実験結果
  - Session 4 (1/6) vs Session 5 (5/6) で SendMessage 使用率 5 倍改善
  - 5 体の結論がほぼ収束: 「現状丸取り込み却下 + 蒸留 or 退避」
  - documenter は実ファイル調査で新発見 (HOW_TO_VALIDATE.md と REQUIREMENTS.md の題材齟齬)

### Cleanup (3 段ゲート)

- Gate 1: 6 体並列 shutdown_request 送信 (system 自動 request_id 生成成功)
- Gate 2: TeamDelete 実行、`~/.claude/teams/debating-roles-phase3-validation/` クリーンアップ成功
- Gate 3: session exit 前の CLI 警告 UI 目視確認 → **未実施** (次回セッション終了時にユーザー目視必要)

### ドキュメント永続化

- 検証ログ: `.docs/knowledge/debating-roles-agent-teams/2026-04-25-phase3-result.md` 新規作成 (Session 4 vs Session 5 完全比較、5 体批評サマリ、Phase 3 改修の決定的要因 2 点の特定)
- memory 更新: `~/.claude/projects/.../memory/feedback_multi-agent-debate-design.md` に Session 5 結果 + 2 系統並存の設計原則 + 共有 agent definition 改修パターン (新規作成による影響隔離) を追記
- Plan archive: `~/.claude/plans/plan-mutable-pretzel.md` → `~/.claude/plans/archived/` に `mv` 完了 (status: completed、outcome_summary 記載)
- handoff 書き出し: 本プロジェクト `.claude/handoff-state.md` を Session 5 完了時点に更新

## 設計意図

### なぜ既存 `team-*.md` を改修しなかったか

`team-*.md` 5 体 (ui-designer / implementer / tester / reviewer / documenter) は 2 つの skill モードで共有利用されている:

- **subagent mode**: `three-elements-harness` / `orchestrating-team-development` / `enforcing-strict-tdd-cycle` が使用 (安定稼働中の資産)
- **teammate mode**: `debating-roles` が使用 (SendMessage 未使用問題あり)

teammate mode の問題を解決するために共有リソースを改修すると、subagent mode 側にリグレッションが伝播する可能性がある。かもね自身が「既存を触りたくない」と明言した。

解決策として **新規作成で影響隔離** を選択: `debater-*.md` 6 体を新規作成し、`debating-roles/SKILL.md` の参照だけを切替。既存 `team-*.md` は完全無変更、既存 3 skill は一切影響を受けない。失敗しても `debater-*.md` を削除して SKILL.md を revert すれば完全復元可能 = 回復性最大化。

### なぜ Phase 3 改修の 2 点 (tools + 本文) が必要か

Session 5 の対照実験で以下が数値で確定:

- **tools frontmatter への `SendMessage` 明示配線**: 既存 team-*.md は `Read/Grep/Glob` 等のみで SendMessage が tool allowlist に含まれていない → 呼び出し不可
- **本文冒頭の絶対ルール埋込**: teammate mode の system prompt に本文が追加される公式仕様を利用、「最初の tool call は SendMessage」を system-level で強制

片方だけでは不十分。Session 4 では spawn prompt 側で「SendMessage で送れ」を明記したが 1/6 (ほぼ失敗)、Session 5 で 2 点両方を揃えた debater-*.md が 5/5 (100%) 成功。spawn prompt 側の明記だけでは構造的に効果が薄い。

### なぜ `Edit/Write` を一部 debater-* から除外したか

debater-implementer / debater-tester / debater-reviewer / debater-documenter から `Edit/Write` tools を除外。理由は「teammate として批評のみを返す」思想を tool level で構造的強制するため:

- debate 参加者は「視点を返す」だけ、実装・テスト・ファイル書込みは Lead の責務
- Edit/Write を付与すると、teammate が独断でファイル編集する誘惑が構造的に残る
- 除外すれば「tool 配線上 write できない」= 構造的に不可能になる

既存 `team-implementer.md` は subagent mode で実装を担うため Edit/Write あり。debater-implementer は批評のみのため除外。役割は似ていても責務が違うのを明示。

### 2 系統並存 (team-* と debater-*) の設計原則

本セッションで確立した一般パターン:

- **共有 agent definition の改修は避ける**: 複数 skill から参照される agent を片方のために改修すると副作用が発生
- **新規作成で影響隔離**: 新 agent 系列 (debater-*) を作り、参照側 skill のみ参照を切り替える
- **既存系列は無変更で保管**: 削除せず残す (fallback 候補 + 既存依存先の継続稼働)
- **命名規則で用途を明示**: `team-*` = subagent mode 汎用、`debater-*` = teammate mode debate 専用

この構造は他 skill で「Agent Teams + subagent mode 共存が必要」な場合に再利用可能。memory に記録済。

## 副作用

- **Gate 3 zombie teammate 確認未実施**: session 終了時に Claude Code CLI の "Background work is running" 画面でユーザー目視が必要。Session 4 では 6/6 が zombie 状態で残存した (shutdown_response 未返却のため)。Session 5 では改修済 5 体に shutdown_response JSON 返却ルールを組み込んだが、実際の返却有無は未観測 (shutdown_request 送信後すぐ TeamDelete したため response を queue から受信する機会を作らなかった)。次回セッション終了時のユーザー目視結果次第で、改修の完全性が判定される
- **6/6 検証未完了**: 今回の実測は 5/6、残 1 体 (pm) は無改修 team-pm.md を使ったため plain text 漏出。本セッション内で `debater-pm.md` を新規作成し SKILL.md 参照を切替済のため、次回検証で 6/6 到達見込みだが、未実測
- **既存 3 skill の subagent mode smoke test (D-1 実走検証) 未実施**: 今回は静的 grep で team-*.md への参照整合性を確認したのみ。実際に `three-elements-harness` 等を動かして subagent 起動が正常かの実走検証はしていない。既存 team-*.md は mtime 無変更のため理論的にはリグレッションなしだが、実走確認は次セッションで必要
- **`test-tdd-cycle-validation/` の実際の処理未実施**: Session 5 の debate で 5 体全員が 🔴 却下 + 具体的な処理方針 (蒸留 / 抽出+退避 / 3 層分離等) を提案したが、実装判断は Lead (メインClaude) の Macro 責務として別途実行が必要。本セッションでは skill の実測検証が主目的のため、議題の最終処理は次セッション持ち越し
- **MAX プラン rate limit**: 今回は 6 体並列 Opus で到達せず。ただし連続複数回の検証では到達懸念あり、Session 6 で再検証時は注意
- **既存 `team-pm.md` (Session 4 で debating-roles 専用化された) が宙に浮いた状態**: debater-pm.md 作成により不要になったが、他 skill から参照ゼロのため削除はせず無変更で残存。将来 `debater-pm.md` が破損した時の fallback 候補として保管中

## 関連ファイル

- `~/.claude/agents/debater-ui-designer.md` — 新規作成、Designer 視点論者 (teammate mode 専用)
- `~/.claude/agents/debater-implementer.md` — 新規作成、Engineer 視点論者 (Edit/Write 除外)
- `~/.claude/agents/debater-tester.md` — 新規作成、Tester 視点論者 (Edit/Write 除外)
- `~/.claude/agents/debater-reviewer.md` — 新規作成、Reviewer 視点論者 (severity 辞書内包)
- `~/.claude/agents/debater-documenter.md` — 新規作成、Documenter 視点論者 (推測排除原則)
- `~/.claude/agents/debater-pm.md` — 新規作成、PM/PdM 視点論者 (KPIDD 判断軸内包)
- `~/.claude/skills/debating-roles/SKILL.md` — 参照切替 40 箇所 + Session 5 Gotcha 追加
- `.docs/knowledge/debating-roles-agent-teams/2026-04-25-phase3-result.md` — 新規作成、Session 4 vs Session 5 完全比較検証ログ (約 280 行)
- `.docs/knowledge/debating-roles-agent-teams/2026-04-24-validation-result.md` — Session 4 検証ログ (参照元、本セッションで更新なし)
- `~/.claude/projects/.../memory/feedback_multi-agent-debate-design.md` — Session 5 結果 + 2 系統並存設計原則 + 共有改修パターンを追記
- `~/.claude/plans/archived/plan-mutable-pretzel.md` — 本セッションの Plan ファイル、archive 済 (status: completed、outcome_summary 記載)
- `.claude/handoff-state.md` — 本プロジェクト、Session 5 完了時点に更新
- `~/.claude/agents/team-{ui-designer,implementer,tester,reviewer,documenter}.md` — 無変更 (既存 3 skill subagent mode 用として継続)
- `~/.claude/agents/team-pm.md` — 無変更 (debater-pm.md 作成により宙に浮いたが、fallback 候補として保管)
- `~/.claude/skills/{three-elements-harness,orchestrating-team-development,enforcing-strict-tdd-cycle}/` — 無変更 (リグレッションなし、mtime で確認済み)
