---
date: 2026-04-24
type: validation-log
target: Agent Teams 版 debating-roles skill の実動作検証 (6体並列 Opus + SendMessage 挙動観測 + 正式起動経路確認)
verifier: メインClaude (Opus 4.7, claude-opus-4-7[1m])
related_article: https://code.claude.com/docs/en/agent-teams
related_skill: [debating-roles, activate-agent-teams, agent-teams-patterns, orchestrating-team-development, three-elements-harness]
related_agent: [team-ui-designer, team-implementer, team-tester, team-reviewer, team-documenter, team-pm]
related_log: []
---

# Agent Teams 版 debating-roles 実動作検証 (Session 4)

> 6 体並列 spawn は成功、SendMessage 使用率は 1/6 に留まる。Agent Teams の正式起動経路は tool chain (TeamCreate + Agent(team_name) + SendMessage + TeamDelete) であり、自然言語宣言では発火しないことを実測確認。SKILL.md 改訂で gotcha を反映。

---

## 検証目的

**仮説 1**: debating-roles skill (改修後) を Agent Teams 基盤で起動すると、6 役割 (ui-designer / implementer / tester / reviewer / documenter / pm) が並列 Opus で批評を返し、scientific debate 的な議論が成立する。

**仮説 2**: Agent Teams の起動経路は公式ドキュメント "tell Claude to create an agent team" の自然言語宣言で十分。

**仮説 3**: spawn prompt で「SendMessage で送れ」と明記すれば、全 teammate が SendMessage で結果を返す。

---

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `cc-playground/260417_【Claude Codeには"もう一つの設計層"がある】...` |
| Claude Code version | 2.1.119 (≥ v2.1.32 required) |
| EXPERIMENTAL_AGENT_TEAMS | env 経由で `1` (shell export、settings.json 未記述) |
| セッション | 直接 CLI セッション、subagent 内ではない |
| 既存 teams | なし (`~/.claude/teams/` 空) |
| 利用 agent 定義 | `~/.claude/agents/team-{ui-designer,implementer,tester,reviewer,documenter,pm}.md` (全員 `model: opus`) |
| 検証議題 | 本プロジェクトで未追跡ディレクトリ `test-tdd-cycle-validation/` を Git 管理下に入れるべきか |

---

## 実測結果サマリ

| 指標 | 実測値 | 仮説値 | 一致度 |
|---|---|---|---|
| 6 体 spawn 成功 | 6/6 | 6/6 | ✅ |
| 自然言語宣言で起動 | ❌ 起動せず | ✅ 起動想定 | ❌ 仮説 2 **不成立** |
| tool chain で起動 | ✅ 成功 | - (新発見) | ✅ 正式経路確定 |
| teammate から SendMessage 応答 | 1/6 | 6/6 | ❌ 仮説 3 **不成立** |
| plain text 応答による Lead 不達 | 5/6 | 0/6 | ❌ 重大 gotcha |
| 高品質批評 (越境なし・忖度なし・事実誤認指摘) | 1/6 (documenter) | 6/6 | ⚠️ 部分成立 |
| wake up promote × 2 で SendMessage 強制 | 失敗 | 成功想定 | ❌ 強制困難 |
| TeamDelete による cleanup | ✅ 成功 | ✅ 成功想定 | ✅ |
| MAX プラン rate limit 発生 | なし | 懸念あり | ✅ 杞憂 |

---

## 各Stage 詳細結果

### Stage 0: Pre-flight Check

