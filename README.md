# OutMatch

**OutMatch** is a compact tactical strategy game played on a 37-hex board. Command Pikemen, Archers, and Cavalry; recruit reinforcements in secret; and eliminate the opposing army.

## Play locally

```bash
npm install
npm run dev
```

Open the address shown by the local server. Choose Red or Blue, select a named general, and enter the board.

## Commands

```bash
npm test       # canonical rules regression suite
npm run build  # production browser build
npm run check  # tests and build
npm run tournament:named -- results/named-generals.json # color-balanced named round robin
npm run campaign:evolve -- results/evolution-campaign.json # seeded multi-generation ecology
npm run analyze:quick-losses # audit short games and reproduce representative traces
```

## Current milestone

- Shared deterministic JavaScript rules engine implementing the canonical 1.0 rules.
- Responsive human-vs-AI browser client with seven distinct named generals.
- Exact legal move highlighting, hidden recruitment, delayed deployment, and elimination victory.
- Compact replay codes and a local completed-game archive.
- Tactical one-reply safety evaluation layered over each general's doctrine.

The original design handoff remains in `OutMatch_Codex_Handoff.zip`; its canonical game specification takes precedence when extending the project.
