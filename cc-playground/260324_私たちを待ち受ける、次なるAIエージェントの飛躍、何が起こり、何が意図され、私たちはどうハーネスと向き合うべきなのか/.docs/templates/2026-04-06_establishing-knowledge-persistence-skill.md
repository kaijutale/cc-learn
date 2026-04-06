機能名: Lv2知識永続化スキル（establishing-knowledge-persistence）作成

- セッション名: Lv2知識永続化スキル構築
- 日付: 2026-04-06 12:40:13
- 概要: ハーネス成熟度モデル「Level 2: 知識の永続化」を実現する基盤スキルを作成した。まさお氏のxxDDループ（SDD/DesignDD/TDD/KPIDD）の構造・フレームワークを「本質のコピー」として取り込み、「開発する = 知識が永続化される」状態をどのプロジェクトでも立ち上げられるスキルにした。
- 実装内容:
  - `~/.claude/skills/establishing-knowledge-persistence/SKILL.md` — 5ステップワークフロー（現状診断→スキャフォールド→テンプレート配置→CLAUDE.md更新→xxDDマッピング提示）
  - `references/knowledge-categories.md` — specs/guides/decisions/各カテゴリの詳細定義・テンプレート構造・命名規則・ライフサイクル
  - `references/xxdd-integration.md` — SDD/DesignDD/TDD/KPIDDと知識成果物の対応表・既存スキル連携ポイント・導入順序推奨
  - `~/.claude/CLAUDE.md` の `## Skills` セクションに `知識永続化(記録): skills/establishing-knowledge-persistence/SKILL.md使用` を追加
- 設計意図:
  - Lv2の本質は「開発する = 知識が永続化される」構造の構築。文書を「後から書く追加作業」ではなく「開発プロセスの起点」として位置づけるxxDDフレームワークを基盤として採用
  - まさお氏の方法論の「本質のコピー」を実現：フレームワーク（型）はそのまま取り込み、中身（仕様書・デザイン・ADRの内容）はプロジェクトごとに新しく作る設計
  - 知識文書の配置先は`.docs/`配下に統合（ユーザー選択）。既存の`.docs/templates/`（メタ文書）とは役割を明確に分離
  - Progressive Disclosure 3段階: CLAUDE.md 1行（常時）→ SKILL.md（トリガー時）→ references/（必要時）
  - 既存スキルとの連携: spec-based-development（SDD）、guiding-tdd-development/enforcing-strict-tdd-cycle（TDD）への接続ポイントを明記
- 副作用:
  - `engineering-project-context`スキルとの役割境界に注意が必要。engineering-project-contextはCLAUDE.md+.docs/構造のハーネス全体設計。establishing-knowledge-persistenceはドメイン知識の永続化基盤。重複しないが補完関係にある
  - スキルは基盤構築（スキャフォールド）に特化しており、知識文書の中身生成は別スキル（spec-based-development等）に委ねる設計。単体では「箱を作るだけ」
- 関連ファイル:
  - `~/.claude/skills/establishing-knowledge-persistence/SKILL.md`
  - `~/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md`
  - `~/.claude/skills/establishing-knowledge-persistence/references/xxdd-integration.md`
  - `~/.claude/CLAUDE.md` (Skills セクション)
  - `.docs/references/pdf/next-ai-agent-leap-and-harness.pdf` (元記事)

## 議論の経緯

このスキル作成に至るまでの議論で以下の理解が深まった：

1. **Lv2「知識の永続化」の本質**: 「記憶は消す。しかし記録は残す。」— 揮発するコンテキスト（判断バイアス）と永続化するコンテキスト（事実の記録）を分離するコンテキストの二重構造
2. **handoff/pickupはLv2の一部**: セッション間の作業状態の引き継ぎ（短命）。プロジェクト全体の知識基盤（長命）とは異なる
3. **コンテキストのろ過**: handoff→clear→pickupは泥水のろ過。バイアス（泥）を除去し、事実（透明な水）だけ通す。フィルターの目の粗さ＝handoffに何を書くかの設計判断
4. **「本質のコピー」vs「ただの真似事」**: xxDDフレームワーク（型）をコピーするのが本質。まさお氏のプロジェクト固有の成果物をコピーするのが真似事。守破離の「守」
5. **まさお氏のxxDDループ**: SDD/DesignDD/TDD/KPIDDで開発プロセス自体が永続化を内包する構造。FigmaではなくHTML/Storybookを使うのはAI参照可能な形式にするため
