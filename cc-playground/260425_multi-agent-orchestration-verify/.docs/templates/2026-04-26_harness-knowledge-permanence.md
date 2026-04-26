---
feature: harness-knowledge-permanence
session: ハーネス汎用化検証 Phase 6-2 後続フォロー (C1知見の永続化)
date: 2026-04-26 11:57:47
---

# C1 知見の永続化 (ハーネス改修 + memory 更新)

## 概要

`2026-04-26_c1-fix-fork-skills.md` で記録された C1 修正本体 (3 fork skills の `disable-model-invocation: true` 削除) は完了したが、その知見が **ハーネス内ドキュメントと memory に永続化されていない** 状態だった。コードは修正されても、修正の **理由** と **再発防止指針** が散逸すると、将来別セッションで同じ罠を踏む可能性がある。

本作業は C1 知見を **複数経路に冗長配置** することで、将来どの入口から来ても同じ結論に到達できる構造を作ることを目的とする。

## 実装内容

### A1: `~/.claude/agents/coder.md` L199 grayzone 記述の恒久対策化

L199 の単一項目 (grayzone 警告のみ) を 3 項目に分割:
- L199 (新): 動作の事実 + バージョン更新時再検証宣言 (簡潔化)
- L200 (新): **動作条件** = `disable-model-invocation: true` を付けないこと + エラー文言 `Skill <name> cannot be used with Skill tool due to disable-model-invocation` を引用 + 実証根拠 (2026-04-26 C1)
- L201 (新): description 文言での自動誘発防止策 + フラグ依存との衝突警告

### A2: `~/.claude/skills/implement-fork/SKILL.md` L93 duration コメント書式統一

L93 の duration 計測手順に「開始時刻は skill 読込時点なので subagent 初期化より若干早い (数秒オーダーの誤差許容)」を追記。red-test-fork L96 / verify-test-fork L99 と同一書式に統一。これは検証レポートの L1 継続課題 (低優先度) を完全クローズするもの。

### B1: 新規 memory `feedback_disable-model-invocation-blocks-skill-tool.md`

`~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/` 配下に新規作成。

内容:
- フラグの意図 (description 自動誘発防止) と実装 (明示呼出も block) の乖離
- fork skill には絶対に付けない原則
- description マッチ防止の 3 点セット (フラグ削除 + Trigger 語除去 + 「明示呼出専用」明記)
- 実証ログへのリンク

### B2: 既存 memory `feedback_skill-fork-asymmetry.md` 追記

末尾に「2026-04-26 追加発覚: disable-model-invocation による block」セクション追加。grayzone の 2 類型 (cwd 揺れ + フラグ block) を表で整理し、両者の共通構造 (公式記載と実動作の乖離) をメタ化。

### MEMORY.md インデックス更新

- 新規 memory のエントリを追加 (リスト末尾)
- `Last verified: 2026-04-20 → 2026-04-26` に更新

### 実装ログ `2026-04-26_c1-fix-fork-skills.md` への後続フォロー追記

C1 本体ログに「後続フォロー (A1/A2/B1/B2)」セクションを追記。本ログ (`harness-knowledge-permanence`) との相互参照を確立。

## 設計意図

### なぜ複数経路に冗長配置するか

知見は **どこか1箇所** に書くのが普通だが、本ハーネスでは Claude が情報を取り込む経路が複数ある:
- ハーネス内ドキュメント (coder.md / SKILL.md): agent / skill 起動時の自動読込
- memory: 会話開始時に MEMORY.md 経由でロードされる
- 検証レポート (.docs/knowledge/): 明示的な参照時のみ

将来別セッションで「fork skill を作る」「`disable-model-invocation` を付けようか迷う」状況になった時、Claude がどの経路から情報を取り込むか予測不可能。そこで **3 経路すべてに同じ結論を配置** することで、入口の違いに依存せず再現性を担保する。

これは情報整理の観点からは「重複」だが、**LLM の想起確率を上げる工学的手段**。冗長化はバグではなく設計判断。

### なぜ既存 memory 更新 + 新規 memory 両方か

