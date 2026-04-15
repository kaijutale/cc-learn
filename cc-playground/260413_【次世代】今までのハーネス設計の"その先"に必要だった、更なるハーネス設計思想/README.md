# trilayer-harness-playground

本 playground は **three-elements-harness (trilayer-harness)** スキルの **reference implementation** として機能するワークスペース。

`~/.claude/skills/three-elements-harness/` の Phase 3 dogfooding(自己適用)対象として、Macro → Micro → Project OS の round trip を実際に回すためのサンドボックスである。

---

## 正体

- **スキル本体**: `~/.claude/skills/three-elements-harness/SKILL.md`
- **設計書 (plan)**: [`.docs/plans/2-layer-harness-framework-construction.md`](.docs/plans/2-layer-harness-framework-construction.md)
- **フレームワーク仮称**: trilayer-harness(既存 EKP の上に敷く L2.5〜L3 相当の薄いメタフレームワーク)
- **一文サマリ**: Macro 判断・Micro 実装・Project OS 状態の3層契約を、既存 EKP + 5-Role agents の上に薄く敷き、空白の Macro 層を埋める汎用メタフレームワーク

この playground は "空の箱" ではなく、trilayer 本体の spec / ticket / status を自分自身に適用し、スキル設計の整合性を閉ループで検証するための生きた検査場である。

---

## ディレクトリ配置概要

```
.
├── .claude/                      # Claude Code プロジェクト設定
│   ├── CLAUDE.md                 # プロジェクト固有指示(PDF 参照と templates の Git 管理ルール)
│   └── settings.json             # Agent Teams experimental flag 有効化
├── .docs/                        # Project OS(EKP + trilayer 拡張)
│   ├── specs/                    # WHAT: 要件仕様
│   ├── designs/                  # HOW IT LOOKS: UI/設計
│   ├── tickets/                  # NOW: Macro 主要 I/O(チケット実体)
│   ├── knowledge/                # 判断ログ / runbooks / 実装知識
│   ├── tests/                    # HOW IT VERIFIES: テスト定義
│   ├── plans/                    # 設計プラン群
│   ├── references/               # 正典 PDF など参照資料
│   ├── templates/                # 実装ログ用テンプレート置き場
│   └── trilayer/                 # trilayer フレームワーク自身のメタ
│       ├── manifest.yml          # 採用宣言 + semver
│       ├── macro-policies.yml    # 5職務のプロジェクト固有設定
│       └── status.yml            # Macro/Micro 実行履歴(append-only)
├── .gitignore
└── README.md                     # 本ファイル
```

`.docs/trilayer/` 以外は EKP(`establishing-knowledge-persistence`)が提供する既存スキーマをそのまま流用している。trilayer は fork せず、`.docs/trilayer/` サブディレクトリと `.docs/knowledge/{decisions,runbooks}/` のみを追加する薄い拡張である。

---

## trilayer 3層契約(超要約)

trilayer-harness は以下の3層の入出力契約を固定する。詳細は設計書 §4 を参照。

### Macro 層 — 判断

- **入力**: 自然言語の goal、現状参照、制約(予算/期日)
- **処理**: 5職務 = 要件整理 / 優先順位付け / チケット化 / 定期実行と監視 / 失敗時の再計画
- **出力**: `.docs/tickets/TICKET-NNN-*.md`(主要成果物) + `.docs/knowledge/decisions/*.md` + `.docs/trilayer/status.yml` への append
- **呼び出し先**: `spec-based-development` / `kpidd` / 独自 ticket generator

### Micro 層 — 実装

- **入力**: `.docs/tickets/TICKET-NNN-*.md` + 担当 team 指定
- **処理**: 既存 5-Role Separation(`orchestrating-team-development`)経由で並列実行
- **出力**: `src/**/*`(実装コード)、`.docs/tests/*.md`、`.docs/designs/*.md`、`.docs/knowledge/**/*.md`
- **状態遷移**: `todo → in_progress → review → done | failed`

### Project OS 層 — 状態

