# 孫エージェント検証実験 — 使い方

note記事「Claude Codeには"もう一つの設計層"がある」で紹介された
`context:fork` + `subagent:` による孫エージェント起動メカニズムを
**手元で再現・検証**するための最小構成サンプル。

## 構成

```
親（あなたとClaude Codeのセッション）
  └─ Agentツール → experiment-coordinator（子）
       └─ Skillツール → fork-grandchild（skill、context:fork）
            └─ grandchild-inspector（孫、独立コンテキスト）
```

## 構成ファイル

| パス | 役割 |
|---|---|
| `.claude/agents/experiment-coordinator.md` | 子（実験司令塔） |
| `.claude/agents/grandchild-inspector.md` | 孫（自己観察レポーター） |
| `.claude/skills/fork-grandchild/SKILL.md` | 孫を起動する skill |

## 実行手順

### 手順1. 親プロンプトで子を起動

Claude Code のメインセッションで以下のように依頼する。
親エージェント（このセッションのあなた）が Agent ツールで `experiment-coordinator` を呼ぶ。

```
experiment-coordinator エージェントを起動して、
孫エージェント検証実験を実行してください。
親の秘密語は「murasaki-momiji-2026」です。
```

### 手順2. 子エージェントの動作

子（`experiment-coordinator`）は以下を実行する。

1. 自分のツール一覧を確認（Agentツールが無いこと）
2. Skill ツールで `fork-grandchild` を呼び出す
3. 孫からのレポートを親に転送する

### 手順3. 孫エージェントの動作

`fork-grandchild` skill が読み込まれた瞬間に以下が起こる。

1. `!コマンド`（date / hostname / pwd / whoami / env）がシェル実行され、結果がテキスト展開
2. `context: fork` により独立コンテキストが生成される
3. `subagent: grandchild-inspector` で定義された孫が、展開済みのコンテキストを持って起動
4. 孫は SKILL.md 本文に書かれた指示に従って観察レポートを返す

## 検証ポイント

孫が実際に機能したかは、以下の3点で判定する。

### ✅ 観測1: 孫起動の証明

孫のレポートに `name: grandchild-inspector` が明記されていれば、
`subagent:` 指定で定義ファイルが読み込まれたことの証拠になる。

### ✅ 観測2: `context: fork` の有効性

親プロンプトで渡した **秘密語**（例: `murasaki-momiji-2026`）が
孫のレポートに **含まれていない** ことを確認する。

- **含まれていない** → `context:fork` は有効。親履歴は遮断されている
- **含まれている** → `context:fork` が機能していない（設計失敗）

### ✅ 観測3: `!コマンド` 展開のタイミング

孫のレポートに含まれる日時（`date` 出力）が、
**実験を実行した時刻と一致している** ことを確認する。

これは「スキル読み込み時」に `!コマンド` がシェル実行されていることの証拠。

## 想定される制約・注意点

- 公式ドキュメントでは「サブエージェントからの Skill 呼び出しは使えない」と記載されている
- 実測では動作するが、**将来のアップデートで挙動が変わる可能性**がある
- 子エージェントの定義の `tools:` フィールドに `Skill` を含めておくこと
- `!コマンド` は任意のシェル実行となるため、機密情報（トークンなど）が展開されないよう、環境変数フィルタは必須

## トラブルシュート

### 子エージェントが Agent ツールで孫を呼ぼうとする

子の定義に「Agentツールは持たない」と明記してあるが、モデル側が勘違いする場合がある。
その場合は子の指示セクションに「Skillツール経由で呼ぶこと」と再強調する。

### 孫が何をすべきか分からず停止する

`context: fork` で親履歴が切れているため、SKILL.md 本文にマニュアル型で
タスク指示を明記する必要がある。本実装では「観察レポートを返すだけ」と
明確に定義してある。

### `fork-grandchild` skill が発見されない

Claude Code セッションの再読み込みが必要な場合がある。
スキル一覧に `fork-grandchild` が出現することを確認してから実行する。
