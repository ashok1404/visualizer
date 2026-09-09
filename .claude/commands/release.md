---
description: Push the latest code and publish it live via GitHub Pages, then report the public URL
---

Publish the current state of this repo as a live, public URL using GitHub Pages.

Steps:
1. Run `git status`. If there are uncommitted changes, tell the user and ask whether to commit them first (or run `/commit`) — do not silently commit on their behalf here.
2. Push the current branch to `origin` (`git push origin <branch>`).
3. Determine the repo owner/name from `git remote get-url origin`.
4. Get a token for API calls without printing it: `git credential fill` (feed it `protocol=https`, `host=github.com`) and extract the `password=` value into a shell variable — never echo the token itself to output.
5. Check repo visibility with `GET https://api.github.com/repos/{owner}/{repo}` (Authorization: token $TOKEN, Accept: application/vnd.github+json). If `"private": true`, stop and tell the user GitHub Pages needs the repo to be public (or a paid plan) — ask before changing visibility, don't do it automatically.
6. Check if Pages is already enabled: `GET https://api.github.com/repos/{owner}/{repo}/pages`.
   - If it 404s, enable it: `POST https://api.github.com/repos/{owner}/{repo}/pages` with body `{"source":{"branch":"<branch>","path":"/"}}`.
   - If it already exists, that's fine — just note the current config.
7. The live URL is `https://{owner}.github.io/{repo}/` (or the `html_url` field from the Pages API response). GitHub Pages builds take a minute or two after first enabling — mention that if it was just created.
8. Report the final public URL back to the user clearly.

Never print the API token in any command output or message.
