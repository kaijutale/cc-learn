# Harness Diagnosis: 260530 学習サンドボックス (7つの構造的制約とハーネス設計)

> 評価基準: [diagnosis-rubric](diagnosis-rubric.md)
> 診断日: 2026-07-05-0026
> 対象: `.../cc-playground/260530_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論`
> 本診断は「baseline取得 run 2/2」(同一対象への2回目の独立実行 = 判定の自然なブレ幅測定用)。過去の診断レポートは参照していない。

## 評価スコープの明示 (この診断の前提)

本PJの CLAUDE.md は自ら「**学習目的のサンドボックスであり、ハーネスそのものではない。ハーネスの実体は `~/.claude/` 配下に実装される**」と宣言している。実際、プロジェクト側の `.claude/` は意図的に薄い（16行の CLAUDE.md / env のみの settings.json / プロジェクト固有の skill・hook・agent は 0）。

スキルの Phase 1 はユーザーレベルとプロジェクトレベルの**両方**を読み込むよう定めており、このディレクトリでセッションを起動すると `~/.claude/` の deny・hook・skill が全て発効する。したがって本診断は「**このディレクトリで実際に発効する実効ハーネス（ユーザー層 + プロジェクト層）**」を採点対象とする。スコアが高いのは、実効ハーネスが成熟しているため（プロジェクト固有層が薄いこととは別の事実）。

## ハーネス構成サマリ

| 項目 | 現状 |
|------|------|
| CLAUDE.md | プロジェクト 16行（スコープ宣言 + 参照ポインタ1 + ログ規約1）/ ユーザー `~/.claude/CLAUDE.md` 全文 + `rules/` 10本。詳細手順は `.docs/progressive-disclosure/` へポインタ委譲 |
| Permissions | allow ~40件 / deny ~65件 / ask ~28件（すべてユーザーレベル。プロジェクト settings.json は env のみで permissions 無し） |
| Hooks | PreToolUse 9件 / PostToolUse 9件 / Stop・SessionStart・Compact・SubagentStop 他 ~15件（すべてユーザーレベル） |
| Skills | 計91件（ワークフロー型・辞書型・fork/master ペア混在。多数が「明示呼出専用・自動誘発なし」で auto-invoke 抑制）。プロジェクト固有 skill は 0 |
| MCP | 5接続（brave-search / chrome-devtools / claude-in-chrome / context7 / firecrawl）。`ENABLE_TOOL_SEARCH=true` により deferred（オンデマンド遅延ロード） |
| Memory | auto-accumulation **OFF**。親 claude-code-learn レベル MEMORY.md 3エントリ（37→3 圧縮済、feedback/project/reference 分類、Last verified 2026-06-08）。260530 固有の memory/ は無し（handoff-state.md + 親 memory へ委譲） |
| Agents | カスタム 32件（team-* / debater-* / framing-advocate-* / essence reviewers / coder 等の 5-Role + fork 系） |
| Plugins | `~/.claude/plugins/` にインストール有り（ralph-loop 等）。常時ハーネス化はしておらず明示起動時のみ機能するため採点には限定的に反映 |

## スコアサマリ

| カテゴリ | 指標 | スコア | 小計 |
|---------|------|--------|------|
| **A. 帯域効率** | A1 ✅ A2 ✅ A3 ✅ A4 ✅ A5 ✅ | 10/10 | 100% |
| **B. 検証の堅牢性** | B1 ✅ B2 ✅ B3 ✅ B4 ✅ B5 ✅ | 10/10 | 100% |
| **C. 権限と信頼境界** | C1 ✅ C2 ✅ C3 ✅ C4 ✅ C5 ✅ | 10/10 | 100% |
| **D. 知識と記憶** | D1 ⚠️ D2 ✅ D3 ✅ D4 ✅ D5 ✅ | 9/10 | 90% |
| **E. 環境設計** | E1 ✅ E2 ✅ E3 ✅ E4 ✅ E5 ✅ | 10/10 | 100% |
| **総合** | | 49/50 | **98%** |

> 「—」（対象外）は今回なし。実効ハーネスが全指標に発効するため全指標を採点対象とした。

### グレード

**S（98%）** — ハーネス設計が成熟。微調整のフェーズ。

| グレード | 範囲 | 意味 |
|---------|------|------|
| **S** | 90%+ | ハーネス設計が成熟。微調整のフェーズ |
| A | 75-89% | 基盤はしっかり。いくつかの強化ポイントがある |
| B | 60-74% | 基本構造はあるが、構造的な穴がある |
| C | 40-59% | 重要な設計パターンが未導入。改善効果が大きい |
| D | <40% | ハーネス設計の初期段階 |

## 検出されたアンチパターン

唯一の非満点指標。優先度順（C>B>A>D>E）で D カテゴリは最後だが、他に ❌・⚠️ が無いため単独記載。

### D1. 暗黙の前提に頼っていないか ⚠️

**検出事実**: ユーザー CLAUDE.md の Stack 宣言は「Primary: TypeScript(ESM), Next.js(App Router). pkg manager→リポジトリ指定」。主要技術は明示されているが、非主流選択の**排除宣言（「Vitest であって Jest ではない」等の "〜ではない"）が無い**。パッケージマネージャはハーネス層では固定せず各リポジトリに委譲している（c4-e2e-sandbox 側は pnpm-lock.yaml で pin 済だが、これはリポジトリ側の担保）。

