---
date: 2026-07-21 12:22:29
type: study
topic: v-1-2-feedback-speed-law-deepdive
session: V-1.2「フィードバックは速いほど強い」単独深掘り (取り入れフェーズ第7弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (V-1.2 = 1826〜1844行、関連: V-1.1 1785〜1824 昇格ラダー / V-2 1864〜1892 閉ループ)
related_skill: [logging, pickup]
related_log_ids: [2026-07-20_v-chapter-deterministic-verification-adoption-check, 2026-07-20_v-1-1-failure-promotion-ladder-deepdive]
related_log: [.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md, .docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md]
---

# V-1.2「フィードバックは速いほど強い」単独深掘り — 判定: 取り入れ済み・速度法則を note の最速段より前倒し / ただし原則1の反例2件を実測検出

> V章バッチ (a84436e) で1行照合済みの V-1.2 を単独深掘り。核心は **note の4段ラダーとハーネスの実トポロジーが一致しない**こと。note の「段2=プリコミット (git pre-commit hook)」は `~/.claude` に**存在しない** (`.git/hooks/` は `.sample` のみ、実体ゼロ)。commit 検査は全て **PreToolUse Bash matcher (`git commit` 文字列検知)** で実装 = 段2が段0 (行為の前) に畳み込まれている。3原則を個別ストレステストした結果、原則3 (軽量を手前) は完全準拠、原則2 (修正者=LLM) は記事超え (PreToolUse block = 修正コスト≈0)、**原則1 (最速の場所に) は反例2件を検出** — 「問題ゼロを疑う」で能動的に狩った実データ。

## 概要

取り入れフェーズ第7弾 (V章内の V-1.2 を単独で)。V-1.1 (昇格ラダー) の直接の続き。note の「フィードバック速度の法則」(遅い場所で落とすより早い場所で落とす方が修正コストが低い) の4段速度階層を `~/.claude` の hook 配線と1段ずつ厳密対応させ、3原則 (①最速の場所に ②修正者=LLM自身 ③軽量を手前) を個別に実測照合した。バッチが ✅ 1行で流した部分を掘り、**能動的に原則1の反例を狩る**方針で臨んだ。

## 内容

### note の速度階層 (4段) の定義 (text.md 1836-1844)

| note タイミング | note 検査内容 | note 修正者 | note 修正コスト |
|---|---|---|---|
| ツール直後 | 構文・型・フォーマット | LLM自身 | 極小 |
| プリコミット | lint・ユニットテスト | LLM自身 | 小 |
| CI | 結合・E2E・セキュリティ | LLMまたは人間 | 中 |
| 人間レビュー | 設計妥当性・ビジネスロジック | 人間 → LLM | 大 |

原則: 同じ検査なら遅い場所で落とすより早い場所で落とす方が修正コストが低い。3原則 = (1) 同じ検査は最速の場所に置く、(2) 修正者がLLM自身であるほど速い、(3) 軽量を手前・重量を奥に。「テストピラミッドと同じ構造」。

### ハーネスの実トポロジー — note の段2は消え、段0が生えている (実測)

**構造事実 (深掘りの核心)**: `~/.claude/.git/hooks/` にネイティブ git フックは**未インストール** (`.sample` のみ)。したがって note の「段2 = git pre-commit hook」は git 機構としては**存在しない**。「commit 時の検査」は全て **PreToolUse の Bash matcher フック** (`command` に `git commit` を含むか検知してゲート) = 実装タイミングは**ツール発火前**。note の段2は段1のさらに前 (段0) に畳み込まれている。

| note の段 | ハーネスの実体 | タイミング | 修正者 |
|---|---|---|---|
| **(段0: note に無い)** | PreToolUse block 群: worktree write guard (#97) / secret read deny (fail-closed) / commit ゲート (essence/adr) / generated署名 ban / hardcode hygiene / plan redirect | **行為の前** | LLM (再計画) |
| **段1 ツール直後** | PostToolUse: `hook_post_lint.sh` (prettier→eslint→`tsc --noEmit` 型検査) / emoji check / file line limit (500) / skill frontmatter schema / MCP・external 検疫タグ | 直後 | LLM |
| **段2 プリコミット** | **git hook としては存在せず、段0の commit ゲートへ畳み込み** (`hook_pre_commit_essence_gate.sh` / `_adr_gate.sh` / `_settings_churn_normalize.sh`) | (段0と同一) | LLM |
| **段3 CI** | **不在** (`.github/workflows` 等ゼロ、記録済み構造判断) | — | — |
| **段4 人間レビュー** | Stop 段 (`hook_stop_words.sh` 禁止語 / handoff 鮮度 / plan archive) + HITL (skill 明示呼出: `executing-ai-development-workflow` / gep reviewer 系、hook 配線ではない) | セッション末 / 明示 | 人間→LLM |

**含意**: note の表は「実行するアプリのコードベース」(型/lint/E2E/セキュリティ) を前提にしている。`~/.claude` は実行アプリでなく**メタ層 (config/prompt repo)**。だから速度法則は**同じ**だが、各段で検査する**対象が違う** — ハーネスが各段に置くのは「git 操作の安全・知識フォーマット・ADR 規律・essence 準拠」。原則はドメイン汎用、検査はドメイン固有。「取り入れ済み」は真だが、note の例 (tsc/eslint/E2E) とは検査対象が異なる。

### 3原則の個別照合 (実測)

**原則3「軽量を手前・重量を奥に」= 完全準拠 (最も明快)**
- 軽量検査 (emoji 検出 / 500行超 warn / frontmatter schema) → PostToolUse (段1、即座、warn 止まりで非 block)
- 重量検査 (ADR 却下代替案の存在検証 `verify-adr.sh` / essence verdict Critical・High / 変更 hook の検証テスト `run-all.sh --changed`) → commit ゲート (段0、block)
- note の「テストピラミッド構造」そのもの。軽い網を手前・重い網を奥に配置。

**原則2「修正者がLLM自身であるほど速い」= 記事超え (PreToolUse block = 修正コスト≈0)**
- PostToolUse `hook_post_lint.sh` はエラーを `additionalContext` で返す → LLM が即座に自己修正 (修正者=LLM)。note の段1そのもの。
- だが PreToolUse block は note の枠を超える: 行為が**実行される前**に deny されるので、**修正すべき生成物がそもそも存在しない**。note の原則2は「LLM が速く直す」だが、段0は「直すものが無い」— 修正コストが低いのでなく**≈0** (再計画コストのみ)。note のラダーは最速でも「ツール直後 = 生成してから直す」。段0は「生成させない」。

**原則1「同じ検査は最速の場所に置く」= 大枠は準拠、ただし反例2件を検出**
- 準拠の実データ: 型検査 (`tsc --noEmit`)・format・lint は PostToolUse (段1) にあり commit/CI へ後回しにしていない。note の例「JSON検証をCIでなくツール直後に」と同型。commit ゲート (essence/adr) は段0 = note の最速段よりさらに前。
- **反例① CLAUDE.md パス参照検証の後段固定**: `hook_validate_claudemd.sh` (CLAUDE.md のパス参照が実在するか検証) は **SessionStart:compact のみ**に配線。CLAUDE.md 編集直後の PostToolUse には**無い**。→ Edit でパス参照を壊しても検知は圧縮境界まで遅延 (セッションが圧縮しなければ次回 SessionStart まで更に遅延)。同じ決定論検査 (パス実在) を編集直後 (段1) に置けば修正者=LLM・最安。**原則1 の非対称**。(反論: 「参照の正しさは CLAUDE.md が再ロードされる圧縮/起動時にしか効かない」= 欠陥が顕在化するタイミングに合わせた配置、という設計弁明はある。ゆえに severity=Low、明白なバグでなくトレードオフ)
- **反例② `.docs` frontmatter 検証の未配線**: `validate-knowledge.py` (`.docs/**/*.{md,yml}` の YAML frontmatter 検証) はハーネス repo の**どの段にも配線されていない** (`pre-commit-knowledge.sh` はプロジェクト配布用テンプレートで `~/.claude/.git/hooks/` は空)。ADR 部分集合は `verify-adr.sh` が commit 段で拾うが、一般 frontmatter のドリフトは自動検知ゼロ。(背景: 素の validator は `~/.claude` 自身では全停止するため配線不能 = 記録済み構造制約 (probe-before-persist rule / .docs README)。ゆえに「原則1 違反」でなく「構造制約による欠落」。ただし段0 の軽量 frontmatter schema チェックは skill 側にしか無く、`.docs` 全体は素通り)

### 原則1の構造的限界 — 意味論検査は最速段に移せない (PR #212 の自己例)

原則1 の反例狩りで見えた**本質的境界**: 前セッションの PR #212 多層独立レビューは、あたし自身の捏造2件 (`autoMemoryEnabled` を true と書いたが実値 false / auto-connect の overclaim) を **人間レビュー段 (最も遅く・最も高コスト・修正者=人間→LLM)** で捕まえた。

原則1 に従えばこれをもっと早い段に移せるか? → **移せない**。「この事実主張は真か」は外部現実との意味論照合を要し、PostToolUse に「このログ主張は false」と判定する決定論 detector は書けない。ゆえにこの検査は**正しく最遅の意味論レビュー段に住んでいる**。

これは V-1.1 の issue #211 (L0→L1 昇格が hook 化できない = 「同じ失敗か」が意味論判断) と**同じ意味論/決定論の境界**。V-1.2 の原則1 は「全検査を最速段へ」ではなく「**各検査を、その決定可能性が許す最速段へ**」と読むのが正確。ハーネスは両側を実証する — 決定論検査 (型/パス実在/署名) は段0-1へ前倒し、意味論検査 (事実性/設計妥当性/「同じ失敗か」) は最遅の人間段に留まる。前倒しできないのは配置ミスでなく**検査の性質**。

### 記事超え点 (V-1.2 固有)

1. **段0 の発明**: note の最速段は「ツール直後 (生成後に直す)」。ハーネスは PreToolUse で「生成させない」段0 を持ち、prevented クラスの修正コストを ≈0 に落とす (再計画のみ)。
2. **段2 の畳み込み**: note の段2 (git pre-commit hook) を廃し、commit 検査を段0 の Bash matcher に統合。「git commit 文字列検知」で同一タイミングに寄せた — 段数を増やさず最速化。
3. **速度法則を別ドメインへ移植**: note の表 (アプリコードの型/E2E) を、config/prompt repo の品質次元 (git安全/知識フォーマット/ADR規律/essence) にそのまま適用。原則の汎用性を実証。
4. **原則1 の限界の明文化**: 「最速の場所へ」に意味論の壁があることを、決定論検査は前倒し・意味論検査は据え置き、という二面配置で実装。

### 残差 / 改善候補

- **反例① (Low)**: `hook_validate_claudemd.sh` を PostToolUse(Edit CLAUDE.md) にも配線すれば原則1 により忠実。ただし圧縮時配置には「参照の正しさは再ロード時に効く」という設計弁明があり、明白な gap ではない。昇格ラダー的には「再発実績が無いので前倒し未実施」= V-1.1 の規律 (再発待ち) と整合。
- **反例② (構造制約)**: `.docs` 一般 frontmatter の自動検証はハーネス repo で不在。素の validator が `~/.claude` 自身で全停止する記録済み制約に由来。ADR は commit 段でカバー、残りは probe-before-persist (規律+HITL) と手動 backstop で補償。
- **CI 段 (段3) 不在** = バッチで記録済みの構造判断。ハーネスは実行アプリでなく結合/E2E の対象が無い。「テスト」に相当するのは hook 自身の検証テスト (`run-all.sh --changed`) で、これは原則1 に従い commit 段 (変更 hook が判明する最速点) に置かれている — CI 段が無いのでなく、テスト層が commit 段へ前倒しされている。
- **判定: 取り入れ済み**。V-1.2 の速度法則はハーネスに深く浸透し、note の最速段より前倒し (段0) している。原則1 の反例2件はいずれも「意味論の壁」または「記録済み構造制約」または「再発待ち規律」で説明でき、配置ミスではない。

## 関連ファイル

- `.docs/references/260405_…/text.md` (1826〜1844行 V-1.2 本体、1836-1844 速度階層の表と3原則) — 照合基準
- `~/.claude/settings.json` (L271-590: PreToolUse/PostToolUse/Stop/SessionStart のフック配線正本) — 実測対象
- `~/.claude/hooks/hook_post_lint.sh` — 段1 の型検査 (tsc --noEmit)・format・lint、additionalContext で LLM へ返す (原則2 の実体)
- `~/.claude/hooks/hook_pre_commit_essence_gate.sh` / `hook_pre_commit_adr_gate.sh` — 段2 を段0 へ畳み込んだ commit ゲート (重量検査、原則3)
- `~/.claude/hooks/hook_validate_claudemd.sh` — SessionStart:compact のみ配線 (反例①、原則1 の非対称)
- `~/.claude/skills/establishing-knowledge-persistence/scripts/validate-knowledge.py` — ハーネス repo 未配線 (反例②、構造制約)
- `.docs/logs/shared/2026-07-20_v-chapter-deterministic-verification-adoption-check.md` — V章バッチ (本深掘りの親、V-1.2 の1行照合)
- `.docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md` — V-1.1 深掘り (意味論/決定論境界の先行例、issue #211)
- `.docs/logs/shared/2026-07-21_pr-212-multilayer-independent-review-validation.md` — 原則1 の意味論限界の自己例 (捏造を最遅段で捕捉)
