機能名: CLAUDE.md アップデート（steipete AGENTS.MD 比較分析）

- セッション名: N/A
- 日付: 2026-03-26 16:39:04（最終更新）/ 2026-03-26 16:07:26（初回）
- 概要: steipete/agent-scripts の AGENTS.MD と ~/.claude/CLAUDE.md を全セクション比較し、CLAUDE.md の追記・修正 + rules/ ファイルの整理を4ラウンドに分けて実施。
- 実装内容:
  - 第1ラウンド（新規追記6項目）:
    1. コミット規約: Conventional Commits 形式を新セクションとして追加
    2. PR レビュー: コメント取得・返信・スレッド解決のワークフローを新セクションとして追加
    3. ドキュメント: API/挙動変更時のドキュメント更新義務を新セクションとして追加
    4. Web検索戦略: ツール優先順位セクションに検索手法のガイダンスを追記
    5. リグレッションテスト: Build / Test セクションにバグ修正時のテスト追加ルールを追記
    6. 編集スコープ制御: Git セクションに一括置換スクリプト禁止を追記
  - 第2ラウンド（修正3 + 追記4 = 7箇所）:
    1. 移動: `ファイルは ~500行以内` を Git → Language/Stack へ（汎用コーディングルールとして再配置）
    2. 修正: Build gate に `docs` 追加（lint/typecheck/tests → lint/typecheck/tests/docs）
    3. 修正: `gh api` に `--paginate` フラグ追加（PRコメント取得漏れ防止）
    4. 追記: upstream ファイル取り込み手順（/tmp/ ステージ → cherry-pick）
    5. 追記: 大きな差分レビューコマンド（`git --no-pager diff --color=never`）
    6. 追記: コマンド入力＝同意ルール（かもねが明示的にコマンドを打てば確認不要）
    7. 追記: オブザーバビリティ（ログ・ブラウザツール等で実行結果を観測可能に保つ）
  - 第3ラウンド（rules/ ファイル整理）:
    - 判定基準: 「エージェント向け行動指示として機能するか」で A（書き直す）/ C（削除）を判定
    - 削除（trash）6ファイル:
      - `cc-best-practice-compliance.md` — インデックスファイル。自動ロードされるため不要
      - `bp-workflow.md` — ユーザーの Plan Mode 操作ガイド。エージェント指示ではない
      - `bp-context.md` — ユーザーのプロンプト作成テクニック。エージェント指示ではない
      - `bp-communication.md` — ユーザー向け。CLAUDE.md に Interview 記載済み
      - `bp-session.md` — ユーザーの操作ガイド（Esc, /clear 等）。エージェント指示ではない
      - `code-modification-rules.md` — 3行のルール。CLAUDE.md に吸収（Agent Protocol セクション）
    - 書き直し2ファイル（エージェント向け行動指示に変換）:
      - `bp-verification.md` — 「自分の作業を自分で検証する」原則（7行）
      - `bp-failure-patterns.md` — 「2回失敗したら/clear提案」「調査スコープ制限」「CLAUDE.md編集時は短く」（5行）
  - 第4ラウンド（Agent Protocol セクション新設）:
    - CLAUDE.md の各セクションを「ドメイン固有か汎用か」で仕分け
    - 汎用ルール4項目を Git / Language/Stack から抽出し、Agent Protocol セクションに集約:
      1. `削除は trash を優先` — Git から移動
      2. `新しい依存: ヘルスチェック` — Language/Stack から移動
      3. `ファイルは ~500行以内` — Language/Stack から移動
      4. `コード内コメントに絵文字なし` — Language/Stack から移動（元 code-modification-rules.md）
- 設計意図:
  - 第1-2ラウンド: steipete の AGENTS.MD から汎用的に有用な項目を選別して取り込み。個人固有の項目は除外
  - 第3ラウンド: rules/ ファイルは CLAUDE.md と同様にエージェントが読むファイル。ユーザー向けガイドとして書かれた内容は「エージェントの行動に影響しない指示」としてコンテキストを消費するだけだったため、削除または書き直し。8ファイル ~200行 → 2ファイル ~12行（90%削減）
  - 第4ラウンド: steipete の Agent Protocol セクションの設計意図（汎用ルールの受け皿）を理解した上で、かもねの CLAUDE.md にも同セクションを新設。ドメイン別セクションに紛れていた汎用ルールを正しい場所に配置
- 副作用:
  - CLAUDE.md: 103行 → 128行（+25行）。Agent Protocol 新設分を含む
  - rules/: 8ファイル ~200行 → 2ファイル ~12行。毎セッションのコンテキスト消費が大幅削減
  - 合計: ~324行 → ~140行（57%削減）
  - 削除した rules 6ファイルは trash に入っているため復元可能
- 関連ファイル:
  - `~/.claude/CLAUDE.md`
  - `~/.claude/rules/cc-bp/bp-verification.md`（書き直し）
  - `~/.claude/rules/cc-bp/bp-failure-patterns.md`（書き直し）
  - 参照元: https://github.com/steipete/agent-scripts/blob/main/AGENTS.MD
