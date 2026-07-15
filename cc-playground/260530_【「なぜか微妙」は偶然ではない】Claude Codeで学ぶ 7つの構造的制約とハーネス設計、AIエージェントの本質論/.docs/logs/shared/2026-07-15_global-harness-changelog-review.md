---
date: 2026-07-15 20:37:54
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-14 夜〜07-15、前回 07-14 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論

related_skill: [logging]
related_log_ids: [2026-07-14_global-harness-changelog-review, 2026-07-12_global-harness-changelog-review, 2026-07-13_config-dir-isolation-misjudge-and-three-retractions]
related_log: [.docs/logs/shared/2026-07-14_global-harness-changelog-review.md, .docs/logs/shared/2026-07-12_global-harness-changelog-review.md, ~/.claude/.docs/logs/local/2026-07-15_issue-173-permission-deny-harness-paths.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-14 夜〜07-15) — 前回の「穴」は 20 時間で塞がり、防御を殺す新しい機序 (プラットフォーム仕様変更) が現れた

> 前回レビュー (07-14 20:06) は「ハーネス実体は main で無防備。穴は今も開いている」で終わった。それから 12 時間後に #173 の deny 封鎖が merge され、穴は機械で塞がれた (settings.json 現物で確認済み)。一方で同日、**Claude Code 本体の仕様変更が既存の Write(...) 権限ルール 25 個を無言で失効させていた**ことが判明 (#178、OPEN)。「防御が存在するのに効かない」の 8 つ目の機序は、自前のバグではなく**地盤 (プラットフォーム) が動く**だった。

## 概要

前回レビュー以降の `~/.claude` 変更を、ハーネス側 work ログ 4 本 / git first-parent / gh issue / settings.json 現物で実測確認した (2026-07-15 20:37)。

