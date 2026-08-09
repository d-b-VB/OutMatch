import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createGame, RULES_VERSION, unitsFor } from "../src/engine.js";
import { GENERALS, runAiTurn } from "../src/generals.js";

const config = {
  seed: Number(process.env.SEED || 20260809),
  population: Number(process.env.POPULATION || 240),
  generations: Number(process.env.GENERATIONS || 5),
  opponentsPerGeneral: Number(process.env.OPPONENTS || 4),
  repetitions: Number(process.env.REPETITIONS || 2),
  roundCap: Number(process.env.ROUND_CAP || 60),
  academyStarts: Number(process.env.ACADEMY_STARTS || 4)
};
const outputPath = process.argv[2] || "results/evolution-campaign-2026-08-09.json";

function rng(seed) {
  let state = seed >>> 0;
  return () => ((state = Math.imul(1664525, state) + 1013904223 >>> 0) / 4294967296);
}
const random = rng(config.seed);
const pick = values => values[Math.floor(random() * values.length)];
const clamp = (value, low = 0.05, high = 2.5) => Math.max(low, Math.min(high, value));
const doctrineKeys = ["aggression", "safety", "cohesion", "advance", "cavalry"];

const seeds = [
  ...GENERALS.map(g => ({ ...structuredClone(g), lineage: g.name.split(" ")[0].toLowerCase(), origin: "canonical", generation: 0, parents: [] })),
  ["Agrippa", "Layered conversion", [1.15, 1.35, 1.4, .45, .7], [1.25, 1.1, .7], "agrippan"],
  ["Fabius-Khan", "Mobile preservation", [.62, 1.45, .55, .7, 1.5], [.75, .9, 1.65], "fabius-khan"],
  ["Genghis", "Wide cavalry pressure", [1.35, .55, .2, 1.3, 2], [.5, .6, 2.2], "mongol"],
  ["Ackbar", "Supported defense", [.5, 1.45, 1.8, .25, .6], [1.2, 1.15, .65], "ackbar"],
  ["Grievous", "Unrestrained charge", [2.25, .08, .1, 2.1, 1.2], [.7, .45, 1.7], "grievous"],
  ["Varro", "Rigid pressure", [1.7, .25, .15, 1.55, .4], [1.8, .35, .4], "varro"],
  ["Ventidius", "Anti-kite structure", [1.15, 1.05, 1.25, .85, 1], [1.1, .65, 1.2], "ventidius"],
  ["Marc Antony", "Anti-Agrippan disruption", [1.5, .7, .35, 1.35, 1.1], [.65, 1.05, 1.25], "antonian"]
].map((g, index) => Array.isArray(g) ? ({
  id: `seed_${String(index).padStart(3, "0")}`, name: g[0], epithet: g[1], level: "historical",
  doctrine: Object.fromEntries(doctrineKeys.map((key, i) => [key, g[2][i]])), recruit: g[3],
  lineage: g[4], origin: "historical-seed", generation: 0, parents: [], search: { replyAware: false }
}) : ({ ...g, search: { replyAware: false } }));
const genomeArchive = [...seeds];
function archiveGenome(genome) { genomeArchive.push(genome); return genome; }

