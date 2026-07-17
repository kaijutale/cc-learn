---
date: 2026-07-17 20:41:08
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-16 夜〜07-17、前回 07-16 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論

related_skill: [logging]
related_log_ids: [2026-07-16_global-harness-changelog-review, 2026-07-15_global-harness-changelog-review, 2026-07-14_global-harness-changelog-review]
related_log: [.docs/logs/shared/2026-07-16_global-harness-changelog-review.md, .docs/logs/shared/2026-07-15_global-harness-changelog-review.md, .docs/logs/shared/2026-07-14_global-harness-changelog-review.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-16 夜〜07-17) — 「配備されている」は「効いている」ではない: 静的に緑だった防御 3 クラスが同じ日に死亡確定した

> 前回レビュー (07-16 23:32) は「OPEN は #144 #160 の 2 本まで減った」で終わった。それから約 20 時間で両方が close し、新レーン 3 本 (#185 #186 #188) も完走 — **CLOSED 5 本 / merged PR 5 本** (#183 #189 #193 #194 #196)。一方 OPEN は **2→7 に増えた**が、7 本全部が今回の発見を裁定付きで切出したもの。今回の主旋律は**「配備 ≠ 実効」が 3 クラス同日確定**したこと — ①sandbox.denyRead 202 本は 1 本も効いていない (dead config)、②$HOME 狙いの Read deny 7 本は 1 本も発火していない (cwd 外に届かない)、③9 hook の additionalContext 通知は誰にも届いていなかった (裸形の沈黙死)。**3 クラスとも静的テスト・レビュー・PR を通過した上で死んでいた**。全部拾ったのは live 実測とフレッシュレビューで、静的検査は 1 つも拾えなかった。

## 概要

