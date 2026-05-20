#!/usr/bin/env bash
# init-progress.sh (project-essence-orchestrator 版)
# 4 領域 (harness/skill/ui/project-domain) essence + identity レビューの進捗追跡 JSON 初期化
# essence-reviewing-orchestrator/scripts/init-progress.sh を複製、PROGRESS_DIR のみ project 用に分離
#
# 役割: $ARGUMENTS (評価対象パス) から session_id + target_slug を生成、
#       9 step すべて completed:false で進捗 JSON を初期化し、ファイルパスを返す
#
# Usage:
#   ./init-progress.sh "<target_path>"
#
# Output (stdout):
#   <progress_json_path> (1 行、後続 step が引数で参照)
#
# Exit code: 0 (正常)、1 (mkdir 失敗等)

set -euo pipefail

TARGET="${1:-}"
SESSION_ID="$(TZ='Asia/Tokyo' date '+%Y-%m-%d_%H%M%S')"
PROGRESS_DIR="$HOME/.claude/.docs/project-essence-review-runs"

# target_slug: target からファイル名安全に変換 (最大 60 文字)
if [ -z "$TARGET" ]; then
    SLUG="empty"
else
    SLUG=$(echo "$TARGET" | sed 's|/|_|g' | sed 's|[^a-zA-Z0-9_.-]||g' | cut -c1-60)
    if [ -z "$SLUG" ]; then
        SLUG="unknown"
    fi
fi

PROGRESS_PATH="$PROGRESS_DIR/${SESSION_ID}_${SLUG}_progress.json"

mkdir -p "$PROGRESS_DIR"

# 進捗 JSON 初期化 (9 step、すべて completed:false で開始)
# step 名は領域非依存 (2_parallel_fork は 3 or 4 fork のいずれも許容、Lead が領域数を決定)
cat > "$PROGRESS_PATH" <<JSONEOF
{
  "session_id": "$SESSION_ID",
  "target_path": "$TARGET",
  "created_at": "$(TZ='Asia/Tokyo' date '+%Y-%m-%dT%H:%M:%S%z')",
  "steps": {
    "1_parse_target": { "completed": false, "ts": null },
    "1.5_read_past_runs": { "completed": false, "ts": null },
    "2_parallel_fork": { "completed": false, "ts": null },
    "3_collect_returns": { "completed": false, "ts": null },
    "3_5_cross_domain_check": { "completed": false, "ts": null },
    "4_lead_judgment": { "completed": false, "ts": null },
    "5_output": { "completed": false, "ts": null },
    "6_1_mkdir": { "completed": false, "ts": null },
    "6_2_write": { "completed": false, "ts": null }
  }
}
JSONEOF

echo "$PROGRESS_PATH"
exit 0
