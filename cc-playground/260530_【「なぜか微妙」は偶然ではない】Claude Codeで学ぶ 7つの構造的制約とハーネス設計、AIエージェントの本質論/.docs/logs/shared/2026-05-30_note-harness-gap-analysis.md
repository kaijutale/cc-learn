---
date: 2026-05-30 12:48:02
type: qa
topic: note-harness-gap-analysis
session: 未設定
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [review-harness, review-agent-essence, three-elements-harness, orchestrating-team-development, enforcing-strict-tdd-cycle, logging]
related_agent: [general-purpose]
related_log_ids: [2026-05-24_llm-7-constraints-c-prefix-meaning]
related_log: [2026-05-24_llm-7-constraints-c-prefix-meaning.md]
---

# note記事の推奨ハーネス vs camone実体 (~/.claude/) の突き合わせ調査

> 記事の全124ページを忠実書き起こし → 記事の5切り口(T/K/V/S/E)+巻末35項目を軸に camone の `~/.claude/` 実体をマッピング。結論「記事の推奨に対し構造的に未構築な欠落は無し」。唯一の差分(test deny 不在)は穴ではなく、TDDハーネスとの両立を取った設計判断。

## 概要

camone からの問い2つへの回答記録:

1. 「note記事で紹介されてるハーネスで、自分のハーネスに未構築な部分があるか? 徹底調査して」
2. (調査後) 「test deny を入れるべきか否か、記事を読んで本質理解した上での意見が聞きたい」

調査手順: 記事PDF(画像ベース124p)を general-purpose agent で忠実書き起こし → 別の general-purpose agent で `~/.claude/` 実体を棚卸し → メインで突き合わせ。参照軸の独自フレーム化を避け、記事の章立て(C-1〜C-7 / T・K・V・S・E / 巻末チェックリスト)をそのまま軸に据えた(memory: feedback_reference-workflow-no-improvise 遵守)。判断軸は `~/.claude/` 実体のみ(feedback_judgment-material-global-scope 遵守)。

## 内容

### 軸 = 記事の構造

- Part I: LLMの7つの構造的制約 C-1〜C-7 (C=Constraint、変えられない前提)
- Part II: 対処5切り口 — T(タスク構造) / K(記憶と知識) / V(検証と矯正) / S(信頼境界と権限) / E(環境設計)
- 巻末: 設計チェックリスト 7カテゴリ×5 = 35項目
- 記事の「最初の一歩」2つ: (1) CLAUDE.md 60行以下のポインタ型 / (2) test・lint設定を settings.json の deny に

### マッピング結果 (証拠ベース)

| 切り口 | 判定 | 主な実装 |
|---|---|---|
| T タスク構造 | 全✅ | orchestrating-team-development(指揮者), three-elements-harness(Macro/Micro分離), 5-Role, worktree, Plan Mode, spec再注入(T-2.2明記), 統合非委任(T-2.3明記) |
| V 検証と矯正 | 全✅ | hook lint, 失敗の昇格ラダー(Gotcha→test→hook)=camoneのメタ原則, max3周ループ, behavior+structure二層(V-2.2明記) |
| S 信頼境界 | 全✅ | permissions allow/ask/deny 3層, 検疫hook, 可逆性Tier, sandbox, fail-closed |
| K 記憶と知識 | 大半✅ / △2 | 4型memory(user/feedback/project/reference 完全一致), handoff/pickup=Restartable Handoff, 観測面, ルールJSON外部化。△=K-1.2 Probe Question / K-2.1 CLAUDE.md行数(146>60) |
| E 環境設計 | 大半✅ / △1 | 制約カスケード, kebab-case hook, 理由ベースrules。△=E-1.1 定期監査の自動スケジュール |
| 配布skill | ✅+拡張 | review-harness / review-agent-essence 両保有, essence は harness/skill/ui の3領域に拡張(配布版の上位互換) |

### 唯一の「明確な穴」候補: settings.json deny の test/spec 不在

- 事実: deny に `.eslintrc*` / `eslint.config*` / `tsconfig.json` / `vitest.config*` / `jest.config*` / `.prettierrc*` / `biome.json` / `.github/workflows/*` / `settings*` は全部ある。**`**/*.test.ts` / `**/*.spec.ts`(テストファイル本体)だけ無い**。
- 記事は C-5「不可侵テスト」+「最初の一歩その2」でこの2つを名指し推奨。

### camone の回答 = 意図的に外している(穴ではない)

camone 選択: 「意図的(TDD設計のため)」。

### わたし(記事熟読後)の意見 = グローバル deny には入れない方がいい

根拠3点:

1. 記事 C-5 の打ち手は3段階 — (1)deny / (2)評価と実装の権限分離 / (3)Hook。camone は上位の「(2)権限分離」を team-tester のファイル所有権で実装済み。下位の(1)を上に重ねても防御は増えず、副作用だけ乗る。
2. teammate は lead の権限を継承する(orchestrating-team-development Step 4.0 明記)。グローバル deny は team-tester のテスト作成を殺す = TDDハーネスと構造衝突。
3. 記事 V-1.1 昇格ラダーの原則「実測で再発した失敗だけ上の Level に昇格」。camone の memory にも「デフォルトL2、被害大or失敗実測時のみhooks化」。テスト改竄の実測証跡なし → 今 deny に昇格する根拠がない。

例外条件: 将来テスト改竄が実測で起きたら、グローバル全面 deny ではなく three-elements の phase 機構(`restrict-macro-writes.sh` と同型)で「実装フェーズのみ block / tester ロールは許可」の条件付き Hook にするのが、記事の昇格ラダーに沿った正解。

### 軽微差分(穴ではなく代替済み/実測待ち)

- K-1.2 Probe Question: validate-knowledge.py は形式検証(frontmatter/日付/git照合)まで。内容正確性を境界条件/反例で能動テストする仕組みは薄い。
- E-1.1 定期監査: 検知hook(hardcode_hygiene / validate_claudemd)はあるが、定期実行スケジュールなし(daemon は存在するが workers 空、review-harness は手動起動)。
- K-2.2 ADR: 判断記録の専用テンプレ・ディレクトリは無し、plan/log で代替。
- (参考) K-2.1 CLAUDE.md 146行: rules/ 外部化でポインタ型は達成、記事目標60行は未達。

### 調査プロセスの現場知

- 参照PDFは画像ベース124p(テキストレイヤー無)。pdfinfo でページ数確定 → general-purpose agent に Read の画像認識で忠実書き起こしを委譲し、メインコンテキストを保護。
- この環境の Bash/Read 出力は大幅遅延+バッチflush挙動(複数ターン分が一括返却)。空結果が連続しても実行自体はされている。/tmp へ書き出し → 後続 Read で確実に拾えた。
- 記事の「25のアンチパターン指標」は本文に番号付き一覧として存在せず(/review-harness の内部指標数として宣伝に登場のみ)。巻末チェックリストは実数35項目(7カテゴリ×5)。

## 関連ファイル

- `.docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】....pdf` — 参照記事(画像PDF 124p、調査の唯一の軸)
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — 同記事の C-1〜C-7 解説(先行関連ログ)
- `~/.claude/settings.json` — deny リスト(test/spec 不在の事実確認元)
- `~/.claude/skills/{review-harness,review-agent-essence,three-elements-harness,orchestrating-team-development,enforcing-strict-tdd-cycle}/SKILL.md` — 突き合わせ対象
- `~/.claude/projects/-Users-camone-dev-claude-code-claude-code-learn/memory/` — 4型memory実体
