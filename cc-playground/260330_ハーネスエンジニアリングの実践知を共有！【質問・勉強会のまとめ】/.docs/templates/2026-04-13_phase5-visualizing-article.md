機能名: Q1-Q6ハーネス強化プラン Phase 5 — visualizing-article 新規スキル（Mermaid + nano-banana 統合）

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 13:36:19
- 概要:
  Q6 の実装。既存の記事 MD（主に `article-explainer` が生成した ASCII art 主体の記事）を
  Mermaid 図 + nano-banana AI 生成画像で視覚強化する独立スキルを新設した。
  `article-explainer` (URL→MD) とは独立した系統で、入力が既存 MD のため責務が明確に分離される。
  AI 画像生成のコスト透明性、冪等性フラグ、Mermaid 優先原則、ASCII art 保存ルール等、
  エージェントが「勝手に課金しない」「元情報を壊さない」ための運用原則を明文化した。

- 実装内容:

  **Phase 5-1: `visualizing-article/SKILL.md`（新規）**

  新規ファイル 1 個:
  1. `~/.claude/skills/visualizing-article/SKILL.md` (131 行):
     - 責務境界表: `article-explainer` (URL→MD) vs `visualizing-article` (MD→視覚強化 MD)
     - 引数仕様:
       - `md-path` (必須): 対象 MD パス
       - `--force`: `visualized: true` でも再生成
       - `--no-images`: Mermaid のみ、nano-banana 呼び出しスキップ（コスト 0）
       - `--hero-only`: hero 画像 1 枚のみ
     - 8-Step Workflow:
       1. 入力検証 + 冪等性チェック（frontmatter の `visualized: true` で停止）
       2. コンテンツ分析（ASCII art / セクション構造 / 抽象概念 / タイトル抽出）
       3. **視覚化プラン提示 + コスト表示（必須承認ゲート）**
       4. Mermaid 生成と挿入（元 ASCII は残す）
       5. nano-banana 画像生成（images/{basename}/ 配下）
       6. 画像リンク挿入
       7. frontmatter 更新（`visualized: true`, `visualized_at`, `visualized_cost_usd`）
       8. 結果レポート（挿入数 + 合計コスト + diff プレビュー）
     - Gotchas（11 項目）: nano-banana 未インストール / API key 未設定 /
       コスト未承認禁止 / Mermaid 優先原則 / ASCII 削除禁止 / 冪等性 /
       画像の相対パス / 大きすぎる MD の扱い / Pro model は要相談 等
     - Reference Navigation で nano-banana / article-explainer へのポインタ

  **Phase 5-2: `references/mermaid-conversion-patterns.md`（新規）**

  新規ファイル 1 個:
  1. `~/.claude/skills/visualizing-article/references/mermaid-conversion-patterns.md` (274 行):
     - **Pattern Selection Guide** 表: ASCII/Text の特徴 → Mermaid 変換先のマッピング
     - **Pattern 1-7**: それぞれ検出トリガー + Before (ASCII) + After (Mermaid) + バリエーション
       - Pattern 1: Box Diagram → `flowchart` (LR/TD)
       - Pattern 2: Sequential Text → `sequenceDiagram` (同期/非同期/loop/alt/par)
       - Pattern 3: State List → `stateDiagram-v2`
       - Pattern 4: Hierarchical List → `mindmap`
       - Pattern 5: Timeline / Phases → `gantt` と `timeline` (2 方式)
       - Pattern 6: Decision Tree → `flowchart` with diamond decision
       - Pattern 7: Data Model → `erDiagram` with PK/FK
     - **Guidelines** (7 項目): シンプル優先 / 日本語ラベル OK / 色付け最小限 /
       長いラベル改行 / ノード ID は意味のある名前 / direction 指定 / 元 ASCII 非削除

  **Phase 5-3: 検証**

  - skill registry への登録確認（system-reminder の skill list に visualizing-article が出現）
  - `quick_validate.py /Users/camone/.claude/skills/visualizing-article` → "Skill is valid!"
  - Line count: SKILL.md = 131 行 / mermaid-conversion-patterns.md = 274 行（両方 500 行以内）
  - Frontmatter パース確認（YAML `name` + `description` 必須フィールド揃っている）

