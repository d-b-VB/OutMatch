import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

test("evolution campaign creates assassins, historians, and Academy sibling trials", () => {
  const path = "/tmp/outmatch-evolution-test.json";
  execFileSync(process.execPath, ["simulation/evolution-campaign.js", path], {
    cwd: process.cwd(),
    env: { ...process.env, POPULATION: "120", GENERATIONS: "5", OPPONENTS: "1", REPETITIONS: "2", ROUND_CAP: "10" },
    stdio: "ignore"
  });
  const report = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(report.generations.length, 5);
  assert.ok(report.summary.uniqueGenomes > 300);
  assert.ok(report.games.some(game => game.purpose === "assassin-validation" && game.target === "scipio_wiser_001"));
  assert.ok(report.games.some(game => game.purpose === "assassin-validation" && game.target === "emu_001"));
  assert.ok(report.genomes.some(genome => genome.origin === "historian" && genome.historyModel.samples > 0));
  assert.ok(report.academy.siblingTests.length > 0);
  assert.ok(report.academy.axioms.every(axiom => axiom.revision !== "initial"));
  rmSync(path);
});
