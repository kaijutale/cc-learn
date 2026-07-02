---
date: 2026-07-02 10:36:28
type: qa
topic: automemory-and-typed-memory-4types-qa
session: 未設定
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md
related_skill: [logging, establishing-knowledge-persistence]
related_agent: [claude-code-guide]
related_log_ids: [2026-07-02_k1-typed-memory-4types-harness-recensus, 2026-07-01_k1-typed-memory-4types-harness-audit]
related_log: [2026-07-02_k1-typed-memory-4types-harness-recensus.md, 2026-07-01_k1-typed-memory-4types-harness-audit.md]
---

# autoMemoryEnabled の是非判断 + K-1 型付き記憶4型の機能実態 Q&A

> `autoMemoryEnabled` を true にすべきかの判断 (結論: false 維持) と、note K-1「型付き記憶4型」が実際にどう機能するか (器と中身の二層・型付けの主体・注入スコープ) を5問の対話で解明した記録。

## 概要

かいじゅうが `/model` 設定変更のついでに「autoMemoryEnabled って true にしたほうがいいのか？」と質問。claude-code-guide agent による公式ドキュメント・CHANGELOG 調査と、ハーネス実体の直接確認 (settings.json / `~/.claude/projects/*/memory/` の現物 Read) を組み合わせて回答。そこから note K-1「型付き記憶パターン (4型の永続記憶)」の機能実態へ質問が連鎖し、器 (格納機構) と中身 (型スキーマ) の二層区別、型付けの主体、注入スコープまでを解明した。

## 内容

### Q1: autoMemoryEnabled は true にすべきか？

**A: No。kaiju ハーネスでは `false` 維持が正しい。**

公式ドキュメント調査で確定した機能仕様:

