---
name: fork-recursive-grandchild
description: ひ孫検証用の孫起動スキル。context:fork で子コンテキストを切り離し、subagent:recursive-grandchild-inspector で Skillツール持ちの孫を起動する。子エージェント（deep-experiment-coordinator）から呼び出すことを想定。
context: fork
subagent: recursive-grandchild-inspector
---

# 孫エージェント起動プロトコル（ひ孫検証版）

このスキルは `context: fork` と `subagent: recursive-grandchild-inspector` の組み合わせにより、
呼び出し元（子エージェント）のコンテキストから完全に切り離された独立コンテキストで
`recursive-grandchild-inspector`（Skillツールを持つ孫エージェント）を起動します。

孫エージェントはさらに `fork-great-grandchild` スキルを呼び出し、ひ孫エージェントを起動することが期待されます。

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

### 層の識別
!`echo "layer=grandchild; chain=parent->coordinator->recursive-grandchild"`

## 孫エージェントへのタスク指示

あなた（recursive-grandchild-inspector）は上流の履歴を持たないため、システムプロンプトの指示に従って:

1. 自分の観察レポート（孫層の自己申告）を作成する
2. `Skill` ツールで `fork-great-grandchild` を呼び出し、ひ孫を起動する
3. ひ孫のレポートを自分の観察と統合して返す

## 設計上の注意点

- このスキルは呼び出し元の会話履歴を引き継ぎません（context:fork の性質）
- 孫は `fork-great-grandchild` をさらに呼ぶことが期待されている
- 孫→ひ孫起動は**Skill経由の再帰的チェーン**の4層目検証
