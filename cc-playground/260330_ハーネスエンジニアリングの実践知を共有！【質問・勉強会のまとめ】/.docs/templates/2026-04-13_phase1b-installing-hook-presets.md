機能名: Q1-Q6ハーネス強化プラン Phase 1-B — installing-hook-presets 新規スキル作成

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 11:37:03
- 概要:
  Q1-Q6 プランの Phase 1-B を実装。新規スキル `installing-hook-presets` を作成し、
  Claude Code の PostToolUse / PreToolUse hook を「preset カタログ + jq-powered diff/apply」
  の二段構成で user skill から安全にインストールできるようにした。
  **設計上の重要な判断**: Claude Code の built-in `/update-config` skill を **wrap しない**。
  user skill から built-in skill の内部制御はできないため、代替として「決定論的な jq merge
  + ユーザー承認 diff」という透明性の高い CLI 経路を独立して提供する。

- 実装内容:
  新規作成ファイル 6 個:
  1. `~/.claude/skills/installing-hook-presets/SKILL.md` (132 行):
     - Prerequisites / 7-step Workflow / Built-in との使い分け / Gotchas
     - 設計方針セクションで「wrap しない」理由を明示
  2. `~/.claude/skills/installing-hook-presets/references/presets/format-on-write.md` (96 行):
     - PostToolUse(Edit|Write) で prettier / black / gofmt / rustfmt 実行
     - Hook script 内容 + settings.json JSON 断片
  3. `~/.claude/skills/installing-hook-presets/references/presets/lint-on-write.md` (102 行):
     - PostToolUse(Edit|Write) で eslint / ruff / golangci-lint / clippy 実行
     - format-on-write との併用順序ルール記載
  4. `~/.claude/skills/installing-hook-presets/references/presets/test-on-save.md` (114 行):
     - PostToolUse(Edit|Write) で vitest --related / pytest --testmon 等
     - 「使うべきでない」条件を明示（E2E 絡み・テスト未整備・hotfix 中）
  5. `~/.claude/skills/installing-hook-presets/references/presets/secret-block-on-read.md` (119 行):
     - PreToolUse(Read) で .env / id_rsa / *.pem / 等をブロック（exit 1）
     - CLAUDE.md の 3 層ハイブリッドモデル L1 に対応
  6. `~/.claude/skills/installing-hook-presets/scripts/apply-preset.sh` (268 行):
     - `--list` / `--dry-run <preset>` / `--apply <preset>` / `--revert <preset>`
     - bash + jq による deep merge（hook 配列を concat する独自実装）
     - バックアップ自動作成（`~/.claude/backups/settings.json.<timestamp>.before-<preset>`）

  検証:
  - `chmod +x apply-preset.sh` 完了
  - `authoring-skills/scripts/quick_validate.py` = "Skill is valid!" で pass
  - `bash -n apply-preset.sh` syntax check pass
  - `apply-preset.sh --list` で 4 preset 正しく列挙
  - `apply-preset.sh --help` で usage 表示
  - `apply-preset.sh --dry-run format-on-write` で:
    - preset MD から JSON 断片を正しく抽出
    - 現在の settings.json との diff 表示
    - **既存の `Edit|Write` matcher block を破壊せず、新しい matcher block として append**
    - hook script 未作成を検知して apply 時に作成することを案内

