---
date: 2026-05-06 07:08:41
type: work
topic: essence-docs-v1-creation
session: 本質ドキュメントv1作成セッション

related_article: ~/.claude/references/note-articles/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf
related_skill: [logging]
---

# 本質ドキュメント v1 を `~/.claude/.docs/essence/` に新設

> note記事「【AIエージェントにメタ認知を与える】ハーネス&AIエージェントの本質勉強会」で示された "本質ドキュメント" 概念を、グローバル設定配下に v1 として実装。README + 3領域 essentials を作成。

## 概要

note記事で言及される「本質ドキュメント」が、`~/.claude/CLAUDE.md` のことかという質問から始まり、PDF を通読して両者が別物であることを確認。`~/.claude/.docs/essence/` ディレクトリを新設し、3領域 (ハーネス設計 / スキル設計 / UIデザイン) の v1 essentials を作成した。動画制作領域はかもね指示により除外。

「本質ドキュメント」の定義 (PDFより): 数学の公式のように不変で、誰が見ても「そうだ」と認められる原理原則。レビューアエージェントが評価軸として参照する。プロジェクトアイデンティティ (固有のルール・ブランド) とは厳密に分離する。

## 内容

### 配置場所の決定プロセス

最初に提案した `~/.claude/essentials/` は不採用。かもねが `~/.claude/.docs/essence/` を提案し、こちらを採用。理由は3点:

1. プロジェクト側の `.docs/` 規約 (knowledge/logs/plans/prompts) と対称構造を取れる
2. 単数形 `essence` (カテゴリ) + 複数形 `essentials` (内容) の言語的階層が自然
3. `essentials/agent-essentials.md` のパス重複を回避

私の事前確認では `~/.claude/.docs/` の存在を見落としていた (`ls -1` のデフォルト挙動で隠しディレクトリ非表示)。`ls -la` で確認すべきだった。

### 作成物

```
~/.claude/.docs/essence/
├── README.md                    79行  4.5KB
├── agent-essentials.md         170行  11.3KB  (8原則)
├── skill-essentials.md         172行  11.3KB  (8原則)
└── ui-essentials.md            173行  12.3KB  (8原則)
```

各 essentials は以下の構造:
- 出典セクション (note記事URL + ローカルPDFパスをネスト構造で配置)
- 8原則 (ステートメント / 根拠 / 評価チェック / 出典)
- 「本質ではない例」 (プロジェクトアイデンティティ側との線引き)
- 改訂履歴 + 育て方

### 各領域の8原則の核

**agent-essentials.md (ハーネス設計)**:
1. コンテキストウィンドウは有限資源
2. 関心ごとの分離
3. 記憶の外部化
4. 制約が品質を生む
5. 決定論的制御の優位性
6. Human-in-the-Loop の必須性
7. レビューアと実装者の分離
8. メタレベルの再帰構造

**skill-essentials.md (スキル設計)**:
1. Description はトリガー条件であり要約ではない
2. Skip the Obvious (Claude のデフォルトを揺さぶる)
3. Gotcha セクションは最高シグナル
4. Progressive Disclosure (段階的開示)
5. Don't Railroad (柔軟性を残す)
6. I/O 契約の明確化
7. 決定論的処理は scripts / hooks に逃がす
8. 上位レイヤーの本質ドキュメントとの整合

**ui-essentials.md (UIデザイン)**:
1. Distributional Convergence は不可避 (構造的に剥がす)
2. 抽象語は判断放棄、具体値で commit する
3. 中央値禁止 (5軸で極値を選ぶ)
4. 過去プロジェクトとの差分化 (記憶の外部化のUI応用)
5. アクセシビリティは原則であり装飾ではない
6. Bold commitment (中途半端は最悪の場所)
7. Dominant + sharp accent > timid even palettes
8. High-impact moments > scattered micro-animations

### 出典フォーマットの統一

3ファイル全てで以下のネスト構造に統一:

```markdown
## 出典

- 主出典 (note記事): [...](note URL) (まさお@未経験からプロまでAI活用, 2026-04-04)
  - 主出典 (ローカルPDF): `~/.claude/references/note-articles/260404_...pdf`
- 関連: <領域別の補助出典>
```

note記事を主出典として置き、ローカルPDFを子項目としてネスト。これによりレビューアエージェントが原典を辿るとき URL とローカルパスの両方を取得できる。

### README.md の3つの責務

単なる説明書ではなく、運用契約として3つの機能を兼ねる:

1. **目次**: 4ファイルの位置と用途を表で示す (video-essentials は将来余地として残してある形だが今回は作成せず)
2. **規約**: アンチパターン節 + PR駆動更新フロー + 絶対パス参照ルール
3. **出典**: 後で原典確認するための note URL + ローカルPDFパス

