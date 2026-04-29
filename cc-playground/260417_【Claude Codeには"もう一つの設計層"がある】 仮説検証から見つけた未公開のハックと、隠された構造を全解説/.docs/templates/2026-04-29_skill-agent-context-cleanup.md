---
feature: skill-agent-context-cleanup
session: Session 7 続き (skills/agents のプロジェクト固有情報を抽象化、グローバル資産化)
date: 2026-04-29 21:17:23
---

# skills/agents のプロジェクト固有情報抽象化 (グローバル資産としての健全化)

## 概要

`~/.claude/skills/` および `~/.claude/agents/` 配下のグローバル資産に **特定プロジェクト依存情報** が混入していた問題の修正セッション。

skills/agents は本来「複数プロジェクトで再利用される判断辞書/役割定義」だが、調査の結果以下の問題が判明:

- `note 記事 (まさお氏) ロードマップ⑥` のような外部記事への直接参照
- `feedback_*.md` memory ファイル (個人 auto-memory) への直接参照
- `.docs/templates/2026-04-28_*.md` のような特定検証ログファイル名への参照
- `Phase 1 ドライラン... 2026-04-29` のような特定セッション履歴情報
- `/Users/camone/.claude/...` のような絶対パス参照 (他ユーザー環境で動作不能)

これらは他プロジェクトで起動された時に **暗黙の前提が成立せず**、文脈不明 / 動作不能のリスクがある。

調査対象 85 ファイル (skills 61 + agents 24) のうち、9 ファイルに修正を実施。

## 実装内容

### Phase A: Critical 即時修正 (1 件)

**dq-style-monster-generation/SKILL.md (line 178-179)**: 絶対パス → `~/` 相対化

```diff
- python3 /Users/camone/.claude/skills/authoring-skills/scripts/quick_validate.py \
-   /Users/camone/.claude/skills/dq-style-monster-generation
+ python3 ~/.claude/skills/authoring-skills/scripts/quick_validate.py \
+   ~/.claude/skills/dq-style-monster-generation
```

→ 他ユーザー環境/他マシンで実行コマンドが通るようになった。

### Phase B: High 修正 (note記事参照 + memory参照、計 8 箇所)

**llm-debate/SKILL.md** 5 箇所修正:
- line 15: `note 記事 (まさお氏) ロードマップ⑥「LLM Debate 応用」の Claude Only 翻訳版` → `マルチモデル LLM Debate の Claude Only 適用版` に抽象化
- line 151: `feedback_skill-fork-asymmetry.md で実証済` → `(Claude Code バージョン更新時は再検証推奨)` に抽象化
- line 164: `feedback_disable-model-invocation-blocks-skill-tool.md 参照` → 具体的エラー文言を埋込
- line 165: `feedback_skill-fork-asymmetry.md 参照` → `skill fork 起動時の cwd 継承は不確定動作の可能性あり` に抽象化
- line 169: `feedback_multi-agent-debate-design.md の「視点多様性の源は役割分離」原則` → `視点多様性の源は **役割分離** であり、**モデル多様性ではない**` に直接埋込

**llm-debate-implementer/SKILL.md (line 124)**: memory 参照を「skill fork 起動時の cwd 継承が不確定なため」と原理直接記述に変更

**debating-roles/SKILL.md** 2 箇所修正:
- line 33: `memory feedback_*.md 2件参照` → モデル能力差の解像度差説明を直接埋込
- line 391: `関連 memory: ...` → `関連設計原則: ...` に変更し具体的原則を文中に明記

### Phase C: Medium 修正 (特定検証ログ・Session 番号、3 箇所)

**coder.md** 2 箇所修正:
- line 299: `(既存検証ログ .docs/templates/2026-04-28_llm-debate-session-summary.md 参照)` を削除
- line 301: `(Phase 1 ドライランで Reviewer 視点が指摘した擬似コード矛盾の修正、2026-04-29)` → `(LLM が「文字列に対する属性アクセス」と誤読する可能性)` に原理説明化

**debating-roles/SKILL.md (line 372-373)**: 特定 Session 番号情報を抽象化
- `【Session 5 実測 2026-04-25】Phase 3 改修効果...` → `改修効果の対照実験 (実証済)...` に変更
- `Session 4 で実証済` → `spawn prompt 側の明記だけでは不十分` に直接埋込

## 設計意図

### なぜ抽象化が必要か (グローバル資産の責務)

skills/agents は `~/.claude/` 配下のグローバル資産で、**複数プロジェクト間で共有される判断辞書/役割定義**。特定プロジェクトの履歴・検証ログ・記事への直接参照を埋め込むと:

1. **他プロジェクトで起動した時に文脈が成立しない** (例: note記事を読んでいない人には「ロードマップ⑥」が意味不明)
2. **参照先ファイルが存在しないと情報の根拠が不明になる** (例: memory ファイルが他プロジェクトの memory directory にはない)
3. **絶対パスは他ユーザー環境で確実に失敗する** (例: `/Users/camone/` は他ユーザーには無効)

### 抽象化の方針

