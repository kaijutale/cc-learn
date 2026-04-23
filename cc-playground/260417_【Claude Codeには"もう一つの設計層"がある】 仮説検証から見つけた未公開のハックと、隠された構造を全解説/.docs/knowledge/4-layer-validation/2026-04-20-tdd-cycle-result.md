---
date: 2026-04-20
type: validation-log
target: 4層チェーン (coder → red/implement/verify-test-fork → team-tester/team-implementer)
verifier: メインClaude (Opus 4.7 / 1M context, セーニャ persona)
related_article: cc-playground/260417_*/.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf
related_plan: ~/.claude/plans/subagents-skills-subagents-skills-plan-sharded-bumblebee.md
related_sample: cc-playground/260417_*/.docs/references/sample/
---

# 4層チェーン実測検証レポート

> note記事「Claude Codeにはもう一つの設計層がある」の3要素（!構文 / context:fork / subagent:）と、応用としての**4層チェーン構造**（coder→fork skills→team-*）の実測検証ログ

---

## 検証目的

note記事で開示された未公開ハックの**実動作確認**:
1. `!`コマンド構文 — スキル呼出時の決定論的シェル展開
2. `context: fork` — 親コンテキストからの切り離し
3. `subagent:` フィールド — カスタムagent への委譲
4. **4層チェーン**: メインClaude → coder agent → fork skill → team-* 孫エージェント

---

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `cc-playground/260417_*/test-tdd-cycle-validation/` |
| REPO_ROOT解決 | `git rev-parse --show-toplevel` → 検証ディレクトリ自身（独立リポ化済み） |
| 題材 | String Utils モジュール（5関数 / サンプルREQUIREMENTS.mdから） |
| テストランナー | jest 30.3.0 |
| パッケージマネージャ | pnpm 9.0.0 |
| セッション | Claude Code (Opus 4.7 / 1M context) |
| coder agent | session load 時点で未登録のため Agent ツール直接呼出不可 → メインClaudeが coder役 を擬似実行 |

---

## 実測結果サマリ

| 指標 | 自実測 | 記事実測値 | 一致度 |
|---|---|---|---|
| テスト件数 | **46件** | 43件 | 近似（+3件 / カバレッジ厚め） |
| RED確認 | **46/46 FAIL** | 43/43 FAIL | ✅ |
| GREEN到達 | **46/46 PASS** | 43/43 PASS | ✅ |
| 調整ループ回数 | **0回（1発で全GREEN）** | 0回 | ✅ 完全一致 |
| jest純粋実行時間 | **0.175秒** | (含合計時間に内包) | n/a |
| TDDサイクル合計時間 | 約8-10分（agent/fork起動含む） | 3分19秒 | 記事の方が早い（環境差） |

---

## 各Stage 詳細結果

### Stage 1: `Skill(red-test-fork)`

- **結果**: ✅ 成功
- **戻り値メッセージ**: `Skill "red-test-fork" completed (forked execution).`
- **観測**:
  - `(forked execution)` の明示文字列 = **context:fork が発動した証左**
  - !構文で REQUIREMENTS.md が冒頭注入された（孫がREQUIREMENTSの中身を認識）
  - `tests/stringUtils.test.js` (46件 / 217行) 作成
  - `npx jest --verbose` で All RED (46/46 FAIL) 確認
  - 失敗理由: 「実装不足（stub returns undefined）」← TDD原則通り
- **fork性質**: **in-process 寄り**（孫が「わたし（親コンテキスト）が team-tester の役割で実行した」と自己認識）
- **学び**:
  - 最初 `throw new Error('Not implemented')` stub にしたら truncate のエラー系4件が**偶然pass**してしまった
  - 空関数（undefined返し）stub に変えて「全 RED」を達成
  - **TDDのRED検証は「実装不足で失敗」であって「偶然の副作用でpass」ではない**という現場知

### Stage 2: `Skill(implement-fork)`

