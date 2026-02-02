# コーディング規約

このプロジェクトで従うべきコーディング規約。

## 一般原則

- シンプルさを優先する
- 過剰な抽象化を避ける
- コメントは「なぜ」を説明する（「何を」ではなく）

## TypeScript/JavaScript

- `const` を優先、必要な場合のみ `let`
- `var` は使用禁止
- 関数は arrow function を基本とする
- 型は明示的に定義（`any` は避ける）

## ファイル命名

- コンポーネント: `PascalCase.tsx`
- ユーティリティ: `camelCase.ts`
- 定数ファイル: `SCREAMING_SNAKE_CASE.ts`

## コミットメッセージ

Conventional Commits 形式を使用：
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `refactor`: リファクタリング
- `test`: テスト追加/修正
