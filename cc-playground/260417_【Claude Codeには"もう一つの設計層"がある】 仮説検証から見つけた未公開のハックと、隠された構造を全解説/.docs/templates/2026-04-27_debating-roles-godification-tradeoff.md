---
feature: debating-roles-godification-tradeoff
session: 未設定
date: 2026-04-27 09:09:36
---

# debating-roles の「神化」観点での再評価

## 概要

note 記事 (まさお / 2026-03-21) の「LLM Debate スキルをオーケストレーターからもサブエージェントからも呼べる神」という表現を起点に、かもねの `debating-roles` skill が記事の「神化された debate skill」と異なる設計判断をしている事実を発見した。過去判断の振り返りで、Agent Teams 採用は意図的だが「神化 (= nested 起動可能な汎用配置)」観点は設計検討に入っていなかったことが明らかになった。

note 記事の「coder の 3 周ループルール」「TDD ワークフロー孫エージェント自律運用」「LLM Debate スキル」の 3 トピックを比較し、最初の 2 つは記事と整合 (むしろ記事より厳密) だが、3 つ目だけ設計軸が直交していることを確認した。

## 実装内容

実装ではなく、設計判断の振り返りと未検討領域の特定。具体的な作業は以下:

1. **note 記事の「coder 3 周ルール」との対応確認**: `coder.md:67, 135-149` で記事のルールが for/else 構文で機械保証されていることを確認。記事より厳密 (maxTurns 非依存)。

2. **TDD ワークフロー孫エージェント自律運用の対応確認**: `coder.md:35-43` の 4 層チェーン (L3指揮者 → coder agent → fork skills → team-* 孫) で記事の構造を実装済み。`implement-fork` 1 回のみ + 以降 coder 自身が Edit/Write で調整、というルールも明文化済 (`coder.md:31, 101`)。

3. **LLM Debate スキルの設計差異特定**:
   - 記事: subagent ベース (推定) → nested 起動可能 → 「どこからでも呼べる神」
   - かもね: Agent Teams ベース (debater-* 6 体 + Lead) → nested 起動不可 (`debating-roles/SKILL.md:347-348` "No nested teams" / "One team per session")
   - 同一目的 (multi-agent debate) で実装モデルが直交している

4. **過去判断の意図性検証**: `feedback_multi-agent-debate-design.md` の改修履歴 5 段階 (2026-03-20 → 2026-04-25) を時系列で追跡。検討された観点は「視点多様性」「SendMessage 強制」「Macro契約」の 3 軸のみ。「nested 起動可能性 / 配置自由度」の観点は一度も検討項目に上がっていなかった。

5. **3 案のトレードオフ整理**:
   - 案A (時系列 phase 分離): debate を orchestrating の前段に置く。両方 Agent Teams で順次実行 (cleanup 必須)
   - 案B (subagent モード版併設): `debating-roles-subagent` を新設し、Agent Teams を捨てて nested 可能化。SendMessage 強制で得た独立性は犠牲
   - 案C (現状維持): debating-roles をスタンドアロン批評ツールとして保持

## 設計意図

### 過去判断 (2026-04-24/25 Session 4-5) の意図性

memory `feedback_multi-agent-debate-design.md` で以下が**意図的判断**として明記されている:

- **Agent Teams 採用 (意図的)**: 公式基準「議論・協力が必要な複雑な作業はAgent Teams」(SKILL.md:10-23) に従った
- **全員 Opus 固定 (意図的)**: モデル能力差は「視点の差」ではなく「解像度差」、低解像度判断が高解像度を引きずり下ろす
- **役割分離 6 体 (意図的)**: Claude Only ポリシー下で視点多様性を生む唯一の源
- **debater-pm の Macro契約保持 (意図的)**: tools: [Read, Grep, Glob, SendMessage] のみで Edit/Write 非含、批評参加のみ

### 今回発見した未検討領域

「神化 (= nested 起動可能な汎用配置)」観点は設計検討に入っていなかった。原因 (推定):

