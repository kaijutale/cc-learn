---
date: 2026-05-14 10:31:45
type: qa
topic: gitignore-negation-pattern-and-parent-prune-pitfall
session: explain-in-html 出力ファイル追跡化作業
related_skill: []
related_log_ids: [2026-05-14_explain-in-html-skill-creation-and-spidey-migration]
related_log: [.docs/logs/local/2026-05-14_explain-in-html-skill-creation-and-spidey-migration.md]
---

# `.gitignore` で「〇〇以外」を例外指定する方法と、親ディレクトリ枝刈りの罠

> `.docs/output/` を ignore しつつ `.docs/output/explain-in-html/` だけ追跡したい、というユースケースから判明した Git の `.gitignore` 評価仕様の盲点と、その回避パターン (`/` vs `/*`) の Q&A ログ。

## 概要

`.docs/output/` ディレクトリ全体は ignore したまま、配下の `.docs/output/explain-in-html/` だけは Git 管理対象にしたい、という要望から始まった対話。

最初に **「`.docs/output/` (末尾スラッシュ) + `!.docs/output/explain-in-html/` で動く」** と説明したが、実機の `git check-ignore -v` で検証したところ **動いていない** ことが判明。Git の `.gitignore` には公式制約として「親ディレクトリが ignore されていると、配下の `!` 例外は効かない」というルールがあり、回避には **`.docs/output/*` (末尾アスタリスク) で「中身を 1 つずつ ignore」する書き方** が必要だった。

この Q&A は (1) `!` negation pattern の基本、(2) 親ディレクトリ枝刈りの仕様、(3) `/` と `/*` の意味の違い、(4) 実機検証手法、を一度にまとめた振り返り。

## 内容

### Q1. `.gitignore` に「〇〇以外」って指定できる?

**A**: できる。`!` プレフィックスで「直前の ignore パターンを打ち消す」negation pattern を使う。

```gitignore
# 配下を ignore
.docs/output/
# ただし explain-in-html/ は例外として追跡
!.docs/output/explain-in-html/
```

順序が重要。先に ignore してから後で `!` で例外宣言する形になる。

### Q2. ↑ の書き方で本当に動くのか? (← 実機検証で覆った)

**A**: ❌ 動かない。これが今回の最大の学び。

実機で `git check-ignore -v .docs/output/explain-in-html/` を回すと、`.gitignore:14:.docs/output/` (= 親の ignore ルール) でヒットしてしまい、`!` 例外が効いていないことが判明した。

理由は Git の **性能最適化による枝刈り (prune)**:

> ディレクトリが ignore 対象と分かった瞬間、Git はその配下を列挙しない。

つまり `.docs/output/` の時点で「このディレクトリは無視」と確定すると、Git はその下の `explain-in-html/` を見に行かないため、`!.docs/output/explain-in-html/` というルールが評価されない。

公式ドキュメントにも明文化:

> It is not possible to re-include a file if a parent directory of that file is excluded.

### Q3. じゃあどう書けばよいのか?

**A**: 末尾アスタリスク `*` で「中身を 1 つずつ ignore」に変える。

```gitignore
# 中身を 1 階層分 ignore (親ディレクトリ自体は走査され続ける)
.docs/output/*
# 配下の特定ディレクトリだけ例外として追跡
!.docs/output/explain-in-html/
```

ポイント:
- `.docs/output/*` は「`.docs/output/` 配下の各エントリを ignore」という意味で、`.docs/output/` 自体は ignore 対象ではない
- 親が ignore でないので Git は走査を続け、`explain-in-html/` も一度 ignore に倒れるが、同じ階層で評価される `!` ルールが効いて追跡対象に「復活」する
- これによりサブディレクトリ単位の例外が成立

### Q4. `/` と `/*` の違いを表でまとめると?

| 記述 | 意味 | 配下の `!` 例外 | 用途 |
|---|---|---|---|
| `dir/` | dir 自体を ignore (枝刈り発生) | ❌ 効かない | 完全に無視して良い時 |
| `dir/*` | dir の中身を 1 階層分 ignore | ✅ 効く | サブディレクトリ単位で例外を作りたい時 |
| `dir/**` | dir 配下を再帰的に ignore | ⚠️ 限定的 | ファイル単位の例外用 (要素ごとに `!` 必須) |

### Q5. ファイル単位で例外を作りたい時は?

**A**: `!` を階層的に重ねる。**親ディレクトリを必ず先に `!` で復活させる** ことが鍵。

