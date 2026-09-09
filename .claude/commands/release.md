---
description: Push the latest code, publish it live via GitHub Pages, and report the public URL
---

Publish the current state of this repo as a live, public URL using GitHub Pages. Do this end-to-end without stopping for confirmation unless one of the explicit stop conditions below is hit — the goal is a URL at the end, not a checklist of questions.

1. `git status`. If there are uncommitted changes, commit them the same way `/commit` does (stage, write a concise message, commit) — don't ask, just do it, then continue.
2. Add a release note: find the range since the last entry (`git describe --tags --abbrev=0` for the last tag, else the full history), look at `git log <range> --format='%h %s'`, and write ONE short human-readable line summarizing what this release covers. Prepend it to `CHANGELOG.md` at the repo root under today's date (create the file with a `# Changelog` heading if it doesn't exist). Commit that change (`Update changelog` or similar) — don't ask, just do it.
3. Determine the current branch (`git branch --show-current`) and push it: `git push origin <branch>`. If push fails (auth error, rejected, etc.), stop and show the exact error — don't retry blindly or silently change remotes/credentials.
4. Parse `owner` and `repo` from `git remote get-url origin` (strip `.git`, strip any `user@` prefix).
5. Get an API token without ever printing it: run `git credential fill` with `protocol=https` and `host=github.com` piped in, extract the `password=` line into a shell variable. If no credential is found, stop and tell the user to authenticate (see how `/release` was originally set up).
6. `GET https://api.github.com/repos/{owner}/{repo}` with `Authorization: token $TOKEN`. If `"private": true`, stop and tell the user GitHub Pages needs the repo public (or a paid plan) — ask before changing visibility, never flip it automatically.
7. `GET https://api.github.com/repos/{owner}/{repo}/pages`.
   - 404 → enable it: `POST` the same URL with body `{"source":{"branch":"<branch>","path":"/"}}`.
   - 200 → already enabled, nothing to do here.
8. Poll `https://{owner}.github.io/{repo}/` (plain `curl -s -o /dev/null -w '%{http_code}'`, no auth needed — it's public) every ~15s, up to ~5 times, until it returns `200`. Pages builds lag a bit after a push, especially right after first enabling.
9. Report the final URL back to the user plainly, e.g.: "Live at https://{owner}.github.io/{repo}/". If it still isn't 200 after polling, say so and give the URL anyway with a note that the build may still be in progress.

Never print the API token in any command output or message.
