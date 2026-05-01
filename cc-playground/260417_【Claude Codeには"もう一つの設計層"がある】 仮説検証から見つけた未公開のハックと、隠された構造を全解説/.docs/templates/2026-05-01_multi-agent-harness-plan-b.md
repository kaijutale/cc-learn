---
feature: multi-agent-harness-plan-b
session: Plan B 実装完走 (essence-review 9件 + verifier-driven workflow 横展開 4件)
date: 2026-05-01 14:51:52
---

# Multi-Agent Harness Plan B 実装

## 概要

note記事「Claude Codeにはもう一つの設計層がある」が示す汎用パターン (spec→implement→verify→adjust の4要素) を、TDD 以外の領域にも横展開するための skill/agent ハーネス改良計画 (Plan B) を完走した。

並走する2つの問題に同時着手:

1. **既存マルチエージェント協調ハーネスの構造欠陥** (review-agent-essence で発見10件)
2. **記事の汎用パターン横展開の仕組みの不在** (洗い出しメタskill未構築 / audit系の verifier単独止まり)

これらを 1 plan にまとめて実装し、「修正本体」と「方向性の機械化」を同時達成した。

## 実装内容

### カテゴリA: essence-review 修正 9件 (既存ハーネス品質改良)

| # | 重要度 | 内容 | 対象ファイル |
|---|---|---|---|
| A-1 | Critical | debate path race 解消 ($WORK_DIR 絶対パス化) | coder.md L121-310 (7箇所) |
| A-2 | Critical | behavior_oracle 機械判定明記 (Step 5.5 サブステップ追加) | orchestrating-team-development/SKILL.md L184 |
| A-3 | Major | last_adjust_diff_significant ヘルパー定義追加 (校正盲対策) | coder.md L269-302 |
| A-4 | Major | Step 7 統合主体明記 (T-2.3 違反防止) | orchestrating-team-development/SKILL.md L207 |
| A-5 | Major | やらないこと12項目に理由付与 (E-2 ルールより理由で汎化) | coder.md L289-302 (全12項目) |
| A-6 | Major | サーキットブレーカー追加 (LLM debate 暴走防止) | coder.md L157-162, L174-188 |
| A-7 | Minor | spec path 優先順明文化 (3候補 fallback) | coder.md L51-58 |
| A-8 | Minor | Agent 定義容量メタルール追加 (400行以内) | authoring-skills/SKILL.md Progressive Disclosure |
| A-9 | Minor | essence-review checklist 追加 | authoring-skills/SKILL.md Quick Reference |

### カテゴリB: メタskill 新設 1件 (洗い出しの機械化)

- **enumerating-verifiable-workflows** (新規 skill): プロジェクト走査 + 5軸客観判定 (exit code/diff/構造化出力/spec化可能性/自動retry安全性) で「verifier 化候補」を機械列挙。出力先 `.docs/specs/CURRENT/verifiable-workflows-spec.md` (spec 系統、後続 ticket 化自動接続)。
- 型紙: `find-skills` (辞書型) + `review-harness` (multi-phase) のハイブリッド

### カテゴリC: audit fork化 3件 (TDD 以外への横展開実物)

- **team-auditor** (新規 agent): audit 専任 grandchild。tools 制限 (Read/Grep/Glob/Bash のみ、Edit/Write/Skill 非装備で構造保証)、skills プリロード (auditing-aio + auditing-nextjs-security)
- **auditing-aio-fork** (新規 skill): AIO 監査の fork化。Verdict 決定論判定 (Critical=NO-GO 機械決定)
- **auditing-nextjs-security-fork** (新規 skill): Next.js セキュリティ監査の **部分fork化**。env/import系の機械修正可能領域と Server Action 認証の人判断必須領域を `fix_classification` フィールドで構造化分離

### 動作テスト 1件 (RGV ループ実証)

- enumerating-verifiable-workflows skill を実プロジェクトで起動 → bug 1件検出 (zsh `no matches found: openapi.*`) → glob 直書きを `find` に修正 → 再起動 → 動作 OK
- 検出/修正/再検証ループを skill 設計者自身が回した = self-eating dogfood として4要素パターンを実証

## 設計意図

### なぜ Plan B (中規模) を選んだか

事前に Plan A (最小、2.25日) / Plan B (標準、7.75日) / Plan C (完全、18日) の3規模を提示。Plan C は「最大」だが「最強」ではない (YAGNI 違反 / 自己参照ループ順序逆転 / メンテ負荷線形増加) と分析し、ユーザーが Plan B を選択。記事達成 100% + α-1〜α-5 ほぼ全達成を最小コストで実現する選択。

