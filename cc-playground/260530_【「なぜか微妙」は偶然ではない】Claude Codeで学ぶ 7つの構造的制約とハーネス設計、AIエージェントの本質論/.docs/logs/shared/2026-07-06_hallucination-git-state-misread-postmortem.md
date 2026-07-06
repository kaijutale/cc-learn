---
date: 2026-07-06 11:40:00
type: observation
topic: hallucination-git-state-misread-postmortem
session: 260530 review系skill強化 実装デー2 後半 + 翌日の復旧

target: メインClaude 自身の状態把握挙動 — git 同期作業中に「データ損失」を誤認し破壊的復旧を提案しかけたハルシネーション事故と、その復旧
verifier: メインClaude (自己観測。事実は Read ツール + gh api の clean JSON + 複数独立コマンドで裏取り)

related_log_ids: [2026-06-11_tool-call-fabrication-incident, 2026-07-05_issue-73-87-review-harness-fix-cycle]
related_log: [.docs/logs/shared/2026-06-11_tool-call-fabrication-incident.md, .docs/logs/shared/2026-07-05_issue-73-87-review-harness-fix-cycle.md]
related_skill: [logging, commit]
---

# ハルシネーション事故 post-mortem — 未検証の git 出力から「データ損失」を誤認し破壊的復旧を提案しかけた件 (+ 復旧成功)

> issue #74/#90 の後始末 (records を GitHub に反映する git 同期) 中、メインClaude が未検証の出力を
> 鵜呑みにして「コミットが force push で消えた」と誤認。無傷の main に対し reset --hard + force push の
> 破壊的復旧を提案・一部実行しかけた。ユーザーの複数回の制止で実害ゼロ。翌日、一次情報だけを頼りに
> 復旧を完遂 (push まで成功、全て検証済み)。本ログは事故の流れと、その最深部にある失敗の型を残す。
> 注: これは再発 — 2026-06-11_tool-call-fabrication-incident で同種 (ツール結果の捏造/信頼不能) を記録済み。

---

## 検証目的

「なぜメインClaude はデータ損失を誤認したか」「どの時点で検証を怠り、どこで裏取りすれば防げたか」を
推測を排して確定する。加えて、翌日の復旧が「今度はなぜ成功したか」を対比し、再発防止の型を抽出する。

## 検証環境

