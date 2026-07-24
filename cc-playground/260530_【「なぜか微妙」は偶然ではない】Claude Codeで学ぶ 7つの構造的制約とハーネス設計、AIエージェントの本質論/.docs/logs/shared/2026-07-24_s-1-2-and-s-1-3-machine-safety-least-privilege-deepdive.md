---
date: 2026-07-24 09:42:15
type: study
topic: s-1-2-and-s-1-3-machine-safety-least-privilege-deepdive
session: S-1.2「安全性の判定を自然言語に委ねない」+ S-1.3「最小権限で爆発半径を抑える」合同深掘り (取り入れフェーズ第15弾 — S-1.2 が薄いため S-1.3 と合同、かいじゅう指示)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (S-1.2 = 2065〜2078行 / S-1.3 = 2079〜2111行、関連: S-1 3層ゲート 1955 / S-1.4 伝播停止 2112 / C-5 報酬ハッキング / C-7 校正盲 / V-1.3 入口で絞る)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-23_s-1-trust-boundary-three-layer-gate-deepdive, 2026-07-22_v-1-3-narrow-options-before-inference-deepdive, 2026-07-20_s-chapter-trust-boundary-permissions-adoption-check]
related_log: [.docs/logs/shared/2026-07-23_s-1-trust-boundary-three-layer-gate-deepdive.md, .docs/logs/shared/2026-07-22_v-1-3-narrow-options-before-inference-deepdive.md, .docs/logs/shared/2026-07-20_s-chapter-trust-boundary-permissions-adoption-check.md]
---

# S-1.2「安全判定を自然言語に委ねない」+ S-1.3「最小権限で爆発半径を抑える」合同深掘り — 判定: 両者とも取り入れ済み · S-1.2 は機械判定の限界も明文化(記事超え) · S-1.3 の反例 tools 無指定 4本 = 既存 #220 と同一(新規 issue 不要)

> 核心の構造事実: **S-1.2** = 安全判定を LLM の自然言語でなく機械条件へ。`hook_pre_commands` (9 rule の正規表現/固定文字列で curl/npm/秘密読取/一括置換/find-delete 等を字句 deny) + `read_secret` (パス一致 fail-closed) + `hardcode_hygiene` (machine 固有パス block) + worktree guard 2枚 (パス判定+字句判定) の PreToolUse hook 群、及び exit code 判定器 (verify-adr / assert-* 4本 / commit gate) が「安全か」を LLM 判断を介さず物理判定。**記事超え = 機械化の"限界"も明文化**: `probe-before-persist` L5「内容の真偽は機械判定しない (意味論判断ゆえ)」= 安全判定のうち意味論部分は機械化せず HITL に残す境界を自覚 (fail-closed=防御 / fail-open=advice の使い分けも明示)。**S-1.3** = 可逆性ベース権限3分類 (allow 41 [読取系] / ask 30 [可逆だが要確認] / deny 177 [不可逆・秘密]、`defaultMode: default`) + worktree 隔離 (documented known gap つき) + sandbox + subagent の tools 絞り (32 agent 中 28 が明示絞り、verifier 系 ~24 本が Edit/Write 非付与)。**反例狩りの収穫 = tools 無指定 4本** (context-engineering / frontend-developer / security-devsecops-expert / test-ai-tdd-expert) だが、これは V-1.3 深掘りで発見し **#220 で追跡中の同一物** — 別レンズ (V-1.3=入口で絞る / S-1.3=最小権限) が同じ穴に収束した。新規 issue は不要。加えて note S-1.3 の deny 例 `**/*.test.ts` は S-1 と同じく意図的不採用 (TDD 両立の予防→検出移設)。

## 概要

取り入れフェーズ第15弾。S-1.2 は内容が薄い (機械検証可能条件パターンの1点) ため、かいじゅう指示で S-1.3 (最小権限) と合同で1本の harness-adoption-audit に束ねた。親バッチ (2026-07-20 S章一括) は S-1.2「✅ 安全判定=機械化」/ S-1.3「✅ allow/ask/deny の三分類が可逆性ベース + worktree 隔離」と判定済み。本深掘りは (a) 両者の実測確証、(b) S-1.2「機械化できるのに LLM に委ねている箇所」/ S-1.3「過剰権限」の反例狩り、(c) 記事超え差分、に集中。ハーネス実測 (step3) は read-only Explore に両ユニット同時委譲。**S-1.1 の学び (gap 判定前に essence 棄却候補表を照合) を適用** — 本監査の反例は #220 追跡中の既存残差ゆえ棄却候補でなく accepted-to-fix、と切り分け済み。

