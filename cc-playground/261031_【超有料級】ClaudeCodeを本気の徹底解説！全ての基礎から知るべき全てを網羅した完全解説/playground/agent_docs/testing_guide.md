# テストガイド

テストの書き方と実行方法。

## テスト戦略

1. **ユニットテスト**: 個別の関数・コンポーネント
2. **統合テスト**: モジュール間の連携
3. **E2Eテスト**: ユーザーフロー全体

## テスト実行

```bash
# 全テスト実行
npm test

# 特定ファイルのみ
npm test -- path/to/test.spec.ts

# ウォッチモード
npm test -- --watch

# カバレッジ付き
npm test -- --coverage
```

## テストの書き方

```typescript
describe('機能名', () => {
  it('期待する動作の説明', () => {
    // Arrange: 準備
    const input = 'test';

    // Act: 実行
    const result = myFunction(input);

    // Assert: 検証
    expect(result).toBe('expected');
  });
});
```

## TDD フロー

1. Red: 失敗するテストを書く
2. Green: テストを通す最小限のコード
3. Refactor: コードを改善