let serial = 0;
function freshId(kind, generation) { return `${kind}_g${generation}_${String(++serial).padStart(4, "0")}`; }
function mutation(parent, generation, kind = "mutation", target = null) {
  const child = structuredClone(parent), changed = [];
  child.id = freshId(kind, generation); child.name = `${parent.name} ${kind === "assassin" ? "Hunter" : "Variant"} ${serial}`;
  child.generation = generation; child.parents = [parent.id]; child.origin = kind; child.target = target; child.search = { replyAware: false };
  for (const key of doctrineKeys) if (random() < .65) { child.doctrine[key] = clamp(child.doctrine[key] + (random() - .5) * (kind === "wild" ? 2 : .55)); changed.push(`doctrine.${key}`); }
  child.recruit = child.recruit.map((value, i) => random() < .65 ? clamp(value + (random() - .5) * .7) : value);
  child.mutationSeed = Math.floor(random() * 2 ** 32); child.changed = changed;
  return archiveGenome(child);
}
function cross(a, b, generation, kind = "cross") {
  const doctrine = {}, inheritance = {};
  for (const key of doctrineKeys) { const source = random() < .5 ? a : b; doctrine[key] = source.doctrine[key]; inheritance[`doctrine.${key}`] = source.id; }
  const recruit = a.recruit.map((value, i) => random() < .5 ? value : b.recruit[i]);
  return archiveGenome({ id: freshId(kind, generation), name: `${a.name.split(" ")[0]}-${b.name.split(" ")[0]} ${serial}`, epithet: "Cross-pollinated doctrine", level: "evolved", doctrine, recruit,
    lineage: `${a.lineage}+${b.lineage}`, origin: kind, generation, parents: [a.id, b.id], inheritance, search: { replyAware: false } });
}
function wildcard(generation) {
  return archiveGenome({ id: freshId("wild", generation), name: `Wildcard ${generation}-${serial}`, epithet: "Unconstrained policy", level: "wild", generation, parents: [], lineage: "wild",
    origin: "wildcard", doctrine: Object.fromEntries(doctrineKeys.map(key => [key, clamp(random() * 2.7)])), recruit: [clamp(random() * 2.7), clamp(random() * 2.7), clamp(random() * 2.7)], search: { replyAware: false } });
}

function createInitialPopulation() {
  const population = [...seeds];
  while (population.length < config.population) {
    const roll = random();
    if (roll < .15) population.push(wildcard(1));
    else if (roll < .43) population.push(cross(pick(seeds), pick(seeds), 1));
    else population.push(mutation(pick(seeds), 1));
  }
  return population.slice(0, config.population);
}

function play(red, blue, seed) {
  const game = createGame({ seed, startedAt: "evolution-simulation" });
  let turns = 0;
  while (!game.winner && game.round <= config.roundCap) {
    runAiTurn(game, game.turn === "red" ? red : blue, { replyAware: false, fast: true }); turns += 1;
  }
  const winner = game.winner === "red" ? red.id : game.winner === "blue" ? blue.id : null;
  return { red: red.id, blue: blue.id, winner, rounds: winner ? game.round : config.roundCap, turns, result: winner ? "elimination" : "round-cap-draw",
    finalUnits: { red: unitsFor(game, "red").length, blue: unitsFor(game, "blue").length } };
}

