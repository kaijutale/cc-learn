#!/usr/bin/env bash
# parse-target-path.sh
# essence-reviewing-orchestrator master skill の評価対象パス決定論的解析スクリプト
#
# 役割: $ARGUMENTS の値を入力に取り、評価対象の種別 + 解決済絶対パスを key=value 形式で出力
# 「決定論的制御と確率的制御のバランス」原則の実践:
# 「1 を入れたら必ず 1 が返ってくる」処理を scripts に逃がす
#
# Usage:
#   ./parse-target-path.sh "<$ARGUMENTS の値>"
#
# Output (stdout):
#   type=<file|dir|skill_dir|skill_name|empty|unknown>
#   path=<解決済絶対パス または 入力そのまま>
#   source=arguments
#
# Exit code: 常に 0 (judging を呼出側 LLM に委ねる、「制約しすぎない」原則)

set -euo pipefail

INPUT="${1:-}"

# Case 1: 引数空
if [ -z "$INPUT" ]; then
    echo "type=empty"
    echo "path="
    echo "source=arguments"
    exit 0
fi

# Case 2: 絶対パスでファイル存在
if [ -f "$INPUT" ]; then
    echo "type=file"
    echo "path=$INPUT"
    echo "source=arguments"
    exit 0
fi

# Case 3: 絶対パスでディレクトリ存在
if [ -d "$INPUT" ]; then
    if [[ "$INPUT" == */.claude/skills/* ]]; then
        echo "type=skill_dir"
    else
        echo "type=dir"
    fi
    echo "path=$INPUT"
    echo "source=arguments"
    exit 0
fi

# Case 4: 相対パス → 絶対パス変換
if [[ "$INPUT" != /* ]]; then
    ABS_PATH=$(realpath "$INPUT" 2>/dev/null || echo "")
    if [ -n "$ABS_PATH" ] && [ -e "$ABS_PATH" ]; then
        if [ -f "$ABS_PATH" ]; then
            echo "type=file"
        elif [ -d "$ABS_PATH" ]; then
            if [[ "$ABS_PATH" == */.claude/skills/* ]]; then
                echo "type=skill_dir"
            else
                echo "type=dir"
            fi
        fi
        echo "path=$ABS_PATH"
        echo "source=arguments"
        exit 0
    fi
fi

# Case 5: skill 名のみ (~/.claude/skills/<name>/ に解決可能か試行)
SKILL_PATH="$HOME/.claude/skills/$INPUT"
if [ -d "$SKILL_PATH" ]; then
    echo "type=skill_name"
    echo "path=$SKILL_PATH"
    echo "source=arguments"
    exit 0
fi

# Case 6: どれでもない
echo "type=unknown"
echo "path=$INPUT"
echo "source=arguments"
exit 0
