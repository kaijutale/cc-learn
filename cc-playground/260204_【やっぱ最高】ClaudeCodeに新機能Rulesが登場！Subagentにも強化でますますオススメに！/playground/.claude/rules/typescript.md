---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript コーディング規約

このルールは TypeScript ファイル編集時に自動適用される。

## 型安全性

- `any` 型の使用は禁止。やむを得ない場合は `unknown` を使用
- 関数の引数・戻り値には明示的な型アノテーションを付ける
- `as` によるキャストより型ガードを優先

## 命名規則

- 変数・関数: `camelCase`
- 型・インターフェース: `PascalCase`
- 定数: `UPPER_SNAKE_CASE`
- プライベートプロパティ: `_` プレフィックスは使わない

## インポート

- 相対パスは `./` または `../` から始める
- 型のみのインポートは `import type` を使用

## 例

```typescript
// Good
import type { User } from './types';

interface ApiResponse {
  data: User[];
  total: number;
}

function fetchUsers(limit: number): Promise<ApiResponse> {
  // ...
}

// Bad
import { User } from './types';  // 型のみなら import type を使う

function fetchUsers(limit): any {  // any禁止、型アノテーション必須
  // ...
}
```
