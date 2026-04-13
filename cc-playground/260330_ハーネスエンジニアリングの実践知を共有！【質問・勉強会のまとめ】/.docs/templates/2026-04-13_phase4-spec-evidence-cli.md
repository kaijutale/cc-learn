機能名: Q1-Q6ハーネス強化プラン Phase 4 — spec-validator + evidence-matcher CLI化 + branch-validator 薄ラッパ化

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 13:20:00
- 概要:
  Q4 の実装。branch-validator と linking-ticket-evidence スキルから「決定論的に判定可能な処理」を
  独立 CLI として切り出した。branch-validator は spec-validator CLI を呼び出す薄いラッパーになり、
  意味判断（AC 文言と実装コードのマッピング）だけを SKILL.md 側 LLM が担当する。
  evidence-matcher は read-only の整合性検証 CLI として新設、link-evidence.py（write）と責務分離。
  Plan Gotcha #5「branch-validator の LLM 判断部分まで CLI化しない」を厳守した設計。

- 実装内容:

  **Phase 4a-1: `spec-validator` CLI（新規）**

  新規ファイル 1 個:
  1. `~/.claude/skills/branch-validator/scripts/spec-validator` (324 行、実行権限付):
     - サブコマンド 3 種:
       - `check <spec>`: frontmatter + AC checkbox + file_refs を構造化抽出
       - `diff --spec <path> --base <ref>`: git diff と spec の cross-reference
       - `pre-pr --base <ref> [--specs-dir DIR]`: 複数 spec 自動走査サマリー
     - 出力形式: `--format json`（デフォルト・機械可読）/ `--format markdown`（人間可読）
     - 正規表現定数:
       - `FRONTMATTER_RE`: YAML front matter 抽出
       - `AC_CHECKBOX_RE`: `- [ ]` / `- [x]` 検出
       - `AC_SECTION_RE`: `## Acceptance Criteria` セクション抽出（日本語 "受入条件" 等も対応）
       - `FILE_REF_RE`: バッククォート内のファイル参照（`.\w{1,8}` 拡張子）
     - `file_matches()`: basename は完全一致、path 付きは endswith で誤検知回避
       （substring match は `login.ts` が `logintest.ts` に誤マッチするため不採用）
     - Exit codes: 0=OK / 1=構造問題 / 2=CLI error / 3=依存エラー（pyyaml）
     - `parents=[common]` argparse パターンで `--format` をグローバルとサブコマンドの
       両方位置で受け付ける

  **Phase 4a-2: `branch-validator` SKILL.md 薄ラッパ化**

  改修ファイル 1 個:
  1. `~/.claude/skills/branch-validator/SKILL.md` (65 → 126 行):
     - 責務分離表を新設（CLI = 決定論 / SKILL.md = 意味判断）
     - Workflow 4 Step 化:
       - Step 1: `spec-validator pre-pr` で全体像取得
       - Step 2: 関連 spec ごとに `check` + `diff`
       - Step 3: 意味的照合（AC 文言と git diff の意味マッピング）
       - Step 4: 最終レポート（Implemented / Missing / Undocumented）
     - CLI が返す JSON フィールドを明示的に文書化（ac_items, referenced, undocumented, spec_only）
     - 既存の「テスト結果を決定論的根拠にする」原則は Gotchas に保持

  **Phase 4b-1: `evidence-matcher` CLI（新規、read-only）**

  新規ファイル 1 個:
  1. `~/.claude/skills/linking-ticket-evidence/scripts/evidence-matcher` (277 行、実行権限付):
     - 単一サブコマンド `check` + オプション:
       - `--tickets-dir DIR`（default: .docs/tickets）
       - `--evidence-dir DIR`（default: .docs/evidence）
       - `--ticket ID`（特定 ticket に絞る）
     - 検出する 2 種類の不整合:
       - **orphans**: ファイルシステム上にあるが どの ticket も参照していない evidence ファイル
       - **dead_links**: ticket frontmatter の evidence entry が存在しないファイルを指している
     - `evidence-meta.yml` は自動で除外
     - Exit codes: 0=OK / 1=不整合検出 / 2=CLI error / 3=依存エラー
     - read-only 保証: ticket も evidence ファイルも一切変更しない → CI からも安全に呼べる

  **Phase 4b 補助: `linking-ticket-evidence` SKILL.md 追記**

  改修ファイル 1 個:
  1. `~/.claude/skills/linking-ticket-evidence/SKILL.md` (101 → 111 行):
     - 「Verification (read-only)」セクション追加
     - Reference Navigation に evidence-matcher を追加

  **検証結果**:
  - Python `py_compile`: spec-validator / evidence-matcher 両方 OK
  - `quick_validate.py`: branch-validator / linking-ticket-evidence 両方 "Skill is valid!"
  - spec-validator smoke tests:
    - `check` on 4-AC spec → exit 0, 4 AC items, 4 file refs（Notes セクションの middleware.ts も自動検出）
    - `check` on broken spec (no frontmatter, no AC) → exit 1 with 2 warnings
    - `check` on missing file → exit 1 with error
    - `--format markdown` でチェックボックス一覧付きレポート出力
    - `pre-pr --base HEAD` で 2 spec を走査、テーブル形式出力
    - `diff --spec --base HEAD` で cross-reference セクション出力
  - evidence-matcher smoke tests:
    - 合成 ticket (TICKET-001 with 2 evidence refs, 1 存在 / 1 dead) + 2 evidence files (1 referenced / 1 orphan)
    - 期待通り 1 orphan + 1 dead_link を検出、exit 1
    - evidence-meta.yml は orphan 判定から除外されることを確認
    - TICKET-002 (evidence: 無し) が `tickets_with_evidence` から除外されることを確認
    - `--format markdown` レポート出力確認

