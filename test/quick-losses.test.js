import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

test("quick-loss audit reproduces representative games and reports the observed minimum", () => {
  const output = "/tmp/outmatch-quick-loss-test.json";
  execFileSync(process.execPath, ["analysis/quick-losses.js", "results/evolution-campaign-2026-08-09.json", output], { cwd: process.cwd(), stdio: "ignore" });
  const audit = JSON.parse(readFileSync(output, "utf8"));
  assert.equal(audit.minimumEliminationRound, 3);
  assert.equal(audit.eliminationRoundCounts[3], 266);
  assert.equal(audit.eliminationRoundCounts[4], 5103);
  assert.equal(audit.quickLosses.games, 5369);
  assert.equal(audit.representatives[3].winnerName, "Fabius-Khan");
  assert.equal(audit.representatives[4].events.at(-1).captureType, "pike");
  rmSync(output);
});
