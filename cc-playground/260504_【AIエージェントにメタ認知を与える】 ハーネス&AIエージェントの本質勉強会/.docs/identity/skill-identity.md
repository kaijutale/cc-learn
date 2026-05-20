# skill-identity.md

> `~/.claude/.docs/essence/skill-essentials.md` (8原則) に対する、本プロジェクトでの自己選択。
> essence の各原則に対して「このプロジェクトでは何を選んだか / どう実装するか」を1:1対応で記述する。

## 対応 essence

`~/.claude/.docs/essence/skill-essentials.md` (v1.0)

## essence/skill との対応表

| # | essence 原則 | このプロジェクトの選択 |
|---|---|---|
| 1 | Description はトリガー条件 | 新規 skill 作成時、トリガーフレーズに **日本語+英語両方** を含める。例: `"スキル作成", "create skill"` |
| 2 | Skip the Obvious | Claude のデフォルト挙動を **上書きする情報のみ** 記述。一般常識/公式docコピーは禁止 (`authoring-skills` skill 使用) |
| 3 | Gotcha セクション | 全 skill に `## Gotcha` セクションを設ける。レビューア指摘を継続的に蓄積 |
| 4 | Progressive Disclosure | SKILL.md 本体は **~30行のハブ**、詳細は `references/<topic>.md` に分離。500行超は分割 |
| 5 | Don't Railroad | low freedom (脆弱・再現性必須) なタスクのみ step-by-step 化、high freedom (発想/レビュー等) はテキスト指示に留める |
| 6 | I/O 契約の明確化 | 4タイプ (Dictionary / Workflow / Generative Workflow / Identity) を冒頭で明示 |
| 7 | 決定論的処理は scripts/hooks に逃がす | validate / check / lint は Python or Bash スクリプト化、`!コマンド` shell-inline syntax 活用 |
| 8 | 上位 essence との整合 | 新規 skill 作成時に `harness-essentials.md` との対応関係を明記する (どの原則を具体実装したか) |

## このプロジェクトで使う主要 skill

学習プロジェクトなので「使う」中心 (新規作成は二次)。本プロジェクトで頻用するもの:

| skill | 用途 |
|---|---|
| `/logging` | 学習ログ記録 (type: study/qa/observation/work/validation/experiment)。本PJでは `.docs/logs/shared/` 直行 |
| `/promote-log` | local → shared 昇格 (本PJでは local を使わないため使用頻度は低) |
| `/commit` | semantic commit (Conventional Commits)。手動 `git add` / `git commit` 不可 (committer に統一) |
| `/article-explainer` | note記事/ブログURL → 日本語解説生成 |
| `/find-skills` | 不足機能の探索 |
| `/handoff` `/pickup` | セッション間引き継ぎ (`.claude/handoff-state.md`) |
| `/changelog` | Claude Code の最新CHANGELOG取得 |

(将来的に追加予定: essence をレビューア基準として渡す `review-agent-essence` 等)

## このプロジェクトで skill を新規作成する場合

| 観点 | 選択 | 根拠 |
|---|---|---|
| **配布スコープ** | 個人用 | memory: `feedback_personal-skill-context-first.md` |
| **配置場所** | グローバル `~/.claude/skills/<skill-name>/` | 全プロジェクトで再利用、project-scope skill (`.claude/skills/`) は作らない |
| **命名規約** | kebab-case (例: `review-agent-essence`) | グローバル方針。プロジェクト固有名禁止 (CLAUDE.md `Harness` 節) |
| **frontmatter** | YAML | グローバル方針 |
| **儀礼を積まない** | semver / CHANGELOG / breaking-changes-policy 不要 | 個人用なので公式配布レベルの儀礼は過剰 |
| **`disable-model-invocation`** | **`true` 禁止** | Skillツール明示呼出も block する (memory: `feedback_disable-model-invocation-blocks-skill-tool.md`) |
| **作成手順** | `~/.claude/skills/authoring-skills/SKILL.md` を必ず参照 | グローバル CLAUDE.md `Skills` 節 |

## fork skill (context:fork + subagent:) の注意

fork skill を使う/作る場合の本プロジェクト方針:

- **in-process / out-of-process で挙動が揺れる公式 grayzone** (memory: `feedback_skill-fork-asymmetry.md`)
- **cwd 継承対策必須**: subagent に渡すパスは解決済みの絶対パス (`~` や相対パスは subagent コンテキストで展開されない可能性があるため、フルパスで渡す)
- **相対パスを subagent プロンプトに含めない**

## TDD skill 使用時

`/tdd` `enforcing-strict-tdd-cycle` 等を使う場合:

- **RED stub で `throw Error` 禁止** (memory: `feedback_tdd-red-stub-anti-pattern.md`)
- 理由: エラー系テストが偶然 pass するアンチパターン
- 正解: `undefined` を返す stub から始める

## 多人数 skill (debate / debate-multi-role) 使用時

`debating-roles` / `llm-debate` 等を使う場合:

- **全 role を Claude Opus 固定**
- Haiku/Sonnet 混在禁止 (memory: `feedback_multi-agent-debate-design.md`)
- 視点多様性は **役割分離** で確保 (team-* 6-Role)

## レビュー基準としての essence 利用

`review-agent-essence` 等で essence をレビューア基準として渡す場合 (harness-identity.md と重複するが skill 観点で再掲):

- essence の **全量** をレビューア skill に渡す (圧縮しない)
- 実装者 skill には essence の **圧縮版** または「該当原則のみ」を渡す
- 根拠: skill-essentials 原則7 (レビューアと実装者の分離) → harness-essentials 原則7 と同義

## skill 配置の判断フロー

新規 skill 作成時、本プロジェクト内 `.claude/skills/` に置くか、グローバル `~/.claude/skills/` に置くかの判断:

```
このskillは本プロジェクトでしか使わない?
├── YES (汎用skillに固有名を付けるパターン)
│         → CLAUDE.md `Harness` 節「グローバルskillsはプロジェクト固有名禁止」
│         → そもそも本プロジェクトで使うskillは概念レベルで普遍的なはず
│         → 判断ミス。再考する。
├── YES (本プロジェクトの .docs/identity/ に構造的依存する reviewer)
│         → 例外。プロジェクトローカル `.claude/skills/` 配置を許容
│         → 理由: 評価軸が .docs/identity/ (本PJ固有資産) なのでグローバル昇格すると壊れる
│         → 例: project-domain-reviewer-fork / project-essence-orchestrator (PDR系)
│         → 永続化: .gitignore の負パターンで選択追跡 (5-4/5-5 検証済 working asset)
└── NO  → グローバル `~/.claude/skills/<skill-name>/` に配置
```

結論: **本プロジェクト固有 skill は原則作らない** (すべての新規 skill はグローバル昇格を前提に設計する)。
ただし **`.docs/identity/` に構造的依存する reviewer (PDR系) は例外** — グローバル昇格すると評価軸を失って壊れるため、プロジェクトローカル `.claude/skills/` 配置を許容し、`.gitignore` 負パターンで選択追跡する。

## 改訂履歴

| 日付 | 版 | 変更 |
|---|---|---|
| 2026-05-06 | v1.0 | 初版。essence/skill-essentials.md (v1.0) の8原則と1:1対応で本プロジェクトの選択を記述。 |