- true にすると Claude が `~/.claude/projects/<プロジェクト>/memory/MEMORY.md` + トピック別ファイルに学習内容を自動記録
- 毎セッション開始時に MEMORY.md の**先頭200行 or 25KB** を自動注入 (トピックファイルはオンデマンド)
- **現在のデフォルトは true (有効)**。記録内容の判定ロジックは非公開、監査は手動のみ
- machine-local (他マシン非共有)。同一リポジトリの全 worktree が同じ memory を共有
- 制御: settings.json `autoMemoryEnabled` (プロジェクト単位可) / 環境変数 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` / セッション中 `/memory`

false 維持の理由4つ:

1. **検証ゲートと衝突**: kaiju ハーネスの知識永続化は「/logging → local/ → 検証後 /promote-log → shared/」「Gotcha は失敗実証後に蓄積」と全て HITL ゲート付き。CLAUDE.md にも「Memory・設定への直接注入禁止」。自動メモリはこのゲートを素通りする
2. **Git 追跡の外に知識が漏れる**: `~/.claude/projects/` はハーネス repo で gitignore 済み (git status に出ないことを確認)。バックアップ・レビュー・バージョン管理の射程外に無音で蓄積する
3. **worktree 共有が並列運用を汚す**: gtr worktree 並列 agent 運用で、あるブランチの誤学習が別ブランチのコンテキストに流入する
4. **固定コンテキスト税**: 大きい CLAUDE.md + rules 群の上に毎セッション最大200行/25KB が無条件で乗る

**重要**: デフォルトが true に変わっているため、settings.json:503 の明示的な `"autoMemoryEnabled": false` が機能を止めている防波堤。この行を消すと無音で有効化される。実験したければサンドボックス PJ の `.claude/settings.local.json` にだけ true を置いて観察する。

### Q2: MEMORY.md は4型のうちの1つ？ 残り3つはどう機能させる？

**A: 前提に修正あり。MEMORY.md + トピックファイルは4型すべてを入れる「器」(格納・読込機構) であって、型の1つではない。**

- **器 (機構)**: `~/.claude/projects/<プロジェクト>/memory/`。MEMORY.md は索引 (1行サマリ + リンク集、型を持たない)、実体は個別トピックファイル
- **中身 (スキーマ)**: 各トピックファイルの frontmatter `type:` の値が4型 (user/feedback/project/reference) の正体。1つの memory ディレクトリに4型が同居する

実物確認: `feedback-grep-before-delete.md` の frontmatter は `name / description / type: feedback / originSessionId` — Claude Code ネイティブの記憶フォーマット (originSessionId は機械の刻印)。kaiju は `autoMemoryEnabled: false` の手動キュレーションで同フォーマットを維持している。

型を分ける軸は**寿命** =「いつ書き、いつ読み、いつ引退させるか」:

| 型 | 書く契機 | 引退の仕方 | kaiju ハーネス実体 (260702 センサス) |
|---|---|---|---|
| feedback | 実際に失敗した時 | スキル進化サイクルで lint/script に昇格→削除 | 5件稼働中 |
| project | タスク状態が変わった時 | タスク完了で削除 | 型付き2件 (+型無し直書き2件) |
| reference | 外部リソースの所在確定時 | リソース無効化で削除 | 1件稼働中 |
| user | ほぼ書かない (不変) | ほぼ引退しない | 0件 — CLAUDE.md/rules へ移設済み (設計判断) |

### Q3: 型の判断は Claude 自身がするもので、かいじゅうが意識するものではない？

**A: 分解して断定 — ラベル付け (書く瞬間の型判定) は Claude の仕事 (意識不要)。棚卸し (寿命管理) は現状かいじゅうが意識しないと誰も回さない (意識するもの)。**

- Claude の領分: 書く瞬間の型判定、フォーマット準拠、オンデマンド読込
- かいじゅうの領分 (HITL): feedback の昇格・削除判断 / project の完了削除 / reference の生死確認 / 「何を永続化するか」の門番 (手動キュレーションの本質)
- 棚卸しを機械化する装置は未整備: `review-memory` skill 未実装、型検証スクリプト無し、frontmatter 2世代混在で `grep '^type:'` は8件中1件しか拾えない (260702 センサス)
- note K-1 の最終形「覚えていなくても守られる構造」に照らせば、かいじゅうの意識も将来は機械 (stale 検出自動化・型検証 pre-commit 化) に置き換えるのが筋

### Q4: user だけ CLAUDE.md/rules で、他の型は MEMORY.md (frontmatter の値で型が変わる)？

**A: 骨子 Yes。補正2点:**

1. 他3型の実体は MEMORY.md 本体ではなく **memory/ 配下の個別トピックファイル** (1枚 = 記憶1件、frontmatter `type:` が型)。MEMORY.md は型を持たない目次。書く手順は「トピックファイル作成 → MEMORY.md に索引行を1行追加」の2段
2. 「user は CLAUDE.md/rules へ」は Claude Code の仕様ではなく **kaiju ハーネス固有の設計判断** (毎セッション必要な情報は常時ロード層へ、の配置理由。アーカイブ済 plan `2026-05-23-memory-citation-antipattern-cleanup.md` に移設記録)。ネイティブ動作なら user 型も memory ディレクトリに書かれる

例外: 休止中 ninmu/toybox の2 PJ は MEMORY.md に型無し直書き — 設計でなくドリフト (あるべき姿と現実のほつれを区別)。

### Q5: MEMORY.md はグローバル CLAUDE.md/rules のように全プロジェクトに注入される？ プロジェクト固有？

**A: プロジェクト固有 (グローバル注入は No)。さらに kaiju の現設定では自動注入自体が起きない (オンデマンド読込のみ)。**

| 層 | 範囲 | タイミング |
|---|---|---|
| グローバル CLAUDE.md + rules/ | 全 PJ 共通 | 毎セッション開始時、全文 |
| プロジェクト CLAUDE.md | その PJ のみ | 毎セッション開始時、全文 |
| MEMORY.md (true 時) | **その PJ のみ** | 開始時、先頭200行 or 25KB |
| MEMORY.md (kaiju: false) | その PJ のみ | **自動注入なし。必要時 Read** |

スコープの機微2点:

1. `~/.claude` 自体も「1プロジェクト」— ハーネス repo の記憶 (feedback 3 + reference 1) が効くのは cwd が `~/.claude` のセッションだけ。rules/ の全 PJ 注入とは対照的な正しい局所化
2. 同一リポジトリの worktree は記憶を共有 — PJ 単位の分離はあるが worktree 単位の分離はない (Q1 の false 維持理由の1つ)

## 関連ファイル

- `~/.claude/settings.json` — `autoMemoryEnabled: false` (503行目、デフォルト true 化後の防波堤)
- `~/.claude/projects/-Users-camone--claude/memory/MEMORY.md` — 索引の実物 (型を持たない目次)
- `~/.claude/projects/-Users-camone--claude/memory/feedback-grep-before-delete.md` — 型付きトピックファイルの実物 (`type: feedback` frontmatter)
- `~/.claude/skills/establishing-knowledge-persistence/SKILL.md` — 4型スキーマ定義 (L120-123 裸見出し)
- `~/.claude/.docs/plans/archived/2026-05-23-memory-citation-antipattern-cleanup.md` — user 型を rules/CLAUDE.md へ移設した設計判断の記録
- `.docs/logs/shared/2026-07-02_k1-typed-memory-4types-harness-recensus.md` — 当日のハーネス全数センサス (本 Q&A の土台)
- `.docs/references/260405_【「なぜか微妙」は偶然ではない】…/text.md` — note 正本 (K-1 L1280-1357、4型表 L1311-1315)
