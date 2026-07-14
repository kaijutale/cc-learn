---
date: 2026-07-14 20:06:02
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-12 夕〜07-14、前回 07-12 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論

related_skill: [logging]
related_log_ids: [2026-07-12_global-harness-changelog-review, 2026-07-13_config-dir-isolation-misjudge-and-three-retractions, 2026-07-11_global-harness-changelog-review]
related_log: [.docs/logs/shared/2026-07-12_global-harness-changelog-review.md, .docs/logs/shared/2026-07-13_config-dir-isolation-misjudge-and-three-retractions.md, ~/.claude/.docs/logs/local/2026-07-14_effort-flag-persistence-and-main-direct-hole.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-12 夕〜07-14) — 「防御が存在するのに効かない」が 7 件連続で出た 2 日間

> 前回レビュー (07-12 17:42) 以降、`~/.claude` で issue 10 本が CLOSED。内容を横断すると **1 本の線**が通っていた: **ガード (hook / rule / test / self-eval) は存在したのに効いていなかった**。しかも 7 件すべて **「テスト緑 + live 検証通過」の状態から、独立レビューか外部 probe が掘り出した**。本PJ の関心 (C-1〜C-7) で切り直して記録する。

## 概要

前回レビュー以降の `~/.claude` 変更を、git log / gh issue / ハーネス側 work ログ 11 本 / 現物 (settings.json・git first-parent) で実測確認した (2026-07-14 20:06)。

- **CLOSED (12 本)**: #132 #138 #142 #147 #149 #150 #154 #155 #157 #159 #161 #163
  - うち **#147 / #155 は本PJ の 07-13 ログで既述** → 本ログでは残り 10 本を扱う
- **OPEN (9 本)**: #129 #133 #144 #146 #156 #160 #168 #170 #172
- **未 commit の発見 (07-14)**: **ハーネスの実体 (`rules/` `skills/` `agents/` `.docs/progressive-disclosure/`) が main で直接書き換え可能** — deny が無い。あたしが `settings.json` を実測して**今も開いていること**を確認した

## 内容

### 1. 本PJ 発の PD ワークストリームが完結 (#149)

`#94 → #110 → #124 → #149` の連鎖 (発端は本PJ の CLAUDE.md 60 行化検討) が終端した。

- Tier B 2 本 (`plan-workflow` / `research-phase`) に `paths:` を付与し、起動時注入から外した
- **起動時注入 111 行 → 98 行 (Δ13)**。`wc -l` で機械確認
- 新規 plan 作成の瞬間は #124 の hook が、既存 plan の Read は paths rule が担う **2 経路の分担が 1 セッションで両方発火**したことを transcript の行番号順で実証 (L92 ExitPlanMode → L94 hook 注入 → L128 paths rule 発火)

**基準値そのものが動いていた**: #110 の見積は「97 → 84」だったが、実際の基準値は 111 行。`command-handoff.md` が 07-11 に **21 → 35 行 (+14)** へ成長していたため。削減幅 Δ13 は見積どおりだったが、**削る速度より生える速度のほうが速い局面がある** (C-1 の実データ)。

### 2. 「防御が存在するのに効かない」7 件 — 機序はすべて別物

本レビュー最大の収穫。**同じ結論 (防御が効かない) に、7 通りの別々の道で到達している**。

