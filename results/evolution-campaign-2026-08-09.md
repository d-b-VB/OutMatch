# OutMatch Evolution Campaign — 2026-08-09

> **Post-campaign validity warning:** Follow-up analysis found that the fast screening policy creates a repeated center-Cavalry exchange and a severe Red advantage. The four-round median is primarily a screening-policy artifact, not evidence that reply-aware OutMatch normally ends this quickly. See `quick-loss-analysis-2026-08-09.md`. The retained campaign remains useful as engineering/evolution evidence, but its rankings require reply-aware revalidation.

## Reproducible manifest

- Seed: `20260809`
- Rules: `1.0.0`
- Engine commit at execution: `9b67410912cd7303f83b4481febf0cdf11e0a0d7`
- Population: 240 genomes per generation
- Generations: 5
- Ecological schedule: four ring offsets, two color-reversed games per scheduled opponent
- Round cap: 60 completed rounds, raised from the earlier 20-round smoke-test cap
- Unresolved games: draws; no heuristic winner is assigned
- Machine-readable evidence: `evolution-campaign-2026-08-09.json`

The campaign uses the exact rules engine but the fast, deterministic screening policy rather than the browser generals' more expensive reply-aware action selection. The fast policy makes a five-generation, few-hundred-general campaign practical, but rankings from this campaign must not be represented as proof about deeper search.

## Population ecology

The initial population combined the seven browser generals with Agrippa, Fabius-Khan, Genghis, Ackbar, Grievous, Varro, Ventidius, and Marc Antony. It was filled to 240 with mutations, cross-pollinations, and unconstrained wild cards. Later generations retained canonical and historical controls, elites, middle and low genetic stock, 15% fresh wild cards, mutations, crosses, and target-specific assassins.

Across the campaign, 1,228 immutable genomes were generated and retained; 1,068 entered at least one game. The final generation contained 240 competitors, including 47 assassins, 94 mutations, 55 crosses, 15 wild cards, 8 direct Academy students, 6 historians, and the retained canonical/historical controls.

## Campaign scale and game length

| Measure | Result |
|---|---:|
| Games | 10,520 |
| Eliminations | 9,640 (91.6%) |
| 60-round draws | 880 (8.4%) |
| Mean length | 10.57 rounds |
| Median length | 4 rounds |
| 75th percentile | 8 rounds |
| 90th percentile | 21 rounds |
| 95th percentile | 60 rounds |

The higher cap substantially separates ordinary games from genuinely resistant matchups: half end by round 4, while the longest 5–8% form a distinct tail at the cap. Length is therefore retained per game as a useful closeness/resistance measure rather than discarded after scoring.

| Generation | Games recorded | Draws | Mean rounds |
|---:|---:|---:|---:|
| 1 | 1,920 | 291 | 15.02 |
| 2 | 2,080 | 214 | 12.46 |
| 3 | 2,080 | 123 | 9.15 |
| 4 | 2,220 | 120 | 8.33 |
| 5 | 2,220 | 132 | 8.54 |

The falling mean and draw count suggest that selection increasingly favored policies that converted positions quickly. This is an inference from the campaign, not yet a claim that shorter play is universally stronger.

## Leaders by generation

Each listed record is that generation's 16-game ecological screen, not a cumulative score.

| Generation | First | Record | Second | Record | Third | Record |
|---:|---|---:|---|---:|---|---:|
| 1 | Grievous-Ackbar 76 | 14-1-1 | Genghis-Paullus 13 | 14-2-0 | Emu Variant 57 | 14-2-0 |
| 2 | Wildcard 2-443 | 14-2-0 | Surena-Genghis Variant 429 | 13-3-0 | Genghis Variant 431 | 12-2-2 |
| 3 | Genghis-Emu Hunter 538 | 14-2-0 | Fabius-Khan-Scipio 709 | 14-2-0 | Wildcard 3-640 | 13-1-2 |
| 4 | Hannibal-Emu-Grievous-Marc-Genghis-Wildcard Hunter 759 | 13-3-0 | Fabius-Khan-Ventidius-Emu Variant 945 | 13-3-0 | Fabius-Khan | 11-1-4 |
| 5 | Fabius-Khan-Ventidius-Emu-Varro-Emu-Wildcard Student 1058 | 12-4-0 | Wildcard-Agrippa-Varro-Emu-Grievous-Wildcard Student 1060 | 12-4-0 | Wildcard-Grievous-Ackbar-Genghis-Genghis-Emu-Hannibal-Emu-Grievous-Surena-Genghis-Scipio 1090 | 12-4-0 |

