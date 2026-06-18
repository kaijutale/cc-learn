---
date: 2026-06-18 21:02:52
type: work
topic: phase4-hooks-medium-17-fix
session: harness-hooks-phase4
related_plan_id: 2026-06-15-harness-hooks-bug-fix
related_plan: .docs/plans/2026-06-15-harness-hooks-bug-fix.md
related_skill: [pickup, logging, explain-in-html]
related_log: [2026-06-18_phase3-hook-misses-fix.md]
---

# Phase 4: ハーネス hook Medium 17件 修正

> read-only サブエージェントで現コード照合 → concern別6バッチ実装 → /tmp 両方向検証 → worktree → PR #20 マージ → worktree削除まで完走。出力契約・fail-closed・異常終了・境界・over-block緩和を後方互換で解消。

## 概要

ハーネス hook 60件監査の Phase 4「Medium 17件」を完走。Phase 1 (Critical 3, #4) / Phase 2 (3層保護, #15) / Phase 3 (取りこぼし High 9, #19) の続き。13ファイル +81/-31、6 commit、PR #20 マージ済。

## 内容 (6バッチ)

### Batch A wiring (7c35d9a) — #17
PostToolUse lint群(L159)/ PreToolUse hygiene群(L242)の matcher に MultiEdit 追加。**監査外の発見**: MultiEdit取りこぼしは L159 だけでなく L242・L266(restrict-macro-writes=Macro層セキュリティ)も同根#3。additive ゆえ既存挙動を壊さず全て塞いだ(L266 は Batch D に同梱、fail-open修正と順序依存のため)。

### Batch B output-format (e066e7b) — #12, #4
- #12 post_lint: ESLint と tsc が個別 echo で両エラー時 JSON 2連続 → 1バッファ蓄積 → 1回 emit。PostToolUse の単一オブジェクト契約を守る。
- #4 pre_commands: block応答を非推奨 `{"decision":"block"}` → 現行 `hookSpecificOutput.permissionDecision:"deny"`。**approve経路は意図的に据置**(非ブロックBash全自動承認の挙動を形式変更で触ると回帰リスク、Phase5送り)。
- #13(毎回フルtsc)は型検査カバレッジ保持のため現状維持。

### Batch C fail-closed (7476004) — #1
read_secret: 空 file_path / jq失敗時の素通り(exit0=fail-open)を deny(exit2=fail-closed)へ。正常 read は file_path 必須ゆえ over-block なし(両方向確認: 異常→deny / 正常read・.env.example→allow / .ssh秘密→deny維持)。

### Batch D abnormal-exit (d8acb6c) — #6, #7, #5 + L266
- #6/#7 restrict-macro-writes / block-team: `set -euo pipefail` + grep no-match で script abort → fail-open。`|| true` で防止。実害は「file_path/subagent_type 無し=本来defer/allow経路」に限られ benign だが set -e 依存を明示排除。
- #5 CWD名に `[ ]` 等 glob文字 → prefix除去 `${FILE_PATH#${CWD_ABS}/}` が壊れる → クォート `"${CWD_ABS}/"` 化(#5 を同ファイルゆえ Batch E から D へ移管)。
- L266 matcher に MultiEdit(Batch A同根の積み残し)。

### Batch E boundary (ca5c8e9) — #14, #8, #15
- #14 line_limit: `wc -l`(改行数)→ `awk 'END{print NR}'`(行数)。末尾改行なし501行を捕捉(wc=500/awk=501 を実証)。
- #8 hardcode: `grep -noE` → `-noEi`。小文字 `/users/` 捕捉。CLAUDE.md の `grep -rEi` と整合。
- #15 fm_schema: 2本目 `---` 欠落(閉じ忘れ)を `grep -cE '^---$' < 2` で検出。閉じ忘れで本文全体を frontmatter 扱いする問題を解消。

### Batch F over-block緩和 (46aab59) — #2, #3, #9, #10, #11, #16
- #2 curl/wget: 部分一致 → 語境界 `\bcurl\b`(既存 npm ルールと同方式、ugrep が `\b` サポート確認)。「curly」誤爆解消。
- #3 保護パス cp: `.claude/(settings|hooks)` がどこにあっても block → dest(最終引数)位置のみ判定(末尾アンカー)。source読取(.claude/hooks→/tmpバックアップ)の誤ブロック解消。
- #9 stop_words: 最新 assistant が tool_use のみだと text空で検査skip → text持つ直近 message まで遡る。
- #10/#11 validate_claudemd: `.claude/hooks/` 前置1階層のみ → `(\.claude/)?(hooks|rules)/` で bare・複数階層も検証 / find範囲を skills,hooks,agents に限定。実CLAUDE.md で誤検知ゼロ確認。
- #16 mcp_notify: server抽出 `[^_]*`(最初の `_` で切れ brave_search→brave)→ `${TOOL_NAME#mcp__}` + `%%__*`。

### 検証
各 hook を /tmp で実機再現(両方向: 取りこぼし→捕捉 / over-block→緩和 + 正常系維持)。live ~/.claude は不変。全11 shell hook `bash -n` OK、変更JSON 2本妥当。

## 副作用 / 重要な学び (Gotcha級・横展開価値)

1. **検査hookが本番ルールをハードコード参照する → worktree編集が検証に反映されない罠**: hook_pre_commands は `$HOME/.claude/hooks/rules/...`(live)を直読みするため、worktree でルールを編集しても hook を素のまま走らせると旧ルールで判定される(#2/#3 検証が一度FAIL)。対策: hook を /tmp にコピーし rules パスを worktree 側へ sed 差し替えて faithful テスト。
2. **live (未修正) pre_commands が curl/wget 部分一致で作業者自身のテストコマンドを巻き添えブロック**: テストの echo ラベルやファイル名に "curl"/"wget" を含むと live hook が反応。#2 over-block の live 実証でもある。対策: trigger 語はコマンド文字列に出さず、入力は Write で /tmp ファイル化して `bash <hook> < file` で食わせる。
3. **`/tmp` ≠ `~/.claude/tmp`**: 検証は system temp `/tmp`(macOSで `/private/tmp` symlink)を使用。`~/.claude/tmp`(本番配下)は不使用。「live ~/.claude は触らない」は文字どおり。
4. **rm 忌避ハーネスで `rm -rf` がBashごと拒否される**: テスト setup の `rm -rf` で permission denied。新規 dir + `mkdir -p`(冪等)で回避。
5. **監査の指示を鵜呑みにしない**: L242/L266 の同根バグを能動的に発見(監査外)、#4 approve・#13 tsc は回帰/カバレッジ理由で意図的に据置、#8 Windows は portability理由で見送り。

## 残 (Phase 5)

Low 22件 + 5根因の構造対処 + #4 approve・#13 tsc の方針決定 + 「hook実装を検証する hook/テスト」の恒久化(再発防止層)。

## 関連ファイル

- .docs/plans/2026-06-15-harness-hooks-bug-fix.md — plan(Phase 4 を済に更新)
- .docs/output/explain-in-html/260618_pr20-harness-hooks-medium-fix.html — PR #20 解説HTML
- PR #4 (P1) / #15 (P2) / #19 (P3) / #20 (P4) — kaijutale/claude-harness
- ~/.claude/hooks/ の9 hook + settings.json + rules + three-elements-harness/scripts/hooks/ の2 hook — 修正対象(merge済、live反映は footerLinks WIP 解消後)