- 設計意図:

  - **CLI と LLM の責務分離（Plan Gotcha #5 遵守）**:
    spec-validator は「事実の取り出し」のみを行う: AC checkbox リスト、frontmatter 構造、
    file_refs、git diff、cross-reference。これらはすべて正規表現と git コマンドで
    決定論的に求まる。一方「この AC は実装されているか？」という意味判断は
    SKILL.md 側の LLM が担当する。具体的には:
    - LLM は CLI の JSON を読んで、`ac_items[].text` を git diff のコード変更と意味マッピング
    - LLM は `undocumented` ファイルが「spec 更新が必要か / 不要コード除去か」を判断
    - CLI はここに一切関与しない

  - **`parents=[common]` argparse パターンの採用**:
    最初の実装では `--format` をメインパーサーにのみ定義していたが、
    `spec-validator pre-pr --format markdown ...` のように
    subcommand の**後ろ**に書くとエラーになる UX 問題を smoke test で発見。
    `argparse.ArgumentParser(add_help=False)` で共通 parser を作り、
    main と各 subparser の両方に `parents=[common]` で渡す慣用句で解決。
    これで `--format` は subcommand の前にも後にも書ける。
    evidence-matcher にも同じパターンを適用。

  - **evidence-matcher を read-only にした理由**:
    `link-evidence.py`（既存）が evidence を ticket に追加する write 側。
    evidence-matcher は逆に「整合性を確認する read 側」として分離した。
    read-only であることで:
    - CI / pre-commit hook から副作用ゼロで呼べる
    - `--ticket` フィルタ付きでも状態を壊さない
    - 既存の validate-knowledge.py（スキーマ検証）と責務が補完関係になる
      （スキーマ = 各 entry の形式 / matcher = ファイル実在と cross-reference）

  - **`file_matches()` の厳密化**:
    初期設計は `spec_ref in git_file or git_file.endswith(spec_ref)` だったが、
    `login.ts` が `logintest.ts` に誤マッチする false positive を発見。
    修正後は:
    1. spec_ref にスラッシュが含まれる（path 指定）→ `git_file == spec_ref` または `.endswith("/" + spec_ref)`
    2. spec_ref が basename のみ → `Path(git_file).name == spec_ref` で完全一致
    これで誤マッチゼロ。

  - **branch-validator SKILL.md の構造**:
    既存 SKILL.md は 65 行で「照合ワークフロー」と「3 カテゴリ判定基準」と
    「テスト優先則」を含んでいた。今回の薄ラッパ化では:
    - CLI 呼び出しを Workflow Step 1-2 として追加
    - CLI が返す JSON フィールドを「Step 3 入力データ」として明示
    - 既存の判定基準（Implemented/Missing/Undocumented）は「Step 3 出力」として保持
    - テスト優先則や「大きなブランチの精度低下」等の既存 Gotchas はすべて保持
    新しい知識を**追加**し、既存の賢い原則は**消さない**方針。

  - **CLI が生成する JSON の互換性**:
    `check` / `diff` / `pre-pr` はそれぞれ異なるスキーマを返すが、共通して
    `error` キーでエラー時の情報を返す。Markdown レンダラー (`to_markdown()`) は
    dict のキー存在で形式を判別するディスパッチ方式で対応（`if "per_spec" in data` 等）。

