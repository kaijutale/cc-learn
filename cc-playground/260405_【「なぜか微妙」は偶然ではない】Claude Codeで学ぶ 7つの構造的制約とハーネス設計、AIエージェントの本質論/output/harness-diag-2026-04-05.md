# Harness Diagnosis: cc-playground/260405

> 評価基準: [diagnosis-rubric](~/.claude/skills/review-harness/diagnosis-rubric.md)
> 診断日: 2026-04-05

## ハーネス構成サマリ

| 項目 | 現状 |
|------|------|
| CLAUDE.md | ユーザーレベル 131行 / プロジェクトレベル 12行 / ポインタ 5件（committer, skills, PDF参照等）/ インライン手順 0件 |
| Permissions | allow 32件 / deny 17件 |
| Hooks | PreToolUse 1件（Bash command guard） / PostToolUse 2件（lint, MCP通知） / Stop 4件（通知+stop words） / PostCompact 3件 / SubagentStop 4件 |
| Skills | 計40+件（辞書型: dq-analogy, boris等 / ワークフロー型: executing-ai-development-workflow, enforcing-strict-tdd-cycle等 / ユーティリティ型: commit, handoff, pickup等） |
| MCP | 5接続（brave-search, firecrawl, context7, chrome-devtools, claude-in-chrome） |
| Memory | 2エントリ（user: 1 / project index: 1） |
| Agents | デフォルトのみ（Agent Teamsフラグ有効） |
| Plugins | 2件有効（ralph-loop@claude-plugins-official, typescript-lsp@claude-plugins-official）/ 1件無効（claude-mem@thedotmack） |

## スコアサマリ

| カテゴリ | 指標 | スコア | 小計 |
|---------|------|--------|------|
| **A. 帯域効率** | A1 ✅ A2 ✅ A3 ✅ A4 ⚠️ A5 ✅ | 9/10 | 90% |
| **B. 検証の堅牢性** | B1 ✅ B2 ⚠️ B3 ✅ B4 ✅ B5 ⚠️ | 8/10 | 80% |
| **C. 権限と信頼境界** | C1 ❌ C2 ✅ C3 ❌ C4 ✅ C5 ⚠️ | 5/10 | 50% |
| **D. 知識と記憶** | D1 ✅ D2 ✅ D3 ⚠️ D4 ⚠️ D5 ✅ | 8/10 | 80% |
| **E. 環境設計** | E1 ⚠️ E2 ✅ E3 ⚠️ E4 ⚠️ E5 ✅ | 7/10 | 70% |
| **総合** | | 37/50 | **74%** |

### グレード: B

基本構造はしっかりしているが、権限と信頼境界に構造的な穴がある。

---

## 検出されたアンチパターン

### C1. 品質のものさし自体が守られているか ❌

**検出事実**: `permissions.deny` にテスト設定（`*.test.ts`, `*.spec.ts`）、lint設定（`.eslintrc*`, `biome.json`）、型チェック設定（`tsconfig.json`）、CI設定（`.github/workflows/*`）の保護が含まれていない。エージェントがこれらのファイルを自由に編集可能。

**影響**: エージェントが「テスト全通過」を報告しても、テスト自体が甘くなるよう改変された可能性を排除できない。品質の「ものさし」がエージェントの手の届く場所にある。

**関連原則**: (→C-5) 報酬ハッキング, (→S-1) 信頼境界を明示的に設計する

**改善案**:
```jsonc
// ~/.claude/settings.json の permissions.deny に追加
"Edit(.eslintrc*)",
"Edit(biome.json)",
"Edit(**/*.test.ts)",
"Edit(**/*.spec.ts)",
"Edit(tsconfig.json)",
"Edit(.github/workflows/*)",
"Edit(vitest.config.*)",
"Edit(jest.config.*)"
```

---

### C3. エージェントが自分のルールを書き換えられないか ❌

