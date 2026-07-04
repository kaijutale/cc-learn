---
type: knowledge
category: research
title: "Research: review系skill 3系統の欠落洗い出し"
status: active
created: 2026-07-03
updated: 2026-07-04
topic: review-skills-gap-analysis
sources:
  - ~/.claude/skills/review-harness/ (SKILL.md / diagnosis-rubric.md / diagnosis-report-template.md / html-report-template.html / quickstart-guide.md / ogp/)
  - ~/.claude/skills/review-agent-essence/ (SKILL.md / reference/agent-essence.md / html-report-template.html)
  - ~/.claude/skills/essence-reviewing-orchestrator/ (SKILL.md / references/ / scripts/)
  - ~/.claude/skills/{harness,skill,ui}-essentials-reviewer-fork/SKILL.md
  - ~/.claude/agents/{harness,skill,ui}-essentials-reviewer.md
  - ~/.claude/.docs/essence/essence-docs/{harness,skill,ui}-essentials.md
  - ~/.claude/skills/{proposing-essence-updates,accumulating-reviewer-feedback,judging-review-severity,blinding-review-prompt}/SKILL.md
  - ~/.claude/.docs/progressive-disclosure/harness-modification-policy.md
  - ~/.claude/.docs/logs/local/ (review-harness 反復改善ログ round1〜11 ほか)
related:
  - .docs/plans/2026-07-03-review-skills-enhancement.md
  - https://github.com/kaijutale/claude-harness/issues/73 (〜 #83 の11件)
---

# Research: review系skill 3系統の欠落洗い出し

> 2026-07-03 実施。Explore agent 3体 (skill 1つ = 1体) が対象を全文 Read して現状事実と欠落を8次元で洗い出し、
> Lead が load-bearing な主張を直接 Read/grep で裏取りした統合記録。事実と参照のみを記録し、
> 設計判断は related の plan (`2026-07-03-review-skills-enhancement.md`) に分離。
> ※ 2026-07-03 に `.docs/logs/shared/` へ誤配置 → 2026-07-04 に conducting-research-phase 規約準拠で本パスへ移設。

## 調査目的・スコープ

**問い**: review系skill 3系統 (`/review-harness`・`/review-agent-essence`・essence-reviewing-orchestrator 一式) には、レビュー装置として何が欠けているか。強化 (別途 plan) の前段として、事実・欠落・壊してはいけない契約を確定させる。

**スコープ内**: 3系統の skill/agent/評価基準ドキュメントの全ファイル、関連品質インフラ (proposing-essence-updates / accumulating-reviewer-feedback / judging-review-severity / blinding-review-prompt) との接続有無、過去の運用ログ。
**スコープ外**: 強化案の設計・優先度判断 (plan の領分)。

**調査体制**:
- subagent 1: `~/.claude/skills/review-harness/` 全文調査 (Explore)
- subagent 2: `~/.claude/skills/review-agent-essence/` 全文調査 (Explore)
- subagent 3: essence 協調ハーネス一式 (orchestrator + fork×3 + subagent×3 + essence-docs + proposing-essence-updates) 全文調査 (Explore)
- 裏取り: Lead がグレード表・severity-routing・「11原則」grep・check-essence-sync.sh を直接確認

**分析フレーム (8次元)**: A.カバレッジ / B.精度 / C.再現性 / D.出力実用性 / E.鮮度・更新経路 / F.自己改善 / G.統合性 / H.契約 (壊せない依存)

## 事実・発見

### 横断的発見 (3系統に共通する構造)

- **評価基準の正本分裂**: `review-agent-essence/reference/agent-essence.md` (2026-04-05凍結・39ノード) を
  review-agent-essence と review-harness rubric の原則IDが参照。一方、更新ループ
  `proposing-essence-updates` が育てる正本は別体系 `~/.claude/.docs/essence/essence-docs/{harness,skill,ui}-essentials.md`。
  同期機構ゼロ (`check-essence-sync.sh` の射程外) — 「誰も更新せず誰も乖離を検知しない」
- **迎合・アンカリング対策の未配線**: `blinding-review-prompt` / `judging-review-severity` が存在するのに
  review-harness・review-agent-essence は未接続。essence fork は git log/著者文脈を subagent へ能動注入
