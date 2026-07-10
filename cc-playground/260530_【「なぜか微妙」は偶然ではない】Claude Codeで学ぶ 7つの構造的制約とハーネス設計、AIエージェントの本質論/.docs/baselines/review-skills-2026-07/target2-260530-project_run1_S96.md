# Harness Diagnosis: 260530 学習サンドボックス (7つの構造的制約)

> 評価基準: [diagnosis-rubric](../skills/review-harness/diagnosis-rubric.md)
> 診断日: 2026-07-05-0016
> 対象: `260530_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論`
> baseline取得 run 1/2 — 独立診断 (過去レポート非参照)

## ハーネス構成サマリ

| 項目 | 現状 |
|------|------|
| CLAUDE.md | プロジェクト 16行 (ポインタ 1件: 参照PDF / インライン手順 1件: ログルール) + ユーザーレベル (大規模・progressive disclosure + rules 9本) を継承 |
| Permissions | プロジェクト: なし / ユーザー: allow 約46件 / deny 約55件 / ask 約30件 (env `defaultMode:default`) |
| Hooks | プロジェクト: 0件 / ユーザー: PostToolUse 6+ / PreToolUse 8+ / Stop 6 / PostCompact 5 / SubagentStop / SessionStart 3 / その他複数 |
| Skills | プロジェクト: 0件 / ユーザー: 60+件 (辞書型/ワークフロー型/fork・debate型。高コスト系は明示呼出専用で自動発動抑制) |
| MCP | 5接続 (brave-search / chrome-devtools / claude-in-chrome / context7 / firecrawl)。`ENABLE_TOOL_SEARCH=true` でツール定義を遅延ロード |
| Memory | 本PJの型付きMemoryは0件 (`autoMemoryEnabled:false`)。継続手段は `.docs/logs/shared` 60+件 (git追跡) + handoff-state.md (gitignore・ローカル) |
| Agents | プロジェクト: 0件 / ユーザー: 30+件 (team-* / debater-* / framing-* / gep-* / essentials-reviewer 等) |
| Plugins | ralph-loop (有効) / typescript-lsp (有効) / claude-mem (無効)。LSP は型検証に寄与 |

> **スコープ注記**: 本PJのCLAUDE.mdは「本PJは学習サンドボックスであり、ハーネス実体は `~/.claude/` 配下」と明示宣言している。よって本診断は **プロジェクト設定 + 継承するユーザーレベル・ハーネスの合成体** を評価対象とする (review-harness Phase 1 の規定通り両レベルを収集)。プロジェクト固有ファイル (`.claude/`) 単体は意図的に薄い。

## スコアサマリ

| カテゴリ | 指標 | スコア | 小計 |
|---------|------|--------|------|
| **A. 帯域効率** | A1 ✅ A2 ✅ A3 ✅ A4 ⚠️ A5 ✅ | 9/10 | 90% |
| **B. 検証の堅牢性** | B1 ✅ B2 ✅ B3 ✅ B4 ✅ B5 ✅ | 10/10 | 100% |
| **C. 権限と信頼境界** | C1 ✅ C2 ✅ C3 ✅ C4 ✅ C5 ✅ | 10/10 | 100% |
| **D. 知識と記憶** | D1 ✅ D2 ✅ D3 ⚠️ D4 ✅ D5 ✅ | 9/10 | 90% |
| **E. 環境設計** | E1 ✅ E2 ✅ E3 ✅ E4 ✅ E5 ✅ | 10/10 | 100% |
| **総合** | | **48/50** | **96%** |

### グレード

**S (90%+)** — ハーネス設計が成熟。微調整のフェーズ。

## 検出されたアンチパターン

### A4. エージェントの選択肢が不必要に広がっていないか ⚠️

**検出事実**: ユーザーレベルに 60+ の Skill と 30+ の Subagent が常駐する。高コスト系 (fork/debate/framing) は `明示呼出専用・自動誘発なし` と明記され自動発動が抑制され、`permissions.allow` もワイルドカードなし・Bash サブコマンド粒度で最小化されている。しかし本PJの日常作業 (ドキュメント/HTML/ログ/ハーネス学習) から見ると、TDDサイクル・PR作成・セキュリティ監査・AIO監査など多数の Skill description は「この作業では使わないメニュー」として視界に残る。