**検出事実**: `~/.claude/settings.json` および `.claude/settings.json` がどちらも `permissions.deny` に含まれていない。エージェントが `Edit` でsettings.jsonを編集し、自身のdenyリストを消去できる状態。

**影響**: denyで設定したすべての制約が、エージェントの1回のEdit操作で無効化されうる。鍵のかかった金庫の鍵が机の上に置いてある状態。

**関連原則**: (→C-5) 報酬ハッキング, (→S-1) 評価と実装の権限分離

**改善案**:
```jsonc
// ~/.claude/settings.json の permissions.deny に追加
"Edit(.claude/settings*)",
"Edit(~/.claude/settings*)",
"Write(.claude/settings*)",
"Write(~/.claude/settings*)"
```

---

### C5. 外から入ってくる情報を疑っているか ⚠️

**検出事実**: MCP接続先は信頼できるサービス（brave-search, firecrawl, context7）に限定されている。ただしWebSearch/WebFetchの結果を検疫なくそのまま使用する経路があり、prompt injection対策が明示的ではない。

**影響**: 直接的なリスクは低いが、MCP応答にinjection payloadが含まれた場合の防御層がない。

**関連原則**: (→S-1.1) 記憶の出所と露出先を追跡, (→S-1.4) 防御は伝播停止の段階で評価する

**改善案**: 現時点では信頼できるソース限定のため実害は小さい。外部入力をMemoryに直接保存しない運用を継続すれば十分。

---

### B2. 「完了しました」を鵜呑みにしていないか ⚠️

**検出事実**: 構造検証（PostToolUse Hookでlint/prettier自動実行）はある。hook_stop_wordsで出力品質も監視。しかし機能検証（テスト実行の自動化）がHookに組み込まれていない。テスト実行はエージェントの自主性に依存。

**影響**: lintは通るがテストが壊れている状態を、エージェントが「完了」として報告しうる。

**関連原則**: (→C-4) 自己申告は完了の証拠にならない, (→V-2.1) 観測可能な完了条件

**改善案**: プロジェクトにテストがある場合、StopフックまたはPostToolUseに `npm test` / `pnpm test` の自動実行を追加する。学習プロジェクトでテストがない場合は対象外と判断して良い。

---

### B5. 同じ失敗を二度プロンプトで注意していないか ⚠️

**検出事実**: hook_pre_commandsでcurl/npm/秘密ファイルをHookブロック済み。hook_stop_wordsで推測表現を検知。しかしCLAUDE.mdにはHookで強制可能な内容が自然言語で残っている:
- 「破壊的操作禁止（`reset --hard`,`clean`,`rm`等）」→ denyに昇格済みだが、プロンプトにも残存
- 「`--amend`→依頼時のみ」→ Hook化の余地あり
- 「全体一括置換スクリプト禁止」→ Hook化の余地あり

**影響**: 二重管理。denyで構造的にブロック済みの内容がCLAUDE.mdにも残ると、ルール変更時に片方だけ更新する事故が起きる。

**関連原則**: (→V-1.1) 失敗を仕組みに昇格させる

**改善案**: denyで既にブロック済みの項目をCLAUDE.mdから削除し、代わりに `settings.json参照` のポインタに置き換える。Hook化可能な項目（`--amend`制限等）はhook_pre_commands_rules.jsonに移行する。

---

### A4. エージェントの選択肢が不必要に広がっていないか ⚠️

**検出事実**: ユーザーレベルスキルが40件以上。スキルのdescription一覧がコンテキストに毎セッション展開される。全スキルが自動発動可能な状態。

**影響**: エージェントが毎回40+件のスキルメニューを走査して「どれを発動すべきか」を判断する。判断リソースの一部がスキル選択に消費される。

**関連原則**: (→V-1.3) 選択肢は推論前に絞る, (→C-1.1) コンテキストの能動的管理

