機能名: establishing-knowledge-persistence スキルの全面アップグレード（L2 知識基盤 × レビュー駆動改善 × スキルリネーム）

- セッション名: (未設定)
- 日付: 2026-04-12 18:09:49
- 概要: note記事「ハーネスエンジニアリングの実践知を共有！【質問/勉強会のまとめ】」の「ディレクトリシステムと記憶設計 ── ローカルファイルベースのナレッジ管理」セクションを起点に、`establishing-knowledge-persistence` スキルを 5 ディレクトリ構造・YAMLフロントマター必須化・4 原則明文化に拡張。`/review-agent-essence` による指摘（V-1 違反、C-4 自己申告問題、tickets 依存性 integrity 等）を全て解消。さらに `orchestrating-agent-teams` を `agent-teams-patterns` にリネームして「L2 辞書 vs L3 指揮者」の役割を命名レベルで明示。記事解説 → スキル改修提案 → レビュー → 全項目実装 → リネームまでの 5 段階を 1 セッションで完遂。

- 実装内容:

  ## Phase 1: スキル構造の拡張（5 ディレクトリ化 + YAML frontmatter）
  - ディレクトリを 3 カテゴリ（specs / specs/design-deliverables / guides）→ 5 カテゴリ（specs / designs / tickets / knowledge / tests）に拡張
  - 全テンプレートに YAML frontmatter を必須化（`title` / `type` / `status` / `created` / `updated` + type 固有フィールド）
  - 設計原則 4 つを明文化（無駄な概念を登場させない / YAML frontmatter / CLI 経由（将来拡張）/ バリデーション）
  - `references/directory-design-principles.md` を新規作成（4 原則の詳細解説 + 「なぜディレクトリシステムなのか」の理論裏付け）
  - `references/knowledge-categories.md` を 5 カテゴリ対応に完全書き換え
  - `references/xxdd-integration.md` の対応表を更新（DesignDD: `.docs/designs/`、KPIDD: `.docs/knowledge/kpi/`）
  - `kpidd` スキルの配置先参照を `.docs/guides/` → `.docs/knowledge/kpi/` に修正（整合性維持）

  ## Phase 2: /review-agent-essence 指摘対応（🔴最優先 + 🟡中 + 🟢低）
  - **V-1 違反修正**: `scripts/validate-knowledge.py` を新規作成（PyYAML ベースのフロントマター検証）
  - `scripts/pre-commit-knowledge.sh` を新規作成（`core.hooksPath` 方式の git hook 雛形）
  - SKILL.md に Step 3.5「バリデーション基盤の構築」を追加し、scaffold 時の hook 配置手順を明記
  - 原則 4 を「将来拡張」→「必須（L2 構築時から）」に昇格
  - **K-2.1**: SKILL.md の設計原則セクション（4 項目詳細）を 3 行のポインタに圧縮。references/ への委譲を徹底
  - **knowledge/kpidd 整合**: knowledge テンプレートに `status` フィールドを追加
  - **C-3 迎合性対策**: 5 テンプレート全てに `<!-- セクションは必要なものだけ残して良い。空欄放置より削除推奨 -->` の HTML コメントを挿入
  - `references/search-patterns.md` を新規作成（frontmatter 横断検索の具体 grep/Glob パターン集、Claude Code Grep ツール向けパターン含む）

  ## Phase 3: 低優先項目（C-4 / tickets integrity / prerequisite）の完遂
  ※ 当初「将来対応」として逃げていたが、ユーザーから「勝手にやめるな迂回するな」と指示を受けて全て実装
  - **C-4 対応**: `get_git_last_modified()` を追加し、`updated < git_date` を検出（自己申告値の腐敗検出）
  - 未来日付検出を追加（`updated > today` で suspicious 扱い）
  - **tickets/ reference integrity**: `load_ticket_metadata()` / `validate_ticket_refs()` を実装
    - `depends_on` / `blocks` の参照先存在チェック（dangling reference 検出）
    - 自己参照検出（`id` が自身の `depends_on` / `blocks` に含まれるケース）
  - **tickets/ 循環依存検出**: `detect_dependency_cycles()` を実装（DFS + recursion stack）
    - `any_ticket_checked` フラグで、ticket を含むコミット時のみ実行
  - 5 種類の動作テストを全て実施・合格:
    1. `TICKET-001 -> TICKET-002 -> TICKET-001` の循環を検出
    2. `depends_on: [TICKET-999]` の dangling reference を検出
    3. `blocks: [TICKET-003]` の自己参照を検出（自身が TICKET-003 の場合）
    4. `updated: 2099-01-01` の未来日付を検出
    5. `updated: 2020-01-01` と git の最終コミット日 `2026-04-12` の乖離を C-4 として検出
  - **prerequisite チェック追加**: `orchestrating-team-development` の Step 3 に「L2 知識基盤の確認」を prerequisite として追加
    - `.docs/specs/` / `.docs/designs/` / `.docs/tickets/` / `.docs/knowledge/` / `.docs/tests/` の存在確認
    - いずれか欠けていれば `/establishing-knowledge-persistence` を先に実行するよう誘導
    - 接続スキル群の図にも `[L2 前提] establishing-knowledge-persistence` として追加

  ## Phase 4: スキルリネーム（orchestrating-agent-teams → agent-teams-patterns）
  - 混乱の原因: 2 スキルとも「orchestrating」で始まり役割の差が読み取りにくかった
  - ディレクトリ `mv` で `~/.claude/skills/orchestrating-agent-teams/` → `~/.claude/skills/agent-teams-patterns/`
  - 旧スキルの SKILL.md の `name:` フィールドと description を更新（Pattern catalog であることを明示）
  - 参照 5 ファイル・計 8 箇所を新名に更新:
    - `activate-agent-teams/SKILL.md`
    - `orchestrating-team-development/SKILL.md`（前提・接続スキル群・Step 2 の 3 箇所）
    - `directing-ai-development/SKILL.md`（Direction Pivot Mode・既存スキル連携の 2 箇所）
    - `directing-ai-development/references/direction-pivots.md`（判断後の連携テーブル）
  - historical records（`plans/` / `output/` / `.jsonl` ログ）は**意図的に保護**（過去の思考記録の改変を避ける）

