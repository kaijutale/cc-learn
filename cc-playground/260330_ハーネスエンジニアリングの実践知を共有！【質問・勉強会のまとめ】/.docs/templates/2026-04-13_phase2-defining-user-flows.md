機能名: Q1-Q6ハーネス強化プラン Phase 2 — defining-user-flows 新設 + spec-based-development 軽量化 + flow-to-mermaid CLI

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 11:47:11
- 概要:
  Q1-Q6 プランの Phase 2 (2a + 2b + 2c) を一括実装。Q1「Flow.md の扱い」に対する構造的解決策。
  新規スキル `defining-user-flows` を作成し、`spec-based-development` の Phase 3 (UI/UX) を
  軽量化して「画面・状態の列挙のみ」に責務分離した。既存プロジェクト互換のため移行 CLI
  `flow-to-mermaid.sh` も併せて提供。これにより「spec = 何を作るか、flow = どう動くか」という
  明確な責務分離が成立した。

- 実装内容:

  **Phase 2a + 2c: 新規スキル `defining-user-flows` 作成**

  新規ファイル 4 個:
  1. `~/.claude/skills/defining-user-flows/SKILL.md` (126 行):
     - 責務分離表（spec-based-development vs defining-user-flows）
     - 6-step Workflow: spec.md 画面リスト抽出 → AskUserQuestion 深掘り → Mermaid 生成 → user-stories 生成 → 書き出し → 相互リンク
     - 既存 SPEC.md 移行 CLI の利用ガイド
  2. `~/.claude/skills/defining-user-flows/references/mermaid-flow-patterns.md` (153 行):
     - Mermaid flowchart 基本構文（ノード種別・遷移記法）
     - 6 典型パターン（Linear / Conditional / Error Recovery / Parallel Entry / Subgraph / Early Exit）
     - ガイドラインとアンチパターン
     - Mermaid レンダリング環境対応表（GitHub / VS Code / Obsidian / Agentic Search）
  3. `~/.claude/skills/defining-user-flows/references/user-story-templates.md` (200 行):
     - "As a / I want to / So that" 基本形式
     - 3 詳細例（ログイン / 検索 / アカウント削除）
     - ガイドラインとアンチパターン
     - 既存プロジェクトからの移行手順
  4. `~/.claude/skills/defining-user-flows/scripts/flow-to-mermaid.sh` (172 行、実行権限付):
     - SPEC.md からフロー関連セクション抽出（AWK による IGNORECASE 検索）
     - キーワード: フロー/動線/遷移/画面遷移/ユーザーストーリー/flow/transition/navigation/journey
     - Mermaid テンプレ + TODO 付き starter flow.md 生成
     - 合成 SPEC.md でスモークテスト実施（2 candidate sections 抽出成功）

  **Phase 2b: `spec-based-development` 改修**

  既存ファイル 3 個を編集:
  1. `~/.claude/skills/spec-based-development/SKILL.md`:
     - Phase 3 の説明を「5-10 問・操作フロー深掘り」→「3-5 問・画面/状態リストアップのみ」に軽量化
     - Step 5 次ステップ案内に `/defining-user-flows` への誘導を追加
  2. `~/.claude/skills/spec-based-development/references/spec-template.md`:
     - UI/UX仕様 セクションを画面リスト + 状態リスト + レスポンシブ要件 + 関連ドキュメント参照に再構成
     - `.docs/specs/flow.md` と `.docs/specs/user-stories.md` への明示的リンクを追加
  3. `~/.claude/skills/spec-based-development/references/interview-phases.md`:
     - Phase 3 を「列挙レベルのみ」に書き直し
     - 「本 Phase で扱わないこと」セクションを追加（defining-user-flows への委譲明示）
     - 深掘りの例を「一覧画面/フォーム設計」→「画面列挙例」に変更

  検証:
  - `chmod +x flow-to-mermaid.sh` 完了
  - `quick_validate.py` で両スキル（defining-user-flows, spec-based-development）pass
  - `bash -n flow-to-mermaid.sh` syntax check pass
  - `--help` 動作確認
  - 合成 SPEC.md を使ったスモークテスト成功（画面遷移セクション + ユーザーストーリーセクションの 2 件抽出）
  - 全ファイル 500 行制約内（最大 200 行の user-story-templates.md）

