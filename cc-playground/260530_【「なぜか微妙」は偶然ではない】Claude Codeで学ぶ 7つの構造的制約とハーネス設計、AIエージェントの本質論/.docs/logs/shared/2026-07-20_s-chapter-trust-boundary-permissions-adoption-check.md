---
date: 2026-07-20 22:10:37
type: study
topic: s-chapter-trust-boundary-permissions-adoption-check
session: S章「信頼境界と権限」取り入れ確認 (取り入れフェーズ第6弾)
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (S章 = 1951〜2132行)
related_skill: [logging]
related_log_ids: [2026-07-20_v-1-1-failure-promotion-ladder-deepdive, 2026-07-16_global-harness-changelog-review]
related_log: [.docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md, .docs/logs/shared/2026-07-16_global-harness-changelog-review.md]
---

# S章「信頼境界と権限 — 善意の間違いの爆発半径を抑える」取り入れ確認 — 判定: 取り入れ済み・設計は記事超え / ただし"配備≠実効"が実際に噛んだ唯一の領域

> note S章 (S-1 3層権限ゲート / S-1.1 出所追跡 / S-1.2 安全判定を機械化 / S-1.3 最小権限 / S-1.4 伝播停止段階で防御 / S-1.5 fail-closed) を照合。**6ユニット全て実装済み、保護範囲は記事超え** (評価基準ファイルだけでなくハーネス全体を deny)。ただし S章は K-2/V 章と決定的に違う — **過去の観測レビュー (07-11〜19) で "配備≠実効" (deny 不発・sandbox dead config 等) が実際に多数発見・修正された唯一の領域**。設計の高さと実効の危うさが同居する。正直に両方記録する。

## 概要

取り入れフェーズ第6弾。かいじゅうが「S章に進む」を選択。S章は「検証基準自体を書き換えられたら検証は無意味」= 権限設計が検証の信頼性を支える、という章。照合は settings.json deny の機械集計 + hook 実測で行った。

## 内容

### S-1 3層権限ゲート — 保護範囲が記事を超える

note の3層: L1 宣言的禁止 (deny) / L2 条件付き許可 (PreToolUse hook) / L3 人間承認 (permission mode)。

| 層 | note の例 | `~/.claude` の実装 (実測) |
|---|---|---|
| L1 宣言的禁止 | `Edit(.eslintrc*)` `Edit(**/*.test.ts)` `Bash(rm -rf *)` deny | **deny 177本**。評価基準ファイル (`.eslintrc*` / `eslint.config*` / `tsconfig*` / `vitest.config*` / `.prettierrc*` / `biome.json`) を網羅 + Tier4 (`rm -rf` / `git push` / `git reset` / `git checkout` / `sudo`) |
| L2 条件付き許可 | git push は main 以外のみ 等 | **PreToolUse hook 15本** (`hook_pre_commands` が正規表現でコマンド評価、worktree write guard 2本) |
| L3 人間承認 | 本番デプロイ・PR作成 | **ask 30本** + `git push` はかいじゅうのみ (人間承認) + PR作成の HITL |

**記事超えの核心**: note は「評価基準ファイル (.eslintrc/test)」の保護を言う。ハーネスは**評価装置そのものを丸ごと保護**する — `Edit(~/.claude/hooks/**)` / `rules/**` / `skills/**` / `agents/**` / `.docs/progressive-disclosure/**` / `settings*` / `hooks/rules/*.json` (L2判定データ) を全て deny。「検証基準を書き換えられたら無意味」を論理的極限まで — テストだけでなく**レビューア・essence 原則・rule 本体・判定データまで書き換え不能**にしてある。

### S-1.1〜S-1.5 の照合