- **自己改善ループの分断**: review-harness / review-agent-essence は self-eval 出力ゼロ。
  essence 系のみ essence-review-records + essence-gate hook で観測面が機能

### 1. review-harness (25アンチパターン指標のハーネス診断)

**現状の事実**
- 構成: SKILL.md (118行, `context:fork` / `agent:general-purpose` / `model:opus`) + diagnosis-rubric.md (377行) +
  diagnosis-report-template.md + html-report-template.html + quickstart-guide.md + ogp/rank-{s..e}.webp
- フロー: Phase1 収集 → Phase2 成熟度分岐 (スタートアップモード = スコア・HTMLなし) → Phase3 25指標判定
  (✅2/⚠️1/❌0/—除外) → Phase4 mdレポート (優先度 C>B>A>D>E) → Phase5 HTML+OGP+両open
- 25指標 = 5カテゴリ×5 (A帯域効率 / B検証の堅牢性 / C権限と信頼境界 / D知識と記憶 / E環境設計)。
  全指標が LLM 判断ベース (機械照合の指示は D2 のパス実在チェックの部分1件のみ)
- グレード 6段階 (S:90+/A:75-89/B:60-74/C:40-59/D:20-39/E:<20)
- rubric の原則ID (C-1/V-1/S-1/K-1/T-1/E-1系) は agent-essence.md 体系のラベル (実行時に同ファイルは読まない)
- 出力実績: `~/.claude/output/` に約25件 (2026-04-05〜06-25)。反復改善ログ round1〜11 が `~/.claude/.docs/logs/local/` に約15本

**欠落 (確定事実)**
- [A/確定バグ] グレード定義3ファイル不一致: diagnosis-report-template.md:41-47 だけ旧5段階 (D=<40%・E行なし)。
  SKILL.md:93 / html-report-template.html / ogp (rank-e.webp 実在) は6段階 — Lead 直接 Read で確認済み
- [A] 2026機能カバレッジ: rubric 全377行に Agent Teams / autoMemory / Workflow / sandbox /
  新hookイベント / output-styles / statusline = 全て grep 0件
- [B] 見逃しの実証: 満点S判定直後に別 subagent が弱点を後出し指摘した記録 (logs/local/2026-06-26_issue47-49)。
  blinding-review-prompt / judging-review-severity と未接続
- [C] 再現性の実証: 同一ハーネスに 50点満点rubric / 48点rubric / 92% S-rank と診断軸が回で揺れた記録
  (logs/local/2026-04-13, 2026-04-14)。—判定の主観で分母も変動
- [D] 強み (実測): Quick Wins コピペ可能スニペット・優先度明文化・所要時間付き
- [E] rubric 更新ループ不在: 原則IDの参照先 agent-essence.md は proposing-essence-updates の対象外
- [F] self-eval 出力ゼロ: essence-review-records に何も書かず accumulating-reviewer-feedback と未接続
  (severity-routing.md の reject リスト外であることは確認済み)
- [G] 呼び分け文書化は directing-ai-development/SKILL.md:111 の1行のみ。harness-essentials-reviewer との重複基準は未文書化
- [死角] 静的解析限界: 「配線済みか」までで「hook が実際に deny/notify するか」は見ない (既存ログが指摘)

**契約 (壊せない依存)**
出力パス `~/.claude/output/harness-diag-{date}-{HHmm}.{md,html}` / md・HTML両open / グレード6段階↔ogp対応 /
HTML palette (explain-in-html の base.html が完全一致で依存する一方向見た目契約) /
directing-ai-development からの委譲 (「診断=review-harness」) / `agent: general-purpose` 配線
(harness-modification-policy.md:66 の分布規約) / スタートアップモード分岐

### 2. review-agent-essence (agent-essence 原則の設計レビュー)

**現状の事実**
- 構成: SKILL.md + reference/agent-essence.md (同梱 rubric) + html-report-template.html。
  `context:fork` / `agent:general-purpose` / `model:opus`。scripts/ なし
