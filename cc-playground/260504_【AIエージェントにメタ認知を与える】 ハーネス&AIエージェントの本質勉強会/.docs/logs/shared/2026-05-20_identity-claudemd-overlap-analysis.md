---
date: 2026-05-20 17:09:15 +0900
type: work
topic: identity-claudemd-overlap-analysis
session: Session N+11 (pickup → 5-5 フル検証 → 5-6 source of truth 整理)
related_skill: [project-essence-orchestrator, logging]
related_plan: [2026-05-18-project-domain-reviewer-construction.md]
related_plan_id: pdr-construction
subtask: "5-6 (identity vs CLAUDE.md source of truth 整理、モデル A 維持の範囲内)"
decision: "モデル A 維持 (identity は補助 doc、真実のソースは CLAUDE.md+rules+memory+essence)。モデル B は別 plan に分割"
note: プロジェクト CLAUDE.md ルールにより local/ を経由せず shared/ 直書き
---

# PDR サブタスク 5-6 — identity vs CLAUDE.md source of truth 整理

> identity (`.docs/identity/`) と CLAUDE.md (project + global) + rules + memory の重複箇所を列挙し、各重複が「参照リンク化で済む冗長」か「役割分離で正当な再構成」かを判定。結論: **モデル A 維持** (identity は補助 doc)。純粋な冗長は 1 箇所のみで、大半は essence 対応という固有切り口を持つ正当な再構成。

## 背景

- 本プロジェクトの設計判断は 4 箇所に分散: ①project `.claude/CLAUDE.md` (固有最小ルール) / ②global `~/.claude/CLAUDE.md` + `rules/*.md` (普遍 user ルール) / ③memory feedback 群 / ④`.docs/identity/*.md` (識別宣言)
- どれが source of truth か曖昧 → PDR (固有軸 reviewer) の評価基準が identity なので、identity が CLAUDE.md と矛盾/重複すると評価がブレる懸念
- 5-5 フル検証で固有軸 reviewer が skill-identity.md の文面矛盾を Low 検出 → 5-6 で根本対処

## 重複インベントリ (identity → source of truth)

| # | identity 箇所 | 一次ソース (重複先) | 現状 | 判定種別 | アクション |
|---|---|---|---|---|---|
| 1 | harness-identity `persona` 節 (キャラ/言語/fence/禁止 を再掲) | global CLAUDE.md `Persona` 節 | 「定義済み、そのまま継承」と参照宣言済 + 要点再掲 | **参照リンク化 (R)** | 要点再掲は冗長。参照ポインタ + 改訂日で圧縮可。ただし fence (🌟始めるよ/🎉完了したよ) は global と微差あり → 差分のみ残す |
| 2 | harness-identity `モデル選択` (Opus固定/外部LLM禁止) | global CLAUDE.md `Harness` 節 + memory | essence 原則への 1:1 対応として再構成、根拠列に memory パス明記 | **役割分離 (S)** | 維持。「essence 対応表」という固有切り口があり単純重複でない |
| 3 | harness-identity `ログ運用` (shared 直行) | project `.claude/CLAUDE.md` ログルール | essence 原則3 の実装として記述 | **役割分離 (S) + 参照補強** | 維持。「project CLAUDE.md が一次ソース」ポインタを 1 行足すと尚良 |
| 4 | harness-identity `エージェント実行ポリシー` 表 | global `rules/*.md` (review/plan/critical-thinking) | 根拠列に rules パス明記済 | **良好 (既に R)** | 維持。参照リンク済の理想形 |
| 5 | skill-identity `レビュー基準 essence 利用` 節 | harness-identity 同節 | 自己申告「重複するが skill 観点で再掲」 | **identity 内部重複 (D 候補)** | skill 観点の付加価値が薄い。将来 harness-identity への参照に寄せる候補。現状は意図明示で許容 |
| 6 | skill-identity `多人数/fork/TDD` 節 | memory feedback 群 | skill 使用時の具体方針、memory パス済 | **役割分離 (S)** | 維持 |

## 判定マトリクスの結論

