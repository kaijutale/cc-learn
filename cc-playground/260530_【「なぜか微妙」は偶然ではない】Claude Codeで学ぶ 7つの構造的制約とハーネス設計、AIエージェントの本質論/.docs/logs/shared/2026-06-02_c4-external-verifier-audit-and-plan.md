---
date: 2026-06-02 10:10:40
type: qa
topic: c4-external-verifier-audit-and-plan
session: C-4 外部検証器 — 解説 / ハーネス調査 / plan細分化 / 着手前HTML

related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, logging]
related_agent: [Explore, Plan]

related_plan_id: 2026-06-02-external-verifier-gap-closure
related_plan: .docs/plans/2026-06-02-external-verifier-gap-closure.md
related_log_ids: [2026-05-30_note-harness-gap-analysis, 2026-05-24_llm-7-constraints-c-prefix-meaning]
related_log: [2026-05-30_note-harness-gap-analysis.md, 2026-05-24_llm-7-constraints-c-prefix-meaning.md]
---

# C-4 外部検証器の構造的組み込み — 解説・ハーネス調査・plan細分化

> C-4「自己申告は完了の証拠にならない」の設計パターンを解説し、かもねのハーネスの外部検証器組込度を調査。5つの穴を特定し、後方互換の改修planをハブ&スポーク6+1に細分化。着手前HTML解説も生成。実装は未着手。

## 概要

かもねの2つの問い ——①外部検証器の構造的組み込みの設計パターン解説、②自分のハーネスに取り入れているかの調査—— から開始。回答後、見つかった穴を塞ぐ改修plan作成 → 着手前HTML解説 → planのハブ&スポーク細分化、まで進めた。ハーネスのコード改修(実装)はかもねの「GO」待ちで未着手。

PDF (124p、画像ベースでpdftotext不可→Readでページ抽出) の C-4 / V章 / C-5 を直接参照して回答の根拠にした。

## 内容

### Q1: 外部検証器の構造的組み込み (設計パターン)

パターン名「物理的事実による完了判定」。3本柱:
1. **検証手段を信頼度で選ぶ** — exit code / Hook pass-fail / curl HTTP / git diff = 最高(捏造不能)、別文脈レビュー = 高、LLMの「完了しました」= 最低。原則「exit codeは嘘をつかない」。
   - 注 (2026-06-02 追記): 「curl HTTP」は書籍が挙げる一般例。本ハーネスは curl/wget を禁止 (egress遮断) しているため、HTTP 疎通/ステータスを物理的事実として取る検証は `mcp__chrome-devtools__list_network_requests` / `mcp__claude-in-chrome__read_network_requests` の network 観測で代替する。理由は [[feedback_curl-ban-rationale]] / plan `2026-06-02-curl-hook-overblock-fix.md`。
2. **Acceptance Test First** — 完了条件を複数の物理的事実のAND結合で先にテスト化(`git diff に test改変なし` を含め報酬ハッキング対策も兼ねる)。
3. **Verify-Fix Loop** — 検証通過までループ、完了宣言は終了条件に関与させない。閉じたループの3要素=数値化合格基準 / 構造化フィードバック / 最大ループ回数。
補強: 失敗の昇格ラダー(L0口頭→L1注意喚起→L2スクリプト→L3 Hook/CI)、観測面設計、評価基準の保護(不可侵テスト+検査官と作業者の分離)。

### Q2: かもねのハーネス調査 (Exploreエージェント委譲 + 自前裏取り)

既に **Level 3 (最強層) まで実装済**。`hook_stop_words` で推測・ヘッジ遮断、`hook_pre_commit_essence_gate` でcommit gate、reviewer系agentのEdit/Write剥奪で検査官/作業者分離、`permissions.deny` でeslintrc/tsconfig/vitest.config/CLAUDE.md/hooks/settings保護 + git push禁止。信頼度「最高」ランクを構造的に組込済。