### なぜ team-auditor を新設し既存 code-reviewer を流用しなかったか

audit 観点は「verifier 専任」で実装/テスト/レビューと責務独立 → 専門 agent 化が SoC に合致。code-reviewer 流用は role/責務混濁リスク (S-1 信頼境界の希釈)。

### なぜ Phase A 出力先を knowledge ではなく spec 系統にしたか

ユーザー判断で `.docs/specs/CURRENT/verifiable-workflows-spec.md` (spec 系統) を選択。理由: 後続 ticket 化が spec-based-development → ticket 生成で自動接続できる。knowledge 系 (観測ログ扱い) ではなく **計画起点** であることを明示。

### なぜ A-1 で feature名込みパス案 (案B) ではなく $WORK_DIR 絶対パス化 (案A) を採ったか

案B (feature名込みパス) は llm-debate skill 側の固定パス読込 `!cat .docs/debate/CURRENT/topic.md` を全面改修必要。案A は coder.md 側の修正のみで完結し、llm-debate skill 側は cwd 継承を信頼するだけで動く (改修不要)。互換性破壊コストが圧倒的に低い案を選択。

### なぜ team-auditor に Skill ツールを装備しなかったか

team-* 全員 (tester/implementer/reviewer/documenter/ui-designer) が L0 (孫レイヤー) で Skill 非装備の標準パターンに従った。理由は無限再帰防止 + コスト爆発防止 + 観測不能化防止。記事の「Skill 経由なら多段呼出許容」は技術的可能性で、設計判断としては「明示的に定義された範囲」を L0 で止める方針。

## 副作用

### 想定済リスク (Plan で言及)

- `$WORK_DIR` 化で fork skill 側の !構文が壊れる懸念 → llm-debate skill 側は変更不要 (cwd継承を信頼) で回避
- サーキットブレーカー過敏で Phase 2 評価不可 → ENV `COODER_DEBATE_BREAKER_DISABLE=1` で無効化可能
- team-auditor 新設で agent 数増加 (5→6) → three-elements-harness opus_fixation_validity への影響軽微 (KPI 上)

### 動作テストで検出した実 bug 1件

- **zsh の null_glob 未設定挙動**: !構文内の `ls openapi.*` で空マッチ時に `no matches found` で skill 全体が止まる。修正済 (`find -name` パターンに変更)。
- **将来の skill 作成チェックリスト追加候補**: 「!構文内の glob は find 経由」を A-9 で追加した essence-review checklist の延長に追記すべき。

### 未対応 (本 plan 範囲外)

- A-10 自動トリガー (CLAUDE.md への「skill/agent改訂時の自動 essence-review」セクション追加) は別 ticket化推奨
- enumerating-verifiable-workflows が走査結果に自分自身を含めたが 5軸判定対象には入れなかった点 → メタスキル特性として skill 本文に明記する余地あり

## 関連ファイル

### 既存ファイル (修正)
- `~/.claude/agents/coder.md` (303 → 約385行) — A-1, A-3, A-5, A-6, A-7
- `~/.claude/skills/orchestrating-team-development/SKILL.md` (282 → 約310行) — A-2, A-4
- `~/.claude/skills/authoring-skills/SKILL.md` (+3行) — A-8, A-9

### 新規ファイル (作成)
- `~/.claude/skills/enumerating-verifiable-workflows/SKILL.md` — B-1 (約190行)
- `~/.claude/agents/team-auditor.md` — C-0 (約80行)
- `~/.claude/skills/auditing-aio-fork/SKILL.md` — C-1 (約140行)
- `~/.claude/skills/auditing-nextjs-security-fork/SKILL.md` — C-2 (約180行)

### 出力ファイル (動作テスト成果物)
- `.docs/specs/CURRENT/verifiable-workflows-spec.md` — enumerating-verifiable-workflows 実行結果

### Plan ファイル (archived)
- `~/.claude/plans/archived/2026-05-01-multi-agent-plan-b.md` — Plan B 全文 (status: completed)

### 参照型紙 (流用元)
- `~/.claude/skills/red-test-fork/SKILL.md` — Phase B fork skill テンプレート
- `~/.claude/skills/find-skills/SKILL.md` — Phase A メタskill 辞書型テンプレ
- `~/.claude/skills/review-harness/SKILL.md` — Phase A multi-phase rubric テンプレ
