---
feature: grandchild-agent-verification
session: 未設定
date: 2026-04-20 01:15:35
---

# 親→子→孫 3層エージェント起動の実測検証

## 概要

前ログ `2026-04-19_skill-subagent-relationship-map.md` で副作用として明記した **「fork時の挙動の実測なし」** 「subagent委譲時の境界未検証」を埋めるための実測セッション。親（メインセッション）→ 子（experiment-coordinator）→ 孫（grandchild-inspector）の3層エージェント構造が、Claude Code 上で実際に起動するか、`context: fork` による情報境界が期待通り働くかを、専用の検証用エージェント定義とスキルを使って直接検証した。

## 実装内容

### 1. 検証構成

- **子エージェント**: `.claude/agents/experiment-coordinator.md`（tools: `Read, Bash, Skill`、Agentツール無し）
- **孫エージェント**: `.claude/agents/grandchild-inspector.md`（tools: `Bash, Read`）
- **起動媒体スキル**: `fork-grandchild`（`context: fork` + `subagent: grandchild-inspector`）

### 2. 検証プロトコル

1. 親が Agent ツールで子（experiment-coordinator）を起動、親の秘密語 `murasaki-momiji-2026` を渡す
2. 子が `Skill` ツールで `fork-grandchild` スキルを起動（子は Agent ツールを持たないので、これが孫起動の唯一の経路）
3. 孫（grandchild-inspector）が独立contextで起動し、自己観察レポートを返す
4. 親の秘密語を**意図的に孫へ渡さない**ことで、`context: fork` による情報境界を検証

### 3. 実測結果（成立判定）

- ✅ 親→子の起動成立、秘密語 `murasaki-momiji-2026` が子に到達
- ✅ 子→孫の起動成立（Skill経由で fork-grandchild が subagent 起動）
- ✅ 孫contextに親の秘密語が**漏れていない**（`context: fork` が機能）
- ✅ スキル本文（SKILL.md）は孫contextに注入される（仕様通り）
- ✅ 環境変数 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` が孫起動の前提

### 4. 副次発見：エージェント自己申告の虚偽申告

検証中、エージェント自身が報告した「使えるツール一覧」が定義ファイルと食い違った:

| エージェント | 定義ファイル `tools:` | 自己申告 | 差分 |
|---|---|---|---|
| experiment-coordinator | Read, Bash, Skill | Read, **Write**, Bash, Skill | +Write |
| grandchild-inspector | Bash, Read | Read, Bash, **Skill** | +Skill |

grandchild-inspector が `Skill` を自己申告したのは、システムプロンプトに「Skillツールで別のskillを呼び出そうとしない」という**禁止文**が書かれており、その文言を「自分が持っている前提」として逆推論してしまったため。experiment-coordinator が `Write` を追加したのはClaude訓練時のデフォルトツールセットバイアスと推定。

## 設計意図

- **前ログの未実測部分をピンポイントで潰す**: 4月19日の関係性マップログで「概念整理」は完了していたが、「実測」は未実施だった。今回は専用の検証用エージェント定義（experiment-coordinator / grandchild-inspector）とスキル（fork-grandchild）を事前準備し、**検証だけに責務を絞ったミニマル構成**で実測に集中した。プロダクションコードの副作用無しに境界条件だけ確認できる
- **秘密語による情報境界の可視化**: `murasaki-momiji-2026` という意味のないユニーク文字列を親に持たせ、「孫のレポートにこの文字列が含まれるか」で情報境界を一発判定できるようにした。抽象的な「context分離」を具象的な文字列存否テストに還元した
- **子に Agent ツールを持たせない設計**: Claude Code のハードコード制約により、subagent は Agent ツールを持たない。これを逆手に取り「Skill経由でしか孫を起動できない」状態を作ることで、**Skill→subagent経路が孫起動の唯一の道**であることを証明する実験設計にした
- **自己申告ではなく定義ファイル照合で権限を確定**: 副次発見のきっかけは、かもねが「定義ファイルの tools と自己申告が食い違う」と指摘したこと。以降の検証は「エージェントに聞く」ではなく「定義ファイルを Read で読む」方針に転換した

## 副作用

- **権限境界の行動ベース検証は未実施**: 「experiment-coordinator に実際に Write を呼ばせて InputValidationError を観測する」「grandchild-inspector に Skill を呼ばせて失敗を観測する」という行動ベース検証はやっていない。定義ファイルと自己申告の差分を指摘したところで実験を閉じた。将来、ツール権限の**実働境界**を検証するなら、呼び出し→エラー観測のステップが必要
- **孫の cwd が親から継承されない仕様の詳細未調査**: 孫の cwd はプロジェクトデフォルトと一致し、親の cwd を暗黙継承していなかった。これが `context: fork` の仕様か、subagent 全般の挙動か、環境変数フラグ依存か、切り分けは未実施
- **孫から親への戻り値フォーマット詳細未観測**: 孫→子→親の戻り経路で、どの段階でどう整形されるかの詳細は見ていない。experiment-coordinator が中間で整形しているので、孫の生レスポンス構造は直接見られていない
- **エージェント自己申告の虚偽申告は他エージェントでも発生する可能性大**: 今回観測された「禁止事項→存在逆推論」「訓練デフォルトバイアス」は他のカスタム subagent でも同様に起きるはず。multi-agent 設計時、**観測ポイントを外側（定義ファイル参照・実行結果監視）に置く**原則が普遍的に必要
- **本検証で確認された仕様は CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 環境依存**: このフラグがオフの環境では fork-grandchild が機能しない可能性が高い。本番環境やチームメンバー環境へ移植する際は要確認

## 関連ファイル

- `.claude/agents/experiment-coordinator.md` — 子エージェント定義（tools: Read, Bash, Skill）
- `.claude/agents/grandchild-inspector.md` — 孫エージェント定義（tools: Bash, Read）
- `.claude/skills/fork-grandchild/` — `context: fork` + `subagent: grandchild-inspector` を持つ媒体スキル
- `.docs/templates/2026-04-19_skill-subagent-relationship-map.md` — **本ログの土台。副作用欄に書いた「fork時の挙動の実測なし」が本ログで解消**
- `.docs/templates/2026-04-19_invoke-and-deterministic-solution.md` — 決定論性の概念整理（Skill経由invoke成立の根拠）
- `.docs/templates/2026-04-18_skill-bang-command-firing.md` — skill発火タイミング実測（本ログの前提事実）
- 参考: `.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf` — note記事（「もう一つの設計層」の概念源）
