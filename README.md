# OutMatch — Lords & Hunters

**OutMatch: Lords & Hunters** is a playable tactical strategy game on a radius-3, 37-hex board. It uses the G33 Reach/Core112 rules and all 44 selected G33 opponents from the supplied handoff.

## Play locally

```bash
npm install
npm run dev
```

Open the shown address, choose an opponent, and decide whether to move first as Red or second as Blue, then select **Play**.

## Rules

- Red moves first, and every existing unit activates once per side turn.
- **Archer:** moves one hex and may shoot an adjacent enemy before or after moving.
- **Cavalry:** moves up to three hexes and may pass through allies; entering a pike-threatened cell ends its movement.
- **Pikeman:** moves one hex. To attack an adjacent enemy, click that enemy: the pike thrusts from halfway between the hexes, then you choose **Advance** into the captured hex or **Fall back** to the original hex. Either choice consumes the activation.
- On odd rounds, commit a hidden reinforcement; it deploys beside your base on your next turn.
- Eliminate the opposing army. At the round-20 cap, material, captured material, then pressure decide the winner.

Opponents use the handed-off G33 Core112 action, recruitment, deployment, and complete 54-locus positional scoring equations with depth-3 receding-horizon planning. The authoritative handoff material is retained under `data/g33/`.

## Commands

```bash
npm test
npm run build
npm run check
(cd data/g33 && node verify_engine.js)
```

The older handoff archives and modular files under `src/` remain historical reference material; `index.html` is the self-contained playable.
