---
name: fork-great-grandchild
description: ひ孫エージェント検証用スキル。context:fork で孫コンテキストを切り離し、subagent:great-grandchild-inspector でひ孫を起動する。孫エージェント（recursive-grandchild-inspector）から呼び出すことを想定。
context: fork
subagent: great-grandchild-inspector
---

# ひ孫エージェント起動プロトコル

このスキルは `context: fork` と `subagent: great-grandchild-inspector` の組み合わせにより、
呼び出し元（孫エージェント）のコンテキストから完全に切り離された独立コンテキストで
`great-grandchild-inspector`（ひ孫エージェント、4層目）を起動します。

## 注入される動的コンテキスト（!コマンド展開）

### 実行時刻
!`date "+%Y-%m-%d %H:%M:%S"`

### ホスト名
!`hostname`

### カレントディレクトリ
!`pwd`

### 実行ユーザー
!`whoami`

### 層の識別
!`echo "layer=great-grandchild; chain=parent->coordinator->recursive-grandchild->great-grandchild"`

## ひ孫エージェントへのタスク指示

あなた（great-grandchild-inspector）は上流の履歴を持たないため、
システムプロンプトの指示に従って観察レポートを作成してください。

## 設計上の注意点

- このスキルは呼び出し元の会話履歴を引き継ぎません（context:fork の性質）
- ひ孫の実行完了後、孫エージェントにはひ孫のレポートがスキルの戻り値として返ります
- ひ孫は Skill/Agent ツールを持たないため、5層目（玄孫）は起動できない（実験終端）
