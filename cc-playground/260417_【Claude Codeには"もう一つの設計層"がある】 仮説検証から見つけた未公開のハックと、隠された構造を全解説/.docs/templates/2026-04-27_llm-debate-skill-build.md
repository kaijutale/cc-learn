---
feature: llm-debate-skill-build
session: 未設定
date: 2026-04-27 18:32:26
---

# llm-debate skill 構築 (記事ロードマップ⑥到達、関心の分離原則による再構築)

## 概要

note 記事 (まさお氏) のサブエージェント活用ロードマップ⑥「LLM Debate 応用」がかもねのハーネスにおける唯一の未到達段階だったため、`~/.claude/skills/llm-debate/` を新設して⑥到達を達成。本セッションは 1 日内に 2 段階の実装を経た:

- 段階 1 (午前): Plan workflow 経由で 5 体構成 (PM 含めず) を確定 → 6 skill 新規作成 (既存 team-* を流用、subagent: team-{role} 指定) → V1 ドライラン成功
- 段階 2 (午後): かもねの「使い回すのはダメ、関心の分離で衝突を防ぐのが合理的」指摘で初版設計を撤回 → llm-debater-* 5 体を新規作成 → 6 skill の subagent: 書換と本文の役割上書き記述削減 → memory に撤回ログ追記

朝に作成済の `2026-04-27_llm-debate-skill-decision.md` (案 B 確定の意思決定記録) の続編としての実装ログ。

## 実装内容

### 段階 1: 6 skill 新規作成 (午前)

6 ファイル新規作成:
- `~/.claude/skills/llm-debate/SKILL.md` (master、context:fork なし、Lead 自身のコンテキストで動作、5 sub-skill 並列起動 + Lead 統合判断)
- `~/.claude/skills/llm-debate-{ui-designer,implementer,tester,reviewer,documenter}/SKILL.md` (sub × 5、各 `context: fork` + `subagent: team-{role}`)

各 sub-skill の構造:
- !構文で議題ファイル `.docs/debate/CURRENT/topic.md` を決定論的注入
- !pwd で PARENT_CWD 注入 (cwd 継承対策の Layer 1)
- Step 0: 作業ディレクトリ固定の cd 指示 (Layer 2)
- Step 1-4: 議題理解 → 5 観点批判的分析 → 結論 → 反例
- 出力フォーマット: 構造化テキスト (`[{Role} Analysis]` ヘッダー + 観点別評価 + Observability)

V1 ドライラン (`Skill(llm-debate)` 起動): フォールバック表示確認、!構文 (date/pwd/cat/ls) 全て展開成功。

### 段階 2: 関心の分離による再構築 (午後)

#### agent 5 体新規作成 (`~/.claude/agents/llm-debater-*.md`、Apr 27 18:14-18:17)

debating-roles の `debater-*.md` (teammate mode 用) を参考にしつつ、subagent mode 用に再構築:
- `model: opus` 固定
- `tools:` から Edit/Write 除外で構造的に書込不能
- `skills:` に対応する判断辞書をプリロード:
  - `llm-debater-implementer` → `narrowing-implementation-scope`
  - `llm-debater-tester` → `deriving-test-from-spec` (「実装コード読まない」原則継承)
  - `llm-debater-reviewer` → `judging-review-severity` (反インフレ原則継承)
  - `llm-debater-documenter` → `generating-doc-from-diff` + `logging-implementation` (「推測禁止」原則継承)
  - `llm-debater-ui-designer` → `injecting-ui-aesthetic` + `designing-beautiful-frontends` (「中央値禁止」「抽象語禁止」原則継承)
- 評価観点 5 項目と出力フォーマットを agent 定義側に確定 (skill 本文から移植)
- 「やらないこと」リストで他 5 体との責務分離を明示

#### 5 sub-skill 改修 (Apr 27 18:19-18:22)

各 sub-skill に対して以下の変更:
- `subagent: team-{role}` → `subagent: llm-debater-{role}` (frontmatter)
- 本文中の `team-{role}` 言及を全て `llm-debater-{role}` に replace_all
- 「## 指示 (team-{role} への責務上書き)」セクションを「## 指示 (llm-debater-{role} への議題提示)」に書換
- 役割上書き宣言段落 (「あなたは team-X agent ですが、本 skill での起動は批評です...」) を削除し、簡潔な「議題提示」記述に置き換え
- Gotchas の「役割上書きの徹底」項目を削除
- Gotchas の「Edit/Write を持つが本 skill では使わない」を「Edit/Write 非付与で構造的に書込不能」(agent 側で除外済) に変更
- Gotchas に「既存 team-{role}.md (本来責務) との別レイヤー」項目を追加して棲み分け明文化

#### master skill 改修 (Apr 27 18:23)

`~/.claude/skills/llm-debate/SKILL.md` の team-* 言及 6 箇所のうち 4 箇所を更新:
- `subagent: team-{role}` 言及 (line 21) → `subagent: llm-debater-{role}`
- `team-* 5 体それぞれが固有の判断辞書` (line 24) → `llm-debater-* 5 体それぞれが`
- 「関心の分離 (SoC) 原則による agent 新規作成」項目を line 24 の直後に追加 (新設計の根拠を明示)
- `team-reviewer の核心原則を Lead 視点で再適用` (line 85) → `llm-debater-reviewer の核心原則を`
- Gotchas 末尾の `team-* 各 agent の判断辞書プリロード` → `llm-debater-* 各 agent の`

