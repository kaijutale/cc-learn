# Issue Template Reference

## Issue Body Template

```markdown
## 概要
[1-2文で機能の説明]

## バージョン
[対応バージョン番号]

## 試行手順
1. [具体的な手順1]
2. [具体的な手順2]
3. [具体的な手順3]

## 関連情報
- [changelogからの補足情報]

## メモ
- [注意点や前提条件]
```

## Issue Title Format

```
試行: [機能名]（[補足キーワード]）
```

Examples:
- `試行: Agent Teams（マルチエージェントコラボレーション）`
- `試行: Worktree統合（--worktreeフラグ）`
- `試行: スピナーカスタマイズ（spinnerVerbs / spinnerTipsOverride）`

## Label

Label name: `feature-trial`
Label description: `新機能の試行・検証`
Label color: `1d76db`

Create label if it does not exist:
```bash
gh label create "feature-trial" --repo <REPO> --description "新機能の試行・検証" --color "1d76db"
```

## Filtering Criteria

### Include (tryable features)

- New CLI flags or options (e.g., `--worktree`, `--from-pr`)
- New slash commands or features (e.g., `/debug`, `/keybindings`)
- New configuration options (e.g., `spinnerVerbs`, `statusLine`)
- New hook events (e.g., `ConfigChange`)
- New workflow capabilities (e.g., Agent Teams, background agents)
- New tool features (e.g., PDF page range, bash history completion)
- New authentication or session management features
- UI/UX enhancements that change user interaction

### Exclude (not directly tryable)

- Security vulnerability fixes (already patched, nothing to "try")
- Performance improvements (internal, no user action needed)
- Memory leak fixes (internal optimization)
- Breaking changes / deprecations (migration-only, not a new feature to try)
- Bug fixes for existing behavior (restoring expected behavior)
- Internal refactoring

## Difficulty Classification

Assign difficulty based on setup complexity:

| Difficulty | Criteria | Examples |
|-----------|---------|---------|
| Low | Instant try, no setup | `/debug`, `/fast`, `auth status` |
| Medium | Some configuration or setup needed | Worktree, ConfigChange hooks, PR integration |
| High | Environment setup, experimental flags, multi-tool coordination | Agent Teams, complex MCP setups |

## Output Summary Table Format

After creating all issues, present a summary table:

```markdown
| # | Title | Difficulty |
|---|-------|-----------|
| #N | Feature Name | Low/Medium/High |
```
