---
feature: skill-bang-command-firing
session: 未設定
date: 2026-04-18 21:34:26
---

# skill 内 `!<command>` 構文の発火タイミング検証

## 概要

Claude Code の skill（SKILL.md）内で使える `` !`<command>` `` 構文について、公式ドキュメント調査と実測実験で仕組みレベルの理解を確立したセッション。かもねの学習スタイル（曖昧な推測ではなく事実ベースの深い理解）に沿い、docs上の記述 → 推測 → 実測検証の3段階で確信度を積み上げた。

同日の別ログ `2026-04-18_claude-code-input-modes.md` で扱った **bashコマンド（bash mode、ユーザーが `!` を入力行頭に打つ入力モード）** とは**別の機能**である点に注意。今回対象の `!<command>` は skill markdown body 内部に書く**ハーネス前処理用の動的コンテキスト注入記法**。

## 実装内容

### Phase 1: 公式ドキュメント調査（claude-code-guide エージェント経由）

- 1回目調査: 構文の正体、展開タイミング、権限モデル、実例を網羅
- 2回目調査: 発火タイミングの深掘り（load vs invoke、progressive disclosure との関係、複数回invoke時の挙動、stdout/stderr/exit code の扱い）
- 公式ソース: `https://code.claude.com/docs/en/skills.md#inject-dynamic-context` および `#skill-content-lifecycle`

### Phase 2: 実測実験

1. `~/.claude/skills/fire-timing-test/SKILL.md` を作成（2つの `` !`date ...` `` を埋め込み、`/tmp/skill-fire-log.txt` に追記する副作用を仕込む）
2. `/tmp/skill-fire-log.txt` を0バイトで初期化
3. skill list に description が表示された段階でログを確認 → **0バイト**（発火なし）
4. Skill tool で1回目 invoke → ログ2行追記、Claude に届いた body には**展開済みタイムスタンプ**が埋まっていた
5. Skill tool で2回目 invoke → 別のタイムスタンプで2行追記（キャッシュなしを確認）

### Phase 3: 検証で確定した事実

| 項目 | 結果 |
|---|---|
| 発火タイミング | invoke時のみ。disk書き込みやload段階では発火しない |
| Claude から見た形式 | 展開済みテキストのみ。`!` 構文自体は Claude の目に届かない |
| キャッシング | なし。同一session内の複数回invokeで毎回fresh実行 |
| 複数 `!<command>` の挙動 | 全て発火、逐次実行（70ms〜27ns差で連続） |
| session中の新規skill認識 | 再起動不要。disk追加後にskill listへ即座に反映 |

## 設計意図

- **事実と推測の厳密な分離**: 公式docs明記事項 / docs未記載の推測 / 不明 の3段階で応答を構造化。かもねのプロンプトで「記載なしは記載なしと書いて」と明示要求されたため
- **実測による確信度の上げ方**: docs記述の信頼性を、実験で追試して「裏付け取れた」と明言できる状態にする。特に「毎回発火（キャッシュなし）」はdocs未記載の推測だったが、実測で確定に昇格
- **skill学習セッションの新発見を副次的に記録**: session中に新規作成したskillが即座に認識される仕様（load機構が動的）は docs に明記がなく、実験副産物として把握
- **同日別ログとの関連付け**: bash mode（ユーザー入力側）と `!<command>`（skill body側）は名前と記号が似ているため、将来の自分が混同しないよう明示的に区別を残す

## 副作用

- **実験用skillが残存**: `~/.claude/skills/fire-timing-test/SKILL.md` はセッション終了時点でも残っている。不要なら削除判断がかもね側に委ねられている状態
- **実験ログファイル残存**: `/tmp/skill-fire-log.txt` に4行のタイムスタンプが残存（tmp配下なのでOS再起動で消える）
- **ドキュメント未記載領域の未検証項目**: stderr の扱い / exit code 非ゼロ時の skill 中断可否 / 出力サイズ制限 / バイナリ対応 は未実験。将来必要になったら追試

## 関連ファイル

- `~/.claude/skills/fire-timing-test/SKILL.md` — 実験用skill本体（`!date` を2箇所埋め込み、allowed-tools で `Bash(date:*), Bash(tee:*)` を pre-approve）
- `/tmp/skill-fire-log.txt` — invoke発火時刻のタイムスタンプ記録（実験生成物）
- `.docs/templates/2026-04-18_claude-code-input-modes.md` — 同日の関連ログ（bash mode 側）、混同回避のため相互参照
- 参考: `https://code.claude.com/docs/en/skills.md` — 公式リファレンス