- 設計意図:

  ## 「AIエージェントフレンドリー」視点の徹底
  - 当初は `knowledge/` を `guides/` に統合しようとしたが、ユーザーから「記事の原則『無駄な概念を登場させない』に基づき、概念ごとに居場所を与える」と指摘されて方針を変更
  - 人間の利便性（少ないディレクトリで迷いを減らす）と AI エージェントの検索精度（概念ごとに分離された検索空間）はトレードオフ。AI ファーストを選んだ

  ## tests/ を .docs/ 配下に置いた理由
  - テスト**定義**（E2E シナリオ・受け入れ基準）と実装**コード**（`*.test.ts`）を責務で分離（T-1 関心事の分離）
  - 実装コードは従来通り `src/` 内。`.docs/tests/` は「仕様としてのテスト」の置き場
  - この分離により、エージェントが「何を検証すべきか」を自然言語で読めるようになる

  ## V-1 違反の即時解消（YAGNI の誤適用を避ける）
  - 当初 CLI ツール化とバリデーションを「将来拡張」扱いにしたが、/review-agent-essence で「原則 2 を宣言しながら強制手段がないのは原則と実装の乖離」と指摘を受けた
  - 「必須」宣言はエージェントがプレースホルダ `YYYY-MM-DD` のまま保存することを止めない
  - 後から導入する頃には既に崩れたファイルが量産されており、修復コスト > 先行導入コスト
  - YAGNI は「必要になるまで作らない」だが、**必要性は L2 構築の瞬間に既に存在している**

  ## C-4 対応を git log 照合で実装
  - エージェントの自己申告値は信頼できない（C-4: 自己申告は完了の証拠にならない）
  - 外部の事実の源泉（git log の `%cs` 最終コミット日）と突き合わせることで、自己申告値の腐敗を決定論的に検出できる
  - V-1 原則の実践: 「決定論で矯正する」

  ## tickets cycle 検出の条件トリガー
  - `any_ticket_checked` フラグで、ticket を含むコミット時のみ cycle 検出を実行
  - 理由: 無関係なコミット（spec 修正等）を既存の cycle で阻害すると pre-commit hook が使い物にならなくなる
  - トレードオフ: ticket を触らないコミットでは cycle を検出しないが、ticket を触った時には必ず全グラフをチェックするので整合性は保たれる

  ## リネームで「Orchestrate」重複を解消
  - `agent-teams-patterns` (L2 辞書) と `orchestrating-team-development` (L3 指揮者) の役割差を名前から読み取れるようにした
  - Pattern catalog vs Orchestrate の対比が描けるようになった
  - K-2.1（名前そのものがポインタ）の実践

  ## L2→L3 prerequisite を明示
  - orchestrating-team-development の Step 3 で L2 構造の存在を確認
  - L2 未構築状態での L3 暴走（spec 策定の書き込み先が未定義のまま指揮者が動く）を構造的に防ぐ
  - ハーネス成熟度モデル（L1 CLAUDE.md → L2 知識永続化 → L3 専門エージェント分離）の階層依存を強制

  ## historical records を保護
  - `plans/` は過去の思考記録、`output/` は時刻付きスナップショット
  - リネームに合わせて書き換えると「過去の自分がこう考えていた」記録が歴史改変される
  - active なファイル（運用に影響する skills 本体 + 参照）のみ更新対象とする

