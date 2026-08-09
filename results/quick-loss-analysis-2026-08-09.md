# Quick-Loss Audit — 2026-08-09

## Correction to the campaign interpretation

The four-round median is real in the saved data, but it exposed a serious limitation of the fast screening policy. It is not safe to interpret it as a normal OutMatch game length or as evidence that half of reply-aware games should finish that quickly.

The shortest elimination was round 3. There were no round-1 or round-2 eliminations. Of 9,640 eliminations, 266 ended in round 3 and 5,103 ended in round 4. Thus 5,369 games—51.0% of all games and 55.7% of eliminations—were quick losses.

The strongest warning is color imbalance: Red won 5,083 of the 5,369 quick games. Across the complete campaign, Red won 7,061 games, Blue won 2,579, and 880 were draws. The scheduling reversed colors, but it could not repair a policy that heavily favors Red's initiative.

## Representative round-4 game

`evo-005584`, seed `23266392`  
Red: Emu Variant 215 Variant 320 Variant 555  
Blue: Wildcard-Emu Hunter 550  
Winner: Red

### Round 1

1. Both sides secretly commit reinforcements: Red chooses Cavalry; Blue chooses Pikeman.
2. Red Cavalry runs from `(-2,-1)` directly to the center `(0,0)`.
3. Red advances its Archer to `(-2,1)` and Pikeman to `(-1,0)`.
4. Blue Cavalry travels from `(2,1)` to `(0,0)` and captures the exposed Red Cavalry.
5. Blue advances its Pikeman to `(1,0)` and Archer to `(2,0)`.

### Round 2

1. Red deploys its queued Cavalry at `(-2,0)`.
2. Red Pikeman moves to `(0,0)` and captures Blue's Cavalry.
3. Red Archer advances to `(-1,0)`.
4. Blue deploys its queued Pikeman at `(3,-1)`.
5. Blue's original Pikeman captures Red's Pikeman on `(0,0)`.
6. Blue Archer advances to `(1,0)`.

### Round 3

1. Red commits another Cavalry; Blue later commits an Archer.
2. Red Archer shoots and kills Blue's original Pikeman on `(0,0)`.
3. Red's deployed Cavalry races from `(-2,0)` to `(1,0)` and captures Blue's Archer.
4. Red Archer occupies `(0,0)`.
5. Blue's only remaining unit, the newly deployed Pikeman, advances from `(3,-1)` to `(2,-1)`.

### Round 4

1. Red deploys another Cavalry at `(-2,0)`.
2. The Cavalry already on `(1,0)` moves to `(2,-1)`, captures Blue's last Pikeman, and ends the game.

This is characteristic of the fast-policy failure: both sides accept a forced center exchange, then Red's initiative and Cavalry reach turn the resulting low-unit position into a very short elimination.

## Representative round-3 game

`evo-006098`, seed `24266906`  
Red: Genghis  
Blue: Fabius-Khan  
Winner: Blue

### Round 1

1. Both sides commit Cavalry.
2. Red Cavalry immediately runs to `(0,0)`; Red also advances its Pikeman to `(-1,0)` and Archer to `(-2,0)`.
3. Blue Cavalry captures Red Cavalry on `(0,0)`.
4. Blue advances its Archer to `(2,-1)` and Pikeman to `(1,0)`.

### Round 2

1. Red deploys Cavalry at `(-2,-1)`.
2. Red Pikeman captures Blue Cavalry on `(0,0)`.
3. Blue deploys Cavalry at `(2,0)`.
4. Blue Pikeman captures Red Pikeman on `(0,0)`.

### Round 3

1. Both sides commit another Cavalry.
2. Red Archer shoots Blue's Pikeman on `(0,0)`.
3. Red's deployed Cavalry advances to `(0,0)`, while the Archer moves to `(0,-1)`.
4. Blue Archer shoots the Red Cavalry on `(0,0)`.
5. Blue's deployed Cavalry moves from `(2,0)` to `(0,-1)`, captures Red's last Archer, and wins.

This is not merely one catastrophically bad move. It is a repeated mutual liquidation pattern. Red exposes Cavalry, both sides trade their original Cavalry and Pikemen, and the side with the final Archer/Cavalry activation eliminates the remaining two-unit force.

## Are there round-2 games?

No. The minimum observed elimination was round 3, and all 266 sub-four-round games ended in round 3. This is an observation about this campaign, not a proof that a round-2 elimination is impossible under every legal policy.

## Who loses quickly?

Quick losses were widespread: 1,056 of the 1,068 genomes that played at least one campaign game suffered at least one loss by round 4.

| Share of a genome's losses ending by round 4 | Genomes |
|---|---:|
| 100% | 99 |
| 75–99% | 235 |
| 50–74% | 392 |
| 25–49% | 243 |
| Under 25% | 87 |

Among genomes with at least eight losses, 318 of 555 quick-loss sufferers lost quickly in at least half of their defeats. Thus quick losing was often repeatable for a policy, not a one-off accident.

However, quick loss rate was **higher among stronger genomes**:

| Overall win-rate band | Genomes | Losses | Quick losses | Quick share of losses |
|---|---:|---:|---:|---:|
| 0–19% | 187 | 2,369 | 771 | 32.5% |
| 20–39% | 144 | 1,483 | 654 | 44.1% |
| 40–59% | 487 | 3,996 | 2,617 | 65.5% |
| 60–79% | 250 | 1,792 | 1,327 | 74.1% |

Examples reinforce this:

- Scipio the Wiser won 149 of 276 games, yet 74 of its 117 losses were quick.
- Emu won 136 of 228, yet 63 of its 84 losses were quick.
- Hannibal won 81 of 144, yet 44 of its 59 losses were quick.
- Fabius-Khan won 83 of 128 and lost only 29, but 26 of those losses were quick.
- Conversely, Crassus won only 1 of 80, but just 15 of its 79 losses were quick; it was bad without usually dying immediately.

This is strong evidence against treating quick loss as a simple proxy for suicidal incompetence. In this screening ecology, many aggressive policies either won quickly or lost quickly, while some genuinely weak policies prolonged losing positions.

## Selection recommendation

Do not yet apply strong standalone selection against quick losses. It would disproportionately punish several of the better-performing, high-variance policies while potentially rewarding weak but passive policies.

A safer fitness component would be conditional and modest:

1. Penalize a quick loss only when an exact reply-aware audit identifies an uncompensated hanging move.
2. Compare educated and unchanged siblings on identical color-balanced panels.
3. Track both quick-loss rate and quick-win rate; distinguish decisive volatility from one-sided collapse.
4. Correct the fast policy's opening Cavalry behavior and re-run a smaller calibration field before another large campaign.
5. Require acceptable color balance and a plausible game-length distribution as campaign validity gates.

The immediate conclusion is not that OutMatch needs anti-quick-loss breeding. It is that the fast evaluator needs tactical opening sanity before its game-length distribution can drive evolution.
