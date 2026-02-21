---
name: creating-feature-trial-issues
description: Extract tryable feature updates from changelog or update summary files and create structured GitHub issues for feature trial tracking. Use when the user mentions "changelog issue化", "feature trial issues", "アプデをissue化", "機能試行issue", "新機能をissueに", "changelog to issues", "試せる機能をissue化", or wants to create GitHub issues from update/changelog content for testing new features.
---

# Creating Feature Trial Issues

Extract tryable feature updates from changelog/update summary files and create GitHub issues with structured trial instructions.

## Workflow

1. Read the specified changelog or update summary file
2. Extract tryable features using the filtering criteria
3. Verify GitHub repository connectivity (`gh repo view`)
4. Create or verify the `feature-trial` label exists
5. Create issues in parallel batches (4 at a time)
6. Present summary table of all created issues

## Step 1: Read and Analyze Source File

Read the file specified by the user. Identify sections containing feature additions, new capabilities, and user-facing changes.

## Step 2: Extract Tryable Features

Apply filtering criteria to separate tryable features from non-tryable items.

**Include** (user can actively try):
- New CLI flags/options, slash commands, configuration options
- New hook events, workflow capabilities, tool features
- New authentication/session management features, UI/UX enhancements

**Exclude** (not directly tryable):
- Security fixes, performance improvements, memory leak fixes
- Breaking changes/deprecations, bug fixes, internal refactoring

For each feature, extract: feature name, version number, description, setup steps, and related details.

## Step 3: Verify GitHub Connectivity

```bash
gh repo view --json nameWithOwner
gh label list --repo <REPO>
```

If `feature-trial` label does not exist, create it:
```bash
gh label create "feature-trial" --repo <REPO> --description "新機能の試行・検証" --color "1d76db"
```

## Step 4: Create Issues

For issue body template and title format, read [references/issue-template.md](references/issue-template.md).

Create issues in parallel batches of 4 using `gh issue create`:

```bash
gh issue create --repo <REPO> \
  --title "試行: [Feature Name]（[Supplement]）" \
  --label "feature-trial" \
  --body "$(cat <<'EOF'
[Issue body from template]
EOF
)"
```

Assign difficulty per feature: Low (instant try), Medium (some setup), High (complex setup).

## Step 5: Present Summary

After all issues are created, present a summary table with issue numbers, titles, and difficulty levels. Include the repository issues URL filtered by the `feature-trial` label.
