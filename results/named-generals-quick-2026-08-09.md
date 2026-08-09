# Named Generals Quick Round Robin — 2026-08-09

## Manifest

- 7 named generals
- 21 unique pairings
- 2 games per pairing, with colors reversed
- 42 games total
- 20-round simulation cap
- Scoring: win 1, draw 0.5, loss 0
- Rules version 1.0.0
- Engine commit: `5228ef1e1914a318411ee5c06b700159e0a894bb`
- Machine-readable game-level evidence: `named-generals-quick-2026-08-09.json`

## Standings

| Rank | General | W | L | D | Points | Red wins | Blue wins |
|---:|---|---:|---:|---:|---:|---:|---:|
| 1 | Scipio the Wiser | 10 | 1 | 1 | 10.5 | 6 | 4 |
| 2 | Emu | 8 | 1 | 3 | 9.5 | 6 | 2 |
| 3 | Hannibal | 4 | 5 | 3 | 5.5 | 1 | 3 |
| 4 | Narses | 3 | 4 | 5 | 5.5 | 1 | 2 |
| 5 | Surena | 1 | 2 | 9 | 5.5 | 0 | 1 |
| 6 | Paullus | 2 | 4 | 6 | 5.0 | 1 | 1 |
| 7 | Crassus | 0 | 11 | 1 | 0.5 | 0 | 0 |

There were 28 elimination results and 14 draws at the round cap.

## Interpretation

Scipio the Wiser is the clearest overall winner in this tiny field: it swept Hannibal, Paullus, Narses, and Crassus, took 1.5/2 points from Surena, and finished a full point ahead of Emu. It is not an uncontested champion, however. Scipio and Emu split their two games, with each winning as Red; Emu's only loss in the tournament was that game against Scipio.

This run does **not** show a broad rock-paper-scissors ecology. The top looks more like a two-general tier: Scipio is the stronger field generalist, while Emu is a credible direct rival. There are matchup effects below them—Emu swept Hannibal, Hannibal took 1.5/2 from Paullus, and Hannibal/Narses split—but they do not form a clean counter cycle.

The 14 capped draws matter. Surena drew nine games, so its middle score reflects non-losses more than conversion into victories. Because each color matchup was run only once and these policies are currently deterministic, this is a smoke test rather than evidence of statistically stable rankings. The conspicuous Red advantage among the leaders (12 Red wins versus 6 Blue wins for Scipio and Emu combined) also merits a larger seeded follow-up before making balance claims.
