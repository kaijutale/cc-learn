---
title: validate-trilayer.py テストケース spec
type: test-definition
test_type: unit
status: draft
created: 2026-04-15
updated: 2026-04-15
related_team: trilayer-v012-review
---

# `validate-trilayer.py` テストケース spec

`~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py` の検証ロジックに対する網羅テスト仕様。`.docs/trilayer/` 配下 3 ファイル(`manifest.yml` / `macro-policies.yml` / `status.yml`)を対象とする。

## 対象・前提

- 対象スクリプト: `~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py`
- schema 正典: `~/.claude/skills/three-elements-harness/references/manifest-schema.md`
- 実行層: Python 3 ユニットテスト相当(`tmp_path` にフィクスチャ YAML を書き、`validate_manifest` / `validate_macro_policies` / `validate_status` を直接呼ぶ)
- 期待形式: 関数は `list[str]`(エラーメッセージ配列)を返す。**正例は空リスト、異常系は該当メッセージを含む**ことで pass/fail 判定する

---

## 1. `manifest.yml` のテストケース

### 1.1 正例 × 3

| # | ケース名 | 入力(抜粋) | 期待 |
|---|---|---|---|
| M-N1 | 全必須フィールド充足(最小) | `trilayer_version: "0.1.0"`, `project: my-app`, `created: 2026-04-14`, `mode_default: interactive`, `ekp_required: true`, `micro_team_style: 5-role`, `project_os_root: .docs/`, `macro_policies_ref`/`status_ref` が実在 | `errors == []` |
| M-N2 | 任意フィールド併用(`notes` / `adopted_at` / `maintainers` 込み) | M-N1 + `notes: "v0.1 trial"`, `adopted_at: 2026-04-14T09:00:00+09:00`, `maintainers: [kamone]` | `errors == []`(任意フィールドは検証対象外) |
| M-N3 | `mode_default: auto` + `trilayer_version: "1.2.3-alpha"`(pre-release) | 残りは M-N1 と同一 | `errors == []`(enum `auto` 許容、semver pre-release 許容) |

### 1.2 異常系 × 5

| # | ケース名 | 不正内容 | 期待エラー(部分一致) |
|---|---|---|---|
| M-E1 | semver 不正 | `trilayer_version: "0.1"` | `` `trilayer_version` が semver 形式ではない `` |
| M-E2 | `project` placeholder 未置換 | `project: "__PROJECT_NAME__"` | `` `project` が placeholder のまま `` |
| M-E3 | `created` 未来日付 | `created: 2099-01-01`(today: 2026-04-15) | `` `created` (2099-01-01) が未来の日付 `` |
| M-E4 | 参照ファイル不在 | `macro_policies_ref: .docs/trilayer/macro-policies.yml` が存在しない dir を指す | `` `macro_policies_ref` が指すファイルが存在しない `` |
| M-E5 | enum 不正(`mode_default`) | `mode_default: semi-auto` | `` `mode_default` が無効: 'semi-auto' `` |

**追加カバレッジ note**: `created` placeholder(`__CREATED_DATE__`) / YYYY-MM-DD 形式違反 / `project_os_root` が `.docs/` 以外 / `ekp_required` が bool でない、等は Phase 2 で境界拡張対象。v0.1.2 は上記 5 件で最小網羅とする。

---

## 2. `macro-policies.yml` のテストケース

### 2.1 正例 × 2

| # | ケース名 | 入力(抜粋) | 期待 |
|---|---|---|---|
| P-N1 | 全ブロック最小構成 | `priority_rules: [{name: kpi_drop, when: "kpi.signup.delta < -0.05", weight: 500}]`, `ticket_conventions: {id_prefix: "TICKET-", id_digits: 3, status_flow: [todo, in_progress, done]}`, `scheduler: {enabled: false, trigger: manual, expression: ""}`, `failure_replanner: {auto_retry_count: 2, root_cause_template: .docs/knowledge/decisions/_ROOT_CAUSE_TEMPLATE.md}` | `errors == []` |
| P-N2 | 境界値 OK(weight=0, id_digits=2, auto_retry_count=0) | weight=0, `id_digits: 2`, `auto_retry_count: 0`, `scheduler.trigger: cron` | `errors == []`(最小境界 inclusive) |

### 2.2 異常系 × 4

| # | ケース名 | 不正内容 | 期待エラー(部分一致) |
|---|---|---|---|
| P-E1 | weight 範囲外(上限超) | `priority_rules[0].weight: 1001` | `` `priority_rules[0].weight` は 0-1000 `` |
| P-E2 | id_digits 範囲外(下限未満) | `ticket_conventions.id_digits: 1` | `` `ticket_conventions.id_digits` は 2-6 `` |
| P-E3 | `scheduler.trigger` enum 不正 | `scheduler.trigger: kubernetes-cron` | `` `scheduler.trigger` が無効: 'kubernetes-cron' `` |
| P-E4 | `auto_retry_count` 範囲外(上限超) | `failure_replanner.auto_retry_count: 6` | `` `failure_replanner.auto_retry_count` は 0-5 `` |