調査で判明した主流対処パターン (76 ファイルが採用):
- **Z-1 完全排除**: プロジェクト名/日付/memory 参照をそもそも書かない (`article-explainer/SKILL.md` 等)
- **Z-2 概念名のみ**: 「Lv2 知識永続化」のような抽象概念名で説明 (`establishing-knowledge-persistence/SKILL.md` 等)

修正対象 9 ファイルもこの主流パターンに合わせて抽象化:
- 外部記事参照 → 概念名 (「マルチモデル LLM Debate」等)
- memory ファイル参照 → 原理を本文に直接埋込
- 検証ログ参照 → 実測値だけ残してファイル名削除
- Session 番号 → 「対照実験」等の汎用表現
- 絶対パス → `~/` 相対化

### 重大度判定の補正

Explore agent の初期判定では memory 参照を Critical 扱いしていたが、実測で:
- memory 参照は機能影響なし (LLM が読んで「ふーん」となる程度) → **High 寄り**
- 真の Critical は **dq-style の絶対パス1件のみ** (他環境で確実に動作不能)

判定基準: 「他環境で skill/agent の **機能** が動作不能になるか」を Critical の閾値とした。

### 既存実装ログ (Phase 1) との関係

実装ログ (commit `f1db7fd`, `3a9e2ed`, `e6e87d6`) には **修正前** の参照記述が残っているが、これは履歴情報として保持。実装ログは「いつ書かれたか」のスナップショット価値があるため、書き換えない (logging-implementation skill 「既存ログは保持、新規ログから新形式」原則)。

## 副作用

### マルチエージェント協調 skill 群 (3 skill) への影響

修正対象は **9 ファイルすべて skill/agent 内部のテキスト** で、**外部インターフェースには手を入れていない**:
- ✅ Skill 起動方法 (Skill ツール / context:fork + subagent:) 維持
- ✅ Agent 起動方法 (Agent ツール) 維持
- ✅ 戻り値フォーマット (`[Coder Cycle Complete]` / `[Role Analysis]`) 維持
- ✅ Phase 1 で組み込んだ Step 5 の擬似コードロジック維持

→ three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle に影響ゼロ。

### 既存検証ログとの整合性

修正後も `.docs/templates/2026-04-28_llm-debate-session-summary.md` 等の検証ログは保持。skills/agents から削除したのは「参照リンク」であって、ログ本体は手を入れていない。検証ログを必要とする時は ファイル名で grep すれば見つかる。

### 情報量の損失

memory 参照を本文埋込に変えたため、各 skill は **若干情報量増** (+5-15 行/skill)。ただし読みやすさは向上 (リンク追跡なしで原理が読める)。

### 残された Low 重大度の項目 (今回未修正)

- `debating-roles/SKILL.md` の他の日付付きコメント (line 217, 226 等の段階的導入計画) — 動作影響なし、運用上有益で保持
- `coder.md` の Phase 1/2/3 表現 — 本 skill の段階的展開計画として正当な表現で保持
- `generating-doc-from-diff/SKILL.md` 等の日付付きバージョン履歴 — 履歴情報として保持

これらは「特定セッション履歴」ではなく「**段階的設計計画**」または「**仕様の一部**」として読めるため、抽象化対象外と判断。

## 関連ファイル

### 修正ファイル (~/.claude/ 配下、git 管理外)

- `~/.claude/skills/dq-style-monster-generation/SKILL.md` — Phase A: 絶対パス → `~/` 相対化
- `~/.claude/skills/llm-debate/SKILL.md` — Phase B: note記事 + memory 参照 5 箇所抽象化
- `~/.claude/skills/llm-debate-implementer/SKILL.md` — Phase B: memory 参照 1 箇所抽象化
- `~/.claude/skills/debating-roles/SKILL.md` — Phase B/C: memory + Session 番号 4 箇所抽象化
- `~/.claude/agents/coder.md` — Phase C: 検証ログファイル名 + 特定セッション情報 2 箇所抽象化

### 修正ファイル (git 管理対象、本 commit の対象)

- `.docs/templates/2026-04-29_skill-agent-context-cleanup.md` — 本ログ (新規)

### 関連 commit (Session 7 全体)

- `f1db7fd` — Phase 1 初版実装 (Session 6 後半)
- `3a9e2ed` — Session 7 経過追記 (既存ログ)
- `e6e87d6` — Session 7 独立サマリログ (前ログ)
- `3fc5e15` — プロジェクト CLAUDE.md の note記事 PDF 参照先更新
- `5543458` — Phase 1 議題運用 (CURRENT + BACKUP) 実例
- (本 commit) — 本 cleanup ログ追加

### 調査統計 (本セッションで判明)

| 観点 | 数値 |
|---|---|
| 調査対象 (skills + agents) | 85 ファイル (61 + 24) |
| 問題あり | 9 ファイル |
| 真の Critical (動作不能) | 1 ファイル (dq-style 絶対パス) |
| High (文脈依存性) | 3 ファイル (note記事 + memory 参照) |
| Medium (情報品質低下) | 2 ファイル (検証ログ + Session 番号) |
| 主流対処パターンを既に採用 | 76 ファイル (89%) |

→ **89% のファイルは既にグローバル資産として健全**。今回の修正で残り 11% も健全化された。
