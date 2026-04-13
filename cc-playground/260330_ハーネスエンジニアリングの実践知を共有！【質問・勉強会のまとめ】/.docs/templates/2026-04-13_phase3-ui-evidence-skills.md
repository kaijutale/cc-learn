機能名: Q1-Q6ハーネス強化プラン Phase 3 — capturing-ui-evidence + linking-ticket-evidence 新規スキル作成

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 11:59:13
- 概要:
  Q5-①② の実装。UI 証跡を取得して ticket に紐付けるための 2 つの新規スキルを作成。
  Phase 0 で追加した ticket schema の optional `evidence` field を実際に活用する段階。
  `capturing-ui-evidence` が証跡を生成し、`linking-ticket-evidence` が ticket frontmatter に
  紐付ける ── 責務分離された 2 スキルのパイプラインとして機能する。

- 実装内容:

  **Phase 3a: `capturing-ui-evidence` 新規スキル**

  新規ファイル 2 個:
  1. `~/.claude/skills/capturing-ui-evidence/SKILL.md` (100 行):
     - 責務境界表（auditing-web-quality vs capturing-ui-evidence vs linking-ticket-evidence）
     - 6-step Workflow: 入力確認 → ディレクトリ初期化 → navigate → 3 viewport スクショ → metadata 生成 → 結果報告
     - Chrome DevTools MCP を primary mechanism として明記
     - Script commands リファレンス
  2. `~/.claude/skills/capturing-ui-evidence/scripts/capture-evidence.sh` (220 行、実行権限付):
     - `--init [--source <url>]`: タイムスタンプディレクトリ作成、パス出力
     - `--finalize <dir>`: PNG/SVG/log ファイルを走査して evidence-meta.yml 生成
     - `--list [<dir>]`: 証跡ディレクトリ一覧 or 内容表示
     - ファイル命名規約による自動分類（desktop/tablet/mobile）

  **Phase 3b: `linking-ticket-evidence` 新規スキル**

  新規ファイル 2 個:
  1. `~/.claude/skills/linking-ticket-evidence/SKILL.md` (100 行):
     - 責務: frontmatter 更新 + 本文画像リンク挿入 + schema 検証 + rollback
     - 9-step Workflow: 入力 → ticket 検索 → meta パース → backup → frontmatter 更新 → 本文追記 → 書き込み → validate → rollback (失敗時)
     - Before/After frontmatter 変更例を明示
  2. `~/.claude/skills/linking-ticket-evidence/scripts/link-evidence.py` (335 行、実行権限付):
     - `find_ticket_file()`: frontmatter の `id` フィールドを primary、filename substring を fallback でマッチ（case-insensitive）
     - `parse_markdown_with_frontmatter()`: --- 区切りで frontmatter と body を分離
     - `load_evidence_meta()`: evidence-meta.yml パース
     - `build_evidence_entries()`: ticket schema 形式への変換 + `_normalize_captured_at()` で ISO8601 Z 文字列に統一
     - `update_ticket_content()`: 既存 evidence 配列保持、本文末尾に「## 証跡」セクション追加、`updated` フィールド更新
     - `NoAliasDumper`: PyYAML の anchor/alias 生成を抑止して human-readable 出力
     - バックアップ自動作成 + validate-knowledge.py 失敗時の rollback

  **E2E 統合テスト（両スキル連携）**:
  - 合成 ticket + 5 種類の evidence ファイル (desktop/tablet/mobile PNG + architecture.svg + build.log)
  - capture-evidence.sh --init → ディレクトリ生成
  - capture-evidence.sh --finalize → evidence-meta.yml 生成（5 ファイル全て検出）
  - link-evidence.py → ticket frontmatter に 5 エントリ append
  - validate-knowledge.py pass（Phase 0 の evidence validation が動作）
  - 最終 ticket.md の出力確認: anchor なし、ISO8601 Z 文字列、画像リンク section 完備

  検証結果:
  - chmod +x 済み（capture-evidence.sh / link-evidence.py）
  - quick_validate.py: 両スキルとも "Skill is valid!" pass
  - bash -n + python3 -m py_compile: syntax 両方 OK
  - --help: 両スクリプト動作確認
  - E2E 統合テスト: 全工程 pass、最終 ticket の schema 検証 pass

