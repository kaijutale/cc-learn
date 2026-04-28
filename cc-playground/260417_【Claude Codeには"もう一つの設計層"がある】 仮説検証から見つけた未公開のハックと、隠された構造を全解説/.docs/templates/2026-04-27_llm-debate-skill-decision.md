---
feature: llm-debate-skill-decision
session: 未設定
date: 2026-04-27 14:47:58
---

# 神化版 llm-debate skill 新設の実装決定

## 概要

朝のログ (`2026-04-27_debating-roles-godification-tradeoff.md`) で発見した「神化観点の未検討」を踏まえ、追加で記事PDF (47ページ全文) の精読と用語整理を実施。その結果、過去判断の前提自体が誤っていたことが判明し、案B (`~/.claude/skills/llm-debate/SKILL.md` 新規作成、神化版併設) の実装を確定。実装そのものは次セッションに持ち越し (handoff-state.md 更新済)。

## 実装内容

実装ではなく、議論・調査・意思決定の記録。具体的な作業:

### 1. 用語誤認の訂正 (3つ)

朝のログ作成時点で残っていた認識のズレを順次訂正:

- **誤認1: 「Agent Teams で実装した skill」という表現**
  - 訂正前: 実装言語/フレームワーク的な比喩で使用
  - 訂正後: 「**Agent Teams 機能を使う設計の skill**」「**Agent Teams 専用 tool に依存する skill**」
  - 根拠: skill の本体は常に SKILL.md (Markdown) であり、Agent Teams は環境変数フラグ (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) で有効化される実行モード

- **誤認2: 「note記事 = Agent Teams 前提」という思い込み**
  - 訂正前: かもね・わたし両者ともこの前提で過去議論していた
  - 訂正後: 記事のメインテーマは `context:fork + Skills` (PDF p.3 副題で確認: 「【Claude Code】context:forkとSkillsで多段サブエージェント構築」)
  - 影響: 過去の設計判断 (Agent Teams 採用) が記事の主流路線とは独立した別系統だったことが判明

- **誤認3: 「オーケストレーター = メインClaude」のマッピング**
  - 訂正前: 記事の図の「オーケストレーター」をメインClaude と解釈
  - 訂正後: **「オーケストレーター」 = `coder.md`** (記事 p.40 で「coderオーケストレーター」と明記)、「サブエージェント」 = `team-*` 5体
  - 根拠: 記事のロードマップ ⑤TDD応用 → ⑥LLM Debate応用 の並列構造、図は coder + team-* 階層に閉じた図解
  - 用語の二重使用 (広義: 統括主体全般 / 狭義: coder agent) を見抜けていなかった

### 2. 記事ロードマップとの到達度確認

記事末尾の「サブエージェント活用ロードマップ」(6段階):

```
①!コマンド構文 → ②プリロード → ③context:fork → ④孫エージェント → ⑤TDD応用 → ⑥LLM Debate応用
```

かもねの到達度:
- ①〜⑤: 到達済 (`enforcing-strict-tdd-cycle` が⑤、`coder.md` + `team-*` 5体)
- ⑥: **未到達** (= 案B が記事ロードマップの最終段階)

### 3. 案B 実装方針の確定

新規作成する skill の仕様確定:

- **ファイル**: `~/.claude/skills/llm-debate/SKILL.md` (1ファイル新規作成)
- **frontmatter**: `context: fork` 必須、`subagent:` には既存 `team-*` 5体を流用 (新規 agent 定義不要)
- **役割数**: 5体 (ui-designer/implementer/tester/reviewer/documenter)、`team-pm` を含めるか要検討
- **モデル**: 全員 Claude Opus 固定 (memory `feedback_claude-opus-only-for-multi-agent.md` 準拠)
- **disable-model-invocation: true は付けない** (memory `feedback_disable-model-invocation-blocks-skill-tool.md` 準拠)
- **description マッチ自動誘発防止**: 文言で行う (「明示呼出専用」明記、誘発語を書かない)
- **統合判断**: skill 内 fork 先の Claude Opus が最終判断

### 4. 接続パターンの確定

記事のパターンA/B + 派生パターンC を整理:

- **パターンA**: メインClaude → Skill: llm-debate (直接呼出)
- **パターンB**: メインClaude → Agent: coder → Skill: llm-debate (オーケストレーター=coderから呼出、記事の主用途)
- **パターンC** (任意、grayzone): メインClaude → Agent: coder → Skill: red-test-fork → team-tester → Skill: llm-debate (孫から呼出)

### 5. handoff state 更新

セッション終了時に `.claude/handoff-state.md` を更新済 (Session 5 → 本セッションへ):
- 案B 実装が次セッション最優先タスクとして記録
- 必要な memory 参照を全リンク化
- 別作業の未コミット 3 グループ (CLAUDE.md / team-messages / test-tdd-cycle-validation) を「本セッション範囲外」と明示

