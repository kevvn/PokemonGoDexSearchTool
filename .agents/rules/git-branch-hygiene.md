---
trigger: always_on
description: Keep local main synced with origin/main and prevent stale-branch PR merge conflicts
---

# Git Branching & PR Hygiene

This repository uses **Squash & Merge** on GitHub for `main`, and multiple worktrees share the same `.git` directory. If local `main` falls behind `origin/main`, new worktrees branch off stale commits and produce merge conflicts on every PR.

## Mandatory Rules

1. **Sync `origin/main` before starting work on a branch or worktree:**
   - Run `git fetch origin main` before making edits on a new feature branch/worktree.
   - Check `git rev-list --left-right --count origin/main...HEAD`. If `origin/main` is ahead of your branch's merge-base, fast-forward local `main` (`git branch -f main origin/main` if `main` is not checked out elsewhere) and rebase your branch onto `origin/main` (`git rebase origin/main`) before editing.
2. **Never push or open a PR from a stale base:**
   - Before `git push` / `gh pr create`, always run `git fetch origin main` and verify `git merge-base --is-ancestor origin/main HEAD`.
   - If `origin/main` has advanced, rebase onto `origin/main`, re-run `npm test -- --run && npm run lint && npm run build`, and then push.
3. **Never reuse already-merged feature branches:**
   - Always create a fresh branch off `origin/main` (`git checkout -b <type>/<name> origin/main`) instead of committing onto a branch whose PR was already squash-merged.