- **結果**: ✅ 成功
- **戻り値メッセージ**: `Skill "implement-fork" completed (forked execution).`
- **観測**:
  - `(forked execution)` 明示
  - `src/stringUtils.js` 33行（RED skeleton）→ 47行（GREEN実装）
  - 5関数すべて最小実装（camelToSnake / snakeToCamel / truncate / countWords / isPalindrome）
  - **Self-verify**: GREEN 46 / FAIL 0
  - **Scope creep check**: ✅（test/doc/UI 未触, package.json 未編集）
  - **Dependencies added**: なし
- **fork性質**: **in-process 寄り**（同コンテキスト内で直接実装）
- **学び・改善候補**:
  1. `pnpm install --ignore-workspace` フラグが必要だった（親リポの pnpm-workspace.yaml と絡まないため）→ HOW_TO_VALIDATE.md に注記要
  2. skill のプリアンブルが「テストコードなし」と表示された ⚠️ → 実態には46件のテスト存在 = !構文の収集失敗（出力結果に反する）。**out-of-processケースで頻出する可能性、要対策**
  3. skill 内 `Task` ツール参照が残ってる箇所あり → `Agent` ツールに統一する余地

### Stage 3: `Skill(verify-test-fork)`

- **結果**: ⚠️ 想定外動作 → メインClaude代行で完了
- **戻り値メッセージ**: `Skill "verify-test-fork" completed (forked execution).`
- **想定外内容**:
  - 孫が「test-tdd-cycle-validation ディレクトリ自体が存在しない」と判定
  - !`find $REPO_ROOT/...` が空を返した（出力: 「(ソースなし: 実装未完了)」「(テストなし)」「(gitリポジトリ外)」）
  - **しかし**: `Skill "verify-test-fork" completed (forked execution)` は明示
- **fork性質**: **out-of-process（完全fork）**。孫が独立cwdで起動 → REPO_ROOT解決失敗
- **代替実行**: メインClaude（coder代行）が直接 `npx jest --verbose`
  - 結果: **46 passed / 46 total / 0 failed / 0.175秒**

---

## 🌟 重要発見：fork性質の非対称性

**同じ context:fork+subagent:** を持つskillでも、**stageごとにfork動作が in-process / out-of-process で揺れた**。

| Stage | skill | fork性質 | 孫起動 | cwd継承 | ファイル発見 |
|---|---|---|---|---|---|
| 1 | red-test-fork | **in-process寄り** | あり（親が代行表現） | あり | ✅ |
| 2 | implement-fork | **in-process寄り** | あり（同コンテキスト） | あり | ✅ |
| 3 | verify-test-fork | **out-of-process** | あり（独立） | **なし** | ❌ |

これは記事の「**subagentからのSkill呼出は公式grayzone**」の **実証データ**。同じskill定義でも fork 動作が揺れる事実は、本記事のskill群でも**他環境では同様の揺れが起きる可能性**を示唆。

## 仮説：fork性質が揺れる理由（要追加検証）

可能性:
1. **タイミング依存**: skill loadのタイミングで Claude Code内部のexecution mode が変わる
2. **subagent: 指定の解釈**: 同じ team-tester でも、コンテキスト残量・環境変数等で in-process/out-of-process 振り分けが変わる
3. **3回目の制約**: 同じセッションで複数回 skill fork するとリソース制限で out-of-process に切り替わる
4. **cwd の親への依存**: 親 (メインClaude) のcwdが「親リポからの相対」だと孫がcwdを継承しないモードに切り替わる

未確認。Anthropic公式docsもgrayzone扱い。

---

## 4層チェーンの実測判定

| 層 | 検証結果 |
|---|---|
| L3: メインClaude (orchestrator) | ✅ 動作（メインセッション） |
| L2: coder agent | ❌ session load制約で**呼出不可**（このセッションでは） / メインClaudeが代行 |
| L1: fork skill (red/implement/verify-test-fork) | ✅ 全3スキル `(forked execution)` 確認 |
| L0: team-tester / team-implementer | ⚠️ in-process寄り(Stage 1,2) / out-of-process(Stage 3) で**揺れる** |

**判定**: **3層動作は完全実証 + L2 coder相当の擬似動作も成立**。L2 coder agent の真の起動は **別ターミナルで `cd test-tdd-cycle-validation && claude` を起動して `/enforcing-strict-tdd-cycle` を実行する必要**あり。