1. **Phase 3 改修 (Session 5) の問題意識が SendMessage 1/6 という目の前の不具合**: 「呼び出し可能性」より「呼び出しが届かない問題」が緊急度高で先行
2. **公式 "Compare with subagents" 表が二者択一的**: subagent vs Agent Teams の比較で「両方から呼べる」という第三発想が表に出てこない
3. **記事の「神」概念に未接触だった**: memory に記録された記事 (2026-03-21) では LLM Debate のマルチベンダー思想にしか言及がなく、「神化」観点は今回の note 記事 (260417 PDF) で初めて入ってきた

### 設計の最適化軸が直交していた

- 記事: **配置自由度** (どこからでも呼べる) を最優先
- かもね: **質** (視点独立性・忖度防止・SendMessage actor 通信) を最優先

→ 同じ「multi-agent debate」を作っているように見えて、最適化軸が直交。Phase 3 で SendMessage 強制 (5/6 達成) を進めれば進むほど Agent Teams 依存が深まり、神化からは構造的に遠ざかる。

## 副作用

### 発見した未検討領域

1. **「視点独立性 vs 配置自由度」のトレードオフが過去議論で見えていなかった**: Phase 3 の改修方向と神化方向は両立不可。今後の改修判断にこのトレードオフ軸を加える必要がある

2. **記事の「神」表現は subagent ベース debate を前提にしている可能性**: かもねの Agent Teams 実装の方が**視点独立性は構造的に高い**。記事の設計が必ずしも上位互換ではない (むしろ subagent 退行の可能性)

3. **memory 更新が必要**: `feedback_multi-agent-debate-design.md` に「神化観点の未検討と再評価」を追記すべき。過去判断を**正しいが完璧ではなかった**と記録する価値がある

### 今後の判断材料

- マルチエージェント協調 skill 群 (three-elements-harness / orchestrating-team-development) は Agent Teams ベースなので、debating-roles を nested 起動できない (構造的不可能)
- enforcing-strict-tdd-cycle は subagent ベース (context:fork) なので、debate を組み込むなら subagent 版が必要
- 案A (時系列 phase 分離) で運用するか、案B (subagent 版併設) で「神化」を取りに行くかは、**かもねの優先順位次第**で確定できる状態

### 特になし (純粋な振り返り)

実装変更を伴わないため、コード・skill・agent 定義への副作用はない。memory 追記の判断と、今後の neural design 軸の追加が次アクションになり得る。

## 関連ファイル

- `~/.claude/agents/coder.md` — TDD 戦術オーケストレーター。記事の 3 周ルールを for/else で機械保証
- `~/.claude/skills/red-test-fork/SKILL.md` — RED phase fork skill
- `~/.claude/skills/implement-fork/SKILL.md` — GREEN 初回実装 fork skill (1 回のみ)
- `~/.claude/skills/verify-test-fork/SKILL.md` — 検証 fork skill
- `~/.claude/skills/debating-roles/SKILL.md` — Agent Teams ベース debate skill (神化されていない設計)
- `~/.claude/agents/debater-{ui-designer,implementer,tester,reviewer,documenter,pm}.md` — debate 専用 6 体 (Phase 3 改修済、SendMessage 強制)
- `~/.claude/skills/three-elements-harness/SKILL.md` — Agent Teams harness、debating-roles を nested 起動不可
- `~/.claude/skills/orchestrating-team-development/SKILL.md` — Agent Teams ベース、同上
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — subagent ベース (context:fork)、debate 組込には subagent 版が必要
- `~/.claude/projects/.../memory/feedback_multi-agent-debate-design.md` — 過去判断履歴 (2026-03-20 → 2026-04-25)。神化観点未検討の証拠
- `.docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf` — note 記事原典 (神化表現の出典)
- `.docs/templates/2026-04-25_debating-roles-phase3.md` — 直近の Phase 3 改修ログ (質の方向の改善、本ログとは観点が直交)