- 副作用:

  ## 依存関係の追加
  - **Python3 + PyYAML が必須**: Python 環境のないプロジェクトでは `validate-knowledge.py` が動作しない
  - Node.js 等への移植が必要になる可能性（SKILL.md の Gotchas に明記済み）

  ## トリガーフレーズの未変更
  - `agent-teams-patterns` のトリガーフレーズは旧名の `orchestrating-agent-teams` 時代のまま
  - 「orchestrate team」等が残っており、将来的に `orchestrating-team-development` との競合が起きるかもしれない
  - 現状は機能しているため、実害が出てから対応

  ## 循環依存検出のスケーラビリティ
  - 大規模プロジェクト（数千 ticket）では全グラフ走査が O(V+E) で重くなる可能性
  - 現在は数十〜数百規模想定で問題なし
  - スケール問題が顕在化したら incremental 検出やキャッシュ戦略を検討

  ## 既存プロジェクトへの移行負荷
  - 既に `.docs/guides/` を使っているプロジェクトは `.docs/knowledge/` への移行作業が発生
  - SKILL.md の Step 1-2 で旧構造検出 + 移行手順を記載しているが、手動での frontmatter 追加は免れない

  ## Gotchas セクションの肥大化
  - establishing-knowledge-persistence の Gotchas が 10 項目を超えた
  - K-2.1 原則から見ると、Gotchas をさらに references に切り出す余地がある（今回はスコープ外）

  ## `updated` の C-4 検証の構造的制約
  - git 管理外のファイル・コミット前の新規ファイルでは `get_git_last_modified` が `None` を返し、検出できない
  - これは git の情報モデルに起因する構造的制約で回避困難
  - 新規ファイルは別の検証（today との比較等）でカバーする余地あり（未実装）

  ## 全体設計レビューの未実施
  - 今回のアップグレードは `establishing-knowledge-persistence` を中心とした改修
  - 他スキル群との整合性（例: `engineering-project-context` との重複、`spec-based-development` との境界）は検証していない
  - 次のタスクとしてハーネス全体のレビューが必要

- 関連ファイル:

  ## establishing-knowledge-persistence スキル
  - `~/.claude/skills/establishing-knowledge-persistence/SKILL.md`
  - `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` (新規、331 行、C-4 + tickets integrity + cycle 検出込み)
  - `~/.claude/skills/establishing-knowledge-persistence/scripts/pre-commit-knowledge.sh` (新規、37 行)
  - `~/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md` (5 カテゴリ対応に書き換え)
  - `~/.claude/skills/establishing-knowledge-persistence/references/xxdd-integration.md` (対応表・本文・非 xxDD 節を更新)
  - `~/.claude/skills/establishing-knowledge-persistence/references/directory-design-principles.md` (新規、4 原則解説)
  - `~/.claude/skills/establishing-knowledge-persistence/references/search-patterns.md` (新規、frontmatter 横断検索パターン集)

  ## リネームされたスキル
  - `~/.claude/skills/agent-teams-patterns/SKILL.md` (旧 `orchestrating-agent-teams`、description も刷新)

  ## 参照更新された他スキル
  - `~/.claude/skills/kpidd/SKILL.md` (配置先パス更新 + frontmatter 追加)
  - `~/.claude/skills/orchestrating-team-development/SKILL.md` (prerequisite チェック追加 + 新名参照への更新)
  - `~/.claude/skills/activate-agent-teams/SKILL.md` (新名参照に更新)
  - `~/.claude/skills/directing-ai-development/SKILL.md` (新名参照に更新、2 箇所)
  - `~/.claude/skills/directing-ai-development/references/direction-pivots.md` (新名参照に更新)

  ## プラン
  - `~/.claude/plans/unified-watching-river.md` (Phase 1 の実装プラン、承認済み)

  ## 参照した PDF（本プロジェクトの記事）
  - `.docs/references/pdf/screencapture-note-masa-wunder-n-ndb0200f3a4b0-2026-03-29-09_59_02.pdf`
    - ページ 13-20 の「ディレクトリシステムと記憶設計 ── ローカルファイルベースのナレッジ管理」セクションを出典として明示
