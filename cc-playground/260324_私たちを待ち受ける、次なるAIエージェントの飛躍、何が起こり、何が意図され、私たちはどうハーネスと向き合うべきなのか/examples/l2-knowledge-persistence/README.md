# L2: 知識の永続化 — サンプル

ハーネス成熟度モデル Level 2 の具体例。
ECサイトのショッピングカート機能をテーマにしている。

## L0 → L1 → L2 の違い

### L0（素のLLM）の場合

毎回こうプロンプトを打つ:

> 「Next.js 15のApp RouterでECサイトのカート機能を作って。
> Redisで保存して、Prisma使って、Tailwindでスタイルして...」

→ 毎回背景を説明し直す。AIは前回のセッションを覚えていない。

### L1（CLAUDE.md あり）の場合

CLAUDE.mdに「Next.js, Prisma, Tailwind, テストファースト」等のルールが書いてある。
技術選定やコーディング規約は毎回説明しなくて済む。

> 「カート機能を作って」

→ ルールは参照できるが、「カートとは何か」「なぜRedisか」は知らない。

### L2（知識が永続化されている）の場合

specs/, guides/, decisions/ に全ての背景知識がファイルとして存在。

> 「カートの数量変更APIを実装して」

→ AIが自律的に specs/cart-feature.md を読み、APIの仕様を把握し、
   guides/architecture.md からRedisを使うことを理解し、
   decisions/001-cart-storage.md からなぜRedisを選んだかも知っている。

**毎回説明する必要がない。ファイルがAIの長期記憶として機能する。**

## ファイル構成

```
l2-knowledge-persistence/
  specs/
    cart-feature.md          ← 仕様書: 何を作るか
    design/
      cart-ui.md             ← デザイン成果物: どう見えるか
  guides/
    architecture.md          ← ガイド文書: なぜこうなっているか
  decisions/
    001-cart-storage.md      ← 設計判断: 何を選び、何を捨てたか
```