- rubric = 2層39ノード: Part I 構造的制約 C-1〜C-7 (+C-1.1) / Part II 設計原則 親10 (T-1,T-2,K-1,K-2,V-1,V-2,S-1,E-1,E-2,E-3) + 子22
- フロー: Step1 読込 → Step2 関連原則選定 (全原則機械適用を禁止・固定数を書かない) → Step3 原則適用マトリクス
  (判定 ○/△/×/-) + 指摘 + 総評 + 「次のアクション」ディレクティブ → Step4 md+HTML生成・両open → Step5 ハンドオフ
  (fork は AskUserQuestion 不可ゆえ質問実行はメイン委譲)
- 出力: `~/.claude/output/essence-review-{date}-{HHmm}.{md,html}` (orchestrator 系の essence-review-records とは別)

**欠落 (確定事実)**
- [E] rubric の孤立凍結: agent-essence.md は 2026-04-05 から意味的に無変更 (06-12 の変更は
  ハードコード数削除の保守的修正のみ)。proposing-essence-updates の対象外・check-essence-sync.sh の射程外。
  essence-docs 正本群 (更新が回っている) との二重管理
- [B] severity 段階なし: ○/△/×/- のみで Critical/High/Medium/Low 不在。
  file:line 引用義務なし (essence 系 subagent は必須化済みと対照的)
- [B] 迎合対策: C-3 (迎合) を評価基準に持ちながら自分の手続きには適用していない
- [C] 決定論要素ゼロ: Step2 の原則選定が完全主観。scripts/validate 一切なし
- [G] routing 非対称: 新旧2系統の呼び分けが新系統 (orchestrator 側) にのみ記述。review-agent-essence 自身の
  SKILL.md は orchestrator 系に一切言及なし。「エッセンスレビュー」汎用トリガーは必ず旧系統に流れる。
  参照側3箇所の「汎用11原則」表記は実態 (39ノード) と不一致
- [F] self-eval 永続化なし + severity-routing.md:32 で accumulating の自動 Apply から意図的 reject (設計意図)

**契約 (壊せない依存)**
Step3 標準出力構造 (マトリクス〜次のアクション) = 「不変」明記の正の成果物 / 出力パス / ハンドオフ契約
(fork は AskUserQuestion/Plan 作成をしない) / `agent: general-purpose` 配線 / severity-routing の reject 指定 /
harness-modification-policy.md:91 の保護コア指定 / 参照側リンク (authoring-skills:207, directing-ai-development:111,127 等)

### 3. essence 協調ハーネス一式 (orchestrator + fork×3 + subagent×3 + essence-docs + 更新ループ)

**現状の事実**
- 3層構造: master (`essence-reviewing-orchestrator`) → `Skill(<domain>-essentials-reviewer-fork, args)` ×3並列 →
  fork frontmatter `context:fork` + `subagent:` → 専用 agent (tools=Read,Grep,Glob,Bash / Edit,Write 非付与 /
  model:opus / judging-review-severity プリロード)
- 評価基準正本: essence-docs/{harness,skill,ui}-essentials.md = 15/13/9 原則。改訂履歴あり
  (harness v2.5 2026-06-29 / skill v2.2 06-27 / ui v1.1 06-17)
- 出力契約: 原則適用マトリクス (関連度/判定/severity/根拠 file:line) + 結論 (🟢🟡🔴⚪) + 散文 count 併記 +
  Observability yaml — validate-verdict-consistency.sh と essence-gate hook (settings.json:233) が機械パース
- 永続化: `~/.claude/.docs/essence-review-records/` (accumulating-reviewer-feedback と essence-gate が読む)
- 更新ループ proposing-essence-updates: ①収集→②PR draft→③Discord 通知で必ず停止、④⑤は HITL。
  cron なし (課金懸念で意図的)、金曜 SessionStart リマインダー方式。harness は3サイクル稼働実績

**欠落 (確定事実)**
- [A] 領域が harness/skill/ui の3本のみ: hooks/rules/memory/agent 定義固有の essentials なし
- [B] blinding 未配線 + アンカー注入: fork が git log/status (commit message = 著者意図) を subagent に渡す。
  反インフレは subagent の自己申告のみ
- [B] fork 間 severity 較正: rubric プリロード共有のみで較正メカニズム不在
- [C] 機械検証は形式整合まで: validate-verdict-consistency.sh は yaml count ↔ 散文 verdict の突合のみ
  (Critical 見逃し自体は検証不能)
