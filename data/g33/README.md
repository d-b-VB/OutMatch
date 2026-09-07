# G33 Human Opponent Export

This package contains **44 G33 OutMatch generals** selected for the human-playable GitHub version.

## Why these 44

They are exactly the G33 survivors that participate in at least one of the **51 exact balanced five-general non-transitive loops**.  In each such five-way loop, every general has a clear two-color directional result against every other member and beats exactly two while losing to exactly two.

The five G33 survivors not included are: Nymor Martell, Hedgehog, Ashstaff, Fingon, Mercury.

The same survivor ecology contains 540 clean three-way loops.  All 44 exported generals participate in at least one clean triangle as well.

## Files

- `g33_human_opponents.json` — rich authoritative export with full Core112 genomes plus emoji, stars, style tags, performance and loop metadata.
- `g33_human_opponents.engine.json` — plain array version convenient for the canonical engine and simple loaders.
- `g33_human_opponents.csv` / `.xlsx` — human-readable roster.
- `g33_exact_5way_loops.json` — all 51 exact balanced five-way loops by name.
- `outmatch_engine_core112.js` — exact G33 canonical Reach/Core112 engine reference.
- `core112_genome_schema.json` — exact 112-locus nested schema.
- `CODEX_HANDOFF.md` — integration notes for the GitHub/browser version.
- `engine_regression_cases.json` + `verify_engine.js` — regression checks for an adapted engine.

## Difficulty stars

Stars measure **overall G33 Generalist strength across all 343 generals**, not matchup certainty:

- ★★★★★ = ranks 1–14
- ★★★★☆ = ranks 15–49
- ★★★☆☆ = ranks 50–99
- ★★☆☆☆ = ranks 100–199
- ★☆☆☆☆ = ranks 200–343

Because this roster was selected for non-transitivity, a low-star specialist can still be a hard counter to a high-star opponent.

## Emoji legend

🐎 cavalry / Horse Lord · 🛡️ pike / Pike Lord · 🏹 archer / Archer Lord · 🎯 hunter · 🔴 Red specialist · 🔵 Blue specialist · ⚡ fast finisher · 🗿 Giant Slayer

Canonical engine SHA-256: `842e472816bfff1f66cdded41d54a45d66d3fcd33b1c0321297676157cd9e8bb`