- 設計意図:

  - **`article-explainer` との責務分離**:
    入力が異なる（URL vs 既存 MD）ため、同じスキルに統合するとワークフローが
    分岐だらけになる。独立させることで:
    - `article-explainer` は URL スクレイピング + MD 生成に集中
    - `visualizing-article` は MD 解析 + 視覚強化に集中
    - 両方を連続実行するかは呼び出し側の判断（柔軟性）
    orchestrating-team-development の統括下には入れない独立系統。

  - **Mermaid 優先原則**:
    構造的コンテンツ（flowchart / sequence / state / ER）は常に Mermaid で表現する。
    nano-banana に流すのはコスト（$0.067 / 1K 画像）がかかるだけでなく、
    AI 画像生成は「構造の正確さ」より「絵の雰囲気」を優先するため、技術図解には不向き。
    AI 画像は hero（記事タイトル表現）と concept（抽象概念の視覚化）のみに限定。

  - **コスト透明性 + 承認ゲート（倫理的制約）**:
    nano-banana 呼び出し前に必ずユーザー承認を得る。AskUserQuestion で:
    ```
    視覚化プラン:
      [Mermaid] 3 箇所 ...
      [nano-banana] 3 枚（合計 $0.201）...
    このプランで実行しますか？
      - yes / mermaid-only / hero-only / no
    ```
    デフォルトでコスト 0 オプション（mermaid-only）を提示するのが重要。
    エージェントが無断で金銭的決定をしない。

  - **冪等性フラグ `visualized: true`**:
    frontmatter にフラグを立てることで同じ記事を 2 回処理しない。
    `--force` オプションで意図的に再実行可能。これがないと呼び出しミスで
    二重課金するリスクがある。

  - **ASCII art 削除禁止原則**:
    元の ASCII art は Mermaid 追加後も残す（Workflow Step 4 で明示）。
    理由:
    - 比較と検証が可能（Mermaid が誤変換でないか確認できる）
    - ターミナル表示で読みたい場合のフォールバック
    - 記事の原著作性を保持

  - **画像配置ディレクトリ `<md-dir>/images/{basename}/`**:
    記事と同じディレクトリ配下の相対パスで統一。
    - ポータビリティ: プロジェクトを移動しても壊れない
    - 記事単位のディレクトリ分割: 複数記事の画像が混在しない
    - Git にコミットする場合も管理しやすい

  - **プロンプト設計指針（nano-banana 呼び出し用）**:
    - hero: 記事タイトル + トピック + "minimal, editorial illustration, subtle gradient, clean composition"
    - concept-N: セクション要点 + "conceptual illustration, flat style, muted palette"
    AI aesthetics のデフォルト（派手・賑やか・リアル）を回避し、editorial / minimal 系を明示。
    `designing-beautiful-frontends` スキルの `references/frontend-aesthetics.md` の原則と
    整合させた。

  - **`references/mermaid-conversion-patterns.md` を別ファイルに分離した理由**:
    SKILL.md に変換パターンを全部書き込むと行数オーバー + discovery 時のコンテキスト汚染。
    Progressive disclosure 原則: メタデータは SKILL.md、詳細は references/。
    Skill 発動時は SKILL.md だけロード、必要な時に reference を読む設計。