**影響**: TDD 系 skill（team-tester / enforcing-strict-tdd-cycle）が TS コードに対して走る場面で、テストランナーやツールの非主流選択を新規セッションが推測する余地が残る。実害は小さい（対象がドキュメント/HTML 中心の学習PJで、コード生成面が限定的なため）が、`(→C-6) 訓練データの断崖` の観点では、推測を潰し切れていない一点。

**関連原則**: (→C-6) 訓練データの断崖 / (→C-2) 暗黙のデフォルトは入力バイアスの一種

**改善案**:
```markdown
## Stack（~/.claude/CLAUDE.md の Stack 節に排除宣言を追記）
- 言語: TypeScript (ESM, strict)
- テストFW: Vitest（Jest ではない）
- パッケージマネージャ: リポジトリ指定に従う。未指定の新規リポジトリは pnpm（npm/yarn ではない）
```

## 強み

- **権限設計（C 全 ✅）が突出**: deny が ~65件と網羅的で、不可逆操作（rm / git push / reset / rebase / checkout / switch / sudo）・秘密（.env / id_rsa / *token* / *key*）・品質のものさし（eslint / tsconfig / vitest.config / prettier / biome / .github/workflows）・自己ルール（settings.json / CLAUDE.md / hooks / hook rules）を構造的にブロック。しかも master deny はユーザーレベルに置かれ、プロジェクト settings.json（ask）からは緩められない設計になっている（鍵は agent の手の届かない場所）。
- **検証の即時性と生成/評価の分離（B・E3 ✅）**: PostToolUse hook が Edit/Write 直後に lint・emoji・行数・skill frontmatter を決定論的に検証（`(→V-1.2)` の最速ティア）。かつ team-reviewer / code-reviewer agent / essence reviewers / verify-test-fork をフレッシュコンテキストで起動し、生成者と評価者を `context:fork` で物理分離（`(→C-3)` 迎合性の回避）。blinding-review-prompt で著者アンカーも除去。
- **帯域最適化と劣化対抗の両立（A・E4 ✅）**: `ENABLE_TOOL_SEARCH=true` で MCP・大量ツールを deferred 化し常駐メニューを圧縮、詳細手順は `.docs/progressive-disclosure/` にポインタ委譲。加えて proposing-essence-updates（陳腐化点検）・accumulating-reviewer-feedback（Gotcha GC）・memory の 37→3 大掃除・Stop hook のプラン archive で `(→E-1.1)` ドリフトの GC を能動運用。

## Quick Wins — 今日できる改善

S グレードのため、以下はいずれも「穴埋め」ではなく微調整。優先度と所要時間で並べた。

### 1. Stack 排除宣言の追記（D1対応、5分）

上記 D1 改善案を `~/.claude/CLAUDE.md` の Stack 節に追記。非主流選択（Vitest / pnpm）を "〜ではない" 形で明示し、新規セッションの推測余地を消す。

### 2. 常時ロード rules のフットプリント圧縮（A1 予防、15-30分）

親 memory が既に「`~/.claude/rules/*.md` は paths frontmatter 無しだと常時フルロード」と自己認識している（feedback_rules-always-loaded-not-progressive-disclosure.md）。低頻度の rule（例: frontend-aesthetics は UI 制作時のみ）に `paths:` frontmatter を付与するか Skill 化し、真の遅延ロードに移す。map/pointer 規律は既に効いているので、これは footprint のさらなる削り。

### 3. テストファイルの改ざん防御の可視化（C1 補強、10分）

現状テストランナー設定（vitest.config 等）は deny 済だが、テストファイル本体（`**/*.test.ts`）は編集可能で、改ざん防御は「team-tester / verify-test-fork のロール分離」という構造側に依存している。この依存関係を CLAUDE.md か rules に一文で明記すると、TDD skill を経由しない素の編集セッションでも「テストは通すために書き換えるものではない」意図が discoverable になる。

## 次のステップ — 中期的な改善

- **91-skill カタログの棚卸し**: auto-invoke 可能なサブセット（fork/master ペアを除く実働 skill 群）に description トリガーの重複・境界の曖昧さが無いか定期監査する。`(→V-1.3)` 選択肢は推論前に絞る。現状 disable-model-invocation 規律は効いているが、カタログ規模は増加傾向なので発火境界の健全性を継続監視。
- **proposing-essence-updates の cron 定着**: 陳腐化点検 skill を明示起動任せにせず定期起動に載せると、`(→E-1.1)` の GC が人間の記憶に依存しなくなる。

## 総評

実効ハーネス（このディレクトリで発効する `~/.claude/` + 薄いプロジェクト層）は 49/50・98%・**S グレード**で、権限境界・決定論的検証・生成/評価分離・帯域最適化・劣化対抗のいずれも構造的に作り込まれた成熟ハーネスである（archived plans に C2/C3 防御・verifier p0-p4・hook 検証ハーネス・test-tamper 防御の設計履歴が残り、各指標が偶然ではなく設計の産物であることを裏付ける）。唯一の非満点は D1（非主流技術の排除宣言の欠落）で、コード生成面が限定的な学習PJでは実害小。**評価スコープの注意**: この高スコアは実効ハーネス（ユーザー層主導）に対するもので、プロジェクト固有層は意図的に薄い — もし「プロジェクトが自前で足した harness」だけを問うなら大半の指標は委譲（—）扱いになり、別の絵になる。この framing 差が本 run（変動幅測定）で最も再現性を揺らしうる判断点である。**検出限界**: 静的解析ゆえ、hook が実際に正しく発火するか・参照ドキュメントの実鮮度・実ワークフローの遂行品質・暗黙知の真の有無は本診断では確認できていない。
