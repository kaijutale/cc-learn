機能名: CLAUDE.md作成Skill統合 + 電報スタイル追加

- セッション名: N/A
- 日付: 2026-03-26 09:25:25
- 概要: 3つのCLAUDE.md作成Skill（engineering-project-context / scaffolding-project-context / optimizing-agent-context）が機能的に包含関係にあり重複していたため、1つに統合。加えてsteipeteのAGENTS.MD「電報スタイル」をSkillのreferenceに追加し、CLAUDE.md生成時のトークン効率を向上させた。
- 実装内容:
  - SKILL.md: トリガーワード統合 + scaffolding/optimizingからの差分吸収 + 電報スタイル制約追加（Scaffold Mode Step 1/3、Review Mode Step 2）
  - context-design-principles.md: 原則3「Less is More」に電報スタイルガイド（英語/日本語Before/After表）追加、チェックリストに電報スタイル項目追加、ミニマルテンプレートを電報スタイルで書き直し
  - sample-claude-md.md: 117行の丁寧語サンプルを42行の電報スタイルに全面書き直し
  - scaffolding-project-context/ ディレクトリ削除
  - optimizing-agent-context/ ディレクトリ削除
- 設計意図: 記事「私たちを待ち受ける、次なるAIエージェントの飛躍」の核心原理「LLMの注意力は有限」に基づく。3 Skillが1つに統合されることでシステムプロンプトのSkill説明負荷が約2/3削減。電報スタイルの追加はSkillのreferenceに配置（段階的開示：CLAUDE.md作成時のみロード、グローバルrulesには置かない）。
- 副作用: 旧Skill名「scaffolding-project-context」「optimizing-agent-context」を直接呼び出すユーザーがいた場合、Skillが見つからなくなる。ただしengineeringのdescriptionに「optimizing-agent-context」トリガーを追加済みで、既存のトリガーワード（「CLAUDE.mdレビュー」「scaffolding」等）は全てengineeringでカバーされている。
- 関連ファイル:
  - `~/.claude/skills/engineering-project-context/SKILL.md`
  - `~/.claude/skills/engineering-project-context/references/context-design-principles.md`
  - `~/.claude/skills/engineering-project-context/references/sample-claude-md.md`
  - `~/.claude/skills/engineering-project-context/references/placement-guide.md`（変更なし）
