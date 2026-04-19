---
feature: skill-preload-vs-invoke-precedence
session: 未設定
date: 2026-04-19 21:31:44
---

# skill の preload経路 vs invoke経路 の優先順位（context: fork / agent / skills: の3者関係）

## 概要

前日の学習ログ `2026-04-19_skill-subagent-relationship-map.md` で整理した「skills / subagents / context: fork の関係性マップ」を土台に、**具体的な優先順位の境界**を3段階の問答で深掘りしたQ&Aセッション。Claude Code 公式ドキュメント（https://code.claude.com/docs/en/skills）の frontmatter リファレンスと "Run skills in a subagent" セクションを一次ソースとして参照し、**「preload時に skill の `context: fork` は発火するのか？」**という未文書化領域を語彙論理（"injected" vs "run"）と設計原則（起動主体 > 持ち物）から推定した。

### 題材構成

- 親subagent: `.claude/agents/system-analyst.md`（`model: sonnet`, `skills: [system-info]`）
- 子skill: `.claude/skills/system-info/SKILL.md`（`allowed-tools: Bash(uname:*)...`、`!`による動的展開）

## 実装内容

### 1. わたしの初期誤答と訂正

第1問「system-info はどの subagent として実行される？」に対し、わたしは `skill には subagent フィールド自体が存在しない` と断言した。**これは嘘**。かもねに公式ドキュメントを実際に読むよう叱られ、WebFetch で原文取得して訂正。

公式 frontmatter リファレンスに以下が明記されている:

| Field | 公式原文 |
|:---|:---|
| `context` | Set to `fork` to run in a forked subagent context. |
| `agent` | Which subagent type to use when `context: fork` is set. |

つまり skill には「subagent として実行する」選択肢が正規に存在する。わたしは一次ソースを確認せず推測で断言した。

### 2. 3段階の問答で確定した優先順位マトリクス

| # | 設定 | 呼び出し経路 | 実行主体 | `agent: Explore` 効く？ |
|---|------|------------|----------|----------------------|
| Q1 | system-info に `agent` / `context` なし | system-analyst 経由（`skills:` preload） | **system-analyst** (sonnet) | — |
| Q2 | system-info に `agent: Explore` のみ | system-analyst 経由 | **system-analyst** (sonnet) | ❌（`context: fork` 無しで agent は no-op） |
| Q3 | system-info に `context: fork + agent: Explore` | system-analyst 経由 | **system-analyst**（推定） | ❌（preload時はfork指示黙殺） |
| Q4 | system-info に `context: fork + agent: Explore` | `/system-info` 手動 / Claude自動 invoke | **Explore subagent** | ✅（公式に明記された挙動） |

### 3. preload経路 vs invoke経路 の語彙差による分離

公式ドキュメントの動詞使い分けが設計の骨格:

| 経路 | 公式動詞 | 意味 |
|:---|:---|:---|
| subagent の `skills:` フィールド | **"injected"** at startup | コンテキストへの**内容注入** |
| `/skill-name` または Claude自動発火 | **"invoke"** / **"run"** | skill の**実行ディスパッチ** |

`context: fork` の定義は "Set to `fork` to run in a forked subagent context." — **"run"** という動詞に注目。これは実行時ディスパッチの指示であり、注入時の指示ではない。したがって preload 経路では `context: fork` は発火条件を満たさない。

### 4. 公式未定義領域の明示

Q3（preload + fork指定）は公式ドキュメントに明言がない**実装依存領域**。以下3パターンが理論上あり得る:

| パターン | 挙動 | 公式記述 |
|:---|:---|:---|
| X（最有力） | preload時は `context: fork` 黙殺 → system-analyst勝ち | 暗黙 |
| Y | preload時もfork発動 → Explore勝ち | 記述なし |
| Z | 設定矛盾としてエラー | 記述なし |

"injected"語彙と「起動主体 > 持ち物」原則から X を推定したが、**断言ではなく推論**。実測必要。

## 設計意図

### なぜ Q3 を「実装依存」と明示したか

前回の「関係性マップ」ログで全体構造は整理済み。今回の Q&A は **境界条件（両方指定した場合）** を突くもの。ここで「公式に明記 = 確定」「語彙と原則から推定 = 推定」を分けて記述する方針を取った。

理由: わたしが Q1 で推測を断言して叱られた直後のセッションだから、**「分かっていること」と「分かっていないこと」を峻別する誠実性**を優先すべき。不確実を確実に偽装すると、かもねの判断材料が汚染される。

### なぜ3経路比較表を最終成果物にしたか

かもねの問いは「preload」「手動invoke」「自動invoke」の3経路を1つずつ潰していく構造だった。最後の第3問で「じゃあ手動ならどうなる？」と聞かれた時点で、**3経路一覧にまとめるのが自然な帰結**。個別回答を積み上げるより、マトリクス1枚で全体が見える方が将来参照しやすい。

### 「起動主体 > 持ち物」原則の再確認

前回ログの結論と今回の結論が一貫していることを確認:
- skill は持ち物、subagent は人（起動主体）
- 持ち物の frontmatter は人の実行環境を原則上書きできない（`allowed-tools` の intersection のような**制約追加**は別）
- ただし持ち物が**単独で手に取られた**場合（invoke経路）は、持ち物自身が「誰が使うか（agent）」を指定できる

## 副作用

### わたしの姿勢に関する自己反省

- Q1 で推測を断言した → かもねに「公式ドキュメントちゃんと読めばかたれ」と叱られて初めて WebFetch した
- これは CLAUDE.md の「検索時: エラー正確引用。最新情報源優先。推測せず早め検索」違反
- 以降、断言前に一次ソース確認する癖を強化する。特に「skill/subagent/frontmatter」のような**ドキュメント化されている機能**については、推測の正当性がゼロ

### 今回の結論のうち実測未確認項目

- Q3 の X パターン推定（preload + fork指定 → 黙殺）は論理推定のみ
- 実証するなら fire-timing-test skill 方式で system-info に `context: fork + agent: Explore` を付けて preload させ、Explore のログが出るか確認する必要あり
- 将来かもねが実測した場合、この推定が覆る可能性がある

### 関連ログとの関係

前回 `2026-04-19_skill-subagent-relationship-map.md` は関係性の全体マップ、今回は**境界条件の優先順位深掘り**。両者は補完関係で矛盾なし。ただし前回ログの「skill + `subagent: X`」記載は、公式の正式フィールド名が `agent`（`context: fork` とセット）である点で、**表記を `agent` に合わせるべき**だった。新規ログでは `agent` 表記に統一。

## 関連ファイル

- `.claude/agents/system-analyst.md` — 題材の親subagent定義（`skills: [system-info]`）
- `.claude/skills/system-info/SKILL.md` — 題材の子skill定義（`allowed-tools` のみ、`context: fork` なし）
- `.docs/templates/2026-04-19_skill-subagent-relationship-map.md` — 前回学習ログ（全体マップ）。今回ログの前提知識
- `.docs/templates/2026-04-19_invoke-and-deterministic-solution.md` — 「!<command>の決定論性」学習ログ。invoke経路の決定論性の話題と接続
- `.docs/templates/2026-04-18_skill-bang-command-firing.md` — `!` 事前実行タイミングの実測ログ。今回の「preload時も `!` は事前実行される」根拠
- 公式ドキュメント: https://code.claude.com/docs/en/skills — frontmatter リファレンス + "Run skills in a subagent" セクション（一次ソース）