---

## 改善候補（次回 plan 化）

### skill 改修
1. **!`構文に `cd "$REPO_ROOT" && ` を**徹底注入**: out-of-process動作時の cwd切れ対策
2. **!構文の出力検証**: 「ファイル空 / コマンド失敗」を skill 自体が検知して warning メッセージを孫に渡す
3. **env var の absolute path 化推奨**: cwd依存しない設計に
4. **`Task` → `Agent` ツール参照の置換**: skill内文言の最新化

### memory 候補（後続作業）
1. "Skill fork は in-process / out-of-process **両方の動作モード**を取る。同じskillでもStageごとに揺れる" を `feedback_skill-fork-asymmetry.md` として保存
2. "TDD red phaseで `throw new Error` stub は禁忌（偶然pass する）。空関数 / `undefined`返しが正解" を `feedback_tdd-red-stub-anti-pattern.md` として保存
3. "pnpm-workspace.yaml がある親リポ配下に独立検証ディレクトリ作るときは `pnpm install --ignore-workspace`" を `feedback_pnpm-workspace-isolation.md` として保存

---

## ファイル痕跡

- `test-tdd-cycle-validation/tests/stringUtils.test.js` — 46件のRED→GREENテスト（217行）
- `test-tdd-cycle-validation/src/stringUtils.js` — 5関数実装（47行）
- `test-tdd-cycle-validation/HOW_TO_VALIDATE.md` — 完全4層検証用の手動実行ガイド
- `test-tdd-cycle-validation/pnpm-lock.yaml` — pnpm install --ignore-workspace の生成物

---

## 結論（Round 1 時点）

**自実装の3要素（!構文 / context:fork / subagent:）は実測動作する**:
- `(forked execution)` 明示文字列で fork 発動を確認
- 46件のRED作成 → 47行で実装 → 46/46 GREEN到達
- 調整ループ0回（記事と同等の精度）
- ただし **fork性質に in-process / out-of-process の揺れ** あり = 記事の grayzone言明と一致

**4層完全実証は今後の課題**:
- coder agent のsession load制約により今回はメインClaudeが代行
- 完全な4層動作は別セッション起動 (HOW_TO_VALIDATE.md 参照)で実証可能

**ハーネス改修の本気度（plan 通り）は本検証で裏付け済み**:
記事の手法をかもねの既存5-Role分離（team-*）+ skills:プリロードと統合する選択は**実装的に成立**することが、46/46 PASSという実数で示された。

---

# 🎊 Round 2 再検証結果（同日・修正後）

「失敗で終わらせず完成まで回す」方針で、Round 1 の❌を全て✅に変換した記録。

## Phase A: Skill 修正（2層防御パターン）

3 fork skill (`red-test-fork` / `implement-fork` / `verify-test-fork`) に以下を注入:

### Layer 1: !構文で親cwdをskill本文にテキスト展開
```markdown
### 🔒 親セッションの作業ディレクトリ（PARENT_CWD / 孫がcdするターゲット）
!`pwd`
```

### Layer 2: 孫への指示に `cd` 強制Step 0を明示
```markdown
### Step 0: 作業ディレクトリ固定（out-of-process対策・必須）
team-* 孫の最初のアクション:
  cd "<上記 PARENT_CWD セクションに表示された絶対パス>"
```

**仕組み**: !構文は**親Claudeのcwdで実行**されるので、結果は**skill本文にテキスト化**される。孫はそのテキストを読んで自分のcwdがズレていても親cwdを知れる。

## Phase B: 検証環境リセット

- `trash tests/stringUtils.test.js src/stringUtils.js` でRound 1の成果物削除
- クリーンスレートから Round 2 開始

## Phase C: 再実行結果

| Stage | Round 1 | Round 2 |
|---|---|---|
| Stage 1 (red-test-fork) | ✅ 46件 (spec解釈+3件) | ✅ **43件 (記事完全一致)** |
| Stage 2 (implement-fork) | ✅ GREEN (in-process代行) | ✅ **GREEN 43/0, scope creep なし** |
| Stage 3 (verify-test-fork) | ❌ **cwd切れで失敗** | ✅ **GREEN 43/43, Coverage 100%** |

### Stage 3 の戻り値（決定的証拠）

```
[Verify Complete]
Total: 43
PASS: 43
FAIL: 0
Coverage: 100% (Statements 19/19, Branches 10/10, Functions 6/6, Lines 14/14)
Result: GREEN ✅

