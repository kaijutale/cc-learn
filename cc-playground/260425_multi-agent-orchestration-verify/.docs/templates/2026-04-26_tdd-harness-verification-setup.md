---
feature: tdd-harness-verification-setup
session: 汎用化検証 (note出典削除後の破壊的変更検証)
date: 2026-04-26 07:17:38
---

# TDD ハーネス動的検証環境セットアップ

## 概要

ハーネス (`~/.claude/skills/` + `~/.claude/agents/` 配下の TDD系9ファイル) の note記事出典依存を削除する汎用化作業を完了した後、破壊的変更がないかを検証するための動的 TDD サイクル検証環境を本ディレクトリに scaffold した。

Phase 1-5 (静的構文 / 意味論 / 横断整合 / 独立レビュー / 軽量動的) は本セッション (cwd=`~/.claude/`) で完了済。**Phase 6-2 動的TDDサイクル検証** は作業ディレクトリ制約のため別セッション要であり、本ディレクトリでの実行を待つ状態。

関連リソース:
- 検証 plan: `~/.claude/plans/archived/pdf-claude-references-pdf-dapper-gosling-verify.md` (status: completed)
- 検証レポート: `~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md` (verdict_after_fix: Approve)
- 出典集約: `~/.claude/references/BIBLIOGRAPHY.md`

## 実装内容

### プロジェクト初期化
- `pnpm init` で `package.json` 生成
- `package.json` の `scripts.test` を `vitest run --reporter=verbose` に設定

### 依存追加 (devDependencies)
- typescript ^6.0.3
- vitest ^4.1.5
- @types/node ^25.6.0
- tsx ^4.21.0
- jsdom ^29.0.2

### ディレクトリ構造
```
260425_multi-agent-orchestration-verify/
├── package.json              # pnpm init 生成、test script = vitest
├── tsconfig.json             # TypeScript 最小設定 (ES2022/strict/@alias)
├── .docs/
│   ├── specs/CURRENT/spec.md # 検証用 add 関数 spec
│   └── templates/            # 本実装ログ保存先
└── src/lib/                  # 実装配置先 (scaffold時点では空)
```

### tsconfig.json
- target: ES2022 / module: ESNext / moduleResolution: bundler
- strict: true / esModuleInterop: true / skipLibCheck: true
- jsx: preserve / paths alias: `@/*` → `./src/*`

### 検証用 spec (`.docs/specs/CURRENT/spec.md`)
Feature: add 関数
- `add(a: number, b: number): number` を `src/lib/math.ts` に実装
- 整数加算・負数対応
- null/undefined → TypeError
- NaN/Infinity → TypeError (Number.isFinite チェック)
- 境界値: `Number.MAX_SAFE_INTEGER` 超過時 TypeError

## 設計意図

### 最小 TypeScript + Vitest 構成を選択した理由
- 検証目的は「skill / agent が機能するか」であり、Next.js 機能のテストではない
- 最小構成で fork skills の !構文 (`find src ... .test.ts` / `cat package.json` / `cat tsconfig.json` 等) の動作確認が可能
- Next.js フルセット scaffold (`pnpm create next-app`) は時間・複雑度のオーバーヘッドが過剰

### add 関数 spec を選んだ理由
- 最小スコープで TDD 全フェーズが回せる:
  - RED: 4カテゴリ列挙 (正常系/境界値/エッジ/エラー系) を試せる
  - GREEN: 最小実装が数行で済む
  - VERIFY: PASS/FAIL 独立判定の挙動確認
  - 調整ループ: 意図的に spec を曖昧にすればズレも観測可能 (最大3周制限の検証)
- 境界値・エラー系を spec が明示しているため、red-test-fork のケース列挙ロジック検証に適する

### 動的検証実行手順 (本ディレクトリで Claude Code 起動後)
```
Agent(
  subagent_type="coder",
  description="add 関数 TDDサイクル検証",
  prompt="""
Feature: add-function
Spec: .docs/specs/CURRENT/spec.md

TDD サイクル (RED → GREEN → 調整ループ最大3周) を完走させてください。
fork skills が SKILL.md 読込時の !構文で spec/ソース/テスト/package.json を自動展開します。
"""
)
```

### 11 チェック項目 (Phase 6-3 動作確認)
1. coder agent 起動 (subagent_type 認識)
2. coder が Skill ツールで red-test-fork 呼出
3. red-test-fork の !構文展開 (spec/ソース/テスト/package.json が team-tester に注入)
4. team-tester が context:fork で起動 (会話履歴非引継)
5. team-tester が RED テスト作成 (All RED ✅)
6. coder が implement-fork 呼出
7. team-implementer が最小実装 (Self-verify GREEN)
8. coder が verify-test-fork 呼出 (別 team-tester フレッシュ起動)
9. verify-test-fork が独立判定
10. (失敗時) coder が Edit/Write で局所修正・再 verify (3周以内)
11. 最終出力 `[Coder Cycle Complete] Final result: GREEN ✅`

## 副作用

- 検証完了後、本ディレクトリは削除可能 (検証用一時環境)
- `node_modules/` は git 管理外想定
- 動的検証で追加 finding 発見時は `~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md` の「修正後 残課題」セクションに追記
- ハーネス側 settings.json の `skipAutoPermissionPrompt` が true だと subagent context で !構文 allow 外コマンドが block される。false または未設定を維持

## 関連ファイル

- `package.json` — pnpm init 生成、scripts.test = `vitest run --reporter=verbose`
- `tsconfig.json` — TypeScript 最小設定
- `.docs/specs/CURRENT/spec.md` — add 関数 spec (Acceptance Criteria + 境界値)
- `src/lib/` — 実装配置先 (scaffold時点では空、Phase 6-2 で TDD サイクルが埋める)
- `~/.claude/.docs/knowledge/verify-purge-note-masao/2026-04-25-verification-result.md` — 静的検証結果 + H1-H4 + M1-M2 + L1-L2 + F 修正実施記録
- `~/.claude/plans/archived/pdf-claude-references-pdf-dapper-gosling-verify.md` — 検証 plan (7-phase 構造)
- `~/.claude/references/BIBLIOGRAPHY.md` — note記事出典の中央集約 (skill/agent本文からは参照しない)
- `~/.claude/skills/{red,implement,verify}-test-fork/SKILL.md` — fork skills (!構文 + context:fork)
- `~/.claude/agents/{coder,team-tester,team-implementer}.md` — エージェント定義