**見つかった5つの穴 (優先度順)**:
- P0 テスト改ざん防止 (team-implementerがテスト書換可、防止は散文のみ → 偽GREEN)
- P1 カバレッジ閾値の自動検証なし (閾値定義済だがoracleが読まない)
- P2 コード循環依存検出なし (structure側が行数チェックのみ)
- P3 ループ状態がin-memory (coder.md:150 ADJUST_LOOP_MAX=3 はあるが自分で数える)
- P4 検証器起動が任意 (※書籍方針で意図的に手動、強制はしない)

### plan作成 → HTML → 細分化

- 改修plan作成 (Planエージェント委譲)。全て後方互換拡張、S1-S9段階。MVP心臓=P0。
- 着手前HTML解説生成 (explain-in-html v6 Thariq Dark Editorial)。
- 「5つの穴=5つの改修箇所?」→ No (1対1でない: 新規8本/既存改修3-4本/ステージ9)。coder.md 1ファイルにP0/P1/P3/P4が集中、逆にP0は5箇所に分散。
- 段階的開示で細分化。AskUserQuestionで粒度確定(穴ベース6 vs ステージ9)→**穴ベース6採用**。ハブ1(75行)+スポーク6(34-62行)、双方向リンク検証済。

## 重要な学び / grayzone (残す価値)

- **自己修正**: P3を初回「ループカウンタが無い」と報告 → 裏取りで coder.md:150 に `ADJUST_LOOP_MAX=3` の実カウンタ+サーキットブレーカーが**実在**と判明。正しくは「在るが in-memory で外部強制が無い(自分で自分のループを数える=C-4構造)」。Exploreの結果を鵜呑みにせず自前grepで裏取りした価値が出た。
- **Plan mode中はHTML生成不可**: plan modeはplanファイル以外のWriteを全block。HTML解説にはExitPlanMode必須だった。「着手前にHTML」の指示は、exit→HTML→GO待ち の順序で解決。
- **plan出力先**: `~/.claude/plans/` は `hook_pre_plans_redirect.sh` でblock、正は `<project_root>/.docs/plans/YYYY-MM-DD-<topic>.md` (project_root=cwd)。Plan mode既定の `~/.claude/plans/plan-*.md` をかもねhookが上書き。
- **設置権限の非対称**: `~/.claude/skills/` 配下は permissions.deny に無く直接Write可。`~/.claude/hooks/` と `settings.json` はEdit/Write deny → /tmp正本→かもね手動cp+chmod / 手動編集。
- **P0の落とし穴**: `*.test.*` 一律denyはteam-testerのREDフェーズ(テスト作成)を壊す。改ざん防止は「書込block」でなく「RED完了時にgit-hash凍結→verify時に第三者(coder)が照合」が正解。
- **logging skill の cwd汚染**: 直前のBashで shell cwd が `.docs/plans` に移動済 → skillの !構文 が相対パスで shared/ を誤検知(空表示)。project root絶対パスで実態確認して回避。このPJはログを `.docs/logs/shared/` 直保存(グローバルskillのlocal-onlyをPJ CLAUDE.mdが上書き)。

## 関連ファイル

- `.docs/plans/2026-06-02-external-verifier-gap-closure.md` — 改修planハブ
- `.docs/plans/2026-06-02-verifier-00-shared-infra.md` 〜 `-p4-reviewer-visibility.md` — スポーク6本 (土台 / P0 / P1 / P2 / P3 / P4)
- `.docs/output/explain-in-html/260602_c4-external-verifier-gap-closure.html` — 着手前の視覚的見取り図
- `.docs/references/sources/pdf/260405_…本質論.pdf` — C-4 原典 (p24-33 C-4本体, p79-96 V章/C-5)
- 既存関連ログ: `2026-05-30_note-harness-gap-analysis.md`, `2026-05-24_llm-7-constraints-c-prefix-meaning.md`
- 次アクション: かもねの「GO」で S1(土台)から実装着手予定 (未着手)