- 副作用:

  - **skill registry への新規登録**:
    Claude Code の skill list に visualizing-article が追加された。Trigger keyword:
    "visualizing article", "記事を視覚化", "記事に図解追加", "MDをビジュアル化",
    "Mermaid化", "hero画像追加", "/visualizing-article"

  - **nano-banana CLI への依存**:
    visualizing-article は nano-banana CLI を呼び出す。nano-banana CLI 未インストール時は
    「`/nano-banana init` を案内して中断」する Gotcha を SKILL.md に明記。
    GEMINI_API_KEY も必要（未設定時は `/receive-secret` 案内）。

  - **既存記事への影響**:
    - `--force` なしで呼べば `visualized: true` の記事は処理されない（冪等性）
    - ASCII art は削除されないため、視覚化前後の記事は「上位互換」の関係
    - frontmatter に 3 フィールド追加（visualized / visualized_at / visualized_cost_usd）、
      既存フィールドは保持

  - **発見した重要な Hook 挙動（このセッションの最大の gotcha）**:
    Bash pre-tool-use hook が、**Bash コマンドが参照する skill の SKILL.md frontmatter の
    `description` フィールドに angle bracket (`<`/`>`) が含まれると実行を拒否する** ことが判明した。
    具体的には:
    - 当初 visualizing-article の frontmatter は `description: >` (YAML folded scalar) +
      本文に "MD -> visually enhanced MD" "URL -> MD" と記述していた
    - `python3 .../quick_validate.py .../visualizing-article` を Bash で実行すると
      "Description cannot contain angle brackets (< or >)" エラーで拒否される
    - branch-validator (angle bracket 無し) は同じコマンドで通る
    - Bash の description / command には angle bracket が含まれていないのに拒否される
    - 結論: hook が target path の SKILL.md を読みに行って frontmatter description を
      検査している。prompt injection 防御としての設計と推測
    **修正方針**:
    - frontmatter description から ASCII arrow (`->`) を除去、"to" に置換
    - folded scalar (`description: >`) をやめて quoted string (`description: "..."`) に変更
    - 本文中の HTML コメント `<!-- ... -->` も `[...]` 記法に変更
    修正後、quick_validate.py が Bash 経由で正常に実行でき、"Skill is valid!" 応答を得た。
    **教訓**: skill の frontmatter description では ASCII angle bracket を避け、
    日本語矢印 `→` や "to" / "from" を使う。参照ドキュメント (`references/*.md`) には
    angle bracket を自由に書ける（mermaid-conversion-patterns.md は `-->` だらけで問題なし）。

  - **テスト実行の制約**:
    E2E smoke test（実際に nano-banana を呼び出して画像生成）は今回スキップ。
    理由:
    - 実際に課金が発生する（$0.067 〜 $0.201）
    - API key 設定の前提がある
    - 承認ゲートの UI フローが AskUserQuestion に依存する（smoke test で再現困難）
    代わりに quick_validate.py での構造検証 + frontmatter パース確認 + line count 確認で
    合格とした。本格的な検証は実利用時に行う。

- 関連ファイル:

  新規作成:
  - `/Users/camone/.claude/skills/visualizing-article/SKILL.md` (131 行)
  - `/Users/camone/.claude/skills/visualizing-article/references/mermaid-conversion-patterns.md` (274 行)

  依存（参照のみ、変更なし）:
  - `/Users/camone/.claude/skills/nano-banana/SKILL.md` (CLI 仕様参照元)
  - `/Users/camone/.claude/skills/article-explainer/SKILL.md` (前段スキル、責務境界参照)
  - `/Users/camone/.claude/skills/designing-beautiful-frontends/references/frontend-aesthetics.md` (AI aesthetics 回避原則)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema evidence field)
  - Phase 1-A ✅ 完了 (orchestrating-team-development 8+1 Mode)
  - Phase 1-B ✅ 完了 (installing-hook-presets)
  - Phase 2 ✅ 完了 (defining-user-flows + spec-based-development 軽量化)
  - Phase 3 ✅ 完了 (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ✅ 完了 (spec-validator + evidence-matcher CLI 化)
  - Phase 5 ✅ 本 Phase (visualizing-article 独立スキル)
  - **全 Phase 完了** ── Q1-Q6 ハーネス強化プラン 全 6 項目の実装完了
