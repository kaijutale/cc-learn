---
feature: stop-hook-handoff-check
session: 未設定
date: 2026-04-21 00:31:30
---

# Stop Hook: handoff-state.md 鮮度チェック追加

## 概要

Claude Code の Stop hook (ターン終了時) に `.claude/handoff-state.md` の鮮度チェックを追加し、ファイルが 60 分以上古い場合に `/handoff` skill での更新を促す `additionalContext` を Claude に注入する仕組みを導入。

既存の PostCompact hook (`hook_post_compact_handoff_check.sh`, 30分閾値) は長セッション圧縮検知時のみ発火するため、日常的な「タスク完了の区切り」では鮮度が警告されないカバレッジ穴があった。Stop hook で補完することで、ターン終了ごとに handoff 更新タイミングを機械的に通知できる。

## 実装内容

### 1. 新規スクリプト作成

`~/.claude/hooks/hook_stop_handoff_check.sh` (515 bytes, `-rwxr-xr-x`):

```bash
#!/bin/bash
HANDOFF="${CLAUDE_PROJECT_DIR:-$PWD}/.claude/handoff-state.md"
[ ! -f "$HANDOFF" ] && exit 0
age=$(( $(date +%s) - $(stat -f %m "$HANDOFF") ))
if [ "$age" -gt 3600 ]; then
  min=$(( age / 60 ))
  msg="handoff-state.md が ${min} 分前。/handoff で更新を検討"
  escaped=$(echo "$msg" | jq -Rs '.')
  echo "{\"additionalContext\": $escaped}"
fi
exit 0
```

### 2. settings.json 更新

`~/.claude/settings.json` の `hooks.Stop[0].hooks` 配列末尾に 1 エントリ追加:

```json
{
  "type": "command",
  "command": "~/.claude/hooks/hook_stop_handoff_check.sh"
}
```

既存 4 エントリ (afplay / osascript notification / say / hook_stop_words.sh) は維持したまま、5 番目として追加。

### 3. 検証

- pipe-test: `echo '{}' | ~/.claude/hooks/hook_stop_handoff_check.sh` → exit=0, stdout 空 (不在時 silent)
- jq 構造検証: `jq -e '.hooks.Stop[] | select(.matcher == "") | .hooks[] | .command'` で 5 件確認
- 実行権限: `-rwxr-xr-x` (Write 上書き後も mode 保持)

## 設計意図

- **閾値を PostCompact(30分) より長い 60分 にした理由**: Stop hook は毎ターン終了時に発火するため、30分閾値だと通知過多でかもねの認知負荷が上がる。PostCompact は「長セッション圧縮」という低頻度イベントなので短めで OK だが、Stop は頻度で重み付けが逆。
- **不在時は無音 (exit 0, 出力なし)**: PostCompact 版は「ファイル不在 → 外部化を検討」と通知するが、Stop でそれを毎ターン出すと新規プロジェクトで常に通知が鳴る。handoff が必要なほど作業が育ったプロジェクトでは存在する前提で、不在は「まだ作られていないだけ」と解釈。
- **既存スクリプトを流用せず新規作成**: ロジック共通化より「閾値チューニングの独立性」を優先。将来 Stop は 90 分、PostCompact は 15 分といった分岐が発生したとき、1 ファイル内の環境変数分岐より別ファイルの方が読みやすい。
- **CLAUDE_PROJECT_DIR fallback に $PWD**: Claude Code が hook 呼出時に `CLAUDE_PROJECT_DIR` を設定する前提だが、未設定でも cwd で動くよう保険。
- **stat -f %m は macOS 専用**: Linux では `stat -c %Y`。ユーザー環境 (Darwin) に固定したトレードオフ。ポータビリティより最短記述を優先。

## 副作用

- **毎ターン終了時に軽量 shell 実行 (数ms)**: 体感影響なし。ただし既存 Stop hooks (afplay/say の合計約1秒) の後ろに追加しているので、順序的にはもっとも後ろでほぼ非同期感覚。
- **additionalContext 注入時の挙動**: handoff-state.md が 60 分超のとき、次ターン開始時の Claude コンテキストに `"handoff-state.md が N 分前。/handoff で更新を検討"` が注入される。わたしがこれを読んで /handoff 実行を提案する流れ。注入量は 1 行で軽微。
- **作成時の失敗パターン**: 初版 (かもね手動作成) で heredoc 全体コピペ事故により `SCRIPT_EOF`/`chmod +x`/`ls -la` 行が残存し、全行に 2 スペースインデントが入った。shebang が 1 カラム目でないため kernel 非解釈リスクがあった。Write ツールで上書き再作成して解消 (515 bytes, shebang 1 カラム目、ゴミ行削除)。
- **settings watcher リロード不要**: 既存 Stop イベント配列への追加のみなので、watcher は同イベントを既に監視中。`/hooks` 再読込や CLI 再起動は不要。

## 関連ファイル

- `~/.claude/hooks/hook_stop_handoff_check.sh` — 新規スクリプト (60 分閾値、不在時 silent)
- `~/.claude/hooks/hook_post_compact_handoff_check.sh` — 既存 PostCompact 版 (30 分閾値、不在時も通知)。設計参考元
- `~/.claude/settings.json` — `hooks.Stop[0].hooks` 配列に 1 エントリ追加 (5 番目)
- `.claude/handoff-state.md` — このhookが鮮度をチェックする対象ファイル (存在するプロジェクトでのみ有効)