残した 2 箇所 (意図的に保持):
- TDD pattern C 説明 (`coder → red-test-fork → team-tester → Skill: llm-debate`) は既存構造の説明
- `coder/team-* の階層内で nested 起動可能` は既存 TDD orchestrator 階層の説明

#### memory 更新 (`feedback_multi-agent-debate-design.md`)

- description 改訂: 「llm-debater-*.md 新規作成」「既存 team-* と完全に責務分離」「両者とも debate 専任 agent を新規作成して既存 team-*.md (実装パイプライン用) と影響隔離」を明記
- 本文末尾の「2026-04-27 追加」セクションを 2 度更新:
  - 「採用した設計」: 段階 2 の最終形 (skill 6 + agent 5 = 計 11 ファイル新規作成、既存 team-* 無変更) を反映
  - 「役割上書きパターンの撤回」: 初版採用 → 撤回理由 → 最終設計 → 教訓の流れで記録

## 設計意図

### なぜ段階 1 で「既存 team-* 流用」を最初に選んだか

Plan workflow Phase 4 で Plan ファイルにまとめた最大利点は「**追加するのは SKILL.md 6 個のみ、agent 定義は変更ゼロ**」だった。これは Phase 3 (debating-roles) で確立した「共有 agent definition の改修パターン = 新規作成で影響隔離」の **裏返しの応用**:

- debating-roles のとき: teammate mode 用に agent 改修が必要 → 既存 team-* を改修すると subagent mode (他 3 skill) に副作用 → だから debater-* を新規作成
- llm-debate のとき (初版): subagent mode 用なら team-* がそのまま使える → だから agent 新規作成不要 → 6 skill 増だけで済む

ただし agent 本来責務 (team-implementer = 実装専任) と llm-debate での用途 (批評) のズレを skill 本文の「## 指示」セクションで明示的に上書きする設計だった。

### なぜ段階 2 で撤回したか

かもねが具体的に指摘した内容: 「現状はマルチエージェント協調 (3 skill) で使用してる各専門エージェントを llm-debate/SKILL.md で使い回しちゃってる状態だよね？」「使い回すのはダメだな、関心の分離で衝突を防ぐのが合理的」

この指摘で再認識したこと:
1. team-implementer の agent 定義は「実装専任、批評しない」と明記 → 同じ agent に毎回「批評しろ」と上書きする設計は、agent Identity との確率的競合
2. Phase 3 で「**spawn prompt 側の強制だけでは不十分、agent definition 側の改修が決定的要因**」と実証済の原則に反する
3. 5-Role Separation の「責務の単一化」原則に反する (team-implementer が「実装」と「批評」の 2 用途を兼任することになる)
4. 共有 agent definition の改修問題が将来再発する (片方の用途で改修すると他方に副作用)

つまり初版は「動作は確認できた」(V1 成功) が「構造的に脆弱」だった。これは CLAUDE.md の Critical Thinking 原則「動く ≠ 最善」の典型例。

### なぜ段階 2 で「llm-debater-* 新規作成」を選んだか

debating-roles の `debater-*.md` 新規作成と完全に対称な設計を採用:

| 観点 | debating-roles (Agent Teams版) | llm-debate (本セッション、最終形) |
|---|---|---|
| 既存 team-* | 無変更 (3 skill 専用) | 無変更 (3 skill 専用) |
| 新規作成 agent | `debater-{6体}.md` (teammate mode 用) | `llm-debater-{5体}.md` (subagent mode 用) |
| 改修パターン | Phase 3 で確立 | Phase 3 を踏襲 |
| 影響隔離 | 達成 | 達成 |

両系統で「既存 team-* と debate 専任 agent の完全分離」が貫徹され、責務分離原則が一貫した。

### なぜ役割上書きの記述を skill 本文から削減したか

agent 定義側で「議題批評専任、Edit/Write 非付与」が確定したため、skill 本文で同じ趣旨を再記述するのは:
- 冗長 (DRY 原則違反)
- 責務の真実が agent 側にあるのか skill 側にあるのか曖昧化
- 将来 agent を改修した時に skill 本文と乖離する技術負債化リスク

team-documenter の核心原則「推測禁止」に従えば、責務の単一の真実 (single source of truth) を agent 定義側に置くのが正しい。

## 副作用

### Plan ファイルとの乖離 (要 archive 時補記)

`~/.claude/plans/team-pm-agile-rainbow.md` は段階 1 時点 (午前) の Plan で「既存 team-*.md 5 体を変更ゼロで再利用」を最大利点として記述している。最終実装 (段階 2) はこれを撤回しているため、Plan archive 処理時に「Plan 内容と実装の乖離」を補記する必要がある。

### V1-V4 動作検証は次セッション持ち越し