- **CLOSED (4 本)**: #129 #168 #172 #173 (PR #174 / #175 / #176 が merge、#177 は取り下げ CLOSED)
- **OPEN (7 本)**: #133 #144 #146 #156 #160 #170 **#178 (新規)**
- **main の commit (first-parent、07-14 20:00 以降)**: merge 3 件 (74171a3 / 820d7d3 / 51d8ba4) + 直 commit 2 件 (8fe7392 settings の model 既定変更 = かいじゅうの /model 操作の回収、e5100fe ログ回収) — 直 2 件はどちらも #173 封鎖の**設計上の除外対象** (`.docs/logs/` `.docs/output/`、および agent の Edit/Write ツールを経ない変更) で、封鎖と矛盾しない
- **claude-harness 現況 (実測)**: main が origin より ahead 2 (未 push = 上記直 2 件)、untracked 1 件 (`260715_write-rule-startup-warning.html` = #178 の解説 HTML)

## 内容

### 1. #173 — 前回「開いている」と書いた穴が、20 時間で機械封鎖された

前回レビューの結論 4 (「ハーネスの実体は main で無防備」) への直接の回答。`permissions.deny` に Edit/Write の対で 8 行が追加された (**settings.json 97〜104 行目に実在することをあたしが確認**):

```
Edit/Write(~/.claude/rules/**)
Edit/Write(~/.claude/skills/**)
Edit/Write(~/.claude/agents/**)
Edit/Write(~/.claude/.docs/progressive-disclosure/**)
```

`settings*` 自体の deny も 89〜90 行目に在る。変更経路は「worktree + PR」の 1 本に畳まれ、散文の約束 (「直接編集しない」) が実際に破られた事実を受けて機械で止める形に移行した。

**見逃せない副産物が 2 つ**:

- **過去の実測ログが全項目ハズレていた**。glob 深さの先行ログ (2026-05-02) は「`*` は `/` を跨がない」「裸の絶対パス deny は機能する」と記録していたが、07-15 の再実測で**全部逆** (`*` は跨ぐ / `**` は深さ無制限 / 裸の絶対パスは 1 件もマッチせず無言で無効 / 有効なのはチルダ形式のみ)。**「実測済み」にも鮮度がある** — 測った日の Claude Code の仕様に対する実測でしかない
- **検証 rig 自身が 3 回壊れ、3 回とも「偽の DENIED」を出した** (xargs のタブ潰し / bash 置換のリテラル `\` 混入 / モデルの自発拒否を deny と誤読)。毎回、**統制群 (deny 無し) が ALLOWED にならないこと**で発覚した。「止まった」ではなく「止まった理由」を識別子 (`File is in a directory that is denied...` か否か) で切り分けるまで、成功に見える失敗が残る

### 2. #178 (新規 OPEN) — プラットフォーム仕様変更が防御を無言で殺した

07-15、`claude` 起動時 (v2.1.210) に警告 25 行が出た。Claude Code 本体の仕様変更で、ファイル権限チェックの照合が `Edit(path)` 形式に一本化され (Edit 1 本で Edit/Write/NotebookEdit をカバー)、**`Write(path)` 形式は「書いてあっても無視される死んだルール」になった**。settings.json の `Write(...)` 25 個 (deny 23 / ask 2) が該当。

| 区分 | 件数 | 実害 |
|---|---|---|
| Edit 対あり (#173 の 4 パス含む) | 23 | ガードは Edit 側が引き継ぎ**健在**。Write 行は警告ノイズのみ |
| Edit 対なし (`Write(**/.env*)` / `Write(**/secrets/**)`) | 2 | **書込ガードが現在失効中** (Read 側 deny と sandbox 層は生存) |

前回レビューの「防御が存在するのに効かない」7 件は全て**自前の設計・実装の穴**だった。#178 は 8 つ目にして初の**外因** — 防御は建てた日の仕様の上に立っており、**地盤が動くと触っていないのに壊れる**。救いは観測チャネルが機能したこと: 起動時警告という「向こうから来る signal」が 25 行出たから気づけた。`.env`/`secrets` の 2 個は警告を出しつつ**ガード喪失という実害**が出ており、修正は worktree + PR 経由で未着手 (OPEN)。

### 3. #172 — 「散文の複製契約」2 つを byte 一致 assert で機械化

worktree 隔離の起動形 1 行は正本 doc の他に guard 2 枚 + skill 4 箇所へ逐語複製されており、**実際に 2 回ドリフトした** (#155 で `cd` が 7 箇所欠落 / #172 発端で `--effort xhigh` が guard 2 枚だけ未同期)。漏れた 2 箇所は deny メッセージ = **起動を誤った人間に「正しい起動形」として提示される文字列そのもの**で、変更の目的が最も必要な瞬間に達成されない場所だった。

- 正本 doc 内の HTML コメント marker 区間を単一ソースに、byte 一致 checker (`launch_form_sync.sh`) + commit ゲート stage (e) で機械強制
- record 命名契約 (`<date>_<HHMMSS>_<slug>.md`) も生成器 + validator で機械化。実害 (時刻欠落 record が名前降順で常に「最新」に勝ち、その日の全改修が誤 record を読み続けた) を再現するテスト付き
- **設計の肝は issue 当初案の実測否定**: hook は隔離されない (settings.json が絶対パスで live の hook を呼ぶ) ため、「テストを `--changed` に載せる」だけでは **live のテストが live のツリーを検査するだけ**で、改修が実際に行われる worktree レーンが丸ごと死角になる。gate 側で commit 対象ツリー (`git rev-parse --show-toplevel`) を明示検査する二層にした。**「テストが緑」は「テストが置かれたツリーが健全」しか意味しない** — 前回の Goodhart 3 件に連なる知見
- 副作用: essence-gate hook が **809 行に肥大** (7 系統)。line-limit hook は warn 止まり。分割は別 issue 候補

### 4. #129 — stop-words hook の FP を ledger 全数分類で削減

前回レビューで「防御が効かない」7 件の 1 つだった stop-words hook (#132 で偽古語 7 語を撤去) の続き。今回は hook-fire ledger 全 262 行から現行 live 3 ルールの発火 19 件を**全数分類**し、FP の最大塊を特定して修正した (PR #176 merge)。

- 推測ルール FP 5/12 = 「かもしれない」を**引用して撤回する良い挙動**への誤発火 → 全角引用「」内を照合対象外に (use/mention 設計の #128 未実装側を完成)
- ヘッジ 3 語 (`半分は` 等) は decisive-answers.md **推奨の量的分解**に誤発火 → SSOT に無い 3 語を削除 (hook⊆SSOT 回復)
- 独立 2 reviewer が一致して指した核心: **FP は ledger で観測できるが、「」除去が生む FN (見逃し) と「引用で括れば逃れられる」自己回避 channel は原理的に観測できない非対称**。approve 側 ledger は未実装 (KNOWN GAP 開示)
- 現場の罠: jq のパイプ集計がサンドボックスで多バイト値を潰し、全 rule が同一値に collapse。grep 直接カウントの裏取りで正しい分類を得た — **集計ツールの出力も自己申告** (前回 C-4 の表に 5 行目が増えた)

### 5. #168 — 「作ったガード」を実運用で発火しないという理由で取り下げた

essence_gate 系テストの flaky を機械再現したら、**真因 (テストが実 `$HOME` の共有 records dir に書き、並行実行で衝突) は #163 が 2 日前に hermetic 化で根治済み**だった。pre-#163 版は 4 並行で 8/8 全滅、現行は 8 wave × 4 並行で 0 失敗 — before/after を数値で固定してからクローズ。

注目は回帰ガード (PR #177) の**取り下げ判断**: ガードは技術的には完成していた (canary 検出・C0/H0 レビュー通過) が、実測で**手動 full run-all でしか走らない**と判明。commit 時の自動ゲートは `--changed` + 固定併走のみで、CI も無い。かいじゅうの「手で run-all は一生使わない」で、**発火しない保険は無価値**として merge せず捨てた。「ガードが存在する」を成果と数えない — 前回の結論 1 (防御の存在と効くことは別) を、今度は**出荷前に**適用できた事例。

失敗の記録も濃い: 仮説「tmp 衝突」を字義解釈して一度誤否定 (真の共有資源は records dir) / **検証せず推測を繰り返して stop-words hook に実際に弾かれた** (防御が TP で機能した live 事例。#129 で FP を削った同じ hook) / grep ヒットを実行と早合点 → 実はコメント行で、当該 hook は settings.json 未登録の**完全 dormant** (「hooks/ に置いただけでは発火しない」の生きた実例)。

## 重要発見 — 7 制約へのマッピング

### 「防御が存在するのに効かない」の機序が 8 種類目に到達し、初めて外因が現れた

前回 7 件は全て自前の穴 (自己無効化 / 述語不整合 / アンカー依存 / 誤定義 / …)。#178 の機序は**プラットフォームの仕様変更**で、ハーネス側は 1 バイトも触っていない。「防御は建てた日の仕様の上に立つ」— これは C-2 (セッション間の断絶) の変種でもある: **世界の側が変わったことを、どのセッションの記憶も知らない**。対抗手段は (a) 起動時警告のような外から来る signal を無視しない (b) ledger による発火実測の定期棚卸し (#129 が実演) — 「防御が生きているか」は書いた時ではなく**動いた実績**で確認するしかない。

### C-4 (自己申告は証拠にならない) — 「検証装置」と「集計ツール」が表に加わった

| 自己申告の主体 | 何を申告したか | 真実 |
|---|---|---|
| 検証 rig (#173) | 「DENIED」(3 回) | rig 自身のバグ / モデルの自発拒否。統制群で発覚 |
| jq 集計 (#129) | rule 別の発火件数 | サンドボックスで多バイト値が collapse、全 rule 同一値 |
| grep ヒット (#168) | 「hook が間接呼び出されている」 | コメント行。実体は完全 dormant |
| 過去の実測ログ (#173) | 「glob は 1 階層」(2026-05-02) | 現行仕様では全項目逆 |

**「実測」も置いた瞬間から陳腐化が始まる。** 対になる規律は「止まった理由の識別子まで切り分ける」「統制群を置く」「該当行を開いてから断定する」。

### C-5 (Goodhart) — 「ガードを作った」を成果にしない判断が 2 件

#168 (発火しないガードを取り下げ) と #172 (「テスト緑」がどのツリーの健全性かを問い直して gate 側検査を足した)。前回は「テストが欠陥挙動を守っていた」という**受動的な Goodhart 検出**だったのに対し、今回は**出荷前に「この指標は目的を代理しているか」を問うて能動的に捨てた/足した**。ハーネスの成熟が 1 段進んだ観測。

### C-7 (校正盲) — 「方向は正しく、場所の解釈だけ誤る」パターン

#168 の仮説「並行→共有状態の衝突」は正しかったが、「共有状態 = /tmp」と字義解釈して一度否定した (真実は $HOME の records dir)。仮説検証は「どの共有状態か」の同定まで含めて初めて完了する。同セッションで stop-words hook が推測の繰り返しを機械で弾いており、**C-7 を散文でなく hook が止めた**のは前回までに無かった構図。

### 防御の網が「自分を守る」方向に閉じ始めた

#173 (実体の main 直編集封鎖) → #172 (複製契約の commit ゲート) → #129 (執行 hook 自体の精度改善) → #178 (封鎖の地盤点検、進行中) と、今回の 4+1 本は全て**ハーネスがハーネス自身を守る層**の改修。本PJ の言葉で言えば、C-1〜C-7 への防御を「置く」フェーズから「防御自体を検証・維持する」フェーズ (メタ防御) に移っている。

## まとめ (本PJ への含意)

1. **観測 → issue → worktree + PR → merge のループが 20 時間で穴を塞いだ** — 前回レビュー時点で「未起票」だった main 直改修の穴は、翌朝には deny 8 行として landed していた (現物確認済み)。記録が意思決定に直結した好例
2. **防御を殺す機序に「外因」が加わった (#178)** — 自前のテスト・レビューをどれだけ固めても、プラットフォーム仕様変更は防御を無言で失効させる。起動時警告・ledger 実測など「動いた実績」の監視だけが対抗手段
3. **散文の契約は必ずドリフトする** — 逐語複製 6 箇所は 2 回壊れた。byte 一致 assert + commit ゲートという「機械の同期」に置き換えた (#172)。ただし機械化の代償として gate は 809 行に肥大 (C-1 は消えない、場所を変えるだけ)
4. **ガードの価値は「存在」でなく「実運用で発火するか」** — 完成していた PR #177 を、発火経路が無いという一点で捨てた。前回の結論 1 の教訓が、出荷前の判断基準として機能し始めた

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-14_global-harness-changelog-review.md` — 前回レビュー (07-12 夕〜07-14、「穴は開いている」の初出)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の定義
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/local/`、各 issue の正本ログ)

- `2026-07-15_issue-173-permission-deny-harness-paths.md` — deny 封鎖 + glob 再実測 + rig 3 回の偽 DENIED
- `2026-07-15_issue-172-launch-form-byte-sync-record-naming.md` — byte 一致 assert 機械化 + live/worktree ツリー取り違えの発見
- `2026-07-15_issue-129-stop-words-fp-quote-mention-stripping.md` — ledger 全数分類 + FN 不可観測の非対称
- `2026-07-15_issue-168-flaky-preexisting-fix-163.md` — 真因は根治済み + ガード取り下げ判断 + 失敗 3 種の記録

### 現物 (本レビューで実測)

- `~/.claude/settings.json` — deny 8 行 (97〜104 行目) + `settings*` deny (89〜90 行目) の実在を確認 (穴が塞がった証拠)
- `~/.claude/.docs/logs/shared/permission-deny-glob/2026-07-15-glob-depth-remeasure.md` — glob 仕様の再実測正本 (2026-05-02 ログを supersede)
- GitHub `kaijutale/claude-harness` — CLOSED: #129 #168 #172 #173 (+PR #177 取り下げ) / OPEN: #133 #144 #146 #156 #160 #170 #178。gh で開閉・日時を確認
- `git -C ~/.claude log --first-parent` — merge 3 + 直 commit 2 (除外対象内) を確認。main は origin より ahead 2、untracked 1 件 (#178 解説 HTML)
