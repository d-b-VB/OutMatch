import { readFile, writeFile } from "node:fs/promises";
import { createGame } from "../src/engine.js";
import { runAiTurn } from "../src/generals.js";

const input = process.argv[2] || "results/evolution-campaign-2026-08-09.json";
const output = process.argv[3] || "results/quick-loss-analysis-2026-08-09.json";
const report = JSON.parse(await readFile(input, "utf8"));
const genomes = new Map(report.genomes.map(genome => [genome.id, genome]));

function gameSeed(game) {
  const index = Number(game.id.slice(4)) - 1;
  const purposeOffset = game.purpose === "assassin-validation" ? 9e6 : game.purpose === "academy-sibling-test" ? 8e6 : 0;
  return report.manifest.seed + game.generation * 1e6 + index + purposeOffset;
}

function replay(game) {
  const state = createGame({ seed: gameSeed(game), startedAt: "quick-loss-analysis" });
  const red = genomes.get(game.red), blue = genomes.get(game.blue);
  while (!state.winner && state.round <= report.manifest.roundCap) {
    runAiTurn(state, state.turn === "red" ? red : blue, { replyAware: false, fast: true });
  }
  if ((state.winner === "red" ? red.id : blue.id) !== game.winner) throw new Error(`Replay mismatch for ${game.id}`);
  return state.events;
}

const stats = new Map();
for (const game of report.games) {
  for (const id of [game.red, game.blue]) {
    if (!stats.has(id)) stats.set(id, { id, name: genomes.get(id)?.name, origin: genomes.get(id)?.origin, lineage: genomes.get(id)?.lineage, played: 0, wins: 0, losses: 0, quickLosses: 0 });
    const row = stats.get(id); row.played += 1;
    if (game.winner === id) row.wins += 1;
    else if (game.winner) { row.losses += 1; if (game.rounds <= 4) row.quickLosses += 1; }
  }
}

const eliminations = report.games.filter(game => game.winner);
const quickGames = eliminations.filter(game => game.rounds <= 4);
const affected = [...stats.values()].filter(row => row.quickLosses);
const rateBands = { "100%": 0, "75–99%": 0, "50–74%": 0, "25–49%": 0, "under 25%": 0 };
for (const row of affected) {
  const rate = row.quickLosses / row.losses;
  rateBands[rate === 1 ? "100%" : rate >= .75 ? "75–99%" : rate >= .5 ? "50–74%" : rate >= .25 ? "25–49%" : "under 25%"] += 1;
}
const strengthBands = [
  ["0–19%", 0, .2], ["20–39%", .2, .4], ["40–59%", .4, .6], ["60–79%", .6, .8], ["80–100%", .8, 1.01]
].map(([label, low, high]) => {
  const rows = [...stats.values()].filter(row => row.wins / row.played >= low && row.wins / row.played < high);
  const losses = rows.reduce((sum, row) => sum + row.losses, 0), quickLosses = rows.reduce((sum, row) => sum + row.quickLosses, 0);
  return { label, genomes: rows.length, losses, quickLosses, quickLossRate: losses ? quickLosses / losses : null };
});

const representatives = {};
for (const rounds of [3, 4]) {
  const candidates = report.games.filter(game => game.purpose === "ecological" && game.winner && game.rounds === rounds);
  const game = candidates[Math.floor(candidates.length / 2)];
  representatives[rounds] = { ...game, seed: gameSeed(game), redName: genomes.get(game.red).name, blueName: genomes.get(game.blue).name, winnerName: genomes.get(game.winner).name, events: replay(game) };
}

const analysis = {
  source: input,
  minimumEliminationRound: Math.min(...eliminations.map(game => game.rounds)),
  eliminationRoundCounts: Object.fromEntries([...new Set(eliminations.map(game => game.rounds))].sort((a, b) => a - b).map(round => [round, eliminations.filter(game => game.rounds === round).length])),
  quickLosses: {
    games: quickGames.length,
    shareOfAllGames: quickGames.length / report.games.length,
    shareOfEliminations: quickGames.length / eliminations.length,
    redWins: quickGames.filter(game => game.winner === game.red).length,
    blueWins: quickGames.filter(game => game.winner === game.blue).length,
    affectedGenomes: affected.length,
    totalPlayedGenomes: stats.size,
    rateBands,
    strengthBands,
    mostFrequent: affected.sort((a, b) => b.quickLosses - a.quickLosses).slice(0, 20).map(row => ({ ...row, quickShareOfLosses: row.quickLosses / row.losses }))
  },
  overallColor: { redWins: eliminations.filter(game => game.winner === game.red).length, blueWins: eliminations.filter(game => game.winner === game.blue).length, draws: report.games.length - eliminations.length },
  representatives
};
await writeFile(output, `${JSON.stringify(analysis, null, 2)}\n`);
console.log(JSON.stringify({ output, minimumEliminationRound: analysis.minimumEliminationRound, rounds3: analysis.eliminationRoundCounts[3], rounds4: analysis.eliminationRoundCounts[4], quickLosses: analysis.quickLosses.games, color: analysis.overallColor }, null, 2));
