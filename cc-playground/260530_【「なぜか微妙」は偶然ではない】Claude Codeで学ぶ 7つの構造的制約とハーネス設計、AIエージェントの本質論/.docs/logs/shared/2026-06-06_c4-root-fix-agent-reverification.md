---
date: 2026-06-06 08:40:00
type: validation
topic: c4-root-fix-agent-reverification
session: root修正版 coder.md の実agent再検証
target: "root修正(coder oracle呼出への --root 注入)が本物の coder agent 経由で効くか"
verifier: メインClaude (Opus 4.8) + 別セッション coder agent
related_log_ids:
  - 2026-06-05_c4-root-resolution-fix
  - 2026-06-02_c4-external-verifier-e2e-session
related_log:
  - .docs/logs/shared/2026-06-05_c4-root-resolution-fix.md
  - .docs/logs/shared/2026-06-02_c4-external-verifier-e2e-session.md
---

# C-4 root修正版 coder.md の実agent再検証

> root課題(M)修正後の coder.md を、.git除去でバグ条件を再現した sandbox で本物の coder agent に実行させ、root修正が agent経由で効く(monorepo頂点を汚染しない)ことを確認。PASS。前回の caveat(新coder.md未再実行)を解消。

---

## 検証目的

2026-06-05 の root修正 (coder.md/verify-test-fork の oracle 呼出に `--root="{WORK_DIR}"` 注入) は command level で実証済みだったが、「修正した markdown 指示に**実 coder agent が従って --root を渡すか**」が未検証 (caveat) だった。これを実機で潰す。

仮説: バグ条件 (sandbox に .git 無し → git-toplevel=monorepo頂点) で本物の coder を回したとき、修正が効いていれば state は project-local に留まり monorepo頂点は汚染されない。効いていなければ monorepo頂点が汚染される。

## 検証環境

| 項目 | 値 |
|---|---|
| 検証ディレクトリ | `c4-e2e-sandbox` (260530 PJ直下) |
| バグ条件 | `.git` 除去 → `git rev-parse --show-toplevel` = monorepo頂点 |
| ツール | vitest 4.1.8 + @vitest/coverage-v8 4.1.8 / pnpm |
| coder | 別セッション (cwd=sandbox) で `Agent(subagent_type=coder, ...)` 起動 |
| 検証主体 | coder自己申告 + 親(メイン)の独立物理確認 |

## 実測結果サマリ

| 指標 | coder自己申告 | 親の独立確認 | 一致 |
|---|---|---|---|
| monorepo頂点 汚染 | false | tdd-state無し+coverage無し=クリーン | ✅ |
| state 着地先 | project-local | coverage/ が sandbox 内に生成 | ✅ |
| assert-coverage 実走 | 100%/100% PASS | coverage/clover.xml = 当日07:21・math.ts 6/6 | ✅ |
| Test integrity | UNCHANGED | (成果物掃除済で再走不可、自己申告のみ) | ⚠️ |
| Loop / Debate | 1/3 / 0 | (同上) | ⚠️ |
| GREEN | 16/16 | (同上、handoff記載) | ⚠️ |

## 各Stage 詳細結果

### Stage 1: バグ条件の再現 — ✅
- `.git` 除去で sandbox の git-toplevel が monorepo頂点 (`claude-code-learn`) を返す状態を再現。--root 無しなら誤解決する条件が成立。

### Stage 2: 本物の coder agent 実行 — ✅
- 別セッションで coder 起動。TDDサイクル 1周GREEN完走 (RED 16件 / implement / verify)。
- coder が全 oracle 呼出に `--root="{WORK_DIR}"` を注入 (修正版 coder.md の指示に実agentが従った)。

### Stage 3: root修正の効き (本命) — ✅
- **monorepo頂点 `/Users/camone/dev/claude-code/claude-code-learn/.docs/tdd-state/` は存在せず = 汚染ゼロ** (親が独立確認)。
- coverage/ が sandbox 内に project-local 着地 (当日07:21、math.ts 100%)。
- 決定的ロジック: バグ条件下で頂点が汚染されない = coder が --root を渡した = 修正が agent経由で効いた。

## 重要発見

- **root修正は実agentで効く (caveat 解消)**: markdown指示の additive 変更 (`--root` 追記) を、実 coder agent が正しく解釈・実行することを実機確認。「指示を変えた」が「実体の挙動が変わった」ことの empirical 確認。
- **検証セッションの掃除が独立検証を阻害**: coder セッションが親切で clean RED 復帰 (red-baseline/coder-loop/math.ts を trash) したため、前回 (2026-06-02 agent層検証) のような「痕跡への全 oracle 独立再実行」が今回はできなかった。coverage/ が残っていたのが救い (フレッシュな物証になった)。
  - **改善**: 検証用 RUN-ME に「検証後は掃除せず痕跡を残す (親が独立再実行するため)」を明記すべき。tidy さより検証可能性を優先。

## 改善候補

- RUN-ME (検証用 sandbox) に「掃除禁止、痕跡保全」を追記 → 親の完全独立再検証を可能にする。
- 残: agent層 failure path (調整ループ/llm-debate/改ざんBLOCK/budget違反反応) は依然未検証 (任意)。

## 結論

root課題(M)修正は **command level + 実agent level の両方で実証完了**。C-4 外部検証器の end-to-end (oracle層 / agent層 happy path / root修正) は確定。残る未検証は agent層 failure path のみ。