前回レビュー以降の `~/.claude` 変更を、ハーネス側ログ 5 本 (work 5、うち #186 は 2 部構成) / shared 検証正本 1 本 / git first-parent / gh issue・PR / worktree list で実測確認した (2026-07-17 20:41)。

- **CLOSED (5 本)**: #144 (PR #189) / #160 (PR #183) / #185 (PR #193) / #186 (PR #194) / #188 (PR #196) — 全て merge 済みを gh で確認
- **OPEN (7 本)**: #184 #187 #190 #191 #192 (permission 網の切出し 5 本) + #195 #197 (settings churn / 署名フッターの新クラス 2 本)。前回の 2 本から純増 5 — ただし全て「発見 → 裁定 → issue 化」の正規出力で、放置された穴ではない
- **main の commit (first-parent、07-16 23:00 以降・ローカル)**: merge 3 件 (PR #183 / #194 / #189) + 直 commit 5 件 (ログ回収 3 / model pin 追加→撤回 2)。直 commit は全て #173 封鎖の除外対象内だが、**model pin の追加 (`1348118`) は誤りで 9 分後に打ち消された (`68bb15e`)** — 前回観測した「/model churn」が main で再発した形 (後述 6)
- **claude-harness 現況 (実測)**: local HEAD = `68bb15e`、リモート実体 = `94c6b30` (PR #196 merge、ls-remote で確認)。**local main はリモートから merge 2 本分 (#193 #196) 遅れており pull 未実施**。未 push は 0 (origin/main..HEAD 空 — SessionStart の git-sync-reminder は「未push 1件」と報告しており実測と食い違う。向きの取り違えの可能性、ハーネス側で要確認)。untracked 4 件 (work ログ 2 + essence progress json 2) が committer 回収待ち。worktree は 5 本 (issue-144/185/186/188 = merge 済み撤去待ち、issue-195 = 進行中)。`~/.permprobe-186` が残存 (rm handoff 未実行)

## 内容

### 1. #160 / PR #183 — フレッシュレビューが merge 前に穴 2 本を実証し、是正の essence review が 3 本目を拾った

Read deny 部分一致 FP の語尾アンカー移設。フレッシュコンテキストのレビューが probe 実測で High 2 件を実証してから merge した:

- **High-1 (経路の穴)**: 判定を hook (matcher=Read) へ集約した結果、**Grep / @file mention 経路が裸になった** — permissions の Read ルールは Grep/Glob/@file にも best-effort 適用される (公式 docs 明記) が、hook の matcher は文字どおり Read のみ。是正は語尾アンカー glob の deny 鏡像配備
- **High-2 (層間非対称)**: hook の stem 切詰め (最初のドットで切る) は glob の `*` (basename 内のドットを跨ぐ) と等価にならず、`prod.api_key` 型の multi-dot 名が hook 素通り。是正は basename 全体への境界正規表現
- **3 本目 (case 軸)**: 是正の essence review が「hook は nocasematch なのに鏡像 glob は小文字のみ」を検出 — **レビューが PR の穴を見つけ、是正のレビューが是正と同型の穴を見つける「メタ再帰 2 周」**

残課題は #184〜#187 へ裁定つきで転記。この切出しが今回の OPEN 増加の起点になった。

### 2. #186 / PR #194 — live 実測の本丸: sandbox 202 本は dead config、二択で問われて二択で答えなかった

#183 で配備した deny glob 202 本 × 2 層の live 実効性を、子セッション測定装置 (#173 の識別子ベース手法を拡張) で確定した。今回のレビュー期間で最も重い成果。

**確定した 3 項目**:

| 項目 | 結果 |
|---|---|
| permissions.deny | Read / Grep 直指定 / @file の **3 経路で実効** (#183 の是正は live で機能)。ツールごとに deny 識別子の文言が違うことも確定 |
| sandbox.denyRead 202 本 | **1 本も効いていない (dead config)** — `sandbox.enabled` キーが不在。`enabled:true` を足すと全 Bash が E2BIG で spawn 失敗 (deny paths 1.5MB > ARG_MAX 1MB、自前 glob 数と無関係の環境固有定数) = **設定だけでは有効化できない** |
| case 軸 | issue の二択 (「case 無視なら大文字形 88 本は冗長 / case 区別なら残差確定」) は**両方不成立** — 直接判定は case 無視・**Grep のディレクトリ走査フィルタだけ case 区別**という層内非対称。**大文字形 88 本は走査経路で実効中 = 削ってはいけない** |

**rig 故障がまた新種で 2 件** (+ 検出 1 件): ①統制群が cwd 外で対話ゲートに落ちた (permission 層に届く前に死ぬ) — #173 の「統制群が ALLOWED にならない run は捨てろ」で検出。②**APFS (case-insensitive FS) が probe を同一 inode に潰し、「大文字形 88 本は冗長 → 削除」という防御を削る方向のもっともらしい結論を差し出した** — inode 確認と変種別ディレクトリで初めて正答。**測定環境が結論を捏造した初例**。③子セッションが case 違い同名ファイル群を「怪しい探り」と自主拒否 — 抑え込まず本当の文脈を渡して解消。

**運用面でも 2 つ重要**: (a) issue 完了条件と起動プロンプトの指示が衝突 (追修正はスコープ内 vs PR は測定のみ) → 安全側 (触らない) で停止して HITL 裁定を仰いだ (裁定 A-1: コメント是正を同 PR に含める / 裁定 B: 残差を issue #190 化)。(b) コメントのみの commit が essence gate に block された際、**`SKIP_ESSENCE_GATE=1` で迂回しなかった** —「コメントだけだから」は CLAUDE.md が禁じる「合理的に見える理由でのルール迂回」そのものと自己判定。

**closeout での発見 2 件**: 台帳に provision 行が無いのに Keychain item は実在した (権威スキャンが 3 件を自動 backfill) — **「台帳に記録が無い ≠ item が無い」、回収判断の前にスキャン必須**。また本セッション自体が env 無し起動 (隔離されない起動形、正本違反) だったが、#163 の tree 述語が worktree の record を正しく読んで gate した — env 無しでも述語が降りない設計の live 実証になった。

### 3. #185 / PR #193 — hook が自分自身と矛盾していた。3 回のレビューが毎回「別種」の穴を検出

秘密語彙から `tokens` / `passwd` を除去 (11→9 語) して `design_tokens.json` (W3C DTCG 最頻出命名) と `/etc/passwd` の誤 deny を解消。真因は**同一ファイル内の自己矛盾** — #160 が §5 (拡張子網) から `.tokens` を意図的に除外して design tokens を守った(コメントも残っている)のに、§6 の語彙が `_tokens` / `-tokens` 経由で同じものを deny し返していた。

裁定前に修正案の成立条件を機械で潰した点が作法として重要: 案 2 (`permissions.allow` で穴埋め) は **hook の実行に allow が一切影響しない + deny > allow 実測済み**で構造的に不成立、案 3 は層間非対称を作り直す絆創膏、と確定させてから AskUserQuestion で裁定を取った (3 問とも推奨案採択)。

**3 回の essence レビューが毎回別種の穴を検出した** (High 2 / Medium 計 7):

- **HIGH-1**: §3 に足した `Read(**/.aws/**)` 等 7 本は $HOME 配下を狙うが、**`**/` 形の Read deny は cwd 配下にしか届かない → 1 本も発火していなかった**。「経路の穴を閉じた」という報告が嘘だった。しかもその根拠は**編集対象 hook の 5〜9 行目に書いてあり、セッション冒頭で Read 済みだった** — 「正本を読むこと」と「正本を判断に接続すること」は別工程
- **HIGH-2**: テストの glob→ERE 近似が live matcher のディレクトリ一括 deny 意味論を持たず、`design-tokens/colors.json` 型の FP クラスがスイートから丸ごと抜けていた。**#186 レーンが独立に同じ穴を名指ししており、2 レーンが別経路で同一結論に到達**
- **Medium 4 (マージ解決時)**: 全て「正しい規律を持ちながら、その規律を適用する範囲を数えていない」という同一の型

さらに自分の fix の過剰主張を自分で撤回した (`~/` 形も Read では未検証と気付き「未測定」へ書き直し — HIGH-1 の fix が別の住所で同じ誤りを繰り返しかけていた)。機構と規約の衝突も 1 件: **committer はマージ commit を完了できない** (部分 commit はマージ中に git が拒否) — git-workflow 規約に「マージ時の例外」が無いのは穴として記録された。

### 4. #188 / PR #196 — 9 hook の沈黙死: 通知が一度も届いていなかった

`additionalContext` は共通フィールドではなく `hookSpecificOutput` 配下でのみ成立する — トップレベルの裸形は**黙殺される**。本 repo の 9 hook が裸形で、警告・助言が一度も文脈に載っていなかった。**副作用 (mv・prettier --fix・通知音・ledger 記録) は動くため、人間もテストも「効いている」と誤認し続けた** — 副作用の可視性と注入の到達性は独立、という非対称性が沈黙死を隠した。

最も重いのは `hook_post_external_input_notify`: **検疫タグが一度も注入されておらず、prompt injection 防御が実はずっと自然言語規律だけで立っていた**。また PostCompact は公式に decision control が無く**注入チャネル自体が存在しない** → 入れ子化では直らず SessionStart(compact) へ移設。未配線のまま一度も発火していなかった hook も 1 本 (`plan_promote_reminder`)。

根本原因は検証層 — `assert_context` が文字列 `"additionalContext"` を grep するだけで裸形も入れ子形も等しく通していた。是正は症状 (9 hook) と病因 (JSON 実パースでの shape 強制 + HOOK_EVENT 必須化) の両方 + 横断 emission 契約テスト新設。検証の質も一段上がった:

- **変異テスト**: 是正前コードに戻して契約テストが **9 hook を赤で検出** (issue の影響範囲表と完全一致) を確認 — 「緑 37 本」は欠陥検出能力の証明にならない
- **live 対照実験**: 裸形 (届かない) と入れ子形 (届く) を同一セッションで分離観測
- **essence review が自己言及の穴を検出**: 新設した契約テスト自身が `--changed` の命名写像に一致せず **commit gate で永久に走らない**状態だった — 本 PR が殺したはずの「未配線で死ぬ」構造が、新設テスト自身に開いていた。実装者は自分の新装置を「守る側」としてしか見ない — **fresh context の独立レビューでしか自己言及的な穴は見つからない**

**副産物の重要発見**: ハーネス worktree 隔離は **hook には効かない** — settings.json が hook を絶対パスで配線するため、`CLAUDE_CONFIG_DIR` を worktree に向けても実行されるのは live の hook (実測: worktree セッションの Write が live ledger に発火行を残した)。`rules/multi-agent-safety.md` の記述と食い違う = 隔離の射程の死角がまた 1 個 (残タスクとして記録済み)。皮肉にもこの不成立のおかげで live 対照実験の変数が出力形だけに固定された。

### 5. #144 / PR #189 — plan 外部化の終端ゲート。5 本の close で唯一 work ログが無い

「plan mode を使ったのに plan が書かれていない」を Stop hook で検出する終端プローブ (#124 レビュー F-7 由来)。PR には hook + テスト + essence record + settings 配線が載ったが、**5 本の close の中で唯一、work ログが残っていない** (worktree 側にも無いことを実測確認)。経緯の一部は #188 ログが「#144 実装中に発見された副次欠陥」として間接的に伝えるのみ。ログ規律 (「作業ログは必ず残す」) の欠落例として観測 — 皮肉にも #144 自身が「やったはずのことが成果物に残っていない」を検出するゲートである。

### 6. issue 外の変化 — model churn が main で再発し、機械解 (#195) が動き出した

- **model pin の追加→撤回が 9 分で往復**: `1348118` (かいじゅうの /model 操作の回収として pin を追加) → `68bb15e` (「settings.json は model を pin しない」という 07-16 確定方針に反すると気付き削除)。前回「標準作法がまだ無い」と書いた **/model churn 干渉クラスが main 直 commit でも再発**した形
- **#195 (OPEN、レーン進行中)**: settings.json の model/effortLevel churn を **commit 直前に HEAD へ正規化する hook** — 散文の方針 (「pin しない」) を決定論ゲートに変換する動き。worktree issue-195 で hook 本体 + テストが作成中 (未 commit) なのを実測確認
- **#197 (OPEN)**: PR 署名フッター混入の根絶 — attribution 設定で注入元を止める + `--body-file` 経由が署名禁止 hook の死角である点を塞ぐ。#186 closeout で「署名禁止 hook が発火して止めた」観測の直後に、その hook 自身の死角が issue 化された

## 重要発見 — 7 制約へのマッピング

### 「配備 ≠ 実効」3 クラス同日確定 — C-4 (自己申告は証拠にならない) の新しい顔

| 死んでいた防御 | 規模 | 静的検査が緑だった理由 | 拾った手段 |
|---|---|---|---|
| sandbox.denyRead (#186) | 202 本全部 | メンバーシップ検査は「JSON に在るか」しか見ない。`enabled` キー不在は pattern レビューでは原理的に見えない | live 実測 (因果切分) |
| $HOME 狙い Read deny (#185) | 7 本全部 | 同上 (検査 (6) がエントリ存在のみ確認) — **検査が誤りを追認する構造を自分で作っていた** | essence review (HIGH-1) |
| additionalContext 裸形 (#188) | 9 hook | assert_context が文字列 grep で裸形も通す + 副作用が動くので live でも緑に見える | 公式 docs 照合 + live 対照実験 |

共通構造は「**発火・存在は観測されるが、到達・効力は誰も観測していない**」。これは前回までの「防御が存在するのに効かない」系譜 (07-14 レビューで 7 件) の続きだが、今回は**検証層そのものの欠陥** (メンバーシップ検査・文字列 grep) が病巣として名指しされ、変異テスト・契約テスト・live 対照実験という一段上の検証装備で応答した点が新しい。

### C-4 の表がさらに伸びた — 測定環境が結論を捏造する初例

| 自己申告の主体 | 何を申告したか | 真実 | 発覚させた規律 |
|---|---|---|---|
| APFS + rig (#186) | 「大文字で Read → DENIED = matcher は case 無視」 | probe が同一 inode に潰れていた。**素直に読むと実在の防御 88 本を削る結論に直行** | inode 実測 + 変種別ディレクトリ |
| 自作の検査 (6) (#185) | 「§3 の 7 本は配備済み」 | 効力ゼロでも永久に緑 (存在しか見ない) | essence review |
| 契約テスト 37 本 (#188) | 「全部緑」 | 緑は欠陥検出能力の証明ではない | 変異テスト (HEAD へ戻して 9 赤を確認) |
| fix の報告 (#185) | 「経路の穴を閉じた」 | 1 本も発火していなかった。答えは編集対象の 5〜9 行目に Read 済みだった | essence review — 「読んだ」と「使えた」は別 |

### C-5 (Goodhart) — 機械ゲートの床の上で、意味層レビューが毎回別種を拾う

#185 の 3 回のレビューは毎回別種の穴 (Web 調査 → 実在 credential / PR 本体 → High 2 / マージ解決 → Medium 4) を出し、#188 の essence review は新設装置自身の自己言及の穴を出した。前回の「機械ゲートは床であって天井でない」が、今回は**「床 (gate) が実際に 2 回 commit を止め、天井 (fresh review) が実装者に原理的に見えない穴を拾う」**という分業の実測になった。SKIP 迂回をしなかった判断 (#186) も含め、gate は飾りではないことが行動で示された。

### C-2 (セッション間の断絶) — 正本の訂正が「supersede 注記」として型になった

#186 は #173 ログの「`*` は `/` を跨ぐ」という機構説明の誤りを発見したが、ログを書き換えず **supersede 注記を追記**した (観測値は全て有効・覆るのは機構の帰属だけ、と射程を限定)。#185 も撤回した数値が別テストに「実測」ラベルで残っていた問題を Medium で拾った。「過去の自分の記録をどう訂正するか」に、上書きでなく**出所と射程を保った追記**という作法が定着しつつある。

### 隔離の射程の死角が 2 例目 — hook は worktree 隔離の外

前回の「/model 操作は全レーン横断」に続き、今回「hook は絶対パス配線ゆえ worktree 隔離が効かない」(#188 実測)。隔離モデルは「cwd + env で完全隔離」ではなく、**チャネルごとに射程を実測して台帳化するもの**へと認識が更新されている。rule の記述精度の問題として残タスク化済み。

### HITL の使われ方が成熟 — 二択で問われても二択で答えない

#186 は指示衝突で安全側停止 → 裁定、issue の立てた二択 (冗長 or 残差) を実測が壊した時は**枠ごと報告**した。#185 は裁定前に案の成立条件を機械で潰して裁定材料を作った。#188 は無関係変更の混載を 2 reviewer の指摘ごと事実提示して「一緒に commit」の裁定を得た。**HITL は「聞けば安全」ではなく「機械で潰せる所を潰し切ってから、裁定が必要な残りだけを枠ごと渡す」**運用に収束している。

## まとめ (本PJ への含意)

1. **「配備 = 守られている」は最も危険な誤認** — sandbox 202 本 / $HOME 7 本 / 9 hook 通知は、静的テスト・レビュー・PR を全部通過した上で死んでいた。live で撃つまで配備は仮説。防御を足す変更は「到達の観測チャネル」をセットで配備しないと、沈黙死は次も検出できない (これ自体が #188 の残タスク 1 として明文化済み)
2. **検証層自身が検証対象** — メンバーシップ検査は効力の証拠にならず、文字列 grep の assert は欠陥の形を通し、「テスト全緑」は変異テストで欠陥検出能力を示して初めて意味を持つ。検証の検証 (統制群・変異・対照実験・inode 確認) が固定費として定着した
3. **OPEN 2→7 は退行ではなく解像度** — 7 本全てが「発見 → 裁定 → 切出し」の正規出力で、裁定の根拠 (実測・選択肢・トレードオフ) がログに保全されている。穴の数が増えたのではなく、見えている穴の台帳が正確になった
4. **残作業が明示的に台帳化されている** — local main の pull 遅れ (merge 2 本分)、untracked ログ 2 本の committer 回収、merge 済み worktree 4 本の撤去 + Keychain 回収、`~/.permprobe-186` の掃除、#144 の work ログ欠落。いずれも「忘れる」のではなく handoff / 台帳に載った状態で残っている

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-16_global-harness-changelog-review.md` — 前回レビュー (OPEN 7→2、撤回の作法確立、機械ゲートは床)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の定義
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/`、各 issue の正本ログ)

- `local/2026-07-17_issue-160-pr183-review-fixes-merge.md` — High 2 実証 + case 軸 + メタ再帰 2 周、#184〜#187 切出し
- `local/2026-07-17_issue-186-deny-glob-live-effectiveness.md` — sandbox dead config / case 層内非対称 / rig 故障新種 / 指示衝突の HITL 裁定
- `local/2026-07-17_issue-186-pr194-closeout.md` — Keychain 台帳 backfill / env 無し起動でも tree 述語が gate / 署名禁止 hook 発火
- `local/2026-07-17_issue-185-pr193-vocab-fp-merge.md` — hook 自己矛盾 / HIGH-1「読んだ≠使えた」/ 2 レーン独立収束 / committer マージ不能
- `local/2026-07-17_issue-188-hook-emission-silent-death.md` — 9 hook 沈黙死 / 変異テスト / worktree 隔離は hook に効かない / 自己言及の穴
- `shared/permission-deny-glob/2026-07-17-live-effectiveness.md` — #186 実測表の正本 (supersede 注記の型もここ)

### 現物 (本レビューで実測)

- GitHub `kaijutale/claude-harness` — CLOSED: #144 #160 #185 #186 #188 (PR #183 #189 #193 #194 #196 全て MERGED を gh で確認) / OPEN: #184 #187 #190 #191 #192 #195 #197
- `git -C ~/.claude log --first-parent` — merge 3 + 直 commit 5 (ログ回収 3 / model pin 往復 2)。local HEAD `68bb15e`、リモート実体 `94c6b30` (ls-remote)、**local は merge 2 本分 pull 遅れ**・未 push 0
- `git -C ~/.claude worktree list` — issue-144/185/186/188 (merge 済み撤去待ち) + issue-195 (進行中、hook 未 commit)。`~/.permprobe-186` 残存
