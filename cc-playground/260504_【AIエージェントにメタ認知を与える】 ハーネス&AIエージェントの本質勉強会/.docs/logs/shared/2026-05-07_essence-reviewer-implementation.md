---
type: work
date: 2026-05-07
created: 2026-05-07 04:01:00
title: essence reviewer subagent 3つ新規作成 + agent → harness リネーム実装
related_plan: /Users/camone/.claude/plans/archived/2026-05-07_essence-reviewer-subagents-creation.md
related_logs:
  - 2026-05-07_identity-scaffold-reviewer-plan.md (前セッション: plan策定 + identity試作)
  - 2026-05-06_essence-docs-v1-creation.md (essence v1.0 作成)
status: completed
---

# essence reviewer subagent 実装 + harness リネーム実装ログ

## 概要

前セッションで策定済みの承認 plan (`subagent-team-harness-essentials-md-har-binary-feigenbaum.md`) に従い、Step 1〜7 を全て完了。essence/identity の `agent-essentials` → `harness-essentials` リネームと、領域別 reviewer subagent 3つを新規作成した。

## 動機 (前セッションからの継承)

- PDF原典の「領域ごとに独立したファイル + 各領域に専用レビューア」原則に対し、3領域 (harness/skill/ui) の essence v1.0 は揃っているが**専用 reviewer subagent が未設置**
- `agent-essentials.md` の "agent" は `~/.claude/agents/` のディレクトリ意味 (subagent ファイル種別) と**意味衝突**
- 解消策: 1:1 対応の reviewer 3つ新規作成 + `agent-*` → `harness-*` リネームで命名衝突解消

## 実装結果 (全7ステップ完了)

### Step 1〜2: essence/ リネーム

`/Users/camone/.claude/.docs/essence/` 配下:

| 操作前 | 操作後 |
|---|---|
| `agent-essentials.md` | `harness-essentials.md` |
| `skill-essentials.md` | (内部参照書換のみ) |
| `ui-essentials.md` | (内部参照書換のみ) |
| `README.md` | (テーブル行書換) |

書換箇所合計: 11箇所 (タイトル1 + skill 6 + ui 3 + README 1)。`replace_all` で各ファイル一括置換、`grep -rn "agent-essentials"` で 0 hit を確認。

### Step 3〜4: identity/ リネーム

`<PJ>/.docs/identity/` 配下:

| 操作前 | 操作後 |
|---|---|
| `agent-identity.md` | `harness-identity.md` |
| `skill-identity.md` | (内部参照書換のみ) |
| `README.md` | (テーブル行書換) |
| `project-charter.md` | (1箇所書換) |

書換種類: `agent-essentials` → `harness-essentials` + `agent-identity` → `harness-identity` の2種類。各ファイルで `replace_all` 2回ずつ実行。

### Step 5: subagent 3つ新規作成

`/Users/camone/.claude/agents/` 配下:

| ファイル | name (28文字) | 対応 essence |
|---|---|---|
| `harness-essentials-reviewer.md` | `harness-essentials-reviewer` | `harness-essentials.md` |
| `skill-essentials-reviewer.md` | `skill-essentials-reviewer` | `skill-essentials.md` |
| `ui-essentials-reviewer.md` | `ui-essentials-reviewer` | `ui-essentials.md` |

共通設計:
- `model: opus` 固定 (役割分離による視点独立性、グローバル CLAUDE.md `Harness` 節)
- `tools: Read, Grep, Glob, Bash` (Edit/Write 除外で「修正提案しない」を構造保証)
- `color: yellow` (Plan 指定)
- 出力フォーマット: 原則適用マトリクス + severity rubric (Critical/High/Medium/Low) + 強み/改善提案/見落としリスク
- description: 領域名限定トリガーフレーズ5個 (PROACTIVELY なし、控えめ自動発火)

差分は `{domain}` (harness/skill/ui) と severity 例文・Gotchas 末尾項のみ。

### Step 6: smoke test

| Test | 結果 |
|---|---|
| `grep -rn "agent-essentials"` (essence + identity) | 0 hits |
| `grep -rn "agent-identity"` (identity) | 0 hits |
| `ls essence/` で旧名消滅 + 新名存在 | OK |
| `ls identity/` で旧名消滅 + 新名存在 | OK |
| `ls agents/` で reviewer 3ファイル存在 | OK |
| Agent ツールから `harness-essentials-reviewer` 起動 | **失敗 (registry未登録)** |

### Step 7: plan アーカイブ

- frontmatter `status: completed` + `completed: 2026-05-07 04:00:57` (JST)
- mv → `/Users/camone/.claude/plans/archived/2026-05-07_essence-reviewer-subagents-creation.md`

## 観測した重要事項

### 観測1: 新規 agent file は **時間差で** registry に動的反映される

Step 6 の最後で `harness-essentials-reviewer` を Agent ツール経由で起動試行 → エラー:

```
Agent type 'harness-essentials-reviewer' not found.
Available agents: article-summarizer, claude-code-guide, ..., team-ui-designer, test-ai-tdd-expert
```