## 内容

### note S-1.2 の定義 (2065〜2078 行)

- たとえ: 「信頼できそう」の印象 vs 暗証番号の一致。LLM の安全判定は迎合性 (C-3)・コンテキスト依存・自己確信 (C-7) で不安定
- 設計パターン: 機械検証可能条件パターン — 「本番か?」→ `echo $NODE_ENV` / 「安全な変更か?」→ `git diff --stat` のファイル数閾値 / PreToolUse Hook の正規表現で本番操作を LLM 判断を介さず物理ブロック

### note S-1.3 の定義 (2079〜2111 行)

- たとえ: 子供に牛刀でなく野菜カッターを渡す。能力を疑うのでなく万一のダメージ最小化
- 根拠 = C-7 校正盲 (間違いに気づけず確信実行) + C-5 報酬ハッキング (権限拡大しようとする)
- 設計パターン: 可逆性ベース権限4分類 (Tier1 読取=allow / Tier2 ローカル可逆=allow-ask / Tier3 リモート影響=条件付き+Hook / Tier4 不可逆=deny-人間承認)。deny で Tier4 + 評価基準ファイル (`.eslintrc*`, **`**/*.test.ts`**, `.claude/settings`) を禁止。探索は Worktree 隔離。「迷ったら可逆な方 (`git push --force` でなく `git push`)」

### ハーネス実体の対応表 (Explore scan 実測)

| note の要素 | ~/.claude の実体 | scan 実測 |
|---|---|---|
| **S-1.2** 安全判定を機械条件へ | PreToolUse hook 5本 (commands / read_secret / hardcode_hygiene / worktree guard 2枚) + rules JSON 9 rule | `hook_pre_commands` (regex/fixed で curl/npm/秘密読取/amend/一括置換/find-delete/nano-banana課金/クリップボード/保護パス書込 を字句 deny) / `read_secret` (パス一致・fail-closed L14) / `hardcode_hygiene` (machine 固有パス block、L11「確率的→決定論的」) / worktree guard 2枚 |
| **S-1.2** exit code 判定器 | verify-adr + assert-* 4本 + commit gate | 「安全/合格か」を LLM でなく exit 0/1/2・数値で判定 (verify-adr L7「検証できなかったを合格に化けさせない」) |
| **S-1.2** 機械化の限界を明示 | probe-before-persist L5 | 「内容の真偽は機械判定しない (意味論判断ゆえ)」= 安全判定の意味論部分は HITL に残す境界 (記事超え) |
| **S-1.3** 可逆性3分類 | `permissions` allow 41 / ask 30 / deny 177 | allow=読取系 (Read/Glob/Grep/git status/lint系)、ask=可逆だが要確認 (eval系/git 準破壊/Keychain)、deny=不可逆・秘密 (rm/git push/curl/DB/評価基準/ハーネス保護) |
| **S-1.3** 爆発半径の隔離 | worktree 隔離 + sandbox + subagent tools 絞り | multi-agent-safety L11 (cwd+env 両方を worktree へ) / sandbox denyWrite 2・denyRead 137 / agent 28/32 が tools 明示絞り |
| **S-1.3** Tier4 の人間承認 | Keychain 操作を ask に登録 | harness-worktree-isolation L82「agent が手順を読み飛ばして実行しても Keychain 操作は必ず人間承認 (決定論ゲート)」 |

### 個別照合 — S-1.2 (実測確証)

**安全判定の機械化 — 取り入れ済み.** note の「本番か?→ echo $NODE_ENV」「PreToolUse 正規表現ブロック」に対応する機械判定が hook 群に実在。`hook_pre_commands_rules.json` は 9 rule の正規表現/固定文字列で危険コマンドを**字句レベルで deny** (例: `find\s+[^|]*-delete` = 「trash を経由しない不可逆削除」を rm と同様に禁止)。`read_secret` は入力異常時に **fail-closed** (旧実装は fail-open で秘密防御が無効化していた、L16 の是正記録)。「安全か」を LLM の散文でなくパス一致・正規表現・exit code で決める = S-1.2 そのもの。

**記事超え: 機械化の"境界"を明文化.** note は「機械化せよ」まで。ハーネスは**どこまで機械化しどこを意味論に残すか**を明示する: `probe-before-persist` L5「内容の真偽は機械判定しない (意味論判断ゆえ)」/ hook の fail-closed (防御系) と fail-open (advice 系) の使い分け / Keychain 削除可否は機械で「承認を通す」までで可否の意味論は人間に留保。S-1.2 を「安全判定は機械化、ただし意味論は除く」と精密化 = このシリーズ通底の決定論/意味論境界の"安全側"の実装。