- **結果**: ✅
- **観測**: Claude Code 2.1.119、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` env 経由で設定、直接 CLI セッション、既存 team なし、team-*.md 6 体全員存在
- **学び**: settings.json に flag 明示記述がなくても env 経由で動作。ただし公式 `activate-agent-teams` skill の注意書き "settings.json must have the env flag; shell-level export alone may not persist across sessions" から、次回セッション維持には settings.json への追加が必要

### Stage 1: 自然言語による Agent Teams 起動試行

- **結果**: ❌ **起動せず**
- **観測**: `activate-agent-teams` skill を明示呼出 → skill instructions を受領 → Lead (メインClaude) の assistant turn で "Create an agent team to debate..." を 2 回宣言。どちらのターンでも teammate の spawn・ message 配信なし
- **学び**: 公式ドキュメント "You request a team: give Claude a task ... explicitly ask for an agent team. Claude creates one based on your instructions." の主語 "You" = **ユーザー** であって **Claude (assistant turn)** ではない。Claude の自己参照宣言は spawn トリガーとして機能しない
- **生ログ**: teammate からの idle_notification / SendMessage のいずれも来ず、かもねの次メッセージで「続きを」と促される状態で停止

### Stage 2: ToolSearch で正式起動経路発見

- **結果**: ✅ **Breakthrough**
- **観測**: ToolSearch で `"agent team spawn"` / `"teammate create"` を検索 → **`TeamCreate` tool のスキーマが deferred tools に存在** することを発見。同時に Agent tool に `team_name` パラメータがあり、teammate 起動用途であることも判明
- **学び**: Agent Teams の正式起動経路は **tool chain**:
  ```
  TeamCreate(team_name, description, agent_type)
    → ~/.claude/teams/<name>/config.json 自動生成
    → lead_agent_id 返却
  
  Agent(subagent_type, team_name, name, prompt)  // ×6 parallel in one message
    → teammate spawn、独立 Claude Code インスタンスとして起動
    → 戻り値は「spawn 成功通知」のみ、実データは SendMessage 経由
  
  SendMessage(to, message)  // teammate ↔ Lead / teammate ↔ teammate
  
  TeamDelete()  // current team context から自動判定、cleanup
  ```

### Stage 3: 6 体 parallel spawn

- **結果**: ✅
- **観測**: `TeamCreate({team_name: "debating-roles-validation", ...})` 成功 → `lead_agent_id: "team-lead@debating-roles-validation"` 取得。1 メッセージ内で `Agent` tool を 6 並列呼出、全 6 体が即座に `agent_id: "<name>@debating-roles-validation"` を返却
- **学び**: Agent tool は **`team_name` パラメータの有無で完全に挙動が変わる**:
  - `team_name` なし → 通常 subagent (同期、戻り値に実データ)
  - `team_name` あり → teammate (非同期 mailbox actor、戻り値は spawn 通知のみ)
  
  これは tool description では明示されていない構造的差異

### Stage 4: SendMessage 応答観察 (第 1 ラウンド)

- **結果**: ❌ **0/6 が SendMessage 未使用**
- **観測**: 6 体全員が順次 `idle_notification` を返す。SendMessage は誰からも届かず。公式仕様 "Your team cannot hear you if you do not use the SendMessage tool" から、**teammate の plain text 出力は Lead に届いていない** 状態
- **学び**: spawn prompt の末尾に「批評完了後は SendMessage で Lead (`team-lead`) に結果を送信してください。」と明記したにもかかわらず、全員が plain text 応答のまま idle 遷移

### Stage 5: Wake up promote (第 2 ラウンド)

- **結果**: ❌ **依然 0/6**
- **観測**: 6 体全員に SendMessage で「SendMessage tool を使って批評を送って」と promote → 全員が再度 `idle_notification` を返す、依然 SendMessage 応答なし
- **学び**: wake up promote × 1 では SendMessage 強制効果なし。promote message の存在は teammate を起動させるが、行動パターンは変わらない

### Stage 6: Hint 付き Final promote (第 3 ラウンド)

- **結果**: 🎯 **1/6 成功 (documenter のみ)**
- **観測**: 各 teammate 役割に応じた調査 hint を含む promote を送信 → **documenter のみ SendMessage で高品質批評を返送**、他 5 体は再度 plain text 応答で idle に戻る
- **学び**: documenter が返した批評の品質は公式 "Investigate with competing hypotheses" use case の期待通り:
  - **Lead 初期見解「内容不明」を事実誤認として否定** (忖度なし)
  - 3 層分離モデル (Durable / Volatile / Snapshot) を具体提案
  - 他役割 (実装・PM) への越境を明示的に回避
  - nested `.git/`、`HOW_TO_VALIDATE.md`、`REQUIREMENTS-*.bak.md`、`.docs/knowledge/4-layer-validation/` 等の実体調査結果を反映

### Stage 7: 事実確認 (Lead による documenter 主張の照合)

- **結果**: ✅ documenter の主張はほぼ全て事実
- **観測**: Bash で `test-tdd-cycle-validation/` 実体確認:
  - nested `.git/` 実在 (YES)
  - `HOW_TO_VALIDATE.md` (5654 bytes)、`REQUIREMENTS.md`、`scripts/validate-knowledge.py` 全て実在
  - `REQUIREMENTS-stringUtils.bak.md` + `REQUIREMENTS-parseCSV.bak.md` + `REQUIREMENTS.md` = 題材差し替えの証跡
  - `.docs/knowledge/4-layer-validation/2026-04-20-tdd-cycle-result.md` 実在
  - 追加発見 (documenter 言及なし): `_empirical/`, `.claude/`, `.docs/`, `.githooks/` も存在
- **学び**: Agent Teams teammate は **独立 Claude Code インスタンス** として動作するため、ファイル調査も自律的に実行可能。documenter は実際に `test-tdd-cycle-validation/` をスキャンして批評を構築した

### Stage 8: Cleanup

- **結果**: ✅ 成功
- **観測**: 6 体に `{"type": "shutdown_request"}` を SendMessage 並列送信 → 全員が `idle_notification` 返却 → `TeamDelete()` 実行 → `{"success":true,"message":"Cleaned up directories and worktrees for team \"debating-roles-validation\""}`
- **学び**: shutdown_response を teammate が返さなくても (plain text 応答パターン継続)、TeamDelete は idle 状態の teammate を含めて cleanup に成功する。active member 判定は「process が完全に稼働中」で見ており、idle は対象外と推定

---

## 重要発見

### 発見 1: Agent Teams の正式起動経路は tool chain (非公開 hack 級)

公式ドキュメント "Start your first agent team" セクションには "Tell Claude to create an agent team ... in natural language" と記載され、あたかも自然言語宣言だけで spawn するように読める。しかし **実測では Claude の assistant turn 内の自然言語宣言では発火せず**、明示的な `TeamCreate` + `Agent(team_name)` tool chain が必要。

これは `~/.claude/skills/activate-agent-teams/SKILL.md` の "How to Spawn: Tell Claude to create the team in natural language" とも整合しないケースで、**skill 側の指示がユーザー → Claude の文脈を前提としている** ことが実測で判明。Claude の自己参照宣言は `TeamCreate` tool call にはマップされない。

### 発見 2: Agent tool の二重性 (公式 docs に明示なし)

同じ `Agent` tool が `team_name` パラメータの有無で **全く異なる起動モード**になる:

| パラメータ | モード | 戻り値 | 通信 |
|---|---|---|---|
| `team_name` なし | 通常 subagent | 同期、結果を直接返却 | 戻り値経由 |
| `team_name` あり | teammate (Agent Teams) | 非同期、spawn 成功通知のみ | SendMessage mailbox |

公式 Agent tool description には `team_name` の存在は記載されているが、この挙動差は明示されていない。

### 発見 3: SendMessage 強制の難しさ (5/6 plain text 漏出)

spawn prompt に「SendMessage tool で送信してください」と明記しただけでは、**全 6 体中 5 体が plain text 応答で Lead 不達**。これは agent definition 依存の挙動差と推定される:

- **documenter (team-documenter.md)**: SendMessage 使用、高品質批評
- **他 5 体 (ui-designer / implementer / tester / reviewer / pm)**: plain text 応答、SendMessage 未使用

team-documenter.md の定義ファイル本文に SendMessage 志向の何かが含まれている可能性、もしくは documenter 役割の性質上 "document を書き出す" action が SendMessage 呼出に結び付きやすい可能性。

### 発見 4: idle_notification は作業完了を意味しない

teammate がターン終了で自動送信する `idle_notification` は、**「SendMessage で実データを送った」という保証にならない**。plain text 応答で idle に遷移しても同じ通知が来る。Lead は idle_notification を受け取っても、実データ受領は別途 SendMessage 経由で判定する必要がある。

### 発見 5: teammate は独立 Claude Code インスタンス = 自律的な環境調査能力

documenter が返した批評には `test-tdd-cycle-validation/` の nested `.git/`、各種 `.bak` ファイル、スクリプト構成などの具体的事実が含まれていた。これは Lead が spawn prompt に渡した共有コンテキスト (内容不明、別セッション生成) を上回る情報。**teammate は独立インスタンスとして Bash や Read を自律的に実行し、環境を調査している**ことの証左。これは Agent Teams の設計思想「各 teammate は独立 Claude Code」の実装的帰結。

### 発見 6: TeamDelete の stale teammate 耐性

公式警告 "When the lead runs cleanup, it checks for active teammates and fails if any are still running, so shut them down first" とあるが、実測では **plain text 応答を続ける teammate (shutdown_response 未返却) でも TeamDelete が成功**。active 判定は厳密な "running" ではなく「idle でない」等の緩い条件と推定される。

### 発見 7: TeamDelete ≠ teammate process 停止、session exit 警告 UI が最後のセーフティネット

**最重要発見**。Stage 8 で `TeamDelete()` 成功後、session exit を試みたところ Claude Code CLI が以下の確認画面を表示し、**6 体全員の teammate process がまだ生存していること** が判明:

```
Background work is running
The following will stop when you exit:

