機能名: Q1-Q6ハーネス強化プラン Phase 1-A — orchestrating-team-development に 8+1 Execution Mode 選択を追加

- セッション名: ハーネスエンジニアリング実践知まとめ
- 日付: 2026-04-13 11:24:05
- 概要:
  Q1-Q6 プランの Phase 1-A を実装。`orchestrating-team-development` スキル（L3指揮者）の
  Step 1 を従来の単一質問から **3段階構造（1a Mode選択 / 1b xxDD確認 / 1c 規模確認）** に拡張し、
  タスクの性質を「Execution Mode」として一言で分類できるようにした。
  これにより指揮者が後続 step の skill 構成・並列度・レビュー深度を自動決定できる。

- 実装内容:
  1. `~/.claude/skills/orchestrating-team-development/SKILL.md` を編集（3箇所）:
     - **Step 1 を 3段階構造に拡張**: 1a Execution Mode 選択（9種類の表） / 1b xxDD 起点の確認 / 1c 規模確認
     - **`## Execution Modes` セクション新設**（旧 Step 7 と 判断ポイント の間）:
       Mode / 対象 / skill パイプライン / チーム / レビュー の 6 カラム表 + 選択判断フロー
     - **Reference Navigation 表に execution-modes.md エントリを追加**
  2. `~/.claude/skills/orchestrating-team-development/references/execution-modes.md` を新規作成（290行）:
     - 9 Mode ずつの詳細セクション（対象 / skill パイプライン / チーム / レビュー / 判断基準 / アンチパターン）
     - Mode 間遷移の対応表（Lightning → Sprint 格上げ等）
     - L2 パターン（agent-teams-patterns）との対応表
     - 簡易判断フロー図（ASCII）
     - Gotchas セクション
  3. 検証:
     - `wc -l SKILL.md` = 228 行（500 行制約内）
     - `wc -l execution-modes.md` = 290 行（500 行制約内）
     - `authoring-skills/scripts/quick_validate.py` = "Skill is valid!" で pass

- 設計意図:
  - **Progressive disclosure の厳守**: SKILL.md には **コンパクト表 + 一言説明** のみを置き、
    詳細な skill 選定理由・アンチパターン・Mode 遷移は `references/execution-modes.md` に分離。
    これにより SKILL.md 228 行 / execution-modes.md 290 行 と、両方とも 500 行制約内に収まる。
    同スキルの既存パターン `references/phase-gate-protocol.md` と同じ構造。
  - **「規模別ガイド」表を温存**: Mode と規模は直交ではなく「Mode が規模を示唆する」関係。
    既存の「規模別ガイド」を削除すると既存利用者のメンタルモデルが壊れるため、
    Step 1c で Mode → 規模の示唆関係を示しつつ、詳細確認は既存表へ誘導する設計。
  - **9番目の "Other" で AI 判断の余地を残す**: 8種類に綺麗に収まらないハイブリッドケースに対応。
    AI が状況を読んで「Sprint + UI-First ハイブリッド」等の複合構成を提案する。
    「毎回 Other を選ぶ」アンチパターンも references 側で警告。
  - **xxDD 起点の Mode 連動**: Step 1b で「Mode が xxDD 起点を示唆する」表を置くことで、
    Mode 選択後は追加質問なしで次へ進める。"Other" 時のみ明示確認。UX 最適化。
  - **絵文字採用の判断**: CLAUDE.md では通常絵文字を避ける方針だが、プラン承認段階で
    Mode 名の視覚的識別子として明示的に許可されている。また「コード内コメント絵文字不可」ルールは
    SKILL.md （markdown 文書）には適用されない。Mode 名の認知負荷を下げる効果を優先。

- 副作用:
  - **既存 Workflow Step 2〜Step 7 への影響**: ゼロ。Step 1 の拡張のみで、後続 step のテキスト無変更。
  - **既存の判断ポイント表・規模別ガイド・Gotchas**: 全て無変更で温存。
  - **他スキルへの波及**: orchestrating-team-development を呼び出す側（使う側）は Mode 選択 UI が
    追加されるが、従来の「何を作る？」という自由質問は段階 1a の 9 種類から選ぶ形に変わる。
    慣れ親しんだ自由質問が消える点は UX 変化として要観察。
  - **Mode と xxDD/規模の二重管理リスク**: Mode が xxDD と規模を同時に示唆するため、
    3者の整合性を保つ責任が指揮者側に集約される。未来の Mode 追加時に示唆関係の更新忘れに注意。
  - **references/execution-modes.md の保守負荷**: 290 行の詳細ドキュメントが追加されたため、
    Mode 追加/削除時は本体 SKILL.md と references の両方を同期更新する必要がある。

- 関連ファイル:
  - `/Users/camone/.claude/skills/orchestrating-team-development/SKILL.md` (編集、228 行)
  - `/Users/camone/.claude/skills/orchestrating-team-development/references/execution-modes.md` (新規、290 行)
  - `/Users/camone/.claude/plans/rippling-munching-blanket.md` (参照: プラン定義)

- 関連 Phase:
  - Phase 0 ✅ 完了 (ticket schema 拡張)
  - Phase 1-A ✅ 本 Phase
  - Phase 1-B 🔄 進行中 (installing-hook-presets 新規スキル)
  - Phase 2 ⏳ pending (defining-user-flows + spec-based-development 改修)
  - Phase 3 ⏳ pending (capturing-ui-evidence + linking-ticket-evidence)
  - Phase 4 ⏳ pending (CLI化: spec-validator, flow-to-mermaid, evidence-matcher)
  - Phase 5 ⏳ pending (visualizing-article)
