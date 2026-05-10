---
date: 2026-05-10 09:30:00
type: work
topic: essence-reviewing-harness-empirical-validation
session: 260504 ハーネス&AIエージェントの本質勉強会
related_article: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill:
  - essence-reviewing-harness
  - harness-essentials-reviewer-fork
  - skill-essentials-reviewer-fork
  - ui-essentials-reviewer-fork
related_agent:
  - harness-essentials-reviewer
  - skill-essentials-reviewer
  - ui-essentials-reviewer
related_log_ids:
  - 2026-05-10_essence-reviewing-harness-hubification-and-script
  - 2026-05-09_essence-reviewing-harness-redesign-implementation
related_log:
  - .docs/logs/shared/2026-05-10_essence-reviewing-harness-hubification-and-script.md
  - .docs/logs/shared/2026-05-09_essence-reviewing-harness-redesign-implementation.md
related_memory:
  - feedback_skill-fork-asymmetry
  - feedback_empirical-validation-required
---

# essence-reviewing-harness 第3次改修後の実機検証ログ

> 前々セッション (2026-05-09) + 前セッション (2026-05-10) で完了した essence-reviewing-harness 改修の **初回実機検証**。第一段階 Critical (!head deny) を方針 K で部分修正、第二段階 Critical (複合操作 !構文 deny) で再停止。Layer 3 全 !構文の実機未検証実態が露呈。

## 概要

### 目的

前々セッション (Layer 3 領域固有シグナル注入 + !head プリロード) と前セッション (ハブ-スポーク化 + 永続化指示 + scripts) で完了した改修が、実機起動時に正常動作するか検証する。

### 検証スコープ

- master skill (essence-reviewing-harness) の起動成功
- 3 fork sub-skill (harness/skill/ui-essentials-reviewer-fork) の並列起動
- Step 6 永続化 (~/.claude/.docs/essence-review-runs/ への書出)
- `<args>` 表記の literal 置換問題回避

### 自己レビューモード

評価対象 = essence-reviewing-harness 自身 (再帰的自己評価による厳格テスト)。

## 内容

### 第一段階 Critical: !head の sandbox cwd boundary deny

#### 症状

3 fork 並列起動 → 全て同じエラー:

```
Shell command permission check failed for pattern "!`head -160 /Users/camone/.claude/.docs/essence/harness-essentials.md ...`"
For security, Claude Code may only read the beginning of files from
the allowed working directories for this session
```

#### 原因

| 要素 | 値 |
|------|-----|
| 現セッション cwd | `/Users/camone/dev/claude-code/.../260504_...` |
| !構文 head 対象 | `/Users/camone/.claude/.docs/essence/harness-essentials.md` |
| 対象は cwd 外 | ✅ |
| !構文の sandbox 仕様 | cwd 外読込 deny |

エラー文言「allowed working directories for this session」= **sandbox レベル制約**。permissions ルール (allow/deny) で操作できる権限系統とは別。

#### 修正方針探索の経緯

| 段階 | 提案 | 評価 | 採用 |
|------|------|------|------|
| 1 | 方針 A: !構文 → Read tool 移行 | わたし推奨「妥協」と批判される | ❌ 一旦保留 |
| 2 | 方針 B': プロジェクト `.claude/settings.json` に `Bash(head:/.../essence/*)` 追加 | わたし推奨「設計思想保持」 | ❌ 試行 → 効果なし |
| 3 | 方針 K: 過去ログ + SKILL.md コメント精読 → 既存 Step 1 Read 命令併記発見 → !head 削除のみ | 真の最適解 | ✅ 採用 |

#### 方針 K の根拠 (重要)

`~/.claude/skills/harness-essentials-reviewer-fork/SKILL.md` line 34 のコメント:

```
### 評価基準 (ハーネス設計 8 原則 essence、agent が再 Read する想定だが Lead 把握用に注入)
```

**「agent が再 Read する想定だが Lead 把握用に注入」** = 設計者 (前々セッションのわたし) は意図的に二重構造にしていた:
- !head: skill 起動時の補助プリロード (Lead = master Claude 用)
- Step 1 Read (line 65-71): subagent 起動後の本命取得経路

→ !head 削除しても、subagent の Step 1 Read で評価基準は取得される = skill 機能保持

