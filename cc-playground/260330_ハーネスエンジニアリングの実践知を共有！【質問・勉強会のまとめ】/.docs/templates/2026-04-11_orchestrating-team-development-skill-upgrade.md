機能名: orchestrating-team-development スキル改修（フェーズゲート修正 + リネーム）

- セッション名: ハーネスエンジニアリング勉強会まとめ解説
- 日付: 2026-04-11 10:49:18
- 概要: noteの「ハーネスエンジニアリングの実践知」記事セクション「スペック駆動開発の再来」の解説から発展し、executing-agent-team-workflowスキルのフェーズゲートに構造的欠陥（検証ステップ欠落・フィードバックループ未構造化）を発見。PDF参照元（next-ai-agent-leap-and-harness.pdf）の7ステップパイプラインに基づき修正。
- 実装内容:
  1. パイプライン修正（7 Tasks → 8 Tasks）
     - Task 5「検証」を追加（tests + lint + branch-validator）— 実装とレビューの間に配置
     - Task 7「フィードバック反映」を追加 — レビュー後のループ構造（max 3 rounds）
     - branch-validatorをレビュー後→レビュー前（検証Task内）に移動
  2. スキルリネーム
     - executing-agent-team-workflow → orchestrating-team-development
     - ディレクトリ移動、フロントマター・タイトル・trigger words・接続スキル図を全更新
  3. phase-gate-protocol.md更新
     - パイプライン定義を8 Task構造に変更
     - 「検証タスクの内容」セクション新設（検証項目テーブル付き）
     - 「フィードバックループ」セクション新設（旧「フィードバックループの上限」を統合・拡張）
     - 依存関係の設定方法を新Task構造に対応
  4. SKILL.md追加修正
     - 判断ポイントテーブルに「フィードバックループ3ラウンド到達」行追加
     - 規模別ガイドのFullパイプライン表記を更新
     - Gotchasに2項目追加（検証の意義、フィードバックループ上限の理由）
- 設計意図:
  - 「検証」と「レビュー」の分離: 定量的・自動化可能な品質チェック（検証）と定性的判断（レビュー）は本質的に異なる。壊れたコードをレビューしても意味がない
  - フィードバックのTask化: スキル自身が「口頭指示は破られる、タスク依存関係で強制する」と主張していたが、フィードバックだけがreferenceの散文だった設計矛盾を解消
  - branch-validatorの位置移動: Shift Left原則。spec準拠確認をレビュー後（遅い）からレビュー前（早い）に移動し、手戻りを最小化
  - リネーム: 「executing-」は動作を表すだけで役割が不明。「orchestrating-team-development」で「チーム開発をオーケストレーションする指揮者」であることを直感的に表現
- 副作用:
  - 旧名executing-agent-team-workflowのセッション履歴参照が切れる（機能影響なし、歴史記録のみ）
  - パイプラインTask数が7→8に増加。小規模タスクへの適用時にコスト増の可能性があるが、規模別ガイドで「小規模は本スキル不要」と明記済み
- 関連ファイル:
  - `~/.claude/skills/orchestrating-team-development/SKILL.md`
  - `~/.claude/skills/orchestrating-team-development/references/phase-gate-protocol.md`
  - 参照元PDF: `/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260324_私たちを待ち受ける、次なるAIエージェントの飛躍.../. docs/references/pdf/next-ai-agent-leap-and-harness.pdf`
  - 参照元note記事: `https://note.com/masa_wunder/n/ndb0200f3a4b0`
