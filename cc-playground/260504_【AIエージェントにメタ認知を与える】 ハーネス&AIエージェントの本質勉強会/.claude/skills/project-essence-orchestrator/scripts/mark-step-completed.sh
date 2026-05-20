#!/usr/bin/env bash
# mark-step-completed.sh
# essence-reviewing-orchestrator の各 step 完了時の記録スクリプト
# ステップ完了記録: 各ステップ完了時にチェックボックスをオンにする実装
#
# 役割: progress_json の該当 step を completed:true + ts (現在時刻) に更新
#
# Usage:
#   ./mark-step-completed.sh "<progress_json_path>" "<step_id>"
#
# Output (stdout):
#   <completed_count>/<total_count> (1 行、進捗を Lead に視認させる)
#
# Exit code: 0 (正常、schema 外 step_id も警告のみで 0)、1 (ファイル不在等)

set -euo pipefail

PROGRESS_PATH="${1:-}"
STEP_ID="${2:-}"

if [ -z "$PROGRESS_PATH" ] || [ -z "$STEP_ID" ]; then
    echo "ERROR: usage: $0 <progress_json_path> <step_id>" >&2
    exit 1
fi

if [ ! -f "$PROGRESS_PATH" ]; then
    echo "ERROR: progress file not found: $PROGRESS_PATH" >&2
    exit 1
fi

python3 - "$PROGRESS_PATH" "$STEP_ID" <<'PYEOF'
import json
import datetime
import sys

path = sys.argv[1]
step_id = sys.argv[2]

with open(path) as f:
    data = json.load(f)

if step_id not in data["steps"]:
    print(f"WARN: step '{step_id}' not in schema, ignored", file=sys.stderr)
    completed = sum(1 for s in data["steps"].values() if s["completed"])
    total = len(data["steps"])
    print(f"{completed}/{total}")
    sys.exit(0)

data["steps"][step_id]["completed"] = True
data["steps"][step_id]["ts"] = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat()

with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

completed = sum(1 for s in data["steps"].values() if s["completed"])
total = len(data["steps"])
print(f"{completed}/{total}")
PYEOF

exit 0
