---
description: Stage all changes and create a git commit with a generated message
---

Stage all pending changes in this repository and create a git commit.

Steps:
1. Run `git status` to see untracked and modified files, and `git diff` (staged and unstaged) to see what changed.
2. Stage the relevant files (avoid staging anything that looks like a secret or credential file).
3. Write a concise commit message (1-2 sentences) describing the "why" of the change, following the style of recent commits (`git log --oneline -5`).
4. Create the commit with that message.
5. Run `git status` after committing to confirm success.

Do not push unless explicitly asked to.
