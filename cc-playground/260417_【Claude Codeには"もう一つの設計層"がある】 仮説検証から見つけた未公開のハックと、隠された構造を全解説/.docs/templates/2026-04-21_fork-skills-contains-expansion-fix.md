---
feature: fork-skills-contains-expansion-fix
session: 未設定
date: 2026-04-21 15:18:04
---

# Fork Skills `Contains expansion` 対応改修

## 概要

2026-04-20 Round 2 で完成した 4層TDDチェーン (メインClaude → coder → fork skills → team-*) が、翌 2026-04-21 に Claude Code のharness仕様変更で動作不能化。`!構文`内の bash 展開 (`$()` / `${VAR:-default}` / brace expansion) が `Contains expansion` / `Unhandled node type: string` エラーで構造的に拒否されるようになったため。

本ログは、該当する7 skillの `!構文` を改修し、昨日と同一呼出パスで再検証を通過させるまでの実装記録。

## 実装内容

### 改修対象 skill (7件)

| # | skill | 役割 | 優先度 |
|---|---|---|---|
| 1 | `~/.claude/skills/red-test-fork/SKILL.md` | fork skill (L1) | 必須 |
| 2 | `~/.claude/skills/implement-fork/SKILL.md` | fork skill (L1) | 必須 |
| 3 | `~/.claude/skills/verify-test-fork/SKILL.md` | fork skill (L1) | 必須 |
| 4 | `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` | team-tester preload辞書 | 必須 |
| 5 | `~/.claude/skills/deriving-test-from-spec/SKILL.md` | team-tester preload辞書 | 必須 |
| 6 | `~/.claude/skills/logging-validation-result/SKILL.md` | 独立ログ生成 | TDD外 |
| 7 | `~/.claude/skills/generating-doc-from-diff/SKILL.md` | team-documenter preload辞書 | TDD外 |

### 変更パターン

各 `!構文`から以下の bash 展開を除去:
- `REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)` コマンド置換
- `${SPEC_PATH:-.docs/specs/CURRENT/spec.md}` parameter expansion
- `${ARGUMENTS:-...}` 引数フォールバック
- `{red-test-fork,implement-fork,verify-test-fork}` brace expansion

### 置き換え方針

- **親cwd基準の相対パス**で ファイル探索 (`cat .docs/specs/CURRENT/spec.md`)
- 固定候補を `||` 連鎖で順次試行 (`cat spec.md 2>/dev/null || cat REQUIREMENTS.md 2>/dev/null || echo "..."`)
- `find ... -exec cat {} \;` パターン (`{}` は find placeholder、bash展開ではない)
- `!`pwd`` (Layer 1: 親cwd表示) と Step 0 の `cd <PARENT_CWD>` (Layer 2: cwd固定) は維持
- 各 skill 冒頭に `> **2026-04-21 改修**:` 注記ブロックを追加して変更履歴を残す

### 改修例 (red-test-fork)

```diff
-### 実装要件（spec.md または REQUIREMENTS.md）
-!`REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd); cat "$REPO_ROOT/${SPEC_PATH:-.docs/specs/CURRENT/spec.md}" 2>/dev/null || cat "$REPO_ROOT/REQUIREMENTS.md" 2>/dev/null || echo "spec未指定"`
+### 実装要件（spec.md または REQUIREMENTS.md）
+!`cat .docs/specs/CURRENT/spec.md 2>/dev/null || cat REQUIREMENTS.md 2>/dev/null || echo "spec未指定: .docs/specs/CURRENT/spec.md または REQUIREMENTS.md を親cwdに用意してください"`
```

### 再検証結果

`メインClaude → Agent(coder) → Skill(red-test-fork)` の昨日と同一呼出パスで実行:

```
[Coder Cycle Complete]
Feature: String Utils Module (5関数)
Red count: 35
Implement files: src/stringUtils.js (+30 / -14)
Loop count: 0 / 3 (初回verifyでGREEN到達、調整不要)
Final result: GREEN 35/35 ✅
Coverage: 100% (Stmts/Branch/Funcs/Lines)
```

