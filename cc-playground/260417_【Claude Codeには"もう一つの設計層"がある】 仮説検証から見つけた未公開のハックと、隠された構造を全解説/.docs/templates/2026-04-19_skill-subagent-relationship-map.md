---
feature: skill-subagent-relationship-map
session: 未設定
date: 2026-04-19 19:46:05
---

# skills / subagents / context:fork / !`<command>` の関係性マップ

## 概要

note記事「Claude Code には"もう一つの設計層"がある」で扱われている拡張概念群（skills の `context: fork` / `subagent` フィールド / `!<command>`、subagents の `skills` フィールド）について、**前日までの実測ログ**（`2026-04-18_skill-bang-command-firing.md`、`2026-04-19_invoke-and-deterministic-solution.md`）で確定した事実を土台に、**「実行主体（誰が動く）」と「contextの分離度（親と切れる度合い）」の2軸**で関係性を整理した学習セッション。文章解説＋表2種＋ASCIIフロー図で可視化。

## 実装内容

### 1. 各要素のレイヤー所属を確定

| 要素 | 所属レイヤー | 役割 |
|---|---|---|
| skill（デフォルト） | invoke層 | 親Claudeのcontextでbody展開 |
| skill + `context: fork` | invoke層（軽量隔離） | 子枝で実行、要約だけ親に戻す |
| skill + `subagent: X` | invoke層 → agent層 | subagent X に実行を委譲 |
| `!<command>` | **ハーネス層**（skill body内） | invoke時に shell を100%発火 |
| subagent + `skills: [...]` | agent層 | agent側の道具allowlist |

### 2. skill ↔ subagent の双方向参照を可視化

- skill 側 `subagent: <name>` → 「誰が実行するか」の指名
- subagent 側 `skills: [<list>]` → 「自分が呼べる道具」のホワイトリスト
- **ホスト（subagent）側の許可が、主体側（skill）の指名より優先**される設計

### 3. `!<command>` の層独立性を強調

skill のどの実行モード（デフォルト / fork / subagent委譲）でも、`!<command>` は invoke の瞬間に決定論的に発火する。**これは前日ログで実測済み事実**。

### 4. 出力形式

- 文章解説（2軸モデルの全体像）
- 表1: 各要素のレイヤー比較（決定論度カラム付き）
- 表2: skill ↔ subagent の双方向参照
- ASCIIフロー図: invoke3パターン × `!<command>` 発火点

## 設計意図

- **2軸モデルの採用**: 「実行主体」と「context分離度」の直交2軸で見ると、5要素が綺麗に整理できる。1次元の列挙より構造が把握しやすい
- **前日ログとの接続を明示**: `!<command>` の決定論性は今日新たに調べた話ではなく、前日の実測ログで既に確定済みの事実。学習の積層構造を保持
- **「ハーネス層」という呼称の昇格**: 前日の概念ログでは「ハーネス前処理」と説明していたが、今回は他レイヤー（invoke層/agent層）と並置することで**質的に独立した層**として位置づけた
- **双方向参照を Unix permissions に喩えた**: skill側指名 vs subagent側allowlist の優先関係を、馴染みのあるOS権限モデルにマップして直感的に理解可能にした
- **note記事の「もう一つの設計層」の正体特定**: 記事タイトルが示す「もう一つの設計層」= `!<command>` のハーネス層、と明示的に言語化

## 副作用

- **`context: fork` と `subagent` フィールドの厳密な公式仕様確認は未実施**: かもねの読んだnote記事内の用語法を信頼して説明したが、英語docsのfrontmatter仕様書を当たって裏取りしたわけではない。将来 claude-code-guide エージェント経由で正式仕様確認が必要
- **subagent 経由 invoke 時の `!<command>` 発火タイミング未実測**: 「どの実行モードでも決定論的」と書いたが、subagent 委譲時の発火が main context 側か subagent 側か（context境界とどちらに属するか）は未検証
- **fork時の「子の要約だけ親に戻す」挙動の実測なし**: 概念モデルとしては書いたが、実際にどのフォーマットで戻されるか（fullテキスト/要約/ツール戻り値形式）は未検証

## 関連ファイル

- `.docs/templates/2026-04-18_skill-bang-command-firing.md` — `!<command>` の発火タイミング実測ログ（本ログの土台事実を提供）
- `.docs/templates/2026-04-19_invoke-and-deterministic-solution.md` — 決定論性の概念整理ログ（本ログの「決定論度」カラムの根拠）
- `.docs/templates/2026-04-18_claude-code-input-modes.md` — bash mode（ユーザー入力側 `!`）と skill body内 `!<command>` の混同回避用参照
- 参考: `.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf` — note記事本体（本セッションの解説対象）
