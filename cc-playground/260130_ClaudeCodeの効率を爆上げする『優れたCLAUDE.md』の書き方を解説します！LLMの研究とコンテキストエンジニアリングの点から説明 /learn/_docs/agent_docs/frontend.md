# フロントエンド実装ガイド

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand
- **フォーム**: React Hook Form + Zod
- **テスト**: Vitest + Testing Library

## ディレクトリ構造

```
src/
├── app/           # App Router のルート
├── components/    # 共通コンポーネント
│   ├── ui/        # 基本UIコンポーネント（Button, Input等）
│   └── features/  # 機能別コンポーネント
├── hooks/         # カスタムフック
├── lib/           # ユーティリティ関数
├── stores/        # Zustand ストア
└── types/         # 型定義
```

## コンポーネント設計原則

### 1. Server Components を優先

- デフォルトで Server Component として作成
- クライアント操作が必要な場合のみ `'use client'` を追加
- 参照: `src/components/ui/Button.tsx:1-25`

### 2. コンポーネントの命名規則

- PascalCase を使用（例: `UserProfile.tsx`）
- 1ファイル1コンポーネント
- index.ts での再エクスポート禁止

### 3. Props の型定義

```typescript
// Good: 明示的な型定義
type ButtonProps = {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

// Bad: any や過度な省略
```

## スタイリング規約

- インラインスタイル禁止
- Tailwind のユーティリティクラスを使用
- 複雑なスタイルは `cn()` ヘルパーで結合
- 参照: `src/lib/utils.ts:5-10`

## テスト方針

- コンポーネントには必ずユニットテストを作成
- テストファイルは `__tests__/` ディレクトリに配置
- 命名規則: `ComponentName.test.tsx`
