機能名: managing-skills Skill新規作成（グローバルSkillsのon/off管理）

- セッション名: N/A
- 日付: 2026-03-27 08:00:00
- 概要: グローバルスコープの全Skills（31個）を対話的にON/OFF切替できるSkillを新規作成。無効化したスキルは `~/.claude/skills-disabled/` にディレクトリごと移動する方式を採用。Pythonスクリプト2本（一覧表示 + トグル実行）とSKILL.mdのハブ構成。
- 実装内容:
  - 設計調査: 34個のスキル構造・authoring-skillsガイド・設定ファイル（settings.json）を調査し、スキルの有効/無効を管理する既存機構が存在しないことを確認
  - トグル方式の選定: 3案（SKILL.mdリネーム / frontmatter修正 / ディレクトリ移動）を比較検討。かもねの提案によりディレクトリ移動方式（`~/.claude/skills/` ↔ `~/.claude/skills-disabled/`）を採用。内部構造を一切変更しない点が決め手
  - scripts/list_skills.py: 両ディレクトリをスキャン、SKILL.mdのフロントマターをregexで解析（PyYAML不要）、番号付きテーブルで出力。Python 3.9互換
  - scripts/toggle_skill.py: `shutil.move()` でディレクトリ移動。自己保護（managing-skills拒否）、べき等性（already ON/OFF）、`--enable`/`--disable` フラグ対応。Python 3.9互換（`from __future__ import annotations` + `Tuple[Optional[Path], str]`）
  - SKILL.md: ワークフロー4ステップ（一覧取得 → AskUserQuestionで選択 → トグル実行 → サマリー表示）、自己保護ルール、Gotchasセクション
  - AskUserQuestionの制約発見: optionsは最大4選択肢（maxItems: 4）のため、31スキルを全て選択肢に入れることは不可。番号/名前指定 + all off/on + done の4選択肢構成に落ち着いた
- 設計意図: 記事「私たちを待ち受ける、次なるAIエージェントの飛躍」の原理「LLMの注意力は有限」に直結。31スキルのフロントマター（name + description）は毎セッションのシステムプロンプトにロードされるため、使わないスキルを無効化することでコンテキストウィンドウの消費を削減できる。ディレクトリ移動方式はスキル内部を一切触らないため、再有効化時に完全に元通りになる安全設計。
- 副作用: `~/.claude/skills-disabled/` ディレクトリが新規作成される。無効化されたスキルは次のセッションから反映（現セッション中は既にロード済みのため影響なし）。手動復元も可能（`mv ~/.claude/skills-disabled/<name> ~/.claude/skills/`）。
- 関連ファイル:
  - `~/.claude/skills/managing-skills/SKILL.md` # 新規作成
  - `~/.claude/skills/managing-skills/scripts/list_skills.py` # 新規作成
  - `~/.claude/skills/managing-skills/scripts/toggle_skill.py` # 新規作成
  - `~/.claude/skills-disabled/` # 新規作成（無効化スキルの格納先）
