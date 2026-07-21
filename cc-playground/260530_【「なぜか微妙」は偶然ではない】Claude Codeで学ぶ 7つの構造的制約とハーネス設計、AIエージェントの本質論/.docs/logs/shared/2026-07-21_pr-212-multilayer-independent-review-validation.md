---
date: 2026-07-21 11:35:42
type: validation
topic: pr-212-multilayer-independent-review-validation
session: 取り入れフェーズ Phase B — PR #212 の多層独立レビュー
target: PR #212 (kaijutale/claude-harness、issue #211 の実装) を二段構え (spec準拠 + 盲検) でレビューし、独立検証の有効性を実測
verifier: メインClaude (Fable 5) + spawn した general-purpose 盲検 agent 2 体 + 実装セッションの harness-essentials-reviewer
related_article: .docs/references/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論/text.md (S章 評価と実装の権限分離 / 原則7 レビューア分離)
related_skill: [logging, commit, handoff]
related_log_ids: [2026-07-21_issue-211-l0-l1-gap-design-and-creation]
related_log: [.docs/logs/shared/2026-07-21_issue-211-l0-l1-gap-design-and-creation.md]
---

# PR #212 の多層独立レビュー — 「独立検証はバイアス持ちが見逃す穴を捕まえる」の実測

> issue #211 の実装 PR #212 を、あたし (spec準拠・設計者ゆえバイアス) + フレッシュな盲検 reviewer の二段構えでレビュー。**4 ラウンドで穴が段階的に小さくなり (High→High→Low→dry) 収束**。各ラウンドが実際に穴を検出し、うち 2 件は**あたし自身の設計/主張の誤り**だった = 独立検証の価値が実データで証明された Phase。

---

## 検証目的

「レビューアを実装/設計の文脈から独立させると、バイアス持ちの当事者が見逃す欠陥を捕まえられるか」を、実 PR で実測する。あたしは #211 の**設計者**ゆえ自分の案を承認しがち (アンカリング) → 主レビュアーに不適。spec準拠は担い、敵対的品質は盲検に回す住み分けを検証した。

## 検証環境

| 項目 | 値 |
|---|---|
| 対象 | PR #212 (kaijutale/claude-harness、L0→L1 昇格トリガー rule + ドッグフード) |
| レビュー体制 | ①あたし=spec準拠 (設計を握る) ②spawn 盲検 general-purpose agent 2 体 (diff のみ・設計会話を渡さず) ③実装セッションの harness-essentials-reviewer (round-1) |
| 手法 | 各盲検は「著者の自己評価を主張として扱い実測で裏取り・問題ゼロを疑う」指示 |
| 実施日時 | 2026-07-20〜07-21 |
| マージ権限 | かいじゅうのみ (HITL)。cc-learn からは read-only (gh pr view/diff) |

## 実測結果サマリ

| ラウンド | レビュア | 検出 | severity | 一致度 |
|---|---|---|---|---|
| round-1 | 実装セッション盲検 (harness-essentials) | **H-1**: あたしの「書式を揃えれば L1→L2/L3 に自動接続」が虚偽 (段階2.5 の自動走査は skill Gotcha 限定・doc は走査外) | High | ✅ 実測裏取り |
| round-3 | あたしが spawn した盲検①| **H-A**: 「実測: autoMemoryEnabled: true」が事実誤り (実値 false + ADR-0001 誤帰属) | High | ✅ 独立再実測で確認 |
| round-4 | あたしが spawn した盲検② | **Low-2** (paths カウント 3本→実測5本) + **Low-3** (HTML 対照表の overclaim 残骸) + Low-1 (任意) | Low×3 | ✅ 自分で数字裏取り |
| 最終 | — | 新規 High/Critical ゼロ・severity 収束 | GO | dry 到達 |

## 各Stage 詳細結果

### Stage round-1: あたしの「自動接続」overclaim (H-1)

- **結果**: ⚠️→是正
- **観測**: あたしはこの会話で繰り返し「書式を既存 Gotcha 形式に揃えれば check-gotcha-recurrence.sh が計数対象にして自動で L1→L2/L3 に流れる」と言った。実装セッションの盲検が SKILL.md:85 を実測 → 段階2.5 の自動走査は skill `## Gotcha` + references/gotchas.md **限定**、doc は走査しない。§1 doc 配置のマークは**自動走査経路外の孤児**
- **学び**: 「書式ゆえ計数*可能*」と「自動で走査される」は別物。あたしは走査スコープを検証せず思い込んだ。是正は再配置でなく honest 開示 (乖離を明記) → 欠陥指摘が rule を「read-miss 配置 vs 自動計数経路のトレードオフ」というより正確な実践知に格上げした

