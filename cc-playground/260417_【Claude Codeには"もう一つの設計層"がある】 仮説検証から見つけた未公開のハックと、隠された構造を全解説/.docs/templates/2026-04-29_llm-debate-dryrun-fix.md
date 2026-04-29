---
feature: llm-debate-dryrun-fix
session: Session 7 (Phase 1 ドライラン + permission policy 対応 + 擬似コード矛盾解消)
date: 2026-04-29 20:02:30
---

# llm-debate ドライラン経由の sandbox / permission / 擬似コード矛盾の連鎖修正

## 概要

Phase 1 (commit `f1db7fd`) で coder agent に組み込んだ llm-debate skill を、本セッションで **note 原典の正規パス (Skill 経由 + context:fork + subagent:)** で動作確認した。動作確認の連鎖で 3 種類の重大な不整合が発覚し、すべて修正完了。

note 記事「Claude Code には "もう一つの設計層" がある」(まさお氏、2026-03-21、47ページ) を全文読了し、Anthropic の Unix哲学的設計思想と「Agent ツール直呼び不可・Skill 経由が孫起動の唯一のバイパス経路」という制約を理解した上での修正セッション。

## 実装内容

### 修正 1: master SKILL.md line 43 削除 (sandbox 違反対応)

`~/.claude/skills/llm-debate/SKILL.md` line 42-43 の「debating-roles 既存スキル状態」セクションを削除。

```diff
- ### debating-roles 既存スキル状態 (棲み分け確認用)
- !`ls -la ~/.claude/skills/debating-roles/SKILL.md 2>/dev/null && echo "[併存運用中]" || echo "[未導入]"`
```

`~/.claude/` は session sandbox の cwd 配下にないため permission block。全 63 skill 中ただ 1 件の異常値だった。

### 修正 2: 5 sub-skill SKILL.md の ! 構文書き換え (permission policy 対応)

| sub-skill | 修正前 | 修正後 |
|---|---|---|
| llm-debate-implementer | `find src ... -exec echo / -exec cat` | `find src ... 2>/dev/null` (リストのみ) |
| llm-debate-tester | `find .docs/specs ... -exec echo / -exec cat` | `find .docs/specs ... 2>/dev/null` (リストのみ) |
| llm-debate-reviewer | `git --no-pager diff --stat HEAD~5..HEAD` | `git diff --stat HEAD~5..HEAD` |
| llm-debate-reviewer | `git --no-pager log --oneline -10` | `git log --oneline -10` |
| llm-debate-documenter | `git --no-pager log --oneline -20` | `git log --oneline -20` |
| llm-debate-ui-designer | `find .docs/designs -name "aesthetic.md" -exec echo / -exec cat` | `find .docs/designs -name "aesthetic.md" 2>/dev/null` (リストのみ) |

`find -exec` は複合操作扱いで block、`git --no-pager` は multi-op として block。修正により 5/5 動作実証 (Skill 正規経路、各 14-40 秒で完走)。

### 修正 3: coder.md Step 5 擬似コード矛盾の解消

5 視点議論で Reviewer 視点が指摘した Critical 問題を反映:

```diff
- "lead_summary": debate_guidance.lead_summary,
+ "lead_text_excerpt": debate_guidance[:200],  # 先頭200文字、全文は BACKUP に保存推奨
```

`debate_guidance` は **Markdown テキスト** (構造化Markdown) であり、属性アクセス記法 (`.lead_summary`) は構造的に不可能だった。文字列スライスに変更。

### 修正 4: coder.md Gotchas に4項目追記

- `debate_guidance` は Markdown テキスト (属性アクセス不可、必要なら正規表現で抽出)
- 🔴 / ⚪ 結論時のフェイルセーフ (Phase 2 で実装、Phase 1 は擬似コード化未対応)
- 戻り値全文の BACKUP 保存推奨 (`.docs/debate/BACKUP/response-{feature}-loop{N}.md`)
- (既存) Phase 1 最小実装スコープ

### 動作実証

メインClaude → `Skill("llm-debate")` → master skill 内で `Skill("llm-debate-*")` 5 回呼出 が **全成立**:

| sub-skill | 動作 | duration |
|---|---|---|
| llm-debate-implementer | ✅ | 38 秒 |
| llm-debate-tester | ✅ | 23 秒 |
| llm-debate-reviewer | ✅ | 40 秒 |
| llm-debate-documenter | ✅ | 21 秒 |
| llm-debate-ui-designer | ✅ | 14 秒 |

Phase 1 の核心要件「note 原典 Skill 経由パス (パターンA) で 5並列議論成立」を完全達成。

## 設計意図

### なぜ Skill 経由 (note 原典) を維持したか

Agent ツールはサブエージェント環境にハードコード制約で渡されない (note記事に明記)。`tools:` に `Agent` と書いても無効。**Skill 経由の context:fork + subagent: が孫起動の唯一のバイパス経路**。coder agent (subagent) から llm-debate を呼ぶには、この経路しかない。

セッション中盤で「メインClaude から Agent 経由で 5 subagent を直接起動」というハック的経路が動作したが、これは note 原典の設計と異なり、subagent 環境では使えない経路だった。最終的に **5 sub-skill SKILL.md の ! 構文を permission policy 適合形に書き換える** ことで note 原典の正規経路を成立させた。

### なぜファイルリストのみ取得に変えたか

