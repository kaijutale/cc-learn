---
date: 2026-07-22 10:04:19
type: study
topic: v-1-3-narrow-options-before-inference-deepdive
session: V-1.3 単独深掘り (取り入れフェーズ第8弾) — harness-adoption-audit skill 初ドッグフード (新 step 7 HTML 解説の実動確認を兼ねる)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-1.3 = 1846〜1862行、関連: V-1.2 = 1826〜1844行 / C-1 = 244〜256行 / C-5 = 569行 / V-2 = 1864行〜)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-21_v-1-2-feedback-speed-law-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-21_v-1-2-feedback-speed-law-deepdive.md]
---

# V-1.3「選択肢は推論前に絞る」単独深掘り — 判定: 取り入れ済み (3+2 経路で実測確証) · 反例 = 外部輸入 agent 4 本の tools 無指定と skill 側 defer 機構の不在

> 核心の構造事実: 「入口で絞る」は tool には機械実装済み (deferred tools = 本セッション実測で schema 非搭載 90 個超) だが、**skill には対応する defer 機構が platform に存在せず**、有効 71 skill の description が毎セッション全文注入される — 「明示呼出専用・自動誘発なし」を宣言する fork 系 14 本まで入口帯域を常時消費している。反例狩りの収穫は 2 件: [Medium] 外部テンプレ様式の agent 4 本だけ tools 無指定 (= 全ツール、残り 28 本は全て絞り済み) / [Low] explicit-only skill の description 長。deny 177 件中 **176 件**が「コマンド族/パス条件の呼出時拒否」、ツール名を丸ごと消す deny は 1 件のみ (`mcp__supabase__execute_sql` — mcpServers 未配線サーバへの防御的 deny) — 配線済みツールについては「呼出時拒否は最終防衛線、主制御は入口」の役割分担が deny の使われ方に読み取れる。

## 概要

取り入れフェーズ第 8 弾。親バッチ (2026-07-20 V章一括) の V-1.3 行は「✅ 3 経路で実装 (subagent tools 絞り / skills-disabled 28 本 / deferred tools)」— 本深掘りは再確認でなく、(a) 3 経路の実測確証、(b) 「入口で絞れるのに絞っていない箇所」の能動的反例狩り、(c) 記事の枠を超えた実装の差分抽出、に集中する。ハーネス実測は read-only Explore サブエージェントに委譲 (事実のみ回収)。本ログは harness-adoption-audit skill の**初ドッグフード**でもある (07-22 に追加した step 7 = HTML 解説生成+open の実動確認を兼ねる)。

## 内容

### note 側の定義 (1846〜1862 行)

- 一行サマリー: 「使えないツールは『呼んでから拒否』ではなく『最初から見せない』」(1848)
- たとえ: メニューから売り切れの料理を消す (1850〜1852)
- 効果: 推論の無駄遣い・コンテキスト帯域の浪費 (→C-1)・報酬ハッキングの誘発 (→C-5) を同時に防ぐ (1856, 1860)
- 実装例: Plan Mode (計画フェーズで Edit/Write/Bash が除外され「編集という選択肢が見えない」状態で推論) (1862)
- 位置づけ: 「呼び出し時の拒否 (Hook, Permission deny) は最終防衛線であり、主たる制御は推論の入力段階で選択肢を絞ること」(1862)

### ハーネス実体の対応表 (Explore scan 実測)

| note の要素 | ~/.claude の実体 | 実測値 |
|---|---|---|
| ツールを最初から見せない | `settings.json` env `ENABLE_TOOL_SEARCH: "true"` | 本セッション実測 (セッション実行時の観測値・静的ファイルから再現不可): 90 個超の tool (WebFetch/Monitor/mcp__* 群) が「名前のみ・schema 非搭載」で列挙され、ToolSearch で必要時 load |
| メニューから消す (subagent) | `agents/*.md` の `tools:` frontmatter | 32 agent 中 28 が明示絞り。verifier/debater 系は Edit/Write 非付与、最小は article-summarizer の `tools: WebFetch` 1 個 |
| メニューから消す (skill) | `skills-disabled/` へのディレクトリ移動 (managing-skills が担当) | 有効 71 / 無効 28 |
| Plan Mode | Plan Mode 本体 + plan 系 hook 群 | `hook_pre_plan_output_convention.sh` (ExitPlanMode 直前に出力規約を決定論注入) ほか Stop 系 3 本・`hook_pre_plans_redirect.sh` |
| 呼出時拒否 = 最終防衛線 | `permissions.deny` 177 / ask 30 / allow 41 + block 判定を出す PreToolUse hook 群 | deny 177 の内訳: Bash コマンド族 16 (sudo/rm/git push 等) + パス条件 160 (Read 137 / Edit 23 — Read(**/.env*) 等) + **MCP ツール全面 deny 1** (`mcp__supabase__execute_sql`、mcpServers 未配線サーバへの防御的 deny) |
| 選択肢知識の遅延注入 | Progressive Disclosure | `tool-routing.md` (「ツール選択の直前に Read」明記) 含む外出し 11 ファイル + ポインタ型 CLAUDE.md |

### 個別照合 (3 原則相当の分解)

