---
feature: coordination-harness-integrity-postmortem
session: bash-1-context-fork-skills-agent-skill-enchanted-seahorse
date: 2026-05-03 17:39:02
---

# coordination-harness-integrity-fork postmortem (Q&A・知識整理)

## 概要

`coordination-harness-integrity-fork` skill の bootstrap 実装完了 (Stage 8、本日 06:18 archived) 後に行われた **Q&A セッションでの再判定・スコープ整理** を、bootstrap実装ログ (`2026-05-03_coordination-harness-integrity-bootstrap.md`) とは独立した記録として保存する。

実装ログが「何を作ったか / どう動いたか」を記録するのに対し、本ログは「**完成後の解釈・再判定で発見されたスコープ用語の混在問題と、本skillの正確な位置付け**」を記録する。bootstrap ログだけでは「本skillが協調パイプラインの一部ではないのに5項目達成と主張する根拠」が読み取れない欠落を補う。

## 実装内容

### 1. note記事5項目チェックリスト 再判定

note記事『Claude Codeには"もう一つの設計層"がある』5項目に対する本skill単体の達成度:

| 項目 | 本skill単体実装 | 判定 |
|---|---|---|
| 1. !構文 | 22箇所採用 (date/pwd/ls/find/head 単純コマンドのみ、-maxdepth指定済) | ✅ 完全活用 |
| 2. context:fork | `context: fork` frontmatter明示 | ✅ 完全活用 |
| 3. skills:プリロード | **本skill frontmatter に `skills:` フィールド なし** | ⚠️ 未活用 (subagent経由のみ) |
| 4. Skill+fork+subagent多段 | `subagent: team-reviewer` 明示 | ✅ 完全活用 |
| 5. 他領域展開 | 「協調ハーネス整合性検証」領域で新規verifier化 | ✅ 完全活用 |

項目3 は本skill単体では `skills:` フィールド非使用。subagent (team-reviewer) が `skills: [judging-review-severity]` プリロード済なので **間接活用**。直接の skills: フィールド追加は冗長 (subagent側と二重ロード) のため設計判断として現状維持が最適と確認。

### 2. スコープレイヤー混在の発見と整理

会話途中で **「ハーネス」「マルチエージェント協調」が3階層で曖昧化** していたことが指摘された。3階層を明確化:

| 階層 | 範囲 | 含むもの |
|---|---|---|
| (i) 協調パイプライン本体 | 3 skill 配下、稼働する協調機構 | orchestrating-team-development / three-elements-harness / enforcing-strict-tdd-cycle / coder / TDD3点 / team-* 6 / llm-debate系 / llm-debater-* 5 (skill 12 + agent 12) |
| (ii) 協調ハーネス | (i) + 周辺verifier (品質保証層) | (i) **+ 本skill (coordination-harness-integrity-fork)** |
| (iii) ~/.claude/全体 | グローバル全部 | (ii) + auditing系 + debating-roles + メタskill + 単体系 |

わたしの初期説明では (1) を「協調パイプライン本体」、(2) を「~/.claude/全体」として混在して使用 → かもね指摘で矛盾発覚。

### 3. 本skill の正確な位置付け (機械確認済)

| チェック項目 | 結果 |
|---|---|
| 協調コア4 skill (orchestrating-team-development / three-elements-harness / enforcing-strict-tdd-cycle / coder.md) が本skillを呼ぶか | **0ヒット** = 呼ばない |
| 本skill が他協調skillを呼ぶか (Skill() / Agent() 呼出) | **0ヒット** = 呼ばない |

→ 本skill は (i) 協調パイプライン本体の **一部ではない** (機械確認)。(ii) 協調ハーネスの **周辺verifier として構成要素**。例え: 工場の生産ラインに対する ISO 監査のような独立 quality auditor。

起動契機: 明示呼出専用 (`/coordination-harness-integrity` slash command 想定)、協調パイプラインの自動実行に組み込まれていない。