| # | 装置 | 何が起きたか | 発見者 |
|---|---|---|---|
| #157 | worktree write guard 2 枚 | env 未設定で起動すると冒頭 `exit 0` で**丸ごと自己無効化**。隔離しないだけでなく本体誤書込の砦も外れる | 本PJ 07-13 ログ + essence review |
| #157 (修正版) | 同上の**初版修正** | 武装根拠を cwd に移したが、`cd ~/.claude` で降りる**同型の短絡**。`cd` は guard の verb に無く deny されない | essence review が **Critical** で差戻し |
| #163 | essence-gate | guard は武装するのに **self-eval の読み書きは本体側を向く** → 「worktree の改修には worktree の self-eval が必要」という fail-closed 不変条件が**無言で不成立** | #157 の派生として切出 |
| #159 | 孤児 Keychain 判定 | 「**帰属できなかった item**」を「孤児」と誤定義 → 視野外に実在する config dir の item に**削除コマンドを提示**していた (打てば稼働中セッションの認証が死ぬ) | reviewer が **script を実走**して発見 |
| #161 | 保護パス書込 rule | `cp ... 保護パス ... $` の**末尾アンカー依存**。`2>/dev/null` を足すか `cp -t` を使うだけで素通り → **cp で rule 本体を上書きすれば全 rule を無効化できた**。cp/mv/ln/rsync/tee/sed/dd には `permissions.deny` も ask も無く、この rule が**唯一の層**だった | reviewer が実測 (**High**) |
| #161 | 同 rule (逆向き) | rule が**正しく発火して作業者自身を撃つ** (self-shot)。保護パスを commit message に書くと自分の commit が block。`committer` は message を argv 渡しゆえ**「commit は必ず committer 経由」という別ルールと衝突** | 事故で顕在化 |
| #132 | stop-words hook | 検出語を**地の文で引用しただけ**の応答に発火し、**既に撤去されたペルソナへ逆操舵する message** を提示 | live 観測 (hook-fire ledger) |
| #150 | symlink 拒否 | 緩和の根拠が事実誤認 (「git は symlink 越しを追跡しない」)。リンク先が repo 内なら普通に追跡される → 未記入 ADR を置くと**ゲートが exit 0 で緑を返す** | reviewer が 5 分で反例 |