- 設計意図:

  - **責務分離の明確化**:
    - `spec-based-development`: 機能要件 + 画面リスト + 状態リスト (**列挙** のみ)
    - `defining-user-flows`: 遷移ロジック + ハッピーパス + 代替パス + Mermaid 図 (**深掘り**)
    この分離により:
    1. spec-based-development のインタビュー時間短縮（5-10 問 → 3-5 問）
    2. flow の深掘りは独立セッションで実施できる（コンテキスト分離）
    3. 既存 SPEC.md を変更せずに新スキルを並行導入できる（後方互換性）

  - **flow-to-mermaid.sh を Phase 2a と同じ skill 内に配置した理由**:
    プランでは「Phase 2a 完了なしに Phase 2b 着手禁止（flow-to-mermaid 移行 CLI が先）」とされていた。
    flow-to-mermaid は defining-user-flows スキルの **付属物** であり、スキルのエコシステム内に
    収める方が発見性が高い。独立 CLI として `/usr/local/bin/` 等に置くと参照経路が不明瞭になる。

  - **Mermaid を選んだ理由**:
    Figma / Pencil / Canva と対比して、Mermaid は **コードとして存在しつつ視覚化もできる**。
    - Agentic Search (grep / read) で検索可能
    - GitHub / VS Code / Obsidian で自動レンダリング
    - 同じファイルでエージェント協調と人間向け表示の両方を満たす
    `designing-dd` スキルの「HTML/Storybook は AI が読めるデザイン成果物」原則と同系統の判断。

  - **軽量化時に `interview-phases.md` に「本 Phase で扱わないこと」セクションを追加**:
    単に「UI/UX は軽量化しました」と書くだけでは、インタビュアー Claude が深掘りを続けてしまう
    リスクがある。「扱わない領域」を **明示的にリスト化** することで、責務の境界を構造的に強制する。
    これは `authoring-agent-definitions` スキルの「やらないこと」設計原則と同じ思想。

  - **SKILL.md の行数削減**:
    spec-based-development/SKILL.md は以前 97 行だったが、Phase 3 軽量化で 87 行まで縮小。
    インタビューの簡素化が SKILL.md 自体の簡素化にも反映されている副次効果。

  - **画面リストと flow.md の統一性**:
    spec.md の画面リストと flow.md の Mermaid ノードは **完全一致させる** というルールを
    両スキルの Gotchas に記載。不一致があると validator 失敗の原因となる。

- 副作用:

  - **既存プロジェクトへの影響（軽微）**:
    - 既存 SPEC.md を持つプロジェクトでは、次回 /spec-based-development 実行時に Phase 3 が軽量化される
    - 既存の SPEC.md 内容自体は変更されない（spec-template.md は新規生成時のテンプレ）
    - 既存プロジェクトで手書き flow 情報を持つ場合は `flow-to-mermaid.sh` で移行支援

  - **spec.md frontmatter の related_flows**:
    現時点では `validate-knowledge.py` の schema に追加していない。Phase 3 の evidence field
    と同じパターンで optional additive フィールドとして将来追加する必要あり（TODO）。

  - **defining-user-flows のトリガー競合**:
    既存スキル `designing-dd`、`designing-beautiful-frontends` と概念的に近いが、責務が異なる:
    - `defining-user-flows`: 動線 (Mermaid flowchart / user stories)
    - `designing-dd`: デザイン成果物 (HTML / Storybook components)
    - `designing-beautiful-frontends`: 美学ガイド (収束値回避)
    トリガーキーワードを慎重に選び、動線系のみを拾うようにした（"ユーザー動線"/"user flow"/"画面遷移" 等）。

  - **Breaking changes の有無**:
    なし。既存の spec-based-development を使っている全てのプロジェクトで後方互換。
    新機能（defining-user-flows）は opt-in であり、使わない選択肢もある。

- 関連ファイル:

  新規作成:
  - `/Users/camone/.claude/skills/defining-user-flows/SKILL.md` (126 行)
  - `/Users/camone/.claude/skills/defining-user-flows/references/mermaid-flow-patterns.md` (153 行)
  - `/Users/camone/.claude/skills/defining-user-flows/references/user-story-templates.md` (200 行)
  - `/Users/camone/.claude/skills/defining-user-flows/scripts/flow-to-mermaid.sh` (172 行、実行権限付)

  編集:
  - `/Users/camone/.claude/skills/spec-based-development/SKILL.md` (2 箇所)
  - `/Users/camone/.claude/skills/spec-based-development/references/spec-template.md` (UI/UX セクション拡張)
  - `/Users/camone/.claude/skills/spec-based-development/references/interview-phases.md` (Phase 3 軽量化 + 委譲明示)

  参照:
  - `/Users/camone/.claude/plans/rippling-munching-blanket.md` (プラン定義)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema 拡張 — evidence field)
  - Phase 1-A ✅ 完了 (orchestrating-team-development に 8+1 Mode 選択)
  - Phase 1-B ✅ 完了 (installing-hook-presets 新規スキル)
  - Phase 2 ✅ 本 Phase (2a defining-user-flows + 2b spec-based-development 改修 + 2c flow-to-mermaid CLI)
  - Phase 3 ⏳ pending (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ⏳ pending (CLI化: spec-validator, evidence-matcher)
  - Phase 5 ⏳ pending (visualizing-article)
