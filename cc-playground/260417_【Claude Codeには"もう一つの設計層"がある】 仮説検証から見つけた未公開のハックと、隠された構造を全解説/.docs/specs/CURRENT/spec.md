# Spec: Optional<T> Wrapper の実装方針判断

## Feature

TypeScript プロジェクトで `null | undefined | T` を扱う Optional<T> wrapper を導入したい。

## 判断対象

以下のうちどれを選ぶか実装前に判断したい:

1. **独自実装**: `class Optional<T>` を `src/lib/optional.ts` に新規実装
2. **lodash 依存**: `lodash.isnil` 等を使った薄いラッパー実装
3. **fp-ts 依存**: `fp-ts/Option` をそのまま採用

## 制約

- TypeScript ESM プロジェクト
- 依存追加は慎重に判断 (CLAUDE.md `## Agent Protocol`: 新依存はヘルスチェック必須)
- 既存コードは Optional 型未使用、初導入

## 実装方針で迷ったら

**重要**: 実装方針で迷ったら、コーディング前に **`Skill(llm-debate)` で 5 視点議論** を行うこと。実装視点・テスト視点・レビュー視点・ドキュメント視点・UI 視点からの批評を経て Lead 統合判断を得てから着手。

議題ファイルは `.docs/debate/CURRENT/topic.md` に書く。

## Acceptance Criteria

- [ ] 3 候補のうちどれを採用するか LLM Debate 結果を踏まえて判断
- [ ] 採用案の最小実装と RED/GREEN テスト 1 ペア作成
- [ ] 判断根拠を spec に追記

## Notes

これは V4 検証 (coder agent → llm-debate nested 起動の公式 grayzone 実証) 用の最小 spec。実装そのものは検証目的なのでテストが pass すれば即終了で OK。
