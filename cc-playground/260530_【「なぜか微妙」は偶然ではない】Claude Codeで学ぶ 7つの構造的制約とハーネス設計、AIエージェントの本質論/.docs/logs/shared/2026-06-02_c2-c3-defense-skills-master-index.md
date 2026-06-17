---
date: 2026-06-02 07:00:23
type: work
topic: c2-c3-defense-skills-master-index
session: C-2/C-3 防御ハーネス マスターインデックス (全資料の入口)
related_plan_id: 2026-05-31-c2-c3-defense-skills
related_plan: .docs/plans/2026-05-31-c2-c3-defense-skills.md
related_skill: [blinding-review-prompt, detecting-framing-bias, framing-advocate-merit-fork, framing-advocate-risk-fork]
related_agent: [framing-advocate-merit, framing-advocate-risk]
related_log_ids: [2026-05-31_c2-c3-defense-skills-planning, 2026-05-31_blinding-review-prompt-impl-validation, 2026-05-31_detecting-framing-bias-impl-validation, 2026-05-31_empirical-tuning-and-composition-e2e, 2026-05-31_c2-c3-defense-skills-session-summary, 2026-06-01_c2-c3-defense-skills-genesis]
related_log: [2026-05-31_c2-c3-defense-skills-planning.md, 2026-05-31_blinding-review-prompt-impl-validation.md, 2026-05-31_detecting-framing-bias-impl-validation.md, 2026-05-31_empirical-tuning-and-composition-e2e.md, 2026-05-31_c2-c3-defense-skills-session-summary.md, 2026-06-01_c2-c3-defense-skills-genesis.md]
---

# C-2/C-3 防御ハーネス ── マスターインデックス (1箇所で全部分かる入口)

> **このファイルは「ハブ」。** C-2(フレーミング/アンカー)と C-3(迎合)への防御 skill 2本について、成果物・経緯・全ドキュメントの場所と中身を1箇所に集約した入口。詳細は §6 のドキュメント索引から各資料へ辿る。

---

## 1. これは何か (30秒サマリ)

「7つの構造的制約」のうち **C-2(提示のされ方=フレーミング/アンカーに判断が引きずられる)** と **C-3(相手に忖度する=迎合)** に、「気をつける」ではなく **道具(skill)で構造的に抗う** ために作った防御ツール2本。

- **① blinding-review-prompt** = レビュー入力から著者情報・期待結論を機械除去する「盲検化」(変換 skill、master 単体)
- **③ detecting-framing-bias** = 同一対象を利点役/リスク役の独立 context:fork で評価し相殺する Devil's Advocate(評価 skill、6ファイル)

入力から錨を剥がす(①)+ 出力を両極に振る(③)で、同じ C-2/C-3 を挟み撃ち。

---

## 2. 成果物 ── skill/agent 実体 (8ファイル、`~/.claude/`、git管理外)

| # | ファイル | 役割 |
|---|---|---|
| ① | `skills/blinding-review-prompt/SKILL.md` | master(中立化変換の本体) |
| ① | `skills/blinding-review-prompt/references/blinding-rules.md` | 除去/保持リスト・K算出式・反迎合定型文 |
| ③ | `skills/detecting-framing-bias/SKILL.md` | master(2フレーム並列起動+相殺統合) |
| ③ | `skills/detecting-framing-bias/references/framing-guidelines.md` | C-2理論・非対称の読み方・相殺手順 |
| ③ | `skills/framing-advocate-merit-fork/SKILL.md` | 利点フレーム fork(孫起動) |
| ③ | `skills/framing-advocate-risk-fork/SKILL.md` | リスクフレーム fork(孫起動) |
| ③ | `agents/framing-advocate-merit.md` | 利点役 agent(opus、Edit/Write非付与) |
| ③ | `agents/framing-advocate-risk.md` | リスク役 agent(opus、Edit/Write非付与) |

---

## 3. なぜ作ったか (動機)

1. **起点** = 7つの構造的制約の学習。AIエージェントの弱点 C-2/C-3 に注目。
2. **grep 照合で穴を特定**: C-2 対処4つのうち、②独立コンテキスト・④インフレ禁止は `context:fork` で実装済み(✅)、③フレーミング・①ブラインドは原則のみで自動機構が薄い(△)。
3. **△2点を道具化**(camone 依頼)。原則は「偏っている本人には見えない」ので、自動で働く構造にする。

---

## 4. どう作ったか (プロセス)