### 4. 5項目達成判定 (スコープ別、厳密判定)

| 項目 | (i) 協調パイプライン本体 | (ii) 協調ハーネス (本skill込) | (iii) ~/.claude/全体 |
|---|---|---|---|
| 1. !構文 | 11/12 skill採用 ✅ | 12/13 ✅ | 18本採用 ✅ |
| 2. context:fork | 8/12 (L3指揮+llm-debate Lead は fork不要が正解) ✅ | 9/13 ✅ | 13本採用 ✅ |
| 3. skills:プリロード | 11/12 agent ✅ | 11/12 ⚠️ (本skill自身は活用なし) | 13体 ✅ |
| 4. Skill+fork+subagent多段 | coder→fork→team-* で達成 ✅ | (i)に変化なし ✅ | 多領域達成 ✅ |
| 5. 他領域展開 | TDD / 議論 の2領域 | TDD / 議論 / **協調ハーネス整合性検証** の3領域 ✅ | 5領域達成 (TDD/議論/AIO/Next.jsセキュリティ/協調検証) ✅ |

### 5. note記事への依存性 (機械確認済)

| チェック対象 | 検索キーワード | 結果 |
|---|---|---|
| `~/.claude/skills/coordination-harness-integrity-fork/SKILL.md` | note / もう一つの設計層 / まさお / 2026-03-21 / claude-code.*pdf | **0ヒット** |
| `.docs/coordination-integrity/2026-05-03.md` (Stage 2出力) | 同上 | **0ヒット** |

→ 本skill本体と検証出力は note記事に **0依存**。記事URL/タイトル/筆者名/PDFファイル名が混入していない (CLAUDE.md `## Harness` のグローバル skill固有名禁止ルール遵守)。設計の経緯のみ plan ファイル / bootstrap実装ログに歴史記録。記事を捨てても skill 単体で意味が通る。

## 設計意図

### なぜ bootstrap実装ログとは別ファイルで postmortem を残すか

bootstrap実装ログ (`2026-05-03_coordination-harness-integrity-bootstrap.md`) は「**何を作ったか / Stage 1〜8 でどう動いたか**」の作業時系列記録。本ログは「**完成後にQ&Aで明らかになったスコープ用語の混在問題と、本skillの正確な位置付け**」の概念整理記録。性質が異なるため**1ファイルに混在させると検索性低下** (実装事実とQ&A結論の境界が曖昧化)。

実装ログ規約 (memory `feedback_logging-implementation-scope.md`) の「実装に限らず学習・Q&A・知識整理も記録対象」原則に従い、ファイル分離を採用。

### スコープ階層を明示しなかった当初の整理ミス

会話当初、わたしは「ハーネス全体で5項目達成」「本skillはマルチエージェント協調の一部ではない」を併記したが、両者の **「全体」と「一部」の対象** が異なっていた:

- 「全体」 = 暗黙に (iii) ~/.claude/全体 を指していた
- 「一部」 = (i) 協調パイプライン本体 を指していた
- → 同じ会話で異なる集合を指す矛盾、かもねが指摘

教訓: 集合名詞 (「ハーネス」「協調」) を使う時は **どの階層を指すか毎回明示**。スコープ用語の合意なしには「達成」「未達成」の議論が成立しない。

### 5項目達成判定で本skillが寄与する範囲

(ii) 協調ハーネス (本skill込) の判定で本skillが直接貢献するのは **項目5「他領域展開」** のみ:

- TDD / 議論 の2領域 (i) で既達成
- 本skill 追加で「協調ハーネス整合性検証」領域が **新規達成**
- 結果: 2領域 → 3領域 (1領域分の横展開実例追加)

項目1〜4 は (i) 既達成、本skill 追加で「ハーネス全体としての採用本数」が +1 増えるが、達成判定そのものは変わらない (元々達成済)。

### 本skill自身の項目3 (skills:プリロード) 非活用判断

本skill frontmatter に `skills:` フィールドを **意図的に追加しない** 設計判断:

