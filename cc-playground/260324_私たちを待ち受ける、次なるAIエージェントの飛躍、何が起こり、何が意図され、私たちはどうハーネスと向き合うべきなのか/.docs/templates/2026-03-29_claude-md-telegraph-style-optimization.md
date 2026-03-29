機能名: CLAUDE.md電報スタイル最適化 + steipete AGENTS.MD実物比較

- セッション名: N/A
- 日付: 2026-03-29 09:51:18
- 概要: steipeteのAGENTS.MDが実践する「電報スタイル」をかもねのグローバルCLAUDE.md（`~/.claude/CLAUDE.md`）に本格適用。steipete AGENTS.MD実物（GitHub最新版）を取得・比較し、不足要素の有無を判断した上で電報スタイル化を完遂した。
- 実装内容:
  - **第1フェーズ: 初回電報スタイル化**
    - 135行→112行に圧縮（-17%）、セクション数18→14（-22%）
    - 主な手法:
      1. セクション統合: ペルソナ/性格/口調/応答スタイル/叫べ/禁止ルール（6セクション）→ Persona + Response（2セクション）
      2. 矢印記法(→)統一: 条件→結果パターンの助詞（は/を/に/が）を削減
      3. 名詞句化: フルセンテンスを名詞句に圧縮（例:「困っている人を放っておけない、とにかく優しく穏やかな心の持ち主の癒し手」→「謙虚・慈愛・癒し手」）
  - **第2フェーズ: steipete AGENTS.MD実物取得・比較**
    - `https://raw.githubusercontent.com/steipete/agent-scripts/main/AGENTS.MD` をFirecrawl MCPで取得
    - steipeteファイルは約140行だが半分以上がツール固有ドキュメント（bird/sonoscli/peekaboo/axe等）。ルール部分のみ抽出するとかもねのファイルと同等の密度・カバレッジ
    - steipeteにあってかもねに不足していた要素: **スタイル宣言のみ**
      - `Work style: telegraph; noun-phrases ok; drop grammar; min tokens.`（ファイル冒頭）
      - `Style: telegraph. Drop filler/grammar. Min tokens (global AGENTS + replies).`（Agent Protocol内で強調）
    - steipeteにあって追加不要と判断した要素:
      - ツール固有docs（bird/sonos/peekaboo/axe/committer等）→ 個人環境
      - SSH/リモート機/macOS TCC署名 → 該当なし
      - `min tokens (replies)` → セーニャ口調（Persona）と矛盾
  - **第3フェーズ: 最終調整**
    - スタイル宣言を行4に追加: `Work style: telegraph; noun-phrases ok; drop grammar; min tokens.`
    - Response禁止ルール2行→1行に統合: `敬語・忖度・過大評価・お世辞・罵倒・見下し禁止`
    - frontend_aestheticsセクションの電報化（空行削減、冗長表現除去）
- 設計意図:
  - **スタイル宣言は「メタ指示」**: ファイル冒頭に置くことで、LLMが残り全体を正しい粒度で解釈する土台になる。steipeteはこれをファイルの2行目に配置しており、同じ戦略を採用
  - **レスポンスと文書の使い分け**: steipeteは `min tokens (global AGENTS + replies)` でレスポンスも電報化。かもねはPersonaルール（セーニャ口調）があるため、ファイルの書き方のみ電報化し、レスポンスはPersona準拠とする使い分けを設計
  - **追加しない判断の根拠**: steipeteのファイルの半分以上は彼個人のmacOS開発環境ツール群。これらはグローバルCLAUDE.mdに入れる性質のものではなく、プロジェクト固有CLAUDE.mdやMCP設定で管理すべき
- 副作用:
  - `~/.claude/CLAUDE.md` が135行→112行に縮小。全ルールの意味は保持
  - 見出し名が日本語→英語短縮形に変更（例:「ツール優先順位」→「Tools」「マルチエージェント安全規約」→「Multi-Agent Safety」）。将来の手動編集時に認識しにくくなる可能性はあるが、電報スタイル宣言の存在により意図は明確
  - `Work style: telegraph` 宣言により、LLMがCLAUDE.mdを自動編集する際に電報スタイルが維持される（保護効果）
- 関連ファイル:
  - 変更: `~/.claude/CLAUDE.md`（全体電報スタイル化 + スタイル宣言追加）
  - 参照: steipete AGENTS.MD（GitHub最新版 `https://github.com/steipete/agent-scripts/blob/main/AGENTS.MD`）
  - 参照: `.docs/references/steipete-SAMPLE-AGENTS.MD`（ローカルコピー）
  - 過去ログ: `.docs/templates/2026-03-29_l1-multi-agent-safety-deep-dive.md`
  - 過去ログ: `.docs/templates/2026-03-27_steipete-agents-md-analysis.md`
  - 過去ログ: `.docs/templates/2026-03-26_claude-md-update-from-agents-md.md`
