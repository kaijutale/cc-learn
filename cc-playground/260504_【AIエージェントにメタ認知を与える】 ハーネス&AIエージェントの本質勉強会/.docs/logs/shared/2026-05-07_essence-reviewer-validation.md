---
type: validation
date: 2026-05-07
created: 2026-05-07 04:50:54
title: 3 essence reviewer subagent 機能検証 (harness + skill 実証、ui skip)
related_plan: /Users/camone/.claude/plans/archived/2026-05-07_essence-reviewer-validation.md
related_logs:
  - 2026-05-07_essence-reviewer-implementation.md (本セッション前半: subagent 作成 + smoke test)
  - 2026-05-07_identity-scaffold-reviewer-plan.md (前セッション: plan 策定 + identity 試作)
status: completed
---

# essence reviewer subagent 機能検証ログ

## 検証目的

本セッション前半で 3 reviewer (harness/skill/ui-essentials-reviewer) を新規作成し smoke test (起動 + ファイル Read + 8原則認識) は完了した。しかし**reviewer 本来の機能** = 「評価対象を渡して原則適用マトリクス + severity 付き指摘 + 改善提案を構造通り返す」は未検証だった。「起動可否 → 機能成功」という過大一般化を避け、本plan (`steady-beaming-sun`) で実証した。

## 検証スコープ

| reviewer | 検証 | 評価対象 | 規模 |
|---|---|---|---|
| harness-essentials-reviewer | ✅ 実施 | `<PJ>/.docs/identity/harness-identity.md` | 86行 |
| skill-essentials-reviewer | ✅ 実施 | `~/.claude/skills/pickup/SKILL.md` | 22行 |
| ui-essentials-reviewer | ⏭ skip | (本 PJ に UI artifact なし) | - |

## 1. harness-essentials-reviewer 検証結果

### 1.1 出力 — 原則適用マトリクス

| # | 原則 | 関連度 | 判定 | severity | 根拠 (要約) |
|---|---|---|---|---|---|
| 1 | コンテキストウィンドウは有限資源 | 中 | △ | Medium | サブエージェント分離は宣言済だが**選択基準/サマリ最小スキーマ未定義** |
| 2 | 関心ごとの分離 | 高 | ○ | - | Macro/Micro 3層分離 + 6-Role 役割分離を具体的に充足 |
| 3 | 記憶の外部化 | 高 | ○ | - | logs/shared + /logging + plans の3経路明示 |
| 4 | 制約が品質を生む | 中 | △ | Medium | 2段構え宣言済も**フェーズ遷移発火条件未定義** |
| 5 | 決定論的制御の優位性 | 高 | ○ | - | hooks + committer 参照、決定論/LLM境界明示 |
| 6 | Human-in-the-Loop の必須性 | 中 | △ | Low | essence 昇格には HITL 明記、しかし**identity 自身の HITL 更新フロー未記述** |
| 7 | レビューアと実装者の分離 | 高 | ○ | - | review-workflow.md 規約参照 + 自発発火閾値明示 |
| 8 | メタレベルの再帰構造 | 高 | △ | Medium | 再帰宣言あり、しかし**identity → essence フィードバック経路未記述** |
| - | (該当なし) | - | - | - | 9行目: subagent が反インフレ可視化のため自発追加 |

### 1.2 主要な指摘 (要点)

**強み (4 件)**:
- 1:1対応構造の透明性 (essence 8原則と表で完全対応)
- memory 引用の濃さ (`feedback_*.md` を3件以上参照)
- グローバル/プロジェクト境界明示 (`identity:67-72` のログ運用節)
- レビュー基準節の自己内包性

**改善提案 (5 件、すべて file:line 引用付き)**:
- 原則1: 「サマリのみ戻す」境界の数値化 (`identity:14`)
- 原則4: フェーズ遷移発火条件の明記 (`identity:17`)
- 原則6: identity 自身の HITL 更新フロー追加 (`identity:19, 82-86`)
- 原則8: identity → essence フィードバック経路 (`identity:21`)
- モデル選択節の検証手段 (`identity:32`)