既存 `feedback_skill-fork-asymmetry.md` は cwd 揺れ問題に焦点を当てており、書き換えるとそちらの知見が薄まる (歴史的経緯としても価値がある)。

一方で `disable-model-invocation` 問題は cwd 問題とは別軸の grayzone なので、**独立した memory** として grep ヒット率を上げたい (将来 `disable-model-invocation` でgrep した時に独立 memory が即座にヒット)。

両方残すことで:
- 既存memory: 「fork skill 全般の grayzone 知見集約」役
- 新規memory: 「`disable-model-invocation` 問題の単独解説」役

責務分離。

### なぜ A1 で grayzone 警告を「動作条件 + 対策」に格上げしたか

修正前の L199 は「公式 docs と実動作が乖離するグレーゾーン挙動」と書いていて、これは **諦め型注意喚起**。読み手は「不安定らしい」とは分かるが、何をすれば動くか分からない。

更に問題なのは、「不安定 → 防御策が必要 → `disable-model-invocation: true` 付けよう」という **誤判断を誘発する可能性** があること。今回の C1 はまさにこの誤判断 (どこかの時点で grayzone 警戒のため防御フラグが追加された) によるものと推測される。

書換後は「動作条件 = フラグなし」と明示し、L201 で「フラグ依存だと動作条件と衝突する」と **誤判断遮断** を明文化。grayzone 依存ではなく、再現可能なルールに格上げ。

### MEMORY.md Last verified 更新の意味

MEMORY.md は memory ファイル群のインデックスで、`Last verified` は「いつ時点の memory として信頼できるか」のメタデータ。新規 memory 追加時 + 既存 memory 更新時には連動更新するのが筋。本日 (2026-04-26) で knowledge cycle の鮮度を主張する。

## 副作用

### 知見の冗長化 vs 更新負荷のトレードオフ

3 経路に同じ結論を書くと、将来この知見が無効化された時 (例: Claude Code バージョン更新で `disable-model-invocation` 仕様が変わった時) に **3 箇所すべてを更新する必要** がある。一箇所更新漏れがあると、Claude が古い情報を取り込むリスク。

**対処方針**: 更新時はこの実装ログを起点に、関連ファイル一覧を辿って一括更新する。実装ログが「知見の更新マニフェスト」役を兼ねる。

### 検証ディレクトリの本ログが残ること

このログは `cc-playground/260425_multi-agent-orchestration-verify/.docs/templates/` 配下にある。検証ディレクトリ自体は削除可能 (検証用一時環境扱い) だが、ハーネス改修の根拠ログがディレクトリ削除で失われる懸念。

**対処方針**: 検証ディレクトリ削除前に、本ログを `~/.claude/.docs/` 配下に移動する判断を残す (今日は判断保留、かもねに委ねる)。

### description マッチ自動誘発の実測未完了

A1 修正で「description 文言で自動誘発防止」と書いたが、実際にメインClaude が誤って fork skill を自動誘発しないかは未実測。今後数セッションでの観測ポイントとして残す (D2 別タスク)。

## 関連ファイル

### 修正対象 (ハーネス側)
- `~/.claude/agents/coder.md` — L199 を 3 項目に分割書換 (A1)
- `~/.claude/skills/implement-fork/SKILL.md` — L93 duration コメント書式統一 (A2)

### 新規 / 更新 (memory)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_disable-model-invocation-blocks-skill-tool.md` — **新規** (B1)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-fork-asymmetry.md` — 末尾に「2026-04-26 追加発覚」セクション追記 (B2)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/MEMORY.md` — 新エントリ追加 + Last verified 2026-04-20 → 2026-04-26

### 連携ログ
- `.docs/templates/2026-04-26_c1-fix-fork-skills.md` — C1 本体修正の実装ログ (本ログとは責務分離、相互参照あり)
- `.docs/templates/2026-04-26_tdd-harness-verification-setup.md` — Phase 6-1 scaffold 時点のログ (本日の起点)

### 参照
- `~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md` — 検証レポート (C1 修正実施 + 再検証セクションが C1 ログと連携)
- `.claude/handoff-state.md` — Phase 6-2 真の完了状態に更新済