**(1) 入口で絞る (主制御)** — 取り入れ済み。tool 軸は deferred tools が機械実装 (env 1 キーで全 MCP 含む)。skill 軸は skills-disabled 28 本の物理移動。agent 軸は tools frontmatter 28/32。
**(2) 呼出時拒否は最終防衛線** — 取り入れ済み (1 件の例外込みで精密化)。deny 177 件中 176 件が「コマンド族 or パス条件」= Bash/Read というツール自体は視界に残したまま危険部分だけ実行時拒否 — **入口で絞れない対象 (Bash の全面禁止は不可能) に deny を使う**役割分担。唯一の例外 `mcp__supabase__execute_sql` (ツール名の丸ごと deny) は、supabase が mcpServers に**未配線** (実測: 4 サーバに含まれない) の状態で置かれた belt-and-suspenders の防御 deny — 配線済みツールを deny で入口消去している例は 0 件。※初稿はこの 1 件をパス条件へ誤算入し「丸ごと消し 0 件」と 3 箇所で断定していた — step 6 の独立検証ゲートが捕捉して是正 (本 skill 初ドッグフードで、ゲートが load-bearing な誤りを commit 前に実際に止めた記録)。
**(3) 効果の同時達成 (C-1 帯域 / C-5 報酬ハッキング)** — C-1 軸は deferred tools + Progressive Disclosure。C-5 軸は「見えなければ hack できない」の他に、tools 非付与による**役割境界の強制** (verifier が Edit を持たない = レビューア分離) という記事に無い第 3 の用途が実測された (下記記事超え③)。

### 記事超え点

1. **deferred tools は「消す」より細かい第 3 の形**: 記事のメニュー比喩は「載せる/消す」の二値だが、実装は「名前は載せる・レシピ (schema) は注文時に出す」— 発見可能性を保ったまま帯域を節約する中間形。C-1 対策としては「消す」と同等、可用性では上位。
2. **「入口で絞る」を指示文書層にも適用**: `tool-routing.md` 等の Progressive Disclosure 11 ファイルは「ツールの選択肢知識」自体を入口から外し直前 Read で注入する。記事はツールの話だが、ハーネスは選択肢に関する**知識**まで同じ原則で扱う。
3. **絞りの用途拡張 = 役割境界**: tools 非付与を帯域/hack 防止でなく**レビューア分離の構造保証**に使う (verifier 系 agent は Edit/Write 非所持)。本ログ作成過程自体が実例 (step 3 scan は read-only Explore、step 6 検証者も read-only)。
4. **skill にも同原則を延長**: 記事の対象はツールだが、skills-disabled 28 本 + 探索補助 skill 2 本 (find-skills 等) 自体を無効化済み、という「メニューのメニューも消す」徹底。

### 残差 / 改善候補

- **[Medium] 外部テンプレ様式の agent 4 本が tools 無指定 (= 全ツール相当)**: `context-engineering-agent` / `frontend-developer` / `security-devsecops-expert` / `test-ai-tdd-expert` (実測: frontmatter に `tools:` 行なし。4 本とも英語 description で自作 agent の様式と非一致 — うち 3 本が "Use PROACTIVELY" を持ち、context-engineering-agent は example タグを持つ。いずれも外部テンプレ由来のマーカーだが入手経路そのものは静的に確定不可)。残り 28 本が全て絞られている中、この 4 本だけ入口が全開 — 特に security-devsecops-expert は監査役なのに Edit/Write を持ち、自作 verifier 系の「監査者は read-only」慣行とも不整合。tools frontmatter 追記で閉じられる実行可能な残差。
- **[Low] explicit-only skill の description が入口帯域を常時消費**: fork 系 14 本 (`ls skills/ | grep -- -fork` 実測) は「明示呼出専用・自動誘発なし」を宣言しつつ、description 全文が毎セッション注入される (実測: 本セッションの skill 一覧に全 71 本が description 付きで列挙)。**skill 版 ENABLE_TOOL_SEARCH に相当する defer 機構は settings/hooks に見つからない** (scan 実測) — defer 機構の不在自体は platform の構造限界 (Skill ツールで呼ぶには一覧に載っている必要がある) ゆえ gap ではなくトレードオフとして記録。ただし explicit-only skill は auto-trigger マッチングに description を使わないのだから、**description を最小化する**緩和は打てる (呼出名 + 1 行で足りる)。
- 意味論注記: 「どの skill/tool を active に保つべきか」の選別自体は意味論判断ゆえ機械化対象外 (V-1.2 と同じ意味論/決定論境界)。

判定: 取り入れ済み — 親バッチの 3 経路を実測で確証し、deny の使われ方 (177 件中 176 件が条件付き呼出時拒否、ツール丸消しは未配線サーバへの防御的 1 件のみ) が「最終防衛線」配置の証拠として読み取れる。残差は Medium 1 (外部テンプレ様式 agent 4 本の tools 無指定) + Low 1 (explicit-only skill の description 帯域)。

## 関連ファイル

- `~/.claude/settings.json` — env.ENABLE_TOOL_SEARCH / permissions (deny 177 = Bash族16 + パス160 + MCPツール1・ask 30・allow 41)。mcpServers キーは settings.json 側に無い
- `~/.claude/agents/*.md` (32 本) — tools frontmatter の絞り 28/32、無指定 4 本の特定
- `~/.claude/skills/` (71) / `~/.claude/skills-disabled/` (28) — skill 入口制御の実測
- `~/.claude/hooks/hook_pre_plan_output_convention.sh` ほか plan 系 hook — Plan Mode 補強
- `~/.claude/.docs/progressive-disclosure/tool-routing.md` — 選択肢知識の遅延注入 (「直前に Read」明記)
- `~/.claude.json` (ホーム直下、`~/.claude/` 配下ではない) の mcpServers (4 サーバ: brave-search/chrome-devtools/context7/firecrawl) — MCP 定義の所在 (scan 実測。claude-in-chrome は同キーに無く extension 経由)