[確認事項]
- テストファイル未変更 (verify-only ルール遵守)
- ソースコード未変更 (verify-only ルール遵守)
- Step 0 の cd 固定を最初に実行 → out-of-process cwd切れ問題なし ★
```

**★ 印が決定的**: 前回「ディレクトリなし」誤判定で失敗した Stage 3 が、2層防御で**完全動作**した。

## Round 2 判定：完成到達 🎊

| 観点 | Round 1 | Round 2 |
|---|---|---|
| !構文動作 | ✅ | ✅ |
| context:fork 発動 | ✅ | ✅ |
| subagent: 起動 | ⚠️ 揺れあり | ✅ **2層防御で安定** |
| cwd継承 | ❌ Stage 3 失敗 | ✅ **完全解消** |
| TDDサイクル完走 | ⚠️ メイン代行あり | ✅ **純粋skill経由で完走** |
| Coverage | 未計測 | ✅ **100%** |
| **総合** | 🟡 部分成功 | ✅ **完成到達** |

## 🌟 Round 2 で獲得した汎用パターン

**2層防御パターン** は、 `context:fork` + `subagent:` を使う他のfork skill設計でも適用可能:

```
Layer 1: !`pwd` で親cwdを skill本文にテキスト展開
         ↓
         skill本文を孫が受け取る（context fork 経由）
         ↓
Layer 2: 孫の Step 0 で `cd <展開されたパス>` を強制実行
         ↓
         孫の cwd が親と一致 → 全 find/cat/実行系が正しく動く
