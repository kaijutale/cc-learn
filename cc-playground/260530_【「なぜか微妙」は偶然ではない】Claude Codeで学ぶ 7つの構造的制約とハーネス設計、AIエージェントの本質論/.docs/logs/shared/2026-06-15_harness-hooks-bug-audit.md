---
date: 2026-06-15 00:57:11
type: observation
topic: harness-hooks-bug-audit
session: harness-hooks-bug-audit
target: ~/.claude/hooks/ の hook 22本 (essence-gate含む) + three-elements 制限hook の実装バグ
verifier: メインClaude (Opus 4.8 1M) + general-purpose subagent ×7 (並行)
related_skill: [explain-in-html, handoff, logging]
related_plan_id: 2026-06-15-harness-hooks-bug-fix
related_plan: .docs/plans/2026-06-15-harness-hooks-bug-fix.md
related_log_ids: [2026-06-02_curl-ban-policy-and-fix]
related_log: [2026-06-02_curl-ban-policy-and-fix.md]
---

# ハーネス hook 群バグ徹底監査 — 22 hook / 60件の実機観測

> 別セッションの「essence-gate にバグがある」という指摘を起点に、ハーネスの hook 22本を全数実機観測。60件のバグ(Critical 3/High 18/Medium 17/Low 22)を /tmp 再現で確証し、完全版HTML + 修正planまで作成。実装は未着手。

---

## 検証目的

- 起点: 別セッションが `hook_pre_commit_essence_gate.sh` のバグを指摘(緊急タスク中ゆえこちらで調査依頼)。
- 拡大: essence-gate 確定後、「他の hook にも同種バグが潜んでいないか」を全数調査。
- 仮説: 1本にバグがあるなら、同じ書き手・同じ設計思想の他 hook にも同型バグが分布しているはず。

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `~/.claude/hooks/` (Read tool 経由) + `/tmp` (実機再現) |
| ツール | bash 3.2 / jq / grep (BSD/macOS) / awk / Read tool |
| セッション | Claude Code Opus 4.8 (1M) メイン + general-purpose subagent ×7 並行 |
| 実施日時 | 2026-06-14 〜 2026-06-15 |
| その他環境差 | `~/.claude/hooks/` への bash 直アクセス(ls/wc/cp)が保護 hook (`hook_pre_commands.sh`) で block されるため、ファイルは Read tool で読み `/tmp` にコピーして再現 |

## 実測結果サマリ

| 指標 | 値 | 備考 |
|---|---|---|
| 調査 hook 数 | 22 | hooks直下19 + three-elements 2 + essence-gate(先行) |
| 検出バグ総数 | 60 | Critical 3 / High 18 / Medium 17 / Low 22 |
| 重大(C+H)なし hook | 5 | bang_lint, compact_handoff, external_input, plan_archive, plans_redirect |
| subagent 完走 | 6/7 | Group F が2度中断 → stop_words はメインで巻き取り |
| 件数の概算 vs 精査 | 62 → 60 | 俯瞰版はsubagent自己申告の概算。完全版でPython自動集計、Medium転記漏れ1件を自己発見し修正 |

## 各Stage 詳細結果

### essence-gate (先行調査, Critical 1 / High 2)
- **結果**: ❌ 両方向に故障
- **観測**: glob `*_self-eval-v*.md` が新命名 `__path.md` を取り逃し(L68)、散文 grep が前置きの過去値を head -1 で誤採用(L86-88)、最新フォーマットは verdict 行も連続形式も持たず抽出が常に0/0で不適格を見逃す(L86-88 fail-open)。
- **学び**: 「最新を選ぶ」「合否を読む」の2段が両方壊れ、誤block(false positive)と誤approve(false negative)を同時に起こす。

