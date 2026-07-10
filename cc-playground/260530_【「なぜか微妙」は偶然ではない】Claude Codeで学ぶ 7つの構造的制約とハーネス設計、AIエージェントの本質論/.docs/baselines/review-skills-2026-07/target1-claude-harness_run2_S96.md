# Harness Diagnosis: ~/.claude (ハーネス本体)

> 評価基準: [diagnosis-rubric](../skills/review-harness/diagnosis-rubric.md)
> 診断日: 2026-07-05-0007
> 対象: /Users/camone/.claude （baseline取得 run 2/2・同一対象2回目・独立実行）

## ハーネス構成サマリ

| 項目 | 現状 |
|------|------|
| CLAUDE.md | 112行 / ポインタ主体（rules/ 10本 + .docs/progressive-disclosure/ へ委譲）/ インライン手順ほぼゼロ |
| Permissions | allow 約42件 / deny 約51件 / ask 約28件 |
| Hooks | PreToolUse 約9 / PostToolUse 約9 / Stop 6 / PostCompact 5 / SessionStart 3 / SubagentStop 4（決定論チェック多数） |
| Skills | 90件（辞書型: boris/claude-api 等 / ワークフロー型: TDD・orchestration / fork型: *-fork / reviewer型: essence系） |
| MCP | 5接続（brave-search / chrome-devtools / claude-in-chrome / context7 / firecrawl） |
| Memory | 手動運用（autoMemoryEnabled: false）/ project別 MEMORY.md をインデックス化・カテゴリ分類 |
| Agents | カスタム 32件（team-* / debater-* / llm-debater-* / essentials-reviewer 系 / framing-advocate 系） |
| Plugins | 有効2件（ralph-loop / typescript-lsp）・無効1件（claude-mem）。機能はハーネス中核ではなく補助 |

## スコアサマリ

| カテゴリ | 指標 | スコア | 小計 |
|---------|------|--------|------|
| **A. 帯域効率** | A1 ✅ A2 ⚠️ A3 ✅ A4 ⚠️ A5 ✅ | 8/10 | 80% |
| **B. 検証の堅牢性** | B1 ✅ B2 ✅ B3 ✅ B4 ✅ B5 ✅ | 10/10 | 100% |
| **C. 権限と信頼境界** | C1 ✅ C2 ✅ C3 ✅ C4 ✅ C5 ✅ | 10/10 | 100% |
| **D. 知識と記憶** | D1 ✅ D2 ✅ D3 ✅ D4 ✅ D5 ✅ | 10/10 | 100% |
| **E. 環境設計** | E1 ✅ E2 ✅ E3 ✅ E4 ✅ E5 ✅ | 10/10 | 100% |
| **総合** | | 48/50 | **96%** |

> 「—」（対象外）は今回なし。全25指標が適用可能と判定。

### グレード

**S（90%+）** — ハーネス設計が成熟。微調整のフェーズ。

## 検出されたアンチパターン

（優先順位 C>B>A>D>E。今回の非満点は A カテゴリの ⚠️ 2件のみ）

### A2. ツール接続は帯域コストに見合っているか ⚠️

**検出事実**: MCP が5接続常駐（brave-search / chrome-devtools / claude-in-chrome / context7 / firecrawl）。このうち chrome-devtools・claude-in-chrome・context7 は CLI/組込に代替がなく必然性が明確。一方 brave-search は組込 `WebSearch`、firecrawl は組込 `WebFetch` と機能が重複する。CLAUDE.md では「Brave > WebSearch」「Firecrawl > WebFetch」を品質理由で明示選択している。
**影響**: MCP のツール定義は毎セッション、コンテキストに常駐する。組込ツールで代替可能な2接続分のツール定義帯域を、品質差というマージナルな利得のために払い続けている。判断品質への実害は小さいが、帯域コストと価値の釣り合いは「明確に見合う3接続」と「品質選好の2接続」で温度差がある。
**関連原則**: (→C-1) コンテキスト帯域は有限でゼロサム。組込で賄える機能に追加のツール定義を常駐させるのは帯域の純増。

**改善案**:
```
判断材料の整理（設定変更は任意）:
  - brave-search / firecrawl を「常時常駐」から「必要時のみ有効化」へ落とせないか検討
  - 実運用で WebSearch/WebFetch に対する優位を体感できているなら現状維持で正当
  - 体感差が曖昧なら、2接続を外して組込に寄せると帯域が軽くなる
※ chrome-devtools / claude-in-chrome / context7 は代替不能ゆえ据え置き推奨
```

---

### A4. エージェントの選択肢が不必要に広がっていないか ⚠️