- EKP の `.docs/{specs,designs,tickets,knowledge,tests}/` を正として、trilayer は `.docs/trilayer/` の 3 ファイル(`manifest.yml` / `macro-policies.yml` / `status.yml`)を追加のみ
- `status.yml` は append-only。既存エントリの書き換え・削除は `validate-trilayer.py` が reject する

trilayer は Micro agents を直接呼ばず、`orchestrating-team-development` スキルに委譲する("ticket を書くまで" が Macro の責務境界)。

---

## Phase 3 dogfooding 証跡

この playground で実行された trilayer round trip の実行履歴は以下に append-only で記録される。

- **証跡本体**: [`.docs/trilayer/status.yml`](.docs/trilayer/status.yml)
- **採用宣言**: [`.docs/trilayer/manifest.yml`](.docs/trilayer/manifest.yml)
- **Macro ポリシー**: [`.docs/trilayer/macro-policies.yml`](.docs/trilayer/macro-policies.yml)

本 README 自体が Phase 3 dogfooding の成果物の一つであり、以下の round trip により生成された:

1. **Macro 層**: `TICKET-001-generate-readme` と spec `trilayer-readme-generation` を作成、`status.yml` に `ticket_created` を append
2. **Micro 層**: ticket を `todo → in_progress` に遷移、`team-documenter` agent を起動
3. **Project OS 層**: `team-documenter` が spec を読み、本 README.md を生成

具体的な entry は [`.docs/trilayer/status.yml`](.docs/trilayer/status.yml) の `entries:` セクションで確認できる。

---

## 関連ドキュメント

| 資産                     | パス                                                                                                                                                 | 役割                                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| スキル本体 SKILL.md      | `~/.claude/skills/three-elements-harness/SKILL.md`                                                                                                   | trilayer-harness の正典スキル定義                |
| 設計プラン               | [`.docs/plans/2-layer-harness-framework-construction.md`](.docs/plans/2-layer-harness-framework-construction.md)                                     | 2層ハーネス+状態基盤 汎用フレームワーク構築プラン |
| 3層契約の記事 PDF        | [`.docs/references/pdf/screencapture-note-masa-wunder-n-n40f97558c6d9-2026-04-13-13_54_09.pdf`](.docs/references/pdf/screencapture-note-masa-wunder-n-n40f97558c6d9-2026-04-13-13_54_09.pdf) | 設計判断の典拠(全32ページ)                     |
| README 生成 spec         | [`.docs/specs/trilayer-readme-generation.md`](.docs/specs/trilayer-readme-generation.md)                                                             | 本 README の要件仕様                             |
| README 生成 ticket       | [`.docs/tickets/TICKET-001-generate-readme.md`](.docs/tickets/TICKET-001-generate-readme.md)                                                         | 本 README を生成した Macro 層チケット            |
| trilayer status(証跡)  | [`.docs/trilayer/status.yml`](.docs/trilayer/status.yml)                                                                                             | Macro/Micro 実行履歴 append-only                 |
| trilayer manifest        | [`.docs/trilayer/manifest.yml`](.docs/trilayer/manifest.yml)                                                                                         | trilayer 採用宣言 + semver                       |
| trilayer macro policies  | [`.docs/trilayer/macro-policies.yml`](.docs/trilayer/macro-policies.yml)                                                                             | 5職務のプロジェクト固有設定                      |

---

## 前提

- `establishing-knowledge-persistence` (EKP) スキルが導入済であること
- `orchestrating-team-development` スキルおよび 5-Role agents(`team-ui-designer` / `team-implementer` / `team-tester` / `team-reviewer` / `team-documenter`)が `~/.claude/agents/` に配置済であること
- `.claude/settings.json` で `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` が有効化されていること

---

## スコープ境界(この playground がやらないこと)

- 個別プロジェクトの KPI / Spec 策定そのもの(それは SDD/KPIDD の役割)
- 外部マクロツール(OpenCrew 等)との実 API 接続
- CI/CD パイプライン統合
- GitHub 公開配布 / テンプレートリポジトリ化
- Micro 層エージェントの新規実装(既存 5-Role を流用、改造不可)

詳細は設計書 [§2 解決しない問題](.docs/plans/2-layer-harness-framework-construction.md) を参照。