全3 fork skill で `(forked execution)` マーカー出力を確認。`Contains expansion` / `Unhandled node type` エラーは完全解消。

### ログ追記

`.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md` に **Round 3 (2026-04-21)** セクションを追加:
- Phase D (事象発見) → E (原因分析) → F (完全チェック) → G (改修実施) → H (再検証)
- 獲得した4つの知見 (grayzone依存リスク / 公式vs記事の差分 / preload辞書の爆発半径 / 完全チェックの価値)

## 設計意図

### なぜ展開除去が正解か

note記事の3要素 (`!構文` / context:fork / subagent:) の4要素目 `skills:プリロード` を含めたアーキテクチャ自体は公式docsと完全整合する公式想定内設計。今回の `Contains expansion` は Claude Code の**セキュリティ境界強化**であり、展開を含む複合シェル式を構造的に禁止したもの。

記事本文 (PDF p.23-26) のサンプルは `!`cat /path/to/REQUIREMENTS.md`` のような**絶対パス + 展開なし**の単純コマンドで統一されていた。公開リポジトリ版だけが環境非依存化のために `REPO_ROOT=$(...)` 展開を追加しており、これが grayzone 領域に踏み込んでいた。公式docs の `!構文` 例も `!`gh pr diff`` 等すべて単純コマンド。

つまり**展開除去は記事思想と公式想定への回帰**であって、後退ではない。副次効果として skill 本文の行数が減り、可読性が向上した。

### なぜ親cwd依存前提に戻したか

`REPO_ROOT` 動的解決は「サブディレクトリから呼ばれても動く」というロバストネスを提供していたが、展開を使わざるを得ない。代替として 2026-04-20 Round 2 で獲得した **2層防御パターン** が機能する:

- Layer 1: `!`pwd`` で親 (coder) のcwdを孫のsystem promptに文字列展開
- Layer 2: Step 0 で孫エージェントが `cd <PARENT_CWD>` を強制実行 → 孫側のcwdを親と一致させる

`!構文` は**親cwdで実行される**ので、親cwdが repo root なら相対パスで足りる。coder agent は Agent ツール経由で起動されるので通常は呼出元 (メインClaude) のcwdを継承する。メインClaude は通常 repo root から起動されるため、実用上の制約にならない。

### なぜ preload 辞書 (enforcing-strict-tdd-cycle / deriving-test-from-spec) も改修対象に含めたか

完全チェックの結果、team-tester の `skills:` フィールドでpreloadされる両辞書に `$()` 展開が含まれていた。preload経路でも `!構文`は展開されるため、放置すると **team-tester 起動時の preload 段階で失敗する可能性**があった。

特に team-tester は RED phase と VERIFY phase の両方で使われる中核agent。ここが起動不能になると4層チェーンの3/3が破綻する。「fork skills だけ改修すれば足りる」判断は preload経路の爆発半径を見落としていた。

### 獲得した設計原則

本作業で明文化された今後のskill作成原則:

1. `!構文` は**単純コマンドのみ** (`$()` / `${}` / `{a,b,c}` 展開禁止)
2. 動的情報収集は呼出型skill に集約、辞書型は静的テキスト
3. preload辞書は爆発半径が大きい → `!構文` を極力使わない
4. grayzone依存 skill は harness更新時に動作確認義務
5. cwd依存は親cwd前提 + Layer 2 (`cd <PARENT_CWD>`) で補償

## 副作用

### 機能低下 (許容範囲)

- **`SPEC_PATH` 環境変数フォールバック廃止**: `${SPEC_PATH:-default}` で動的にspecパス指定する機能が失われた。影響範囲確認済み: `orchestrating-team-development` / `coder` agent で `SPEC_PATH` を設定する箇所はなし。固定パス (`.docs/specs/CURRENT/spec.md` → `REQUIREMENTS.md`) を `||` 連鎖で試行する形で代替。

