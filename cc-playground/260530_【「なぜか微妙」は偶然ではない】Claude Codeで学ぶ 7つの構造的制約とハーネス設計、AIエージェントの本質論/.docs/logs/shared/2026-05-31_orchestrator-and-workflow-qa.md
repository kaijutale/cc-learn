---
date: 2026-05-31 03:32:02
type: qa
topic: orchestrator-and-workflow-qa
session: 未設定
related_article: .docs/references/sources/pdf/260405_【「なぜか微妙」は偶然ではない】Claude Codeで学ぶ 7つの構造的制約とハーネス設計、AIエージェントの本質論.pdf
related_skill: [orchestrating-team-development, three-elements-harness, enforcing-strict-tdd-cycle, executing-ai-development-workflow, explain-in-html, logging]
related_agent: [coder]
related_log_ids: [2026-05-30_note-harness-gap-analysis]
related_log: [2026-05-30_note-harness-gap-analysis.md]
---

# オーケストレーターの正体 / Agent Teams は鍵ではない / executing-ai-development-workflow の使い方

> ハーネス調査(前ログ)の続きとして発生した Q&A 連鎖。「オーケストレーターは誰か」→「Agent Teams が鍵か」→「手段と本質の3階層」→「executing-ai-development-workflow の使用例と Light/Full 切替」。核心は「手段(Agent Teams)と原理(独立コンテキスト分離)と本質(生成と検証の分離・統合非委任)を3階層で分けて見る」。

## 概要

前ログ(note-harness-gap-analysis)のハーネス突き合わせを受けて、camone から連続した概念質問が来た。一問一答ではなく、各回答が次の問いを誘発する形で「ハーネスの本質とは何か」に収束した。最後に executing-ai-development-workflow の実務的な使い方(HTML 解説 + モード切替)で着地。

## 内容

### Q1. ハーネスの中の「オーケストレーター」はどいつ?

分解して断定:
- **主体 = メインClaude(対話セッション本体)**。skill でも agent でもない。指揮棒を振る生身。
- **部品で名指すなら = `orchestrating-team-development` skill**(自称 "conductor")。戦術レベルは `coder` agent(TDD red→implement→verify を回す戦術オーケストレーター)。
- 階層図(enforcing-strict-tdd-cycle より): L3 メインClaude/指揮者skill → L2 coder → L1 fork skills → L0 team-* 孫。**agent 実体は coder だけ、L3 は「メインClaudeが指揮者skillという楽譜を開いた状態」**。
- 現場知: 直前のハーネス調査も「メインClaudeが地でオーケストレーターをやった」。general-purpose 2体をワーカーに並列起動し統合判断はメインが握った = 記事 T-1 パターンそのもの。ただし orchestrating-team-development skill は発動していない(手動の軽量版)。

### Q2. Agent Teams が「鍵」か?

**No(断定)**。鍵は「独立コンテキストによる関心の分離」という原理であって、Agent Teams はその一実装にすぎない。根拠3点:
- 記事の分離手段表で基本手段は context:fork と Agentツール。「Agent Teams」は記事の中心概念ではない。
- camone ハーネスの日常駆動力は context:fork(TDD/essence3領域/llm-debate/PR Google基準レビュー全部)。Agent Teams は orchestrating-team-development 内の特定モードでのみ登場。
- settings.json env に `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` は**常設されていない**(teammateMode:tmux はあるが有効化フラグは常時オンでない)。さらに orchestrating-team-development 自身が Agent Teams へ大量の警告(投げっぱなし禁止/0token stall/task-status遅延/手動steer必須)を持つ = 「鍵」ではなく「脆い実験機能」の扱い。memory にも「自律 Agent Teams 協調は機能せず手動駆動した」実測あり。

### Q3. orchestrating-team-development は Agent Teams をデフォルトにしてる。それでも鍵じゃない?

**Yes(両立)**。判定の物差し =「外したら本質が消えるか」。
- Agent Teams を外しても骨格(フェーズゲート/二層検証/統合非委任)は無傷 → 鍵ではない。実証 = 前回調査が Agent Teams 不使用の subagent 2体で成立。
- context:fork を外すと TDD も essence も llm-debate も PR レビューも全滅 → **これが本当の鍵**。
- skill 内で Agent Teams が動くのは「実装フェーズで5役を横に並べる」一区間だけ。完了判定・統合・最終マージは Agent Teams の外(オーケストレーター自身)。

