---
date: 2026-05-01
type: validation-log
target: enumerating-verifiable-workflows skill 動作テスト中に検出した zsh null_glob 未設定挙動 + !構文 glob 直書き禁忌の実証
verifier: メインClaude (Opus 4.7) + かもね (人間検証指示)
related_article: .docs/references/pdf/Claude-Codeもう一つの設計層_まさお_2026-03-21.pdf
related_plan: ~/.claude/plans/archived/2026-05-01-multi-agent-plan-b.md
related_skill: [enumerating-verifiable-workflows, red-test-fork, auditing-aio-fork]
related_agent: [team-auditor]
related_log: [.docs/knowledge/subagent-bang-syntax-permission/2026-04-30-permission-deny-fix-validation-result.md]
---

# !構文 glob 直書きが zsh で skill 全停止を引き起こす

> Plan B 動作テストで `enumerating-verifiable-workflows` skill が `ls openapi.* swagger.* ...` の glob で `no matches found` エラーを起こし、skill 全体が即時停止した。**!構文内 glob 直書き禁忌**の実証ログ。修正は `find -name` パターンへの置換で完全解消。

---

## 検証目的

Plan B (マルチエージェント協調ハーネス改良計画) で新設した `enumerating-verifiable-workflows` skill の動作テストを実施し、以下を確認したかった:

1. **!構文 6ブロックの決定論的展開**が想定通り動くか
2. **走査結果から3分類 (Verified/Verifier単独/未着手) + 5軸判定**が機能するか
3. **Write 出力 (`.docs/specs/CURRENT/verifiable-workflows-spec.md`)** が成功するか
4. **Observability セクション (duration / 候補数集計)** が記録されるか

仮説: 「skill は問題なく動作し、レポートが生成される」(positive bias 仮説)。

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `/Users/camone/dev/claude-code/claude-code-learn/cc-playground/260417_Claude-Code-設計層検証/` |
| Shell (Bash tool 経由) | zsh (macOS デフォルト) |
| Claude Code モデル | Opus 4.7 (1M context) |
| 検証セッション | Plan B 完走後の動作テストフェーズ |
| プロジェクト性質 | meta-harness 検証用 (production app ではない、package.json なし) |
| skill 起動方法 | `Skill` tool 経由で `enumerating-verifiable-workflows` 明示呼出 |

## 実測結果サマリ

| 指標 | 自実測 | 期待値 | 一致度 |
|---|---|---|---|
| skill 1回目起動成功 | ❌ (即時停止) | ✅ | ❌ |
| エラー内容 | `Shell command failed for pattern "!ls openapi.* ..."` `[stderr] (eval):1: no matches found: openapi.*` | エラーなし | ❌ |
| 修正後 2回目起動成功 | ✅ | ✅ | ✅ |
| !構文 6ブロック展開 | ✅ 全展開 | ✅ | ✅ |
| 走査範囲 (skills) | 65個 | 全 ~/.claude/skills/ | ✅ |
| 走査範囲 (agents) | 25体 | 全 ~/.claude/agents/ | ✅ |
| Write 出力成功 | ✅ | ✅ | ✅ |
| Duration | 31秒 | < 60秒 | ✅ |

## 各Stage 詳細結果

### Stage 1: 1回目起動 — 即時停止 ❌

**生ログ抜粋**:

```
Shell command failed for pattern "!`ls openapi.* swagger.* lighthouserc.* playwright.config.* axe.config.* 2>/dev/null`":
[stderr] (eval):1: no matches found: openapi.*
```

**観測**:
- !構文の各ブロックが skill 読込時に zsh で eval される
- そのうち1つでも非0 exit すると skill 全体が `Shell command failed` で **即時停止** する
- `2>/dev/null` で stderr 抑制しても、zsh の `nomatch` 例外は **shell の execution error** として扱われ、stderr 抑制で消えない

**学び**:
- !構文は「コマンドが成功する前提」の設計。1個の失敗が skill 全体を巻き込む
- bash は `null_glob` 未設定でも空展開で **警告 + 継続** だが、zsh は `nomatch` で **error exit**。同じ `ls` でも shell 差で挙動激変

### Stage 2: 修正方針確定 + 修正実施

**修正方針**: 該当 !構文を `find -maxdepth N \( -name "..." -o -name "..." \) 2>/dev/null` パターンに置換。

**修正前**:
```bash
!`ls openapi.* swagger.* lighthouserc.* playwright.config.* axe.config.* 2>/dev/null`
!`ls **/*.spec.ts **/*.test.ts 2>/dev/null | head -10`
```

**修正後**:
```bash
!`find . -maxdepth 3 \( -name "openapi.*" -o -name "swagger.*" -o -name "lighthouserc.*" -o -name "playwright.config.*" -o -name "axe.config.*" \) 2>/dev/null | grep -v node_modules | head -20`
!`find . -maxdepth 4 \( -name "*.spec.ts" -o -name "*.test.ts" \) 2>/dev/null | grep -v node_modules | head -10`
```

**ポイント**:
- `find -name` はパターンを **literal 引数** として受け取り shell glob 展開を経由しない → zsh の `nomatch` 例外を回避
- `-o` で複数パターンを1コマンド実行 → 個別 `ls` 並べる必要なし
- `grep -v node_modules` で誤検出ノイズ削減
- `head` で出力サイズ制限

### Stage 3: 修正後 2回目起動 — 完全成功 ✅

**生ログ抜粋** (skill 起動成功確認):

```
### 開始時刻
1777614576

### 既存 skill 一覧 (verifier 系の探索対象)
[65個のSKILL.mdパスがリスト出力]

### 検証可能性シグナルファイル群 (find 使用、zsh glob 失敗回避)
(Bash completed with no output)
./sample-nextjs-vitest/src/lib/formatRelativeTime.test.ts
```