### Group A-G (21 hook, 7 subagent 並行)
- **A (pre-bash)**: word-splitting地雷(L29) / git -C commit取りこぼし(L29)。
- **B (post-lint)**: ❌ emoji検知ゼロ(grep -P がBSD grepで不発, L9) = Critical / Unicode範囲穴。
- **C (skill-lint)**: wc -l off-by-one(501行取りこぼし) / frontmatter閉じ忘れ見逃し / matcher MultiEdit欠落。
- **D (read/write)**: ❌ secret が .env.example 誤ブロック(L42, CLAUDE.md L56矛盾) = Critical / filename-only取りこぼし / hardcode行単位すり抜け。
- **E (notify/session)**: 未push件数 fail-silent(L10) / mcp_notify アンダースコア抽出破綻。
- **F (stop)**: 2度中断 → メイン巻き取り。stop_words 部分一致誤検知を実証(6例中5件BLOCK)。
- **G (compact/3elem)**: ❌ three-elements 保護が3経路で破れる(phase引用符失効 / 空phase fail-open / パストラバーサル) / validate_claudemd が正常CLAUDE.mdを毎圧縮stale誤報告。

## 重要発見

1. **`/review-harness` の構造的死角** — review-harness(25指標のハーネス診断)が60件を1つも検出しなかった理由は、欠陥でなく**スコープ境界**。SKILL.md Phase 1 の読込対象は settings.json の「hooks **配線構造**」までで、hook の `.sh` 実装は読まない。25指標(特に B1/B4/B5)は「検証の仕組みが**あるか**」を問い「**動くか**」は問わない。**結果、emoji hook は配線済みゆえ B1 で ✅(満点)が付くが、実体は検知ゼロ。** 「存在=機能」を暗黙に仮定する設計。検証器(hook)を検証する上位層が欠けていた。

2. **5つの構造的根因が横断** — (1)文章を正規表現でparse (2)fail-open見逃し (3)命名/ツール名の決め打ち (4)境界の数え違い (5)シェル変数の素の展開。essence-gate 単体でなく hook層全体の設計の癖。

3. **Critical 3件は全て「検証器自身の機能不全」** — emoji検知ゼロ / secret誤ブロック / essence-gate見逃し。守る側が壊れているのが最も危険(壊れたまま「合格」を返し続ける)。

4. **subagent 中断時のフォールバック運用知** — Group F が最終報告手前で2度中断(出力がツール呼び出し途中で停止)。SendMessageでの再開も再中断。3度目を待たず**メインが stop_words 検証を巻き取り**、Read + /tmp 再現で確定。中断パターンに陥った subagent は再起動でなく主処理が引き取る方が速い。

5. **概算と精査の差(自動集計の価値)** — subagent 自己申告の合算は概算(62件、Low を多めに計上)。完全版で全件を Python データ化し自動集計したら60件で、その過程で Medium 1件(secret fail-open)の転記漏れを自己発見・修正。手集計は信用しすぎない。

6. **保護 hook 自身の over-block** — `~/.claude/hooks/*` への ls/wc/cp という読取コマンドまで `hook_pre_commands.sh` が block した。これ自体が検出バグの1つ(rules の保護パス規則が read 方向も巻き込む, Medium)。皮肉にも調査対象のバグが調査を妨げた。

## 改善候補

- 修正は `.docs/plans/2026-06-15-harness-hooks-bug-fix.md`(5 Phase, severity順 + 根因5の構造対処)に外部化済み。実装は GO 判断待ち。
- **最重要の再発防止**: 「hook 実装を検証する層」の恒久化(今回手でやった /tmp 再現検証の自動化)。これが `/review-harness` の死角を埋める。

## 結論

ハーネスの hook 層には、同じ設計の癖から生じた60件のバグが広く分布する。Critical 3(検証器の機能不全)と three-elements の保護失効は現在進行形。個々は小修正だが、根因5を設計統一で断ち、かつ「検証器を検証する層」を作るのが本筋。本セッションは調査・可視化・計画・引き継ぎまでで、hook 本体は無傷。

## 関連ファイル

- `.docs/output/explain-in-html/260614_essence-gate-hook-3bugs.html` — essence-gate 深掘り(3バグ)
- `.docs/output/explain-in-html/260614_harness-hooks-bug-audit.html` — 21 hook 俯瞰版
- `.docs/output/explain-in-html/260615_harness-hooks-full-audit.html` — 完全版(全60件深掘り)
- `.docs/plans/2026-06-15-harness-hooks-bug-fix.md` — 修正plan(status:planning)
- `.claude/handoff-state.md` — 本セッションの引き継ぎ状態