```

これを **「out-of-process 耐性テンプレート」** として `authoring-skills` skill に記録候補。

## Round 2 最終結論

**オーケストレーション構造は完成した**:
- Round 1 で露呈した grayzone (cwd継承問題) は、skill設計側の対策で**構造的に解決可能**と実証
- 記事の3要素を既存5-Role分離に統合する選択は **純粋skill経由で成立**
- 43件/43件 GREEN / Coverage 100% / スコープクリープなし = **完全成功**

**「失敗で終わらせず完成に到達」の好例**:
Round 1 の❌は学びの起点になり、skill側の構造的修正で Round 2 の✅に変換された。grayzone も設計パターンで飼い慣らせる = 記事のUnix哲学「小さい部品の組み合わせ」の実践価値が実証された。

---

# 🔄 Round 3 (2026-04-21): grayzone仕様変更と再改修

Round 2 の翌日、**同一呼出パスで ✅ が ❌ に変化**する事態が発生。その追跡・改修・再実証の記録。

## Phase D: 事象の発見（2026-04-21）

### 症状

Round 2 で通った呼出パス (`coder agent → Skill(red-test-fork)` 等) で、以下の新規エラーが発生:

```
Shell command permission check failed for pattern
"!`REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd); ...`":
Contains expansion
```

また別の呼出経路では `Unhandled node type: string` も観測。

### 特徴

- 昨日 ✅ だった Round 2 の **skill改修 (2層防御パターン) は不変**
- 昨日 ✅ だった **呼出パスも不変** (メインClaude → Agent(coder) → Skill(red-test-fork))
- **harness側の permission check が `$()` / `${VAR:-default}` / `{a,b,c}` 展開を構造的に禁止**するよう仕様変更された

## Phase E: 原因分析と仮説検証

### 検証1: 辞書型スキル誤実行仮説（→ 棄却）

`enforcing-strict-tdd-cycle` は team-tester にpreloadされる辞書型スキルで手動実行想定外、という仮説を当初立てた。しかし **同じ harness で `coder経由` でも `/red-test-fork` でも再現しない** 事実が判明し棄却。

### 検証2: harness 側の permission check 変更仮説（→ 採用）

エラー文言 `Contains expansion` は **Claude Code 側が意図的に追加したバリデーションルール**の文言と推察。記事本文 (PDF p.23-26) のサンプルは `!`cat /path/to/REQUIREMENTS.md`` のような**単純コマンド**のみ使用しており、`$()` 展開は記事サンプル外の「公開版環境非依存化」で追加された grayzone だった。

公式docs `Extend Claude with skills` の `!`<command>`` 例示 (`!`gh pr diff``) も全て単純コマンド。**公式想定は単純コマンドのみ**であり、展開を含む複合式は記事 p.34 の分類マップでいう **grayzone → 想定外の挙動**領域。

## Phase F: 改修範囲の完全チェック

team-* agents の `skills:` preload 辞書を含めて全スキャン実施:

| skill | 役割 | `!構文`内の `$()`/`${}` 展開 | 判定 |
|---|---|---|---|
| red-test-fork / implement-fork / verify-test-fork | fork skills (L1) | あり | 🔴 要改修 |
| enforcing-strict-tdd-cycle | team-tester preload辞書 | あり | 🔴 要改修 |
| deriving-test-from-spec | team-tester preload辞書 | あり | 🔴 要改修 |
| logging-validation-result | 独立ログ生成 | あり | 🟡 要改修（TDD外） |
| generating-doc-from-diff | team-documenter preload辞書 | あり | 🟡 要改修（TDD外） |
| narrowing-implementation-scope / guiding-tdd-development | team-implementer preload辞書 | なし | 🟢 無改修 |
| judging-review-severity / logging-implementation / injecting-ui-aesthetic / designing-beautiful-frontends | 他 preload 辞書 | なし | 🟢 無改修 |

### 🌟 非対称性の発見

**team-tester だけが preload 辞書両方に grayzone を抱えていた**。結果として「RED phase と VERIFY phase で team-tester を使うパスが最も影響を受ける」という構造的リスクが顕在化。

## Phase G: 改修実施（7 skills）

各 skill の `!構文` から以下を除去:
- `REPO_ROOT=$(git rev-parse --show-toplevel)` コマンド置換
- `${SPEC_PATH:-default}` parameter expansion
- `${ARGUMENTS:-default}` 引数フォールバック
- `{a,b,c}` brace expansion

置き換え方針:
- 親(coder)cwd基準の**相対パス**で ファイル探索
- 固定候補を `||` 連鎖で試行 (`cat .docs/specs/CURRENT/spec.md 2>/dev/null || cat REQUIREMENTS.md 2>/dev/null || echo "..."`)
- `!`pwd`` (Layer 1) と Step 0 の `cd <PARENT_CWD>` (Layer 2) は維持
- `find ... -exec cat {} \;` パターン (`{}` は find placeholder、bash展開ではない) で `xargs -I{} sh -c '...'` を代替

## Phase H: 再検証結果（2026-04-21 same day）

Round 2 と同一手順 (`メインClaude → Agent(coder) → Skill(red-test-fork)` 等) で再実行:

| Stage | Round 2 (04-20) | Round 3 (04-21改修前) | Round 3 (04-21改修後) |
|---|---|---|---|
| Stage 1 (red-test-fork) | ✅ 43件 RED | ❌ `Contains expansion` | ✅ **35件 RED** |
| Stage 2 (implement-fork) | ✅ GREEN | — (到達せず) | ✅ **GREEN 35/35** |
| Stage 3 (verify-test-fork) | ✅ GREEN 43/43 | — (到達せず) | ✅ **GREEN 35/35, Coverage 100%** |

### 改修後の決定的証拠

```
[Coder Cycle Complete]
Feature: String Utils Module (5関数)
Red count: 35
Loop count: 0 / 3 (初回verifyでGREEN到達、調整不要)
Final result: GREEN 35/35 ✅
Coverage: 100% (Stmts/Branch/Funcs/Lines)
```

**全3 skill で `(forked execution)` マーカーが復活**。4層エージェントチェーン (coder → fork skills → team-*) が完全復旧。

## Round 3 最終判定: 完全復旧 🎊

| 観点 | Round 2 (04-20) | Round 3 改修前 | Round 3 改修後 |
|---|---|---|---|
| `Contains expansion` エラー | 未発生 | **発生** | **解消** |
| `(forked execution)` マーカー | ✅ | ❌ | ✅ |
| 3孫エージェント連鎖 | ✅ 安定 | ❌ Stage 1 で停止 | ✅ **3連続成功** |
| 調整ループ回数 | 0 | — | 0 |
| Coverage | 100% | — | **100%** |
| **総合** | ✅ 完成 | ❌ grayzone仕様変更で破壊 | ✅ **構造的修正で完全復旧** |

## 🌟 Round 3 で獲得した知見

### 知見1: grayzone依存はハーネス更新で破綻する永続リスク

記事 (p.34) が明示警告していた **「グレーゾーンは将来のアップデートで挙動が変わる」** が **翌日** 現実化した。`$()` / `${VAR:-default}` は bash 標準機能だが、Claude Code の permission check が意図的に禁止。記事公開時 (2026-03-21) から5週間で grayzone が実行不可領域に変化。

### 知見2: 公式想定と記事サンプル本文は一致、公開版のみ grayzone

- **記事本文** (PDF p.23-26): `!`cat /path/to/REQUIREMENTS.md`` — **単純コマンド**
- **公開リポジトリ版** (sample/.claude/skills/red-test/SKILL.md): `!`REPO_ROOT=$(...); cat "$REPO_ROOT/REQUIREMENTS.md"`` — **展開あり**
- **公式docs** (Extend Claude with skills): `!`gh pr diff`` — **単純コマンド**

→ 公開版の環境非依存化 (`REPO_ROOT` 展開) は記事執筆者が善意で追加した改善だが、**Claude Code のセキュリティ境界を越える**書き方だった。

### 知見3: preload辞書スキルの !構文は "爆発半径の大きい失敗モード"

辞書型スキル (preload対象) の !構文展開失敗は単一skillでは済まず、**その skill を preload するすべての agent が道連れに起動不能**になる。fork skills (呼出型) の失敗は呼出側でエラー検出できて局所化するが、preload経路の失敗は subagent 全体を巻き込む。

→ **辞書型スキルは静的テキストに寄せる**のが堅牢。動的情報収集は呼出型skillに押し込む設計が安全。

### 知見4: 完全チェックの価値

最初 "3 fork skills だけ改修すれば足りる" と判断したが、かもねの「完全チェックしろ」指示で preload 経路を全スキャンした結果、**追加2 skill (deriving-test-from-spec / enforcing-strict-tdd-cycle)** の改修が必須と判明。**team-tester preload 辞書の grayzone が、fork skill 経由で間接的に team-tester 起動を不能にする連鎖**を見逃さずに済んだ。

## Round 3 最終結論

**grayzone API依存は永続的リスク**:
- 動いた実績は「再現可能」を意味しない
- 記事の3要素のうち `!構文` は**単純コマンドのみの公式想定**に戻すのが安全
- preload辞書は `!構文`自体を減らし静的情報に寄せる
- 動的情報注入は fork skills (呼出型) に集約し、失敗の局所化を確保

**今日の教訓を汎用設計原則に抽象化**:

```
skill設計原則（2026-04-21 Round 3 で獲得）:
1. !構文は単純コマンドのみ使用 ($()/${}/{,} 展開禁止)
2. 動的情報収集は呼出型skillに集約、辞書型は静的テキスト
3. preload辞書は爆発半径が大きい → 可能な限り !構文を使わない
4. grayzoneに依存するskillは harness更新時に動作確認を義務化
5. cwd依存は親cwd前提 + Layer 2 (cd <PARENT_CWD>) で補償
```

## 改修済み skill 一覧

- `~/.claude/skills/red-test-fork/SKILL.md`
- `~/.claude/skills/implement-fork/SKILL.md`
- `~/.claude/skills/verify-test-fork/SKILL.md`
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md`
- `~/.claude/skills/deriving-test-from-spec/SKILL.md`
- `~/.claude/skills/logging-validation-result/SKILL.md`
- `~/.claude/skills/generating-doc-from-diff/SKILL.md`

各 skill 内に `> **2026-04-21 改修**:` 注記で変更履歴を保持。

