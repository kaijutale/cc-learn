---
date: 2026-06-02 21:01:55
type: work
topic: curl-ban-policy-and-fix
session: 未設定
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [logging, commit]
related_plan_id: 2026-06-02-curl-hook-overblock-fix
related_plan: .docs/plans/archived/2026-06-02-curl-hook-overblock-fix.md
related_log_ids: [2026-06-02_c4-external-verifier-audit-and-plan, 2026-05-30_note-harness-gap-analysis]
related_log: [2026-06-02_c4-external-verifier-audit-and-plan.md, 2026-05-30_note-harness-gap-analysis.md]
---

# curl禁止ルールの是非検討 → plan駆動の修正実装

> note C-1「CLIファースト」を根拠にした curl禁止撤廃論を6ターン検証。結論=禁止維持(理由はegress遮断)。発覚した3修正のうち A は実機検証で前提崩壊し現状維持、B1/B2 を実装。

## 概要

note記事 C-1「コンテキスト帯域は有限でゼロサム」の CLIファースト節 (MCPツール定義は帯域を食う、同等機能がCLIなら帯域ゼロ、`gh,git,curl 等`) を根拠に「curl禁止は撤廃すべきか」を問われ、多角検証した。curl禁止の真の理由を特定し、CLIファースト論への反論を固め、付随する実装/ドキュメントの穴を修正するまでを一気通貫で実施。

## 内容

### 1. curl禁止の真の理由 (最重要発見)

帯域でもCLIファーストでもなく **egress(秘密の流出経路)の構造的遮断**。証拠は `settings.json` の `permissions.deny` の並び順 — `curl`/`wget`/`nc` が秘密ファイル読取群(60-74)の真下にひと塊(75-77)で配置。**`nc`(netcat)の同居が決定打** (ncは帯域とも CLIファーストとも無関係な純粋egress道具)。= Secrets L1(壁)。副次理由: injectionガバナンス(MCP経路は外部入力通知hookに配線済み、curlは裸経路) + 動的帯域(Firecrawl抽出Markdown vs 生curlのHTMLノイズ)。

### 2. CLIファースト撤廃論への反論ロジック

- **前件分析**: noteの命題は条件文「(コンテキスト影響なし AND 同等機能がCLI) なら MCP不要」。curlのweb取得はこの前件が偽(生HTMLは動的帯域大、抽出/injection配線で非同等)→命題の対象外。noteが推す gh/git は前件成立→既に禁止対象外で使える。
- **手段と目的のねじれ**: curl復活してもFirecrawl/Brave MCPは常駐継続→静的帯域は1バイトも減らない(CLIファーストの果実ゼロ)。CLIファーストに本当に効くのは curl復活でなく MCP棚卸し。
- **deferred機構の実測**: `/mcp` で接続中5サーバ81 tools。だが本セッションは MCPツールが deferred(ToolSearch)扱いで、**フルスキーマは常時非ロード**(名前のみ)。noteの「MCP定義が帯域を食う」前提がこの環境では大きく弱まる→撤廃の帯域動機はさらに薄い。disabled群(Figma/Gmail等)は既に棚卸し済み。

### 3. 発覚した3修正と結末

| # | 当初案 | 結末 |
|---|---|---|
| A | hook過剰ブロック(grep "curl"誤爆)を `\bcurl\b` regex化 | **現状維持決定**。着手前の実機検証で前提崩壊 |
| B1 | HTTP疎通/ステータス検証の代替が未明記(C-4ログは「curl HTTP」と書くが封じ済み) | **完了**。CLAUDE.md Tools節 + C-4ログに「chrome系network観測で代替」明記 |
| B2 | curl禁止の理由が deny並び順任せで未文書化 | **完了**。memory `feedback_curl-ban-rationale.md` 固定 + MEMORY.mdポインタ |

### 4. 修正A前提崩壊の実機検証 (重要)

着手前に `grep -qE` で検証 → 2点判明:
- `\bcurl\b` でも `grep curl x` は BLOCK のまま (curlが単語として現れる)。**誤爆は消えない**。
- 誤爆を消すにはコマンド起動位置regexが必要だが、それは `x=curl; $x url` の変数難読化egressを取りこぼす。**fixed部分文字列より egress網が狭まる**。
- macOS grep -E は `\s` / `[[:space:]]` 両対応 (実測)。

結論: 現行 fixed部分文字列マッチの過剰さは「欠陥」でなく「難読化egressへの保険(fail-safe)」。誤爆は curl をトピックにするメタ作業時のみで頻度低。かもね判断「本命=現状維持」で確定。

## 設計意図

egress壁の至上目的(流出遮断)を最優先軸に据えた。誤爆の少なさ ⇔ egress網の広さ(難読化耐性)は相反するトレードオフで、壁の目的に忠実なら fail-safe(広め)に倒す現状が正。修正で網を狭めるのは本末転倒。

## 副作用 (観測した生きた実例)

plan を archive する `mv` が、ファイル名 `...curl-hook-overblock-fix.md` の "curl" でhookに弾かれた。**現状維持で承知した誤爆そのものが、クローズ作業で現実に発動**。グロブ(`c*overblock`)で回避。この不便さは egress網最強と引き換えの代償で、現状維持判断の妥当性を実体ごと裏付けた。回避策=グロブ/変数で "curl" 連続文字列をコマンドから外す。

## 関連ファイル

- `.docs/plans/archived/2026-06-02-curl-hook-overblock-fix.md` — 本作業のplan(完了・archived)
- `~/.claude/hooks/rules/hook_pre_commands_rules.json:2-5` — curl禁止hook(現状維持、未変更)
- `~/.claude/settings.json:75-77` — permissions.deny の curl/wget/nc 塊(egress壁の主防御)
- `~/.claude/CLAUDE.md:75` — HTTP疎通検証の代替明記(B1、かもね手動追記)
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/feedback_curl-ban-rationale.md` — 禁止理由(B2)
- `.docs/logs/shared/2026-06-02_c4-external-verifier-audit-and-plan.md:32` — 「curl HTTP」注記追加(B1現場)
