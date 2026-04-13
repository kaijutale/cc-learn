機能名: Q1-Q6ハーネス強化プラン Phase 0 — ticket schema evidence フィールド追加（additive migration）

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 11:14:07
- 概要:
  note記事「ハーネスエンジニアリングの実践知を共有！【質問・勉強会のまとめ】」から導出された Q1-Q6 プランの Phase 0 を実装。
  Phase 3（capturing-ui-evidence / linking-ticket-evidence）の実装前提として、
  `establishing-knowledge-persistence` スキルの ticket schema に optional な `evidence` フィールドを追加する。
  後続スキルが ticket と UI 証跡（スクリーンショット・構成図・ログ）を構造的にリンクできるようにする
  スキーマ基盤の先行構築。プラン上は「最優先ブロッカー」と位置付けられていた。

- 実装内容:
  1. `~/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md`:
     - ticket テンプレートの frontmatter に `evidence: []  # optional` を追加
     - テンプレート下部に additive フィールドの構造説明セクションを追記
       （path / type / viewport / captured_at の型定義を `validate_evidence()` へのポインタ付きで記述）
  2. `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py`:
     - `ISO8601_RE` 定数追加（`YYYY-MM-DDTHH:MM:SS[.sss]Z` パターン）
     - `VALID_EVIDENCE_TYPES = {screenshot, diagram, log}`
     - `VALID_EVIDENCE_VIEWPORTS = {desktop, tablet, mobile}`
     - `validate_evidence(fm: dict)` 関数新設
       （evidence 未定義/空配列は早期 return で additive 保証）
     - `validate_file()` 内の ticket 判定ブロックから呼び出しを追加
     - PyYAML auto-parse 対応: `captured_at` が datetime または str のどちらでも受け入れる二重 isinstance 分岐
  3. E2E 検証（一時 fixture で 7 種類のシナリオ）:
     - 旧 ticket（evidence フィールド無し）: pass ✓
     - 新 ticket（有効 evidence 配列: screenshot/diagram/log 混在、viewport 3種、fractional seconds 含む）: pass ✓
     - 空 evidence 配列 `[]`: pass ✓
     - screenshot without viewport: 1 件エラー ✓
     - 不正な type enum (`hologram`): 1 件エラー ✓
     - 不正な ISO8601 形式（スペース区切り）: 1 件エラー ✓
     - `evidence: "wrong"` (not a list): 1 件エラー ✓

- 設計意図:
  - **Additive migration の厳守**: 既存 ticket ファイルを一切変更せずに新機能を載せる。
    `evidence` が未定義なら検証ロジックごと skip する設計で、既存プロジェクトの ticket は無変更で通過する。
  - **PyYAML auto-parse 対応（YAML 1.1 罠への対処）**:
    ISO8601 文字列 `2026-04-13T14:30:22Z` を PyYAML が `datetime.datetime` オブジェクトに自動変換する
    既知の罠に対応。validator は `isinstance(datetime.datetime)` と `isinstance(str)` の両方を受け入れ、
    前者は `utcoffset() == timedelta(0)` で UTC 強制、後者は `ISO8601_RE` regex で検証。
    これにより、ユーザーがクオートありでもなしでも同じ仕様を満たせる。
  - **Optional field pattern**: `ticket` type の `REQUIRED_FIELDS` には追加せず、
    `validate_evidence()` 内で「存在チェック → 型チェック → enum/format チェック」の順で段階的検証。
    エラー時は具体的に何番目の要素の何が問題かを特定できる error message 設計。
  - **責務分離**: `evidence[*].path` の実ファイル存在確認は validator では行わない（CI 側で別途実施）。
    理由: git 管理されていない一時 screenshot ファイルを誤って reject しないため。
    Phase 3 実装時に CI hook の追加で補完する。
  - **既存コードへの干渉ゼロ**: `validate_ticket_refs()` と `detect_dependency_cycles()` は無変更、
    呼び出し順序も保持。新規コードは validate_file() の末尾に追加したのみ。

- 副作用:
  - 既存 ticket ファイルへの影響: **ゼロ**（additive のため）
  - 既存 validator ロジックへの影響: **ゼロ**（新規関数追加と新規呼び出しのみ）
  - **PyYAML datetime auto-parse** の罠は `created`/`updated` フィールドにも該当するが、
    既存コードは `str(date_val)` で文字列化してから正規表現チェックしているため影響なし。
    今回学んだ点: `date_val` は実は `datetime.date` オブジェクト（`YYYY-MM-DD` から自動変換）で、
    `str()` で `'YYYY-MM-DD'` に戻るため偶然動いていた。
  - **懸念（Phase 3 で対応予定）**:
    - `evidence[*].path` の存在保証なし → CI で hook 追加要
    - validator が tickets 専用のため、将来 spec や design にも evidence を載せたくなった場合は構造変更要
  - **破壊的変更なし**: 既存プロジェクトで pre-commit gate 通過済みの全 ticket は引き続き pass する

- 関連ファイル:
  - `/Users/camone/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md` (修正)
  - `/Users/camone/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` (修正)
  - `/Users/camone/.claude/plans/rippling-munching-blanket.md` (参照: プラン定義)

- 関連 Phase（後続作業）:
  - Phase 1-A: `orchestrating-team-development` に 8+1 Execution Mode 選択を追加（次の着手予定）
  - Phase 1-B: `installing-hook-presets` 新規スキル作成（Phase 1-A と並行可能、依存なし）
  - Phase 2: `defining-user-flows` 新設 + `spec-based-development` 軽量化（Phase 1 後）
  - Phase 3: `capturing-ui-evidence` / `linking-ticket-evidence` 新設（**本 Phase 0 に依存**）
  - Phase 4: `spec-validator` / `flow-to-mermaid` / `evidence-matcher` の CLI 化
  - Phase 5: `visualizing-article` 新設（独立系統、いつでも可）