- 副作用:

  - **`~/.claude/skills/branch-validator/scripts/` ディレクトリの新設**:
    branch-validator は既存スキルだが、scripts/ サブディレクトリは今回初めて作成された。

  - **skill registry への登録**:
    `branch-validator` と `linking-ticket-evidence` は SKILL.md の修正のみなので
    名前・description に変更なし。既存の trigger keyword もそのまま有効。

  - **ハーネス運用への影響**:
    branch-validator を呼び出す側（orchestrating-team-development 等）は SKILL.md レベルで
    同じように使える（API 互換）。内部的に CLI が走るかどうかは ラッパー側で透過。

  - **依存関係**:
    - spec-validator / evidence-matcher 両方とも pyyaml 必須（validate-knowledge.py / link-evidence.py と同じ）
    - spec-validator は git コマンドが PATH にある必要あり（diff / pre-pr 実行時のみ）
    - evidence-matcher は git に依存しない（純粋にファイルシステム検査）

  - **既存 CLI パターンとの統一**:
    両 CLI とも link-evidence.py と同じ argparse + pyyaml + Python3 構造。
    CLI 追加時のメンテナ学習コストを最小化している。

  - **発見した Hook 挙動（gotcha）**:
    ユーザー環境の Bash pre-tool-use hook が SKILL.md の frontmatter `description`
    フィールドに angle bracket (`<`/`>`) が含まれると Bash 実行を拒否することが判明。
    Phase 4 の成果物では該当なし（branch-validator の description は既存のまま）だが、
    Phase 5 で影響を受けた → Phase 5 log で詳述。

- 関連ファイル:

  新規作成:
  - `/Users/camone/.claude/skills/branch-validator/scripts/spec-validator` (324 行、実行権限付)
  - `/Users/camone/.claude/skills/linking-ticket-evidence/scripts/evidence-matcher` (277 行、実行権限付)

  改修:
  - `/Users/camone/.claude/skills/branch-validator/SKILL.md` (65 → 126 行)
  - `/Users/camone/.claude/skills/linking-ticket-evidence/SKILL.md` (101 → 111 行)

  依存（参照のみ、変更なし）:
  - `/Users/camone/.claude/skills/linking-ticket-evidence/scripts/link-evidence.py` (write 側、既存)
  - `/Users/camone/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` (スキーマ検証、既存)
  - `/Users/camone/.claude/skills/authoring-skills/scripts/quick_validate.py` (スキル検証、既存)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema evidence field)
  - Phase 1-A ✅ 完了 (orchestrating-team-development 8+1 Mode)
  - Phase 1-B ✅ 完了 (installing-hook-presets)
  - Phase 2 ✅ 完了 (defining-user-flows + spec-based-development 軽量化)
  - Phase 3 ✅ 完了 (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ✅ 本 Phase (spec-validator + evidence-matcher CLI 化)
  - Phase 5 ✅ 完了 (visualizing-article、同セッション内で実施)