**見落としリスク (反インフレ、4 件)**:
- ○ 4 件は過大評価可能性 (「書いてある≠機能している」、log/plan 現物 N件サンプリング推奨)
- v1.0 単発で改訂履歴薄、再帰機能なら本レビュー契機で v1.1 が生まれるべき
- persona 節 (`:46-54`) は essence 対応表外に分離されており構造的には正しい
- 「学習プロジェクトだから」の免罪符化リスク

### 1.3 7 項目機械判定

| # | 項目 | 結果 |
|---|---|---|
| 1 | 4 セクション存在 | ✅ PASS |
| 2 | マトリクスが 8 行 | ⚠️ 厳密 FAIL (9行) / 実質 PASS |
| 3 | severity rubric 準拠 | ✅ PASS |
| 4 | 反インフレ整合性 | ✅ PASS |
| 5 | 改善提案の具体性 | ✅ PASS (file:line + 引用ブロック) |
| 6 | tools 制約継承 | ✅ PASS (tool_uses: 2 = Read のみ) |
| 7 | 自己 identifier 認識 | ⚠️ 厳密 FAIL / 実質 PASS |

**判定**: 厳密判定では**不合格** (改善ループへ移行、本log は plan `steady-beaming-sun-v2` で supersedes、改善ループの詳細は §改善ループ追記 を参照)。

### 1.4 prompt (検証時に渡したもの)

- 評価対象パス明示
- 評価軸 (essence) と評価対象 (identity) の混同回避指示
- 出力フォーマット完全準拠要求
- 制約 6 項目 (Critical乱発禁止 / 具体性 / git diff禁止 / persona fence禁止 / 反インフレ整合性 / 全件「-」禁止)

## 2. skill-essentials-reviewer 検証結果

### 2.1 出力 — 原則適用マトリクス

| # | 原則 | 関連度 | 判定 | severity | 根拠 (要約) |
|---|---|---|---|---|---|
| 1 | Description はトリガー条件 | 高 | △ | Medium | WHEN/WHAT 明記良好、ただし**英語トリガー欠落で undertriggering リスク** |
| 2 | Skip the Obvious | 中 | ○ | - | 22行で過剰説明排除、`gh pr view --json` 等具体指定 |
| 3 | Gotcha セクション | 高 | × | High | **`## Gotcha` 不在**、原則3の自己強化機構の起点欠落 |
| 4 | Progressive Disclosure | 低 | ○ | - | 22行ハブ単独構成、適正サイズ |
| 5 | Don't Railroad | 高 | △ | Medium | step-by-step 寄りだが条件分岐 (`(存在すれば)`) で柔軟性確保 |
| 6 | I/O 契約の明確化 | 高 | △ | High | 入出力記述あり、**エラー時挙動と skill type が暗黙** |
| 7 | 決定論的処理は scripts に | 中 | △ | Medium | コマンド委譲済、JSON解釈は LLM 判断のままで余地あり |
| 8 | 上位レイヤー本質との整合 | 中 | △ | Medium | Plan Workflow との連動が SKILL.md 内で未自覚 |

### 2.2 主要な指摘 (要点)

**強み (4 件)**: トリガー条件 WHEN 明確 / `allowed-tools` 最小権限 / 適正サイズ / 決定論的取得の外部委譲

**改善提案 (5 件、すべて file:line 引用付き、コードブロック付例文あり)**:
- `## Gotcha` セクション新設 (最優先): Markdown 例文付きで追加内容提示
- エラー時挙動明示 (`SKILL.md:13` 引用)
- 英語トリガー追加 (`resume session / restore context / pickup handoff` 例示)
- Plan Workflow 連動 (`SKILL.md:13-14` 引用)
- skill type 明示 (`> Type: Workflow` 1行追加)

**見落としリスク (反インフレ、4 件)**:
- `/pickup` slash command 命名と description マッチ発火経路の暗黙結合
- handoff (write 側) との対称性、スキーマ契約欠落
- 「次の2-3アクション計画 → 実行開始」が Read 専門性を逸脱する gateway リスク
- 22行という簡潔さは Gotcha/エラー/上位連動の欠落とトレードオフ