There was no permanent monarch. Crosses, wild cards, assassins, and Academy-influenced descendants repeatedly displaced the previous screen leader. Fabius-Khan was the most persistent slow/resistant control near the late top: its Generation 4 screen averaged 18.8 rounds and its final screen averaged 11.6.

## Assassin programs

Every generation targeted its three emerging leaders, while Scipio the Wiser and Emu remained compulsory targets whenever present.

### Scipio

- 32 assassin genomes received direct Scipio validation.
- 132 color-balanced validation games were recorded.
- Assassins won 55, drew 8, and lost 69: 44.7% of available points.
- Three candidates swept their initial four-game Scipio set:
  - Ackbar-Scipio Hunter 279
  - Wildcard-Scipio Hunter 526
  - Hannibal-Emu-Grievous-Surena-Genghis-Scipio-Scipio Hunter 1022

### Emu

- 32 assassin genomes received direct Emu validation.
- 148 color-balanced validation games were recorded.
- Assassins won 56, drew 6, and lost 86: 39.9% of available points.
- Narses-Fabius-Khan-Emu Hunter 305 swept its initial four-game Emu set.

The perfect 4-0 candidates are promising leads, not established 100% counters. Their samples are deliberately labeled as initial screens; higher-repetition rivalry tests are still required. The aggregate results also show that Emu remained harder for the bred assassin pool to score against than Scipio.

## Historians

After three generations of history, Generations 4 and 5 spawned 12 historians; six survived into the final population. Each historian stored its sample count, win/loss game-length averages, and the exact derived adjustment. The final six studied 16–20 ancestral games each. Five inferred a preservation adjustment, while one inferred increased conversion pressure.

This first historian uses transitions in outcome length rather than snapshot correlation, but it remains deliberately modest: one doctrine weight changes by 0.18. It should be treated as a lineage experiment, not proof of causation.

## Sun Tzu Academy

The Academy began with two conditional axioms:

1. Increase safety only to avoid uncompensated reply-capture capacity.
2. Increase advance pressure to escape quiet, stable non-winning states.

Eight educated/uneducated sibling pairs were tested on the same four-general panel in each of Generations 4 and 5, for 16 sibling comparisons and 256 dedicated games. Generation 4's educated siblings finished one point behind their controls, so both Academy deltas were halved. Generation 5 was tied overall, so the weakened axioms were retained rather than promoted to universal status. Across both cycles, educated siblings finished one point behind.

The final Academy deltas are `+0.0648 safety` and `+0.054 advance`. The result is appropriately inconclusive: the Academy refined away from its initially stronger intervention, and the evidence does not justify calling either axiom universal.

## Conclusions and next experiment

1. Raising the cap to 60 reduced cap adjudication to 8.4% while preserving a measurable long-game tail.
2. Evolution did not converge on one lineage. Mixed crosses, wild cards, and target-bred policies continued to reach the top.
3. Scipio and Emu both produced credible screened assassins, but neither assassin program has enough repeated games to certify a counter.
4. Game duration is informative: later populations converted much faster, while Fabius-Khan-like lines remained conspicuously resistant.
5. Historian changes are now traceable, but their causal claims need unchanged-sibling tests.
6. Sun Tzu's first two axioms failed to earn universal status and were weakened, which is the intended safeguard against flattening strong lineages.

The next campaign should run high-repetition, reply-aware validation for the late top ten and the four perfect-screen assassins. It should also compare each historian with an unchanged sibling on an identical panel and add stochastic or seeded policy variation before calculating confidence intervals.
