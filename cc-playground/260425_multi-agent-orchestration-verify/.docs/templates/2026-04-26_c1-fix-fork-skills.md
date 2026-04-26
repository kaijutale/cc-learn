---
feature: c1-fix-fork-skills
session: ハーネス汎用化検証 Phase 6-2 (C1修正実証 + 動的検証完遂)
date: 2026-04-26 07:49:36
---

# C1 修正: 3 fork skills の Skill 呼出 block 解除

## 概要

ハーネス汎用化検証 Phase 6-2 (動的TDDサイクル検証) で発覚した Critical Finding C1 (3 fork skills の `disable-model-invocation: true` による coder agent からの Skill 呼出 block) を修正し、修正効果を実動作で実証した。

検証レポート (`~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md`) の Phase 6-2 動的検証結果に追記された C1 が本作業のトリガー。前作業 `2026-04-26_tdd-harness-verification-setup.md` (scaffold) からの継続フェーズ。

## 実装内容

### 1. 3 fork skills frontmatter 修正

対象ファイル (`~/.claude/skills/`):
- `red-test-fork/SKILL.md`
- `implement-fork/SKILL.md`
- `verify-test-fork/SKILL.md`

各ファイル frontmatter から:
- `disable-model-invocation: true` 行 削除
- `Trigger on "..."` 行 削除

description 本文に追記:
- 「coder agent からの明示呼出専用 (Skillツール経由のみ)」明記
- 「description マッチによる自動誘発は想定しない (coder.md の workflow 内からのみ起動)」明記

### 2. 修正効果の即時検出

修正実施直後の system-reminder で 3 fork skills が available skills 一覧に新規登場 (フラグありの時は一覧に出ない仕様)。Claude Code 側がリアルタイムで反映したことを確認。

### 3. 再検証実行 (Phase 6-2 再実施)

`src/lib/` を空にリセット (`trash` で前回成果物削除) → `Agent(subagent_type="coder", ...)` 再起動 → TDDサイクル正規ルート完走を観測。

成果物:
- `src/lib/math.ts` (30行、`assertValidOperand` 抽出構造)
- `src/lib/math.test.ts` (98行、20テストケース)
- vitest 20/20 PASS (158ms)

11観測項目 すべて OK:
- #2, #6, #8 (Skill 呼出 Critical 3項目): NG → **OK** に転換
- 4層チェーン (coder → Skill → context:fork → subagent: team-*) 正規ルート完走 (~98sec)

### 4. ドキュメント更新

- 検証レポート `2026-04-25-verification-result.md` に「2026-04-26 C1 修正実施 + 再検証」セクション追記 (修正前後比較表 + 副次的品質改善実測値 + 知見の更新)
- `.claude/handoff-state.md` を Phase 6-2 真の完了状態に更新

## 設計意図

### なぜ `disable-model-invocation: true` を削除したか

このフラグの本来意図は「description マッチによる自動誘発防止」だが、Claude Code 実装は **Skill ツール明示呼出も区別なく block** している (実測)。coder.md L24-27 の workflow は明示的に `Skill(red-test-fork)` 等を呼び出す設計のため、フラグありだと workflow 自体が動作不能。

削除しても A (description マッチ自動誘発) のリスクは別手段で抑制可能 (下記)。

### なぜ `Trigger on "..."` 行も削除したか

description マッチ自動誘発の **直接的な素** が Trigger 文言。これがあると Claude が「TDD委譲」「RED委譲」等の文脈で description マッチを判断する材料になる。

coder.md は skill 名で直接呼出する設計なので Trigger 文言は機能上不要。削除することで:
- A (自動誘発) のリスクを構造的に低減
- description が短くなり readability 向上
- coder.md L24-27 の明示呼出設計と整合

### なぜ description 本文に「明示呼出専用」を残したか

二重ガード:
- 人間レビュアーへのドキュメント (将来この skill を見たエンジニアが意図を理解できる)
- Claude への抑制ヒント (description を読んだ時点で「自動誘発対象でない」と判断する手がかり)

description マッチは Claude の判断に依存するため確率的だが、明示文言は判断確度を上げる。

### 削除アプローチを Task ツール追加より優先した理由

候補2 (coder の tools に Task 追加) は **context:fork + subagent: の skill メカニズム自体を無効化** する。fork skills を温存しつつ Task 経由設計に移行するのは設計矛盾。修正ではなく置換になる。

候補1 (フラグ削除) は最小diff で本来設計を復活させる方針。実証結果も期待通り。

### 副次的に5-Role Separation の効果が定量化された理由

修正後再検証で coder 単独実装 (修正前代替経路) と team-* 役割分離 (修正後正規ルート) の比較が取れた:
- テスト数 16 → 20 (+25%): team-tester がフレッシュ視点で「小数加算」「両 undefined」等のカテゴリを追加
- 実装行数 19 → 30: team-implementer が `assertValidOperand` 検証関数を抽出 → 責務分離
- 全体実行時間 ~155sec → ~98sec: 役割分離 + context:fork の方が速い (役割明確化による迷い削減効果?)

これは検証目的外の副次成果だが、ハーネス全体の設計妥当性を強化する実測値として価値がある。

## 副作用

### description 自動誘発抑制の効果は未実測

description 本文の「明示呼出専用」明記による A (自動誘発) 抑制効果は、本検証では明示呼出のみ実証している。今後メインClaude が「TDDサイクル委譲」のような文脈で誤って fork skill を自動誘発するリスクは未検証。

将来観測ポイント:
- メインClaude セッションで fork skills が意図せず誘発されないか
- 誘発された場合は description 文言を更に強化する (例: "PROHIBITED for direct user request" 等)

### Claude Code バージョン依存の grayzone 残留