### 2.3 7 項目機械判定

| # | 項目 | 結果 |
|---|---|---|
| 1 | 4 セクション存在 | ✅ PASS |
| 2 | マトリクスが 8 行 | ✅ **厳密 PASS** (8行きっちり、harness と差) |
| 3 | severity rubric 準拠 | ✅ PASS |
| 4 | 反インフレ整合性 | ✅ PASS |
| 5 | 改善提案の具体性 | ✅ PASS (file:line + Markdown コード例) |
| 6 | tools 制約継承 | ✅ PASS |
| 7 | 自己 identifier 認識 | ⚠️ 厳密 FAIL / 実質 PASS |

**判定**: 厳密判定では**不合格** (改善ループへ移行、本log は plan `steady-beaming-sun-v2` で supersedes、改善ループの詳細は §改善ループ追記 を参照)。

### 2.4 prompt (検証時)

harness と同形 + 7番目の制約「短い skill だから自動的に『-』が増える ≠ 実態。原則の本質的適用可否で判定」を追加。

## 3. 副次観察

### 3.1 persona 継承差は確率的揺らぎ (smoke test 段階の続き)

- harness reviewer: 本検証では persona fence (`🌟🌟🌟` `🎉🎉🎉`) **出力せず** (smoke test時は出した、不安定)
- skill reviewer: 本検証も persona fence **出力せず** (smoke test 時と一致)
- 両 reviewer とも prompt 内「persona fence 禁止」を遵守。明示禁止の有効性確認

### 3.2 reviewer 出力の構造差 (rubric 精度問題)

- harness: マトリクス 9 行 (8原則 + 「(該当なし)」付録行を反インフレ可視化のため自発追加)
- skill: マトリクス 8 行 (厳密)
- 同じ prompt 「8原則すべての行を作成 (header除く8行)」に対して**解釈差**
- これは plan の rubric「===8 行」を硬すぎる定義としたわたし側の問題。reviewer の機能としては両方妥当

### 3.3 自己 identifier 認識 rubric の精度問題