const allGames = [], history = new Map(), generations = [], academy = { version: 0, axioms: [], siblingTests: [] };
function record(game, generation, purpose, target = null) {
  const stored = { id: `evo-${String(allGames.length + 1).padStart(6, "0")}`, generation, purpose, target, ...game }; allGames.push(stored);
  for (const id of [game.red, game.blue]) {
    if (!history.has(id)) history.set(id, []);
    history.get(id).push(stored);
  }
}
function evaluate(population, generation) {
  const offsetCount = Math.min(config.opponentsPerGeneral, population.length - 1), scheduled = new Set();
  for (let offset = 1; offset <= offsetCount; offset += 1) {
    for (let i = 0; i < population.length; i += 1) {
      const j = (i + offset) % population.length;
      const pairKey = [population[i].id, population[j].id].sort().join("|");
      if (scheduled.has(pairKey)) continue;
      scheduled.add(pairKey);
      for (let repetition = 0; repetition < config.repetitions; repetition += 1) {
        const red = repetition % 2 === 0 ? population[i] : population[j], blue = repetition % 2 === 0 ? population[j] : population[i];
        record(play(red, blue, config.seed + generation * 1e6 + allGames.length), generation, "ecological");
      }
    }
  }
  const rows = population.map(g => {
    const games = (history.get(g.id) ?? []).filter(x => x.generation === generation && x.purpose === "ecological");
    const wins = games.filter(x => x.winner === g.id).length, draws = games.filter(x => !x.winner).length;
    return { id: g.id, name: g.name, lineage: g.lineage, origin: g.origin, played: games.length, wins, losses: games.length - wins - draws, draws, points: wins + draws * .5,
      winRate: games.length ? wins / games.length : 0, averageRounds: games.length ? games.reduce((s, x) => s + x.rounds, 0) / games.length : 0 };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins || a.id.localeCompare(b.id));
  return rows;
}

function assassinTrials(population, ranking, generation) {
  const targetIds = new Set(ranking.slice(0, 3).map(row => row.id));
  for (const required of ["scipio_wiser_001", "emu_001"]) if (population.some(g => g.id === required)) targetIds.add(required);
  const targets = [...targetIds].map(id => population.find(g => g.id === id));
  const assassins = population.filter(g => g.origin === "assassin");
  for (const assassin of assassins) {
    const target = population.find(t => t.id === assassin.target); if (!target) continue;
    for (let leg = 0; leg < 4; leg += 1) record(play(leg % 2 ? target : assassin, leg % 2 ? assassin : target, config.seed + 9e6 + allGames.length), generation, "assassin-validation", target.id);
  }
  return targets;
}

function historian(parent, generation) {
  const child = structuredClone(parent), games = history.get(parent.id) ?? [], wins = games.filter(g => g.winner === parent.id), losses = games.filter(g => g.winner && g.winner !== parent.id);
  const winLength = wins.length ? wins.reduce((s, g) => s + g.rounds, 0) / wins.length : config.roundCap;
  const lossLength = losses.length ? losses.reduce((s, g) => s + g.rounds, 0) / losses.length : config.roundCap;
  child.id = freshId("historian", generation); child.name = `${parent.name.split(" ")[0]} Historian ${serial}`; child.parents = [parent.id]; child.generation = generation; child.origin = "historian";
  child.historyModel = { samples: games.length, wins: wins.length, losses: losses.length, winLength, lossLength, lesson: winLength < lossLength ? "increase-conversion-pressure" : "increase-preservation" };
  if (winLength < lossLength) child.doctrine.aggression = clamp(child.doctrine.aggression + .18); else child.doctrine.safety = clamp(child.doctrine.safety + .18);
  return archiveGenome(child);
}
function educate(parent, generation) {
  const child = structuredClone(parent); child.id = freshId("academy", generation); child.name = `${parent.name.split(" ")[0]} Student ${serial}`; child.parents = [parent.id]; child.generation = generation; child.origin = "academy"; child.academyVersion = academy.version;
  for (const axiom of academy.axioms) child.doctrine[axiom.field] = clamp(child.doctrine[axiom.field] + axiom.delta);
  return archiveGenome(child);
}
function refineAcademy(generation) {
  const completed = academy.siblingTests.filter(test => test.generation === generation);
  if (!completed.length) return;
  const educatedEdge = completed.reduce((sum, test) => sum + test.educatedPoints - test.siblingPoints, 0);
  academy.version += 1;
  if (educatedEdge < 0) academy.axioms = academy.axioms.map(a => ({ ...a, delta: a.delta * .5, revision: "weakened-after-negative-sibling-test" }));
  else academy.axioms = academy.axioms.map(a => ({ ...a, delta: clamp(a.delta * 1.08, -.4, .4), revision: "retained-after-positive-sibling-test" }));
}

function testAcademySiblings(population, generation) {
  const panel = population.filter(g => g.origin === "canonical" || g.origin === "historical-seed").slice(0, 4);
  for (const student of population.filter(g => g.origin === "academy")) {
    const sibling = population.find(g => g.id === student.parents[0]); if (!sibling) continue;
    let educatedPoints = 0, siblingPoints = 0;
    for (const opponent of panel) {
      for (const contender of [student, sibling]) {
        for (let leg = 0; leg < 2; leg += 1) {
          const game = play(leg ? opponent : contender, leg ? contender : opponent, config.seed + 8e6 + allGames.length);
          record(game, generation, "academy-sibling-test", opponent.id);
          const points = game.winner === contender.id ? 1 : game.winner ? 0 : .5;
          if (contender === student) educatedPoints += points; else siblingPoints += points;
        }
      }
    }
    academy.siblingTests.push({ generation, educated: student.id, sibling: sibling.id, panel: panel.map(g => g.id), educatedPoints, siblingPoints });
  }
}

function nextPopulation(population, ranking, generation, targets) {
  const byId = new Map(population.map(g => [g.id, g])), elites = ranking.slice(0, 24).map(r => byId.get(r.id));
  const mids = ranking.slice(Math.floor(ranking.length * .35), Math.floor(ranking.length * .65)).map(r => byId.get(r.id));
  const lows = ranking.slice(-20).map(r => byId.get(r.id));
  const retainedSeeds = seeds.slice(0, 15), retainedIds = new Set(retainedSeeds.map(g => g.id));
  const next = [...retainedSeeds, ...elites.filter(g => !retainedIds.has(g.id)).slice(0, 18)];
  for (const target of targets) for (let i = 0; i < 8; i += 1) {
    const stock = i < 3 ? pick(mids) : pick([...elites, ...lows]); const child = mutation(cross(stock, target, generation, "assassin-cross"), generation, "assassin", target.id);
    // Target-aware priors: pressure leaders' safety with aggression, while preserving enough caution to survive replies.
    child.doctrine.aggression = clamp(child.doctrine.aggression + .3); child.doctrine.safety = clamp(child.doctrine.safety + .12); next.push(child);
  }
  if (generation >= config.academyStarts) {
    const eligible = ranking.filter(r => r.wins >= 2 && r.losses >= 2).slice(0, 8).map(r => byId.get(r.id));
    for (const parent of eligible.slice(0, 6)) next.push(historian(parent, generation));
    for (const parent of elites.slice(0, 8)) next.push(educate(parent, generation));
  }
  while (next.length < config.population) {
    const roll = random();
    if (roll < .15) next.push(wildcard(generation));
    else if (roll < .48) next.push(cross(pick(elites), pick([...elites, ...mids, ...lows]), generation));
    else next.push(mutation(pick([...elites, ...mids]), generation));
  }
  return next.slice(0, config.population);
}

let population = createInitialPopulation();
academy.version = 1; academy.axioms = [
  { id: "conditional-safety", field: "safety", delta: .12, condition: "avoid increasing reply capture capacity without compensation", revision: "initial" },
  { id: "quiet-state-pressure", field: "advance", delta: .1, condition: "create contact in stable non-winning states", revision: "initial" }
];
for (let generation = 1; generation <= config.generations; generation += 1) {
  const ranking = evaluate(population, generation), targets = assassinTrials(population, ranking, generation);
  generations.push({ generation, population: population.length, gamesAfterGeneration: allGames.length, ranking: ranking.slice(0, 20), targets: targets.map(t => ({ id: t.id, name: t.name })) });
  if (generation >= config.academyStarts) {
    testAcademySiblings(population, generation);
    refineAcademy(generation);
  }
  if (generation < config.generations) population = nextPopulation(population, ranking, generation + 1, targets);
}

const report = {
  schemaVersion: "1.0.0", campaign: "outmatch-evolution-and-academy", createdAt: new Date().toISOString(),
  manifest: { ...config, engineCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), rulesVersion: RULES_VERSION,
    adjudication: "unresolved games at the configured round cap are draws; length is retained as a closeness measure" },
  summary: { games: allGames.length, eliminations: allGames.filter(g => g.winner).length, draws: allGames.filter(g => !g.winner).length,
    averageRounds: allGames.reduce((s, g) => s + g.rounds, 0) / allGames.length, uniqueGenomes: new Set(allGames.flatMap(g => [g.red, g.blue])).size },
  academy, generations, genomes: genomeArchive, finalPopulationIds: population.map(g => g.id), games: allGames
};
await mkdir(new URL("../results/", import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, summary: report.summary, finalLeaders: generations.at(-1).ranking.slice(0, 10), academy: { version: academy.version, axioms: academy.axioms, siblingTests: academy.siblingTests.length } }, null, 2));