#### 方針 K 実装

3 fork SKILL.md それぞれから:
- `### 評価基準 (...) ` ヘッダー行
- `!\`head -160/180 /Users/camone/.claude/.docs/essence/{...}-essentials.md ...\``
- 後続空行

合計 -3 行 × 3 ファイル = -9 行削減。

検証:
- `grep '!\`head' ~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/SKILL.md` → 0 件
- 行数: harness 184 / skill 199 / ui 214 (Read 命令は line 65-79 付近に保持、subagent 経路機能)

### 第二段階 Critical: 複合操作 !構文の "multiple operations" deny

#### 症状

方針 K 実装後の Round 2 (3 fork 並列起動) で別エラー発生:

```
Shell command permission check failed for pattern "!`...`"
This Bash command contains multiple operations.
The following part requires approval: ...
```

3 fork で異なる失敗パターン:

| fork | 失敗 !構文 | エラー部分 |
|------|----------|-----------|
| harness | `[ -n "$ARG" ] && [ -d "$ARG" ] && ls -la "$ARG"` | test 演算子 + && 連結 |
| skill | `wc -l "$ARG"/SKILL.md 2>/dev/null \|\| wc -l "$ARG"` | || fallback |
| ui | `grep -rniE "(modern\|clean\|...)" "$ARG"` | grep が allow にない |

#### 原因

前々セッション (2026-05-09) の Layer 3 改修で各 fork に追加された **領域固有補助シグナル !構文 11 件** が、複合 bash 操作として permission チェックで分解判定 → 一部が approval 待ちで deny。

これは `!head` の sandbox cwd boundary とは **別系統** の問題:
- !head = sandbox cwd boundary (cwd 外読込)
- 複合操作 = bash command 複合分解 + allow rule 該当性

#### 構造的問題の正体

前々セッション実装ログ (2026-05-09) の Layer 3 セクション:

```
| harness-fork (3 件) | !ls -la / !grep -rE / !find ... | xargs wc -l |
| skill-fork (4 件) | !wc -l SKILL.md / !find -path / !grep -E / !grep -A 20 |
| ui-fork (4 件) | !grep -rE / !grep -rE / !grep -rE / !grep -E |
```

**11 件全てが実機検証されていない**。実装ログ + 「parameter expansion 残存ゼロ」「Lint 0」等の **静的検証のみ** で完了とされ、実機起動なし。

`feedback_skill-fork-asymmetry.md` (前回更新は 2026-04-26) で「設計時 vs 実機」の grayzone を自ら警告していたにもかかわらず、自分自身が同じ罠にハマっていた。

### フェーズ分離の判断

スコープが当初の「実機検証フェーズ」から「全 !構文監査+修正」に拡大したため、本セッションでは以下に絞る:

- **完了**: 第一段階 (!head) は方針 K で完全修正、第二段階の問題は確実に identified
- **次セッション**: 全 !構文監査 + 修正方針決定 + 修正実装 + 再検証

理由:
1. context 大量消費後の修正は判断品質低下リスク
2. フレッシュコンテキストでの全 !構文監査の方が丁寧 (見落とし減)
3. 「逃げ」ではなく「フェーズ分離」(検証フェーズと修正フェーズの責務分離)

かもねとの合意済み。

## 検証結果サマリ

### 検証観点ごとの結果

| 観点 | 結果 | 詳細 |
|------|------|------|
| (a) ハブ-スポーク構造で Lead が references/ を Read できるか | **未到達** | fork 起動失敗で master の Step 3-5 まで到達できず |
| (b) Step 6 永続化が ~/.claude/.docs/essence-review-runs/ に書出されるか | **未到達** | 同上 |
| (c) `<args>` 表記が literal 置換問題を回避できているか | **✅ 部分確認** | master skill レベルでは Orchestration Phase で `<args>` が `/Users/camone/.claude/skills/essence-reviewing-harness/` に正しく注入された |
| (d) 第一段階 !head deny | **✅ 修正完了** | 方針 K で削除、Step 1 Read 経路で評価基準取得継続 |
| (e) 第二段階 複合 !構文 deny | **❌ 新規 Critical** | Layer 3 全 11 件 + 基本系一部に同型問題、次セッションで対応 |

### 修正済 / 未修正

