# 議題: `test-tdd-cycle-validation/` (nested git repo) の扱いをどうするか

## 何を判断したいか

本プロジェクト (`260417_…全解説/`) 配下に置かれている `test-tdd-cycle-validation/` ディレクトリ (独立した `.git/` を持つ nested git repo) の扱いを決めたい。現状は親の `git status` で **untracked** として表示され続けており、ハーネス全体の不整合源になっている。

以下のうちどれを選ぶか、5 視点 (Implementer / Tester / Reviewer / Documenter / UI Designer) からの批判的分析を経て Lead が統合判断する。

## 関連背景

- **発生経緯**: TDD サイクル検証 (`enforcing-strict-tdd-cycle` skill, `coder` agent) の動作確認のため、最小サンプル repo として 2026-04-20 頃に作成された
- **現在の状態**:
  - 親プロジェクトから見て untracked
  - 内部に独自 `.git/`, `.docs/`, `.claude/`, `node_modules/`, `coverage/` を保持
  - 検証用の REQUIREMENTS.md / src/parseDuration.js / tests/ を含む
  - `_empirical/coder_start.ts`, `_empirical/coder_end.ts` などスキル評価の遺物あり
  - 最終更新は Apr 23-24 (約 4 日前)、現在進行中の作業ではない
- **検証目的**: TDD skill / coder agent の動作確認は既に完了済 (commit `f93baf5` 系列に knowledge log あり)
- **本プロジェクトの性質**: 「Claude Code もう一つの設計層」記事の検証ログが主目的。検証用 repo 自体は記事の本体コンテンツではない

## 候補 (選択肢)

1. **親の `.gitignore` に追加して untracked を消す** (現状維持に近い、最小変更)
2. **`git rm --cached` 相当 + 親には記録しない (もしくは `.gitignore`) で物理的にも残す** (1 とほぼ等価、明示性で差)
3. **親リポジトリの外 (例: `~/dev/sandbox/test-tdd-cycle-validation/`) に物理移設** (本プロジェクトから完全分離)
4. **`git submodule add` で正式に親の submodule にする** (検証 repo を将来も参照したい場合)
5. **`trash` コマンドで丸ごと削除** (TDD 検証の役目を終えたなら最もシンプル)

## 制約条件

- **CLAUDE.md `## Agent Protocol`**: 削除は `trash` 優先 (rm 事故は復元不能)
- **CLAUDE.md `## Git`**: 不明ファイル/変更は削除せず聞く (ただし本件は経緯が明確なので例外的に判断対象)
- **本プロジェクトの `.claude/CLAUDE.md` Gitルール**: `.docs/templates` は Git 管理対象、`.gitignore` 追加禁止 (ただし本件 `test-tdd-cycle-validation/` は templates 配下ではないので対象外)
- **plan-workflow.md 準拠**: 判断を下したら `.docs/plans/` に記録 (ただし本議題は短命の整理判断なので plan 化は不要かも)
- **再現性**: 将来「TDD skill の検証ログを再現したい」となった時に、当時の repo 状態が辿れる必要があるかどうかは未確認

## 5 視点に求めたい論点

各視点が以下の観点で批評することを想定:

- **Implementer**: 5 候補のうち実装コストが最小なのはどれか、副作用は何か
- **Tester**: 検証 repo を消すと TDD skill のリグレッションテストが将来できなくなるか
- **Reviewer**: nested git repo を untracked のまま放置することの severity 判定
- **Documenter**: 検証経緯のドキュメントが他のどこにあるか、消した場合に推測必要箇所が増えるか
- **UI Designer**: (本議題は UI 案件ではないが) ハーネス全体の "見た目の整理度" として `git status` 出力の clean さは判断軸になるか
