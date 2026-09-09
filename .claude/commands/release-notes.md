---
description: Generate release notes from recent commits and update CHANGELOG.md
---

Generate release notes covering everything committed since the last release, and record them in `CHANGELOG.md`. Do this end-to-end without stopping to ask — figure it out from git history and just produce the notes.

1. Find the range: `git describe --tags --abbrev=0` for the last tag. If there is one, use `<tag>..HEAD`; if there's no tag, use the full `git log --oneline` history.
2. Read the commits in that range (`git log <range> --format='%h %s'`) and group them into sensible categories based on what they actually changed (e.g. Added, Changed, Fixed) — infer the category from the commit message and diff, don't just dump raw commit messages.
3. Write a short, human-readable entry: a heading (today's date, and the tag name if one exists or "Unreleased" if not), then bullet points per category. Skip categories with nothing in them.
4. Prepend that entry to `CHANGELOG.md` at the repo root (create the file with a `# Changelog` heading if it doesn't exist yet — newest entry always goes at the top, right under the heading).
5. Show the generated entry to the user in the response.
6. Do not commit or push automatically — leave that to `/commit` or `/release` so the user decides when. Mention that as the next step.
