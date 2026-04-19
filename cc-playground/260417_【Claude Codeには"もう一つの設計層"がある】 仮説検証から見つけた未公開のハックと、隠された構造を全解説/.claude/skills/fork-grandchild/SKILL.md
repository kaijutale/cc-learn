---
name: fork-grandchild
description: 孫エージェント検証用スキル。context:fork で親コンテキストを切り離し、subagent:grandchild-inspector で孫を起動する。子エージェント（experiment-coordinator）から呼び出すことを想定。
context: fork
subagent: grandchild-inspector
---

# 孫エージェント起動プロトコル

このスキルは `context: fork` と `subagent: grandchild-inspector` の組み合わせにより、
呼び出し元（子エージェント）のコンテキストから完全に切り離された独立コンテキストで
`grandchild-inspector`（孫エージェント）を起動します。

## 注入される動的コンテキスト（!コマンド展開）

以下は、このスキルが読み込まれた瞬間にシェル実行され、
結果がテキストとして展開された上で孫エージェントに渡ります。

### 実行時刻
!`date "+%Y-%m-%d %H:%M:%S"`

### ホスト名
!`hostname`

### カレントディレクトリ
!`pwd`

### 実行ユーザー
!`whoami`

### Claude Code 関連の環境変数（機密は出さない）
!`env | grep -i "^CLAUDE" | grep -v -i "key\|token\|secret" | head -5 || echo "(CLAUDE_* 環境変数なし)"`

## 孫エージェントへのタスク指示（マニュアル型）

あなた（grandchild-inspector）は親履歴を持たないため、以下を厳密に実行してください。

1. 冒頭で `### 孫エージェント観察レポート` と書き出す
2. 自分の name を明記
3. 上記の !コマンド展開結果（日時・ホスト名・pwd・ユーザー・環境変数）をそのまま引用
4. 親エージェントのユーザー対話履歴が見えるかを報告
   - 見えない場合：「親コンテキストは遮断されている（context:fork 成功）」
   - 見える場合：見えた内容を記述（context:fork 失敗の証拠）
5. 自分のツール一覧（tools フィールドから）を記述
6. 最後に「起動証明: このレポートが返っていれば孫は生きている」を付記

## 設計上の注意点

- このスキルは呼び出し元の会話履歴を引き継ぎません（context:fork の性質）
- 孫の実行完了後、子エージェントには孫のレポートがスキルの戻り値として返ります
- 孫は Skill ツール経由でさらに別の skill を呼び出さないこと（実験スコープ外）
