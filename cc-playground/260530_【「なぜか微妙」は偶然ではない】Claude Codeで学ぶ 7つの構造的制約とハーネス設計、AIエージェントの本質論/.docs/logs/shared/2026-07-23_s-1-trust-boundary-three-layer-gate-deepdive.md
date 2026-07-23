---
date: 2026-07-23 19:17:23
type: study
topic: s-1-trust-boundary-three-layer-gate-deepdive
session: S-1「信頼境界を明示的に設計する / 3層権限ゲート」単独深掘り (取り入れフェーズ第13弾 — S章深掘りの初弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (S-1 = 1955〜2027行、関連: S-1.1〜S-1.5 = 2029〜2136 / C-5 報酬ハッキング / V-2.2 二層完了判定)
related_skill: [harness-adoption-audit, explain-in-html, logging]
related_log_ids: [2026-07-20_s-chapter-trust-boundary-permissions-adoption-check, 2026-07-23_v-2-2-two-layer-completion-deepdive]
related_log: [.docs/logs/shared/2026-07-20_s-chapter-trust-boundary-permissions-adoption-check.md, .docs/logs/shared/2026-07-23_v-2-2-two-layer-completion-deepdive.md]
---

# S-1「3層権限ゲート」単独深掘り — 判定: 取り入れ済み (3層すべて実装実在・評価基準保護は記事の例を上回る) · ただし反例狩りで deny 境界の継ぎ目 2 箇所を検出 (Medium×2: essence-docs 非保護 / hooks/lib の界面隙間)

> 核心の構造事実: note の 3層 (L1 宣言的禁止 / L2 条件付き許可 / L3 人間承認) は `~/.claude` に全て実装実在 — L1 = `permissions.deny` **177 項目** (評価基準保護 10 [note の `.eslintrc` 例と 1:1] + ハーネス自己保護 11 + secret 139 + コマンド 17 [Bash16+mcp1])、L2 = PreToolUse 条件評価 hook 11 配線 (worktree guard の段階武装 / commit gate 群 / **deny が届かない Bash 経路を字句で塞ぐ** `hook_pre_commands`)、L3 = `ask` 30 項目 + `defaultMode: default` + push=人間のみ (git-workflow.md 明文)。**設計差 1 点が重要**: note の代表例 `Edit(**/*.test.ts) → deny` は**意図的に不採用** (grep 実測 0 件) — 一律 deny は TDD の RED 作成を壊すため、C-5 テスト改ざん対策を「予防 (L1)」でなく「**検出 (verify 時の git hash-object 指紋照合** = assert-tests-unchanged.sh)」へ移設している (oracle 自身が「テストを書く瞬間は止めない - 照合は verify 時」と設計宣言)。反例狩りの収穫は **deny 境界の継ぎ目 2 箇所 (Medium×2)**: (1) **essence-docs (評価基準の正本 4 本) が L1 deny の対象外** — `.docs` 配下の deny は progressive-disclosure/** のみで、commit 段の補償 (essence-sync gate) も**原則数ドリフト検出だけ** = 数を変えない内容改変は素通り。S-1 自身の論理「検証基準を書き換えられたら検証は無意味」がハーネス自身の検証基準に完全には適用されていない。(2) **`hooks/lib/*.sh` (計 8 本、うち essence gate が実行時に source する述語/ヘルパ ~4 本) が deny 界面の隙間** — `Edit(~/.claude/hooks/*)` の単一 `*` は直下のみで lib/ に届かず (essence gate 本体は deny 済みなのに依存 lib は非 deny という非対称、Edit ツール経路のみ・Bash 経路は字句層 `\.claude/hooks` でカバー済)。ただし中和は「1 手」では効かない — gate は fail-closed 設計 (lib 不在→block) ゆえ雑な lib 編集は gate を**止める**方向に倒れ、fail-open 化には述語の精密書換 + commit 時発火の hook-test gate (lib/*.sh を HOOK_FILES に含む) の掻い潜りを要する標的化攻撃が必要。severity は下方の Medium。

## 概要

取り入れフェーズ第13弾、S章深掘りの初弾。親バッチ (2026-07-20 S章一括) は S-1 を「✅ 保護範囲が記事超え」と判定しつつ、「S章は**配備≠実効** (deny 不発・sandbox dead config) が実際に多数発見・修正された唯一の領域 — 設計の高さと実効の危うさが同居」と両面を記録済み。本深掘りは (a) 3層の実測トポロジー確証、(b) note の Before 例 (報酬ハッキング 2 経路) がどの層で閉じるかの追跡、(c) 「L1/L2/L3 のどれにも守られていない評価基準・検証器」の能動的反例狩り、に集中。ハーネス実測 (step3) は read-only Explore へ委譲 (8軸 scan)。

## 内容

### note S-1 の定義 (1955〜2027 行)

- 一行サマリー: Claude Code が触れるファイル・操作の範囲を意図的に制限する (1957)
- たとえ: 鍵付きの金庫と机の引き出し — 信頼しているかどうかではなく、万が一のリスクを構造で抑える (1959-1961)。悪意ではなく**善意の間違い**から守る (1963)
- なぜ: 「どれだけ精密なレビュープロセスを構築しても、生成エージェントがレビュー基準を書き換えられるなら検証は無意味」(1967-1969, →C-5)
- 3層 (1971-1992): **L1 宣言的禁止** (Permissions / settings.json、判断を介さない静的制御。例: `Edit(.eslintrc*) → deny`、`Edit(**/*.test.ts) → deny`) / **L2 条件付き許可** (Hooks / PreToolUse、スクリプトが条件を評価し pass/fail。例: git push は main 以外のみ) / **L3 人間承認** (Permission Mode / 対話的確認。不可逆操作に適用)
- Before/After (1994-2014): テスト不通過 → テストファイル書き換え・.eslintrc 修正で「全チェック通過!」(実際は評価基準が破壊されただけ) → 3層後は Edit(test/.eslintrc) が L1 でブロックされ「実装コードを修正してテストを通す」**正しい行動に誘導される**
- 核心 (2016): 「正しい行動以外の経路を**物理的に**閉じる」— プロンプトのお願いは車線、deny はガードレール

### ハーネス実体の対応表 (Explore scan 実測)

| note の層 | ~/.claude の実体 | scan 実測 |
|---|---|---|
| L1 宣言的禁止 | `permissions.deny` **177 項目** (settings.json L59-235) | 評価基準保護 10 (`Edit(**/.eslintrc*)` L223 = note の例と 1:1、eslint.config/tsconfig/vitest.config/jest.config/prettier/biome/CI workflows) + ハーネス自己保護 11 (settings*/hooks/*/rules/**/skills/**/agents/**/CLAUDE.md/hooks/rules/*) + secret 139 (Read137+Edit2、大文字小文字変種網羅) + コマンド 17 (Bash16+mcp1: sudo/rm/git push/curl/wget 等) |
| L2 条件付き許可 | PreToolUse 条件評価 hook 11 配線 | worktree write guard (「起動時 or 現在地が linked worktree」で武装→ config 外 write を deny、governance 記録 3 dir は allow 例外) / commit gate 群 (essence: verdict 適格∧非stale∧hook テスト緑∧sync 無ドリフト / adr: verify-adr exit) / `hook_pre_commands` = **「permissions.deny が届かない Bash 経路を字句で塞ぐ層」と自称** (redirect/tee/cp/mv で settings\|hooks\|CLAUDE.md への書込を字句 deny) |
| L3 人間承認 | `ask` 30 項目 + `defaultMode: "default"` + 運用規則 | ask = インタプリタ eval 系 / project settings 編集 / bash -c 系 / git 破壊系 / npx・node / Keychain。push=人間のみ (git-workflow.md L8「push は かいじゅう依頼時のみ」) — note の「不可逆・外部影響は人間承認」の実装 |

### note の Before 例 (報酬ハッキング 2 経路) の閉じ方 — 設計差が核心

**(a) `.eslintrc` 書き換え → L1 で物理的に閉じる (note と同一)**: `Edit(**/.eslintrc*)` (L223) + config 群 10 項目。note の例がそのまま実在する。

**(b) テストファイル書き換え → L1 deny は意図的に不採用 (note と異なる解法)**:
- grep 実測: `.test.` / `.spec.` / `__tests__` に該当する deny = **0 件**
- 理由は oracle 自身が設計宣言: `assert-tests-unchanged.sh` ヘッダ「**テストを書く瞬間 (RED) は止めない (一律 deny は RED を壊す) - 照合は verify 時**」— ハーネスは TDD で**エージェント自身がテストを書く** (team-tester) ため、note の一律 deny は運用と両立しない
- 代替 = **検出への移設**: RED 直後に `git hash-object` SHA を baseline 凍結 (`--record`) → verify 時に照合 (`--baseline`)、SHA 変化=MODIFIED / 消失=DELETED → exit 1 (偽 GREEN 失敗扱い)。判定材料は「内容から決まる物理量、捏造不能」
- **射程限界 (正直に)**: この防御は TDD workflow の verify を通る場合のみ。TDD を経由しない直接編集 (baseline 不在) は射程外 (SKIPPED)

### 記事超え点 (S-1 固有)

1. **テスト deny の意図的不採用 = 予防→検出への設計移設**: note の代表例をあえて外し、TDD (エージェントがテストを書く運用) と C-5 対策を両立させた。role 分離 (テストを書くのは team-tester のみ) + verify 時の物理指紋照合で、「書けるが、書き換えたら必ずバレる」構造。記事の静的 deny より運用適合的
2. **L2 に字句照合層 (第4の面)**: `hook_pre_commands` が「deny の届かない Bash 経路」(echo リダイレクト・tee・cp 等による保護ファイル書込) を字句で塞ぐ。note の 3層に無い、**同一層内の経路別多重化** (Edit ツール経路=L1 / Bash 経路=L2 字句)
3. **段階武装 (fail-open → fail-closed)**: worktree write guard は通常セッションでは素通し (段階1 fail-open)、worktree 文脈を検出すると武装し fail-closed 化。「条件付き許可」の条件自体が動的
4. **「配備≠実効」の自己観測・修正の運用層**: deny を書いたら終わりでなく、実効性を観測して直した履歴が積まれている — #178 (Write 形式ルール 25 個が仕様変更で失効 → Edit 形へ置換・現 deny に Write() 0 件で反映確認) / #186 (sandbox 層が dead config と実測記録・permission 層は複数経路で実効。「202本/3経路」の具体数は issue body 未照合) / #157 (worktree guard が無条件 allow だった Critical を essence review が検出・修正)。権限設計を**生きたシステムとして保守する層**は記事に無い

### 反例狩り (L1/L2/L3 のどれにも守られない評価基準・検証器 — scan §8)

**守られている側 (確認)**: oracle 群 (assert-*.sh / verify-adr.sh) は `Edit(~/.claude/skills/**)` (L220) で L1 保護。review-harness の diagnosis-rubric.md / thresholds.md / 各 SKILL.md も同様。hook 本体 (`hooks/*.sh` 直下) は L218、hooks/rules/* は L233-235 で保護。

**真の残差 (deny 境界の継ぎ目 — Medium×2 + Low×2)**:

- **[Medium] essence-docs (評価基準の正本) が L1 非保護**: `~/.claude/.docs/essence/essence-docs/{harness,skill,ui}-essentials.md + agent-essence.md` (計 4 本 + README) は **deny 対象外** (`.docs` 配下の deny は `progressive-disclosure/**` のみ — grep 実測)。commit 段の補償 = essence-sync gate は**原則数ドリフト検出のみ**で、原則数を変えない内容改変 (文言の弱体化等) は素通り。運用規律 (`proposing-essence-updates` の「直接 commit しない・自己承認しない」宣言) はあるが L1 相当の規律であり物理層でない。**S-1 自身の論理「レビュー基準を書き換えられるなら検証は無意味」が、ハーネス自身の最上位評価基準に完全適用されていない非対称**。ただし deny 追加は `proposing-essence-updates` の PR 作成フロー (編集が必要) と衝突しうる設計論点を含む
- **[Medium (下方)] `hooks/lib/*.sh` が deny 界面の隙間**: `Edit(~/.claude/hooks/*)` (L218) の単一 `*` は**直下のみ**で `hooks/lib/` に届かない (`hooks/rules/*` が別途明示エントリで在る事実が「単一 `*` は非再帰」を強く裏付ける — 再帰なら rules/* は冗長)。lib は計 **8 本**で、うち essence gate が実行時 `source` するのは harness_worktree/essence_record_name/launch_form_sync/ledger_append の **~4 本** (残り credstore×3・ledger_aggregate は essence gate 非依存。「述語」なのは harness_worktree.sh のみで他はヘルパ)。`permissions.allow` に無条件 `Edit` があるため Edit ツール経路で lib は編集可能 (Bash 経路は字句層 `\.claude/hooks` でカバー済)。**ただし「1 手で中和」は誇張**: gate は fail-closed 設計 (lib 不在→block L520 / cd 曖昧→block L563) ゆえ雑な lib 編集は gate を**通すのでなく止める**方向に倒れる。fail-open (悪い commit 承認) 化には harness_records_dir を「合格 record を指す」よう精密に書換え、かつ commit 時発火の (c) hook-test gate (L273 が lib/*.sh を HOOK_FILES に含め test-harness_worktree.sh 緑を要求) を掻い潜る**標的化攻撃**が要る。**worktree guard は lib へ実行時依存しない** (write guard は harness_worktree.sh の vendored copy を持ち [L106-110]、lib 不在時に fail-closed へ倒すため正本を source しない — essence gate L517-518 が非対称の理由を明記)。gate 本体は deny 済みなのに依存 lib が非 deny という**保護境界の非対称**は事実で、deny を `Edit(~/.claude/hooks/**)` にする / `Edit(~/.claude/hooks/lib/*)` を足す 1 行で閉じられる (glob 再帰仕様は #186 の live 測定領域ゆえ、閉じる際は実マッチャで裏取り要)
- **[Low] Bash 書込の字句層が skills/agents/essence-docs を非カバー**: `hook_pre_commands` の字句 deny は `settings|hooks|CLAUDE.md` パターンのみ。`echo >> ~/.claude/skills/...` 型の Bash 書込は L1 (Edit ツール限定) にも字句層にも掛からない。commit 段の essence gate (apply_paths に skills/) が補償するが、essence-docs 宛は上記のとおり補償も弱く残差①と複合する
- **[Low] テスト直接編集 (TDD 外) の射程外**: 上記の設計差の裏面。baseline 不在時は SKIPPED を明示する (silent 合格にしない) 設計はあるが、非 TDD 文脈のテスト改ざんは検出層が無い

- 継続 (記録済み・非新規): sandbox 層の dead config (#186 で「202 本は 1 本も効いていない (`sandbox.enabled` 不在)、permission 層は実効」と自己記録済み)。`sandbox.filesystem.denyWrite` は 2 件のみで評価基準保護は permission 層に単独依存 — 既知の開示済み状態

### 残差 / 改善候補

- **[Medium] essence-docs の L1 非保護**: 閉じるなら `Edit(~/.claude/.docs/essence/**)` の deny 追加だが、proposing-essence-updates の PR フローとの両立設計が要る (例: worktree/branch 内のみ許可 = L2 条件付き許可への移設が筋か)。issue 化の判断はかいじゅうへ
- **[Medium] hooks/lib の界面隙間**: `Edit(~/.claude/hooks/**)` 化 or lib 明示 deny の 1 行で閉じられる。essence gate の自壊経路ゆえ 2 件の中では優先度高。issue 化の判断はかいじゅうへ
- [Low] 2 件は監査ログ記録で足りる (字句層のスコープは意図的選択の可能性 / TDD 外テスト編集は運用上まれ)
- 意味論注記: S章バッチの警句「配備≠実効」が本深掘りでも再演された — deny は**書いた範囲**しか守らない (glob の `*` と `**` の 1 文字差が界面の穴になる)。「権限は書いたら終わりでなく観測して直す」運用層 (記事超え④) の実例がまた 2 つ増えた形

判定: 取り入れ済み — 3層すべて実装実在し、L1 の評価基準保護は note の例と 1:1 対応 + ハーネス全体へ拡張、L2 は字句層・段階武装まで持ち、L3 は ask 30 + push 人間限定。note の代表例 (テスト deny) の不採用は TDD 両立のための意図的な予防→検出移設で、設計差として正当。残差は deny 境界の継ぎ目 Medium×2 (essence-docs / hooks/lib) + Low×2 — いずれも「書いた範囲しか守らない」glob 界面の問題で、S章の既知テーマ「配備≠実効」の新規実例。

## 独立検証 (step6) の記録

fresh な read-only reviewer (code-reviewer) が全 load-bearing 主張を実ファイルと照合。**note 逐語・oracle ヘッダ・hook 自称・#178/186/157・Write() 0件・テスト deny 0件・評価基準保護 L223-232・git-workflow L8 は全て確認 OK**。verdict は **(b) 要修正** ── 計数確定エラー2件 + Medium(B) の事実誤認/誇張。裏取りして反映済み:

1. **[確定エラー] deny 178→177 / ask 30→31 の逆** ── 正: **deny 177 / ask 30**。json 配列とログ自身が併記する行範囲 (L59-235=177 / L238-267=30) が「178/31」を否定する内部矛盾だった。内訳も訂正 (secret 139 / コマンド 17)
2. **[Medium (A) essence-docs 非保護 = 正確・訂正不要]** ── 検証者が両方向検証: deny に essence 一致 0 件、通常セッションで編集を止める物理層なし、check-essence-sync.sh は原則見出し数の突合のみで文言弱体化を検出しない、を独立実証。**穴は実在・ミティゲーション見落とし無し**
3. **[Medium (B) hooks/lib = 穴は実在するが3点誇張を訂正]**:
   - (i) **「worktree guard が lib へ実行時依存」は誤り** ── write guard は harness_worktree.sh の **vendored copy** (L106-110) を持ち lib 不在時に fail-closed へ倒すため正本を source しない (essence gate L517-518 が非対称の理由を明記)。「essence gate / worktree guard が依存」→ essence gate のみに訂正
   - (ii) **「述語正本 8 本」は過大ラベル** ── lib は 8 本だが essence gate が source するのは ~4 本、「述語」は harness_worktree.sh のみ。8本/~4本/述語1本に精密化
   - (iii) **「1 手で中和」は誇張** ── gate は fail-closed ゆえ雑な編集は gate を止める方向。fail-open 化には述語精密書換 + hook-test gate (lib/*.sh を HOOK_FILES に含む) 掻い潜りの標的化攻撃が要る。severity を Medium 下方へ。Bash 経路が字句層でカバー済の非開示も補記
4. **[未検証明示] glob 再帰仕様** ── `Edit(~/.claude/hooks/*)` が lib に届かない前提は、rules/* の別途明示という強い状況証拠はあるが実マッチャ挙動は #186 の live 測定領域ゆえ「閉じる際は実マッチャで裏取り要」と明示

**収束の扱い**: 計数2件は確定エラーで要修正だったが裏取り訂正済。Medium(A) は正確、Medium(B) は穴自体は実在 (保護境界の非対称は事実) ゆえ残す — ただし severity・機序・件数を検証者の実測どおり下方修正。判定「取り入れ済み」の骨格は不変。意味論の最終 backstop は step 8 の人間 content-review に委ねる。

## 関連ファイル

- `~/.claude/settings.json` — L1 正本 (deny 177 = L59-235 / ask 30 = L238-267 / defaultMode L269 / sandbox L658-804)
- `~/.claude/hooks/hook_pre_commands.sh` + `hooks/rules/hook_pre_commands_rules.json` — L2 字句照合層 (記事超え②)
- `~/.claude/hooks/hook_pre_worktree_write_guard.sh` — L2 段階武装 (記事超え③、#157 修正履歴)
- `~/.claude/skills/enforcing-strict-tdd-cycle/scripts/assert-tests-unchanged.sh` — テスト deny 不採用の代替 (予防→検出移設、記事超え①)
- `~/.claude/.docs/essence/essence-docs/` — 残差① (L1 非保護の評価基準正本)
- `~/.claude/hooks/lib/` — 残差② (deny 界面の隙間、計 8 本・うち essence gate source ~4 本 / worktree guard は vendored copy で非依存 L106-110)
- `~/.claude/.docs/progressive-disclosure/git-workflow.md` — L3 push 人間限定の明文 (L8)
- `.docs/references/260405_…/text.md` (1955〜2027行) — S-1 照合基準
- `.docs/logs/shared/2026-07-20_s-chapter-trust-boundary-permissions-adoption-check.md` — 親バッチ (S-1 の判定 + 「配備≠実効」の両面記録)