### Q4.「手段でしかない、本質は別にある」という理解で合ってる?

**完璧に正しい**。3階層モデルで整理:
- **3階 本質(WHY)**: 「生成と検証を混ぜるな・判断を委任するな」。不変。記事の言う「機能/モデルが変わっても崩れない原理原則」。
- **2階 鍵(HOW)**: 独立コンテキストで関心を分離する/フェーズゲートで順序を強制する。原理は固定だが表現は選べる。
- **1階 手段(WITH WHAT)**: Agent Teams / subagent / context:fork / Plan Mode / Bash。自由に差し替え可。
- 教訓: **上の階ほど寿命が長い**。手段に名前で惚れると実験機能の不安定さに振り回される。指標は「Agent Teams 使えてるか」でなく「独立コンテキストで分離+統合を握れてるか」。

### Q5. あるアプリ開発で orchestrating-team-development が輝く条件は?

**3条件が揃ったとき: 規模(10+ファイル/複数レイヤー) × 並列性(機能が同時進行できる) × 検証性(テスト/lintで機械判定可)**。
- 輝く = フルスタックアプリ一括立ち上げ(認証+課金+ダッシュボード並行) → Marathon / UI-First モード。
- 輝かない = ボタン色変更・バグ1個・ライブラリ調査。skill 自身の Gotcha「3ファイル以下はコスト過大」。代替は単体開発 or executing-ai-development-workflow。
- 注意: camone 環境は Agent Teams 自律協調が実測で手動steer必須。輝かせるにも能動steer前提。

### Q6. executing-ai-development-workflow の使用例(HTML解説) + 引数なし挙動

- HTML 解説を explain-in-html で生成(出力先: `.docs/output/explain-in-html/260530_executing-ai-dev-workflow-guide.html`)。一次情報(SKILL.md/examples.md/config.json)のみ根拠。
- skill の正体 =「開発の段取りを毎回ブレさせない軽量レール」。指揮者skill(重・チーム並走)と単発修正の中間。7工程: Research→Planning→Issue&Branch→Implementation→Review→Fix→PR(+Step8 マージ)。
- **引数なし `/executing-ai-development-workflow` の挙動**: 手順書が読まれ Light モードで構えるだけ。**実装は始まらない**(Step1 Research は題材が決まって初めて動く)。Claude が「何を実装する?」と題材を尋ねる。正しい呼び方は題材を一緒に渡す。勝手にコードを書かない(計画承認の関所が手前にある)。
  - 出所明示: これは SKILL.md 構造からの**設計導出**であって実機ターミナル観測ではない(C-7 校正盲を避けるため明記)。

### Q7. Light/Full モードの切り替えは? hook か?

**hook ではない(断定)**。依頼文の言葉で決まる確率的判定。
- 既定 `default_mode: "light"`。Full トリガーワード(品質重視/多層レビュー/Full mode/セキュリティ/認証/決済/大規模/リファクタリング 等)or 自動条件(セキュリティ機能/10ファイル以上/明示指定/公開API破壊的変更/DBスキーマ変更)のどれか1つで Full。
- 確定タイミング = Step 2(計画)の人間承認関所。Claude の判定が外れてもここで上書き可能。
- 決定論(hook)ではなく確率的(Claude判定)の側 → 外れ得る。確実に Full にしたいなら依頼文に「Full mode で」を明示するのが最強レバー。standard では Light/Full を強制する hook は無い(camone ハーネスにも無い、調査済み)。

## 関連ファイル

- `.docs/logs/shared/2026-05-30_note-harness-gap-analysis.md` — 前ログ(本Q&A連鎖の起点となったハーネス突き合わせ調査)
- `.docs/output/explain-in-html/260530_executing-ai-dev-workflow-guide.html` — Q6 で生成した executing-ai-development-workflow 使用例の HTML 解説(成果物)
- `~/.claude/skills/executing-ai-development-workflow/{SKILL.md,references/examples.md,assets/config.json}` — Q6/Q7 回答の一次情報
- `~/.claude/skills/{orchestrating-team-development,enforcing-strict-tdd-cycle,three-elements-harness}/SKILL.md` — Q1〜Q5 回答の根拠
- `~/.claude/settings.json` — Agent Teams 有効化フラグ非常設の確認元(Q2)