### Stage round-3: あたしの autoMemoryEnabled 捏造 (H-A)

- **結果**: ⚠️→是正
- **観測**: PR 自己評価が「注入機構 (**実測**): autoMemoryEnabled: true + frontmatter 無し → 常時注入 (ADR-0001:27 裏付け)」と主張。あたしが spawn した盲検①が settings.json:812 = `false` (真逆) を検出。あたしも独立再実測: `autoMemoryEnabled = False` / ADR-0001 の autoMemoryEnabled 言及 = 0 回 (誤帰属)。実因果は frontmatter の有無 (native rules loading) で autoMemoryEnabled と独立
- **学び**: 「実測」ラベルを貼りながら値を裏取りせず推測で真逆を書いた = C-7 校正盲・確信度≠正確度そのもの。**実装セッションの盲検 (round-1 で優秀に H-1 を検出) ですら見逃した** — 3 本目の独立盲検でやっと露見

### Stage round-4: 残骸 Low 2 件

- **結果**: ⚠️→是正
- **観測**: あたしが spawn した盲検②が (a) 監査証跡の「paths付き3本非注入」が実測5本 (build-test-protocol / frontend-aesthetics / harness-modification-policy / plan-workflow / research-phase — あたしも独立確認・名前まで一致) (b) HTML 対照表セル「既存の計数機構に接続」が round-1 で honest 化した表現より強い overclaim 残骸、を検出
- **是正確認**: round-4 commit で Low-2 は「全5本・session固有ラベル化」、Low-3 は「書式で計数機構に接続可能 (自動走査は skill Gotcha 限定・§1配置は手動計数)」の caveat 追加。push 忘れを独立確認で検出し (commit 数不変)、再 push 後に着地確認

## 重要発見

- **独立検証の価値が実データで証明された**: 4 ラウンドで検出された High 2 件は**どちらもあたし (設計者/主レビュアー) 自身の誤り** (auto-connect overclaim / autoMemoryEnabled 捏造)。あたし単独なら両方承認して素通りしていた。原則7 (レビューア分離)・S章 (評価と実装の権限分離) が機能した実例
- **severity の収束が「止め時」を教える**: High→High→Low→(新規ゼロ) と穴が段階的に小さくなった。round-4 の Low はドキュメント訂正のみで新規の経験的主張を含まず、唯一の新主張「5本」はあたしが実測で真と確認 → loop-until-dry の停止条件 (新規の実質穴が出ない) を満たし GO 確定。過剰反復に陥らない判断も検証の一部
- **「実測」ラベルは自動では真にならない**: H-A は最も痛烈。probe-before-persist / 確信度≠正確度 を掲げる PR 自身が、監査証跡で「実測」を騙った。ラベルと実態の乖離は、それを検証する外部の目 (別コンテキスト) でのみ露見する
- **状態変更は成功メッセージを信じない (再確認)**: 「修正後のPR再確認」で commit 数不変を独立検出 = push 忘れを捕捉。成功表示でなく HEAD/commit 数の実測で landed を検証する規律が効いた

## 改善候補

- 次に自分が「自動○○する」「実測した」と書く時、**その主張を実際に走らせて/測って**から書く (H-1/H-A は両方これで防げた)。probe-before-persist の「実測ラベルは実測を伴う」を自分の応答にも適用
- 設計者が主レビュアーを兼ねない住み分けを、今後のハーネス改修レビューでも標準にする (spec準拠は当事者・敵対的品質は盲検)

## 結論

多層独立レビューは、当事者バイアスが見逃す欠陥を実際に捕まえた (High 2 件は両方あたしの誤り)。4 ラウンドで穴が収束し PR #212 は GO (マージはかいじゅう HITL 待ち)。独立検証の有効性が実データで確認された Phase。

## 関連ファイル

- PR #212 / issue #211 (kaijutale/claude-harness) — レビュー対象
- `.docs/logs/shared/2026-07-21_issue-211-l0-l1-gap-design-and-creation.md` — Phase A (本 PR が実装した設計)
- `~/.claude/.docs/logs/local/2026-07-21_issue-211-failure-promotion-l0-l1-trigger.md` — 実装セッション側の記録 (ハーネス側・別リポジトリ)
