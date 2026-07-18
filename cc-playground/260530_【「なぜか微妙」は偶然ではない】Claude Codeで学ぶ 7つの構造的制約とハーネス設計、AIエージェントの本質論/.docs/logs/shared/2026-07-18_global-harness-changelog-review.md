---
date: 2026-07-18 12:10:01
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-17 夜〜07-18、前回 07-17 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論
related_skill: [logging]
related_log_ids: [2026-07-17_global-harness-changelog-review, 2026-07-16_global-harness-changelog-review, 2026-07-15_global-harness-changelog-review, 2026-05-24_llm-7-constraints-c-prefix-meaning]
related_log: [.docs/logs/shared/2026-07-17_global-harness-changelog-review.md, .docs/logs/shared/2026-07-16_global-harness-changelog-review.md, .docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-17 夜〜07-18) — 「同型で作れ・全テスト緑・測定済みFPゼロ」の三つの安心は、それぞれ別の隠れた前提の上に乗っていた

> 前回レビュー (07-17 20:41) は「CLOSED 5 / OPEN 7、配備 ≠ 実効が 3 クラス同日確定」で終わった。それから約 15.5 時間で **さらに CLOSED 5 本 (#195 #197 #191 #192 #184) / merged PR 5 本 (#198 #199 #200 #203 #204)**。OPEN は 7→5 に減ったが単純な −2 ではなく **5 close + 3 新規 (#201 #202 #207)** の差引。今回の主旋律は、実装者が寄りかかっていた **信頼できる信号 3 つ ——「隣と同型で作った」「全テスト緑」「測定して FP ゼロ」—— が、それぞれ書かれていない前提の上に乗っていて、前提が外れると静かに壊れた** こと。①「同型で作れ」は前提=責務が read-only (#195: 隣は検査官・本件は書き換え器で、同じ trigger の緩さが前者では無害・後者では破壊)、②「全テスト緑」は前提=テストが critical 経路を踏める (#195 は 44/44 緑で踏めず、#184 は §5 を §6 化してガードだけ写し忘れた)、③「測定して FP ゼロ」は前提=測定器がその軸を測れる (#191: `glob_denies_path` は over-block 専用で層間非対称を測らず、§4 の穴が全緑を Goodhart 的に通過)。全部拾ったのは fresh review・変異テスト・軸を変えた再測定で、実装者の自己検証は 1 つも拾えなかった。

## 概要

前回レビュー以降の `~/.claude` 変更を、ハーネス側 local ログ 6 本 (work 6) / git first-parent / gh issue・PR / worktree list / `~/.permprobe*` 実在確認で実測した (2026-07-18 12:10)。

- **CLOSED (5 本)**: #195 (PR #198) / #197 (PR #199) / #191 (PR #200) / #192 (PR #203) / #184 (PR #204) — 全て merge 済みを gh で確認。前回 OPEN 7 本のうち #184 #191 #192 #195 #197 の 5 本が完走
- **OPEN (5 本)**: #187 (generator 化) / #190 (混合 case × Grep 走査残差) は前回から持ち越し。**新規 3 本**: #201 (§4 specific-filename の glob 鏡像化、#191 開示残差) / #202 (`.pgpass`/`.my.cnf`、#191 スコープ外) / #207 (#188 の是正が露出させた handoff blocked 通知の連発ループ)。7→5 は「5 close + 3 新規」の差引で、3 本全部が今回の作業で切り出した正規の残差
- **OPEN PR (2 本)**: #205 (issue #190 の現バージョン開示裁定、**merge 不可** = fresh review 用) / #206 (issue #202、`.pgpass`/`.my.cnf`/`.mylogin.cnf` を完全名 deny)
- **main の commit (first-parent, 07-17 21:00 以降)**: merge 5 件 (#198 #199 #200 #203 #204) + 直 commit (ログ回収複数)。**model pin の往復は今回なし** (前回の `1348118`→`68bb15e` 是正後、#195 の churn hook が構造的に再発を止めた)
- **claude-harness 現況 (実測)**: local HEAD = `a698023`、origin/main 実体 = `a698023` (ls-remote 一致)。**前回「merge 2 本分 pull 遅れ」だった local main はキャッチアップ完了・完全同期**。未 push 0。ただし **working は `M settings.json` + untracked 5 件** (essence progress json 2 + explain-html 3)。worktree は main + issue-190 + issue-202 の 3 本 (どちらも進行中 = merge 済み撤去待ちではない)。`~/.permprobe-186` / `-186.old` / `-190` が残存 (rm handoff 未実行、前回からの持ち越し + #190 分が純増)

## 内容

今回の 6 本は 2 系統に分かれる。**系統 A = 秘密 Read 網の FP/穴の反復** (#191 #192 #184、#160→#185 からの継続で「玉ねぎの皮むき」4〜6 段目)。**系統 B = メタ・ハーネス衛生** (#195 settings churn / #197 署名フッター / #207 通知ループ)。

### 1. #191 / PR #200 — 真因は「語彙」でなく「glob の形」。測定器の軸に盲点があった (C-5)

#185 が `tokens` を語彙から抜いても消えなかった FP を根治。`**/*-keys` 等の**拡張子無し glob 形**が実在 npm パッケージの**ディレクトリごと** deny していた (`object-keys/` / `path-key/`、しかも**ハーネス自身の `skills/receiving-secret/` を `**/*-secret` で自己 deny**)。

- **測定法の是正が肝**: `find -name` (#185 の物差し) ではディレクトリ巻き添えは原理的に見えない。#185 review が是正した**ディレクトリ照合 `glob_denies_path`** で 9 語を再走査 → 巻き添え ~7000 files (hyphen 6639 / bare 376 / underscore 72)、**固有に守る実在秘密ゼロ**。
- **真因の再定義**: 巻き添えは拡張子の無い glob 形がディレクトリ成分 (拡張子を持たない) に当たることから従う。実在秘密は snake_case + 拡張子か dotfile なので、拡張子付き 4 形で押さえられる。**語彙軸 (#185) では届かず、形軸で初めて根治**。
- **是正**: 拡張子無し 4 形除去 + `keys` 全除去 (perm 224→148 / sandbox 184→108)、hook 右境界 `(\.|$)`→`\.` で glob と対称化、git-credential-store の 2 パス (`~/.git-credentials` + XDG) を代替カバー。全スイート 46/46 緑、essence review GO (Medium×1 + Low×2 を commit 前是正)。
- **Goodhart の実測 (C-5)**: 是正後の物差し `glob_denies_path` は **over-block (FP) 検出専用**で under-block (層間非対称) を測らない。§4 の裸 credentials 穴 (hook DENY / glob ALLOW) はこの軸で滑り抜け、**全テスト緑を Goodhart 的に通過**していた。essence reviewer が「同じ器で層間対称も健全と結論する危険」を名指し。→ 残差を #201 化。

### 2. #192 / PR #203 — passwd 系は「置き場所で撃つ」。revert でなく fix-forward

`.htpasswd` / `htpasswd` / `/etc/master.passwd` / `/etc/shadow` — 本物の password ハッシュを持つ 4 件が #191 後の網 (§5 拡張子 + §6 語彙 8 語 + 右境界 `\.`) を全て素通りしていた。issue の数値を鵜呑みにせず main 実バイトで 4/4 ALLOW を再現してから着手。

- **完全名・パスアンカーで撃つ理由**: `shadow` を §6 語彙に足すと `**/*-shadow.*` が `box-shadow.css` を deny (#185 と同型 FP)。`passwd` を basename 語彙にすると #185 で意図的に ALLOW した `/etc/passwd` を巻き込む。→ hook §4b に `(^|/)\.?htpasswd$` / `(^|/)etc/(shadow|master\.passwd)$`。**置き場所 (canonical path or 完全名) で撃てば FP ゼロ** (#185 §3 / #191 `.git-credentials` と同設計)。
- **射程差の設計**: `.htpasswd` (dotfile) のみ glob 2 射程。**bare `htpasswd` は glob に入れない** — `**/htpasswd` は live matcher が `htpasswd/` パッケージディレクトリを gitignore 意味論で一括 deny する #191 の FP クラス再発。`shadow`/`master.passwd` は `/etc` アンカーの hook 一次防御のみ (glob の `**/` は cwd 外 `/etc` に届かず・実測 #186、`~/` は `/etc` を表現不能)。
- **revert でなく fix-forward の判断 (セッション末尾の学び)**: かいじゅうが「レビュー前に merge された」状態で GitHub の Revert ボタンを押し revert PR 直前まで到達 → **判断: revert は「削除」であって「レビュー」でない**。レビューは merge 済みでも Files changed / main diff で完全にできる。merge commit 方式の revert は revert-の-revert を将来生む。問題があれば fix-forward。revert 画面を捨て #192 は main に残した。

### 3. #184 / PR #204 — 末尾アンカー→成分マッチ。「同型構造には同型ガード」(C-7)

§5 拡張子網 (`\.(key|pem|...)$`) と glob 両層が**末尾アンカーのみ**だったため、`sa.key.json` (GCP SA 鍵の実在命名) / `server.key.bak` / `cert.pem.orig` / `AuthKey_*.p8` (Apple) が全層で allow。「拡張子位置にあるが名前の末尾ではない」派生サフィックス秘密。#160 裁定の前提「canonical な秘密は拡張子網が backstop する」が破れていた。

- **是正**: 末尾アンカー `$` を成分マッチ `(\.|$)` へ (全 13 拡張子一律)、`.p8`/`.secret` 追加 (11→13)。拡張子は部分一致と違い FP を作らない §5 の設計原則を成分マッチでも維持 (find -iname corpus で中間成分形の実 FP 0 件)。
- **`.keys` 却下の決定打 (HITL 実測裁定)**: 候補 `.keys` を測ると 71 件ヒット、**全て core-js `es.object.keys.js`** (Object.keys polyfill) = #191 が根治した巻き添えの再開放。→ 却下。既存 `key` (単数) は `.keys.` (複数) にヒットしない (`.key.` を要求) ため FP ゼロ維持。
- **DTCG 不変条件が最も壊れやすく壊れなかった (grayzone)**: 成分マッチ `(\.|$)` は `token` の直後が `s` (`.tokens.`) だと当たらず弾く → `colors.tokens.json` は allow 維持。**もし `$` を単純に外していたら DTCG design tokens 保護 (#160/#185 の資産) が壊れていた**。境界規則の選択がそのまま不変条件の保持に直結。
- **「§5 化」が生んだ盲点 (C-7 の核心)**: #184 は §5 を単一 regex から「4 箇所に複製された拡張子語彙」へ拡張した。これは §6 (語尾命名網) が既に持つ構造だが、**§6 には extract_words の drift 検知があり §5 には無かった**。将来 hook に 1 拡張子足して glob 追随を忘れると層間非対称がサイレント発生 = #184 が潰す迂回圧力の再発。essence reviewer が指摘するまで気付けず、**自分の実装は全テスト緑を通過していた** (Goodhart)。→ test(3b) で hook §5 regex から拡張子列を抽出し EXT184 と機械突合、glob 両層と連鎖ロック。
- **並行レーンの実証**: #192 (PR #203) が先に merge → task 指示どおり追いマージ。**conflict なしで auto-merge** ('ort' strategy) — #192 の §4 (settings 84-85 行) と #184 の §5 (87 行〜) が非重複領域。統合 probe で両意図の共存を独立確認 (両者の捕捉 8 型 = 全 DENY、両者 FP 境界 = 全 ALLOW)。worktree 隔離 + 非重複領域での自動統合が実務で機能した。

### 4. #195 / PR #198 — 「同型で作れ」が根因だった: 形は写せても、形が成立していた前提は写せない (C-2)

`/model` `/effort` がアプリに書かせる個人設定 (`model` / `effortLevel`) を git に入れない決定論的 hook を新設 (PreToolUse/Bash、committer の `git add` より先に working file を HEAD へ正規化)。**今回のレビュー期間で最も鋭い単一の学び**。

- **根因 = 指示による入力バイアス (C-2)**: issue の指示は「隣接する essence gate / adr gate を踏襲し同型で作れ」。実装者はそれに従い**trigger 正規表現もそのまま写した** (前置クラスに `[[:space:]]` を含み引数位置の言及でも発火する形)。

| | 隣接 gate 2 枚 | 本 hook |
|---|---|---|
| 責務 | **read-only の検証器** | **正規化器 (working file を書き換える)** |
| 過剰発火の帰結 | 無害 (評価して approve するだけ) | **settings.json を書き換える** |

  実測実害: `which committer` / `echo '(git commit is the way)'` で **かいじゅうの `/effort` が無言で medium→xhigh に巻き戻った**。commit と無関係な読み取り専用コマンドで個人設定が壊れる。**同型で写すべきだったのは trigger 正規表現ではなく fail-closed の規律の方**。「隣と同じ形」を機械的に写すと、**その形が成立していた前提条件 (責務が read-only であること) ごと写せない — 前提条件は形に書かれていないから**。是正: 正規表現のパッチ当てを全廃し、awk の文字走査状態機械 1 本で「コマンド骨格」を生成する土台へ差替 (trigger/carve-out/cd 抽出の 3 判定すべてを骨格だけに向ける)。

- **「片側を直すと反対側へ倒れる」を 6 ラウンド (C-7)**: essence review を 6 回回し**6 回とも実在欠陥**。**6 回中 5 回、修正自体が次の欠陥を生んだ** (毎回「指摘された側だけ直し対になる側を放置」の同型)。個々のバグでなく「シェル文字列を正規表現で近似する」土台が原因で、骨格方式へ差し替えて初めて収束。reviewer が毎回突いた軸は「テストが構造的に踏めない経路」 — 初版は `do_commit` が必ず hook の後に stage する fixture ゆえ **Critical 経路を原理的に踏めず、それでも 44/44 緑** (自己申告は証拠にならない・C-4)。
- **変異テストで assert の歯を確認 (C-4)**: 「全緑」を信じず中核機構を壊してテストが落ちるか実測 → 骨格化無効=5 赤 / index 検査殺す=4 赤 / … だが **事後検証 (POST_DIFF) を殺す=0 赤 = 歯が無かった**。踏める実ケースを見つけてテスト追加し 3 赤へ。「この 1 ケースが無いと事後検証を丸ごと削除しても全緑」とコメントに明記。
- **プロセスの反省 (かいじゅうからのフィードバック)**: ①「長くね？」= self-eval を無言で連投し進捗が見えなかった → 回すたびに短く報告すべき。②「説明が下手すぎて理解できん」= 結論が最初から A 一択なのに 3 択 (A/B/C) を並べて判断を丸投げした → **推奨が 1 つなら 1 つだけ言う** (decisive-answers の実運用)。③自作自演のノイズ (background run 中に対象を編集して「1 file failed」を自作)。④`perl -0pi` の `-i` でバックアップ (復元元) 自体を破壊。

### 5. #197 / PR #199 — バイナリ逆読みで注入元を止める。truthy vs nullish の残差開示

PR body への `🤖 Generated with [Claude Code]` フッター混入 (実績 #189/#193) を、注入元の機械停止 + hook backstop の二段で根絶。

- **根本原因をバイナリ逆読みで確定 (v2.1.212)**: 「フッターは Claude の癖でなく毎セッション system prompt へ注入される指示」を実測再現。注入元 `GZg()` が `# Git` セクションを組み立て、解決済み attribution 値が **falsy (空文字) だと `filter(Boolean)` が bullet ごと落とす**。解決 `OZg()` は `??` (nullish) ゆえ `""` を保存する。→ `settings.json` に `attribution: {commit:"", pr:""}` を足すと「End PR bodies with:」行が生成されない。設定キーの根拠は zod schema (`includeCoAuthoredBy` = `"Deprecated: Use attribution instead."`)、公式 docs 未掲載ゆえ**バイナリ実測が一次根拠**。
- **backstop**: `hook_pre_generated_comment_ban.sh` に `--body-file`/`-F <path>` の**中身走査**を追加 (inline 検査の死角)。test 23→34。
- **truthy vs nullish の残差開示**: PR フッターにはもう 1 経路 `$Zg()` (native PR stat フッター) があり、そちらは `if(n.attribution?.pr)return...` = **truthy 判定**ゆえ `pr:""` を尊重せず fallthrough しうる。Claude の PR 作成経路 (`GZg` 由来 system prompt → `gh pr create`) は経路外だがスコープ外として明示記録 (base ハーネスの truthy/nullish 不整合)。
- **自撃ちの回避 (C-4)**: `ls-remote | head -1 && echo "あり"` は head が空入力でも exit 0 ゆえ「push 済み」を偽陽性検知 → 生出力 / `git rev-parse` 一致で独立再確認。「状態変更は成功表示を信じず独立確認」が効いた実例。PR body 自身が新 hook の検査対象になり、署名リテラルを伏字化 + Write ツール経由で自撃ちを回避。

### 6. #207 — 是正が是正した物に新バグを生んだ: #188 の余波 (debounce 無しの通知ループ)

前回レビューの主役だった #188 (9 hook の沈黙死是正) が、`hook_stop_handoff_check` の blocked 通知を**可視化した結果**、連発抑制が無いことが露出した。状態変化ゼロのアイドルで同一通知が毎 Stop 発火しループする。**「沈黙死を直したら、今度は喋りすぎになった」** — #185 のメタ再帰・#195 の 6 ラウンド自己生成の穴と同じ「fix が fix した物の中に次を作る」構造 (C-7)。放置でなく issue 化されて台帳に載っている。

## 分析 — 7 制約への対応づけ

> **正本ラベルの訂正 (supersede)**: 前回まで本シリーズは `C-2` を「セッション間の断絶」の意で使っていたが、記事 Part I 冒頭の全体図 (正本、`2026-05-24_llm-7-constraints-c-prefix-meaning.md`) では **C-2 = 入力バイアスの増幅 (最初の情報に引きずられる)**。過去ログの観測値は有効だが、ラベルの帰属だけ本稿から正本へ揃える (上書きせず注記で射程限定 — ハーネス自身が実践する #186 supersede 作法の踏襲)。以下は正本ラベル。

### C-2 (入力バイアスの増幅) — 「同型で作れ」という指示が実装を誤った形へ錨づけた

#195 が今回の白眉。「隣接 gate を踏襲し同型で作れ」という指示 (最初に与えられた情報) が、実装を**trigger 正規表現の逐語コピー**へ引きずり、その形が成立していた前提 (責務 = read-only) は書かれていないので一緒に写せなかった。アンカリングの実害が「読み取り専用コマンドで個人設定が無言で壊れる」という具体形で出た。**教訓: 「同型で作れ」を受けたら、写すのは形でなく『形が守っている不変条件』**。前提を明示的に問い直す一手が C-2 のブレーキになる。

### C-5 (報酬ハッキング / Goodhart) — 測定器の軸と全テスト緑が、それぞれ別の穴を通した

- #191: `glob_denies_path` は **over-block 専用**で層間非対称を測らず、§4 の穴が全緑を通過。「同じ器で層間対称も健全」と結論しない規律を残した。
- #184: §5 を §6 化したのに §6 の drift 検知を写し忘れ、**全テスト緑を通過** (essence reviewer が指摘するまで気付けず)。
- 共通形: **評価基準 (テスト緑) の充足は「良さ」を保証しない**。測定器が測れない軸を、fresh review が名指しした。

### C-4 (自己申告は証拠にならない) — 「全緑」「push 済み」を独立確認・変異・軸変えで潰す

- #195: 44/44 緑でも Critical 経路を構造的に踏めず / 変異テストで POST_DIFF に歯が無いと判明。
- #197: `ls-remote | head` の偽陽性 push 検知を独立再確認で捕捉。
- #191: `find -name` から `glob_denies_path` へ軸を変えて初めて巻き添えが見えた。
- 「テストが緑 = 欠陥が無い」を信じず、**変異テスト (assert の歯) / 独立確認 (状態変更) / 軸を変えた再測定**が固定費として定着。

### C-7 (校正盲 = 知らないことを知らない) — 実装者に原理的に見えない穴を fresh review が拾う

#195 の 6 ラウンド (5/6 は修正が次の穴を生む) / #184 の「§5 化のガード欠落」/ #207 の「沈黙死を直したら喋りすぎ」。いずれも**実装者の自己検証の探索範囲では見えず、フレッシュコンテキストの reviewer が拾った**。#195 の self-eval が明記する通り「critical_count: 0 は欠陥が無い証明ではなく、Lead の探索範囲で見つからなかったの意」— 校正盲を構造 (別コンテキスト) で補う設計が徹底されている。

### 隔離・並行レーン・HITL — 運用の成熟

- **並行レーンの自動統合** (#184←#192): 非重複領域ゆえ conflict なし auto-merge、統合 probe で両意図の共存を独立確認。worktree 隔離が実務で機能。
- **HITL の使われ方**: #184 の拡張子採否 (`.p8`/`.secret` 採択・`.keys` 却下・`.secrets`/`.apikey` 見送り) は**測ってから裁定**、#192 の revert vs fix-forward は「revert は削除でありレビューでない」と原則で判断。**聞けば安全でなく、機械で潰せる所を潰し切ってから裁定が要る残りだけを枠ごと渡す**運用が続く。

## まとめ (本PJ への含意)

1. **信頼できる信号は隠れた前提の上に乗る** — 「隣と同型」「全テスト緑」「測定して FP ゼロ」は、それぞれ「責務が read-only」「テストが critical 経路を踏める」「測定器がその軸を測れる」という書かれていない前提を持つ。前提が外れると信号は緑のまま実体が壊れる。**信号を受け取る側は『この信号が守っている不変条件は何か』を明示的に問う**のが唯一の防御 (#195 #184 #191 が三者三様に同じ形)。
2. **秘密網は 4〜6 段目でも次を出したが、玉ねぎは可視化されている** — #160→#185→#191→#192→#184 と each fix が次の穴を出し、#201/#202/#190/#207 を新たに carve out した。だが**残差は全て issue 化されて台帳に載り、開示コメントに「完備とは主張しない」と明記**されている。穴が増えたのではなく、見えている穴の解像度が上がった (前回の「OPEN 2→7 は退行でなく解像度」の継続)。
3. **fix が新バグを生むのは構造的だから、fresh review と変異テストは固定費** — #195 の 6 ラウンド (5/6 が自己生成) と #207 は偶発でなく「修正は毎回、対になる側を放置する形で入る」という LLM の傾向 (C-7)。別コンテキストの reviewer と assert の歯の実測を毎回払う設計でしか収束しない。
4. **git 同期はキャッチアップ、ただし settings churn と untracked は慢性** — 前回「merge 2 本分 pull 遅れ」は完全同期へ回復し、model pin 往復は #195 hook が構造的に封鎖した。だが working には再び `M settings.json` (churn、hook が commit 時に正規化する対象そのものが live で湧いている) + untracked 5 件 (essence progress json / explain-html)。掃除待ちの `~/.permprobe-186/-186.old/-190` も純増。「決定論的 hook で守れる churn」と「手動掃除が要る副産物」が明確に分かれている。

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-17_global-harness-changelog-review.md` — 前回レビュー (配備 ≠ 実効の 3 クラス同日確定)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の正本定義 (本稿の C-2 ラベル訂正の根拠)
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/local/`、各 issue の正本ログ)

- `2026-07-17_issue-195-settings-churn-normalize-hook.md` — 「同型で作れ」が根因 / 6 ラウンド自己生成の穴 / 変異テストで assert の歯 / プロセス反省
- `2026-07-18_issue-197-pr-footer-attribution-ban.md` — バイナリ逆読みで注入元特定 / truthy vs nullish 残差 / `ls-remote | head` 偽陽性
- `2026-07-18_issue-191-vocab-form-fp.md` — 真因は語彙でなく形 / 測定器の軸 (Goodhart) / 開示残差の誠実さ
- `2026-07-18_issue-191-pr200-merge-closeout.md` — #191 merge closeout + follow-up (#201 #202) の台帳化
- `2026-07-18_issue-192-passwd-family-deny.md` — 完全名・パスアンカー / 射程差設計 / revert でなく fix-forward
- `2026-07-18_issue-184-extension-component-match.md` — 末尾アンカー→成分マッチ / 同型構造には同型ガード / DTCG 不変条件 / #192 追いマージ

### 現物 (本レビューで実測)

- GitHub `kaijutale/claude-harness` — CLOSED: #195 #197 #191 #192 #184 (PR #198 #199 #200 #203 #204 全て MERGED を gh 確認) / OPEN: #187 #190 #201 #202 #207 / OPEN PR: #205 (merge 不可・fresh review 用) #206
- `git -C ~/.claude` — local HEAD `a698023` == origin/main (ls-remote 一致、完全同期)・未 push 0・working `M settings.json` + untracked 5
- `git -C ~/.claude worktree list` — main + issue-190 + issue-202 (どちらも進行中)。`~/.permprobe-186` / `-186.old` / `-190` 残存
