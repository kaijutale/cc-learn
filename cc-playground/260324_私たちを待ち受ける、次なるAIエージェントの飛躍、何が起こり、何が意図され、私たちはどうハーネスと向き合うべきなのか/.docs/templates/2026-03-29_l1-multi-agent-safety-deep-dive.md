機能名: L1（壁）マルチエージェント安全規約の深掘りとCLAUDE.md強化

- セッション名: N/A
- 日付: 2026-03-29 05:53:07
- 概要: PDF記事「私たちを待ち受ける、次なるAIエージェントの飛躍」の「柱3: 動的オーケストレーション」における L1（壁：不可侵制約）セクションを起点に、committerスクリプトとマルチエージェント安全規約の出典を特定・検証し、グローバルCLAUDE.mdに反映した。
- 実装内容:
  - PDF記事のL1セクションで言及される2つの実践例のソースを特定:
    1. steipeteのcommitterスクリプト → steipete-SAMPLE-AGENTS.MD 行83, 133-135
    2. `"do not create/apply/drop git stash entries"` / `"do not switch branches unless explicitly requested"` → かもねの指摘により、steipeteのAGENTS.MDではなく **openclaw/openclawのAGENTS.MD**（SAMPLE-AGENTS.md 行197, 200）が正確な出典と判明
  - openclawのマルチエージェント安全規約（全7項目）とかもねのCLAUDE.md（既存5項目）を突合
  - ギャップ分析の結果、L1相当の3項目を `~/.claude/CLAUDE.md` に追記:
    1. `git stash` のcreate/apply/drop + autostash を明示的にカバー（既存の「勝手に作らない」から強化）
    2. `git worktree` ガード（新規追加）
    3. push/commit/commit all の挙動定義（新規追加）
  - 電報スタイル（telegraph style）の解説:
    - steipeteのAGENTS.MD先頭 `"Work style: telegraph; noun-phrases ok; drop grammar; min tokens."` はエージェントの出力スタイルへの指示
    - AGENTS.MD自体も電報スタイルで書かれている = 入力も出力も最小トークン化する二重適用
- 設計意図:
  - committerスクリプトの出典をPDF記事→実物AGENTS.MDで裏付け。committerはsteipete個人のツールであり、かもねのCLAUDE.mdには追加不要と判断（ツールが存在しないため）
  - マルチエージェント安全規約の追記は「L1（壁）= 構造的に誤用不可能にする」原則に基づき、事故リスクの高いもの（stash/worktree/push挙動）のみを厳選。openclaw全7項目のうち、既存カバー済み（ブランチ切替、見覚えのないファイル）は重複を避けた
  - PDF記事の引用元がsteipeteのAGENTS.MDではなくopenclawのAGENTS.MDである点は、かもねの指摘で修正された。一次ソース検証の重要性を示す事例
- 副作用:
  - `~/.claude/CLAUDE.md` のマルチエージェント安全規約セクションが5項目→7項目に増加（行106-108）
  - 既存のgit stashルール（`git stash を勝手に作らない`）は上位互換の記述に置き換えられた
- 関連ファイル:
  - 変更: `~/.claude/CLAUDE.md`（マルチエージェント安全規約セクション）
  - 参照: `.docs/references/SAMPLE-AGENTS.md`（openclaw/openclaw AGENTS.MD、行197-202）
  - 参照: `.docs/references/steipete-SAMPLE-AGENTS.MD`（steipete AGENTS.MD、行80, 83, 86, 133-135）
  - 参照: `.docs/references/pdf/next-ai-agent-leap-and-harness.pdf`（L1セクション）
  - 過去ログ: `.docs/templates/2026-03-27_steipete-agents-md-analysis.md`
  - 過去ログ: `.docs/templates/2026-03-26_claude-md-update-from-agents-md.md`