段階 1 で V1 ドライラン (旧設計) は成功確認済だが、段階 2 (llm-debater-* 経由) での V1 再実施および V2-V4 は未実施。

- V1 (master skill 単体ドライラン): 議題未配置時のフォールバック動作確認
- V2 (1 sub-skill 単体起動): `Skill(llm-debate-implementer)` 直接起動、llm-debater-implementer agent の戻り値確認
- V3 (5 並列起動 + Lead 統合判断): `.docs/debate/CURRENT/topic.md` 配置 + `Skill(llm-debate)` 起動
- V4 (パターン B): coder agent から nested 起動 (公式 grayzone)

### コミット未実施

- `~/.claude/skills/`, `~/.claude/agents/`, memory: git 管理外 or 手動 git push 必要
- 本プロジェクト未コミット 2 ファイル: `2026-04-27_llm-debate-skill-decision.md` (朝のログ)、本ファイル
- handoff-state.md (M)

### `debating-roles` (Agent Teams版) との機能重複

5 体構成選択時から承知済。棲み分けは「context:fork (nested 起動可) vs Agent Teams (Lead からのみ)」のインフラ差のみ。両系統を意図的に併存運用。

### subagent → Skill 呼出の公式 grayzone 依存

memory `feedback_skill-fork-asymmetry.md` 参照。Claude Code バージョン更新時に挙動が変わる可能性あり、要再検証。

### code-reviewer 未実施

agent 5 体新規作成 + skill 6 ファイル改修で 50 行以上 / 3 ファイル以上の自発発火閾値超過。code-reviewer agent でフレッシュレビュー推奨だが本セッションでは未実施。

## 関連ファイル

### 本セッションで新規作成 (12 ファイル)

- `~/.claude/agents/llm-debater-implementer.md` — 議題への実装視点での批判的分析専任、`narrowing-implementation-scope` プリロード、color: blue
- `~/.claude/agents/llm-debater-tester.md` — テスト/検証視点専任、「実装コード読まない」原則継承、color: red
- `~/.claude/agents/llm-debater-reviewer.md` — severity 判定専任、反インフレ原則継承、color: yellow
- `~/.claude/agents/llm-debater-documenter.md` — ドキュメント視点専任、「推測禁止」原則継承、color: green
- `~/.claude/agents/llm-debater-ui-designer.md` — UI/UX・美学視点専任、「中央値禁止」「抽象語禁止」原則継承、color: magenta
- `~/.claude/skills/llm-debate/SKILL.md` — master、context:fork なし、5 sub-skill 並列起動 + Lead 統合判断
- `~/.claude/skills/llm-debate-implementer/SKILL.md` — sub、`subagent: llm-debater-implementer`
- `~/.claude/skills/llm-debate-tester/SKILL.md` — sub、`subagent: llm-debater-tester`
- `~/.claude/skills/llm-debate-reviewer/SKILL.md` — sub、`subagent: llm-debater-reviewer`
- `~/.claude/skills/llm-debate-documenter/SKILL.md` — sub、`subagent: llm-debater-documenter`
- `~/.claude/skills/llm-debate-ui-designer/SKILL.md` — sub、`subagent: llm-debater-ui-designer`
- `~/.claude/plans/team-pm-agile-rainbow.md` — Plan ファイル (段階 1 で承認、段階 2 で内容と実装が乖離)

### 本セッションで更新

- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_multi-agent-debate-design.md` — description 改訂 + 本文末尾セクション 2 度追記
- `.claude/handoff-state.md` — 段階 1 終了時 + 段階 2 終了時の 2 度更新

### 関連 (本セッション参照、変更なし)

- `~/.claude/agents/team-{ui-designer,implementer,tester,reviewer,documenter,pm}.md` — 既存 team-* 6 体、本セッション一切無変更 (タイムスタンプ Apr 13-26 のまま)
- `~/.claude/agents/coder.md` — TDD 戦術オーケストレーター
- `~/.claude/agents/debater-{ui-designer,implementer,tester,reviewer,documenter,pm}.md` — Agent Teams版 6 体、llm-debater-* 設計時のテンプレ参考
- `~/.claude/skills/{red-test-fork,implement-fork,verify-test-fork}/SKILL.md` — 写経元の context:fork パターン
- `~/.claude/skills/debating-roles/SKILL.md` — Agent Teams 版、併存運用
- `.docs/templates/2026-04-27_debating-roles-godification-tradeoff.md` — 朝の評価ログ (commit済 f93baf5)
- `.docs/templates/2026-04-27_llm-debate-skill-decision.md` — 朝の意思決定ログ (未コミット、本ログの前段階)
- `.docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf` — 記事原典 (47 ページ、ロードマップ⑥は p.36-39)

### 関連 memory

- `feedback_multi-agent-debate-design.md` — 本セッションで更新済、本実装の判断履歴
- `feedback_skill-fork-asymmetry.md` — 2 層防御パターン、grayzone 知見
- `feedback_disable-model-invocation-blocks-skill-tool.md` — frontmatter 罠回避
- `feedback_claude-opus-only-for-multi-agent.md` — 全員 Opus 固定原則
