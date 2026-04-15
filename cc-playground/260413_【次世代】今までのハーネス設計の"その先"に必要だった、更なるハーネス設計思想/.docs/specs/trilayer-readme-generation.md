---
title: trilayer-harness-playground README generation
type: spec
status: active
created: 2026-04-15
updated: 2026-04-15
related_goal: "この playground が three-elements-harness の reference implementation であることを説明する README を生成"
---

# Spec: trilayer-harness-playground README

## 目的

本 playground が three-elements-harness (trilayer) の reference implementation であり、
`~/.claude/skills/three-elements-harness/` の Phase 3 自己適用対象であることを、
簡潔な README.md として説明する。

## WHAT

- 本 playground のディレクトリ配置
- trilayer 3 層契約(Macro/Micro/Project OS)の要約
- Phase 3 dogfooding の証跡位置(`.docs/trilayer/status.yml`)
- 関連資産へのリンク(設計書 / SKILL / 3層契約正典)

## 受入条件

- README.md がプロジェクトルートに存在する
- 全 section が埋まっている(穴あきなし)
- 3層契約への言及がある
- 関連ドキュメントへのリンクが有効

## 完了定義

1. README.md 実在
2. trilayer validator green
3. EKP validator green (EKP 範囲に触れていない)
4. ticket status が done に遷移
