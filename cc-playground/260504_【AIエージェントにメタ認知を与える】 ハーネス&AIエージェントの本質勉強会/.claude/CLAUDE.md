# CLAUDE.md

## プロジェクトの位置づけ (スコープ宣言)

- 本PJは**学習目的のサンドボックス**であり、ハーネスそのものではない。ハーネス＝エージェントを制御・運用する設計手法(手綱)で、その実体は `~/.claude/` 配下に実装される (CLAUDE.md / hooks / skills / agents / settings 等)
- 本PJ内のファイル (`.docs/**` / `.claude/handoff-state.md` / spec / 生成HTML 等) は学習の足場 = project-local artifact
- **これらが旧設計のまま stale でも「未了」「矛盾」「要同期」の対象に入れない**。完成判定・整合性判定はグローバルハーネスの実体(`~/.claude/`) のみで行う。スコープ確定が先、Docs同期ルール適用は後

## reference

応答する際は必ず必ず必ず以下を参照すること：

- `.docs/references/sources/pdf/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf`
- `.docs/references/sources/pdf/Meta-Harness_End-to-End_Optimization_of_Model_Harnesses.pdf`
- `.docs/references/sources/images/excalidraw.svg`

## ログルール

/loggingで残すログの配置先は `.docs/logs/local/` がデフォルトだが、このプロジェクトで保存するログは全て `.docs/logs/shared` で保存し、Gitの追跡対象とする
