# 実装ログ: Anthropic Changelog Monitor ハーネス構築

## 概要

まさおさん（@未経験からプロまでAI活用）のnote記事「Claude Codeが静かに開けた『パンドラの箱』を、あなたは知っているか」の「実践ユースケース：ニュースキュレーションから完全自動化まで」セクションを参考に、Claude Agent SDKを使ったローカルエージェント（ハーネス）を構築した。

記事のニュースキュレーションをそのまま再現するのではなく、**Anthropic Changelog監視・差分レポート**という独自のユースケースで設計思想を実践した。

## 記事の核心思想

> 「決定論的なプログラムの中に、非決定論的なAIエージェントを閉じ込める。暴れん坊のケルベロスを、手綱で制御するハーネス。」

この思想を、以下の設計に落とし込んだ:

```
[決定論的] cron起動 → Webフェッチ → 差分検出
                                    ↓ 差分あり？
                            [非決定論的] AI要約＋影響分析（Agent SDK）
                                    ↓
[決定論的] Markdownレポート保存
```

## 技術スタック

| 項目 | 選定 |
|------|------|
| 言語 | TypeScript |
| AI SDK | @anthropic-ai/claude-agent-sdk |
| HTMLパース | cheerio |
| スケジューラ | node-cron |
| パッケージマネージャ | pnpm |

## ファイル構成

```
anthropic-changelog-monitor/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # メインエントリポイント（cron + オーケストレーション）
│   ├── fetcher.ts         # [決定論的] Webページ取得
│   ├── differ.ts          # [決定論的] 差分検出・スナップショット管理
│   ├── analyzer.ts        # [非決定論的] AI分析（Agent SDK query関数）
│   └── reporter.ts        # [決定論的] Markdownレポート保存
├── data/
│   └── snapshots/         # 前回のスナップショット保存
└── reports/               # 生成されたMDレポート
```

## 設計の要点

### 1. 決定論的と非決定論的の分離

- **決定論的モジュール（4つ）**: fetcher, differ, reporter, index（オーケストレーション）
- **非決定論的モジュール（1つ）**: analyzerのみ
- AIが介入するのは全体の1/5だけ。残りは純粋なプログラムで制御

### 2. AIの制御（ハーネスの手綱）

```typescript
// analyzer.ts の query呼び出し
for await (const message of query({
  prompt,  // 決定論的に構築されたプロンプト
  options: {
    maxTurns: 1,                              // 行動回数を制限
    allowedTools: [],                          // ツール使用禁止
    permissionMode: "bypassPermissions",       // 自動実行対応
    allowDangerouslySkipPermissions: true,
  },
}))
```

- `maxTurns: 1`: AIの行動を1ターンに制限
- `allowedTools: []`: ツール使用を一切許可しない（テキスト生成のみ）
- `permissionMode: "bypassPermissions"`: cron実行時の許可プロンプトを回避

### 3. コスト最適化

- 差分がなければAI分析はスキップ（コスト0）
- 2回目以降の実行で変更がなければ2秒で完了（AI呼び出しゼロ）
- 記事の「最小限のAIコストで最大の効果を実現」を体現

## 動作確認結果

### 初回実行（スナップショットなし）
- 2ページフェッチ成功
- 2件の初回スナップショット保存
- AI分析2件実行（合計コスト: 約$0.14）
- Markdownレポート自動生成
- 所要時間: 81.8秒

### 2回目実行（変更なし）
- 2ページフェッチ成功
- 差分検出: 0件の変更
- AI分析: **スキップ（コスト0）**
- レポート: 生成なし
- 所要時間: **2.1秒**

## 学び

1. **Agent SDKのquery関数**はシンプルだが強力。`for await` でストリーミング処理でき、`message.type` で結果を分岐するパターンが基本
2. **maxTurnsとallowedToolsが「手綱」**。AIの自由度を適切に制限することで、予測可能な動作を実現
3. **決定論的処理を先に配置する設計**が重要。差分検出を先にやることで、不要なAI呼び出しを完全に排除
4. **ローカル認証のコストメリット**は大きい。Claude MAXサブスクリプションの範囲内で、追加課金なしでエージェントを運用可能

## 実行方法

```bash
cd anthropic-changelog-monitor

# 手動で1回実行
pnpm run run-once

# cronスケジューラ起動（毎朝7時に自動実行）
pnpm start

# 開発モード（tsx使用、ビルド不要）
pnpm run dev
```
