---
date: 2026-07-21 20:28:02
type: work
topic: skill-lane-and-stale-local-gtr-postmortem
session: harness-adoption-audit skill化 (worktree+PRレーン) + gtr 事故の根本原因究明と修正 (PR #213 merge 済み)
related_skill: [logging, pickup, commit, explain-in-html, creating-gtr-worktree, authoring-skills]
related_log_ids: [2026-07-21_v-1-2-feedback-speed-law-deepdive, 2026-07-21_pr-212-multilayer-independent-review-validation]
related_log: [.docs/logs/shared/2026-07-21_v-1-2-feedback-speed-law-deepdive.md, .docs/logs/shared/2026-07-21_pr-212-multilayer-independent-review-validation.md]
---

# skill化レーン実走 + gtr 事故 postmortem — 根本原因は「local が behind 7 のまま stale base から branch を切った」(PR #213 merge 済み)

> V-1.2 深掘り後の同日作業アーク。①「note→自ハーネス照合」の反復手作業 (過去7回+予定6回) を global skill 化する判断 → worktree+PR レーン実走 (deny #173 で main から skills/ 書込不可)。②その途中で gtr の二重ミス (`gtr go` を作成と誤読 / `cd ~/.claude` 前提) を踏み、「根本修正」として書いた doc fix が **実は origin に merge 済みの #211 (f9ce068) と重複**していたことを PR 前 conflict チェックで発見。真の根本原因 = **local `~/.claude` が behind 7 のまま pull せず、stale な base から branch を切った**こと。あたし自身が #211 の Gotcha が塞ごうとした失敗の「4回目の再発」だった — ただし修正済みの doc は origin にあり、local が古くて読めなかった。pull → 重複 branch 破棄 → `-C どこからでも` だけを最新 base で追加 → PR #213 → merge 済み。

## 概要

3本の作業ライン (すべて同日):

1. **skill化**: 取り入れ確認 workflow (V-1.2 で7回目) を global skill `harness-adoption-audit` へ。設計ブリーフを study PJ に externalize (9c0faae) → 隔離セッション (worktree + CLAUDE_CONFIG_DIR + /login) が SKILL.md 70行 + output-contract.md を作成・essence gate 正当通過 (独立2reviewer、round1 High 1件是正 → round2 GO) → commit 21f8e67。あたしの独立レビューで Medium 1 + Low 2 検出、修正プロンプトを隔離セッションへ handoff (対応待ち)。
2. **gtr 事故と根本修正**: 起動形 handoff の二重ミス → 「参照元の例を直せ」(かいじゅう指摘) → doc fix 作成 (3cd09e4) → **PR 前 conflict チェックで #211 (f9ce068) との重複を発見** → pull で local 最新化 → 重複 branch 破棄 → `-C ~/.claude` 前置の「どこからでも」1行のみ最新 base で追加 → **PR #213 merge 済み**。
3. **説明 HTML**: 「隔離したのになぜ conflict?」への解説 (`260721_isolation-vs-git-conflict.html`)。

## 内容

### gtr 事故のタイムライン (事実列挙)

1. global skill 化は deny #173 により worktree+PR レーン必須と判明 → 起動形を handoff
2. **ミス1**: `gtr go` を作成コマンドと誤読 (実際は path print 専用、作成は `gtr new`) → かいじゅうの起動が `Worktree not found` で失敗
3. **ミス2**: `cd ~/.claude` 前提の form を渡した (gtr は cwd の repo 基準) → 「毎回 cd はだるい」
4. かいじゅう指摘「プロンプト修正=L0 で揮発。参照元の例コマンドを直せ」→ 正しい。doc/rule fix を worktree で作成 (3cd09e4)
5. **PR 前 conflict チェックで発見**: origin/main の未 pull 7 commits に f9ce068 (#211) があり、**同じ isolation doc §1 (第1節) に同じ Gotcha (gtr new/go 取り違え) を再発マーカー付きで追加済み**だった。あたしの fix は大半重複 + 同一領域ゆえ conflict する
6. 真の根本原因確定: **セッション冒頭から local は behind 7 (git-sync-reminder が警告済み)、harness hold の指示で pull せず放置 → gtr new が stale local main (459cf72) を base に branch を作った → 修正済みの doc が読めず二重修正**
7. 修正 3手: ① `git -C ~/.claude pull --ff-only` (clean FF、未commit 保全、#211 Gotcha が live 化) ② 重複 branch/worktree 破棄 (`gtr rm --delete-branch`、Keychain item 未発行=回収不要) ③ 最新 base の新 worktree で `-C どこからでも` should 1本のみ追加 → **PR #213 → merge 済み** (かいじゅう確認)

### 学び (このログの核)

- **隔離と git 履歴は別軸**: worktree + CLAUDE_CONFIG_DIR は「どのハーネスを読むか/どこを編集するか」を分けるが、**全 worktree は 1 つの git 履歴を共有**する。隔離しても stale base から切れば conflict する。図解 HTML: `260721_isolation-vs-git-conflict.html`
- **branch を切る前に pull**: `gtr new` は local main を base にする。behind N のまま切ると「既に直っている問題を知らずに二重修正」が起こる。**「behind N」表示は harness hold 中でも branch 作成時には生きたリスク信号**
- **L0→L1 ラダーの生きた実証 (皮肉な一周)**: あたしの gtr ミスは #211 の Gotcha が塞ごうとした失敗の 4 回目の再発 (doc には「かいじゅう証言でセッション跨ぎ 3 回以上再発」と記録済み)。しかも「修正は既に存在していたのに stale local ゆえ読めなかった」— **昇格先 (doc) に Gotcha を置いても、読み手の doc が古ければ read-miss する**。read-path 原則に「read するファイルの鮮度」という前提条件があることの実測
- **PR 前 conflict チェックの価値**: 重複・conflict は push 前の `git log <base>..origin/main -- <files>` 一発で検出できた。このチェックが無ければ conflict する PR を出していた
- **「修正した?」への正直**: かいじゅうの「修正した?」に対し、直前まで提案だけで未実行だった (L0 のまま) ことを認めてから実行した。「言った=やった」ではない

### skill 化ライン (現状スナップショット)

- ブリーフ: study PJ `.docs/design/2026-07-21_harness-adoption-audit-skill-brief.md` (9c0faae)
- 隔離セッション成果: `skills/harness-adoption-audit/` (SKILL.md 70行 + references/output-contract.md 97行)、commit 21f8e67 on `skill/harness-adoption-audit`。essence gate 正当通過 (bypass なし)
- ブリーフ超えの点: step 6「独立トレーサビリティ検証ゲート (fail-close)」を workflow へ昇格 / 記事=未検証外部入力 (injection 防御) の skill ローカル再宣言 / read-only Explore で verifier 境界を tool レベル担保
- あたしの独立レビュー findings: **[Medium]** step 6 の検証者に `Explore` (excerpt 読み・audit しない定義) は照合判断タスクにミスマッチ → full-file 読み明示 or audit 可能 agent へ / **[Low]** global skill に kaiju/PJ 固有語彙 (「push はかいじゅう専用」「取り入れフェーズ第N弾」) / **[Low]** description 長大 + 裸 trigger「深掘り」の過剰発火リスク
- 修正プロンプト handoff 済み → 隔離セッションの対応待ち (skill branch の rebase to current main も必要: base が stale 459cf72)

## 副作用

- `fix/gtr-launch-form-clarify` branch は破棄 (unpushed・重複ゆえ損失なし)。commit 3cd09e4 の内容のうち rule 追記分 (multi-agent-safety の gtr bullet) は PR #213 に**含めなかった** — #211 の rule (`failure-promotion-trigger.md`) と isolation doc が既にカバーし、rule 側の重複記述を避けた
- skill worktree (`skill/harness-adoption-audit`) は stale base (459cf72) のまま — 新規ファイルのみで conflict しないが、PR 前に rebase 推奨 (修正プロンプト対応時に併せて)

## 関連ファイル

- `~/.claude/.docs/progressive-disclosure/harness-worktree-isolation.md` — 第1節に #211 Gotcha (gtr new/go) + PR #213 の `-C どこからでも` should が入った現正本
- `~/.claude/rules/failure-promotion-trigger.md` — #211 の L0→L1 昇格トリガー rule (pull で live 化)
- `.docs/design/2026-07-21_harness-adoption-audit-skill-brief.md` — skill 設計ブリーフ (9c0faae)
- `.docs/output/explain-in-html/260721_isolation-vs-git-conflict.html` — 隔離 vs conflict の図解
- `/Users/camone/.claude-worktrees/skill-harness-adoption-audit/skills/harness-adoption-audit/` — skill 実体 (21f8e67、レビュー修正待ち)
- PR #213 (merge 済み): https://github.com/kaijutale/claude-harness/pull/213