**検出事実**: skill 90件が全て model-invocable なメニューに並ぶ。`disable-model-invocation: true` を持つ実 SKILL は2件のみ（llm-debate / coordination-harness-integrity-fork）。fork型・reviewer型 skill（framing-advocate-merit-fork, red-test-fork, essence-reviewing-orchestrator 等）は description に「明示呼出専用・自動誘発なし」と明記して抑制しているが、構造的な発火抑止（disable-model-invocation）ではなく description の文言に依存している。permissions.allow はワイルドカードではなく厳密にスコープ済み（この点は良好）。
**影響**: 90件の model-invocable な description が毎セッション、エージェントの「注文メニュー」に載る。fork/reviewer skill は本来 Skill ツールからの明示呼出でしか使わない設計だが、自動発火の候補として推論リソースを消費し得る。`disable-model-invocation: true` は明示呼出（Skill name 指定）を妨げないため、fork skill に付与しても機能を損なわず、メニューからだけ外せる。
**関連原則**: (→V-1.3) 選択肢は推論前に絞る, (→A4/C-1.1) コンテキストの能動的管理。

**改善案**:
```yaml
# 各 fork / reviewer 系 skill の frontmatter に追加
# （明示 Skill(name) 呼出は引き続き可能。自動発火候補からのみ除外される）
disable-model-invocation: true

# 対象候補: *-fork 系, essence-reviewing-orchestrator, gep-*-reviewer-fork,
#          framing-advocate-*-fork, llm-debate-* fork 群, review-harness の内部 fork 等
```

---

## 強み

- **C1: 品質のものさし自体が deny 保護されている** — lint/test/CI 設定（.eslintrc, biome.json, tsconfig, vitest.config, .github/workflows）に加え、`~/.claude/hooks/*` と `hooks/rules/*`、`~/.claude/settings*` まで deny に含む。エージェントが「測定器」も「測定器を守るルール」も改変できない二重封鎖で、報酬ハッキング（→C-5）経路が構造的に塞がれている。
- **E3: 生成者と評価者が context:fork で物理分離** — essence reviewer 群・TDD の red/verify fork・framing-advocate・llm-debate が全てフレッシュな subagent コンテキストで走る。自作品の自己採点による迎合（→C-3）を設計で回避しており、レビュー結果の信頼性が構造で担保されている。
- **B系全般: 失敗パターンの仕組み化が徹底** — emoji-in-code 禁止・生成コメント禁止・frontmatter schema・file line limit・secret read が全て決定論的 hook に昇格済み。CLAUDE.md の「〜禁止」を自然言語の注意喚起で終わらせず、PostToolUse/PreToolUse で再発不能にしている（→V-1.1）。

## Quick Wins — 今日できる改善

### 1. fork/reviewer skill の自動発火抑止（A4対応、15分）

fork 系・reviewer 系 skill の frontmatter に `disable-model-invocation: true` を一括付与する。明示 `Skill(name)` 呼出は維持されるため機能は不変で、90件メニューからノイズだけを削れる。

```bash
# 対象確認（明示呼出専用と description に書いてある skill を洗い出す）
grep -rl "明示呼出専用\|自動誘発なし\|context: fork" ~/.claude/skills/*/SKILL.md
# 各該当 SKILL.md の frontmatter に disable-model-invocation: true を追加
```

### 2. brave-search / firecrawl の常駐価値を実測で判定（A2対応、10分）

組込 `WebSearch`/`WebFetch` と重複する2接続について、直近の使用実感を棚卸しし、「品質優位を体感できているか」で常駐継続/外しを決める。曖昧なら組込に寄せて帯域を軽くする。

## 次のステップ — 中期的な改善

- **project-level settings.json の保護レベル再考（C3の残り）**: `~/.claude/settings*` はユーザーレベルで deny 済みだが、`**/.claude/settings.json`（プロジェクトレベル）は現状 `ask`。自己改変の中核パスは deny で完全に閉じているため実害は小さいが、rubric の厳密な ✅ 条件（両レベル deny）に揃えるなら deny 化を検討。ただし新規プロジェクト setup 時の利便性とのトレードオフがあるため、`ask` 維持も合理的。
- **90 skill のライフサイクル管理**: `skills-disabled/` を活用した定期棚卸しの仕組み化。skill 数が増え続けるとメニュー圧が漸増するため、四半期ごとの棚卸しトリガー（例: SessionStart hook でのリマインド）を検討。

## 総評

~/.claude は 96%（Grade S）の成熟ハーネスで、25指標中23が満点。B・C・D・E の4カテゴリが全て満点という結果は、essence-docs（harness/skill/ui-essentials）という原則体系を自ら保持し、それに沿って構築された自己参照的な設計であることを反映している。品質のものさしと hooks/settings 自体を deny で二重封鎖した信頼境界（C系）、決定論 hook 群による失敗の仕組み化（B系）、context:fork による生成/評価の物理分離（E3）が特に強い。改善余地は帯域効率の A カテゴリに集中しており、いずれも「壊れている」ではなく「もう一段絞れる」種類の ⚠️ — 90 skill メニューの発火抑止（A4）と、組込と重複する2 MCP接続の常駐価値（A2）。本診断はファイルベースの静的解析であり、hook が実行時に実際に発火しているか、90 skill の description が運用上どこまで自動発火を抑止できているか、暗黙知の真の網羅性は測定範囲外である点は留保する。（本レポートは baseline 変動幅測定の run 2/2 として、過去診断を参照せず独立実行した。）