**影響**: 自動発動可能な Skill 群の description がコンテキストに常駐し、エージェントが各判断で考慮する選択肢が実作業に対して過剰。実害は限定的 (gating が効いているため誤発動は起きにくい) だが、グローバルハーネスの汎用性ゆえの帯域コストが本PJ視点では「休眠メニュー」として存在する。

**関連原則**: (→V-1.3) 選択肢は推論前に絞る / (→C-1.1) コンテキストの能動的管理

**改善案**:
```
# これは「グローバルハーネスの設計トレードオフ」であり本PJ固有の欠陥ではない。
# 対処するなら方向は2つ:
# 1. 本PJで恒常的に不要な workflow skill を managing-skills で無効化
#    (ただしグローバル harness の汎用性を損なうため非推奨)
# 2. 現状維持: 明示呼出専用マーキング + 最小 allow で既に抑制済み。
#    「休眠メニュー」は汎用ハーネスの許容コストと割り切る (推奨)
#
# → 構造的には既に良好。⚠️ は「本PJ視点での休眠メニュー」の指摘であり、
#    グローバルハーネスとしては ✅ 相当。積極対処は不要。
```

---

### D3. セッション間の記憶が腐っていないか ⚠️

**検出事実**: `autoMemoryEnabled:false` により本PJには型付きMemory (`~/.claude/projects/.../memory/MEMORY.md`) が存在しない。セッション間継続は (1) `.docs/logs/shared/` の 60+ 件の git追跡ログ (日付+トピック命名、体系的) と (2) `handoff-state.md` (YAML frontmatter・機械可読・ただし gitignore でローカル限定) が担う。ログのメンテ衛生は実践されている (handoff-state 内で「先行ログ gap-analysis.md の記述は現状と乖離、今回の調査ログで最新化済」と陳腐化を明示フラグ)。一方で、60+ 件のログを束ねる単一インデックスは無く、陳腐化した原ログ (gap-analysis.md) は後続ログで訂正されるが原本は残置される。

**影響**: 新規セッションが handoff-state (gitignore=ローカルのみ) を読まずに `.docs/logs/shared` を grep して着手した場合、インデックス不在ゆえ関連ログの発見に手間がかかり、訂正前の陳腐化ログ (gap-analysis.md) に先に当たって誤った前提を得るリスクが残る。pickup skill + SessionStart/Stop hook が handoff 復元を支えるため実害は緩和されているが、D3 が問う「このMemoryだけで正しく再開できるか」の観点では、ログ層に索引と陳腐化マークの構造化余地がある。

**関連原則**: (→K-1.2) 記憶は保存前に監査・修復する / (→K-2) 古い情報はノイズ / (→K-1.1) Restartable Handoff

**改善案**:
```markdown
# .docs/logs/shared/INDEX.md を新設 (10分)
# 60+ログをテーマ別に分類し、各行に「現行/上書き済(→後継ログ)」を明記する。
# 例:
## C-4 外部検証器
- 2026-06-02_c4-external-verifier-implementation.md [現行]
- 2026-05-30_note-harness-gap-analysis.md [⚠️ 一部陳腐化 → 2026-07-01/2026-07-02 の再センサスで最新化]
## 記憶4型 / auto-memory
- 2026-07-02_k1-typed-memory-4types-harness-recensus.md [現行・最新]
- ...

# または陳腐化した原ログ冒頭に訂正ポインタを1行追記 (5分):
# > ⚠️ 本ログの「4型実体」記述は 2026-07-01_k1-...-audit.md で最新化済
```

## 強み