## 設計意図

### 「本質 vs プロジェクトアイデンティティ」の構造的分離

PDF p.8 が示す対比 (「視覚的階層を作ること」=本質 vs 「この配色を使う」=アイデンティティ) を essentials 各ファイルに「本質ではない例」セクションとして埋め込んだ。これにより:

- 半年後に新原則を追加する時、混入を構造的に防ぐガードになる
- 例えば ui-essentials の「Inter禁止」「紫グラデ禁止」は **時代と共に LLM の default が変わる** ため本質側ではなく アイデンティティ側に置いた

### 各原則間のクロスリファレンス

skill-essentials 原則2 (Skip the Obvious) は agent-essentials 原則1 (コンテキスト有限性) から導出される、と相互参照。原則8 (上位本質との整合) は skill レビュー軸そのものに「上位ドキュメント参照」を組み込んだ。これは PDF p.27-28 の「再帰構造の頂点」を essence/ 内部の依存グラフとして実装した形。

### v1 で意図的に止めたこと

- 9原則目以降の追加 (網羅性より精度を優先、PR駆動で育てる前提)
- video-essentials.md (かもね指示で除外)
- 各原則間のグラフ構造の明示化 (現状は文章中の参照のみ)
- `validate-essence.py` のような決定論的整合性検証スクリプト

### Sources of Authority (情報源の信頼度)

各原則の出典は以下の優先順で記録:
1. PDFページ番号 (一次出典、HITL検証可能)
2. 既存skill (`authoring-skills/`, `designing-beautiful-frontends/` 等、二次的だが運用実績あり)
3. Anthropic公式ブログ / best practices (公式情報)

## 副作用 / 観測した grayzone

### 1. Write tool の hook 干渉

README.md 初回 Write が「ファイル変更検知」エラーで失敗。空ファイル `mkdir` 後 → 私のRead時点(0行) → Write直前で他プロセスが空行追記 → 状態不一致。再Read → 再Write で解決。これは Claude Code の状態スナップショット保護の安全機構が働いた例。

### 2. かもね/linter による出典フォーマット自動補正

私のフラット形式 (`- 主出典: note記事 / - ローカルPDF: PDF`) を、かもね (またはlinter) が ネスト形式 (`- 主出典 (note記事): / - 主出典 (ローカルPDF):` ハイラルキー) に修正。さらに arXiv URL を `abs/` から `pdf/` に変更。これに合わせて他2ファイルを統一する追加作業が発生した。観測点: ユーザー編集と並行して書き出すワークフローでは、各ファイル間のフォーマット統一に追従修正が要る。

### 3. プロジェクトCLAUDE.mdとskill デフォルト挙動の衝突

skill `logging` は `.docs/logs/local/` を gitignored 前提で設計されているが、プロジェクトCLAUDE.md は「.docs/logs はGit管理対象、.gitignore には追加しない」と明示。今回はプロジェクト方針を優先し、gitignore チェック・追加を skip した。グローバルskill とプロジェクト規約の優先順位は **プロジェクトCLAUDE.md が上**。

### 4. 事前確認の甘さ

`~/.claude/essentials/` 提案時、`~/.claude/.docs/` の存在を見落とした。`ls -1` (デフォルト) で隠しディレクトリ非表示の挙動を失念。Critical Thinking 原則「不確実: コード読む→ダメなら選択肢付きで聞く」を踏み外した。次回類似タスクでは `ls -la` または `ls -A` を使う。

## 関連ファイル

- `~/.claude/.docs/essence/README.md` — essence/ ディレクトリ全体の規約・育て方・運用契約
- `~/.claude/.docs/essence/agent-essentials.md` — ハーネス設計の本質 v1.0 (8原則)
- `~/.claude/.docs/essence/skill-essentials.md` — スキル設計の本質 v1.0 (8原則)
- `~/.claude/.docs/essence/ui-essentials.md` — UIデザインの本質 v1.0 (8原則)
- `~/.claude/references/note-articles/260404_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会.pdf` — 主出典PDF (32ページ)
- `~/.claude/skills/authoring-skills/SKILL.md` — skill-essentials の主要ソース
- `~/.claude/skills/designing-beautiful-frontends/SKILL.md` — ui-essentials の主要ソース
- `~/.claude/skills/injecting-ui-aesthetic/SKILL.md` — ui-essentials 5軸の極値原則ソース
- `~/.claude/skills/judging-review-severity/SKILL.md` — レビュー基準の参考 (本質の断片)
- `~/.claude/skills/review-agent-essence/SKILL.md` — 関連度フィルタの考え方ソース
- 関連論文: [Meta-Harness: End-to-End Optimization of Model Harnesses](https://arxiv.org/pdf/2603.28052)
