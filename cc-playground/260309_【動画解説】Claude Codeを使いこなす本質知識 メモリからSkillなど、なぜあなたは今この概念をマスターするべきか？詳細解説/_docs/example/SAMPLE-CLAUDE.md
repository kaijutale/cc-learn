# 開発ガイドライン & アーキテクチャ

## 1. 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **DB/Auth**: Supabase
- **ORM**: Drizzle ORM
- **State**: Server Component主体 (必要な箇所のみClient Component)
- **Testing**: Vitest

## 2. ディレクトリ構成マップ

迷ったらここを見てファイルを配置してください。

```
.docs/                          # ドキュメント・仕様書
│   ├── api/                    # API仕様書
│   ├── design-mock/            # デザインモック (HTML/CSS)
│   ├── ...
│   └── knowledge/              # 開発ナレッジ
│
src/
├── actions/                    # ★ 共通Server Actions (認証、カート等)
├── app/                        # ルーティングとページのエントリーポイント
│   ├── (public)/               # ★ 一般公開ページ (LP, 記事詳細など)
│   │   └── [slug]/actions.ts   # ★ ページ固有のServer Actions (コロケーション)
│   ├── admin/                  # ★ 管理者用ページ (認証必須)
│   ├── api/                    # Route Handlers (薄いラッパー、ロジックはservicesへ)
│   ├── debug/                  # デバッグ用ページ
│   ├── layout.tsx              # 全体レイアウト (Providers, Global Header)
│   └── page.tsx                # (使用せず (public)/page.tsx にリダイレクト等を検討)
│
├── components/                 # UIコンポーネント
│   ├── ui/                     # ★ shadcn/ui のプリミティブ (Button, Input等) - 原則変更しない
│   ├── common/                 # アプリ全体で使う汎用コンポーネント (Avatar, CustomButton等)
│   ├── layout/                 # ヘッダー、フッター、サイドバーなど構造部品
│   └── [feature]/              # (必要に応じて) 特定機能専用のコンポーネント群
│
├── db/                         # データベース関連
│   ├── schema.ts               # Drizzleスキーマ定義
│   └── index.ts                # DB接続クライアント
│
├── lib/                        # ビジネスロジック・型定義・定数
│   ├── services/               # ★ ビジネスロジック (テスト対象、*.test.ts も同梱)
│   ├── validations/            # Zodスキーマ (フォームバリデーション等)
│   ├── utils.ts                # 汎用ユーティリティ (cn関数等)
│   └── db-errors.ts            # エラーハンドリング
│
├── utils/                      # インフラ・外部サービス接続
│   └── supabase/               # Supabase接続設定 (client/server/middleware)
│
└── styles/                     # グローバルスタイル
```

## 実装ルール & パターン

### コンポーネント設計 (RSC vs Client Component)

**「データはサーバー、動きはクライアント」** を徹底します。

| 種類             | 役割                       | ファイル拡張子/宣言             | データの受け取り方             |
| :--------------- | :------------------------- | :------------------------------ | :----------------------------- |
| **Page (RSC)**   | データ取得、メタデータ定義 | `.tsx` + `import "server-only"` | `await db.query...` (直接取得) |
| **Layout (RSC)** | 共通データ取得(User情報等) | `.tsx` (default)                | `await supabase...` (直接取得) |
| **Feature (CC)** | UI表示、イベントハンドラ   | `"use client"`                  | Propsとして親から受け取る      |

#### ✅ 推奨実装パターン

**1. 共通データ（ヘッダーのユーザー情報など）**
`layout.tsx` で取得し、Propsで渡す。

```tsx
// layout.tsx
export default async function RootLayout({ children }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (
    <>
      <Header user={user} /> {/* Client Component */}
      {children}
    </>
  );
}
```

**2. ページ固有データ**
`page.tsx` (RSC) はデータ取得に専念し、UI実装は `components/{feature}/{feature}-page.tsx` (CC) に委譲する。

```tsx
// app/(public)/page.tsx
import "server-only";
import { TopPageContent } from "@/components/top/top-page-content"; // CC

export default async function Page() {
  const articles = await db.query.articles.findMany(); // 直接DBアクセス
  return <TopPageContent initialArticles={articles} />;
}
```

## 新規機能開発フロー

1. **Schema (`src/db/schema.ts`)**: DB定義が必要なら最初に追加・migrate。
2. **Validations (`src/lib/validations`)**: 入力データのZodスキーマを定義。
3. **Services (`src/lib/services`)**: ビジネスロジックを実装。
4. **Page (`src/app/...`)**: ルートを作成し、必要なデータをRSCで取得。
5. **Components (`src/components`)**: UIを実装し、Pageから呼び出す。

## 詳細のドキュメント

詳細ドキュメントは以下を参考にしてください

テストガイド: [.docs/spec/test-guide.md](.docs/spec/test-guide.md)
Next.jsガイド: [.docs/spec/nextjs.md](.docs/spec/nextjs.md)