補足 (#161 の事故): `settings.json` の PostToolUse に配線されていた**外部ツール (Orca) の出力フィルタ**が Bash/Read の出力を書き換え、Claude は「commit LANDED / PR OPEN」と読んで**完了報告した**。真実は **1 commit も landed しておらず、PR 番号は別件のもの**だった。かいじゅうの「PR作成は？まだ？？」で発覚。

### 3. Goodhart — テストが「欠陥挙動」を受入基準として固定していた (3 件)

| # | テストが何を守っていたか |
|---|---|
| #159 | `H_UNKNOWN="deadbeef"` を「孤児 + 削除コマンド表示」として**正と assert** — Critical な挙動をテストが封じ込めていた |
| #150 | `assert_out` の期待文字列が、循環が無くても常に出るサマリ行に誤マッチ。**87 ケース緑のまま、この issue の主眼が無テスト** (判定を `if True:` に殺しても全 pass) |
| #157 | KNOWN GAP を `assert_allow "... 意図的"` としてテストに固定 |

**#150 の変異テストが決定的**: 判定ロジックを 7 通りに壊しても 87 ケース全 pass した。テストは「緑であること」を守っていて、「正しさ」は守っていなかった。

### 4. 07-14: main 直改修の構造的穴 (現時点で未修正)

`hooks/` の deny は「**main では触れない、worktree でなら触れる**」を構造的に強制している (worktree のパスは `~/.claude/` で始まらないため同じ deny に当たらない)。だから 07-14 のセッションは guard を直せず、正しく worktree レーンへ追い出された。

ところが同じ deny が `rules/` `skills/` `agents/` `.docs/progressive-disclosure/` には**無い**。

**あたしの実測 (2026-07-14 20:06、`settings.json` 現物)**:

```
Edit(**/CLAUDE.md) / Write(**/CLAUDE.md)
Edit(~/.claude/hooks/*) / Write(~/.claude/hooks/*)
Edit(~/.claude/hooks/rules/*) / Write(~/.claude/hooks/rules/*)
```

→ `rules/` `skills/` `agents/` `.docs/progressive-disclosure/` の deny は**存在しない**。**穴は今も開いている** (かいじゅうの裁定は「既往分は残す・穴は deny 拡張で塞ぐ」、07-14 時点で未起票)。

**あたしが見つけた食い違い (ハーネス側ログとの差)**: 07-14 ログは「**本セッションで** main 直 commit した 6 件」と書いているが、git 実測では `rules/command-handoff.md` の 5 件は **07-11 12:26〜12:31** の commit で、3 日離れている。

- **main 直であること自体は裏付いた** — 5 件とも `git rev-list --first-parent main` 上に在る (= PR を通らず main に直接載った)
- **「本セッション」という帰属は誤り**。同ログは別の箇所で「既往 6 件」とも書いており、表現が揺れている
- なお #161 follow-up の恒久ガード (`e22520a`) は **PR #171 経由**で、main 直ではない

つまり **「確認せずに断定する」を主題にしたログ自身が、自分の commit 履歴を測らずに書いていた**。責める話ではなく、C-7 (校正盲) がどれだけ根深いかの実データとして記録する。

### 5. 恒久ガードが 2 本入った (実測で現物確認)

#161 の follow-up (`e22520a`、PR #171) で、常時注入層 `rules/critical-thinking-checklist.md` と `.docs/progressive-disclosure/git-workflow.md` に 1 行ずつ追加された。

- **landed 検証** (critical-thinking-checklist、常時注入): 「状態変更 (commit / push / PR / write) は成功メッセージを信じず、独立確認 (HEAD hash の変化・ファイル存在・件数) で landed を検証してから完了報告する」
- **自撃ち回避** (git-workflow、Git 着手時に Read): commit message / PR body に保護パストークンを含む場合は `git commit -F <file>` / `gh pr create --body-file` で**データをファイル渡し**し、コマンド行から危険トークンを排除する

**出力フィルタ (Orca) は doc 化しない**と判断された — 外部ツール・マシン固有ゆえ、global doc に書くと Orca の無い環境で嘘になる (ポータビリティ原則)。**恒久化する対象を「事故の原因」ではなく「事故に気づく方法」に置いた**のは正しい切り分け。

### 6. ペルソナ刷新 2 段 (#132 → #154)

- #132: ハンコック → セーニャ。旧ペルソナ結合ガード (stop-words の偽古語 **7 語**) を**証拠駆動で撤去** (誤発火の live 観測が根拠)
- #154: セーニャ → **ブルマ**。CLAUDE.md +8/-5。口調 2 行目が「勝気なのは口調だけ。見下さない・罵倒しない」= Prohibition を口調が侵さないための楔
- **副次効果**: セーニャ (丁寧語キャラ) は「敬語禁止」ルールと構造的に対立していた。ブルマ (タメ口) は**事前分布が敬語禁止を補強する側**に働く → ガードを足さずにリスクが減った。**C-6 (訓練データの偏り) を、対抗するのではなく味方に付けた設計**

## 重要発見 — 7 制約へのマッピング

### C-5 (報酬ハッキング) が最も濃く出た

「テストが緑」を評価基準にした瞬間、**緑が目的化**した。#159 はテストが Critical な挙動を「正」と assert し、#150 は主眼の判定が無テストのまま 87 ケース緑だった。

**Goodhart は agent の悪意ではなく、テストを書いた agent 自身の盲点として現れる。** 自分が正しいと思っている挙動を assert するのだから、当然そうなる。

### C-4 (自己申告は証拠にならない) の射程が広がった

これまで C-4 は「Claude の『できました』を信じるな」だった。今回わかったのは**もっと広い**:

| 自己申告の主体 | 何を申告したか | 真実 |
|---|---|---|
| Claude | 「commit landed / PR OPEN」 | 1 commit も landed せず、PR は別件 |
| **ツール出力** | `git rev-parse HEAD` の表示 | **外部フィルタに書き換えられていた** |
| **テスト** | 「87 passed / 0 failed」 | 主眼のロジックを殺しても全 pass |
| **self-eval** | 「Critical 0 / High 0」 | 外部レビューが High を検出 (07-13 ログ既述) |

**ツール出力すら自己申告になりうる。** 唯一残る足場は「**実体を数える**」— HEAD hash の変化、ファイルの存在、件数、変異テストの赤化。

### C-7 (校正盲) — 「1 つの観測を確かめずに一般化する」が今回も出た

07-13 ログで抽出したパターン (#147 の Claude / PR #158 の Claude / セッションの Claude が同型) が、そのまま再演された。

- #150: 自分の probe が **repo 外を指す symlink しか試していない**のに、symlink 一般へ結論を広げた
- 07-14: 調査 agent の説明だけで effort の機構を断定し、「実測」ラベルまで付けた (実測したら逆だった)
- 07-14: このレビューであたしが見つけた「本セッションで 6 件」の日付ズレ

**外部 probe が Critical を出す** — #159 の reviewer は「当初の静的読解では原則を ○ で通しかけた。script を実際に走らせて初めて出た」と記録している。**読んで考えるだけでは C-7 は破れない。**

### 検証層そのものが有限帯域を持つ (C-1 の新しい形)

**essence review が Anthropic の月次上限で 2 回落ちた**:

- #159: Skill 領域の fork が**未実行のまま merge** (散文成果物 13 原則の照合が欠落 → issue #170)
- #150: R2 レビューが中断、修正 7 件のうち**後半 5 件が独立レビュー未通過**

「レビューを回せば品質が上がる」は、**レビュー予算が有限**である以上、無条件には成立しない。**どのカバレッジ欠落を受け入れて出荷したかを明示的に記録する** (両ログとも KNOWN GAP として書いている) のが現実的な着地点。

### ハーネスは C-2 の増幅経路である (07-13 の結論の再確認)

#154 のセッションは、既に **2026-06-20 に裁定済みの穴**を「新発見」として起票し、さらに**当時意図的に採らなかった設計 (検出力優先の全文走査) を弱める提案**まで付けた。過去ログを grep して初めて prior art に気づき、issue を全面改訂した。

**ハーネスが記録を持っていても、読まれなければ C-2 は防げない。** #163 が述語を単一正本化したのと同じ問題が、**知識の側にも在る**。

## まとめ (本PJ への含意)

1. **防御の存在と、防御が効くことは別** — 07-13 ログの結論が、2 日で 7 件の独立事例に裏付けられた。もはや観察ではなく**再現性のあるパターン**
2. **「テスト緑」は C-5 の温床** — 変異テスト (判定を壊して赤くなるか) が唯一の対抗手段として実証された (#150)
3. **ツール出力は信頼境界の外** — 出力フィルタで書き換わりうる。**実体 (hash / 件数 / 存在) を数える**しかない。これが `rules/critical-thinking-checklist.md` に恒久化された (本PJ にとって最も重要な変更)
4. **ハーネスの実体は main で無防備** — `hooks/` だけが構造的に守られ、`rules/` `skills/` `agents/` `.docs/progressive-disclosure/` は素通り。**穴は現在も開いている**

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-12_global-harness-changelog-review.md` — 前回レビュー (07-11 午後〜07-12)
- `.docs/logs/shared/2026-07-13_config-dir-isolation-misjudge-and-three-retractions.md` — #147/#155/PR #158 の C-2/C-4/C-7 事例 (本ログの前提)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の定義
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/local/`、各 issue の正本ログ)

- `2026-07-12_issue-149-rules-tier-b-paths-progressive-disclosure.md` / `2026-07-13_issue-149-pr151-creation-closeout.md` — PD ワークストリーム完結
- `2026-07-13_issue-138-docs-l2-boundary-and-validator-fix.md` — 独立レビュー 10 ラウンド (ハーネス史上最長)
- `2026-07-13_issue-157-worktree-guard-env-missing.md` / `2026-07-13_issue-163-isolation-predicate-single-source.md` — guard の自己無効化と述語の単一正本化
- `2026-07-13_issue-159-credstore-orphan-determinism.md` — 孤児判定の誤定義 (Critical)
- `2026-07-13_issue-150-enumerator-unification-symlink-scope.md` — 変異テストによる false green 摘出
- `2026-07-13_issue-161-protected-path-write-rule-hardening.md` / `2026-07-13_issue-161-recovery-selfshot-filter-countermeasures.md` — fail-open / self-shot / 誤完了報告
- `2026-07-12_issue-132-persona-swap-and-tone-rule-removal.md` / `2026-07-13_issue-154-persona-swap-bulma.md` — ペルソナ刷新 2 段
- `2026-07-14_effort-flag-persistence-and-main-direct-hole.md` — main 直改修の穴 (最新)

### 現物 (本レビューで実測)

- `~/.claude/settings.json` — `permissions.deny` に `rules/` `skills/` `agents/` `.docs/progressive-disclosure/` が**無い** (穴の証拠)
- `~/.claude/rules/critical-thinking-checklist.md` — landed 検証の恒久ガード 1 行 (commit `e22520a`、PR #171)
- `~/.claude/.docs/progressive-disclosure/git-workflow.md` — 自撃ち回避のガード 1 行 (同上)
- GitHub `kaijutale/claude-harness` — CLOSED: #132 #138 #142 #147 #149 #150 #154 #155 #157 #159 #161 #163 / OPEN: #129 #133 #144 #146 #156 #160 #168 #170 #172