- **C カテゴリ全項目 ✅ (権限と信頼境界 100%)**: `permissions.deny` が不可逆操作 (rm/sudo/git reset・rebase・checkout・switch/push) と評価基準ファイル (eslint/tsconfig/vitest/jest/prettier/biome/workflows) を網羅ブロックし、`~/.claude/settings*`・`**/CLAUDE.md`・`~/.claude/hooks/*` も deny で「自分のルールを書き換えられない」設計 (C3)。さらに sandbox の denyRead/denyWrite + 3層シークレットモデルで秘密情報を構造的に遮断。テスト改ざんは deny でなく C-4 指紋照合オラクル + team-tester への所有権分離で守る、より強い防御を採用 (C1)。
- **E3 生成と評価の物理分離 ✅**: essence-reviewing-orchestrator・各 *-reviewer-fork・team-reviewer (フレッシュコンテキスト)・detecting-framing-bias (独立2fork)・llm-debate (5fork)・enforcing-strict-tdd-cycle が `context:fork`/subagent で生成者と評価者を分離。本PJは C-3 迎合性への防御そのものを研究・実装しており、自己採点の甘さを構造的に排除。
- **B5 失敗の仕組み化 ✅**: 過去の失敗パターン (絵文字混入・ハードコードパス・秘密読取・生成コメント・plans誤配置・skill frontmatter崩れ) が PreToolUse/PostToolUse Hook に昇格済。「プロンプトで二度注意」を Hook で置換する哲学が一貫実装され、Gotcha 蓄積運用 (accumulating-reviewer-feedback) で継続昇格。

## Quick Wins — 今日できる改善

本PJは既にS グレード。以下は「微調整」レベルの提案であり、いずれも任意。

### 1. 共有ログのインデックス新設 (D3対応, 10分)

`.docs/logs/shared/INDEX.md` を作り、60+ ログをテーマ別 (C-4検証 / 記憶4型 / Hook検証 / essence更新 等) に分類。各エントリに `[現行]` / `[⚠️ 上書き済→後継ログ]` を付す。新規セッションの再開起点となり、陳腐化ログへの誤着地を防ぐ。

### 2. 陳腐化した原ログへの訂正ポインタ追記 (D3対応, 5分)

`2026-05-30_note-harness-gap-analysis.md` 冒頭に「本ログのXX記述は 2026-07-01/07-02 の再センサスで最新化済」の1行を追記。grep で先に当たっても即座に最新版へ誘導できる。

### 3. (対処不要の確認) A4 は現状維持が最適 (A4対応, 0分)

A4 の ⚠️ は「グローバル汎用ハーネスを学習サンドボックスから見た時の休眠メニュー」の指摘であり、明示呼出専用マーキング + 最小 allow で既に構造的に抑制済。本PJ限定で Skill を無効化するとハーネスの汎用性を損なうため、積極対処しないことを推奨。

## 次のステップ — 中期的な改善

- **handoff-state のトラッキング方針の再検討**: 現状 handoff-state.md は gitignore (ローカル限定) のため、別マシン/別クローンからの再開では失われる。本PJのように「git追跡ログ」を正とする方針なら、handoff の要点 (current-state ポインタ) を `.docs/logs/shared` 側にも二重化すると、D3 のインデックス役を handoff が兼ねられる。
- **ログ層の「型付き記憶」への部分昇格検討**: 60+ の学習ログのうち、恒常的に参照される結論 (C-4 検証結果・記憶4型定義など) は、時系列ログとは別に「知識層」(`.docs/knowledge/` 等の establishing-knowledge-persistence 構造) へ蒸留すると、時系列ノイズから恒久知識を分離できる。

## 総評

本PJは「学習サンドボックス」を自称しつつ、継承するユーザーレベル・ハーネス (`~/.claude/`) が 7つの構造的制約 (C-1〜C-7) への防御を体系的に実装した **S グレード (96%) の成熟ハーネス** である。権限境界・検証堅牢性・環境設計の3カテゴリは満点で、特に「自分のルールを書き換えられない」deny 設計 (C3)、生成と評価の fork 分離 (E3)、失敗の Hook 昇格 (B5) は教科書的。検出された2つの ⚠️ は、いずれも構造的欠陥ではなく最適化余地: A4 は汎用ハーネスを本PJ視点で見た休眠メニュー (対処不要)、D3 は 60+ 共有ログの索引不在と陳腐化原ログの残置 (インデックス新設で解消可)。**診断の限界**: 本スコアは「プロジェクト設定 + 継承ユーザーハーネス」の合成体を評価したものであり、プロジェクト固有 `.claude/` 単体は意図的に薄い。またファイルベース静的解析ゆえ、実際のワークフロー品質・fork レビューの実効性・暗黙知の真の有無は検出範囲外である。
