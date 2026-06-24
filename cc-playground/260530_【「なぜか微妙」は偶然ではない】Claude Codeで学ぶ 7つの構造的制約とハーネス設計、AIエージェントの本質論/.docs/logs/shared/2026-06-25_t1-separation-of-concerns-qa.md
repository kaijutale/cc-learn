---
date: 2026-06-25 06:20:20
type: qa
topic: t1-separation-of-concerns-qa
session: note T-1 関心ごとの分離 質疑
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [orchestrating-team-development, enforcing-strict-tdd-cycle, llm-debate, detecting-framing-bias, reviewing-pr-with-google-engineering-practices, essence-reviewing-orchestrator, logging]
related_agent: [coder, team-tester, team-implementer, team-reviewer]
---

# note「T-1. 関心ごとの分離」質疑 — パターン1 オーケストレーター+ワーカーの実装照合

> 記事のパターン1がハーネスで実装済みか、その「層で割れる」充足の意味、そして coder を修正すべきかを、記事(PDF p50-52)とハーネス一次情報(coder.md / SKILL.md)を突き合わせて確定した Q&A 記録。

## 概要

note記事(260405)の Part II「T-1. 関心ごとの分離 / パターン1: オーケストレーター + ワーカー」(PDF p50-52)を題材に、かいじゅうのハーネス(`~/.claude/`)での実装状況を3つの問いで検証した。
記事側の逐語(該当ページ特定 + 書き起こし)と、ハーネス側の実装マッピングは別コンテキスト(Explore agent)に調査委譲してメインcontextを保護。最終の「修正すべきか」判断は、孫引きを避けるためメインClaude自身が `coder.md` と `enforcing-strict-tdd-cycle/SKILL.md` を一次読みして断定した。

記事パターン1の定義(PDF p50-52 逐語の核心):
> 親エージェント(オーケストレーター)はコンテンツを一切生成しない。判断と委譲だけを行う。子エージェント(ワーカー)はそれぞれ1つの関心事だけを担う。連携はファイル経由。核心は「オーケストレーターが何も生成しない」こと。指揮者がバイオリンを弾き始めたら、指揮が崩壊する。

## 内容

### Q1. パターン1(オーケストレーター+ワーカー)はハーネスで実装済みか → Yes(多重実装)

記事パターン1から抽出した5要件のうち **4要件は完全充足**。残る1要件「コンテンツ生成ゼロ」は層で割れる(Q2)。

| # | 記事の要件 | 充足 | ハーネスでの実体 |
|---|---|---|---|
| 1 | ワーカーは独立コンテキスト | ✅完全 | `context: fork`(会話履歴を物理切断)+ Agent subagent |
| 2 | ワーカーは1つの関心事だけ | ✅完全 | team-tester / team-implementer / team-reviewer、debater-*、framing-advocate-{merit,risk} |
| 3 | 連携はファイル経由 | ✅完全 | `!`コマンド構文で spec/source/test を決定論的注入、所有権境界 |
| 4 | 統合判断はオーケストレーター | ✅完全 | Lead/L3 が統合(= "T-2.3 統合判断を委任しない") |
| 5 | オーケストレーターはコンテンツ生成ゼロ | ⚠️層で割れる | master/L3は遵守、coder(L2)のみハイブリッド |

代表実装(記事の Worker A〜E 図に対応、しかも入れ子で多重展開):
- `orchestrating-team-development`(L3指揮者) → `coder`(L2) → fork skills(L1) → team-*(L0)
- `llm-debate`(5視点並列)/ `detecting-framing-bias`(merit/risk 2並列)/ `reviewing-pr-with-google-engineering-practices`(author/code 2並列)/ `essence-reviewing-orchestrator`(3領域並列)

記事 p52「分離手段の選択基準」表(Skill context:fork / Agentツール / Bashツール / Plan Mode)も、知識でなく配線として全部使い分け済み。

### Q2.「層で割れる」とは何か → 要件5の充足がオーケストレーター階層で分かれる

ハーネスには "オーケストレーター" 役が複数階層に存在し、「コンテンツ生成ゼロ」を守る層と破る層に分かれる。割れ目は1点のみ。