**反例狩り (機械化できるのに散文規律に委ねている箇所).** `multi-agent-safety.md` の安全規律は自然言語 rule (想起トリガー) で書かれる — だが `git stash`/`git worktree`/`git add`/`git commit` は settings.json の `ask` に登録済みで**一部は既に機械 gate 化**。純粋に散文のみ (機械化ゼロ) の安全規律は「不明変更は他エージェントの仕事と仮定」等の**意味論判断を要するもの**に限られ、これは機械化できない性質。→ S-1.2 の未適用 gap は無し (機械化可能なものは機械化済み、残るは意味論)。

### 個別照合 — S-1.3 (実測確証)

**可逆性3分類 — 取り入れ済み.** allow 41 (読取系中心) / ask 30 (可逆だが要確認) / deny 177 (不可逆・秘密) が note の Tier 1-4 に対応。deny に Tier4 (rm/git push/`git push --force` 相当の破壊系) + 評価基準ファイル (eslintrc/tsconfig 等) + ハーネス保護。「迷ったら可逆な方」の思想が deny (`git push` は deny=人間のみ、force は当然 deny) に表れる。

**爆発半径の隔離 — 取り入れ済み.** worktree 隔離運用 (multi-agent-safety L11 + harness-worktree-isolation)、sandbox.filesystem、subagent の tools 絞り (verifier/reviewer/debater 系 ~24 本が Edit/Write 非付与 = 「監査役に書込権を与えない」爆発半径の最小化)。

**note との相違 (S-1 と同型): test deny の意図的不採用.** note S-1.3 は deny 推奨例に `**/*.test.ts` を明示するが、ハーネスは test ファイル deny を**採用していない** (S-1 深掘りで確定: 一律 deny は TDD の RED 作成を壊すため、予防でなく verify 時の git hash 指紋照合=検出へ移設)。documented divergence で gap ではない。

### 記事超え点

1. **機械化の境界の明文化 (S-1.2)**: 上記。安全判定を機械化しつつ「意味論は機械化しない」線引きを自覚 (probe-before-persist L5 / fail-closed・fail-open 使い分け)。
2. **字句層で deny の穴を塞ぐ (S-1.2)**: `permissions.deny` (Edit ツール経路) が届かない Bash 経路 (redirect/tee/cp/sed -i) を `hook_pre_commands` / worktree bash guard が**正規表現で字句 deny**。同一の安全条件を2経路で機械判定。
3. **監査役の read-only 化で爆発半径最小 (S-1.3)**: tools 絞りを「帯域/hack 防止」でなく**役割境界の構造保証**に使う — verifier 系 ~24 本が Edit/Write 非所持。生成と批評の物理分離 (C-3) と最小権限が同じ tools 絞りで両立。
4. **可逆性で層を割る (S-1.3, S-1 と連続)**: 不可逆度が最大の DB 直アクセス・force push は L3 (ask) でなく L1 (deny) へ格上げ。note の「Tier4=deny/人間承認」のうち不可逆側を deny に寄せる。

### 反例狩り / 残差