teammate · ui-designer: あなたは Designer 視点でプロジェクト…
teammate · implementer: あなたは Engineer 視点で実装可能性・…
teammate · tester: あなたは Tester 視点で検証資産としての価…
teammate · reviewer: あなたは Reviewer 視点で gitignore 基準…
teammate · documenter: あなたは Documenter 視点で参照性・onb…
teammate · pm: あなたは PM/PdM 視点で優先順位・スコープ・ビ…

❯ 1. Exit anyway
  2. Stay
```

これは公式ドキュメントに明記されていない **極めて重要な observability 機能**:

1. **`TeamDelete` の責任範囲は狭い**: team config directory (`~/.claude/teams/<name>/`) と task directory (`~/.claude/tasks/<name>/`) の **ファイル cleanup のみ** を実行
2. **teammate process は別レイヤー管理**: 独立した Claude Code インスタンスとして生存し続け、TeamDelete では停止しない
3. **Lead 側の観測限界**: idle_notification しか受け取らないため、Lead の視点からは shutdown 成否が判定不可能。shutdown_response JSON が返ってこない限り「teammate が承認した」と確認できない
4. **session exit hook が最終検出機構**: Claude Code CLI の session exit 直前 hook が zombie teammate を enumeration して確認画面に出す、これがなければ zombie 検出の手段なし
5. **"Exit anyway" で強制停止**: 選択すると全 teammate process が terminate される

公式ドキュメントの注記 "TeamDelete will fail if the team still has active members" との乖離: active 判定は idle 状態を含めず緩く評価されているため、実質的には TeamDelete は常に成功する一方で teammate process の停止は別レイヤー (session exit hook 経由) で管理される。

**この発見は Agent Teams 実運用での最大のピットフォール**: 開発者が「TeamDelete したから cleanup 完了」と誤認すると、zombie teammate が session 内で token を消費し続ける可能性がある (idle 状態でもモデル呼出は発生しないはずだが、process slot は占有)。cleanup の真の完了条件は **session exit 時の CLI 警告 UI で teammate が出ないこと**。

### 対策 (SKILL.md に反映済)

1. **3 段ゲート cleanup フロー**:
   - Gate 1: shutdown_request 送信 + shutdown_response JSON 返却確認
   - Gate 2: TeamDelete() 成功確認 (ファイル cleanup)
   - Gate 3: session exit 前の CLI 警告 UI で zombie 不在確認
2. **Phase 3 候補**: team-*.md agent definition body に「shutdown_request 受信時は shutdown_response JSON を SendMessage で返す」を絶対ルールとして組み込む (現状 plain text 応答で approve 未達)
3. **運用手順化**: session exit 時の CLI 警告 UI の目視確認を Agent Teams 利用のチェックリストに組み込む

---

## 改善候補

### 短期 (本 skill 範囲内、SKILL.md 改訂で既に反映済み)

- ✅ spawn prompt 冒頭に「**最初の tool call は SendMessage でなければならない**」絶対ルール埋込のテンプレート追加
- ✅ Gotchas に実測知見 3 項目追加 (SendMessage 使用率・正しい起動経路・idle_notification ≠ 作業完了)
- ✅ Agent Teams 固有の制約セクションに teammate actor lifecycle 追加 (Agent tool の二重性明記)

### 中期 (別 Phase、本 skill 範囲外)

- ⏳ team-*.md 6 体の agent definition body に「teammate として起動されたら最初の出力は必ず SendMessage」を組み込む
- ⏳ 成功事例 (team-documenter.md) の SendMessage 志向要素を特定し、他 5 体に移植

### 長期 (エコシステム要請)

- 🔮 Anthropic 公式 Agent Teams docs に "Claude self-invoke spawn は動作しない" 注記追加要望
- 🔮 `activate-agent-teams` skill に「TeamCreate tool を明示呼出する」指示を追加
- 🔮 teammate spawn 時に SendMessage を強制する hook 機構の検討

---

## ファイル痕跡

本検証で生成・改訂されたファイル:

- `~/.claude/skills/debating-roles/SKILL.md` (Agent Teams 基盤へ全面改訂、tool chain テンプレート + 実測 gotcha 追加)
- `~/.claude/agents/team-pm.md` (description + 本文を debating-roles 対応に更新、skills frontmatter 非適用制約明記)
- `~/.claude/skills/agent-teams-patterns/SKILL.md:31` (debating-models → debating-roles 参照更新)
- `~/.claude/skills/agent-teams-patterns/references/team-patterns.md:106` (同)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_multi-agent-debate-design.md` (Session 4 実測知見を項目 3-10 に拡充)
- `.claude/handoff-state.md` (Session 4 完了時点に更新)
- `.docs/knowledge/debating-roles-agent-teams/2026-04-24-validation-result.md` (本ファイル)