- [D] fork 間 dedup が Lead 手動: 同一問題の重複計上で severity count が歪む余地
- [E] ui-essentials は 2026-06-17 以降更新なし (3本中最古)
- [G] harness-essentials-reviewer ⇔ review-harness の呼び分けは未文書化

**契約 (壊せない依存・10項目)**
1. `Skill(<name>, args="<絶対パス>")` 単一経路 ($ARGUMENTS、target.md 廃止済) / 2. fork frontmatter /
3. subagent tools 非付与・model:opus・プリロード / 4. マトリクス列構成 + Observability yaml キー名 /
5. 散文 count 併記 (script 突合・不在で exit1) / 6. 原則数ハードコード禁止 (canonical `^## [0-9]+\.` count) /
7. essence-gate hook / 8. 永続化パス / 9. context:fork 境界 / 10. essence-docs 正本パス

### 4. Lead 裏取りで確定した追加事実

- グレード不一致バグ: template のみ5段階を直接 Read で確認 → 修正方向は一意 (E行追加・D=20-39%)
- severity-routing.md reject リスト: review-agent-essence / orchestrator / three-elements-harness /
  orchestrating-team-development / enforcing-strict-tdd-cycle / accumulating 自身 + essentials-reviewer agent×3 +
  essence-docs×3 が掲載。review-harness は非掲載。
  同ファイル:44 に「現行ポリシーは改修自体の禁止ではなく、自動経路でなく熟考経路で」と明記
- 「11原則」grep: 実在3箇所 (orchestrator/references/gotchas.md:9, skill-essentials-reviewer-fork/SKILL.md:192,
  harness-essentials-reviewer-fork/SKILL.md:173)。`test-orchestrator-scripts.sh:87` の「原則11」は偽陽性
  (検証 grep は `"汎用 11 原則|汎用11原則"` に絞る必要)
- check-essence-sync.sh: 3ドメイン名明示指定 + 番号見出し (`^## [0-9]+\.`) 前提 → essence-docs/ への
  ファイル追加はこのスクリプトを壊さない。agent-essence.md (C-/T-/K-体系) は突合ロジック不適合
- 「25」露出は7箇所 (SKILL.md L3/L11/L60/L61/L67, rubric L1, html L144)。directing-ai-development には露出なし
- ~/.claude の git remote: `https://github.com/kaijutale/claude-harness.git`

## 参照

- 調査対象の実体: frontmatter `sources` に列挙
- 改修ポリシー: `~/.claude/.docs/progressive-disclosure/harness-modification-policy.md`
  (note 参照は `~/.claude/.docs/references/note-articles/NNNNNN_*.pdf` で解決可能)
- 運用ログ (見逃し・スコア揺れの実証): `~/.claude/.docs/logs/local/` 配下 (claude-harness リポジトリ)

## 未確認点 (open questions)

- essence fork が subagent へ渡す実インジェクションの正確な中身 (git log/status の範囲・commit message 本文の有無) —
  改修前の事前検証が必要 (issue #81 に引き継ぎ済み)
- harness-essentials.md 原則13 の「出典ページ番号は要再確認 (画像PDF)」、ui-essentials v1.1 の
  「独立原則か原則1/3吸収かは HITL 判断」が未解決のまま正本に格納されている
- review-harness の HTML palette 依存 (explain-in-html) が「完全一致」を要求する範囲の正確な境界
  (palette のみか、レイアウト定数まで含むか)

## 生データ要約

- 指標・原則の規模: review-harness 25指標 (5カテゴリ×5) / agent-essence.md 39ノード (C系7+親10+子22) /
  essence-docs 原則数 15 (harness)・13 (skill)・9 (ui)
- 機械検証の分布: review-harness = 25指標中 部分的1件 (D2) / review-agent-essence = 0 /
  essence 系 = scripts 4本 + hook 2本 (形式整合まで)
- 運用実績: review-harness 出力 約25件・改善ログ round1〜11 / essence-review-records 多数 /
  feedback-accumulation ログ 2件 (v11, v12) / proposing-essence-updates 稼働 3サイクル (harness v2.3〜v2.5)
- 出力先の分布: `~/.claude/output/` (review-harness / review-agent-essence) と
  `~/.claude/.docs/essence-review-records/` (essence 系) の2系統に分裂