- 設計意図:
  - **Wrap しない設計の根拠**: user skill のサンドボックス分離により、built-in skill の内部状態
    を直接操作することはできない。代わりに `~/.claude/settings.json` を read → jq で merge →
    diff 提示 → ユーザー承認 → write という透明な手順を取る。ユーザーは全段階で diff を確認できる。
  - **外部 bash スクリプト参照型の採用**: user 環境の既存 hook 設定（`hook_post_lint.sh` 等）を
    調査し、そのパターンに倣って preset も `~/.claude/hooks/preset-<name>.sh` に bash スクリプト
    を置き、settings.json から参照する形にした。inline command でない理由:
    - JSON 内の shell escape が複雑化しない
    - 既存 hook と同じ設計パターンで読みやすい
    - 編集・デバッグが容易
  - **jq deep merge の独自実装**: jq の `*` 演算子は配列を置換してしまうため、hook 配列を
    concat する専用ロジックを書いた。`group_by(.key) | map({key, value: (map(.value) | add)})`
    で PreToolUse / PostToolUse の配列を正しく結合する。
  - **新 matcher block として append する判断**: user の既存 `Edit|Write` matcher block には
    既に `hook_post_lint.sh` / `hook_post_emoji_check.sh` が登録されている。新しい preset を
    **同じ** matcher block に差し込むと既存構造を乱すため、**新しい matcher block を追加** する
    方針にした。Claude Code は同じ matcher の複数 block を順次実行するので機能上は等価。
  - **プリセット 4 種類の選定基準**: プランで指定された「最も頻度が高く、効果が分かりやすい」
    ラインアップを採用。format は品質向上、lint は早期発見、test は TDD 補強、secret-block は
    セキュリティ壁強化 ── それぞれ異なる価値を提供する。
  - **`--revert` コマンドを最初から用意**: hook 追加は user 体験に直接影響するため、
    「気に入らなかったら元に戻せる」確実性が重要。適用前のバックアップを自動作成し、
    `--revert <preset>` で直近のバックアップから復元できるようにした。

- 副作用:
  - **`installing-hook-presets` スキル自体**: セッション中にスキル一覧に登録された（system-reminder
    で確認）。他スキルへの命名衝突なし。
  - **`~/.claude/settings.json` への実影響**: 本セッションでは **変更していない**。
    --dry-run のみを実行し、実際の --apply は行っていない。
  - **`~/.claude/hooks/` ディレクトリ**: 現時点で新規ファイルは追加していない。
    --apply 実行時に `preset-<name>.sh` が作成される設計。
  - **`~/.claude/backups/` ディレクトリ**: apply 時に自動作成される。現時点で存在しない。
  - **既存 hook との潜在的重複**: `hook_post_lint.sh` が既に Edit|Write で動いているため、
    lint-on-write preset を追加すると二重 lint になる可能性。SKILL.md の Gotchas で警告済み。
  - **懸念（将来対応）**:
    - preset の追加/削除時は SKILL.md + apply-preset.sh の AVAILABLE_PRESETS 配列を同時更新要
    - jq のバージョン依存（deep merge ロジックが古い jq で動かない可能性）
    - Claude Code の hook stdin JSON 形式が将来変更されたら hook script の jq パスも更新要

- 関連ファイル:
  - `/Users/camone/.claude/skills/installing-hook-presets/SKILL.md` (新規、132 行)
  - `/Users/camone/.claude/skills/installing-hook-presets/references/presets/format-on-write.md` (新規、96 行)
  - `/Users/camone/.claude/skills/installing-hook-presets/references/presets/lint-on-write.md` (新規、102 行)
  - `/Users/camone/.claude/skills/installing-hook-presets/references/presets/test-on-save.md` (新規、114 行)
  - `/Users/camone/.claude/skills/installing-hook-presets/references/presets/secret-block-on-read.md` (新規、119 行)
  - `/Users/camone/.claude/skills/installing-hook-presets/scripts/apply-preset.sh` (新規、268 行、実行権限付)
  - `/Users/camone/.claude/plans/rippling-munching-blanket.md` (参照: プラン定義)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema 拡張)
  - Phase 1-A ✅ 完了 (orchestrating-team-development に 8+1 Mode 選択)
  - Phase 1-B ✅ 本 Phase
  - Phase 2 ⏳ pending (defining-user-flows + spec-based-development 改修)
  - Phase 3 ⏳ pending (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ⏳ pending (CLI化: spec-validator, flow-to-mermaid, evidence-matcher)
  - Phase 5 ⏳ pending (visualizing-article)