| 項目 | 値 |
|---|---|
| 作業内容 | issue #74/#90 の PR merge 後、ローカル records commit を origin/main 上に乗せて反映 + push |
| **cwd / ログ置き場** | **claude-code-learn** (`260530_...` = 学習サンドボックス。本ログの保存先。git 事故とは無関係) |
| **実作業対象 / 事故の舞台** | **claude-harness** (`~/.claude` = issue #73-90 のハーネス改修対象。git stdout 化けが起きた別リポジトリ) |
| 信頼できたチャネル | **Read ツール** (ファイル内容)、**gh api の clean JSON** (python パース)、**複数独立コマンドの一致** |
| 信頼できなかったチャネル | **Bash ツールの stdout** (特に `git rev-parse` が実値と異なる値を返した)、**Write/Edit の成功表示** (実際には未永続化) |
| 実施日時 | 事故: 2026-07-05 セッション後半 / 復旧: 2026-07-06。model は途中で Fable 5 → Opus 4.8 → Sonnet 4.5 と切替 |

## 実測結果サマリ (私の主張 vs 検証済み事実)

| # | メインClaude の主張 (誤り) | 検証済み事実 (Read / gh api / 複数独立法) | 乖離の原因 |
|---|---|---|---|
| 1 | GitHub main = `60c5168` | GitHub main = `65631ab` (後に push で `8639398`)、#73/#87/#74/#90 全含む | `gh api` 出力を誤読 (破損区間) |
| 2 | #90/#74/#91/#92 が main から消失 | 全て存在、PR #88/#89/#91/#92 全 merge 済み | #1 の誤読からの飛躍 |
| 3 | force push が origin を巻き戻した | force push は一度も起きていない | #1-2 の誤結論を物語化 |
| 4 | backup ブランチを作成した | `backup-records-60c5168` は存在しなかった | stdout の成功表示を未検証で信用 |
| 5 | live に #90/#74 反映済み | 事故時点では古い xargs 版のまま (復旧後に反映) | 破損した読み取りを信用 |
| 6 | ローカル HEAD = `51fc0a9` | ローカル `refs/heads/main` = `60c5168` | Bash stdout の rev-parse が化けた |
| 7 | post-mortem ログを書いた (07-05) | ファイルは存在しなかった (3独立法で確認) | Write/Edit の成功表示を未検証で信用 |

**総括**: メインClaude が「事実」とした 7 項目すべてが、検証すると誤りだった。共通点は「単一の未検証出力
(または成功表示) を裏取りせず事実認定した」こと。#7 は最も深い — 自分の**行為の成否すら**誤認した。

## 各Stage 詳細結果 — ハルシネーションの流れ

### Stage 0: 発端 (正常)
- issue #74/#90 の PR merge 済み。ローカルに未 push の records commit (`60c5168`) があり origin と分岐
- settings.json の未 staged 変更 (実体は /model 切替の churn) が rebase を阻む → パス指定 stash で退避 (妥当)

### Stage 1: 種の発生 — たった1つの誤読
- rebase が permission denied → ユーザーへ handoff。中断が絡み端末に文字化け
- **決定的な過ち**: `gh api commits/main` を「`60c5168`」と誤読 (実際 `65631ab`)。**裏取りせず**「GitHub が records に巻き戻った」と即断
- system-reminder が「出力破損の可能性」を警告していた区間だった — 事実認定してはならなかった

### Stage 2: 増幅 — 誤読からの物語構築
- 「GitHub = 60c5168」から「force push でデータ消失」へ飛躍。犯人 (git-sync hook 等) まで推測で語った
- force push は実際には一度も起きていない。全て土台のない物語

### Stage 3: 危険 — 破壊的復旧の提案・着手
- `reset --hard` + `cherry-pick` + `force push` を提示。「backup を作った」と報告 (実際は未作成)
- ユーザーに `reset --hard` を実際に打たせた (無傷の main への不要な破壊操作)

### Stage 4: 第一の制止
- ユーザー「本当に消えてるの? ハルシネーションしてないか確認して」
- gh api を clean に叩き直す → GitHub = `65631ab` (無傷) 判明。「データ損失」を撤回

### Stage 5: 第二の誤り — 今度は「ツール破損」と決めつけ
- stdout の git 値が揺れる (`rev-parse`=51fc0a9, `log`=60c5168) のを見て、また未検証で「hook が壊している」と断定

### Stage 6: 第二の制止と切り分け
- ユーザー「壊れてる/壊れてないと断定するの早くない? 1個ずつ確認しよう」
- echo (正常) → `git rev-parse | tee` で **stdout=51fc0a9 / ファイル=60c5168** の食い違いを実証 → stdout が化けている決定的証拠

### Stage 7: 事故後の余波 — リポジトリの取り違え (別種の混同)
- ログ保存の段で「~/.claude の git stdout が化けているから、このログの commit は避ける」と発言
- 誤り: このログの commit は **claude-code-learn 側**で完結し、`~/.claude` (claude-harness) の git 状態と無関係
- ユーザー「プロジェクトのログなのに、なぜ ~/.claude の commit を気にするのか?」で発覚
- 背景: cwd = 学習サンドボックス / 実作業対象 = ハーネス本体、の **2 リポジトリ併走**。文脈が切り替わったのに前の状態を引きずった = Stage 1-6 と同じ型のリポジトリ境界での再発

### Stage 8 (07-06): 復旧成功 — 一次情報だけで着地
- **今度は各ステップを stdout でなくファイル経由で検証しながら**進めた:
  1. working tree の settings.json churn を diff で確認 (model 設定の揺らぎのみ、他エージェント作業でないと確定) → 破棄
  2. `git checkout -- settings.json && git rebase origin/main` を連結 (settings.json 再変更のレースを最小化) → 成功
  3. 検証 (ファイル): main = `8639398` (親 `65631ab`)、working tree clean、live script = find-exec 版 (#90)、汎用 agent-essence ×3 (#74)
  4. stale な stash を drop → stash 空
  5. push (FF): `65631ab..8639398` → gh api で GitHub = ローカル = `8639398`、ahead/behind 0 を確認
- **同じ作業が、stdout 依存では混乱し、ファイル検証では一直線に着地した** — チャネル選択が明暗を分けた

## 重要発見

### 発見1: stdout 化けは特定コマンド限定・再現性あり (事実)
- echo は正常、`git log` の stdout も正常、`git rev-parse` の stdout だけが `60c5168`→`51fc0a9` に化けた。同コマンドの tee ファイルは正しい。メカニズムは未確定 (要調査、次 session で hooks を実読して切り分け)

### 発見2: 「自分の行為の成否」すら誤認した (最深の失敗、#7)
- Write/Edit の成功表示を信じて「post-mortem を書いた/更新した」と認識したが、ファイルは存在しなかった (3独立法で確認)。存在しないファイルに Stage 7 追記や phantom 行の対処をしていた。**成功表示 = 永続化 と思い込まない**

### 発見3: 失敗の本質はツールでなく「検証の欠如」(事実に基づく分析)
- stdout 化け・Write 未永続化は引き金にすぎない。真因は、化けた値・未検証の成功表示・警告付き出力を**一度も裏取りせず事実認定した**こと。Read/gh api/複数独立法 は終始使えた。裏取り手段は最初からあった

### 発見4: 決めつけは1度撤回しても型が残る (事実)
- Stage 4 で「データ損失」撤回 → Stage 5 で「ツール破損」を新たに決めつけ。撤回したのは結論であって、未検証断定の行動様式は直っていなかった。型が直ったのは、ユーザーが「1個ずつ確認しよう」とプロセス自体を指定した後

### 発見5: これは再発 (2026-06-11 との照合)
- `2026-06-11_tool-call-fabrication-incident.md` に同種 (ツール結果の捏造/信頼不能) を記録済み。1回の post-mortem では型が定着しなかった。仕組み化 (プロセス強制) が必要な段階

## 改善候補 (再発防止ルール)

1. **git/ファイル状態は stdout の一読で事実認定しない**。重要状態は「ファイルへリダイレクト → Read」または「gh api の構造化出力」を正とする。stdout とファイルが食い違ったらファイルを信じる
2. **重大結論 (データ損失 / force push 級) の前に独立2チャネル以上で一致を確認**してから下す
3. **状態把握が不確実なうちは破壊的操作 (reset --hard / force push) を絶対に提案しない**。デフォルトは「触らない」
4. **Write/Edit の成功表示を信じず、直後に Read で永続化を検証**する (発見2)
5. **system-reminder が「出力破損の可能性」を警告した値は事実認定しない**
6. **ユーザーの「本当に?」「ハルシネーションしてない?」「決めつけるな」は最優先の検証トリガー**。弁明せず即座に切り分け (echo → tee → ファイル Read) に入る
7. **決めつけを撤回した直後こそ、新たな決めつけをしていないか自己点検する**
8. **「commit/push」等の語で文脈のリポジトリを取り違えない** (cwd と実作業対象が別なら明示的に区別)

## 結論

**git の復旧は完了・検証済み** (GitHub = ローカル = `8639398`、#74/#90 live 反映、records push 済み、ahead/behind 0)。
事故は「未検証の出力を事実認定して最悪シナリオへ飛躍した」ハルシネーションで、ツール不調は引き金、
裏取り手段 (Read/gh api) は終始使えた。最深の失敗は「post-mortem を書いた」という**自分の行為の成否**すら
誤認したこと (ファイルは存在しなかった)。これは 2026-06-11 の再発であり、1回の反省では定着せず、
**プロセス強制 (重い判断ほど独立2チャネルで裏取り) の仕組み化**が要る段階に来ている。

翌日の復旧が一直線に着地したのは、まさに「各ステップを stdout でなくファイル経由で検証した」から —
本プロジェクトの reviewer 群が説く「機械検証で主観を補正する」原則を、自分の状態把握に適用した結果じゃ。
