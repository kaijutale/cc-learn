機能名: establishing-knowledge-persistence スキル アップグレード

- セッション名: Lv2知識永続化スキル — note記事準拠アップグレード
- 日付: 2026-04-06
- 概要: establishing-knowledge-persistenceスキルが元のnote記事PDFに依存しており、PDFを参照できないセッションではLv2の意味や設計根拠が曖昧だった問題を解消。PDFから本質的な概念をreferencesに抽出し、スキルを自己完結させた。同時に、note記事にない独自拡張（decisions/ADR、設計根拠という表現）を発見・除去し、原典に忠実な構造に修正した。
- 実装内容:
  - **新規作成:**
    - `references/harness-maturity-model.md` — Lv0〜6の完全定義、飛び級不可の根拠、自己診断チェックリスト
    - `references/why-persistence-works.md` — 核心テーゼ、外部記憶概念、Agentic Search成熟、コンテキストロスト=機能、収束値をはがす
  - **既存更新:**
    - `SKILL.md` — Lv2の位置づけ追加、referencesへのポインタ、トリガーワード追加
    - `references/xxdd-integration.md` — 外部記憶概念追加、Agentic Search節拡充、テストファースト根拠追加
    - `references/knowledge-categories.md` — Agentic Search的発見性、エージェント間通信プロトコル追加
  - **原典準拠の修正:**
    - `decisions/`（ADR）を全ファイルから削除 — note記事に存在しない概念だった
    - `design/` → `design-deliverables/` にリネーム — Agentic Searchの「ファイル名から目的が自明」原則に準拠
    - 「設計根拠」→「ガイド文書」に修正 — note記事の表現に統一
    - ガイド文書の定義を明確化 — 「仕様にもデザインにも収まらない背景知識・方針・判断根拠」（note記事に定義がなかったため、文脈から推測して定義）
- 設計意図:
  - 「本質のコピー」の精度向上。スキル作成時に混入していた独自拡張（decisions/ADR、設計根拠という用語）を除去し、note記事のLv2定義「仕様書・デザイン成果物・ガイド文書」に完全一致させた
  - スキルの自己完結性を確保。PDFがなくても「Lv2とは何か」「なぜこの構造なのか」「なぜ飛び級できないのか」がスキル内で理解できる
  - 段階的開示の維持。SKILL.md自体は短く保ち、詳細はreferencesへのポインタで必要時に参照する設計
- 副作用:
  - 既にこのスキルで構築済みのプロジェクトがある場合、`.docs/decisions/`ディレクトリは今後のスキャフォールドでは生成されなくなる。既存のdecisions/は残るが、新規プロジェクトでは作成されない
  - `design/` → `design-deliverables/`のリネームも同様。既存プロジェクトのdesign/は影響を受けない
- 関連ファイル:
  - `~/.claude/skills/establishing-knowledge-persistence/SKILL.md`
  - `~/.claude/skills/establishing-knowledge-persistence/references/harness-maturity-model.md` (NEW)
  - `~/.claude/skills/establishing-knowledge-persistence/references/why-persistence-works.md` (NEW)
  - `~/.claude/skills/establishing-knowledge-persistence/references/knowledge-categories.md`
  - `~/.claude/skills/establishing-knowledge-persistence/references/xxdd-integration.md`
  - `.docs/references/pdf/next-ai-agent-leap-and-harness.pdf` (元記事・参照元)

## 議論の経緯

かもねとの議論で以下の修正が段階的に行われた：

1. **PDF依存の発見と解消**: スキルが「Lv2」という用語を使いながら、Lv0〜6の全体像がスキル内にない問題を指摘。PDFから本質を抽出した2つのreferenceファイルを新規作成
2. **decisions/の削除**: note記事にdecisionsやADRという言葉が一切出てこないことをかもねが指摘。「なぜAではなくBを選んだか」は本質的にguides/（WHY）の領域であり、独立ディレクトリは不要と判断
3. **design/ → design-deliverables/**: `design/`だとguides/の設計根拠と混同しうるため、Agentic Searchの「ファイル名から目的が自明」原則に従いリネーム
4. **「設計根拠」→「ガイド文書」**: note記事の表現に統一。スキル作成時の独自解釈を除去
5. **ガイド文書の定義**: note記事に定義がないことを確認した上で、PDFの文脈（暗黙知の明示化、収束値をはがす3アプローチの「専門知識の注入」）から推測して定義。「仕様にもデザインにも収まらない背景知識・方針・判断根拠」

## 最終的なディレクトリ構造

```
.docs/
├── specs/                      ← WHAT: 何を作るか（仕様書）
│   └── design-deliverables/    ← HOW IT LOOKS: どう見えるか（デザイン成果物）
└── guides/                     ← WHY+背景: 仕様にもデザインにも収まらない背景知識・方針（ガイド文書）
```

note記事のLv2定義「仕様書・デザイン成果物・ガイド文書」に完全一致。

## 学び

- **「本質のコピー」を自称しながら独自拡張を混入させていた矛盾**: decisions/ADRは一般的なエンジニアリングプラクティスとしては有用だが、このスキルの根拠であるnote記事には含まれていない。原典にない概念を勝手に追加するのは「本質のコピー」ではなく「自分の解釈の付加」
- **原典の表現を尊重する重要性**: 「設計根拠」「アーキテクチャの根拠」はスキル作成時の独自表現。note記事は「ガイド文書」としか書いていない。原典にない言い換えは意味のズレを生む
- **定義がない用語は明示的に「推測」と示す**: ガイド文書の定義はnote記事に存在しない。文脈から推測して定義したことを明示した
