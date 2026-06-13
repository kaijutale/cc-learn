---
date: 2026-06-13 20:10:41
type: qa
topic: claude-code-config-settings-explainer
session: claude-code-config-settings
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, logging]
related_agent: [claude-code-guide]
---

# Claude Code /config で設定できる全項目のカテゴリ別リスト解説

> /config 対話メニュー(約30項目)と settings.json(約50+項目)の棲み分け・5層の優先順位・反映タイミングを調査し、HTML 解説を生成した Q&A ログ。

## 概要

「/config で設定できる全ての設定をリスト形式で日本語で。HTML で解説して」という依頼。
claude-code-guide サブエージェントで最新の公式仕様を確認し、explain-in-html スキルで
self-contained な単一 HTML を生成した。

核心は「設定の入り口は2つに分かれる」点:

- `/config` = 端末上の対話メニュー。セッション単位の切り替え + 表示まわり(約30項目)
- `settings.json` = 権限ルール・hooks・MCP・環境変数など、構造が複雑で文字で書くしかない設定(約50+項目)

`/config` で操作した内容の多くは裏で settings.json に書き戻される。つまり /config は
「JSON を直接書かずに済ませる入り口」。

## 内容

### /config 対話メニューの全項目(カテゴリ別)

1. モデルと推論
   - Model — セッション既定モデル(Opus/Sonnet/Haiku)
   - Thinking Mode — 拡張思考のオン/オフ(既定 On)
   - Fast Mode — 同一モデルのまま高速出力(格下げではない)

2. コンテキスト管理
   - Auto-compact — 上限接近時に会話を自動圧縮(既定 On)
   - Rewind / Checkpoints — ファイル変更前に巻き戻し点を自動作成(既定 On)

3. 表示・エディタ・言語(最多カテゴリ)
   - Theme — 配色テーマ(Dark/Light/色覚配慮版/ANSI版)
   - Output Style — 応答の文体スタイル
   - Editor Mode — 入力欄キー操作(normal/vim)
   - Language — 画面・応答の言語(既定 English)
   - Verbose Output — ツール呼び出し等の詳細表示(既定 Off)
   - Show Turn Duration — 各回答の所要時間表示
   - Show Tips — 思考中ヒント表示
   - Reduce Motion — アニメーション削減
   - Terminal Progress Bar — タイトルバー/タブに進捗表示
   - Show PR Status Footer — PR状態をフッター表示

4. 権限・ファイル・通知・更新・連携
   - Default Permission Mode — 起動時の既定承認ポリシー(default/acceptEdits/plan)
   - Respect .gitignore in File Picker — ファイル選択で .gitignore 尊重
   - Always Copy Full Response — /copy で常に全文コピー
   - Notifications — 完了通知方法(auto/terminal_bell/iterm2/kitty/ghostty/無効)
   - Auto-update Channel — 更新チャネル(latest/beta)
   - External Includes — CLAUDE.md の @import 取り込み

### /config UI と settings.json の棲み分け

| 設定対象 | /config | settings.json |
|---|---|---|
| モデル選択 | 可(セッション単位) | 可(永続化) |
| 思考モード | 可 | UI向け |
| 権限ルール(allow/deny/ask) | 不可 | 可(JSON構造必須) |
| Hooks(自動処理) | 不可 | 可 |
| MCP サーバー(外部接続) | 不可 | 可 |
| 環境変数(env) | 不可 | 可 |
| テーマ/言語/通知 | 可 | 可(UI操作分はJSONに書き戻る) |

### 設定ファイルの5層と優先順位(上が下を上書き)

1. (最高) 管理ポリシー(企業)
2. CLI フラグ(その実行のみ)
3. .claude/settings.local.json(個人×当リポジ、Git追跡外)
4. .claude/settings.json(プロジェクト全体、Git追跡)
5. (最低) ~/.claude/settings.json(全プロジェクト)

### 反映タイミングの注意

- model / outputStyle / env → セッション再開か /clear が必要(その場で反映されない)
- permissions / hooks → 保存後、次のコマンド/イベントから反映(再起動不要)

### 注意・限界

Theme の具体値・Default Permission Mode の選択肢は環境/バージョン依存があり、
手元の /config 実画面が最終的な正。本ログは 2026-06-13 時点の調査スナップショット。

## 関連ファイル

- .docs/output/explain-in-html/260613_claude-code-config-settings.html — 生成した HTML 解説(8セクション: 概要/モデル・コンテキスト/表示・エディタ/権限・通知/棲み分け/5層/反映タイミング/総評)
- .docs/references/sources/pdf/260405_*.pdf — プロジェクト参照記事(ハーネス7制約)

## 出典(番号→解決先)

- 公式: https://code.claude.com/docs/en/settings (Claude Code settings 正本)
- 補助: settings.json 全リファレンス Gist(v2.1.104, 2026-04-13)/ hidekazu-konishi.com 設定リファレンス2026 — いずれも公式が最優先
