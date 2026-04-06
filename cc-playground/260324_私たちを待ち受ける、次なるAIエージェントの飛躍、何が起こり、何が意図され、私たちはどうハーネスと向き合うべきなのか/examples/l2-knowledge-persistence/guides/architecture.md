# アーキテクチャガイド

## 技術スタック

- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Prisma (PostgreSQL)
- Redis (セッション・カートデータ)

## ディレクトリ構成

```
src/
  app/
    cart/
      page.tsx          -- カートページ（Server Component）
    api/
      cart/
        route.ts        -- GET /api/cart
        items/
          route.ts      -- POST /api/cart/items
          [id]/
            route.ts    -- PATCH, DELETE /api/cart/items/:id
  components/
    cart/
      CartItem.tsx      -- 個別アイテム（Client Component）
      CartSummary.tsx   -- 合計表示
  lib/
    cart-service.ts     -- カートのビジネスロジック
    redis.ts            -- Redis接続
```

## なぜRedisか

カートデータはDBではなくRedisに保存する。理由:
1. カートは一時的なデータ。注文確定まではDBに永続化する必要がない
2. 頻繁な更新（数量変更）に対してDBへの書き込みは重い
3. TTL設定で放置カートを自動削除できる（7日）
4. 注文確定時にRedis → PostgreSQLへ移行する

## Server Component vs Client Component の境界

- `CartPage` (page.tsx): Server Component。初期データをサーバーで取得
- `CartItem`: Client Component。数量変更のインタラクションがある
- `CartSummary`: Client Component。リアルタイムの合計金額更新

判断基準: ユーザー操作（クリック・入力）があるか否か。
