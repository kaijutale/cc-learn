# Essence Review: logging skill

> 評価基準: [agent-essence](reference/agent-essence.md)

## 対象の要約

作業ログを type 別テンプレート (work/study/qa/validation/experiment/observation) で `.docs/logs/local/` に統一記録し、検証済み知見のみ `/promote-log` で `shared/` に昇格させる二段構えの記憶外部化 skill。worktree 越しでも本体 checkout の canonical log root を指すよう解決する。

## 原則適用マトリクス

| # | 原則 | 関連度 | 判定 | 根拠 |
|---|------|--------|------|------|
| C-1 | コンテキスト帯域は有限でゼロサム | 中 | △ | !構文6ブロックを毎回実行。canonical root 解決を4回ほぼ同一の `C=...` boilerplate で重複injection |
| C-4 | 自己申告は完了の証拠にならない | 低 | ○ | 「書いた=回収済みと思い込むな」should で worktree→本体の未回収状態を明示的に否定 |
| T-1 | 関心ごとの分離 | 中 | ○ | 記録(logging) と 昇格審査(promote-log)、6 type の本文構造を明確に分離 |
| T-1.1 | 並行エージェント間の状態を隔離 | 高 | ○ | canonical root で worktree 相対書込を回避、加算のみ(既存破壊なし)で本体に集約 |
| K-1 | 記憶の外部化 | 高 | ○ | 本skillの中核目的。状態・進捗・判断理由を versioned artifact に永続化 |
| K-1.1 | Restartable Handoff | 高 | ○ | related_* pointer + git log + frontmatter で「無知でも再開できる」再起動可能性を担保 |
| K-1.2 | 記憶は保存前に監査・修復する | 高 | △ | 本skillは「判断ゼロで書く」= 無審査書込。監査は別skill promote-log に委譲され本skill内では一切検証しない。tracked-local ケースは審査ゲートを完全迂回 |
| K-2 | 可読性を最適化 | 高 | ○ | frontmatter + 表形式 + git 追跡で発見可能・機械parse可能な正の情報源にしている |
| K-2.1 | ポインタは百科事典より強い | 中 | △ | related_* / ID+path hybrid は好例。ただし SKILL.md 本体が307行と詳細過多気味 (on-demand ロードゆえ許容範囲だが inline template が肥大) |
| K-2.2 | ドキュメントは構造化 | 高 | ○ | type別テンプレ + 必須H2 で腐敗しやすい自由記述を構造化された成果物に矯正 |
| K-2.3 | 観測面を設計 | 中 | ○ | ログ自体が skill/agent/hook 挙動の観測面。表・find/grep 前提の命名規約 |
| K-2.4 | ハーネス方針を runtime から分離 | 低 | ○ | logging 方針を controller 埋め込みでなく versioned skill として外部化 |
| V-1 | 確率的出力を決定論で矯正 | 高 | ○ | canonical root を `git rev-parse` で機械解決し LLM のpath推測を排除。最大の強み |
| V-1.1 | 失敗を仕組みに昇格させる | 高 | △ | 過去失敗(date規約反転/gitignore false positive等)を Gotcha 散文で蓄積。だが必須field・必須H2・date=記録時刻 は hook/lint で機械強制されず must 散文依存 |
| S-1 | 信頼境界を明示的に設計 | 高 | ○ | local(未検証)/shared(検証済) の境界を設計、shared 直書き禁止 |
| S-1.1 | 出所を追跡し昇格前に隔離 | 高 | ○ | local を隔離staging とし promote-log ゲート経由でのみ shared 昇格。isolate-before-promotion の好例 |
| S-1.5 | 安全側をデフォルトにする(fail-closed) | 中 | ○ | default=local(安全側)、shared は promote-log で opt-in。方向性が制限側 |
| E-1 | 制約が品質を生む | 高 | ○ | type テンプレ・必須H2・「判断ゼロで書く」で解空間を圧縮し出力を安定化 |
| E-1.1 | ドリフト前提でGC | 中 | △ | 旧ログ不改変 + promote 選別は good。だが local/ の無限累積に対する継続 cleanup は未設計 |
| E-2 | ルールより理由で汎化 | 中 | △ | 大半のルールに理由付与(good)。だが「必ず必ず必ず」「重要な注意事項」節は既述ルールの再掲で ALWAYS 的ノイズ |

## 主要な指摘

### 強み

