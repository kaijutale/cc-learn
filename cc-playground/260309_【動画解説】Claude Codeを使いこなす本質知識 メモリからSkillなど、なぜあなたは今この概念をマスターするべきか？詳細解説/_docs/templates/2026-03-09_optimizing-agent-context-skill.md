機能名: optimizing-agent-context Skill作成

- 日付: 2026-03-09 22:11:43
- 概要: 記事から取得したAIエージェント向けドキュメント5原則（agent-doc.md）とCLAUDE.mdサンプル（SAMPLE-CLAUDE.md）をSkill化し、毎回内容を覚えなくても呼び出すだけでCLAUDE.mdのレビュー/作成ができるようにした
- 実装内容:
  - init_skill.py でスケルトン生成
  - 不要ディレクトリ（scripts/, assets/）削除
  - references/ に agent-doc.md と sample-claude-md.md をコピー
  - SKILL.md にMode Decision Tree（Review/Creation自動切替）、Review Modeの5原則評価テーブル出力仕様、Creation Modeのプロジェクト分析→生成フローを記述
  - package_skill.py でバリデーション通過
- 設計意図:
  - Instruction-based（スクリプト不要）: SKILL.mdの指示だけで動作し、依存関係を最小化
  - 自動モード判定: CLAUDE.mdの存在有無で分岐し、ユーザーの認知負荷を下げる
  - 段階的開示の自己適用: 5原則の詳細はreferencesに分離し、SKILL.md自体がコンパクト（約80行）
  - グローバルSkill: ~/.claude/skills/ に配置し、全プロジェクトで使用可能
- 副作用: 特になし。既存ファイルへの変更なし
- 関連ファイル:
  - ~/.claude/skills/optimizing-agent-context/SKILL.md
  - ~/.claude/skills/optimizing-agent-context/references/agent-doc.md
  - ~/.claude/skills/optimizing-agent-context/references/sample-claude-md.md