**改善案**: 使用頻度の低いスキル（generating-gitignore, prelaunch-seo-shield, nano-banana等）に `disable-model-invocation: true` を設定し、明示的な `/command` でのみ発動するようにする。

---

### D3. セッション間の記憶が腐っていないか ⚠️

**検出事実**: MEMORY.mdは2エントリのみ（インデックス+学習者プロファイル）。エントリの最終更新は2026-03-16（19日前）。エントリ数は少なく整理されているが、学習進捗やプロジェクト固有の知見が記録されていない。

**影響**: 各セッションが「初回」に近い状態で始まる。過去のセッションで得た知見やハマりポイントが引き継がれない。

**関連原則**: (→K-1) 記憶の外部化, (→K-1.1) Restartable Handoff

**改善案**: 学習プロジェクトの場合、handoffスキルで各セッションの学習成果を`.claude/handoff-state.md`に記録する運用を定着させる。

---

### D4. Claudeが知らない技術に丸腰で挑んでいないか ⚠️

**検出事実**: Claude Code自体のスキルAPI（frontmatter仕様、Hook API、Agent Teams通信プロトコル等）はcutoff後の仕様。context7 MCPでライブラリDocは取得可能だが、Claude Code自体のHook/Skills APIのリファレンスはcontext7の対象外。

**影響**: スキル作成時やHook設計時にClaudeが古い仕様で回答するリスク。学習プロジェクトでは特に正確な仕様理解が重要。

**関連原則**: (→C-6) ランタイム辞書パターン, (→C-7) 校正盲

**改善案**: authoring-skillsスキルのreferencesにClaude Code公式ドキュメントの最新版へのポインタを含めるか、boris skillのリファレンスを活用する。既にauthoring-skills/references/にstructure-and-frontmatter.md等があるのは良い設計。

---

### E1. 指示が未知の状況に対応できるか ⚠️

**検出事実**: CLAUDE.mdの多くの指示に理由が付いている（「staging scope保護」のためcommitter使用等）。しかしResponseセクションの一部は理由なし命令形:
- 「敬語・忖度・過大評価・お世辞・罵倒・見下し禁止」
- 「曖昧回答禁止」
理由なし禁止でも、人格設定として文脈上明確なため実害は小さい。

**影響**: 未知の状況での判断材料が不足する場面は限定的。

**関連原則**: (→E-2) ルールより理由で汎化する

**改善案**: 人格設定は理由なし列挙で問題ない（ペルソナは「理由」ではなく「スタイル」の問題）。技術的な禁止事項にのみ理由を補完すればよい。

---

### E3. 自分の作品を自分で採点していないか ⚠️

**検出事実**: executing-ai-development-workflowスキルにreview-workflow.mdがあり、レビュー分離の設計思想は存在する。ralph-loop pluginで反復検証も可能。しかし日常的なコード生成→レビューの分離が `context: fork` 等で構造的に強制されているわけではない。

**影響**: 同一コンテキストでの生成→自己レビューが発生する場面がある。迎合性により自分の出力に甘くなるリスク。

**関連原則**: (→C-3) 迎合性, (→T-1) 関心ごとの分離

**改善案**: 品質が重要なフロー（PR作成前のレビュー等）では、executing-ai-development-workflowのレビューフェーズを活用してサブエージェントに委譲する運用を徹底する。

---

### E4. 時間とともに劣化する力学に対抗しているか ⚠️

**検出事実**: hook_stop_wordsで品質ドリフトを一部検知。review-harnessスキル（本診断）が定期診断の仕組み。しかし以下の劣化対抗策が不在:
- CLAUDE.mdの定期見直しスケジュール
- 使われなくなったスキルの検知
- hook_stop_words_rules.jsonのキーワード更新

**影響**: 時間経過とともにルールが陳腐化し、スキルが肥大化する自然な劣化が進行する。

**関連原則**: (→E-1.1) ドリフトを前提にガベージコレクションする

