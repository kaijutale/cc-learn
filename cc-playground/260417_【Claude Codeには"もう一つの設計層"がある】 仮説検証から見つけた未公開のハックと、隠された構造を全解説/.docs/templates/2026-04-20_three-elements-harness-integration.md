---
feature: three-elements-harness-integration
session: 未設定
date: 2026-04-20 19:41:01
---

# 記事「Claude Codeには"もう一つの設計層"がある」3要素を既存5-Role分離ハーネスへ統合

## 概要

note記事（まさお氏）で開示された未公開3要素（`!`コマンド構文 / `context: fork` / `subagent:`フィールド）と4層チェーン構造（coder→fork→team-*）を、かもねの既存5-Role分離ハーネス（team-tester/implementer/reviewer/ui-designer/documenter）に統合・実装・実測検証した日。Round 1 で grayzone 露呈 → 修正 → Round 2 完成到達。

## 実装内容

### 既存改修 (5件 + 1件任意)
- `~/.claude/agents/code-reviewer.md` — `skills: [judging-review-severity]` プリロード追加 (A5)
- `~/.claude/skills/commit/SKILL.md` — 冒頭に !構文セクション (`git status/diff/log` 自動展開) 追加 (A4)
- `~/.claude/skills/deriving-test-from-spec/SKILL.md` — !`cat spec.md` 注入 (A2)
- `~/.claude/skills/generating-doc-from-diff/SKILL.md` — !`git log/diff` + `.docs/templates/` 不在フォールバック (A3)
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — 全面リライト (5-Role + context:fork + !構文 + Phase 1-6) (A1)
- `~/.claude/skills/orchestrating-team-development/SKILL.md` — Step 5 に「TDD委譲」1行追記 (任意)

### 新規作成 (5件)
- `~/.claude/agents/coder.md` — TDDサイクル戦術オーケストレーター (L3) / tools:[Skill]含む / model:opus / red→implement→verify ループ最大3周 (B1)
- `~/.claude/skills/red-test-fork/SKILL.md` — context:fork + subagent:team-tester (B2)
- `~/.claude/skills/implement-fork/SKILL.md` — context:fork + subagent:team-implementer (B3)
- `~/.claude/skills/verify-test-fork/SKILL.md` — context:fork + subagent:team-tester (B4)
- `~/.claude/skills/logging-validation-result/SKILL.md` — 永続化検証ログ (`.docs/knowledge/`) 専用skill (logging-implementationの対)

### Round 2 修正（問題対応）
- 3 fork skill すべてに **2層防御パターン** 注入:
  - Layer 1: `!pwd` で親cwd を skill本文にテキスト展開
  - Layer 2: 孫の Step 0 で `cd <展開パス>` 強制実行
- 効果: out-of-process fork 時の cwd継承問題を構造的に解消

### 検証実行 (Round 1 → Round 2)
- 検証ディレクトリ: `cc-playground/260417_*/test-tdd-cycle-validation/`
- 題材: String Utils モジュール (REQUIREMENTS.md 5関数)
- Round 1: 46件 RED→GREEN (Stage 3 失敗 → メイン代行)
- Round 2: **43件 RED→GREEN / Coverage 100% / Stage 3 完全動作 / 純粋skill経由完走** ← 完成到達
- 実測ログ: `.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md` (Round 1+2 両方記録)

### memory 4件追加
- `feedback_skill-fork-asymmetry.md` (+2層防御パターン Round 2 追記)
- `feedback_tdd-red-stub-anti-pattern.md` (`throw Error` stub 禁忌)
- `feedback_pnpm-workspace-isolation.md` (`--ignore-workspace`必須)
- `MEMORY.md` index 3行追加 + Last verified 2026-04-20

## 設計意図

### なぜ既存5-Role分離を保ったまま記事3要素を載せたか
記事は「ミニマルなオーケストレーション例」を提示しているが、かもねの既存ハーネスには既に5-Role分離 + skills: プリロード + 判断辞書という**先進的な構造**がある。これを破壊して記事の最小例に置き換えるのは退化。**統合する**ことで「既存資産 × 記事の3要素」の相乗効果を得る方針を採った。

### なぜ coder agent を新規作成したか
記事の coder と既存の team-implementer は**スコープが異なる**:
- team-implementer = 「最小実装専任」（テスト設計・レビュー・ドキュメント生成しない）
- coder = TDDサイクル戦術オーケストレーター（red/implement/verify を順次呼出 + 調整ループ管理）

