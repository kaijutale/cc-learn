---
feature: invoke-and-deterministic-solution
session: 未設定
date: 2026-04-19 11:25:27
---

# skill の invoke 概念と「決定論的ソリューション」の理解

## 概要

前日の `2026-04-18_skill-bang-command-firing.md`（`!<command>` の発火タイミング実測）を踏まえ、note記事の表現「スキル読み込み時に確実にシェルコマンドが実行されます」「決定論的ソリューション」が何を意味するかを概念レベルで整理した学習セッション。実測で得た事実を、一般化された用語体系に接続する段階。

## 実装内容

### 1. 「読み込み時」と「invoke時」の翻訳揺れ確認

note記事の日本語「読み込み時」= 技術用語の「invoke時」であることを、同記事内の言い換え「スキル呼出と同時に必ずコマンドが走る」を根拠に確定。英語docsの技術用語 `load`（session起動時のdescription提示段階）とは**別物**。ここは直訳関係の罠になりやすい。

### 2. 「読み込み」の2層構造整理

| 層 | 英語docs | 発生タイミング | `!<command>` 発火 |
|---|---|---|---|
| A | **Session load** | Claude Code起動時 | ❌ |
| B | **Invoke load** | Skill tool 呼び出し時 | ✅ |

note記事の「読み込み時」= **Layer B** のみ。

### 3. Layer B（invoke）を引き起こす4トリガーの分類

1. **人間手動 明示invoke**: `/skill-name`, `@"skill-name"` → 100%決定論
2. **人間手動 自然言語誘発**: 「XXして」で Claude が該当skillを呼ぶ → 決定論
3. **Claude 自律invoke**: description triggerマッチで Claude が判断して呼ぶ → **モデル気まぐれの余地あり**
4. **エージェント経由invoke**: sub-agent から skill invoke → 1-3の入れ子

### 4. 「決定論的（deterministic）」の定義確認

- **CS一般用語**: 同じ入力に対し常に同じ出力・同じ挙動を示す性質
- **対義語**: 非決定論的（probabilistic / non-deterministic）= LLM出力はこちら側
- **「決定論的ソリューション」**: LLMの非決定論性を迂回して「必ず実行される保証のある処理」を設計に組み込む手法。Hooks、`!<command>`、system prompt注入などが該当

### 5. `!<command>` が「決定論的」と評価される構造

```
[1. invoke発生]  ← 人間 or Claude がトリガー（モデル判断あり得る）
       ↓
[2. !<command>発火]  ← ★ここがハーネス強制実行★ = 決定論的
       ↓
[3. Claude がbody読み取り作業]  ← モデル判断（非決定論）
```

記事が「決定論的」と言っているのはステップ2だけ。**invokeが起きるかどうか自体の保証ではなく、invokeした後の発火の保証**。

## 設計意図

- **実測→概念化の順序**: 前日ログで「invoke時に発火」を実測で確定させた上で、今日は一般化された用語（決定論的/非決定論的）に接続。事実→抽象化の積み上げ方を習慣化する
- **翻訳揺れの明示的記録**: 日本語「読み込み時」と英語docsの `load` が意味的にズレる箇所を明記。将来の自分が同じ混乱をしないための予防線
- **トリガー分類による決定論境界の可視化**: 「invokeの4トリガー」を整理することで、**モデル判断が介在するのはinvoke発生段階のみ**で、その後の `!<command>` 発火は100%保証されることを構造的に理解
- **『LLMに判断させない設計』という思想の吸収**: 決定論的ソリューションは個別機能ではなく、LLMエージェント設計における**大きな設計思想の一部**。`!<command>` はその一例として位置づけ

## 副作用

特になし（概念整理セッション、コード変更なし）。ただし以下の未消化論点が残存：

- Hooks方式との厳密な比較: note記事は Hooks を「モデル依存」と書いているが、Hooks自体はeventでハーネス発火するはず。この評価の妥当性は別途検証が必要
- 自律invoke（トリガー#3）の発生確率: Claudeがどれくらい確実にdescriptionマッチで skill を invoke するか、実測値は未確認

## 関連ファイル

- `.docs/templates/2026-04-18_skill-bang-command-firing.md` — 前日の実測実験ログ（本ログの前提事実を提供）
- `.docs/templates/2026-04-18_claude-code-input-modes.md` — bash mode（ユーザー入力側の `!`）ログ、skill内の `!<command>` と混同しないための参照
- 参考: `.docs/references/pdf/screencapture-note-masa-wunder-n-n437340205161-2026-04-17-18_46_39.pdf` — プロジェクト主参照資料、note記事の出典