- **設計手法**: Explore 2体で独立調査 → Plan 1体で統合(これ自体が C-2 対処「三角測量」の実践)。
- **役割分担**: ①=変換skill(master単体)/③=評価skill(fork構成)。攻め口を逆に。
- **作成順**: ①先(リスク小)→ ③(リスク大)。
- **検証**: 実機 → grayzone突破 → ドッグフーディング自己改善(③が自己欠陥3件検出→修正)→ empirical収束 → ①×③合成。

---

## 5. 重要な学び ── L1不可侵の視野狭窄 → ポリシー転換

- **何が起きたか**: わたし(Claude)は「L1不可侵 = 既存を一切壊さない」と過剰解釈し、①③ を既存ハーネスに後方互換組み込みする選択肢を検討せず独立 skill に倒した(= 死蔵リスク)。
- **なぜ誤りか**: harness-modification-policy は「判断軸は契約破壊か否かであって、アップグレード禁止ではない」「後方互換組み込みはむしろ推奨」と明記。
- **構造的原因**: 古い memory(絶対改修禁止)が、relocation後の柔らかい policy より強く効いた。
- **帰結**: ハーネス改修のデフォルトが「新規作成」→「**後方互換に改修して深める**(契約を壊す時だけ新規作成)」へ転換。
- 詳細は §6 の**経緯ログ(genesis)**を参照。

---

## 6. 📚 全ドキュメント索引 (どれを見れば何が分かるか)

**この表が「1箇所で分かる」の核。** 知りたいことに応じて開く資料を選ぶ。

| 知りたいこと | 開く資料 | パス |
|---|---|---|
| **全体の入口・概要** | 本マスターインデックス | `.docs/logs/shared/2026-06-02_c2-c3-defense-skills-master-index.md` |
| **設計の判断根拠**(なぜこの構成か) | plan(PLAN A=③ / B=①) | `.docs/plans/2026-05-31-c2-c3-defense-skills.md` |
| **plan策定の経緯** | planningログ | `.docs/logs/shared/2026-05-31_c2-c3-defense-skills-planning.md` |
| **① の実装・検証詳細**(!構文deny否定・除去・K算出) | ①検証ログ | `.docs/logs/shared/2026-05-31_blinding-review-prompt-impl-validation.md` |
| **③ の実装・検証詳細**(grayzone突破・自己欠陥3件検出) | ③検証ログ | `.docs/logs/shared/2026-05-31_detecting-framing-bias-impl-validation.md` |
| **empirical収束 + ①×③合成E2E** | empiricalログ | `.docs/logs/shared/2026-05-31_empirical-tuning-and-composition-e2e.md` |
| **セッション全体の流れ・成果** | セッションサマリ | `.docs/logs/shared/2026-05-31_c2-c3-defense-skills-session-summary.md` |
| **作成経緯の深掘り**(なぜ・どう・視野狭窄の学び) | 経緯ログ(genesis) | `.docs/logs/shared/2026-06-01_c2-c3-defense-skills-genesis.md` |
| **人間向けビジュアル解説** | 解説HTML | `.docs/output/explain-in-html/260531_c2-c3-defense-skills.html` |
| **③ の入力サンプル**(合成E2E用) | subject | `.docs/framing/CURRENT/subject.md` |
| **skill/agent 実体 8ファイル** | §2 の表を参照 | `~/.claude/skills/{...}` + `~/.claude/agents/{...}` |
| **ハーネス改修ポリシー本体** | policy | `~/.claude/rules/harness-modification-policy.md` |

---

## 7. 次の一手 (未完の残タスク)

1. **古い memory の更新**(根本原因を先に断つ): `feedback_no-existing-harness-modification` を新 policy に揃える(「絶対改修禁止」→「契約破壊だけ禁止・後方互換組み込み推奨」)。
2. **①③ を既存ハーネスに後方互換組み込み**: `executing-ai-development-workflow` の Review 前段に ①、設計判断ステップに ③ を、既存動作を壊さない形で配線(死蔵リスク解消)。今度は「契約を壊すか否か」の正しい軸で。

---

## 8. commit 履歴

| commit | 内容 |
|---|---|
| `420fcda` | plan策定ログ |
| `37cbb24` | ①③ 実装・検証・empirical・合成ログ + subject |
| `993a73e` | セッションサマリログ + 解説HTML |
| (未コミット) | 経緯ログ(genesis、2026-06-01)+ 本マスターインデックス(2026-06-02) |

---

## 関連ファイル

- 全資料は §6 のドキュメント索引を参照(これ1枚から全部辿れる)
- 出典: L1/L2/L3 の構造 = note記事260222『次世代エージェント設計』の動的オーケストレーション3層 / 「改修禁止」の魂 = 2026-05-06 essence/失敗体験(memory)