- **大半 (#2/#3/#4/#6) は「役割分離 (S)」**: identity は「essence 8 原則 × 本PJの選択」という 1:1 対応マッピングの切り口を持つため、CLAUDE.md/memory と内容が重なっても単純コピーではなく**再構成**。Anti-Goal「重複ドキュメント禁止」(project-charter.md:81) には抵触しない。
- **純粋な冗長は #1 のみ**: persona の要点再掲。参照リンク + 改訂ポインタで圧縮できるが、fence の固有差分 (本PJ独自の 🌟/🎉) は残す必要あり → 軽微なので即修正不要、認識として記録。
- **#5 は identity 内部重複**: 意図明示済みで許容範囲だが、将来 harness-identity への参照に寄せる候補。

## source of truth モデルの決定

**モデル A を維持** (plan 暫定推奨通り):

- **真実のソース** = global CLAUDE.md + `rules/*.md` + memory feedback (普遍) + project `.claude/CLAUDE.md` (固有最小ルール) + essence (昇格済原則)
- **identity の位置付け** = 上記への「essence 対応マッピング + 本PJの選択宣言」という補助 doc。固有の切り口 (1:1 対応) を持つので価値がある
- **PDR の評価基準** = identity のみで成立 (identity を読めば本PJ固有評価軸が揃う)。モデル A でも PDR は機能する
- **モデル B (identity を真実のソース化)** は採用見送り → 別 plan `2026-05-20-identity-source-of-truth-modelB.md` に判断材料を分割。理由: CLAUDE.md + rules + memory の大改修が必要で改修禁止リストと干渉リスク、慎重な段階展開が必要

## gitignore 方針の確定 (5-6 の一部)

source of truth と密接に絡む「何を git 追跡するか」を確定:

| 対象 | 方針 | 実装 |
|---|---|---|
| `.docs/output/` | 再生成可能な中間成果物は除外、手作業 viz のみ追跡 | `.docs/output/*` + `!.docs/output/explain-in-html/`。harness-remaining-tasks.html を explain-in-html/ へ移動済 (Warm Paper パレット使用の手作業 viz) |
| `.claude/` | 揮発状態 (handoff-state.md 等) は除外、PDR ソースのみ選択追跡 | `.claude/*` + PDR 負パターン (agents/project-domain-reviewer.md + skills/{project-domain-reviewer-fork,project-essence-orchestrator})。explain-in-html と同型の「/* で ignore → ! で穴」方式 |

検証: `git check-ignore` で PDR ソース 4 件が trackable、handoff-state.md が ignored 維持を確認。settings.json/CLAUDE.md は元から追跡済 (force-add 前例)。

## 5-5 フル検証由来の発見と対処

- **固有軸 reviewer が skill-identity.md の文面矛盾を Low 検出**: 「本プロジェクト固有 skill は作らない」(skill-identity.md:96) と断言しているが、PDR (project-domain-reviewer-fork / project-essence-orchestrator) は `.docs/identity/` 依存でグローバル昇格不可な**固有 skill** → 自己矛盾
- **対処 (根本修正)**: skill 配置の判断フローに「`.docs/identity/` に構造的依存する reviewer は例外的にプロジェクトローカル配置を許容」分岐を追記。結論にも例外を明記。これで今後の PDR run が同矛盾を再 flag しない

## PDR git 追跡 / グローバル昇格判断 (5-6 と連動)

- **グローバル昇格**: ❌ 不可。PDR は `.docs/identity/` (本PJ固有資産) に構造依存し、global skills はプロジェクト固有情報を含めない原則 (CLAUDE.md `Harness` 節) に反する
- **選択追跡**: ✅ 採用。5-4 (fork→agent) + 5-5 (フル orchestration) で検証済 = 「実験資産」から「working asset」に昇格。知識永続化の趣旨 (project-charter.md:46「学習成果が gitignore で消えると勉強会の趣旨が崩壊」) に沿って git 追跡対象化
- **コミット**: 本セッションでは未実施 (main ブランチ + camone 依頼時のみ commit/push の原則)。追跡可能化のみ完了、staging/commit は committer 経由で camone 判断

## まとめ

source of truth はモデル A 維持で確定。identity の重複は大半が essence 対応という正当な再構成で、純粋冗長は persona 要点再掲の 1 箇所のみ。gitignore は「揮発除外 + working asset 選択追跡」の二段方針を `.claude/` と `.docs/output/` 双方に適用。5-5 検証で見つかった skill-identity.md の自己矛盾は例外分岐追記で根本修正。モデル B 判断は別 plan に分割。