team-implementer に coder 役を兼任させると「やらないこと」リスト崩壊 = 責務分離の原則違反。**新規 coder を別agentで定義**するのが筋。

### なぜ logging-validation-result を独立ユーティリティにしたか
オーケストレーション構造に組み込むと:
- 全TDDサイクル毎に `.docs/knowledge/` インフレ発生
- coder の責務肥大化

「特殊な観測 (未公開hack実証 / fork非対称性 / grayzone) を残す瞬間にだけ発火」が筋。`enforcing-strict-tdd-cycle` から1行ポインタで参照される弱結合に留めた。

### なぜ Round 1 失敗で終わらせなかったか
かもねの「failureはlearningの起点、learningはfixに繋がる」方針。Stage 3 cwd切れの根本原因（`!`構文は親cwdで実行、孫は別cwd）を特定 → 2層防御パターンを設計 → Round 2 で完全動作を実証。**設計改善で grayzone を飼い慣らせる**ことを示した。

### なぜ Claude Only に統一したか
かもねの既存memory `feedback_claude-opus-only-for-multi-agent.md` 「multi-agent skillはMacro/Micro両方ClaudeOpus固定、外部モデル/エージェント連携なし」方針に従う。サンプルにあった `codex exec` / `cursor agent` は意図的に不採用。

## 副作用

### 警戒すべきgrayzone
- `subagent`からの`Skill`呼出は公式docs上「使えない」と明記されている領域。実動作するが将来のClaude Codeアップデートで挙動変わる可能性。本番導入時はバージョン固定推奨
- skill fork は in-process / out-of-process で動作モードが揺れる。**2層防御パターンで耐性を持たせた**が、未知の環境差に注意

### 完全実証の限界
- L2: coder agent は同セッション内 Agent ツール呼出不可 (session load制約)
- 完全な4層チェーン (L4→L3→L2→L1→L0) はメインClaude代行で擬似動作のみ。**真の4層実動作は別セッション起動が必要**（HOW_TO_VALIDATE.md 参照）

### node_modules / pnpm-lock.yaml 副生成物
- 検証ディレクトリ test-tdd-cycle-validation/ に node_modules + pnpm-lock.yaml が生成された
- `--ignore-workspace` フラグ必須だった (親リポの pnpm-workspace.yaml と絡まないため)
- `.gitignore` で除外設定済み

## 関連ファイル

### Claude Code 設定 (~/.claude/ 配下、git管理外)
- `~/.claude/agents/coder.md` — 新規 (TDD戦術オーケストレーター)
- `~/.claude/agents/code-reviewer.md` — 改修 (skills:プリロード)
- `~/.claude/agents/team-tester.md` / `team-implementer.md` — 既存互換
- `~/.claude/skills/red-test-fork/SKILL.md` — 新規 + 2層防御
- `~/.claude/skills/implement-fork/SKILL.md` — 新規 + 2層防御
- `~/.claude/skills/verify-test-fork/SKILL.md` — 新規 + 2層防御
- `~/.claude/skills/logging-validation-result/SKILL.md` — 新規 (永続化ログ専用)
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — 全面リライト
- `~/.claude/skills/{commit,deriving-test-from-spec,generating-doc-from-diff,orchestrating-team-development}/SKILL.md` — 改修
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/MEMORY.md` — index 3件追加
- `~/.claude/projects/.../memory/feedback_{skill-fork-asymmetry,tdd-red-stub-anti-pattern,pnpm-workspace-isolation}.md` — 新規3件
- `~/.claude/plans/subagents-skills-subagents-skills-plan-sharded-bumblebee.md` — Plan ファイル

### プロジェクト内 (cc-playground/260417_*/ 配下、git管理対象)
- `.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md` — 実測ログ (Round 1+2)
- `.docs/templates/2026-04-20_three-elements-harness-integration.md` — 本ファイル
- `test-tdd-cycle-validation/` — 検証ディレクトリ (独立リポ化、親リポからは別管理)
  - `REQUIREMENTS.md` / `package.json` / `.gitignore` / `HOW_TO_VALIDATE.md` / `pnpm-lock.yaml`
  - `src/stringUtils.js` / `tests/stringUtils.test.js` (Round 2 GREEN実装)

### 参照
- 記事PDF: `.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf`
- サンプル: `.docs/references/sample/` (記事公開ソース)
