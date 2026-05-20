#!/usr/bin/env bash
# validate-all-steps.sh
# essence-reviewing-orchestrator の最終バリデーションスクリプト
# バリデーション: 最終ステップで未完了項目を検出してブロックする実装
#
# 役割: progress_json の全 step が completed か確認、未完了あれば列挙して exit 1
#
# Usage:
#   ./validate-all-steps.sh "<progress_json_path>"
#
# Output (stdout):
#   ✅ COMPLETE: all N steps completed (全完了時)
#   ❌ INCOMPLETE: M/N steps completed (未完了時、未完了 step を列挙)
#
# Exit code: 0 (全完了)、1 (未完了 step あり、ファイル不在含む)

set -euo pipefail

PROGRESS_PATH="${1:-}"

if [ -z "$PROGRESS_PATH" ] || [ ! -f "$PROGRESS_PATH" ]; then
    echo "ERROR: progress file not found: $PROGRESS_PATH" >&2
    exit 1
fi

python3 - "$PROGRESS_PATH" <<'PYEOF'
import json
import sys

path = sys.argv[1]

with open(path) as f:
    data = json.load(f)

incomplete = [step_id for step_id, info in data["steps"].items() if not info["completed"]]
total = len(data["steps"])
completed = total - len(incomplete)

if incomplete:
    print(f"❌ INCOMPLETE: {completed}/{total} steps completed")
    print("Missing steps:")
    for step_id in incomplete:
        print(f"  - {step_id}")
    sys.exit(1)
else:
    print(f"✅ COMPLETE: all {total} steps completed")
    sys.exit(0)
PYEOF
