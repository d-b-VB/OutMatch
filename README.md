# OutMatch

**OutMatch** is a playable tactical strategy game on a radius-3, 37-hex board. Command Pikemen, Archers, and Cavalry, secretly recruit reinforcements, and eliminate the opposing army before the round-20 adjudication.

This build uses the exact current playable from the two newest G67 handoffs. The v2 handoff is authoritative: its browser engine, depth-3 genome evaluator, recruitment logic, deployment logic, and eight unmodified G66 opponents are preserved in `index.html`. The older `OutMatch_Codex_Handoff.zip` and the modular files under `src/` remain historical background only; they are not used by the playable.

## Play locally

```bash
npm install
npm run dev
```

Open the address shown by the local server. The War Room menu lets you choose one of the eight Sun Tzu G67 enrollees and decide whether to take the first move as Red or answer as Blue. Select **Enter the board** to begin.

## How to play

- Red moves first.
- Every existing unit activates once per side turn.
- **Pikeman:** moves one hex and captures by moving onto an enemy.
- **Archer:** moves one hex and may shoot an adjacent enemy before or after moving.
- **Cavalry:** moves up to three hexes and may pass through allies, but cannot pass through a hex threatened by an enemy pikeman.
- On odd rounds, commit a hidden reinforcement; it deploys beside your base on your next turn.
- Eliminate the opposing army. At the round-20 cap, material, captured material, then pressure decide the winner.

The opponent uses the handed-off 112-locus genome evaluator for recruitment, deployment, and depth-3 receding-horizon action planning. It replans after every activation.

## Commands

```bash
npm test       # rules and authoritative-playable regression tests
npm run build  # copy the self-contained playable to dist/
npm run check  # tests and production build
```

Historical simulation commands are still available for studying the prior engine, but do not represent the current G67 evaluator.

## Source hierarchy

1. `OutMatch_G67_Codex_Handoff_v2.zip` — authoritative current engine and genetics.
2. `OutMatch_G67_Codex_Handoff.zip` — matching current playable and immediate-source data.
3. `OutMatch_Codex_Handoff.zip` and the prior modular implementation — background only.