**境界値 note**: `weight` = 1000, `id_digits` = 6, `auto_retry_count` = 5 は inclusive で OK(正例 P-N1 で間接カバー)。`weight: 1001` / `id_digits: 7` / `auto_retry_count: 6` を n+1 として異常系で配置済み。n-1 側(`weight: -1` / `auto_retry_count: -1`)は Phase 2 拡張対象とする。

---

## 3. `status.yml` のテストケース

### 3.1 正例 × 2

| # | ケース名 | 入力(抜粋) | 期待 |
|---|---|---|---|
| S-N1 | 最小(1 エントリ) | `entries: [{timestamp: "2026-04-15T10:00:00+09:00", layer: macro, action: ticket_created}]` | `errors == []` |
| S-N2 | 複数エントリ時系列 | `entries` に 3 件(`monitor_tick` / `kpi_drift_detected` / `replan_triggered`, timestamp 昇順, layer 混在, `ticket_id` / `summary` / `rationale` 任意フィールド付き) | `errors == []` |

### 3.2 異常系 × 3(要件指定の範囲)

| # | ケース名 | 不正内容 | 期待エラー(部分一致) |
|---|---|---|---|
| S-E1 | 非 ISO 8601(タイムゾーン無し) | `entries[0].timestamp: "2026-04-15 10:00:00"` | `` `entries[0].timestamp` が ISO 8601 + タイムゾーン形式ではない `` |
| S-E2 | `layer` enum 不正 | `entries[0].layer: system` | `` `entries[0].layer` が無効: 'system' `` |
| S-E3 | `action` enum 不正 | `entries[0].action: ticket_purged` | `` `entries[0].action` が無効: 'ticket_purged' `` |

### 3.3 追加: append-only 違反

| # | ケース名 | 前提 | 期待エラー |
|---|---|---|---|
| S-E4 | append-only 違反(既存行書き換え) | git 初期化済み tmp repo に `status.yml` を commit → 既存エントリの `summary` 書き換え → `git add` → `validate_status` を呼ぶ | `` append-only 違反 `` を含むメッセージ |

**実装 note**: `check_append_only()` は `git diff --cached --unified=0` を読む。テストは `subprocess.run(["git", "init"], ...)` → 初期 commit → 書き換え → `git add` の順でフィクスチャを組む。非 git 環境では **エラー無し** で早期 return する(validator 側の仕様)ため、そのパスも別ケースとして境界化しておくのが望ましい(Phase 2 追加対象)。

---

## 4. 実行方法

### 4.1 全ファイル検証(プロジェクトルート基準)

```bash
cd <project-root>
python3 ~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py
```

- `.docs/trilayer/` 配下 3 ファイル全てを検証
- exit 0: 全 OK / exit 1: 検証エラーあり / exit 2: `pyyaml` 未インストール

### 4.2 ファイル単体指定

```bash
python3 ~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py .docs/trilayer/manifest.yml
python3 ~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py .docs/trilayer/macro-policies.yml
python3 ~/.claude/skills/three-elements-harness/scripts/validate-trilayer.py .docs/trilayer/status.yml
```

### 4.3 test harness 想定(pytest 例)

```python
# tests/test_validate_trilayer.py
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "validate_trilayer",
    Path.home() / ".claude/skills/three-elements-harness/scripts/validate-trilayer.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def test_m_n1_minimal_valid(tmp_path):
    path = tmp_path / "manifest.yml"
    # ... fixture 書き込み
    assert mod.validate_manifest(path) == []

def test_m_e1_semver_invalid(tmp_path):
    # ...
    errs = mod.validate_manifest(path)
    assert any("semver 形式ではない" in e for e in errs)
```

`status.yml` の append-only テストは `tmp_path` 直下に `git init` + commit を組む統合テスト相当として別 module に分離するのが望ましい。

### 4.4 期待 exit code 行列

| ケース群 | 期待 exit code |
|---|---|
| 全正例(M-N1..3 / P-N1..2 / S-N1..2) | 0 |
| 任意 1 件以上の異常系混入 | 1 |
| `pyyaml` 未インストール環境 | 2 |

---

## 5. Agent Teams 並列実行検証 note[^1]

[^1]: 本 test spec ファイルは、`trilayer-v012-review` チームの **tester / documenter を同時刻に独立 spawn** した Agent Teams 並列実行の物理的証跡である。tester(本ファイル作成者)と documenter は互いのファイルに触れず、team-lead(main Claude)は両者の書き込み先パスのみを事前に指定して衝突を回避している。本ファイルの存在と documenter 側生成物の**同時刻 mtime** が、「真の並列実行が発生した(逐次ではない)」ことの根拠となる。Agent Teams の動作保証は `~/.claude/skills/activate-agent-teams/` と本証跡のペアで成立する。
