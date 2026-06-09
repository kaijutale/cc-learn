---
date: 2026-06-09 10:44:37
type: work
topic: auto-memory-all-projects-cleanup
session: 全PJ auto-memory大掃除
related_skill: [pickup, logging, explain-in-html, handoff]
---

# 全PJ auto-memory 大掃除の完遂

> /pickup から全11プロジェクトの auto-memory を黄金律で選別。本文40項目 → 残す12項目に圧縮し、削除28本+空4PJフォルダを trash。HTML4枚で全工程を可視化。

## 概要

前回 handoff の next_phase「他PJ MEMORY.md 横断調査」を実行。グローバルハーネス `~/.claude` を含む全プロジェクトの auto-memory を、確立済みの黄金律(構造/skill/CLAUDE.md/rules でカバー済→削除、完了ログ→削除、未カバーの行動規律→残す or 昇格、PJ固有事実→残置)で選別し、肥大した auto-memory を「あるべき姿」に圧縮した。

前提として `autoMemoryEnabled: false`(settings.json)が既設定で、再蓄積リスクは解消済みと確認してから着手。

## 内容

### 工程

1. **pickup**: 前回 handoff(status=completed, next=他PJ横断調査)を frontmatter から復元
2. **~/.claude 調査**: 本文24本を調査エージェントに委譲し黄金律4分類(COVERED3/STALE-LOG1/UNCOVERED-RULE11/KEEP9)。メインコンテキスト保護
3. **スコープ修正**: kaiju「これ全部じゃない」指摘 → 全11PJ横断 find で本文40判明。当初「~/.claude 24本」と独断で狭めていた(後述の自己反省)
4. **他10PJ調査**: 第2弾エージェントで本文16本+toybox/ninmu直書き2を分類。PJ固有事実が中心、汎用規律6本が個別PJに散在と判明
5. **fashion 消失**: 調査中に fashion/memory が消えた(18:19更新)→ kaiju の意図削除と判明(データロスではない)
6. **HITL個別選別**: 1本ずつ kaiju 判断。「救出最小・手管理哲学」を厳格適用 — 規律も既存カバー済なら昇格せず単純削除、mcp-status は移動先(~/.claude)が要るかと思いきや「移しても要らぬ」で削除
7. **判断割れ7本の精読**: 本文を直読。warm-paper が「explain-in-html = Warm Paper 美学」と記載するが、現 skill は Thariq Dark Editorial に更新済み=**陳腐化**を発見(当日生成した3枚が反証)
8. **死にリンク確認**: 残す `grep-before-delete` 規律を適用。残す12本に削除本への `[[参照]]` なしを grep 確認
9. **実削除**: `/usr/bin/trash` で28本+空4PJフォルダ削除 → ~/.claude(24→4) / ios-memopo(→2) / ios-ideas(→1) の MEMORY.md 索引を残す本だけに更新

### 最終確定

- **削除28本** = 当初「不要」23本(grep除く) + mcp-status / stay-on-goal / validate-inherited / distill-by-domain / warm-paper
- **残す12項目** = ~/.claude 4(grep-before-delete / prefer-skill / verify-source / permission-path) + learn 3(前回確定) + ios-memopo 2(template-yagni / memopo-unified) + ios-ideas 1(project-memopo) + toybox/ninmu 直書き2
- **空4PJ**(pixel-leap / roi-fourre / portfolio / cc-changelog)は memory フォルダごと消滅
- 検証: 本文 .md 10本 + 直書き2 = 12項目、MEMORY.md 持つPJは6個(空4PJ消滅)を find で確認

## 設計意図

黄金律の核心は `prefer-skill-over-rules-injection`(残す本そのもの)── 「特定文脈の知識は rules 常時注入でなく skill/memory の選択ロードへ」。これを全選別の判断軸にした。残った12本は「常時要る運用知(~/.claude 4)」+「2度の選別を生き延びた確定知(learn 3)」+「そのPJでだけ効く固有事実(5)」に綺麗に分かれ、auto-memory が肥大せず機能する輪郭を示す。

## 学び / 重要発見

- **kaiju の手管理哲学(厳格)**: auto-memory に規律を溜めない。既存ハーネス(CLAUDE.md/rules/skill)でカバー済なら昇格すらせず単純削除。移動先がグローバルでも要らぬなら消す。LLM(私)は「カバー済→移動して残す」と楽観しがちだが、kaiju は「移しても不要」とさらに刈り込む
- **陳腐化 memo の害**: warm-paper は記述(Warm Paper)が現実(Thariq)と食い違う = 残すと誤情報源。skill 反映済みの選好 memo は陳腐化を疑う
- **自己反省**: 「~/.claude 24本」とスコープを独断で狭めた。これは残す本 `search-all-projects-before-asserting-absence`(非存在断定前に全PJ横断)規律の自己違反。kaiju 指摘で全40に修正。皮肉にも、この規律自体が残存12本に含まれる

## 関連ファイル

- `.docs/output/explain-in-html/260608_auto-memory-claude-home.html` — ~/.claude 24本版
- `.docs/output/explain-in-html/260608_auto-memory-all-projects.html` — 全40本統合版(PJ別)
- `.docs/output/explain-in-html/260608_auto-memory-borderline-7.html` — 判断割れ7本の精読
- `.docs/output/explain-in-html/260609_auto-memory-survivors-12.html` — 残存12本=あるべき姿
- `~/.claude/projects/*/memory/` — 実削除対象(このPJ git 管理外、Finder ゴミ箱から復元可)
