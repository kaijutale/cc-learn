機能名: ハーネス診断（/review-harness）実行結果と改善方針

- セッション名: harness-diagnostic-review
- 日付: 2026-04-05 15:20:41
- 概要: まさお氏の記事「7つの構造的制約とハーネス設計」を参照しながら、自環境のClaude Codeハーネスを`/review-harness`スキルで診断した。記事の「地図」に対して「GPS」で現在地を確認する作業。
- 実装内容:
  - `/review-harness`を実行し、25のアンチパターン指標で自環境を診断
  - 総合判定: **Bグレード（74%）**

  ### カテゴリ別スコア

  | カテゴリ | スコア | 評価 |
  |---------|--------|------|
  | A. 帯域効率 | 90% | 優秀 |
  | B. 検証の堅牢性 | 80% | 良好 |
  | C. 権限と信頼境界 | **50%** | 最弱リンク |
  | D. 知識と記憶 | 80% | 良好 |
  | E. 環境設計 | 70% | 改善余地あり |

  ### 光っている点
  - 秘密管理の3層設計（permissions.deny + sandbox + PreToolUse Hook + receive-secretスキル）
  - PostToolUse Hookの即時フィードバックループ（lint結果→additionalContext→修正→再検証）
  - Hook rulesのJSON外部化（ロジックとルール定義の分離）

  ### 最大の発見: 権限と信頼境界（C）が最弱リンク
  - **C1**: テスト/lint設定がdenyで保護されていない（ものさしが改変可能）
  - **C3**: settings.json自体がdenyに含まれていない（金庫の鍵が机の上）

  ### Quick Win（各5分で修正可能）
  1. テスト/lint設定ファイルをpermissions.denyに追加 → ものさしの改変を構造的にブロック
  2. settings.json自体をpermissions.denyに追加 → 金庫の鍵を金庫の中へ

  修正後の見込み: Cカテゴリ 50%→90%、総合B→A圏内（80%超）

- 設計意図: 記事が提唱する「構造理解→仕組みで対処」のアプローチを実践。対症療法（プロンプト書き直し）ではなく、ハーネス構成そのものを診断・改善することで、全セッションに横断的に効く改善を目指す。
- 副作用: Quick Winの修正を行うと、以降settings.jsonやlint設定を変更する際にpermissions.denyの一時解除が必要になる。ただしこれは意図された摩擦（構造的ガードレール）。
- 関連ファイル:
  - `.docs/references/pdf/screencapture-note-masa-wunder-n-n4aca70992988-2026-04-05-12_48_28.pdf`（参照記事PDF）
  - `~/.claude/settings.json`（グローバル設定 — Quick Win修正対象）
  - `~/.claude/CLAUDE.md`（グローバル指示書）