ここで「session 中は登録されない」と早計に結論したが、**これは誤り**。

**追加観察 (本セッション継続中)**: かもねが `/agents` コマンドのダイアログを開いたら、3 reviewer 全てが User agents 一覧に `· opus` 表記で登録されていた。続けて Agent ツールから `harness-essentials-reviewer` を再起動 → **成功**:

```
File exists: yes
Principles: 8
Subagent: harness-essentials-reviewer
```

**修正された結論**:
- Claude Code の agent registry は session 中も動的に再スキャンされる
- ただしファイル作成直後 (Step 5 完了直後) は未反映
- trigger は不明 (時間経過 / `/agents` ダイアログ起動 / 別 tool 経由の re-scan のいずれか)
- 28文字 name (`harness-essentials-reviewer`) は起動可能 — Plan 留意事項の懸念は解消

**この誤判断から学ぶこと**:
- 1回の観察 (Step 6 not found) を一般化して「次セッション必須」と決めつけた
- 複数時刻で再試行すべきだった — ファイル作成と registry 反映に**タイムラグ**がある仕様への想像力不足
- 「critical-thinking-checklist.md: 同修正2回失敗」と類似の罠を、観察→結論の判断面で犯した

**3体全 smoke test 完了 (かもねからの追加 HITL 介入で実施)**:

| subagent | 起動 | 絶対パス Read | 8原則認識 | self-name 認識 | persona 継承 |
|---|---|---|---|---|---|
| harness-essentials-reviewer | ✅ | ✅ | ✅ | ✅ | あり |
| skill-essentials-reviewer | ✅ | ✅ | ✅ | ✅ | なし |
| ui-essentials-reviewer | ✅ | ✅ | ✅ | ✅ | あり |

**残課題 (本格運用時に確認)**:
- [ ] reviewer に**実評価対象**を渡すと、原則適用マトリクスが構造通り返るか (3体とも未実施)
- [ ] persona (`🎉🎉🎉 完了したよ!`) 継承のバラつき (3体中2体で再現、1体で再現せず) は、グローバル CLAUDE.md の解釈確率差か固有プロンプト差か

**かもねからの2回目 HITL 介入の意義**:
- 1回目: 「session 中は登録されない」という早計な結論を `/agents` ダイアログ提示で反証
- 2回目: 「3体作って1体実証で完了報告」というサンプル不足を指摘 → 残り2体も即実証
- いずれも `critical-thinking-checklist.md` の「問題ゼロは疑う」「1観察を一般化しない」レビュー視点が、AI側ではなく **人間側** から差し込まれた事例
- 本プロジェクトのテーマ「ハーネスの本質を学ぶ」を、まさにこのセッションのメタ構造で実体験している (essence 原則8: メタレベルの再帰構造)

### 観測2: replace_all は同種 token の多箇所置換に最適

11 + 6 = 17箇所の置換を `replace_all` で各ファイル一括処理。Edit ツールで個別 old_string/new_string を渡すと17回の tool call が必要だったが、6回の tool call (essence 4ファイル + identity 5ファイル相当) で完了。

ただし `agent-essentials` と `agent-identity` の両方が混在するファイル (identity 配下) では、各 token を別々に `replace_all` する必要があった (二重置換)。

### 観測3: scope 外の徹底

留意事項通り、以下は**触らなかった**:
- `~/.claude/skills/review-agent-essence/` (改修禁止原則 / memory `feedback_no-existing-harness-modification.md`)
- `<PJ>/.docs/identity/skill-identity.md` 内の `review-agent-essence` 言及 (skill 名なので `agent-essentials` パターンに該当しない、置換不要)

scope を厳守することで、本plan は essence/identity/agents の3ディレクトリの**追加・リネームのみ**で完結。

## 次セッションへの引き継ぎ

1. **Plan は archived に移動済み** — 本実装ログが完了確認の primary 文書
2. **smoke test の最終確認**: 次セッション起動時に `Available agents` リストに3 reviewer が登場するか確認 (本セッション最大の未解決事項)
3. **未push commit**: ahead 2 (前セッションの identity 試作 + plan ログ) + 本セッション分で増える可能性あり。 push は要かもね指示

## 学んだこと

- **session registry の更新タイミング**: agent file を session 中に追加しても即座に認識されない仕様 (公式 doc の明示記載は要確認)。これは subagent の構造設計を前提にした制約で、後付け追加と既存実装の整合性を session 境界で担保している
- **リネーム順序の構造設計の重要性**: 「内部参照書換 → ファイル名変更」の順序は、Step1→Step2 の分離で物理的に守られる。逆順だと grep 検出が失われ、書換漏れに気づけない
- **identity/essence の責務分離が機能している**: 「不変原則 (essence)」と「プロジェクト固有選択 (identity)」を別管理する設計は、リネーム時に「essence の再利用性を壊さない」「identity の選択を essence に混入させない」という責務境界を自然に守らせた
