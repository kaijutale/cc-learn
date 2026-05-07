# project-charter.md

> このプロジェクトの自己定義。「何のためのプロジェクトか」「何を作り何を作らないか」を明文化する。
> 設計判断の最上位の出発点として、harness-identity / skill-identity から参照される。

## 概要

| 項目 | 値 |
|---|---|
| プロジェクト名 | 260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会 |
| 性質 | 学習用プロジェクト |
| 配置 | `cc-playground/` 配下 (= 商用リポジトリではない、検証/学習目的) |
| 担当 | かもね (個人) |
| 開始 | 2026-04 (元PDF日付ベース) |
| ステータス | アクティブ (essence/ への成果反映フェーズ) |

## 目的

このプロジェクトは「**AIエージェント / ハーネス設計の本質を学び、グローバル資産化する**」ためのワークスペース。

具体的には:

1. 主出典 (note記事PDF + Meta-Harness論文) を読み込む
2. AIエージェント / ハーネス設計の不変原理原則を抽出する
3. 抽出した原則を Claude Code 環境で実装/検証する
4. 検証済みの原則を `~/.claude/.docs/essence/` に昇格させる (= 全プロジェクト共通資産化)

## 必須参照資料

応答時に必ず参照する (`.claude/CLAUDE.md` で指定済み):

| 種類 | パス |
|---|---|
| 主出典PDF | `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` |
| 関連論文 | `.docs/references/sources/pdf/Meta-Harness_End-to-End_Optimization_of_Model_Harnesses.pdf` |
| 図解 | `.docs/references/sources/images/excalidraw.svg` |

note記事原本: https://note.com/masa_wunder/n/nf03564a8d638 (まさお@未経験からプロまでAI活用, 2026-04-04)

## スコープ

### このプロジェクトで作るもの

- 主出典PDFの読込メモ・要約 (`.docs/output/`)
- Meta-Harness論文の整理 (`.docs/output/meta-harness/`)
- 学習過程のログ (`.docs/logs/shared/` — Git追跡対象)
- 実験的な skill / agent 試作 (本人個人用、後にグローバル昇格判断)
- グローバル essence ドキュメントへの寄与 (PR駆動)
- 本ディレクトリ (`identity/`) 自体 — essence と対をなす設計の試作

### このプロジェクトで作らないもの

- **UI / Webアプリ / フロントエンド**: 本プロジェクトはUI制作を行わない → `ui-identity.md` は意図的に作成しない
- **商用デプロイ可能な成果物**: cc-playground は学習場所であり製品ビルドの場ではない
- **外部公開資料**: ブログ記事/SNS投稿等のアウトリーチは別プロジェクトで行う
- **多人数協業のためのドキュメント**: 個人学習プロジェクトのため、外部貢献者向け onboarding 資料は不要

## 出力物の信頼性

学習中であり試行錯誤の痕跡が残るため、以下の **信頼性レベル** を区別する:

| 配置 | 信頼性 | 性質 |
|---|---|---|
| `.docs/logs/shared/` | 中 | 学習過程のスナップショット (時点理解) |
| `.docs/output/` | 中-高 | 整理済み学習成果 (この時点での理解の到達点) |
| `~/.claude/.docs/essence/` (昇格後) | 高 | PR駆動 + HITL を経た不変原則 (= 全プロジェクトで通用) |

学習ログは「絶対的な正解」ではなく「ある時点での理解スナップショット」として扱う。essence 昇格時にはじめて、原則として固定される。

## 永続化方針

- ログは `.docs/logs/shared/` に保存し **Git追跡対象** とする (`.claude/CLAUDE.md` 既定)
- 理由: 学習成果が `.gitignore` で消えると勉強会の趣旨が崩壊する
- ローカル一時ログ (`.docs/logs/local/`) は使わない方針 (このプロジェクト固有の選択 — 通常 `/logging` skill のデフォルトは local だが、本プロジェクトでは shared 直行)

## 非目的 (Anti-Goals)

過剰投下を避けるため、以下は意図的に行わない:

- **完成度の追求**: 「綺麗に整える」より「学んだ事実を残す」を優先
- **重複ドキュメント**: グローバル CLAUDE.md / essence で書かれている内容をプロジェクト側で再記述しない
- **未来の機能のためのインフラ**: 「いつか必要になるかも」で structure を作らない (例: UI制作予定なし → ui-identity.md は作らない)
- **公式配布レベルの儀礼**: semver / CHANGELOG / breaking-changes-policy は個人学習プロジェクトに不要

## 関連リソース

- 元PDFを書いた「まさお@未経験からプロまでAI活用」氏の note: https://note.com/masa_wunder/n/nf03564a8d638
- 関連論文: [Meta-Harness: End-to-End Optimization of Model Harnesses](https://arxiv.org/abs/2603.28052)
- グローバル essence (このプロジェクトの成果反映先): `/Users/camone/.claude/.docs/essence/`
- グローバル CLAUDE.md (個人ハーネスポリシー): `/Users/camone/.claude/CLAUDE.md`

## 改訂履歴

| 日付 | 版 | 変更 |
|---|---|---|
| 2026-05-06 | v1.0 | 初版。プロジェクトの性質・目的・スコープ・非目的を明文化。 |