- 修正済: !head プリロード 3 件 (master 経路の deny 解消)
- 未修正: Layer 3 領域固有 !構文 11 件 + その他の複合操作 !構文 (推定計 約 15 件)

## memory 更新

### feedback_skill-fork-asymmetry.md (追記)

3 類型目「!構文 sandbox cwd boundary + 複合操作 deny」を追加:
- 発覚 1: !構文 cwd boundary は sandbox レベル
- 発覚 2: 複合操作 !構文 deny
- 共通反省: 「設計時の机上判断 → 実機検証なし → 後続セッションで Critical 発覚」3 類型共通

### feedback_empirical-validation-required.md (新規)

実装後の実機検証義務を確立:
- 「実装ログ書いた = 実装完了」の誤認禁止
- 実機起動こそが verifier
- 静的検証 (lint / grep 0 件 / 行数) は代替にならない
- 修正方針提案前の精読義務 (既存実装 + 過去ログ + memory)

### MEMORY.md (更新)

- `feedback_skill-fork-asymmetry.md` の description を 3 類型反映に更新
- `feedback_empirical-validation-required.md` の参照行追加

## 設計上の教訓

### 教訓 1: 「実装ログ = 実装完了」ではない

前々セッションの実装ログには「Layer 3 領域固有 !構文 11 件追加」が記載されていたが、**実機検証されていなかった**。実装ログ作成 = 完了の誤認は再現性高い anti-pattern。

### 教訓 2: 静的検証は実機検証の代替にならない

前セッション handoff の「実行済 (全グリーン)」セクションには:
- 行数確認 ✅
- parameter expansion 残存ゼロ ✅
- parse-target-path.sh 動作テスト 5/5 pass ✅
- 改修禁止系 mtime 確認 ✅

**全て静的検証のみ**。実機起動 (skill 呼出) は「未実行 (次セッション)」に分類されていた = 検証フェーズ自体は意識されていたが、handoff 時点で「実装完了」と表現していた。

### 教訓 3: 修正方針提案前の精読義務

第一段階で方針 A (!構文 → Read tool 移行) を提案した時、わたしは:
- SKILL.md line 34 のコメント精読していなかった
- 過去ログ (前々セッション実装ログ) 確認していなかった
- 既存 Step 1 Read 命令の存在を見落としていた

これらをかもねの指摘で初めて確認 → 真の最適解 (方針 K) に到達。

教訓: error 回避が動機の修正方針提案前に必ず:
1. 既存実装精読 (コメント含む)
2. 過去ログ確認
3. 関連 memory 確認

### 教訓 4: かもねの問いかけが質問駆動レビューア

かもねの問いかけ「クソみたいな理由の修正方針なら考え直すべき」「他 skill / 過去ログ確認してみたら？」が、わたしの「error 回避目的の妥協方針」を露呈させ、「真の最適解」への道を開いた。

これは note 記事 step3「レビューアパターンとフィードバックループ」の人間レビューア役。

## 次セッションの最優先タスク

1. /pickup で本ログ + handoff state.md 読込
2. 全 !構文監査:
   - 3 fork SKILL.md 全文 Read
   - 各 !構文の permission 通過性を機械的判定
   - 判定マトリクス作成 (cwd boundary / 複合操作 / allow rule 該当性)
3. 修正方針決定 (K拡張 / L: simple化 / M: script化 のいずれか)
4. 修正実装 + 再検証 (master 起動 → 3 fork 並列 → Step 6 永続化まで完走)
5. 検証成功後 commit + handoff

## 関連ファイル

- 本セッション handoff: .claude/handoff-state.md
- 前セッション実装ログ: .docs/logs/shared/2026-05-10_essence-reviewing-harness-hubification-and-script.md
- 前々セッション実装ログ: .docs/logs/shared/2026-05-09_essence-reviewing-harness-redesign-implementation.md
- 改修済 fork sub-skill: ~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/SKILL.md
- 評価基準 (改修禁止): ~/.claude/.docs/essence/{harness,skill,ui}-essentials.md
- 関連 memory:
  - ~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-fork-asymmetry.md (3 類型目追記済)
  - ~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_empirical-validation-required.md (新規)
  - ~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/MEMORY.md
- note 記事 PDF: .docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