```gitignore
.docs/output/*
!.docs/output/explain-in-html/             # 1段目: 親ディレクトリの例外
!.docs/output/explain-in-html/**/*.html    # 2段目: 中の .html だけの例外
```

1 段目を飛ばして 2 段目だけ書くと、親が枝刈りされて結局効かない。

### Q6. 実機検証はどうやるのが確実?

**A**: `git check-ignore -v <path>` + 終了コード判定の組み合わせ。

```bash
# 個別チェック (どのルールでヒットしたか分かる)
git check-ignore -v .docs/output/foo.html
git check-ignore -v .docs/output/explain-in-html/bar.html

# 追跡候補一覧 (ignore されてない未追跡ファイル列挙)
git ls-files --others --exclude-standard .docs/output/
```

**重要**: 終了コードで判定するのが確実。
- `exit=0` → ignore 対象 (出力あり)
- `exit=1` → 追跡対象 (出力なし)

出力の有無だけ見ると、`!` 評価の中間状態 (一旦 ignore に倒れたが `!` で復活) を見間違える可能性があるため、終了コードを基準にする。

### Q7. なぜ Git はこんな仕様にしたのか?

**A**: 巨大リポジトリ (Linux カーネル / monorepo / `node_modules/`) で .gitignore 評価を高速化するため。

`node_modules/` のような数万ファイル抱えるディレクトリも、ignore 確定した瞬間に枝刈りすれば 1ms 程度で「無視」判定が完了する。トレードオフとして「ignore ディレクトリ配下の `!` 例外は効かない」が生まれた。仕様であり、将来直る類の話ではない。

## 設計意図 (修正後の .gitignore)

修正後のプロジェクト直下 `.gitignore` 該当部分:

```gitignore
# PDF抽出の中間成果物 (再生成可能、サイズ大)
# 末尾 /* で「中身を 1 つずつ ignore」にしないと、配下の ! 例外が効かない
.docs/output/*
# ただし explain-in-html/ は手作業生成物なので追跡対象
!.docs/output/explain-in-html/
```

コメント 2 行を添えて「なぜ `/` ではなく `/*` なのか」を明示。未来の改修時に `.docs/output/` に戻して再ハマりすることを構造的に防ぐ。

## 副作用

- `.docs/output/explain-in-html/` 配下に既存の HTML 3 ファイル (`explain-in-html-creation-session.html` / `explain-in-html-skill-structure.html` / `partial-implementation.html`) が一斉に追跡候補化された
- 次回 `committer` で意図的にコミットする必要がある (未対応、次セッション)
- `.docs/output/` 直下や他のサブディレクトリ (`meta-harness/` 等) は引き続き ignore されている (正常)

## 重要発見 (記事には書かれていないレベル)

1. **`.docs/output/` と `.docs/output/*` は Git 的に別物**: 見た目酷似だが評価モデルが完全に異なる。前者は親ごと枝刈り、後者は親生存・子個別判定。多くの記事は「`!` で例外指定できる」までしか書かず、この罠に触れない
2. **静的検証は実機検証の代替にならない**: 私 (Claude) は当初「末尾スラッシュで OK」と説明し、実機で `git check-ignore -v` を回して初めて誤りに気づいた。memory `feedback_empirical-validation-required` どおりの典型例
3. **`git check-ignore -v` の出力解釈で罠**: ignore されていれば「どのルールでヒットしたか」を出力するが、`!` で復活したパスもログには「最後に評価されたルール」が出る場合があり、出力テキストだけ見ると判断ミスを誘発する。**終了コードで判定** が鉄則
4. **コメントに「なぜそう書いたか」を残すと未来事故を防ぐ**: `.gitignore` のような短くて変更頻度低いファイルこそ、`why` コメントが効く。コードと違いリファクタで読み返す機会がほぼなく、ハマった人が同じ罠を踏み直すコストが高い

## 関連ファイル

- `cc-playground/260504_…/.gitignore` — 修正対象。14-17 行目に `.docs/output/*` + `!.docs/output/explain-in-html/` を設定
- `.docs/output/explain-in-html/` — 追跡対象化したディレクトリ。3 HTML 含む
- `.claude/CLAUDE.md` — プロジェクト固有 ignore ルールの根拠 (本来は明示されていないが、explain-in-html 出力先固定の流れで決定)
- `~/.claude/skills/explain-in-html/SKILL.md` — 出力先 `.docs/output/explain-in-html/` を hard-coded で指定している側 (このログとは別セッションで作成)
