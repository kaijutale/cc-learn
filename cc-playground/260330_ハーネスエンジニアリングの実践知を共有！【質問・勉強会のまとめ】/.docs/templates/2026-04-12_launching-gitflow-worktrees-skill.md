機能名: launching-gitflow-worktrees スキル作成 + agent-essenceレビュー後アップグレード

- セッション名: ハーネスエンジニアリング勉強会まとめ解説
- 日付: 2026-04-12 02:02:09
- 概要: note記事「ハーネスエンジニアリングの実践知」の「ワークツリーとブランチ戦略」セクションおよびPDF「次なるAIエージェントの飛躍」の「ブランチ戦略 — チーム内協調とチーム間分離」セクションの設計思想をスキル化。orchestrating-team-developmentの接続スキル群に欠けていた「gitflow + worktree構築」フェーズを埋める新規スキルを作成し、agent-essenceレビュー後にV-1.1（失敗の仕組み昇格）等の指摘に基づきアップグレード。
- 実装内容:
  **Phase 1: 新規スキル作成**
  1. SKILL.md（145行）: 8ステップのワークフロー（チーム構成取得→Git検証→ブランチ構築→worktree作成→gitignore→コンテキスト注入→安全ルール→完了レポート）+ 5 Gotchas
  2. assets/worktree-team-context.template: .claude/rules/current-team.md用テンプレート（プレースホルダ4種）
  3. assets/claude-md-safety-rules.template: CLAUDE.mdに追記するマルチエージェント安全ルール
  4. references/worktree-failure-modes.md: ワークツリー幽閉・分離粒度誤り・develop省略の失敗パターン + 使い分け早見表
  5. orchestrating-team-development/SKILL.md: 3箇所編集（接続スキル群追加、Step 2.5挿入、規模別ガイド補足）

  **Phase 2: agent-essenceレビュー後アップグレード**
  レビュー指摘: V-1.1（merge禁止が自然言語ルール止まり）、V-2.1/C-4（検証なし）、C-6（gtrの訓練データ断崖）
  6. assets/pre-push-hook.template 新規: main/developへのpushをgit hookで構造的ブロック
  7. references/gtr-cheatsheet.md 新規: gtrコマンド・エラーパターン・フォールバック手順
  8. SKILL.md大幅改修（145行→197行）: Step 7を「構造的安全装置3層化」に拡張、Step 8「構築検証」追加、Step 9「検証後のみレポート」、Gotchas更新、Reference Navigation拡充
  9. references/worktree-failure-modes.md追記: 共有コード変更ワークフロー + develop定期取り込みタイミング
- 設計意図:
  - **「指揮者は楽器を弾かない」原則**: orchestrating-team-developmentにgitflow構築を直接埋め込まず、独立スキルとして分離。指揮者は呼び出すだけ
  - **兄弟スキルパターン**: launching-gtr-issue-worktree（issue起点）の兄弟として、launching-gitflow-worktrees（チーム起点）を配置
  - **記事の二層構造の忠実な実装**: チーム間=worktree分離（速度）、チーム内=同一ブランチ協調（品質）
  - **「言ったことを自分で実装する」**: Gotchasに「口頭指示は破られる」と書きながらCLAUDE.md止まりだった矛盾を、pre-push hook + PreToolUseフック推奨 + CLAUDE.mdの3層で解消
  - **観測可能な完了条件**: 自己申告（echo）ではなくgit worktree list等の実際の状態観測で検証
- 副作用:
  - SKILL.md 197行は500行制限内だが、今後の追加には注意（references/への分離を検討）
  - pre-push hookは既存hookがある場合の追記ロジックがスキル記述レベル（確実な冪等性はhook実装時に要確認）
  - PreToolUseフック連携は「推奨」止まり（自動設定はハーネス設定=人間の判断領域としてスキルから除外）
- 関連ファイル:
  - `~/.claude/skills/launching-gitflow-worktrees/SKILL.md` (197行)
  - `~/.claude/skills/launching-gitflow-worktrees/assets/worktree-team-context.template`
  - `~/.claude/skills/launching-gitflow-worktrees/assets/claude-md-safety-rules.template`
  - `~/.claude/skills/launching-gitflow-worktrees/assets/pre-push-hook.template`
  - `~/.claude/skills/launching-gitflow-worktrees/references/worktree-failure-modes.md`
  - `~/.claude/skills/launching-gitflow-worktrees/references/gtr-cheatsheet.md`
  - `~/.claude/skills/orchestrating-team-development/SKILL.md` (3箇所編集)
