---
feature: statusline-cwd-truncate
session: 未設定
date: 2026-05-04 02:29:47
---

# statusline.sh の cwd 表示 truncate 対応

## 概要

Claude Code のステータスライン (`~/.claude/hooks/statusline.sh`) が本来4行構成 (🦀 version / 📂 cwd / 👑 git / 🧠 context+model) なのに、CC上で2行 (🦀 / 📂) しか表示されない問題を調査・修正した。

仮説検証の結果、長い cwd パス (特に日本語含む) が CC のレンダリング上で行ラップを起こし、その下の L2(git) と L3(context) が画面外に押し出される現象が原因と推定。対策として cwd の表示文字数を保守的に制限した。

## 実装内容

`~/.claude/hooks/statusline.sh` の cwd 整形ブロック (15-23行目) に末尾優先 truncate ロジックを追加：

```zsh
# Truncate cwd: long path wraps and pushes L2/L3 off-screen (CC line budget).
# 日本語=2表示列なので保守的に短めに。MAX_CWD_CHARS で調整可能。
MAX_CWD_CHARS=30
if (( ${#short_cwd} > MAX_CWD_CHARS )); then
  tail_len=$((MAX_CWD_CHARS - 3))
  short_cwd="~/…${short_cwd[-tail_len,-1]}"
fi
```

出力例：
- 入力: `~/dev/claude-code/claude-code-learn/cc-playground/260404_【...】 ハーネス&AIエージェントの本質勉強会`
- 出力: `~/…認知を与える】 ハーネス&AIエージェントの本質勉強会`

## 設計意図

### なぜ末尾優先 truncate か
パスの先頭は `~/dev/...` などほぼ環境依存で予測可能、末尾はプロジェクト名を含み変化が激しい。statusLine は「今どこ？」を瞬時に伝える UI なので、情報量の多い末尾を残し先頭を捨てる方が情報設計として正しい。

### なぜ pure zsh で完結させたか
statusLine はレンダリングのたびに毎回起動する。python/awk subprocess を呼ぶと毎回 50-100ms のレイテンシが乗り、入力体験を損なう。表示幅判定の精度よりレイテンシを優先し、`${var[-N,-1]}` の zsh 文字列スライスで完結させた。

### なぜ MAX_CWD_CHARS=30 か
日本語 1文字 = 2表示列なので、30文字 ≈ 最大60表示列。多くのターミナル幅 (80列) で1行に収まる保守的な値。ただし CC の pane 幅やフォントによってまだ折り返す場合があるため、変数化して調整可能にした (英語のみなら 50、日本語多めなら 20 を推奨)。

### なぜ仮説検証アプローチか
CC側の真因は2説あった：
1. **行数キャップ説**: CC が statusLine の最大行数を 2 にハードコード
2. **行ラップ説**: 長い行が視覚的に折り返し、CC の行数バジェットを食い潰す

直接ソース読まずに検証するには「安く・小さく試せる方」を先に潰すのが正解。cwd 短縮で直れば 行ラップ説 確定、直らなければ L0+L3 / L1+L2 を統合する2行設計に切り替える方針。

## 副作用

- **表示幅の保証は厳密ではない**: char count ベースなので、絵文字・全角記号などで実表示幅がずれる可能性がある。CC の pane 幅が極端に狭い (40列以下) と日本語パスでまだ折り返す可能性あり
- **末尾優先の代償**: 「`~/dev/...` までは見えていたい」というユーザーには情報損失。中央省略版 (`head…tail`) への切り替えオプションを別途用意済み (採用は未確定)
- **前段の `${cwd/#$HOME/~}` 置換**: cwd が `$HOME` 配下でない場合は `~` 置換が起きないため、絶対パスのまま末尾30文字が表示される。実害なしだが先頭 `~/…` の prefix と齟齬が出る

## 関連ファイル

- `~/.claude/hooks/statusline.sh` — 修正対象。15-23行目に truncate ロジック追加
- `~/.claude/settings.json` — statusLine 設定 (`type: command`, `padding: 0`)。今回は変更なし
- `.docs/templates/2026-05-04_statusline-cwd-truncate.md` — 本ログ
