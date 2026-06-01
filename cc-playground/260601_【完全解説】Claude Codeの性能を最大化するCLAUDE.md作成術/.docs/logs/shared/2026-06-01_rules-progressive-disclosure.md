---
date: 2026-06-01 21:33:33
type: work
topic: rules-progressive-disclosure
session: 段階的開示による ~/.claude/rules/ 逃がし
related_article: https://note.com/masa_wunder/n/n50dc703e082c
related_skill: [logging]
related_agent: [Explore]
related_plan_id: 2026-06-01-rules-progressive-disclosure
related_plan: .docs/plans/archived/2026-06-01-rules-progressive-disclosure.md
---

# rules/ の段階的開示 — plan-workflow.md を .docs へ逃がす

> note記事の段階的開示(Progressive Disclosure)で `~/.claude/rules/` を点検し、plan-workflow.md(38行)のみを stub 化して本文を `.docs/progressive-disclosure/` へ逃がした。decisive-answers / critical-thinking / multi-agent-safety は「逃がすと劣化する」普遍ルール・常駐ガードとして残す判定。

## 概要

note記事「Claude Codeの性能を最大化するCLAUDE.md作成術」の段階的開示に照らして `~/.claude/CLAUDE.md` と `rules/` を点検。タスク固有の詳細を `.docs` へ逃がし、常駐ファイルを普遍・最小・最重要に絞るのが目的。分析→plan→実装→検証→archive まで一気通貫で実施。

## 内容

### 分析(記事の手法を軸に)

- 記事の段階的開示: タスク固有の詳細を別ファイルへ、常駐には普遍ルール + 「どこに何があるか」のポインタのみ。300行未満・できればもっと短く。
- 問題発見: `~/.claude/rules/` は paths frontmatter なしで**毎セッション全文が常駐**する(本セッションのシステムリマインダーに rules/ 全7ファイルが展開済みであることが実証)。CLAUDE.md からポインタ参照しても、rules/ の中身はロードされている。
- 既存お手本3つ(build-test-protocol / frontend-aesthetics / harness-modification-policy)が「rules にポインタ + 本文を `.docs/progressive-disclosure/`」を実装済み。

### 判定(軸: タスク固有か全応答普遍か / 読むトリガーの有無)

| ファイル | 行数 | 判定 | 理由 |
|---|---|---|---|
| plan-workflow.md | 38 | 逃がす | 「Plan Mode 着手」という検出可能トリガーがある |
| decisive-answers.md | 40 | 残す | 全応答の結論スロットに効く普遍。トリガーが常時=毎回 Read 必要で逃がす意味なし |
| critical-thinking-checklist.md | 12 | 残す | 思考の質に効く普遍ルール + 12行と短い |
| multi-agent-safety.md | 9 | 残す | git 事故(stash/worktree)の常駐ガード。on-demand 化すると「読む前に事故る」 |

### 実装

1. 本文転写(cp で byte-exact): `rules/plan-workflow.md` → `~/.claude/.docs/progressive-disclosure/plan-workflow.md`(38行、全4セクション健在)
2. stub 化: `rules/plan-workflow.md` を4行ポインタに(既存お手本 build-test と同形)
3. 検証: 行数(stub 4 / 本文 38)、本文の全4セクション(自発発火条件・削除禁止・完了時の処理・除外条件)健在、参照7元すべて解決(CLAUDE.md / README×2 / hooks×3 / skills×2)

## 設計意図

- 逃がし先は依頼の `~/.claude/progressive-disclosure/` でなく、既存3ファイルと同じ `~/.claude/.docs/progressive-disclosure/` に統一(新規ディレクトリは二重管理になるため不採用)。
- stub-preserves-path: rules にポインタ stub を残すことで、全依存(CLAUDE.md / README / hooks / skills)の参照契約を後方互換に保つ。CLAUDE.md は変更不要(かつ `Edit(**/CLAUDE.md)` deny なので触れない)。
- **分水嶺は「行数」でなく「読むトリガーの有無」**。rules 内最長の decisive-answers(40行)でも、全応答に効く普遍ルールだから逃がせない。

## 副作用

- `hook_pre_plans_redirect.sh` のユーザー向けメッセージは「詳細: `rules/plan-workflow.md`」と案内する。逃がし後はそこが stub なので、**stub → .docs 本文の2ホップ**になる。辿れるので後方互換は保たれるが、1ホップにしたいなら hook メッセージを `.docs` 直リンク化する手がある(hook 改修=契約変更のため今回スコープ外)。

## 重要発見・自己修正

- **multi-agent-safety の判定を途中で撤回した**: 当初「短いから任意で逃がしてOK」と報告したが、Explore 調査で「git うっかり防止の常駐ガードで、トリガーが『毎回の git 判断』=逃がすとガードが効く前に事故る」と判明し「残す」に修正。critical-thinking-checklist のルール(同意が楽でも黙らない / 問題ゼロを疑う)を自分に適用した結果。
- 段階的開示は**コスト削減が目的ではない**。普遍ルールを逃がして常駐行数を減らしても、ルールが効かなくなれば本末転倒。削りたいなら「逃がす」でなく「本文を圧縮」が筋。

## 関連ファイル

- `~/.claude/rules/plan-workflow.md` — 38行 → 4行 stub 化
- `~/.claude/.docs/progressive-disclosure/plan-workflow.md` — 新規、本文38行
- `.docs/plans/archived/2026-06-01-rules-progressive-disclosure.md` — 判断文脈を保持する完了 plan(archived へ mv 済)
- `~/.claude/CLAUDE.md` — 変更なし(stub を指す L108 参照が解決し続ける)