- **V-1 決定論的パス解決が白眉**: canonical log root を `dirname(git rev-parse --path-format=absolute --git-common-dir)` で機械解決し、非git環境は cwd へ fallback。LLM に「どのパスに書くか」を推論させず、worktree 越しの未マージログ消失という実害を構造的に封じている。祈りでなく環境で解いている。
- **S-1.1 + S-1.5 の隔離設計**: local を未検証 staging として隔離し、shared 昇格は promote-log ゲート経由のみ。default が安全側(local)で共有が opt-in の fail-closed。信頼境界の教科書的実装。
- **K-1.1 の ID+path hybrid pointer**: `related_plan_id`(不変識別子) と `related_plan`(現在path) の二重化で、archive/promote の mv によるリンク切れに耐える。「path で先に探し、404 なら ID で動的再解決」の解決ロジックまで明示。
- **K-2.2 の構造化強制**: type別テンプレ + frontmatter 必須field + 必須H2 で、腐敗しやすい自由記述を機械parse可能な成果物に矯正している。
- **institutional memory の蓄積**: Gotcha に日付付き(2026-06-13/06-15等)で過去の実失敗と是正理由を記録。散文ではあるが失敗の記憶が消えていない。

### 改善提案

- **原則 #K-1.2 記憶は保存前に監査・修復する**: 本skillは「判断ゼロで書く」設計ゆえ、書込時点で一切の監査をしない。監査は promote-log に全委譲されるが、(a) promote-log 実行は手動・任意で強制ゲートでない、(b) `~/.claude` ハーネスリポジトリでは local/ 自体が git 追跡(63ログ追跡済)= 未審査ログが promote を経ずに永続記録化される、という二点で「昇格前に検証」が迂回されうる。→ tracked-local の場合だけでも軽量な自己チェック(必須field/H2の充足、既存 topic との矛盾・重複照合)を Step に明示するか、少なくとも「tracked-local では promote ゲートが働かない」ことを skill 本文で警告する。
- **原則 #V-1.1 失敗を仕組みに昇格させる**: canonical root は機械化できているのに、必須frontmatter field・必須H2 section・`date=記録時刻`規約 は must/必須 の散文依存のまま。実際 date 規約は過去に反転する失敗が起きている(Gotcha 記載)。散文の注意喚起は再発した = 仕組みに昇格すべきサイン。→ ログファイルに対する validate hook / linter(frontmatter schema + 必須H2 存在 + ファイル名日付と `date:` 一致チェック)を用意し、CI かコミット直後で落とす。再発失敗を tooling に固定化する。
- **原則 #C-1 / #K-2.1 帯域とポインタ**: canonical root を解決する `C="$(git rev-parse ...)"` boilerplate が !構文4ブロックにほぼ丸ごと重複し、毎回同じ計算結果を別々に context へ注入している。→ 1ブロックで root を一度解決し、そこから ls/find を派生させる形に統合すれば、トークン重複と保守点(4箇所の同期)を同時に減らせる。

### 見落としリスク

- **local の二重人格が散文でしか区別されない**: 「汎用プロジェクトでは local=書き捨て(gitignored)」と「`~/.claude` では local=永続追跡」という正反対の運用前提が、同一skill内に共存し、区別は Gotcha の avoid 項をエージェントが覚えているかだけに依存する。リポジトリ文脈の機械判定(例: `.gitignore` に `!/.docs/` があるか)で分岐せず散文任せなのは E-1(制約の明確さ)上の潜在バグ。gitignore 警告の false positive を Gotcha で塞いでいるのは対症療法。
- **promote されない限り監査ゼロのログが無限累積する(E-1.1)**: local/ に対する GC 方針が無い。promote は「上げるもの」を選ぶ機構だが「捨てるもの」を選ぶ機構がない。tracked-local リポジトリでは累積が git 履歴に恒久固着し、古い・矛盾するログがノイズ源(K-2「古い情報は性能を落とす」)化しうる。
- **`related_*` pointer の解決責務が proposer 側にある**: ID+path hybrid の解決ロジック(path→404→ID再解決)は「proposer の解決ロジック(推奨)」として記述されるが、それを実行する側の契約であって logging skill 自身は保証しない。参照先が実在するかの書込時検証がないため、typo した related_log_id が黙って壊れたポインタになりうる。

## 総評

記憶外部化 skill として設計成熟度は高い。とりわけ「canonical root の決定論的解決(V-1)」と「local 隔離 → promote 昇格の fail-closed 信頼境界(S-1.1/S-1.5)」は、実害(worktreeログ消失・未検証知見の共有)を祈りでなく構造で封じており模範的。最優先の改善点は enforcement の非対称性 — パス解決は機械化済みなのに、必須field/H2/date規約/昇格前監査 は依然 must 散文と手動 promote に依存しており、過去に散文が破られた実績(date規約反転)がその脆さを示している。V-1.1 に沿って検証を hook/lint に固定化し、K-1.2 の監査ゲートを(少なくとも tracked-local では)強制化することが次の一手。

> レポートファイル: ~/.claude/output/essence-review-2026-07-05-0038.md / 同ベース名の .html