- 設計意図:

  - **3 スキル責務分離の完成**:
    - `auditing-web-quality`: UI **検査** (エラー検出 + レポート)
    - `capturing-ui-evidence`: UI **証跡化** (撮影 + metadata 保存のみ)
    - `linking-ticket-evidence`: 証跡を ticket に **紐付け**
    これで記事の実践 Tips「UI テストの証跡化」セクションで提示された責務分離パターンが完成した。
    `capturing-ui-evidence` は検査を一切行わない ── SKILL.md の Gotchas と 責務境界表で明示的に除外している。

  - **`_normalize_captured_at()` の設計判断**:
    Phase 0 で学んだ PyYAML auto-parse 問題（ISO8601 文字列 → datetime 自動変換）を
    link-evidence.py 側で **明示的に正規化** する関数を設けた。
    - 入力が string: そのまま使用
    - 入力が datetime: UTC 正規化 + ISO8601 Z 文字列フォーマット
    - 入力が None: 現在 UTC 時刻
    これにより link-evidence.py の出力は常に人間にも機械にも readable な形式になる。

  - **`NoAliasDumper` の採用**:
    最初のスモークテストで PyYAML の anchor/alias 機構（`&id001` / `*id001`）が
    複数 evidence エントリに同じ captured_at を参照させた結果、ticket.md が
    難読な YAML になった。`yaml.SafeDumper` を継承して `ignore_aliases(self, data) -> True`
    に override することで anchor 生成を完全に抑止し、各エントリで captured_at を
    展開した状態で保存する。

  - **`find_ticket_file()` の多段フォールバック**:
    最初の実装は単純な `glob(f"*{ticket_id}*.md")` だったが、スモークテストで
    filename と frontmatter `id` が異なるケース（`TICKET-smoke-evidence.md` のファイル名、
    `TICKET-SMOKE` の id）を発見。修正後は:
    1. Primary: 全 ticket を走査して frontmatter `id` を case-insensitive 比較
    2. Fallback: case-insensitive filename substring match
    3. 両方失敗したら None
    これによりファイル名命名規則への依存を排除した。

  - **rollback の重要性**:
    link-evidence.py は frontmatter を書き換える破壊的操作。validate-knowledge.py が
    schema 違反を検出した場合、必ず backup から復元する設計。壊れた ticket を残さない。
    backup は `.bak.<unix_timestamp>` で命名し、link-evidence.py 完了後も保持する
    （手動 rollback 可能性のため）。

  - **`--init` と `--finalize` の分離**:
    capture-evidence.sh は "ディレクトリ作成" と "metadata 生成" を別コマンドに分離した。
    理由: スクリーンショット取得は Claude が MCP ツールで行うため、script は
    前後処理のみを担当する。`--init` で空ディレクトリを作り、Claude が MCP で
    PNG を配置し、最後に `--finalize` で metadata を scan 生成する流れ。

- 副作用:

  - **`.docs/evidence/` ディレクトリの新設**:
    プロジェクトに `.docs/evidence/` が無い場合、capture-evidence.sh が自動作成する。
    既存プロジェクトへの追加は additive（既存ファイルへの影響なし）。

  - **ticket schema 変更の活用**:
    Phase 0 で追加した optional `evidence: []` フィールドをこの Phase で初めて実際に使う。
    追加済み schema のおかげで link-evidence.py が validate-knowledge.py を通過できる。

  - **既存の `hook_post_lint.sh` 等との干渉なし**:
    新スキルは settings.json に触れないため、既存 hook に影響しない。

  - **依存関係**:
    - linking-ticket-evidence は capturing-ui-evidence の出力（evidence-meta.yml）を前提とする
    - 両方とも Phase 0 の ticket schema 拡張を前提とする
    - Python の pyyaml が必要（既存 validate-knowledge.py と同じ依存）

  - **懸念（将来対応）**:
    - Chrome DevTools MCP が利用不可の環境では capturing-ui-evidence が動かない
    - Playwright フォールバックは未実装（プランでは言及されていた）
    - `.source` マーカーファイルは finalize で削除される設計だが、finalize 失敗時に残る可能性
    - ticket の相対パス（`.docs/evidence/.../desktop.png`）はプロジェクトルート起点。異なる場所から呼ぶと path が無効になる

- 関連ファイル:

  新規作成:
  - `/Users/camone/.claude/skills/capturing-ui-evidence/SKILL.md` (100 行)
  - `/Users/camone/.claude/skills/capturing-ui-evidence/scripts/capture-evidence.sh` (220 行、実行権限付)
  - `/Users/camone/.claude/skills/linking-ticket-evidence/SKILL.md` (100 行)
  - `/Users/camone/.claude/skills/linking-ticket-evidence/scripts/link-evidence.py` (335 行、実行権限付)

  依存（参照のみ、変更なし）:
  - `/Users/camone/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` (Phase 0 で evidence validation 追加済み)
  - `/Users/camone/.claude/skills/auditing-web-quality/SKILL.md` (責務境界の参照先)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema evidence field)
  - Phase 1-A ✅ 完了 (orchestrating-team-development 8+1 Mode)
  - Phase 1-B ✅ 完了 (installing-hook-presets)
  - Phase 2 ✅ 完了 (defining-user-flows + spec-based-development 軽量化 + flow-to-mermaid CLI)
  - Phase 3 ✅ 本 Phase (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ⏳ pending (CLI化: spec-validator + evidence-matcher)
  - Phase 5 ⏳ pending (visualizing-article)