| 指揮役 | コンテンツ生成ゼロ? | 実際の挙動 |
|---|---|---|
| L3 `orchestrating-team-development` | ✅守る | 全工程をワーカー委譲、統合判断のみ |
| master Lead(`llm-debate` 等) | ✅守る | 並列起動 + VERDICT/BALANCED 統合のみ、評価素材は生成しない |
| **L2 `coder`** | ⚠️破る | verify FAIL時に**自分で Edit/Write でソース局所調整** |

### Q3. coder は修正すべきか → No(現状維持が正しい)

一次情報を読むと、coder のコンテンツ生成は「バグ」ではなく根拠付きで自覚的に文書化された意図的トレードオフだった。修正不要の根拠5点:

1. **文書化済み(バグでない)**: coder.md:31 / SKILL.md:134 — 「フレッシュ起動の team-implementer を何度も呼ぶと毎回ゼロから実装し直しになるため、coder が履歴を持って局所修正する」
2. **役割が違う**: coder は "TDD Tactical Orchestrator(戦術オーケストレーター)"(coder.md:19)。「バイオリンを弾くな」は L3 指揮者への戒めで、L2 戦術層への要求ではない
3. **適用領域の見極め**: 調整(adjust)は「前回の失敗を踏まえた局所修正」= 履歴連続性が品質に直結。context:fork(履歴ゼロ)に投げると毎回ゼロ実装で**改悪**になる
4. **崩壊リスクは別系統で封印済み**: テスト変更禁止(Rules:67 / やらないこと:398)、RED時点テストSHAの `--baseline` 物理照合で偽GREEN検出(Rules:75, C-4/C-5)、verify は別 team-tester がフレッシュ独立実行(SKILL.md:160-164)、spec不可侵(Rules:69)、llm-debate盲従禁止(やらないこと:11, T-2.3)
5. **改修は契約破壊**: 純粋指揮者化は L3↔coder の Agent委譲IFと red/implement/verify-fork 配線を壊す破壊的変更。harness-modification-policy に照らし、バグでないものを契約破壊してまで直す理由がない

唯一の任意改善(nice-to-have、必須でない): coder.md 冒頭の役割宣言に「本層は記事パターン1の『コンテンツ生成ゼロ』を意図的に緩める層。理由=調整ループの履歴連続性。崩壊リスクは C-4/C-5/独立verify で代替封印」という WHY 1-2行。ただし「やらないこと」節と:31 で実質カバー済み。

## 重要な学び(観測した非対称性 — 残す価値の核心)

- **「文言違反」≠「設計欠陥」**: 前回応答でわらわが「逸脱」「割れ目」と呼んだものは、一次情報を読むと「欠陥」ではなく「意図的トレードオフ」だった。記事原則の**文言**(指揮者はバイオリンを弾くな)と**目的**(指揮の崩壊防止)を区別すれば、coder は文言に反するが目的は別手段で達成しておる。
- **迎合回避の実例**: 「coderは修正すべき?」という問いは、前回の「逸脱」発言の流れ上「はい直しましょう」へ誘導しやすい(順序・確証バイアス)。一次情報を読んで逆(No)を根拠付きで断定した。孫引き(調査agentレポート)で判断せず、判断の核心ファイルはメインが自分で読むのが正解だった。
- **ログ配置の分岐**: logging skill のデフォルト(常に local/ → promote で shared/)に対し、本プロジェクトの CLAUDE.md は「全ログを直接 shared/ に Git 追跡」と上書き指示。skill の canonical root resolver は親リポ(`claude-code-learn`)の local/ を指すが、プロジェクト相対の `<cwd>/.docs/logs/shared/`(既存51ログ)が正。プロジェクト指示が skill デフォルトを上書きする好例。

## 関連ファイル

- `.docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】…本質論.pdf` — 記事本体。T-1/パターン1 は p50-52(画像PDF・テキストレイヤー無し)
- `~/.claude/agents/coder.md` — coder 一次情報。:19 戦術オーケストレーター宣言 / :31 履歴保持の根拠 / Rules:67,69,75 / やらないこと:8,11
- `~/.claude/skills/enforcing-strict-tdd-cycle/SKILL.md` — :134 ループ設計の根拠 / :160-164 フレッシュコンテキスト原則
- `~/.claude/skills/{orchestrating-team-development,llm-debate,detecting-framing-bias,reviewing-pr-with-google-engineering-practices,essence-reviewing-orchestrator}/SKILL.md` — パターン1 多重実装の代表5系統