**観測**:
- !構文 6ブロックすべて展開成功
- 後続の Write も問題なく動作 (`.docs/specs/CURRENT/verifiable-workflows-spec.md` 生成)
- Duration 31秒 (Bash で 1777614607 - 1777614576 = 31)

**学び**:
- bug 検出 → 修正 → 再検証 → クリーンの **RGV ループを skill 設計者自身が回せた** = 記事の汎用パターン (spec→implement→verify→adjust) の self-eating dogfood として理想的な実証

## 重要発見

### 発見1: !構文と zsh の組み合わせは glob 直書き禁忌

- !構文は **skill 読込時に zsh で eval** される (Bash tool と同じ shell)
- zsh は `null_glob` がデフォルト無効 → ファイル不在の glob で `nomatch` error exit
- bash の `failglob` 相当を **常時有効** にしてしまっている状態
- → !構文内では **glob 直書き不可**、`find -name` で literal pattern 渡しが安全

### 発見2: stderr 抑制では救えない種類のエラー

- `2>/dev/null` は標準エラー出力を `/dev/null` に流すだけ
- zsh の `nomatch` は shell の execution failure として exit code を非0 にする
- **stderr 抑制 + exit code 非0** の組み合わせ → skill ランタイムは「stderr空 + exit非0」を「Shell command failed」として報告し skill を止める
- `|| true` も付け忘れた今回は完全停止

### 発見3: skill 1個の bug が skill 全体を停止させる脆弱性

- !構文 6ブロック中 5ブロックは正常に展開可能
- だが 1ブロックでも失敗すると **skill 全体が読込段階で停止**
- 部分的成功は許容されない → !構文の信頼性は **全ブロックの最弱リンク** で決まる
- これは「決定論的注入」の対価 = 確定実行ゆえに失敗も確定波及

### 発見4: red-test-fork は同じパターンを既に正しく実装していた

- `red-test-fork/SKILL.md` の !構文は最初から `find -type f -name "*.ts"` パターン使用 (glob 直書きなし)
- 設計者 (過去のかもね) が無意識に正解パターンを採用していた可能性
- 教訓: 既存 skill の正解パターンを **新規 skill 作成時に流用** するチェックリストが有効

## 改善候補

### 短期 (本セッション内で実施可能)

1. **`authoring-skills` skill のチェックリストに glob 禁忌を追加**: A-9 で追加した essence-review checklist の延長として「!構文内 glob 直書き禁止、`find -name` 使用」項目を Quick Reference に追記
2. **既存全 skill の !構文監査**: `grep -E "^!.*\*[a-zA-Z]" ~/.claude/skills/*/SKILL.md` で同種 bug を全ハーネス検索 (今回は新規3 skill のみ確認、既存 skill 未走査)

### 中期 (別 ticket 化推奨)

3. **!構文の防御層自動化**: 全 !構文を `bash -c '...'` ラップで強制 bash 実行する skill harness 改修案 (zsh 依存解消)
4. **!構文ブロック単位 fault-tolerance**: 1個の失敗で skill 全停止しない仕組み (公式 harness 改修待ち)

### 長期 (記事/公式 docs フィードバック候補)

5. **Anthropic への報告**: !構文 spec に「shell glob は literal 引数化推奨」を明記する PR / issue 起票

## ファイル痕跡

- 修正対象 skill: `~/.claude/skills/enumerating-verifiable-workflows/SKILL.md` (該当 !構文 2行を修正)
- 動作テスト出力: `.docs/specs/CURRENT/verifiable-workflows-spec.md` (skill 修正後の生成物)
- 関連修正履歴: 本セッションで Edit 1回 (該当 !構文ブロックのみ)

## 仮説 (要追加検証)

### 仮説1: 他の skill にも同じ bug が潜伏している可能性

- 走査範囲を新規3 skill (本日作成) に限定したため、既存 65 skill 中の glob 直書きは未確認
- 既存 skill が「これまで動いていた」のは「glob にマッチするファイルが偶然存在していた」ケースである可能性
- 別 project (skill にマッチするファイルが無い環境) で起動すると同種 bug が顕在化するかも

### 仮説2: zsh 設定で `null_glob` を有効化すれば回避可能か

- `setopt null_glob` を skill 実行 shell で有効化すれば、空 glob は単に空展開されエラーにならない
- ただし harness 側の shell 設定変更は不可 (settings.json で直接制御不可)
- `~/.zshrc` での global 設定は他コマンドに副作用 (一般的に推奨されない)

### 仮説3: !構文内で `setopt null_glob; ls ...` のように shell オプション切替を埋め込めるか

- 単一行 eval なので可能性あり (`setopt null_glob; ls openapi.* 2>/dev/null` の形)
- ただし可読性低下 + 「glob 使うこと自体が anti-pattern」なので採用しない方針

## 結論

`enumerating-verifiable-workflows` skill の動作テストで **zsh `nomatch` による skill 全停止 bug を1件検出・修正・再検証完了**。`!構文内 glob 直書きは禁忌` を実証データ付きで記録した。修正は `find -name` パターン置換で完全解消。

副次的成果として、記事の汎用パターン (spec→implement→verify→adjust) を **skill 設計者自身が自分の skill に対して 1 ループ回した** ことになり、self-eating dogfood として4要素パターンの有効性を実証。bug 検出から修正完了まで合計 5分以内、確認可能なログ全保存。

将来の skill 作成時には `authoring-skills` の Quick Reference に「!構文内 glob 禁忌、`find -name` 使用」項目を加えるべき (改善候補 #1)。
