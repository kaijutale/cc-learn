---
date: 2026-06-14 16:59:09
type: work
topic: claude-md-brushup-2pj
session: authoring-claude-md による2PJのCLAUDE.mdブラッシュアップ
related_skill: [authoring-claude-md, explain-in-html, logging, commit]
related_plan_id: 2026-06-14-claude-md-brushup
related_plan: [portfolio-site/.docs/plans/2026-06-14-claude-md-brushup.md, outputquest/.docs/plans/2026-06-14-claude-md-brushup.md]
---

# authoring-claude-md による2PJのCLAUDE.mdブラッシュアップ

> portfolio-site と outputquest の CLAUDE.md を5原則評価し改善。portfolio で発見した CRITICAL 参照切れ(dangling pointer)を git 復元 + gitignore 選択的追跡化で根治。3PR 全マージ完了。

## 概要

authoring-claude-md skill (Review & Optimize Mode) で2つの Web アプリ PJ の CLAUDE.md をブラッシュアップした。

- 対象1: `/Users/camone/dev/projects/web-app/portfolio-site/`
- 対象2: `/Users/camone/dev/projects/web-app/outputquest/`

両 PJ とも既存 CLAUDE.md あり(46行/47行)→ Review & Optimize Mode。実施フロー: 調査 → plan作成(各PJの.docs/plans/) → explain-in-html で視覚解説 → 適用 → committer commit → push → PR作成 → マージ取り込み → 検証 → ブランチ掃除。

## 内容

### 5原則評価結果

**portfolio-site: 3.5 / 5.0**

| 原則 | 判定 | 所見 |
|---|---|---|
| 1 オンボーディング | OK 1.0 | typecheckコマンドのみ漏れ |
| 2 WHAT/WHY/HOW | 部分的 0.5 | Rules理由不揃い + typecheck漏れ |
| 3 Less is More | OK 1.0 | 46行、電報スタイル |
| 4 段階的開示 | 部分的 0.5 | **CRITICAL: .docs/conventions.md 参照切れ** |
| 5 ≠リンター | 部分的 0.5 | any禁止/関数宣言はリンター担保領域 |

**outputquest: 4.5 / 5.0**(skill の short-circuit 条件=4.5以上は改修最小化に該当)

| 原則 | 判定 | 所見 |
|---|---|---|
| 1 オンボーディング | OK 1.0 | - |
| 2 WHAT/WHY/HOW | 部分的 0.5 | **唯一の穴: Vitest導入済みなのにtestコマンド欠落** |
| 3 Less is More | OK 1.0 | 全Rules理由付きで優秀 |
| 4 段階的開示 | OK 1.0 | index.md + .claude/rules/ への2ホップ、参照先全実在 |
| 5 ≠リンター | OK 1.0 | 整形規則はrules/styling.mdに外部化済み |

### CRITICAL 参照切れの根本原因(git で確定)

CLAUDE.md 46行目が `.docs/conventions.md` を指すが、実ファイルがディスク上に不在だった。

```
af59d4d  A .docs/conventions.md (+22行)  ← 規約をCLAUDE.md本体から外部化(正しい段階的開示)
f9bfcd3  D .docs/conventions.md (-22行)  ← 「.docs/を追跡対象外に」commit。だが実体ごと削除
         M .gitignore (+.docs/)            CLAUDE.mdのポインタは無傷で放置 → dangling
```

`git show af59d4d:.docs/conventions.md` で22行(スタイリング/アニメーション/コンテンツ規約)を完全復元できた。

### 適用内容(3PR)

- **portfolio #82** (`docs/claude-md-brushup`): Rules に WHY 2件(関数宣言=既存統一 / Motion優先=ランタイム二重化回避) + `typecheck: pnpm typecheck` 追加
- **portfolio #83** (`chore/docs-selective-tracking`、恒久対策): `.gitignore` を「`.docs/` 全除外」→「作業記録のみ名指し除外(`logs/local/`, `plans/`, `gep-pr-reviews/`, `output/`)」に変更し、`conventions.md` を追跡対象化。outputquest 方式(設計ドキュメントは追跡・使い捨て記録は除外)に統一
- **outputquest #206** (`docs/claude-md-brushup`): Commands に `test: pnpm test (watch) / pnpm test:run (CI)` 追加

### 検証(マージ後 main で実測)

- portfolio: conventions.md 追跡+実在(777バイト)、CLAUDE.md → .docs/conventions.md が**実在**(参照切れ解消)、typecheck/WHY 反映、.gitignore 選択的除外
- outputquest: test コマンド反映
- 両PJ想定スコア 5.0 相当

## 設計意図

- portfolio #82(CLAUDE.md改善)と #83(.gitignore+conventions.md)を**別ファイル=別PRに分離**: マージ衝突ゼロ、関心分離。推奨マージ順は #83(Critical実体を版管理へ)→ #82(品質改善)
- 修正本体はメインエージェントが直接実施(サブエージェント委譲せず): 編集が極小かつ plan で仕様確定済み、分析コンテキストを保持しており委譲は再読込コストが無駄
- ログを `.docs/logs/shared` に直接保存: 本PJ CLAUDE.md 規約が skill デフォルト(local→promote)を上書き

## 副作用

- portfolio の conventions.md 復元は #83 マージ前は**ローカル限定**だった(.docs/全除外のため)。#83 で版管理に乗り fresh clone でも参照が生きる状態に恒久化

## 学び

1. **`git rm` と `git rm --cached` の一字違い**: 前者はディスクも削除、後者は追跡解除のみ。「追跡から外すが手元に残す」意図なら必ず `--cached`。今回の参照切れはこのミスが原因。
2. **`.docs/` の追跡は二択でなく選択的追跡が正解**: CLAUDE.md/コードが依存する設計ドキュメント=追跡、使い捨て作業記録=除外。軸は「依存される知識か / 使い捨てか」。
3. **段階的開示はポインタ先の実体が版管理に存在して初めて完成**: 全除外 gitignore は設計ドキュメントを巻き込み参照切れの温床になる。
4. **ハーネスのフック誤検出**: commit message の `<noreply@anthropic.com>` の角括弧をリダイレクト演算子と誤認し「保護パスへのbash書込禁止」が発火。Co-Authored-By トレーラーを外して回避(文字列分割等の迂回トリックは不使用、正攻法)。
5. **gitignore のディレクトリ全除外 + 個別例外(`!path`)は効かない**: git は除外ディレクトリ内を覗かない。サブディレクトリを名指し除外する書き方が正解。

## 関連ファイル

- `portfolio-site/.docs/plans/2026-06-14-claude-md-brushup.md` — portfolio の評価+改善計画(status: completed)
- `outputquest/.docs/plans/2026-06-14-claude-md-brushup.md` — outputquest の評価+改善計画(status: completed)
- `.docs/output/explain-in-html/260614_claude-md-2pj-brushup-plan.html` — plan の視覚解説HTML
- portfolio-site PR #82 / #83、outputquest PR #206 — いずれもマージ済み

## スコープ外で残存(申し送り)

- outputquest の dependabot 脆弱性2件(moderate、react/ui)
- outputquest の無関係ローカルブランチ(`chore/add-dependabot`, `ci/add-lint-format`)— 別作業の可能性ゆえ未着手