memory `feedback_skill-fork-asymmetry.md` および coder.md L199-200 で既述の通り、`context:fork + subagent:` メカニズムは公式 grayzone。今回 `disable-model-invocation: true` の挙動も grayzone の一例として確認された。

将来 Claude Code バージョン更新で:
- フラグ削除した skill が逆に description マッチ自動誘発される側に揺れる可能性
- subagent からの Skill 呼出が再び block される側に揺れる可能性

検証レポートに記録済。バージョン更新時は再検証必要。

### 検証ディレクトリの取り扱い

本ディレクトリは検証用一時環境扱い。削除可能だが、再検証時の scaffold として保持しておく価値もある (`src/lib/` を空にすれば初回 RED 状態を再現できる)。判断はかもねに委ねる。

## 後続フォロー (A1/A2/B1/B2)

C1 本体修正の後、知見の永続化と整合性確保のため以下のフォロー作業を実施:

### A1: coder.md L199 grayzone 記述の恒久対策化

`~/.claude/agents/coder.md` L199 の grayzone 警告 (1項目) を 3 項目に分割書換:
- L199 (新): 動作の事実 + バージョン更新時再検証の宣言
- L200 (新): **動作条件** = `disable-model-invocation: true` を付けないこと + エラー文言引用 + 実証根拠 (2026-04-26 C1)
- L201 (新): description 文言での自動誘発防止策 (Trigger 語禁止 / 「明示呼出専用」明記) + フラグ依存との衝突警告

効果: 「grayzone 警告」を「動作条件 + 対策手段」に格上げ。C1 のような誤判断 (防御策と思ってフラグを足したら逆に block) を構造的に遮断。

### A2: implement-fork.md L93 duration コメントの一貫性確保

`~/.claude/skills/implement-fork/SKILL.md` L93 の duration 計測手順に「開始時刻は skill 読込時点なので subagent 初期化より若干早い (数秒オーダーの誤差許容)」を追記。red-test-fork L96 / verify-test-fork L99 と同じ書式に統一。L1 継続課題を完全クローズ。

### B1: 新規 memory `feedback_disable-model-invocation-blocks-skill-tool.md`

`~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/` 配下に新規作成。

内容:
- フラグの意図 (description 自動誘発防止) と実装 (明示呼出も block) の乖離
- fork skill には絶対に付けない
- description マッチ防止は description 文言で行う 3 点セット (フラグ削除 + Trigger 語除去 + 「明示呼出専用」明記)
- 実証ログへのリンク

将来 fork skill 系を作る時に同じ罠を踏まないための独立 memory。

### B2: 既存 memory `feedback_skill-fork-asymmetry.md` 追記

末尾に「2026-04-26 追加発覚: disable-model-invocation による block」セクション追加。grayzone の 2 類型を整理:

| 類型 | 発覚日 | 症状 | 対策 |
|---|---|---|---|
| cwd 揺れ (in-process / out-of-process) | 2026-04-20 | fork先で cwd 切れる | 2層防御 (`!pwd` 注入 + Step 0 で明示 cd) |
| disable-model-invocation block | 2026-04-26 | 明示呼出が block される | フラグ削除 + description 文言抑制 |

両者とも「公式記載と実動作の乖離」が共通構造、と知見をメタ化。

### MEMORY.md 更新

新規 memory のエントリを追加 + `Last verified: 2026-04-20 → 2026-04-26` に更新。

### A1-B2 フォローの設計意図

C1 本体修正だけでは知見が分散したまま (修正は完了したが、なぜそうしたかの再現可能性が弱い)。フォロー4作業で:

- **A1**: ハーネス内ドキュメント (coder.md) の知見更新
- **A2**: ハーネス内一貫性確保 (3 fork skills の書式統一)
- **B1**: 独立 memory で将来の再発防止
- **B2**: 既存 memory との整合 + grayzone 知見のメタ化

これにより、将来別セッションで fork skill を扱う時、coder.md → memory のどちらから入っても同じ結論に到達できる。**知見の冗長化は障害ではなく、複数経路でのアクセス性を上げる設計判断**。

## 関連ファイル

### C1 本体修正対象ハーネス
- `~/.claude/skills/red-test-fork/SKILL.md` — frontmatter から disable-model-invocation + Trigger on 削除、description に明示呼出専用追記
- `~/.claude/skills/implement-fork/SKILL.md` — 同上 (+ A2: L93 duration コメント追記)
- `~/.claude/skills/verify-test-fork/SKILL.md` — 同上

### 検証成果物 (本ディレクトリ)
- `src/lib/math.ts` — team-implementer 作成、30行、`assertValidOperand` 抽出構造
- `src/lib/math.test.ts` — team-tester 作成、98行、20テストケース (正常系5/境界値4/エッジ5/エラー系6)

### A1 修正対象
- `~/.claude/agents/coder.md` — L199 を 3 項目に分割書換 (grayzone 警告 → 動作条件 + 対策手段)

### B1/B2 memory 更新
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_disable-model-invocation-blocks-skill-tool.md` — **新規** (B1)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-fork-asymmetry.md` — 「2026-04-26 追加発覚」セクション追記 (B2)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/MEMORY.md` — 新エントリ追加 + Last verified 更新

### 記録更新
- `~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md` — Phase 6-2 動的検証結果 + 「2026-04-26 C1 修正実施 + 再検証」セクション追記
- `.claude/handoff-state.md` — Phase 6-2 真の完了状態に更新

### 参照
- `.docs/templates/2026-04-26_tdd-harness-verification-setup.md` — 前作業 (scaffold時点) の実装ログ
- `.docs/specs/CURRENT/spec.md` — 検証用 add 関数 spec (今回も使用)
