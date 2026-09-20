# Codex handoff: G33 human-play engine

Use `outmatch_engine_core112.js` in this package as the **authoritative behavior reference**.  It is the exact G33 tournament engine; port its game logic into the GitHub/browser code rather than adapting an older genome evaluator.

## Core rule changes that must be preserved

### Pike Reach / poke

Pikes have two offensive choices:

1. **Poke**: kill an adjacent enemy without moving.  In the canonical engine this is the `poke` action and uses the same adjacent-target lookup as the archer.
2. **Move-attack**: a pike may still move into an adjacent enemy-occupied hex and capture by occupying that hex.

`POKE_ORDER` defaults to `before`; preserve canonical default behavior.

Pikes also create the existing anti-cavalry shield zone.  Cavalry may enter a hex adjacent to an enemy pike, but that hex terminates cavalry traversal; cavalry cannot pass through that pike-adjacent zone.

### Other unit movement

- **Archer**: moves one hex; may shoot an adjacent enemy before moving, after moving, or shoot without moving.
- **Cavalry**: moves up to three hexes; may traverse friendly-occupied cells without landing on them; entering an enemy cell captures and stops movement.

### Board / opening

Radius-3 axial hex board (37 cells).  Bases are `(-3,0)` Red and `(3,0)` Blue.

Starting units:
- Red: P `(-2,0)`, A `(-3,1)`, C `(-2,-1)`
- Blue: P `(2,0)`, A `(3,-1)`, C `(2,1)`

### Reinforcements

The engine uses committed spawning.  On odd rounds, a side commits its next reinforcement if none is pending.  The pending unit deploys beside the base on that side's next turn when space is available.

## Core112 genomes

Every exported opponent has `genomeSchema = "outmatch-core112-complete-position-v1"` and exactly **112 numeric loci**:

| Group | Loci |
|---|---:|
| action | 9 |
| attacker | 3 |
| captureTarget | 3 |
| cell | 28 |
| deploy | 3 |
| position | 54 |
| recruit | 8 |
| search | 1 |
| sequence | 3 |
| **Total** | **112** |

The important addition versus older compact genomes is the **54-locus `position` block**:

`acting unit type × friend/enemy × encountered unit type × distance 1–3`

Do not silently drop this block or map it onto an older genome layout.  `core112_genome_schema.json` contains the exact keys.

## AI policy

Canonical search depth is 3.  Candidate action breadth is 8 and beam width is 4.  Recruitment, deployment and action evaluation all read directly from the nested Core112 genes.

For browser integration, the current file is CommonJS/Node and has a small `fs`-based CLI at the bottom.  Codex can remove the CLI and expose the required turn-level functions, but should preserve the policy functions and scoring equations byte-for-byte where practical.

A typical browser adaptation will need to expose equivalents of:

- initial board creation / state conversion
- `aiRecruit`
- `aiDeploy`
- `planTurn`
- `applyAction`
- action conversion (`poke`, `move`, `shoot`, `moveshoot`, `shootmove`)

## Regression requirement

Before replacing the old human-game AI, run the included `engine_regression_cases.json`.  `verify_engine.js` checks 16 exact matchup outcomes against the bundled canonical Node engine.  A browser port should reproduce the same winner and elimination round for every case.

Run reference verification:

```bash
node verify_engine.js
```

Expected:

```text
PASS: 16 canonical G33 engine regression cases
```

Engine SHA-256: `842e472816bfff1f66cdded41d54a45d66d3fcd33b1c0321297676157cd9e8bb`
