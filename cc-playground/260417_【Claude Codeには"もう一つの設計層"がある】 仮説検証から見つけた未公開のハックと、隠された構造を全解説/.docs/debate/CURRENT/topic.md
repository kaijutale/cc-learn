# 議題: coder agent における llm-debate 戻り値の adjust への反映方法 (Phase 1 Open Question 確定)

## 何を判断したいか

2026-04-29 に coder agent (`~/.claude/agents/coder.md`) Step 5 ループに `Skill("llm-debate")` を Loop 2/3 突入時の条件付きで組み込んだ (Phase 1 最小実装、commit `f1db7fd`)。組込済の擬似コード上では `debate_guidance.lead_summary` という記法をしているが、**実際の戻り値テキストから何を抽出して `adjust_source_code()` に渡すべきか** が未確定 (Phase 1 実装ログ Open Question #1)。

5視点 (Implementer / Tester / Reviewer / Documenter / UI Designer) からの批判的分析を経て、Lead が以下の選択肢から1つを統合判断で選ぶ。

## 関連背景

- coder.md Step 5 修正コード (擬似コード抜粋):
  ```python
  if loop_count >= 1:
      # ... topic.md 退避 + 動的生成 ...
      debate_guidance = Skill("llm-debate")  # 戻り値全体
  self.adjust_source_code(
      failure_log=result.details,
      iteration=loop_count,
      debate_guidance=debate_guidance,  # ← ここに「何を渡すか」が未確定
  )
  ```
- llm-debate skill 戻り値は 5 視点サマリ + 視点間関係 + Lead 統合判断 の構造化Markdown
- 制約: coder が adjust 前に LLM へのコンテキストとして注入する想定 (盲従禁止、coder の最終判断責務維持)
- Phase 2 で偽陽性率を測る都合上、「debate_guidance を渡したか/方針が変わったか」が事後検証可能であること
- CLAUDE.md「迎合・盲従禁止」「迎合的提案は却下」原則に整合すること

## 候補 / 選択肢

- **案A**: 戻り値テキストの **Lead 統合判断セクション全体** を `adjust_source_code()` の追加コンテキストとして注入 (情報量大、解釈は coder に委ねる)
- **案B**: **「結論」と「推奨アクション」だけ抽出** して注入 (情報量中、判断軸が明確)
- **案C**: **5視点 reviewer の severity 判定だけ抽出** (情報量小、リスク警告に特化)
- **案D**: 戻り値テキスト全体 (5視点 + Lead 統合判断) を渡し、coder の adjust ロジックに取捨選択を委ねる (情報量最大、coder 負荷大)

## 制約条件

- 抽出ロジックは coder.md の Markdown 説明レベル (擬似コード) で明文化可能であること
- 自然言語ガイダンスへの盲従禁止 (CLAUDE.md `## Critical Thinking`)
- `adjust_source_code()` 呼出時にコンテキスト過多にならないこと (Loop 3 までに 2回呼ばれる前提でコンテキスト累積)
- Phase 2 偽陽性率測定の証拠保全と整合 (debate_impact[] への記録が可能であること)
- llm-debate skill 側の修正なしで実現可能であること (Phase 1 の責務境界維持)