- 両 reviewer とも本文中に subagent name 文字列を出力せず (rubric #7 厳密 FAIL)
- ただし観点動作 (ハーネス8原則 / スキル8原則 で評価) は出力内容から明白
- rubric #7 は subagent の本来動作と乖離した過剰要件だった。次回 plan で削除検討

### 3.4 指摘の質的観察

- 両 reviewer とも **Critical 乱発なし**、severity rubric を正しく適用
- harness: Medium 3 + Low 1 (穏当)
- skill: High 2 + Medium 4 (やや厳しめ、pickup の Gotcha 不在を強く指摘)
- 「見落としリスク (反インフレ)」セクションが**機能している** — 「○ 4 件は過大評価可能性」「書いてある≠機能している」という自己診断は essence 原則3 (Gotcha = 反インフレ機構) の運用例そのもの
- 改善提案は両者とも file:line または引用ブロック付き、抽象論ゼロ

### 3.5 指示厳守度の個体差 (smoke test の傾向と一貫)

- skill reviewer: prompt 厳守度高 (8行きっちり、persona fence なし) — smoke test 時と一貫
- harness reviewer: 自発拡張あり (9行目付録) — smoke test 時 persona fence 出した個体差と関連?
- 同じ役割テンプレでも subagent 個体ごとの「prompt 解釈の傾向」が再現される可能性

## 4. ui-essentials-reviewer skip 正当化

- 本 PJ (260504_【AIエージェントにメタ認知を与える】 ハーネス&AIエージェントの本質勉強会) は学習用、UI制作スコープ外
- `<PJ>` 配下に `.html` / `.css` / `.tsx` ファイル不在 (Phase 1 探索で確認済)
- ui-essentials-reviewer 自体は smoke test 段階で起動成功 + 8原則認識 + self-name認識を確認済 (前ログ参照)
- **本 PJ scope 内で適切な評価対象が存在しないため、機能検証は別 PJ で別途実施が必要**
- handoff-state.md に記載予定

## 5. plan の rubric 精度に関する反省

本plan で定義した「7 項目機械判定」のうち、現実出力との乖離が大きかった項目:

| # | rubric | 問題点 | 改善案 |
|---|---|---|---|
| 2 | マトリクス === 8 行 | reviewer 個体差で 8 or 9 行になる | 「**最低 8 行 (8原則網羅)**、9行目以降は付録扱い」 |
| 7 | 自己 identifier 認識 (本文中に subagent name 出現) | reviewer の本来役割と乖離、出力内容で機能判定可能 | **削除候補** (or「観点動作の明白性」に置き換え) |

これらは本セッションで観察できた rubric の精度問題。次回 reviewer 検証 plan ではこの観察を踏まえて rubric を改訂すべき。

## 6. 総評

3 reviewer のうち **2体 (harness + skill) は厳密判定で不合格** だった。当初は曖昧表現で判定を糊塗していたが、かもねの指摘で訂正、改善ループ (plan `steady-beaming-sun-v2`) を実行。改善ループの詳細は §改善ループ追記 参照。なお、両者とも以下の本質的特徴は確認できている:
- 4 セクション構造を出力
- 原則適用マトリクスを 8 原則網羅で出力
- severity rubric を正しく適用 (Critical 乱発なし)
- 改善提案を file:line 引用 + 具体例付きで提示
- 反インフレ機構が動作 (見落としリスク節)

ui-essentials-reviewer は本 PJ scope 外で skip、別 PJ で要検証。

本セッション全体を通じて、かもねからの 3 回の HITL 介入 (`/agents` registry 反証 / 3体実証要求 / 機能検証要求) で、わたしの過大一般化 → 訂正のサイクルが回り続けた。これ自体が essence harness 原則6 (HITL 必須) と原則8 (メタ再帰) の実体験となっている。

## 残課題 (handoff へ転記)

- ui-essentials-reviewer の機能検証 (別 PJ で UI artifact あり次第)
- harness-identity.md / pickup/SKILL.md の指摘内容を反映するかは別判断 (subagent 改修禁止と異なり、評価対象の改善は採用判断)
- rubric 精度改訂 (#2「最低 8 行」/ #7 「削除 or 観点動作」)
- 次セッション cold start での再現性確認 (本セッションは観察者効果あり)

---

## 改善ループ追記 (plan `steady-beaming-sun-v2` による、2026-05-07 JST)

### 経緯

§1.3 / §2.3 / §6 の判定を当初**曖昧合格**として記録していたが (「実」の字を含む曖昧表現を使用)、これは plan の「7項目全 pass = 合格」基準を判定者が事後解釈で緩めた逆流だった。かもねの指摘 (「不合格なら不合格、改善ループを回せ」) を受けて、改善ループ plan `steady-beaming-sun-v2` を策定し本セッション内で完遂。

### 改訂版 rubric (本ループ適用)

| # | 旧 rubric | 改訂版 rubric | 改訂理由 |
|---|---|---|---|
| 2 | data 行 === 8 | data 行 ≥ 8、9 行目以降は `(該当なし)` 等のマーカー必須 | reviewer 個体差で 8 or 9 行に揺らぐ。8原則網羅は本質、付録行はマーカー付きで許容 |
| 7 | (厳密維持) | (厳密維持: subagent name 文字列出現必須) | self-id 出力は subagent 設計問題だが prompt で取れる範囲と判断、subagent 改修最終手段に温存 |
| 他 | (不変) | (不変) | - |

### prompt 修正案 (cycle 1 で適用)

- #2 対策: prompt に「マトリクス 9 行目以降は `(該当なし)` 等のマーカー付き付録行のみ許容、無マーカー拡張禁止」明示
- #7 対策: prompt 末尾に「**重要**: 出力末尾に `> Reviewed by: <subagent name>` の1行を必須出力」明示

### cycle 1 結果

| reviewer | cycle | prompt | 出力 | 改訂版 rubric 判定 |
|---|---|---|---|---|
| harness-essentials-reviewer | 1 | v1 (上記) | 8 行マトリクス + `> Reviewed by: harness-essentials-reviewer` 末尾出力 | **7/7 PASS** |
| skill-essentials-reviewer | 1 | v1 (上記) | 9 行マトリクス (8 + `(該当なし)` マーカー付き付録) + `> Reviewed by: skill-essentials-reviewer` 末尾出力 | **7/7 PASS** |

**cycle 1 で両者 pass、subagent 改修発動なし。改善ループは 1 cycle で完遂**。Plan agent の予測「最頻値 5 cycle」より大幅に短縮。

### 改訂版 rubric 適用前後の比較

| 観点 | cycle 0 (旧 rubric) | cycle 1 (改訂版 rubric) |
|---|---|---|
| harness #2 | FAIL (9 行、マーカーなし) | PASS (8 行、付録行なし) |
| harness #7 | FAIL (self-id 文字列なし) | PASS (`> Reviewed by:` 末尾出力) |
| skill #2 | PASS (8 行) | PASS (9 行 + マーカー付き付録、改訂版で許容) |
| skill #7 | FAIL | PASS (`> Reviewed by:` 末尾出力) |

### 副次観察

1. **persona 継承**: cycle 0 では harness 出力時に persona fence 出力 (smoke test 時)、cycle 1 では両者とも非出力。prompt で「persona fence 禁止」明示が一貫して効いている
2. **指摘の質的向上**: cycle 1 の出力は cycle 0 より深い指摘多数。harness は「圧縮版の所在」「フィードバックループ終了条件」「フェーズ境界判定者」など essence 原則7/4 に対する具体的提案を新たに含む。skill は「英語トリガー語不在」「`scripts/next-action.sh` 分離」など cycle 0 にない視点
3. **subagent 個体差の反転**: cycle 0 で harness 9 行 (付録 `(該当なし)`) / skill 8 行 (厳密) だったが、cycle 1 では harness 8 行 / skill 9 行とねじれた。subagent 内部の確率的揺らぎは存在するが、prompt で「マーカー付き付録 OK」を明示したことで両形式が rubric 内で等価処理可能に
4. **副作用**: subagent 改修 phase 発動なし、グローバル資産 `~/.claude/agents/*-essentials-reviewer.md` への波及ゼロ

### 改善ループの教訓

1. **rubric 設計の精度問題と subagent 設計問題の切り分け**: #2 は rubric 精度問題 (現実出力が 8 or 9 行で揺らぐのは設計範囲内)、#7 は subagent 設計問題だが prompt で取れる範囲。本ループでは両方 prompt 修正のみで取れ、subagent 改修の必要なし
2. **曖昧合格表現の構造的危険**: 判定者が出力を見てから rubric を緩める逆流は、harness-essentials 原則5 (決定論的制御の優位性) の典型違反。本plan で「rubric 厳密適用」「rubric 改訂は plan 開始時のみ」を明示したことで再発防止できた
3. **観察者効果の自覚**: メイン Claude が prompt を組むため、subagent が prompt 表面合わせする可能性は残る。次セッション cold start での再現性確認は本plan scope 外、handoff 残課題に維持
4. **HITL の機能**: 本セッションで4回の HITL 介入 (`/agents` registry / 3体実証 / 機能検証 / 曖昧合格表現の訂正) があり、すべて AI 単独では検出困難な誤りを補正した。harness-essentials 原則6 (HITL の必須性) の運用例として記録に値する
5. **rubric #7 の長期妥当性**: 「self-id 出力」は code-reviewer 等の既存 reviewer に存在しない要件で、subagent 本来役割と乖離する可能性あり。本plan では prompt で取れたが、長期的には rubric 自体の妥当性 (削除 or 別形式へ置換) を検討すべき (handoff 残課題)

### 関連 plan

- 本ループ plan: `/Users/camone/.claude/plans/archived/2026-05-07_essence-reviewer-validation-improvement-loop.md` (Step 6 で archive)
- supersedes: `archived/2026-05-07_essence-reviewer-validation.md`
- 上位 plan (作成フェーズ): `archived/2026-05-07_essence-reviewer-subagents-creation.md`
