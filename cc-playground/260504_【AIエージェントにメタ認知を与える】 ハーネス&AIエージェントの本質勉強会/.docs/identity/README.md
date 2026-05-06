# identity/

このプロジェクトのアイデンティティ宣言ディレクトリ。グローバル `~/.claude/.docs/essence/` (不変原理原則) と対をなす、プロジェクト固有の自己選択・自己定義を記述する。

> **対応関係**:
> - グローバル `~/.claude/.docs/essence/` = 全プロジェクト共通の不変原理原則 (レビューア基準)
> - 本ディレクトリ = プロジェクト固有の自己選択・自己定義 (設計判断の出発点)

## なぜ identity を essence と別管理するか

essence/README.md が示す通り、両者を混ぜると **essence の再利用性が崩壊** する。

- **essence** = 「数学の公式のように不変で誰が見ても正しいと認められる原理原則」 (時代/プロジェクト/個人を超えて成立)
- **identity** = 「このプロジェクトは何で、何を選んだか」 (時代・好み・個別事情で変わってよい)

essence にプロジェクト固有ルール (Opus固定 / kebab-case / 紫グラデ禁止 等) が混入すると、別プロジェクトでそのまま再利用できなくなる。逆に identity に普遍原理 (コンテキストウィンドウは有限資源 等) を書くと、同じことをN個のプロジェクトで重複記述することになる。

essence の各ファイル末尾には「本質ではない例 (= プロジェクトアイデンティティ側)」が列挙されている。そこに挙がっている項目こそが、本ディレクトリで吸収すべき内容。

## ファイル構成

| ファイル | 対応する essence | 役割 |
|---|---|---|
| `project-charter.md` | (対応なし) | プロジェクトそのものの自己定義 (目的・スコープ・出力物・必須参照) |
| `agent-identity.md` | `agent-essentials.md` | エージェント設計の8原則に対する本プロジェクトの選択 |
| `skill-identity.md` | `skill-essentials.md` | スキル設計の8原則に対する本プロジェクトの選択 |
| `ui-identity.md` | `ui-essentials.md` | **N/A**: 本プロジェクトはUI制作を行わない (project-charter.md の「スコープ外」を参照) |

各 identity ファイルは、対応する essence の各原則に対して「このプロジェクトでは何を選んだか」を記述する。1:1対応にすることで、レビューア (essence側) と被評価対象 (identity側) の照合が機械的になる。

## CLAUDE.md との役割分担

| ファイル | 役割 | 性質 |
|---|---|---|
| `.claude/CLAUDE.md` | 最低限の必須ルール (絶対参照すべきPDF、Gitログ規約 等) | エージェントが必ず守る制約 |
| `.docs/identity/` | 自己定義の全体像 (なぜそれを選んだかを含む) | 設計判断の出発点・参照集 |

CLAUDE.md は短く保ち (Critical Thinking Checklist: 「自明なことは書かない」)、identity に判断根拠を逃がす。

## 育て方

essence と異なり PR駆動の重厚なフローは不要 (プロジェクト固有のため、HITL は本人で完結)。プロジェクト方針が変わった時に該当ファイルを直接更新する。

ただし以下は守る:

1. **essence の普遍原理を identity に書かない** (例: 「コンテキストウィンドウは有限資源」は essence 側)
2. **identity の選択を essence に書かない** (例: 「Opus 固定」「kebab-case」は identity 側)
3. **選択の根拠を記述する** (なぜそれを選んだかを書くことで、後から判断を再現/再検討できる)
4. **改訂履歴を残す** (essence と同様、各ファイル末尾に表形式で版を記録)

## アンチパターン

- **essence と identity の責務を混ぜる** → 評価軸 (essence) と被評価対象の自己宣言 (identity) が判別不能になり、レビューアが基準を絞れない
- **identity を CLAUDE.md と完全重複させる** → どちらが正なのか不明瞭になる。CLAUDE.md は「最低限の必須ルール」、identity は「自己定義の全体像」と役割を分ける
- **essence 側で「この原則を採用するか」を選択させる** → essence は不変原則の集合体であり「採用/不採用」を選ぶ対象ではない。採用判断は identity 側で行う

## 参照パス

本プロジェクト内のファイル参照は **相対パス** で問題ない (本プロジェクトの実装者が参照する想定)。

ただし subagent (context:fork) から参照する場合は **絶対パス必須**:

```
/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会/.docs/identity/<ファイル>.md
```

理由: subagent in-process / out-of-process で cwd 継承挙動が揺れる公式 grayzone (essence/README.md と同じ理由)。

## 関連リソース

- グローバル essence: `/Users/camone/.claude/.docs/essence/`
- 本プロジェクトの CLAUDE.md: `.claude/CLAUDE.md`
- 主出典PDF: `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf`
- Meta-Harness論文: `.docs/references/sources/pdf/Meta-Harness_End-to-End_Optimization_of_Model_Harnesses.pdf`

## 改訂履歴

| 日付 | 版 | 変更 |
|---|---|---|
| 2026-05-06 | v1.0 | 初版。essence/ (v1.0) と対応する identity/ ディレクトリの設計思想と構成を定義。 |