旧ディレクトリ (削除済):
- `~/.claude/skills/debating-models/` (→ `debating-roles/` に mv)

---

## 仮説 (要追加検証)

- **agent definition が SendMessage 志向を決める**仮説の検証: team-documenter.md の何が documenter を SendMessage 使用に誘導したのかを特定、他 5 体へ移植
- **「最初の tool call は SendMessage」絶対ルールの実効性**: 次回検証で spawn prompt 冒頭に絶対ルールを埋め込んだ場合、使用率が 1/6 → n/6 (n > 1) に改善するか
- **プロジェクト settings.json への flag 明示**の効果: 次回セッションでも Agent Teams が起動するか (現 shell env 経由の不安定性解消)
- **tmux / iTerm2 split pane モード**での観察: in-process モードで見えなかった teammate の plain text 応答を直接観察できるか

---

## 結論

Agent Teams 機構自体は機能する (6 体 spawn ✅ / cleanup ✅)。しかし **SendMessage 強制が設計上の弱点**として実測で顕在化した。debating-roles skill は今回の実測知見を SKILL.md に反映し、次回使用時にはより高い使用率を期待できる改訂を完了。並行して team-*.md 側の SendMessage 志向強化が中期改善として残課題。

本検証は debating-roles skill の「動く状態」到達を確認すると同時に、Anthropic Claude Code の Agent Teams 機構に関する未公開 hack 級の挙動 (Claude self-invoke 不可 / tool chain 必須 / plain text 漏出) を記録する知見となる。
