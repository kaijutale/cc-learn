# Feature: formatRelativeTime

2 つの成果物を同時に実装する:

1. **`src/lib/formatRelativeTime.ts`** — ピュアユーティリティ関数 (過去時刻を自然言語の相対時間に変換)
2. **`src/components/RelativeTime.tsx`** — React コンポーネント (1. の関数を `<time>` 要素でラップ)

## 1. Function: formatRelativeTime

### Signature

```typescript
// src/lib/formatRelativeTime.ts
export function formatRelativeTime(
  input: Date | number,
  now?: Date | number
): string;
```

- `input`: 対象時刻 (Date オブジェクトまたは Unix ミリ秒)
- `now`: 基準時刻 (省略時は `Date.now()` を使う、テスト時は明示的に渡すこと)

### Requirements

入力時刻と基準時刻の**差分 (基準 - 対象、秒単位)** に応じて、以下の文字列を返す。

| 差分の範囲 | 出力 |
|---|---|
| 差分 < 5 秒 | `"just now"` |
| 5 秒以上 60 秒未満 | `"N seconds ago"` (整数) |
| 60 秒以上 3600 秒未満 | `"N minutes ago"` (整数、60 で割って切り捨て)、1 分なら `"1 minute ago"` (単数) |
| 3600 秒以上 86400 秒未満 | `"N hours ago"`、1 時間なら `"1 hour ago"` (単数) |
| 86400 秒以上 604800 秒未満 (7 日) | `"N days ago"`、1 日なら `"1 day ago"` (単数) |
| 604800 秒以上 2592000 秒未満 (30 日) | `"N weeks ago"`、1 週なら `"1 week ago"` (単数) |
| 2592000 秒以上 31536000 秒未満 (365 日) | `"N months ago"`、1 ヶ月なら `"1 month ago"` (単数) |
| 31536000 秒以上 | `"N years ago"`、1 年なら `"1 year ago"` (単数) |

### 未来時刻 (差分 < 0) の扱い

- `"in N seconds"` / `"in N minutes"` / `"in N hours"` / `"in N days"` / `"in N weeks"` / `"in N months"` / `"in N years"` を対応単位で返す
- 未来側も単複対応 (`"in 1 minute"` / `"in 2 minutes"`)
- 差分 > -5 秒 (超直近未来) は `"just now"` を返す

### エラー系

- `input` が `Date | number` 以外 (null / undefined / string / object など) → `TypeError` を投げる
- `input` が無効な Date (`new Date("invalid")`) → `RangeError` を投げる
- `now` が指定されていて無効な型 → `TypeError` を投げる

### Acceptance Criteria (formatRelativeTime)

#### 正常系 (過去)

- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-23T10:00:03Z"))` → `"just now"` (3 秒差)
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-23T10:00:30Z"))` → `"30 seconds ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-23T10:01:00Z"))` → `"1 minute ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-23T10:05:00Z"))` → `"5 minutes ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-23T11:00:00Z"))` → `"1 hour ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-24T10:00:00Z"))` → `"1 day ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-04-30T10:00:00Z"))` → `"1 week ago"`
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2026-05-23T10:00:00Z"))` → `"1 month ago"` (30 日)
- `formatRelativeTime(new Date("2026-04-23T10:00:00Z"), new Date("2027-04-23T10:00:00Z"))` → `"1 year ago"` (365 日)

#### 正常系 (未来)

- `formatRelativeTime(new Date("2026-04-23T10:05:00Z"), new Date("2026-04-23T10:00:00Z"))` → `"in 5 minutes"`
- `formatRelativeTime(new Date("2026-04-24T10:00:00Z"), new Date("2026-04-23T10:00:00Z"))` → `"in 1 day"`

#### 境界値

- 差分 4 秒 → `"just now"`, 差分 5 秒 → `"5 seconds ago"`
- 差分 59 秒 → `"59 seconds ago"`, 差分 60 秒 → `"1 minute ago"`
- 差分 3599 秒 → `"59 minutes ago"`, 差分 3600 秒 → `"1 hour ago"`
- 差分 86399 秒 → `"23 hours ago"`, 差分 86400 秒 → `"1 day ago"`

#### エッジケース

- number 入力: `formatRelativeTime(1713859200000, 1713859230000)` → `"30 seconds ago"` (両方 Unix ms)
- Date と number の混在: 入力型の組み合わせに関わらず動く
- 基準省略: `formatRelativeTime(new Date(Date.now() - 3000))` → `"just now"` (`now` 未指定時は現在時刻)

#### エラー系

- `formatRelativeTime(null as unknown as Date)` → `TypeError`
- `formatRelativeTime(undefined as unknown as Date)` → `TypeError`
- `formatRelativeTime("2026-04-23" as unknown as Date)` → `TypeError` (string は受け付けない)
- `formatRelativeTime({} as unknown as Date)` → `TypeError`
- `formatRelativeTime(new Date("invalid"))` → `RangeError`

## 2. Component: RelativeTime

### Signature

```tsx
// src/components/RelativeTime.tsx
import type { FC } from "react";

export interface RelativeTimeProps {
  date: Date | number;
  now?: Date | number;
  className?: string;
}

export const RelativeTime: FC<RelativeTimeProps>;
```

### Requirements

- 内部で `formatRelativeTime(date, now)` を呼び、結果を `<time>` 要素の children に設定
- `<time dateTime={ISO8601}>` 属性を必ず付与 (date を ISO 8601 文字列化)
- `className` prop があれば `<time>` に付与
- `date` が number なら `new Date(date).toISOString()` で dateTime 属性を構築
- エラー系 (無効な date) は `formatRelativeTime` 側が throw するので、呼出側が catch する責務 (コンポーネント内では catch しない)

### Acceptance Criteria (RelativeTime component)

#### 正常系 (RTL 使用)

- `render(<RelativeTime date={new Date("2026-04-23T10:00:00Z")} now={new Date("2026-04-23T10:05:00Z")} />)` → DOM に `<time dateTime="2026-04-23T10:00:00.000Z">5 minutes ago</time>` が描画される
- `screen.getByText("5 minutes ago")` で取得できる
- `screen.getByRole("time")` で取得できる (※ `<time>` 要素は暗黙の role を持たないので `container.querySelector("time")` または `getByText` で検証)

#### className 付与

- `render(<RelativeTime date={...} now={...} className="text-sm" />)` → 描画された `<time>` 要素に `class="text-sm"` が付与される

#### dateTime 属性

- number 入力: `<RelativeTime date={1713859200000} now={...} />` → `dateTime="2024-04-23T..."` が付与される (Unix ms → ISO 8601 変換)

## 禁止事項

- 外部パッケージ (date-fns / dayjs / luxon / moment 等) の追加**禁止**。既存の React / Next.js / Vitest / @testing-library/* のみで実装
- `Intl.RelativeTimeFormat` の使用禁止 (単純な計算ロジックで実装することが要件)
- テストファイルの変更禁止 (TDD red phase で確定後)
- spec.md の書き換え禁止

## 実装ヒント

- 差分計算: `Math.floor((now - input) / 1000)` で秒差分
- 単複判定: `count === 1 ? unit : unit + "s"`
- 未来判定: `diff < 0` (符号で分岐)
- 無効 Date 判定: `isNaN(date.getTime())`
- 型判定: `input instanceof Date` or `typeof input === "number"`