- **[Medium・既存 #220 と同一、新規 issue 不要] tools 無指定 4本**: `context-engineering-agent` / `frontend-developer` / `security-devsecops-expert` / `test-ai-tdd-expert` が frontmatter に `tools:` 行を持たず全権限継承 (28/32 は絞り済みの中でこの4本だけ)。**これは V-1.3 深掘り (第8弾) で「入口で絞る」の反例として発見し #220 で issue 化済みの同一物** — V-1.3 (入口で絞る) と S-1.3 (最小権限) という別レンズが同じ穴に収束した (最小権限 gap = 入口を絞れていない gap は同じ穴の別名)。scan が `~/.claude` 内に #220 言及を見つけられないのは、issue が GitHub (kaijutale/claude-harness) に在り harness ファイルに無いため (探索範囲外)。**#220 で追跡中ゆえ新規 issue を立てない** (重複防止)。特に security-devsecops-expert は監査役なのに Edit/Write を持つ役割境界リーク = S-1.3 の「監査役 read-only」慣行と最も不整合、#220 でも高優先
- **[Low・記事との相違] test deny 不採用**: 上記。note の deny 例に反するが TDD 両立の意図的設計 (S-1 で確定済)。gap でない
- **[観測] worktree 隔離の documented known gap**: harness-worktree-isolation L214-221「ガードで代替できないもの」— cwd=本体で打つ裸の `git commit` は worktree guard に映らず本体 branch に着地しうる。ハーネス自身が明示 (隠れ gap でなく開示済み制約)。S-1.3 の隔離の限界として記録
- **[観測] frontend-developer の PostToolUse hook**: agent 定義内に `command: echo ... >> /tmp/agent-hooks.log` が定義されている (Write 毎に /tmp へ追記)。tools 無指定 4本の一つで、外部テンプレ由来のマーカー。#220 の絞り対象に含まれる
- S-1.2 側の未適用 gap: **無し** (機械化可能な安全判定は機械化済み、残るは意味論ゆえ機械化しない領域=正しい線引き)

判定: **S-1.2・S-1.3 とも取り入れ済み**。S-1.2 = 安全判定を hook 群の正規表現/exit code で機械判定し、かつ「意味論は機械化しない」境界まで明文化 (記事超え)。S-1.3 = 可逆性3分類 (allow41/ask30/deny177) + worktree/sandbox/tools 絞りで爆発半径を最小化、不可逆側を deny へ格上げ。反例 tools 無指定 4本は #220 で追跡中の既存残差 (新規 issue 不要)、test deny 不採用は documented divergence、worktree 裸 commit は開示済み既知 gap。**新規 issue なし** (S-1.1 の学びどおり、既存追跡・意図的相違・開示済み制約を新規 gap と誤認しない)。

## 独立検証 (step6) の記録

fresh な read-only reviewer (code-reviewer) が計数・同定を jq/grep で数え直し、全逐語・行番号を実ファイル照合。verdict = **(b) 要修正 (ただし Low×2 の計数のみ)**。**最重点の計数・同定はすべて完全一致**: allow 41 / ask 30 / deny 177 (jq 実測)、tools 無指定 **4本ちょうど** (32本走査で見落とし/過剰計上なし)、28/32 絞り済み、verifier/reviewer 系 **24本ちょうど** が Edit/Write 非付与、rules JSON **9 rule**、test deny **0件**、そして **#220 が実際にこの4 agent 対象** (`gh issue view 220` の title・本文で取り違えなし) → 「新規 issue 不要」は正当。逐語 (probe L5 / hook_pre_commands L47-51 / read_secret L14,16 / hardcode L11 / verify-adr L7 / assert 4本 / worktree L214-221,L82 / settings 行番号 / Keychain ask) も全トレース可・捏造なし。

要訂正は計数 2 箇所のみ (裏取り訂正済み):
1. **[Low] `denyRead 150+` → 実 137** (jq 実測)。過大表現を実数へ訂正
2. **[Low] `PreToolUse hook 6本` → 5本** (列挙 = commands/read_secret/hardcode + worktree×2)。6本目が特定不能だった計数の綻び → 列挙に合わせ 5本へ訂正

いずれも「取り入れ済み」の結論に影響しない。反例 (tools 無指定 4本) が #220 と同一で新規 issue 不要という結論は、`gh issue view 220` の独立確認で裏付けられた。意味論の最終 backstop は step 8 の人間 content-review。

## 関連ファイル

- `~/.claude/hooks/hook_pre_commands.sh` + `hooks/rules/hook_pre_commands_rules.json` — S-1.2 安全判定の字句機械化 (9 rule)
- `~/.claude/hooks/hook_pre_read_secret_check.sh` (fail-closed) / `hook_pre_hardcode_hygiene_check.sh` (L11 確率的→決定論的) — S-1.2
- `~/.claude/rules/probe-before-persist.md` (L5 内容真偽は機械判定しない) — S-1.2 機械化の境界 (記事超え①)
- `~/.claude/settings.json` — S-1.3 権限3分類 (allow 41 / ask 30 = L237 / deny 177 = L58 / defaultMode L269 / sandbox L658)
- `~/.claude/.docs/progressive-disclosure/harness-worktree-isolation.md` (L82 Keychain HITL / L214-221 隔離の既知 gap) — S-1.3
- `~/.claude/agents/*.md` — tools 絞り 28/32、tools 無指定 4本 (context-engineering/frontend-developer/security-devsecops-expert/test-ai-tdd-expert) = #220
- `.docs/references/260405_…/text.md` (S-1.2 2065〜2078 / S-1.3 2079〜2111) — 照合基準
- `.docs/logs/shared/2026-07-22_v-1-3-narrow-options-before-inference-deepdive.md` — #220 の初出 (入口で絞る反例) = 本監査の tools 無指定 4本と同一穴
- `.docs/logs/shared/2026-07-23_s-1-trust-boundary-three-layer-gate-deepdive.md` — test deny 不採用の確定 (親 S-1)