**改善案**: 月次でreview-harnessを実行する運用と、managing-skillsスキルでスキルの棚卸しを行う運用を組み合わせる。

---

## 強み

1. **秘密管理の3層設計が構造的に優秀**: permissions.deny + sandbox + PreToolUse Hook + receive-secretスキルの4重防御。L1(壁)/L2(地図)/L3(脳)のモデルが明文化されており、各層の責務が明確。

2. **PostToolUse Hookの即時フィードバック設計**: Edit/Write直後のprettier+eslint自動実行と、lint結果のadditionalContextによるコンテキスト返却。検証→修正→再検証のループが構造的に閉じている。

3. **hook_pre_commands + hook_stop_wordsのデータ駆動ガード**: ルールをJSONファイルに外部化し、Hookロジックとルール定義を分離。新ルール追加がJSON編集だけで完結する設計は保守性が高い。

## Quick Wins — 今日できる改善

### 1. settings.jsonの自己保護（5分）

最も爆発半径が大きい穴。denyリスト全体の信頼性に関わる。

```jsonc
// ~/.claude/settings.json の permissions.deny に追加
"Edit(.claude/settings*)",
"Edit(~/.claude/settings*)",
"Write(.claude/settings*)",
"Write(~/.claude/settings*)"
```

### 2. 品質基準ファイルの保護（5分）

```jsonc
// ~/.claude/settings.json の permissions.deny に追加
"Edit(.eslintrc*)",
"Edit(biome.json)",
"Edit(**/*.test.ts)",
"Edit(**/*.spec.ts)",
"Edit(tsconfig.json)",
"Edit(vitest.config.*)",
"Edit(jest.config.*)",
"Edit(.github/workflows/*)"
```

### 3. CLAUDE.mdからdeny重複ルールを削除（10分）

denyで構造的にブロック済みの内容がCLAUDE.mdに自然言語でも書かれている。以下を削除またはポインタに置換:
- 「破壊的操作禁止」→ `※ settings.json deny参照` に置換
- 「`rm`不可」→ deny済みのため削除

### 4. 低頻度スキルの自動発動抑制（15分）

40+件のスキルから使用頻度の低いものを特定し、`disable-model-invocation: true` を設定。候補:
- generating-gitignore
- prelaunch-seo-shield
- nano-banana
- changelog
- auditing-nextjs-security（プロジェクト依存）

## 次のステップ — 中期的な改善

### 1. `--amend` 制限のHook昇格

hook_pre_commands_rules.jsonに `git commit --amend` のガードを追加し、CLAUDE.mdの自然言語ルールから昇格させる:

```json
"amend制御": {
  "match_mode": "regex",
  "commands": ["git\\s+commit\\s+.*--amend"],
  "message": "--amendは明示的な指示がある場合のみ許可",
  "suggestion": "新しいコミットを作成してください"
}
```

### 2. レビューフローの構造的分離

品質重要なフロー（PR前、大規模変更後）で `context: fork` によるレビュー分離を標準化する。executing-ai-development-workflowのレビューフェーズ活用を促すCLAUDE.mdの記述を追加。

### 3. 月次ハーネス診断の定着

`/review-harness` を月初に実行する運用を確立し、スコア推移を追跡する。managing-skillsでスキルの棚卸しも同時に行う。

## 総評

かもねのハーネスは検証ループ（PostToolUse Hook）と秘密管理（3層モデル）が特に成熟しており、「LLMに任せるべきでないことをLLMに任せない」という原則が実践されている。最大の改善ポイントは権限と信頼境界（C領域、50%）で、settings.json自体の保護と品質基準ファイルの保護が未設定。この2つはQuick Win（各5分）で即座に修正可能であり、修正後はCカテゴリが大幅に改善される。なお本診断はファイルベースの静的分析であり、実際のワークフロー品質（スキルの発動頻度、Hookの実効性、暗黙知の存在）は検出限界がある。
