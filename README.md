# OutMatch

**OutMatch** is a playable tactical strategy game on a radius-3, 37-hex board. The opening War Room now contains two complete versions:

- **Lords & Hunters** — the new G33 Reach/Core112 game, with all 44 selected G33 opponents from the supplied handoff. Pikemen can poke adjacent enemies without moving, and every opponent uses the complete 112-locus evaluator.
- **Mercians & Macedonians** — the previous G82 playable, preserved with its 16 selected opponents and original rules.

## Play locally

```bash
npm install
npm run dev
```

Open the shown address, choose a version, an opponent, and whether to move first as Red or second as Blue, then select **Play**.

## Shared rules

- Red moves first.
- Every existing unit activates once per side turn.
- **Archer:** moves one hex and may shoot an adjacent enemy before or after moving.
- **Cavalry:** moves up to three hexes and may pass through allies; entering a pike-threatened cell ends its movement.
- **Pikeman:** has two distinct attacks in **Lords & Hunters**. Click an adjacent enemy to attack from halfway between the two hexes. After the spear thrusts and retracts, choose **advance** to occupy the captured enemy’s hex or **fall back** to return to the original hex. Either choice consumes the pike’s activation.
- On odd rounds, commit a hidden reinforcement; it deploys beside your base on your next turn.
- Eliminate the opposing army. At the round-20 cap, material, captured material, then pressure decide the winner.

Both opponent engines use depth-3 receding-horizon planning. Lords & Hunters uses the handed-off G33 Core112 action, recruitment, deployment, and complete 54-locus positional scoring equations. The authoritative G33 handoff material is retained under `data/g33/`.

## Commands

```bash
npm test                   # game and integration tests
npm run build              # copy the self-contained playable to dist/
npm run check              # tests and production build
(cd data/g33 && node verify_engine.js) # verify the canonical G33 reference engine
```

The older handoff archives and modular files under `src/` remain historical reference material; `index.html` is the self-contained playable.
