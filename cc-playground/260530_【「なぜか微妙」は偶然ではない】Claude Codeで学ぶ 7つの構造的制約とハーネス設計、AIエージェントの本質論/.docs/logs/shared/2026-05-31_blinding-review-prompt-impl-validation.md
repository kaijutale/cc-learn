---
date: 2026-05-31 15:16:24
type: validation
topic: blinding-review-prompt-impl-validation
session: C-2/C-3 防御強化 (PLAN B)
target: blinding-review-prompt skill 新規実装と bang 構文 (!構文) 内 ${VAR:-default} デフォルト展開の deny 実機検証
verifier: メインClaude (Opus 4.8, 1M context)
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_skill: [blinding-review-prompt, gep-code-reviewer-fork, authoring-skills, logging]
related_log_ids: [2026-05-31_c2-c3-defense-skills-planning]
related_log: [2026-05-31_c2-c3-defense-skills-planning.md]
---

# blinding-review-prompt 実装 + bang 構文 deny 実機検証

> C-2/C-3 防御 skill 2本のうち ① blinding-review-prompt を新規実装。plan B-7 の最優先未決事項だった「bang 構文内の `${VAR:-default}` が Claude Code Bash permission で deny されるか」を実機で確定 → **deny されず、scripts/ 退避は不要**。2ファイル構成で完結。

---

## 検証目的

1. blinding-review-prompt (レビュー入力から著者情報を機械除去する中立化変換 skill) を新規作成する。
2. plan B-7 の最優先未決事項を実機で確定する: bang 構文 (skill 読込時に preprocessor が exec する `! + backtick` 構文) 内で env-var のデフォルト展開 `${BLINDING_REVIEW_TARGET:-HEAD~1..HEAD}` が、gep-code-reviewer-fork の Gotcha が記録する通り `Contains expansion` で deny されるか。
   - deny される → `scripts/blind-target.sh` に展開を退避 (gep の parse-pr-target.sh 同型) が必須。
   - deny されない → master + reference の 2ファイルでシンプルに完結 (plan B-2 の第一選択)。
3. 除去 (著者情報を中立プロンプトに載せない) と K 算出 (複雑度 → 指摘数下限) が機能するか。

## 検証環境

| 項目 | 値 |
|---|---|
| 作成先 | `~/.claude/skills/blinding-review-prompt/` (グローバルハーネス実体) |
| 呼出元 cwd | 260530 学習 PJ (claude-code-learn リポジトリ) |
| 検証ツール | Claude Code Skill preprocessor (bang 構文 exec) / quick_validate.py / 事前 Bash ツール |
| セッション | メインClaude Opus 4.8 (1M context) |
| 対象 git | HEAD~1..HEAD (local, 27dc302) と PR #45 (PR モード) |

## 実測結果サマリ