`find -exec echo / -exec cat` で全ソースを ! 注入する設計は、permission policy への依存度が高く脆弱。「ファイルリストのみ取得 → agent が必要に応じて Read tool で個別読込」に変えることで:

1. permission block を構造的に回避
2. agent の自律性を尊重 (note 記事「skills:プリロードで動的コンテキストを制御」原則)
3. 大量の ! 注入によるコンテキスト圧迫を回避

各 agent は frontmatter で Read tool を持っているため機能的損失はない。

### なぜ擬似コード矛盾を Phase 1 で修正したか

Phase 1 ドライランで Reviewer 視点が能動検出した問題で、Phase 2 評価実行前に修正しないと **calc 不能** になる類の Critical 不整合。`debate_guidance.lead_summary` のような属性アクセスは LLM (coder 役) が読んで「文字列に対する属性アクセス」と解釈し失敗する可能性があった。

### なぜ Session 7 を独立ログにしたか

logging-implementation skill の指示「実装が完了した時 → ログ作成」に厳密準拠。既存ログ `2026-04-29_coder-llm-debate-integration.md` には Phase 1 全体経緯 + Session 7 経過が追記済だが、Session 7 単独で読める **サマリログ** として独立化。frontmatter 必須項目 (feature / session / date) と H2 5セクションを満たす形で記録。

## 副作用

### マルチエージェント協調 skill 群への影響

3 skill (three-elements-harness / orchestrating-team-development / enforcing-strict-tdd-cycle) への影響を実測で確認した結果、**完全に非破壊的**:

| シンボル | coder.md 内部参照 | 外部 skill 参照 |
|---|---|---|
| `lead_summary` (修正前) / `lead_text_excerpt` (修正後) | あり | 0 件 |
| `debate_impact` | あり | 0 件 |
| `debate_count` | あり | 0 件 |

3 skill が依存するのは coder の **外部インターフェース** (Agent 起動方法 + `[Coder Cycle Complete]` レポート形式) のみ。今回の修正は **内部詳細** に閉じる。

### 残る Open Questions (Phase 2 で確定)

1. `extract_lead_section()` パーサ実装 (Markdown 正規表現抽出)
2. 🔴 / ⚪ 結論時のフェイルセーフ実装
3. `last_adjust_diff_significant()` の数値定義 (Jaccard 距離 > 0.5 等)
4. コンテキスト累積上限 (1回 2000 token / 累積 4000 token 等)
5. 抽出失敗時のフォールバック (BACKUP 全文保存 + warn 出力)

### 反インフレ原則の二重発動

- 1回目議論 (Session 7 前半): わたしの提案修正案2つ (Agent ツール経由・coder.md tools 拡張) を **note 原典熟読で却下** = 設計違反検出
- 2回目議論 (Session 7 後半): Reviewer 視点が **議題自体の擬似コード矛盾** を能動検出 = 自己整合性検出

note 記事の「Reviewer の反インフレ原則」が実装され機能したことを実証。

## 関連ファイル

### 修正ファイル (~/.claude/ 配下、git 管理外)

- `~/.claude/skills/llm-debate/SKILL.md` — line 42-43 削除 (sandbox 違反対応)
- `~/.claude/skills/llm-debate-implementer/SKILL.md` — find -exec → ファイルリスト
- `~/.claude/skills/llm-debate-tester/SKILL.md` — find -exec → ファイルリスト
- `~/.claude/skills/llm-debate-reviewer/SKILL.md` — git --no-pager → git (2 箇所)
- `~/.claude/skills/llm-debate-documenter/SKILL.md` — git --no-pager → git
- `~/.claude/skills/llm-debate-ui-designer/SKILL.md` — find -exec → ファイルリスト
- `~/.claude/agents/coder.md` — Step 5 擬似コード修正 + Gotchas 4項目追記

### 修正ファイル (git 管理対象)

- `.docs/templates/2026-04-29_coder-llm-debate-integration.md` — Session 7 経過追記 (commit `3a9e2ed`、+193 行)

### 関連ファイル (修正なし、参照のみ)

- `.docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf` — note 記事原典、47 ページ全文読了
- `.docs/references/sample/.claude/agents/` — まさお氏ハーネスサンプル、3 agents (coder / implementer / tester)
- `.docs/references/sample/.claude/skills/` — まさお氏ハーネスサンプル、4 skills (red-test / implement / verify-test / llm-debate)
- `.docs/debate/CURRENT/topic.md` — Session 7 検証議題 (Phase 1 Open Question #1)
- `.docs/debate/BACKUP/topic-V3-test-tdd-cycle-validation-pre-phase1-dryrun.md` — Session 7 で BACKUP 退避した旧議題

### 関連 commit

- `f1db7fd` — Phase 1 初版実装 (Session 6 後半)
- `3a9e2ed` — Session 7 経過追記 (本セッション)

### 関連メモリ (CLAUDE.md auto memory)

- `feedback_skill-fork-asymmetry.md` — fork skill の cwd 継承対策 (Session 7 で活用)
- `feedback_disable-model-invocation-blocks-skill-tool.md` — Skill ツール呼出阻害要因 (Session 7 で再確認)
- `feedback_multi-agent-debate-design.md` — 役割分離による視点独立性 (Session 7 議論で実証)
- `feedback_logging-implementation-scope.md` — 学習・知識整理も logging 対象 (本ログがそれに該当)
