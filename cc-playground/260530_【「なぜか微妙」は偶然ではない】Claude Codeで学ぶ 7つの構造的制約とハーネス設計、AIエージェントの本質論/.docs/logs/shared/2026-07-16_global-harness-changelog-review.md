---
date: 2026-07-16 23:32:44
type: study
topic: global-harness-changelog-review
session: グローバルハーネス (~/.claude) の変更履歴レビュー (2026-07-15 夜〜07-16、前回 07-15 レビューの続編)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論

related_skill: [logging]
related_log_ids: [2026-07-15_global-harness-changelog-review, 2026-07-14_global-harness-changelog-review, 2026-07-13_config-dir-isolation-misjudge-and-three-retractions]
related_log: [.docs/logs/shared/2026-07-15_global-harness-changelog-review.md, .docs/logs/shared/2026-07-14_global-harness-changelog-review.md, .docs/logs/shared/2026-07-13_config-dir-isolation-misjudge-and-three-retractions.md]
---

# グローバルハーネス変更履歴レビュー (2026-07-15 夜〜07-16) — OPEN 7 本が 2 本になり、外因の穴 (#178) は 1 日で修復、「複製方式」は実測で正式撤回された

> 前回レビュー (07-15 20:37) は「プラットフォーム仕様変更という外因が防御を無言で殺した (#178 OPEN)」で終わった。それから約 1 日で #178 は worktree + PR 経由で修復・merge され、同じ波で #133 #146 #156 #170 も閉じた (CLOSED 5 本 / merge された PR 4 本)。OPEN issue は #144 #160 の 2 本まで減り、レビュー時点の repo は working tree clean + origin 完全同期。今回の見どころは 3 つ — **撤回の作法が実測込みで確立した (#156)**、**機械ゲートを通っても意味欠陥は残ると自己認識した (#146)**、**検証 rig の故障がまた 2 種増え、統制群と識別子の規律が両方とも救った (#178)**。

## 概要

前回レビュー以降の `~/.claude` 変更を、ハーネス側ログ 8 本 (work 5 / validation 1 / experiment 1 / 補助 1) / git first-parent / gh issue / worktree list で実測確認した (2026-07-16 23:32)。

- **CLOSED (5 本)**: #133 (検証のみ・PR なし) / #146 (PR #180) / #156 (PR #182) / #170 (PR #179) / #178 (PR #181)
- **OPEN (2 本)**: #144 #160 — 前回の 7 本 (#133 #144 #146 #156 #160 #170 #178) から 5 本減。#160 は worktree レーン (issue-160) が現存し進行中
- **main の commit (first-parent、07-15 20:00 以降)**: merge 4 件 (PR #179 / #182 / #180 / #181) + 直 commit 6 件 (model 既定変更の回収 2 / ログ・HTML 回収 4) — 直 6 件は全て #173 封鎖の設計上の除外対象 (`.docs/logs/` `.docs/output/`、および agent の Edit/Write ツールを経ない変更 = CLI の `/model` 操作) で、封鎖と矛盾しない
- **claude-harness 現況 (実測)**: HEAD = origin/main = `19f940a` (ls-remote で独立確認)。working tree clean。worktree は issue-160 の 1 本のみ残存 — 07-16 に「worktree 撤去祭り」があり、閉じたレーンは撤去、レーン内にのみ存在した解説 HTML 20 枚は撤去前に main へ保全された (`19f940a`)

## 内容

### 1. #178 — 前回「初の外因」と書いた穴が、1 日で修復された (PR #181)

Claude Code 仕様変更で死んだ `Write(...)` 権限ルール 25 個の整理。Edit の双子が既にあるか否かの一点で二分岐した:

| 区分 | 件数 | 対応 |
|---|---|---|
| Edit 対なし (`Write(**/.env*)` / `Write(**/secrets/**)`) | 2 | **`Edit(...)` へ置換** — 失効していた書込ガードが復活 |
| Edit 対あり (skills 等 21 deny + settings 等 2 ask) | 23 | **削除** — Edit 側がカバー済み、Write 行は純粋な警告ノイズ |

検証は #173 の正本方針を継承: 起動時警告 **25→0 を stderr バイト実測**、復活ガードは headless 子セッションで **deny 識別子 + バイト不変** の live DENY、統制群 (plain.txt) は ALLOW、worktree レーン不阻害も確認。

**最重要の現場知は rig 故障がまた 2 種出たこと** (#173 の 3 回に続く 4・5 例目):

- 1 回目の rig は **16 子セッションを一斉並列**で撃ち、全 16 ケース `fired=0` で全滅。deny が止めたのではなく **API レート制限 (429) が最初から弾いていた**。ALLOW 期待の統制群まで「書けなかった」ことで rig の故障と切り分けられた
- 2 回目 (逐次実行) は成功したが、自作の検出器が `overageStatus:"rejected"` (**アカウント常時属性**、成功 run にも出る) を per-request 拒否と誤読して全ケースを RATE_LIMITED と誤判定。実体 json は `status:"allowed"` + success で**実際は実行されていた**。正しい per-request 状態は `status` の方

### 2. #146 — 「引き金の無い銃」に引き金を配線し、機械ゲートの天井も見えた (PR #180)

#138 で新設された ADR 判定器 `verify-adr.sh` は fail-closed・回帰テスト付きと照準は完成していたのに、発火させる決定論的引き金が無く散文の約束 4 箇所だけが頼りだった。案 A (通知)/B (commit gate)/C (probe hook) から **案 B = PreToolUse commit gate を採用** — A/C は発火が決定論的でも執行が確率的 (無視して commit できる) で、「検証しないと commit できない」不変条件を作れるのは B だけ。採用前に**過去の全 ADR commit 4 件へ遡って FP 0/4 を実測**してから確定した (断定でなく実測で経路を選ぶ)。

**今回いちばん重い学び**: 自分が書いた ADR-0002 は verify-adr を exit 0 で通過したのに、**出典の原則番号が間違っていた** (原則 7「レビューアと実装者の分離」と書いたが正しくは原則 5「決定論的制御の優位性」。「V-1」に至っては正本に存在しない)。verify-adr は構造 (frontmatter・却下代替案の非空) を見るが引用精度は検査しない。拾ったのは essence review (意味層)。**機械ゲート = 品質の床であって天井ではない** — Goodhart (C-5) の自己適用。

### 3. #156 — 「複製方式」が実測で死亡確定し、正式に撤回された (PR #182)

Keychain item 複製方式 (worktree 隔離セッションの認証を既定 item のコピーで賄う手順) の refresh token ローテート耐性を、捨て dir ×2 に隔離した被験体で追試した。

- **H1 (RT はローテートするか) = YES / H2 (旧 RT は拒否されるか) = YES**。決定的だったのは想定外の観測で、敵対的タイミングを仕組む前に **live 本体が自然リフレッシュしただけで複製が約 90 分以内に孤児化**した。edge-case ではなく**既定挙動**
- H4 (再複製で復旧) は「効くが脆い」 — 共有 RT ペア再生成の treadmill になり、残した複製が先にリフレッシュすると本体すら孤児化する
- **決定: 複製撤回、`/login` 正式化** (config dir ごとに独立 token family = 構造的に安全)。doc §3 (手順 SSOT)・skill・rule の 3 ファイルを**同時移行** (skill だけ直すと正本と skill が矛盾するハーネスになるため)

作法として注目すべき点が 2 つ: (a) **複製手順を完全削除せず「使わない理由 (#156)」を実測付きで残した** — 将来誰かが「複製すればいい」と再発明するのを防ぐ、(b) essence review の High 指摘「撤回の一次証拠 (実測ログ) が untracked で repo に travel しない」を受け、**実測ログを branch に同梱**した。policy 反転は通常改修より強い provenance を要る — 証拠が repo に無いと別セッションの監査が著者マシン依存になる。

### 4. #170 — 後回しになっていた essence review を機械追跡で回収し、反インフレが実証された (PR #179)

#159 の 3 領域 essence review のうち Skill 領域だけが Anthropic 月次上限で起動できないまま merge されていた件。record の注意書きは「#159 が閉じると誰も再発火させない」— これは #159 自身が否定した failure mode (散文の注意書きは読む機会が構造的に来ないなら統制でない) と同クラスなので、issue #170 として機械追跡に載せてあった。今回それが完走した。

- **High (原則 13)**: worktree 起動用テンプレートの `{{BODY}}` が **GitHub issue 本文 (外部著者が編集できる未検証テキスト) を無標識のまま rules 層 (起動時ロード) へ埋めていた** — CLAUDE.md Prohibition が名指しする prompt injection 面そのもの。出所ヘッダ + `<!-- external-input -->` マーカーで封じた
- **Medium (原則 7)**: 「未回収 item」を求める jq reducer が hook と権威スキャンに**別実装で二重存在** → lib 定数 `CS_JQ_UNRECLAIMED` を唯一の正本に一本化
- **反インフレの実証が本 round の核心**: この High は #159 当時に Lead が代替の機械確認をした時には出なかった。フレッシュな fork が `assets/` まで Glob→Read して掘り当てた — 「Lead の代替確認は独立視点 fork の代替にならない」が予言でなく実測になった

### 5. #133 — 検証のみで close (PR なし): A1 read-miss の解消を round 3 probe で確定

#110 の対策 (rules/build-test-protocol.md への `paths:` 付与 = コード Read で決定論注入、stub 内ポインタで本体へ連鎖する二段構え) が効いたかを、round 2 と同一条件 (同 repo・同タスク文・headless・汚染 grep 全滅確認) で再実測した。

| 指標 | round 2 (対策前 n=2) | round 3 (対策後 n=1) |
|---|---|---|
| build-test-protocol の nested_memory 注入 | 0 回 | **1 回** (初コード Read の約 1 秒後) |
| `.docs` 本体の連鎖 Read | 0 回 | **1 回** (注入の 10 秒後) |
| README 更新 | 放置 | **Read + Edit で更新** (diff で新形式を独立確認) |

検出器 (`analyze_probe.py`) は round 2 の transcript で「注入 0・README 未接触」を正しく再現することを**先に較正**してから使った (PASS が検出器バグでない担保)。全連鎖 PASS → issue close。指示どおりコードもハーネスも変更せず、成果物は issue コメント + close + ログに限定。

### 6. issue 外の変化 — model pin の消滅と worktree 撤去祭り

- **settings.json はもう model を pin しない**: かいじゅうの `/model` 操作 (Opus 4.8 1M context 既定化) の副作用で repo の `"model"` 行が削除され、そのまま回収された (`a5b7d77`)。repo pin は `~/.claude.json` (repo 外) に保存される 1M 変種を上書きして潰すため、外すのが正しい。以後、新セッションのモデルはマシンローカル状態に従う (マシンを跨ぐと既定が異なりうる)
- **この `/model` churn は並列 4 レーン全部に混入した**: 各レーンは CLAUDE_CONFIG_DIR 隔離ゆえ、レーン内での `/model` 操作がそのレーンの settings.json を書き換える。#146 は commit 分離、#178 は明記の上同梱、#170 は PR に混ぜない、とレーンごとに処理が割れた — 隔離は「レーン間」を切るが「かいじゅうの対話操作 × 全レーン」は切らない、という新しい干渉パターン
- **worktree 撤去祭り**: 閉じたレーンの worktree を撤去し、レーン内にのみ存在した解説 HTML 20 枚を撤去前に main へ保全 (`19f940a`)。残存レーンは issue-160 のみ

## 重要発見 — 7 制約へのマッピング

### 観測→issue→worktree+PR→merge のループが「定常運転」に入った

前回は「穴 1 本が 20 時間で塞がった」だった。今回は**約 1 日で 5 本 close、OPEN 7→2**。しかも 4 レーンが並列で走り、PR の merge 順は coordinator が管理し (#178 ログに「#146 と交錯したら rebase + 検証ゲート再実行を coordinator が指示」)、閉じたレーンは撤去祭りで成果物保全とセットで畳まれた。単発の修理から、**多レーンの流れ作業 + 後片付けまで含む運用**へ移行した観測。

### C-4 (自己申告は証拠にならない) — 表がさらに 2 行伸び、対の規律が両方とも機能した

| 自己申告の主体 | 何を申告したか | 真実 | 発覚させた規律 |
|---|---|---|---|
| 検証 rig (#173、前回) | 「DENIED」×3 | rig 自身のバグ / モデル自発拒否 | 統制群 |
| 16 並列 rig (#178) | 全ケース `fired=0` | API 429 が最初から弾いていた | 統制群 (ALLOW 期待まで死んだ) |
| 自作検出器 (#178) | 「全ケース RATE_LIMITED」 | `overageStatus` はアカウント常時属性。実体は成功 | 実体 json の該当フィールドを開く |
| 機械ゲート (#146) | 「ADR は exit 0 = 合格」 | 引用の原則番号が誤り (構造は見るが意味は見ない) | essence review (意味層) |

**「止まった/通った」ではなく「止まった理由/通った範囲」まで切り分ける** — 統制群と識別子ベースの判定が恒常装備になりつつある。

### C-5 (Goodhart) — 「床と天井」の言語化と、反インフレの実測初例

#146 は機械ゲートを**自分の成果物が通過した直後に**その限界 (引用精度は検査していない) を確認した — 「機械ゲート = 品質の床であって天井でない」。#170 は「フレッシュな独立 fork は Lead の代替確認では出ない指摘を出す」が実測で証明された初例 (High = prompt injection 面の検出)。どちらも「指標を通った」を「目的を達した」と読み替えない規律の実装。

### C-2 (セッション間の断絶) — 撤回とバックログの両方に「機械の記憶」が要る

#170 の存在自体が「record の散文注意書きは引き金にならない → issue として機械追跡に載せる」の追認。#156 の撤回は逆方向で、「試したが壊れる」の実測を repo に travel する形で残すことで、**将来のセッションが複製方式を再発明する経路を塞いだ**。どちらも C-2 への防御が「覚えておく」でなく「構造に埋める」形をとっている。

### 隔離の射程に新しい死角 — user の対話操作は全レーンを横断する

worktree + CLAUDE_CONFIG_DIR 隔離はレーン間の干渉を切るが、かいじゅうが各レーンで打つ `/model` はそのレーンの settings.json を書き換え、**4 レーン全部にスコープ外 churn を撒いた**。各レーンの処理 (分離 / 明記して同梱 / 混ぜない) が割れたのは、この干渉クラスへの標準作法がまだ無い証拠。#178 ログは「commit 前の git diff 確認で検知」を挙げており、multi-agent-safety の「編集前 status/diff 確認」がここでも防波堤になった。

## まとめ (本PJ への含意)

1. **ハーネスの改修ループが単発修理から定常運転になった** — OPEN 7→2、CLOSED 5 本が 1 日で流れ、merge 順管理・成果物保全・レーン撤去まで含めて畳まれた。前回の「20 時間で 1 本」はもう最速記録ではなく平常速度
2. **撤回には通常改修より強い作法が確立した (#156)** — ①実測で死亡を確定 ②「使わない理由」を残して再発明を防ぐ ③一次証拠 (実測ログ) を repo に同梱して監査をマシン非依存にする。probe-before-persist の実践形
3. **機械ゲートは床、意味層のレビューが天井 (#146/#170)** — 決定論的 gate と essence review (独立 fork) の二層は冗長ではなく、検査する層が違う。片方を「通った」ことでもう片方を省略しない
4. **検証 rig の故障は毎回新種で来る (#178)** — 並列起動での API レート枠、アカウント属性フィールドの誤読。「rig を信じない」ための統制群 + 識別子切り分けは、検証のたびに払う固定費と考えるべき

## 関連ファイル

### 本PJ

- `.docs/logs/shared/2026-07-15_global-harness-changelog-review.md` — 前回レビュー (#178 外因の初出、「防御が存在するのに効かない」8 機序)
- `.docs/logs/shared/2026-07-13_config-dir-isolation-misjudge-and-three-retractions.md` — 複製方式が暫定採用された経緯 (今回 #156 で正式撤回)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — C-1〜C-7 の定義
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論` — 参照記事

### ハーネス側 (`~/.claude/.docs/logs/local/`、各 issue の正本ログ)

- `2026-07-16_issue-178-write-rule-permission-cleanup.md` — Write ルール整理 + rig 故障 2 種 (429 全滅 / overageStatus 誤読)
- `2026-07-16_issue-146-adr-gate-deterministic-trigger.md` — commit gate 配線 + FP 0/4 実測 + 「床であって天井でない」
- `2026-07-16_issue-156-login-provisioning-reflection.md` — 複製撤回・/login 一本化の反映作業 + essence High (証拠同梱)
- `credstore-rotation-156/2026-07-15-cycle1-design-and-s0.md` — 複製孤児化の実測生データ (experiment 正本)
- `2026-07-16_issue-170-skill-essence-review-159-deliverables.md` — 後日 essence review + 反インフレ実証 + external-input マーカー
- `2026-07-16_issue-133-revalidation-close-and-html.md` / `claude-md-pd-verification/2026-07-15-issue-133-probe-round3-observation.md` — round 3 probe の行動記録 / 測定値正本
- `2026-07-16_settings-model-pin-removal-push.md` — model pin 削除の回収と landed 検証

### 現物 (本レビューで実測)

- GitHub `kaijutale/claude-harness` — CLOSED: #133 #146 #156 #170 #178 (PR #179 #180 #181 #182 merge 済) / OPEN: #144 #160。gh で開閉を確認
- `git -C ~/.claude log --first-parent` — merge 4 + 直 commit 6 (全て #173 封鎖の除外対象内)。HEAD = origin/main = `19f940a` を ls-remote で独立確認 (未 commit 0 / 未 push 0)
- `git -C ~/.claude worktree list` — 残存レーンは issue-160 のみ (撤去祭り後)