| ユニット | 推奨 | 実装 (実測) | 判定 |
|---|---|---|---|
| S-1.1 出所と露出先の追跡 | 外部入力を fork 検疫 + 出所ラベル + Memory昇格ルール | **`hook_post_external_input_notify` / `hook_post_mcp_notify`** が出所を機械マーク (Claude の記憶に頼らない) + `context:fork` 隔離 (fork skill 多数 + `conducting-research-phase` が調査を**ファイルに外部化**= note の「ファイル検疫ゲート」そのもの) + Memory昇格は `probe-before-persist` (出所明記・外部検証・有効期限に対応) + citation-format rule | ✅ 記事超え (出所ラベルが決定論) |
| S-1.2 安全判定を機械化 | 「安全か」を LLM でなく機械条件で | `hook_pre_commands` (正規表現でコマンドブロック) / `read_secret` / `hardcode_hygiene`。「意味論判断は機械化しない」の逆側 (安全判定=機械化する) を明確に分離 | ✅ |
| S-1.3 最小権限・可逆性分類 | Tier1読取=allow / Tier2-3=ask / Tier4不可逆=deny + worktree隔離 | allow 41 (Tier1) / ask 30 (Tier2-3) / deny 177 (Tier4+評価基準) の三分類が可逆性ベース。`sandbox.filesystem` 設定 + worktree隔離運用 (harness-worktree-isolation.md) | ✅ |
| S-1.4 伝播停止段階で防御 | 曝露→永続化→中継→実行の4段階、実行遮断が最重要 | 永続化=probe-before-persist (K-1.2) / 中継=fork隔離+出所ラベル (S-1.1) / 実行=deny+permission (S-1.3)。**多層で各段階に防護** | ✅ |
| S-1.5 fail-closed | 安全側デフォルト。Tier別にデフォルト切替 | 防御 gate 12本が「fail-closed / 安全側」を明文。**観測センサーは fail-open** と意識的に使い分け (gate が fail-open だと危険 / sensor が fail-closed だと作業停止) — 記事より一段細かい | ✅ 記事超え (fail-closed/open の使い分け) |

### 記事超え 3点

1. **保護対象が"評価装置全体"**: テスト・lint 設定だけでなく、レビューア agent・essence 原則・rule・判定データ JSON・hook 本体まで deny。判定する側を丸ごと凍結
2. **出所ラベルが決定論**: note は「出所を明記する」を規律として言うが、ハーネスは hook が外部入力に自動でマークを付ける (Claude が忘れても付く)
3. **fail-closed/fail-open の意識的な使い分け**: 防御 gate は fail-closed、観測 sensor は fail-open。「全部 fail-closed」でなく部品の役割で切り替える

### 残差 — S章は"配備≠実効"が実際に噛んだ唯一の領域 (正直に記録)

K-2 章・V 章の照合は「設計が高く、実効も揃っている」で綺麗に閉じた。**S章はそうではない**。07-11〜07-19 の観測レビューシリーズは、その大半が**この S章の領域 (permission / sandbox / deny) の "配備≠実効" 掘り起こし**だった:

- 07-16: sandbox 202本の dead config / HOME 狙い deny 7本の不発 / 9 hook 通知の沈黙死 — いずれも「denyリストに在るが実際には効いていない」実測。issue 化され 07-19 に OPEN 0 到達で一旦収束
- 恒久残差 (未解決として台帳管理): `/etc` は hook 単層 / 裸 credentials の Grep 経路 / #190 case-scan 非対称

**教訓**: 権限・deny は「宣言したリスト」と「実際に発火するか」の乖離が最も起きやすい。S章の設計 (3層ゲート・保護範囲) は記事超えだが、**deny を1本足したら "本当に効くか" を実測しないと配備しただけになる** — これは K-2.3 観測面 / V章「配備≠実効」の教訓が最も鋭く当たる領域。設計判定は「取り入れ済み・記事超え」、運用判定は「継続的な実効検証が必須」の二本立てが正しい。

## 関連ファイル

- `.docs/references/260405_…/text.md` (1951〜2132行) — S章本文 (照合基準)
- `~/.claude/settings.json` — permissions allow41/deny177/ask30 (機械集計) + sandbox.filesystem
- `~/.claude/hooks/hook_post_external_input_notify.sh` / `hook_post_mcp_notify.sh` — 出所ラベル (S-1.1)
- `.docs/logs/shared/2026-07-16_global-harness-changelog-review.md` — 「配備≠実効」3クラス確定の実測 (残差の一次資料)
- `.docs/logs/shared/2026-07-20_v-1-1-failure-promotion-ladder-deepdive.md` — 前弾 (V-1.1)
