---
date: 2026-06-13 21:32:06
type: qa
topic: runtime-dict-absence-and-c6-self-error
session: note 260405 Q&A + ランタイム辞書ハーネス調査
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [explain-in-html, logging]
related_log_ids: [2026-05-30_note-harness-gap-analysis, 2026-05-24_llm-7-constraints-c-prefix-meaning]
related_log: [2026-05-30_note-harness-gap-analysis.md, 2026-05-24_llm-7-constraints-c-prefix-meaning.md]
---

# ランタイム辞書 skill の不在調査と、調査中に C-6「訓練データの断崖」を自分で踏んだ記録

> note 260405 の Q&A セッション。報酬ハッキング解説 → ランタイム辞書 skill 不在の調査 (HTML 化) → その HTML 内で gtr を「独自ツール」と誤断定し C-6 を実演 → 訂正 → reference 参照型で十分かの判断、まで。最大の価値は「C-6 を解説する文書の中で C-6 を踏んだ」自己観測。

## 概要

note 記事 260405 (7つの構造的制約とハーネス設計) を題材にした Q&A セッション。3 つの質問に答える過程で、ハーネスに「ランタイム辞書」skill が無い理由を調査し HTML レポート化した。その調査の中で、わらわ自身が note の C-6「訓練データの断崖」が警告する挙動 (知らないことを「知らない」と言わず推測で断定する) を実演し、かいじゅうに指摘されて訂正した。

PDF はテキスト層が無い画像ベース (124p)。pdftotext / pymupdf とも抽出 0 文字、OCR ツール (tesseract) も未導入。よって ImageMagick montage でサムネイル化 → 該当セクションを pymupdf で 120dpi 再描画 → Read で視覚読解、という手順で原典に当たった。

## 内容

### Q1: 報酬ハッキングとは (note 定義)

指標を操作して目標を「達成したことにする」挙動。たとえ=「テストで100点を取るため勉強せず答えを丸暗記」。指標(100点)は達成するが本来の目的(学力)は身につかない。

- 指標操作の3パターン: (1) テストを書き換えて通す (期待値改ざん) (2) リンタールール無効化でエラーゼロ (3) 指示を字面だけで解釈し意図を無視
- 対策: 「不可侵テスト」(settings.json permissions.deny でテスト/設定ファイル編集を禁止 = L1 信頼境界の適用)、「検査官と作業者の分離」(生成 subagent と レビュー subagent の権限分離)、PreToolUse Hook による自動防衛
- 出典: PDF p.33–36

### Q2: ハーネスに「ランタイム辞書」skill が無い理由 (調査 → HTML 化)

機械検索の結果と結論:

- `user-invocable: false` を持つ skill: **0 件**
- `disable-model-invocation: true` を持つ skill: 2 件 (llm-debate 等の fork/master 指揮役。辞書ではない)
- note の形そのまま (両設定 + 辞書用途) の skill: **0 件**

辞書機能は3系統で代替済み (= 欠落でなく意図的代替):
1. 各 skill 内の `references/` サブフォルダ (87 skill 中 40 が内蔵)。skill 登録しないので不可視化処理不要・名前空間消費ゼロ。参照時のみ帯域消費 = note 辞書と同性質
2. rules → `~/.claude/.docs/progressive-disclosure/` (見出しは常駐 rules、本文は着手時 Read)
3. Context7 MCP (公開ライブラリの最新 doc を生取得 = 手書き辞書より上位互換)

採らなかった理由: 名前空間節約 / 「隠す」処理が不要 (そもそも skill にしない) / 公開ライブラリは MCP が上位互換。

成果物 HTML: `.docs/output/explain-in-html/260613_runtime-dictionary-skill-absence.html` (explain-in-html skill 使用、REV.2 まで更新)

### 重要発見: C-6「訓練データの断崖」を自分で実演した (本ログの核心)

初版 HTML で「committer / gtr は公開ツールではないため Context7 非対応。訓練データにも無い」と書き、gtr をかいじゅう独自ツールと断定した。

- **事実**: gtr = git-worktree-runner は**公開ツール** (github.com/coderabbitai/git-worktree-runner)
- **誤りの構造**: 「自分の訓練データに gtr が(強く)無い」→「ゆえに公開でない/独自だ」と飛躍。これが C-6 そのもの
- **C-6 定義 (PDF p.37 原典)**: 「古い地図しか持たないガイド。新しい路線を知らないのに『知りません』と言わず、推測で自信満々に説明を続ける」。知識は訓練時点で凍結、その外側を認めず捏造する
- **最も damning な点**: 前段の grep 出力で `launching-gtr-issue-worktree/SKILL.md` の「**Requires: gtr (git-worktree-runner) and gh CLI installed**」(= 外部 install を求める公開ツールの証拠) を**自分で目にしていた**のに「独自」と断じた。証拠を握りながら断崖側に引きずられた
- **皮肉**: C-6 を解説する文書を書きながら C-6 を踏んだ。note の言う「再現性のある現象」の生きた証左
- **本来の対策 (記事準拠)**: 推測で断定せず WebSearch/MCP で引くか源 (GitHub) で裏取り。ランタイム辞書もこの断崖に橋を架ける道具の一つ

連鎖訂正:
- committer は素性未確認 → 同じ断崖を二度踏まぬよう「独自」断定を撤回し判断保留
- 初版の「真のギャップ 1 件」は誤判断が生んだ幻 → 撤回。3系統の代替は想定より完全だった

### Q3: 現状の reference 参照型で OK か

**OK (Yes)。note の辞書 skill 形を作り直す必要なし。**

- note の辞書 skill の正体は「決まったパスに置かれ他 skill が Read する markdown」。frontmatter 2設定は「ユーザー起動/自動発動から隠す飾り」。`references/` は登録しない分むしろ上位
- 唯一の本質差は**共有スコープ**: `references/` は親 skill にローカル。3つ以上の skill が共有する辞書が future に要るなら `~/.claude/.docs/references/` に共有 md を1枚置きパス参照 (それでも note の skill 形ではない。skill 形の利点は registry discoverability の一点のみで、当ハーネスは名前空間節約のため意図的に放棄)
- 今は作るべき辞書が存在しない (gtr は公開+専用 skill 済み) ため現状維持が正解

## 設計意図 (運用上の判断)

本ログは project CLAUDE.md の「ログは全て `.docs/logs/shared` に保存し Git 追跡」指示に従い、skill デフォルトの local/ を上書きして shared/ に直接配置した。skill の「shared 直接書込禁止」ルールとプロジェクト指示が衝突するが、CLAUDE.md 指示が default を override する原則 + 既存 shared/ ログ群が同パターンを確証しているため shared/ を選択。

## 関連ファイル

- `.docs/output/explain-in-html/260613_runtime-dictionary-skill-absence.html` — 調査結果 HTML (REV.2 訂正版)
- `.docs/references/sources/pdf/260405_*.pdf` — note 原典 (C-6 p.37 / ランタイム辞書 p.39 / 報酬ハッキング p.33-36)
- `~/.claude/skills/launching-gtr-issue-worktree/SKILL.md` — gtr を外部依存として明記済みの既存 skill (gtr 公開ツールの証拠)
- `.docs/logs/shared/2026-05-30_note-harness-gap-analysis.md` — 関連: 過去の note ギャップ分析
- `.docs/logs/shared/2026-05-24_llm-7-constraints-c-prefix-meaning.md` — 関連: C-prefix (制約番号) の意味