## 設計意図

### なぜ案B (神化版併設) を選んだか

判断軸の変遷:

1. **handoff直前の判断**: 前段階では「保留 (案A継続)」を推奨していた。理由は「具体的ユースケース未発生」「既存 debating-roles の質的資産を捨てない」
2. **記事の真のテーマ判明後**: PDF p.3 副題で `context:fork + Skills` が記事の中心と判明。かもねのハーネスは記事と別系統に進化していた事実が浮上
3. **最終判断**: 記事ロードマップ ⑥ が未到達という構造的事実を重視。**「困っていない」より「記事の核心思想を実装に取り込めていない」が決定要因**

### なぜ既存 debating-roles を捨てないか

- Phase 3 改修で SendMessage 使用率 1/6 → 5/6 に改善した実証済資産がある (Session 5)
- Agent Teams (mailbox actor) の視点独立性は `context:fork` 内では再現できない
- 用途の使い分け:
  - `debating-roles` (Agent Teams): Lead 直下から並列議論で SendMessage actor 通信を活かしたい場面
  - `llm-debate` (context:fork): coder/team-* の階層内で nested 起動したい場面

### 既存資産の最大活用

新 skill は以下を**変更なしで再利用**:

- `team-*` 5体 (ui-designer/implementer/tester/reviewer/documenter)
- `coder.md` (TDD戦術オーケストレーター)
- `red-test-fork`/`implement-fork`/`verify-test-fork` (実装パターン参照)

つまり**追加するのは SKILL.md 1ファイルのみ**で記事の⑥に到達できる構造になっている。これは Phase 3 改修で「共有 agent definition の改修パターン = 新規作成で影響隔離」を確立した副産物 (memory `feedback_multi-agent-debate-design.md` line 49)。

## 副作用

### 次セッションへの委譲

実装そのものは本セッションで実施せず、handoff-state.md 経由で次セッションに移譲。理由:
- セッション後半で深い理解が連続して発生し、実装に着手するには文脈整理優先と判断
- 設計判断が確定した直後に実装に入るとミスが起きやすい (「冷えた状態」での再確認が望ましい)

### 既知のリスク

- **公式grayzone 依存**: subagent から Skill 呼出は公式docsで「使えない」と記載、実動作では成功する未保証領域 (memory `feedback_skill-fork-asymmetry.md`)
- **バージョン依存**: Claude Code バージョン更新時に挙動が変わる可能性、要再検証
- **`skipAutoPermissionPrompt: true` の罠**: 設定されていると allow 外コマンドが permission prompt を出せず block される
- **!構文の決定論的展開**: cwd・環境変数の継承確認が必要
- **記事と同じ多段連鎖パターン (`coder→skill→fork→tester`)**: 公式想定外、本番運用時はバージョン固定とフォールバック設計を検討

### 用語整理の認識更新

朝のログ (`godification-tradeoff.md`) の「設計意図 → 設計の最適化軸が直交していた」セクションは、本セッション後半の認識更新で部分的に古くなった:

- 朝のログ: 「Agent Teams 採用は質を優先した正しい判断」と評価
- 今回の更新: それは依然として正しいが、**「記事と別系統に進化した」事実**は朝の時点で見抜けていなかった
- 対応: 朝のログを書き換えず、本ログで認識更新を記録 (logging-implementation の「過去のスナップショット保持」原則)

## 関連ファイル

- `.docs/templates/2026-04-27_debating-roles-godification-tradeoff.md` — 朝のログ、本ログの前段階
- `.docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf` — 記事原典 (47ページ、p.3 副題でメインテーマ判明)
- `.claude/handoff-state.md` — 次セッション最優先タスクとして案B実装を記録
- `~/.claude/skills/debating-roles/SKILL.md` — 既存 Agent Teams 版 (本ログの判断で捨てずに併存運用確定)
- `~/.claude/agents/coder.md` — 図の「オーケストレーター」位置、案B のパターンB 主用途
- `~/.claude/agents/team-{ui-designer,implementer,tester,reviewer,documenter}.md` — 新skill で再利用 (変更なし)
- `~/.claude/skills/{red-test-fork,implement-fork,verify-test-fork}/SKILL.md` — 既存 context:fork skill (新skill 実装時の参照パターン)
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — 記事ロードマップ⑤の実装、構造参照
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_multi-agent-debate-design.md` — debate設計判断履歴 (次セッションで「神化版併設の判断」追記予定)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_skill-fork-asymmetry.md` — context:fork grayzone知見
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_claude-opus-only-for-multi-agent.md` — 全員Opus固定原則
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_disable-model-invocation-blocks-skill-tool.md` — frontmatter設定の罠
- コミット `f93baf5` — 朝のログ (godification-tradeoff) のpush済コミット