| 指標 | 自実測 | 期待値/参照値 | 一致度 |
|---|---|---|---|
| `${VAR:-default}` bang 構文内 deny | 展開成功 (deny ゼロ) | gep Gotcha = deny | ⚠️ gep 非再現 |
| 事前 Bash ツールでの同構文 | 展開成功 | — | ✅ 前兆一致 |
| quick_validate (初回 / 改善後) | Skill is valid! ×2 | valid | ✅ |
| K 算出 (local 756行HTML) | C=761 → K=6 | 式通り | ✅ |
| K 算出 (PR#45 47行md) | C=52 → K=4 | 式通り | ✅ |
| 除去 (PR モード author/title/branch) | 中立prompt 非掲載 | 除去成功 | ✅ |
| 除去 (local モード) | 対象ゼロ | — | ⚠️ 元々アンカー無 |
| self-ref hook 検出 | 説明文5件を検出→prose化 | — | ✅ 機能 |

## 各Stage 詳細結果

### Stage 1: skill 作成 (2ファイル)

- **結果**: ✅
- **観測**: `references/blinding-rules.md` (除去/保持リスト・K式・反迎合定型文) + `SKILL.md` (master) を作成。quick_validate.py が `Skill is valid!` (exit 0)。SKILL.md 137行 / reference 163行 (いずれも 500行原則内)。
- **学び**: K の強制定型文は「K 件挙げろ」単独だと欠陥捏造を誘発する (反インフレの逆効果)。「K 未満なら各観点の精査証跡を出せ」を併置し、真にゼロなら正当化を成果物にする設計にした。

### Stage 2: bang 構文 deny 実機確認 (最重要)

- **結果**: ✅ deny されず展開成功
- **観測**: skill 起動時、6件の収集 bang 構文すべてが正常展開・実行された。核心の評価対象記述子セクションは:
  ```
  ### 評価対象記述子 (env-var、未設定時 local デフォルト)
  HEAD~1..HEAD          ← ${BLINDING_REVIEW_TARGET:-HEAD~1..HEAD} が展開された
  ### 除去強度 (未設定時 standard)
  standard              ← ${BLINDING_STRIP_LEVEL:-standard} が展開された
  ```
  `git --no-pager diff --stat/--numstat/--color=never "${BLINDING_REVIEW_TARGET:-HEAD~1..HEAD}"` も全て展開され git が実行された。
- **学び**: 事前に Bash ツールで同構文を試したとき通っていた (前兆) が、それは Bash ツール経路であり bang 構文 preprocessor 経路の確証にはならなかった。skill を実起動して初めて preprocessor 経路でも deny されないと確定。「静的検証や近似経路は実機の代替にならない」の再確認。

### Stage 3: 除去検証 (PR モード #45)

- **結果**: ✅ 除去成功
- **観測**: local diff には著者情報が元々無いため除去検証にならない。PR #45 で gh pr view が以下のアンカー情報を取得:
  - author: `camoneart / kaishu aoyama｜kaiju`
  - title: `docs(changelog): v2.1.77の日本語翻訳を追加`
  - branch: `try/rewind-deep-dive`
  これらを中立プロンプトに **一切載せず**、diff hunk + ファイル名 + 統計のみで `[Blinded Review Prompt]` を組めた。「取得 (除去対象把握) と出力 (中立化) の分離」が機能。
- **学び**: 除去の本領は PR モード。gh pr view のメタを落とすことに価値がある。

### Stage 4: K 算出

- **結果**: ✅ 式通り
- **観測**: C = (追加+削除) + 5×ファイル数。local 756行HTML 1ファイル → C=761 → K=6 (200≤C)。PR#45 47行md 1ファイル → C=52 → K=4 (50≤C<200)。

## 重要発見

1. **gep Gotcha「`${VAR:-default}` は bang 構文内で deny」は現 CC バージョンで非再現**。単純デフォルト展開は通る。gep の deny 記録は、実は `$ARGUMENTS` にシェルメタ文字 (バッククォート/$/引用符) を混ぜた複合ケースでの `(eval): unmatched` 落ち (gep の別 Gotcha) が主因の可能性。教訓: 先行 skill の Gotcha は鵜呑みにせず自分の構成で実機再検証する。退避策は将来 deny 復活時の保険として SKILL.md に記載のみ残置。
2. **local モードは盲検効果が薄い**。local diff (HEAD~1..HEAD 等) には author/commit message が diff に含まれず、除去対象は diff 内署名痕跡 (@author/Copyright) のみ。盲検化の本領は PR モード。skill の Gotcha に明記した。
3. **K 式はコード変更を前提**。756行HTML (生成物) に K=6 は過剰でレビューとして無意味。doc/翻訳/生成物では行数が複雑度を表さない。対象がコードでなければ K は参考値に留める旨を Gotcha に追加。
4. **self-reference hook が有効に機能**。説明文中の `` `!`構文 `` が inline code 閉じバッククォートと次の code 開始の近接で bang 構文パターンに誤検出された (5件)。hook (hook_post_skill_bang_selfref_lint.sh) が検出し、prose 化 (「bang 構文」表記) で回避。memory feedback_skill-self-reference-bang-syntax の罠を hook が捕捉した実例。

## 改善候補 (次フェーズ持ち越し)

- **③ detecting-framing-bias 実装** (PLAN A): master + 2fork + 2agent のフル構成。skill→subagent の孫起動 grayzone を fork 単体起動で実機検証してから master で束ねる。
- **empirical-prompt-tuning で blinding を反復改善**: バイアスを排した実行者に中立プロンプトを渡し、除去指示の明確さ・K の捏造誘発有無を両面評価。
- **K 式の対象種別調整**: コード/doc/生成物で係数を変える案を将来検討 (現状はコード前提の単一式 + Gotcha 注記で対応)。

## 結論

① blinding-review-prompt 完成 (2ファイル、quick_validate pass、実機起動で全機能確認)。plan B-7 の最優先懸念 (bang 構文 deny) は実機で否定され、シンプルな 2ファイル構成が成立。除去 (PR モード) と K 算出を実証。既存契約 (judging-review-severity の L1 不可侵、既存 fork skill の I/O) は非参照・非改変。次は ③ detecting-framing-bias。

## 関連ファイル

- `~/.claude/skills/blinding-review-prompt/SKILL.md` — master (収集 bang 構文 6件 + Step1-5 + Gotcha)
- `~/.claude/skills/blinding-review-prompt/references/blinding-rules.md` — 除去/保持リスト・K式・反迎合定型文
- `.docs/plans/2026-05-31-c2-c3-defense-skills.md` — PLAN B (本実装の設計根拠)
- `~/.claude/skills/gep-code-reviewer-fork/SKILL.md` — `${VAR:-default}` deny Gotcha の出典 (今回非再現を確認)
