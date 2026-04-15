---
id: TICKET-001
title: trilayer-harness-playground README を team-documenter で生成
type: ticket
status: done
priority: high
created: 2026-04-15
updated: 2026-04-15
related_spec: .docs/specs/trilayer-readme-generation.md
assignee_team: team-documenter
artifact: README.md
---

# TICKET-001: README generation

## 目的

本 playground の README.md を `team-documenter` agent で生成する。
Phase 3 自己適用の対話モード round trip を実証する。

## 入力

- Spec: `.docs/specs/trilayer-readme-generation.md`
- 参照先: `.docs/plans/2-layer-harness-framework-construction.md` (設計書)
- 参照先: `~/.claude/skills/three-elements-harness/SKILL.md`

## 受入条件

1. `README.md` がプロジェクトルートに生成される
2. Spec の全 WHAT 項目が記述されている
3. trilayer 3 層契約(Macro/Micro/Project OS)に言及がある
4. `.docs/trilayer/status.yml` / `.docs/plans/2-layer-harness-framework-construction.md` への相対リンクが動作

## ステータス遷移想定

```
todo → in_progress (team-documenter 起動時)
in_progress → review (README.md 生成完了)
review → done (レビュー pass)
```

## 担当

- assignee_team: `team-documenter`
- invocation: Agent tool (via subagent_type=team-documenter)
