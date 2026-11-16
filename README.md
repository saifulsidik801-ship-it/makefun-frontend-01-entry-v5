# makefun-frontend-01-entry-v5

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/saifulsidik801-ship-it/makefun-frontend-01-entry-v5/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/saifulsidik801-ship-it/makefun-frontend-01-entry-v5/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A fast, read-only make.fun frontend from static files: live bounty board, bounty pages beside the board, 50-row leaderboard pages, and public profiles — on make.fun's public API alone. First load is a tiny shell (index.html + router, ~2 KB gzip); every view arrives later by dynamic import(). One JSON endpoint per view, an ETag-revalidated cache with a visible request counter, and board rows patched in place instead of re-rendered.

## Run it

```sh
python3 -m http.server 8080 --directory app
# open http://localhost:8080/
```

## Build the dossier

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=59gqp20q&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards</sub>
