# turkey-run

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/vanoder/turkey-run/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/vanoder/turkey-run/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

**Gobble Run** — a turkey escape game: you are the turkey sprinting across the
farm to escape becoming Thanksgiving dinner. The farmer chases from behind
(the chase bar shows how close he is); ovens roll at you, carving knives fly
at chest height, pitchforks stand in the ground. Grab corn for bonus points.
One hit and it's dinner time.

Three screens: a title screen, a run in play with a HUD (score, distance,
corn, level, farmer meter), and a CAUGHT! end screen with restart.

## Run it

```sh
node serve.ts        # then open http://localhost:8080 in desktop Chrome
```

No build step, no network request: `game/` is plain static files (canvas 2D,
ES modules). Keyboard (Space jump, ↓ duck, P pause) or pointer (left half
jump, right half duck). `main.ts` hands the game in: it copies `game/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes
`dossier.json` with the vendored make.fun library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
