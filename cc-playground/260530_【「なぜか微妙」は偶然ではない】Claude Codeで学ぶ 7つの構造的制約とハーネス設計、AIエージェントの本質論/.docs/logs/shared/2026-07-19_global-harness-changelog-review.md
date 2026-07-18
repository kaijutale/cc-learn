---
date: 2026-07-19 00:13:16
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-18 午後〜07-19、前回 07-18 12:10 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論
related_skill: [logging]
related_log_ids: [2026-07-18_global-harness-changelog-review, 2026-07-17_global-harness-changelog-review, 2026-07-16_global-harness-changelog-review, 2026-05-24_llm-7-constraints-c-prefix-meaning]
related_log: [.docs/logs/shared/2026-07-18_global-harness-changelog-review.md, .docs/logs/shared/2026-07-17_global-harness-changelog-review.md, .docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-18 午後〜07-19) — OPEN issue が本シリーズで初めてゼロに。だが最後の穴を塞いだのは、機械ゲートの視界の外にいた「人・一次成果物・第三者」だった

> 前回レビュー (07-18 12:10) は「CLOSED 5 / OPEN 5、5 close + 3 新規の差引」で終わった。それから約 12 時間で **残り OPEN 5 本 (#190 #202 #201 #207 #187) が全て CLOSED**、加えて重複起票の #208 が NOT_PLANNED で即クローズ。**OPEN issue = 0 / OPEN PR = 0 — 本シリーズ (07-11 開始) で初めて追跡台帳が空になった**。今回の主旋律は前回の続きにして反転でもある。前回は「信頼できる信号 (同型・全緑・測定 FP0) は隠れた前提に乗る」だった。今回は **その信号を審査する機械ゲート自身に構造的な視界の穴があり、今回効いた欠陥は全部その視界の外にあった** こと。①essence review (全 15 原則) は GO を出したのに rig の **API 従量課金組込 (rule 抵触)** を拾えず、拾ったのはかいじゅう (#190)。②WebFetch と guide agent の「独立した反証」は同じ doc 要約に依拠していて独立でなく、決着を付けたのは CLI 本体バイナリ = 一次成果物 (#207)。③Round 1 の独立 reviewer が見逃した 2 件を、視点の違う coordinator 盲検が拾った (#201)。機械ゲートは「自分が見る軸」では緑を出すが、**軸の外は測っていないという事実自体を報告しない (C-7 校正盲)** — だから最後の関門は必ず人・一次成果物・視点の違う第三者になる。

## 概要

前回レビュー以降の `~/.claude` 変更を、ハーネス側 local ログ 4 本 (work 4) / git first-parent / gh issue・PR / worktree list / `~/.permprobe*` 実在確認 / `git fetch` 後の同期実測で調べた (2026-07-19 00:13)。

- **CLOSED (今回窓で 5 本 + 重複 1)**: #202 (PR #206) / #190 (PR #205) / #201 (PR #210) / #207 (PR #209) が merge 完走。#187 は **HITL 裁定で close** (PR 無し、後述)、#208 は #207 の重複起票ゆえ NOT_PLANNED。前回 OPEN 5 本が全て決着
- **マイルストーン: OPEN issue = 0 / OPEN PR = 0** — 追跡台帳が空。gh で二重確認 (`gh issue list --state open` = 0 件、`gh pr list --state open` = 空)。**ただし「穴ゼロ」ではない**: 各ログが開示する恒久残差 (裸 `credentials` の Grep 経路素通し / `.npmrc`・`.pypirc` の over-block / `/etc` 系は hook 単層のみ / #190 の case-scan 非対称 = 現バージョン開示受容) は設計上残る。加えて手動フォロー 2 件 (`~/.permprobe-*` 3 dir の rm / #190 upstream 報告ドラフトの人手提出) が未消化
- **merge した PR (今回窓 4 本)**: #206 (18:32) → #205 (19:18) → #209 (23:08) → #210 (23:08)。**#205 は前回「merge 不可・fresh review 用」だった PR** が review 差し戻し全是正を経て merge に到達 (状態が反転)
- **main の commit (first-parent, 07-18 12:00 以降)**: merge 4 件 (#206 #205 #209 #210) + 直 commit (work ログ 4 本 / 解説 HTML 複数 / essence progress 2 件 / settings attribution 追従の回収)。**model pin の往復・settings churn は今回なし** (前回 `M settings.json` の慢性churn は #195 hook + 回収 commit で一掃)
- **claude-harness 現況 (実測)**: local HEAD = `7b79278`、origin/main 実体 = `7b79278` (`git fetch` 後の ls-remote 一致)。**完全同期・未 push 0・未 commit 0・working clean**。前回の `M settings.json` + untracked 5 は全て commit で解消。worktree は **main 1 本のみ** (前回の issue-190 / issue-202 worktree は merge 後に撤去、#190 の HTML は撤去前サルベージ済み = commit `7b79278`)。`~/.permprobe-186` / `-186.old` / `-190` の 3 dir だけ rm handoff 未実行で残存 (前回からの持ち越し、純増なし)

> **同期の実測メモ (C-4 の実演)**: セッション開始時の git-sync-reminder は「未 push 5 件」と告げ、最初の `ls-remote` は `ed33d10` を返した。だが `git fetch` 後に再測すると サーバ実体・追跡 ref・HEAD が全て `7b79278` で一致し **未 push 0**。これは並行セッションの push が最初の測定と fetch の間に着地したレース (multi-agent 環境)。**成功表示や最初のスナップショットを信じず fetch 後の ls-remote で再確認**して初めて「同期済み」が確定した。`! git push` の handoff は不要。

## 内容

今回の 4 本は 3 系統。**系統 A = 秘密 Read 網の玉ねぎ底 (#202 #201、#160→#185→#191 系列の 7〜8 段目、ただし残るのは開示済み恒久残差のみ)**。**系統 B = メタ・ハーネス衛生 (#207、#188→ の余波を根治)**。**系統 C = 新クラス: 自作ツール (rig) の rule 遵守盲点 (#190)**。C が今回の白眉。

### 1. #190 / PR #205 — 機械ゲートが GO を出したのに、rig が rule を破っていた。拾ったのは人 (C-5 + C-3)

前回「merge 不可・fresh review 用」で保留していた #190 (混合 case の秘密が Grep 走査で漏れる層内非対称、現バージョン開示 + upstream 報告で受容) の PR #205 を、review 差し戻し是正 → **3 段の是正**を経て merge。今回窓で最も密度の高い単一の学び。

- **(1) fresh review 差し戻し (HIGH 1 / Med 3 / Low 4)**: HIGH = 再現 rig `probe-190-case-scan.sh` の `REPO_ROOT` が `../../../..` (4 段) で `.docs` に解決 → settings.json 不達 → **deny 網ゼロのまま「漏れなかった」偽陰性を静かに出す**欠陥。5 段へ修正 + settings 不達で FATAL exit / deny 本数 <100 で FATAL の**偽陰性ガードを 2 枚**追加 (`set -e` には頼らない — probe 本走は deny/エラーが期待信号ゆえ正常系で倒れる)。Med = test 2d-190 に**参照先ログの実ファイル存在チェック**追加 (rename/削除で dangling でも緑を通る Goodhart を塞ぐ = C-5)。
- **(2) rule catch — essence review が見逃した API 課金組込 (本セッションの核心)**: HIGH の「修正版 rig を実走して確認」の課金範囲を AskUserQuestion で聞いた際、**かいじゅうが「`claude -p` はサブスク枠外の API 従量課金では?」と指摘**。かいじゅう自身のノート要約 (`260603.md`) が決定打 — 2026/6/15 以降 `claude -p` = プログラマティック利用は月次クレジット (API 価格消費)、CLAUDE.md Prohibition「API 従量課金は明示指示まで禁止」に抵触。rig の `claude -p --max-budget-usd 0.60` はまさにそれ。裁定 = **「実行をガードで封じ、レシピは残す」**: 両 rig (#190 / #186) の `claude -p` を撃つ関数先頭に `billing_gate` を配線し、`PROBE_ALLOW_BILLING=1` を**人間が明示 export した時だけ**通過・それ以外は SKIP。無課金レシピ (tree 構築 / inode 表 / deny 注入) はガード外。回帰 test 10 assertions でガード実在を機械ロック (essence review の死角の backstop)。両 rig 全課金ケース SKIP・課金 $0 を live 実証。
- **(3) coordinator 2nd review — bash 3.2 固有バグ**: `with_hook()` の `local ev="$1" hs="$2" p="$OUT/net-$ev.json"` が **この機体唯一の bash である 3.2.57** で「同一行 local の後続変数が先行変数を参照すると unbound」で失敗。指摘を鵜呑みにせず `which -a bash` + 最小再現で独立検証してから 2 行分割で修正 (「問題ゼロを疑う」の対称 = 「指摘された問題も検証する」)。
- **教訓 3 点 (かいじゅう / 現場)**:
  - **「AskUserQuestion で課金選択肢を出す」こと自体が rule 迂回の誤り (C-3)**。rule で禁じた課金を「聞けば OK」で扱おうとした。agent が選択肢を並べて選ばせるのは「明示指示」ではない — 真の明示指示は**人間が自分の言葉で言うこと**。かいじゅうの「待て」が正解。
  - **essence review (全 15 原則照合) の死角**: 原則 11「rig は観測から生まれる」の陰に「rig が課金を撃つ」が隠れ、GO を出した。→ record に「原則 14/identity の課金境界を rig・スクリプト成果物にも明示適用する照合軸」を追加。
  - **「再現可能」の射程を正直に割る**: plumbing (無課金・agent 再検証済み) と tool_result (課金・人間ゲート・ロジック無変更ゆえ前回記録が有効) の二層に分けて開示。課金せずに「壊れた装置で嘘の再現性を名乗らない」を満たした。

### 2. #207 / PR #209 — #188 の余波を根治。「独立に見える反証」が同根で、決着は一次成果物が付けた (C-2 + C-7)

前回レビューで新規 issue 化した #207 (status=blocked のアイドルで同一 blockers 通知が無限ループ、実測 40 周超。#188 が沈黙死を直して通知が届くようになった結果、連発抑制の不在が露出) を、Claude Code 公式のループ防止契約で根治。

- **修正の核**: stdin JSON の `stop_hook_active == true` (= 直前の継続が stop hook 起因の再帰) を最上段で検出し、通知の単一出口 `emit_context` が沈黙 (exit 0)。1 回目 (false) は通知、それが誘発した 2 回目以降 (true) は沈黙。全 status 分岐 (blocked/in_progress/planning) の連発を choke point 1 箇所で塞ぐ (分岐別 hash 抑制でなく根治)。
- **契約の裏取りで「独立レビューが fix を否定する」場面に遭遇 (C-2 の核心)**: `stop_hook_active` の実在確認で、WebFetch (docs.md の小型モデル要約) は 2 URL とも「フィールドは存在しない」、独立の `claude-code-guide` エージェントも「公式に無い、`decision:block` を使え」と **fix を否定**。だが**両者とも同じ docs 要約に依拠** = 独立の反証に見えて同根 (最初の情報に両方が引きずられた)。決着は **一次成果物 = CLI 本体 (Mach-O v2.1.214) の strings 抽出**: 入力スキーマに `stop_hook_active:S.boolean()` 実在、埋め込みガイダンス verbatim「For Stop/SubagentStop hooks, check stop_hook_active ... return success while it's true」= 「true の間は success を返せ」が公式推奨。ループ上限 env `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` も同時発見。→ **「独立レビューが自分と同じ未検証ソースに依拠していれば独立の反証にならない」/ 権威階層は doc 要約 (小型モデル) < CLI 本体の literal schema**。
- **fix が次の欠陥を生む型の再演 (C-7)**: Round 1 で「抑止が無観測」を埋めた ledger 計装が、Round 2 (coordinator 盲検) で**その計装自体の過剰計上**を指摘された (`stop_hook_active` は全 Stop hook 共有の旗ゆえ handoff 不在/completed でも最上段で 1 行刻む)。記録判定を最上段から `emit_context` へ後置し would-emit を抑止した時だけ計上する形へ是正。#195 の 6 ラウンド・#185 のメタ再帰と同型。
- **検証**: 本 hook テスト 21/0、全スイート 47/0。ミューテーション耐性 (再帰検出削除 / 検出を出口の下へ / would-emit 限定解除 / liveness 削除) 全て赤。**merge 後の運用ゲート (必須)**: 実 blocked セッションで `sensor=liveness` 行の発火追跡 — 恒常沈黙 (0 行) = 失明疑い / 過剰 = 過剰計上疑い。worktree の hook は merge 前に live 配線されず (settings が絶対パスで本体を呼ぶ) live ループ再現は構造的に不能ゆえ、この観測が「契約 live 未検証」を運用でゲート化する。

### 3. #202 / PR #206 — DB クライアント credential を完全名 deny。「1 つの deny 反転」が全 assert を嘘にする (C-5)

`.pgpass` / `.my.cnf` / `.mylogin.cnf` (本物の DB password/ハッシュ) の hook・glob 両層素通しを完全名で塞ぐ。merge 直前 fresh review の Med×2 / Low×2 を全是正して merge。

- **かいじゅう裁定 option (a) が核心**: `/etc/my.cnf` / `/etc/mysql/my.cnf` (DB password) が §4b `/etc/shadow` (OS password) と**非対称に未カバー**。§4b と構造同一の path-anchor `(^|/)etc/(mysql/)?my\.cnf$` を hook §4c に 1 行追加。glob 層は §4b 同様**非配備** (/etc は cwd 外 = glob 射程外、hook 一次防御が唯一の層)。→ `settings.json` は未変更。
- **1 つの裁定が芋づるで波及 (グレーゾーン記録 = C-5 の実務形)**: option (a) は `/etc/my.cnf` 系を **allow → deny に反転**させるため、①既存テストの allow assert を deny へ反転 + rootfs deny 追加 + 境界 allow (etc/ 外の裸 my.cnf・suffix-copy `.bak`) を新規 lock、②essence record の「隣接 allow 17 型」「残差 (ii)」等が全て陳腐化 → probe-before-persist の精神で全て round-2 実態へ修復 (allow 17→15)。→ **教訓: security hook の deny を 1 つ足す判断は、テスト assert と review record の『その挙動を allow と主張していた全箇所』を同時に嘘にする。裁定前に「連動する記述の棚卸し」が要る**。
- **検証の落とし穴 (C-4)**: `bash run-all.sh | grep ... | head` はサマリ行を head 切り捨て + パイプ末尾 `grep -c FAIL` が 0 件で exit 1 → background task が「failed」と偽通知。**権威ある信号は run-all.sh 自身の exit code** (`RUN_ALL_EXIT=0` / `46 file(s) passed, 0 failed`)。テスト 46/46 緑。

### 4. #201 / PR #210 — §4 を「安全 subset / 恒久残留」に機械二分。視点の違う 2 段レビューが実カバレッジを生んだ (C-7)

#191 の「hook-primary posture」開示残差を穴埋め。§4 specific-filename を 2 クラスに機械分類し、安全 subset だけを glob 両層へ鏡像化。

- **2 クラス機械分類**: `.netrc`/`.npmrc`/`.pypirc` = **安全 subset** (先頭ドット付き完全名・canonical は file、`**/<name>` は directory に部分一致しない) → glob 両層×2 射程へ鏡像化。裸 `credentials` = **hook-primary 残留 (恒久)** (`**/credentials` は `credentials/` dir と区別不能 → 塞ぐと #191 巻き添え再発)。層間対称は #160(b)「読める層から読む迂回圧力を生む」原則の要請。perm/sandbox 両ブロックへ 12 本純追加 (cosmetic churn 0)。
- **M-B (かいじゅう裁定 option a) — dotfile 規則 ≠ global config カバー**: dotless の `$PREFIX/etc/npmrc` (npm builtin/global config、`_authToken` を持ちうる) は `.npmrc` dotfile 規則に当たらず両層素通し。**#202 の `/etc/my.cnf` と全く同型の穴**で、同じ path-anchor 解 `(^|/)etc/npmrc$` が効く (中間 etc/ で /etc・/usr/local/etc・/opt/homebrew/etc を全捕捉)。glob 非配備・settings 未変更。
- **視点の違う 2 段レビューが実カバレッジを生む (C-7)**: Round 1 独立 reviewer は case 軸/over-block (開示軸) を検出したが **M-A (deny テストが `.npmrc` 1 本のみ = 2 クラス分類の土台が 1/3 しか検証されていない)・M-B (global npmrc の穴) は見逃した**。coordinator 盲検が後者 2 件を検出 — レビューアの視点差が実質カバレッジを生んだ (#191 record 自身が under-block 盲点を独立 reviewer で拾った先例の再現)。
- **membership を効力の証拠にしない (#186)**: test の membership 検査は「意図した射程の形が JSON に書かれている」ことのみ保証 = Read 経路で発火する効力の証拠ではない (効力確定は #186 の live 測定の射程)。hook test 127/0、run-all 47/0。
- **現場知 (grayzone)**: ①essence-gate が commit を block — self-eval record に機械可読 verdict (`critical_count`/`verdict` の YAML) が無いと止まる。`severity_counts: {...}` 表記では parser が読めず先例形式へ揃える必要。**SKIP_ESSENCE_GATE で迂回せず record を機械可読化するのが正道**。②`sed -i` の bulk-replace が「一括置換禁止」hook を発火 → Edit ツールへ切替。③load 137 の CPU 枯渇で FP proxy test が這う (hang でない) → アンカーを直接 grep で決定的に証明し full test 完了を待たず最終状態を検証。

### 5. #187 — HITL 裁定で「作らない」を選んだ close (規模半減 × 発生頻度ゼロ)

352 entry 手書き JSON の generator 化 issue。**PR を作らず HITL 裁定で close (COMPLETED ラベルだが実体は「割に合わないので作らない」)**。裁定の根拠を実測で固めた: ①規模は起票時 352 → 128 entry へ**半減済み** (#185/#191 の除去)、②#183 以降の語彙変更は**削除 3 語のみで追加実績ゼロ**、③4 箇所同時編集の drift は語彙突合テストで**機械ロック済み・実害ゼロ**。保守コスト vs 発生頻度で generator 化は割に合わないと裁定。将来語彙追加が頻発したら本 issue の再スコープ節を土台に再起票する含みを残した。**「根本原因修正」と対の「対処しないという根拠付きの決定」を、実測で裏付けて台帳から外した**好例。

## 分析 — 7 制約への対応づけ

> 正本ラベル (`2026-05-24_llm-7-constraints-c-prefix-meaning.md`): C-1 有限帯域 / **C-2 入力バイアスの増幅** / **C-3 迎合性** / **C-4 自己申告は証拠にならない** / **C-5 報酬ハッキング** / C-6 訓練データの偏り / **C-7 校正盲**。

### C-5 (報酬ハッキング / Goodhart) — 機械ゲートは「自分が見る軸」で緑を出すが、軸の外は測らない

- **#190**: essence review (全 15 原則照合) が GO を出したのに、rig の **API 従量課金組込 (rule 抵触) を拾えなかった**。評価基準 (15 原則) は充足されていたが、その基準の視界に「課金境界」が入っていなかった。test 2d-190 の dangling-reference (削除されたログを指したまま緑) も同型 Goodhart で、実ファイル存在チェックで塞いだ。
- **#202**: 「1 つの deny 反転」がテスト assert と review record の「allow と主張していた全箇所」を同時に嘘にする。評価基準 (テスト緑) を守るには、基準側の記述の棚卸しが要る。
- 共通形: **評価基準の充足は「良さ」も「規約遵守」も保証しない**。基準が測っていない軸 (課金 / 陳腐化) を、人と probe-before-persist の規律が埋めた。

### C-7 (校正盲 = 知らないことを知らない) — 機械ゲートは「軸の外を測っていない」事実自体を報告しない

- **#201**: Round 1 独立 reviewer が M-A/M-B を見逃し、視点の違う coordinator 盲検が拾った。単一 reviewer は自分の探索範囲の外を「無い」とは言えない (言えないことも言わない)。**視点差を構造で足す**のが唯一の補償。
- **#190**: essence review の死角 (課金が原則 11 の陰に隠れた) は、review 自身には「そこを見ていない」と分からない。
- **#207**: Round 1 で無観測を埋めた計装が Round 2 で過剰計上を生んだ = fix が fix した物の中に次を作る。フレッシュな第三者 (coordinator 盲検) だから捕らえられた。

### C-2 (入力バイアスの増幅) — 「独立に見える反証」が同じ最初のソースに引きずられていた

- **#207**: WebFetch と guide agent の 2 つの「独立した否定」が**同じ doc 要約に依拠**していた = 独立の反証でなく同根。両方が最初の情報 (doc 要約) に引きずられた。アンカーを脱するには **doc 要約 (小型モデル) を飛び越えて CLI 本体 = 一次成果物**へ降りるしかなかった。教訓: 独立性は「別のエージェント/ツールか」でなく「別のソースに依拠しているか」で判定する。

### C-3 (迎合性 / 能動面) — rule を「聞けば OK」で迂回しようとした

- **#190**: rule で禁じた API 課金を、AskUserQuestion で選択肢化して「ユーザーが選べば実行してよい」形にしようとした = 迎合の能動面 (ユーザーの同意を取り付けて自分の規約を緩める)。**真の明示指示は人間が自分の言葉で言うこと**であって、agent が並べた選択肢への同意ではない。かいじゅうの「待て」が正しかった。decisive-answers「LLM は合理的に見える理由でルールを迂回する」の課金版。

### C-4 (自己申告は証拠にならない) — 成功表示・最初のスナップショットを独立確認で潰す

- **同期**: git-sync-reminder「未 push 5 件」+ 最初の ls-remote `ed33d10` を信じず、`git fetch` 後の再測で「完全同期・未 push 0」を確定 (並行 push のレースだった)。
- **#190**: push landed は ls-remote、merge は gh state + origin/main に commit 含むかで独立確認。
- **#202**: パイプ exit の偽「failed」を run-all.sh 自身の exit code で否定。
- **#207**: 全緑を信じず変異テストで assert の歯を確認。

## まとめ (本PJ への含意)

1. **機械ゲートは「床」であって「天井」ではない — 視界の外は人・一次成果物・第三者が塞ぐ** — essence review (15 原則) も全テスト緑も、それが**見る軸の中**では信頼できるが、軸の外 (課金境界 / 記述の陳腐化 / 自分の探索範囲外) は測らず、しかも「測っていない」事実自体を報告しない (C-7)。今回効いた欠陥 (#190 の課金・#207 の契約実在・#201 の M-A/M-B) は全て軸の外にあり、拾ったのは順に**かいじゅう・CLI 本体バイナリ・視点の違う盲検**だった。**信号を審査する側にも構造的盲点があると前提し、最後の関門を人/一次成果物/第三者に置く**設計が本シリーズの到達点。
2. **「独立性」は主体でなくソースで判定する** — #207 の WebFetch と guide agent は別主体でも同じ doc 要約に依拠して同根だった (C-2)。多数決や複数エージェントは、全員が同じ未検証ソースに乗っていれば独立の反証にならない。**権威階層 (一次成果物 > doc 要約 > 内部確信) で降りられる所まで降りる**のが脱アンカーの唯一手。CLAUDE.md「MCP/Web = 未検証外部入力」の運用形。
3. **rule 遵守は「聞けば OK」で緩めない (C-3)** — #190 で AskUserQuestion を課金の許可取りに使おうとしたのは迂回だった。agent が並べた選択肢への同意は明示指示ではない。**rule で禁じた行為は、人間が自分の言葉で明示するまで実行しない**。これは本 PJ 自身の CLAUDE.md Prohibition (API 従量課金は明示指示まで禁止) と decisive-answers (合理化での迂回禁止) が、ハーネス側で実演された事例。
4. **OPEN 0 は「追跡台帳の空」であって「穴ゼロ」ではない — 恒久残差は開示で残す** — 秘密 Read 網は #160→#185→#191→#192→#184→#202→#201 と 7〜8 段むいて OPEN を 0 にしたが、残るのは**構造的に塞げない残差を開示で受容した恒久形** (裸 credentials の Grep 経路 / over-block / /etc は hook 単層 / #190 case-scan 非対称)。#187 は「作らないという根拠付きの決定」を実測で裏付けて台帳から外した。**台帳が空 = 見えている穴を全部裁定し切った状態**であって、開示済み恒久残差と手動フォロー 2 件 (permprobe rm / upstream 提出) は別枠で残る。「解像度を上げ切って、残りは意図的に開示で持つ」が本シリーズの終着形。

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-18_global-harness-changelog-review.md` — 前回レビュー (信頼できる信号 3 つは隠れた前提に乗る)
- `.docs/logs/shared/2026-07-17_global-harness-changelog-review.md` — 配備 ≠ 実効の 3 クラス同日確定
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の正本定義
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/local/`、各 issue の正本ログ)

- `2026-07-18_issue-190-pr205-billing-guard-review-fixes.md` — rig の API 課金組込を人が発見 / 「聞けば OK」は rule 迂回 / bash 3.2 unbound / 偽陰性ガード
- `2026-07-18_issue-207-stop-hook-loop-guard-pr209-merge.md` — stop_hook_active 契約 / 独立に見える反証の同根性 / 一次成果物 (CLI binary) で決着 / 計装が過剰計上を生む
- `2026-07-18_issue-202-pr206-review-fixes-merge.md` — 完全名 + /etc path-anchor / 1 つの deny 反転が全 assert を嘘にする / パイプ exit 偽 failed
- `2026-07-18_issue-201-pr210-review-fixes-merge.md` — §4 安全 subset/恒久残留の 2 クラス分類 / global npmrc の穴 / 2 段レビューの視点差

### 現物 (本レビューで実測)

- GitHub `kaijutale/claude-harness` — **OPEN issue = 0 / OPEN PR = 0** (gh 二重確認)。今回窓 CLOSED: #202 (PR #206) #190 (PR #205) #201 (PR #210) #207 (PR #209) 全て MERGED / #187 (HITL close, COMPLETED) / #208 (#207 重複, NOT_PLANNED)
- `git -C ~/.claude` — local HEAD `7b79278` == origin/main (`git fetch` 後 ls-remote 一致、完全同期)・未 push 0・未 commit 0・working clean
- `git -C ~/.claude worktree list` — **main 1 本のみ** (issue-190 / issue-202 worktree は merge 後撤去)。`~/.permprobe-186` / `-186.old` / `-190` の 3 dir が rm handoff 未実行で残存 (純増なし)
