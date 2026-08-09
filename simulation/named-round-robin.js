import { writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createGame, unitsFor, RULES_VERSION } from "../src/engine.js";
import { GENERALS, runAiTurn } from "../src/generals.js";

const ROUND_CAP = Number(process.env.ROUND_CAP || 20);
const outputPath = process.argv[2];
const engineCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const standings = new Map(GENERALS.map(g => [g.id, {
  id: g.id, name: g.name, played: 0, wins: 0, losses: 0, draws: 0,
  redWins: 0, blueWins: 0, eliminations: 0, points: 0
}]));
const games = [];

function play(red, blue, seed) {
  const game = createGame({ seed, startedAt: "simulation" });
  let turns = 0;
  while (!game.winner && game.round <= ROUND_CAP) {
    runAiTurn(game, game.turn === "red" ? red : blue);
    turns += 1;
  }
  const winner = game.winner === "red" ? red : game.winner === "blue" ? blue : null;
  return {
    gameId: `named-${String(games.length + 1).padStart(2, "0")}`,
    red: red.id, blue: blue.id, seed, winner: winner?.id ?? null,
    result: winner ? "elimination" : "round-cap-draw",
    rounds: winner ? game.round : ROUND_CAP, turns, finalComposition: {
      red: Object.fromEntries(["pike", "archer", "cavalry"].map(type => [type, unitsFor(game, "red").filter(u => u.type === type).length])),
      blue: Object.fromEntries(["pike", "archer", "cavalry"].map(type => [type, unitsFor(game, "blue").filter(u => u.type === type).length]))
    }
  };
}

for (let left = 0; left < GENERALS.length; left += 1) {
  for (let right = left + 1; right < GENERALS.length; right += 1) {
    const pair = [GENERALS[left], GENERALS[right]];
    for (let leg = 0; leg < 2; leg += 1) {
      const red = pair[leg], blue = pair[1 - leg];
      const game = play(red, blue, 20260809 + left * 100 + right * 2 + leg);
      games.push(game);
      const redRow = standings.get(red.id), blueRow = standings.get(blue.id);
      redRow.played += 1; blueRow.played += 1;
      if (!game.winner) {
        redRow.draws += 1; blueRow.draws += 1; redRow.points += 0.5; blueRow.points += 0.5;
      } else {
        const winner = standings.get(game.winner), loser = game.winner === red.id ? blueRow : redRow;
        winner.wins += 1; winner.eliminations += 1; winner.points += 1; loser.losses += 1;
        if (game.winner === red.id) winner.redWins += 1; else winner.blueWins += 1;
      }
    }
  }
}

const ranking = [...standings.values()].sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
const report = {
  schemaVersion: "1.0.0",
  tournament: "named-generals-quick-round-robin",
  createdAt: new Date().toISOString(),
  manifest: {
    engineCommit, rulesVersion: RULES_VERSION, roundCap: ROUND_CAP,
    gamesPerPair: 2, colorBalanced: true, scoring: { win: 1, draw: 0.5, loss: 0 },
    competitors: GENERALS.map(({ id, name }) => ({ id, name }))
  },
  summary: { competitors: GENERALS.length, pairings: GENERALS.length * (GENERALS.length - 1) / 2, games: games.length, eliminations: games.filter(g => g.winner).length, draws: games.filter(g => !g.winner).length },
  ranking,
  games
};

console.table(ranking.map(({ name, played, wins, losses, draws, points, redWins, blueWins }) => ({ name, played, wins, losses, draws, points, redWins, blueWins })));
console.log(`${report.summary.games} games: ${report.summary.eliminations} eliminations, ${report.summary.draws} round-cap draws.`);
if (outputPath) {
  await mkdir(new URL("../results/", import.meta.url), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Saved reproducible report to ${outputPath}`);
}