- **`$SRC_DIR` / `$TEST_DIR` / `$TEST_RUNNER` 環境変数廃止**: 同様に固定パス (`src/`, `tests/`) と固定コマンド (`npx jest --verbose`) を前提に。標準的なプロジェクト構成なら問題なし。

- **`$RANGE` 環境変数廃止** (generating-doc-from-diff): git range指定は `main..HEAD` 固定に。別範囲が必要な場合は呼出元agentが git コマンドを直接実行して結果を team-documenter に渡す形に変更。

- **サブディレクトリからの呼出ロバストネス低下**: `REPO_ROOT` 動的解決がないので、親cwdが repo root でないと相対パスが機能しない。Layer 2 の `cd <PARENT_CWD>` で補償。

### 破壊的変更なし

- アーキテクチャ (4層チェーン / context:fork / subagent: / skills:preload) は完全維持
- `~/.claude/agents/` 配下のagent定義 (coder, team-tester, team-implementer 等) は一切触らず
- orchestrating-team-development skill も一切触らず
- frontmatter と body の指示構造は全skillで保持

### 残課題

- `$ARGUMENTS` / `${CLAUDE_SESSION_ID}` / `${CLAUDE_SKILL_DIR}` などの公式 string substitution を `!構文`内で使った際の permission check 挙動は未検証。これらは bash展開ではなく Claude Code の preprocessing なので理論上は通るはずだが、実測で確認すべき
- `{}` placeholder を含む `find -exec cat {} \;` パターンが今回は通ったが、他の skill で同様のパターンを使った際の互換性は継続監視
- 今後 Claude Code の permission check がさらに厳格化された際の再改修プロトコル未整備 (skill単位での仕様変更追跡の仕組みがない)

## 関連ファイル

### 改修済み skill (7件)

- `~/.claude/skills/red-test-fork/SKILL.md` — fork skill L1、team-tester呼出、4箇所の `!構文`改修
- `~/.claude/skills/implement-fork/SKILL.md` — fork skill L1、team-implementer呼出、4箇所の `!構文`改修
- `~/.claude/skills/verify-test-fork/SKILL.md` — fork skill L1、team-tester呼出 (別インスタンス)、4箇所の `!構文`改修
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — team-tester preload辞書、6箇所の `!構文`改修 (brace expansion含む)
- `~/.claude/skills/deriving-test-from-spec/SKILL.md` — team-tester preload辞書、1箇所の `!構文`改修 (二重 parameter expansion)
- `~/.claude/skills/logging-validation-result/SKILL.md` — 独立ログ生成、3箇所の `!構文`改修
- `~/.claude/skills/generating-doc-from-diff/SKILL.md` — team-documenter preload辞書、3箇所の `!構文`改修

### 検証ログ

- `cc-playground/260417_.../.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md` — Round 3 セクション追記 (事象発見・原因分析・完全チェック・改修実施・再検証の全記録)

### 検証成果物 (test-tdd-cycle-validation/)

- `tests/stringUtils.test.js` — 35件のRED→GREEN テスト
- `src/stringUtils.js` — 5関数実装 (camelToSnake / snakeToCamel / truncate / countWords / isPalindrome)

### 参照した文献・サンプル

- `.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf` — note記事全45ページ (特に p.23-26 の記事本文サンプル、p.34 の3段階分類マップ)
- `.docs/references/sample/.claude/skills/red-test/SKILL.md` 他 — 公開リポジトリ版のサンプル (grayzone パターンの実例)
- [Extend Claude with skills 公式docs](https://code.claude.com/docs/en/skills) — `!構文`の公式仕様と `disableSkillShellExecution` 設定の存在
- [Orchestrate teams of Claude Code sessions 公式docs](https://code.claude.com/docs/en/agent-teams) — Agent Teams の制約と subagent との違い