- subagent (team-reviewer) が `skills: [judging-review-severity]` プリロード済 → 間接活用で十分
- 本skill固有の追加辞書プリロードは現状不要 (検証ロジックは本skill本文 ruleset に固定記述、動的コンテキストは !構文で注入)
- skills: 重複指定すると subagent起動時とskill読込時で2重 load → 軽微な無駄
- → 「**現状維持 (skills: なし) が設計として最適**」と判定

これは「項目3 を本skill単体で活用していない」 → 単一skillでの5項目フル活用ではないが、設計判断として正当。

## 副作用

### 教訓 (memory永続化候補)

- **集合名詞 (「ハーネス」「マルチエージェント協調」) のスコープ階層を会話内で明示しないと矛盾を生む**: 「本体」「全体」「ハーネス」を同じ文脈で使う場合、対象集合を毎回明示すべき
- **「本体の一部ではない」+「全体で達成」併記時は要注意**: 「本体」と「全体」が違う対象を指している可能性、同じ集合と勘違いさせない構造で書く
- **単一skillで5項目フル活用は note記事の本来要求ではない**: 記事は「**ハーネスやスキル構成見直し**」「**サブエージェント再設計**」が主眼で、ハーネス全体での項目達成を求めている。単一skillで全項目フル活用は設計純度を求めるなら可能だが必要性薄い

### 残存負債 (bootstrap実装ログと共通、別 plan化推奨)

bootstrap実装ログで既に列挙済のため詳細は割愛。要点のみ:

1. ruleset C-3 文言と過去bug実証データのギャップ (false positive 31件)
2. llm-debate系 6 skill の Observability schema 不揃い (D-1違反12件)

### 次セッション着手候補

bootstrap実装ログ末尾に挙げた後続 plan 3件に加え、本ログの教訓から派生した候補:

- **memory `feedback_scope-discipline-strict-after-decision.md` 保存**: 本セッションで3回発生したスコープ違反の再発防止、教訓永続化
- **memory `feedback_scope-naming-clarification.md` 保存**: 集合名詞のスコープ階層明示原則、本ログの教訓から

## 関連ファイル

### 本ログが補完する既存ログ
- `.docs/templates/2026-05-03_coordination-harness-integrity-bootstrap.md` — bootstrap実装ログ、Stage 8 完了時点で書き終え済 (本日 06:15)。本ログ (postmortem) は bootstrap 完了後の Q&A・知識整理を補足

### 本セッションで作成・操作したファイル (再掲)
- `~/.claude/skills/coordination-harness-integrity-fork/SKILL.md` — 本skill本体 (新規、233行)
- `.docs/coordination-integrity/2026-05-03.md` — Stage 2 検証出力 (Verdict NO-GO報告、19,220 bytes / 256行)
- `~/.claude/plans/archived/bash-1-context-fork-skills-agent-skill-enchanted-seahorse.md` — 完了済 plan (319行)

### 関連検証ログ (本ログの議論で参照)
- `.docs/templates/2026-05-02_note-three-elements-status-check.md` — note記事3要素 (!構文/context:fork/孫エージェント) 達成状況、本ログの5項目判定の前駆検証
- `.docs/templates/2026-05-01_multi-agent-harness-plan-b.md` — Plan B 改修内容、協調コア改修履歴
- `.docs/templates/2026-05-01_harness-three-layer-diagnosis.md` — 3層補完関係診断、本ログのスコープ階層整理の前駆検証
- `.docs/specs/CURRENT/verifiable-workflows-spec.md` — verifier化候補機械列挙、本skillはこれの一実装

### 本ログ由来の memory保存候補 (未保存)
- `feedback_scope-discipline-strict-after-decision.md` — スコープ確定後の対象外名再侵入防止 (流用元/パターン踏襲/歴史参照の罠)
- `feedback_scope-naming-clarification.md` — 集合名詞のスコープ階層明示原則 ("ハーネス"等の3階層曖昧性)
