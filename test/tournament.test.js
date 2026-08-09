import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

test("named round robin produces every color-balanced pairing", () => {
  const path = "/tmp/outmatch-tournament-test.json";
  execFileSync(process.execPath, ["simulation/named-round-robin.js", path], {
    cwd: process.cwd(), env: { ...process.env, ROUND_CAP: "1" }, stdio: "ignore"
  });
  const report = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(report.summary.competitors, 7);
  assert.equal(report.summary.pairings, 21);
  assert.equal(report.summary.games, 42);
  assert.ok(report.ranking.every(row => row.played === 12));
  for (let left = 0; left < report.manifest.competitors.length; left += 1) {
    for (let right = left + 1; right < report.manifest.competitors.length; right += 1) {
      const a = report.manifest.competitors[left].id, b = report.manifest.competitors[right].id;
      assert.equal(report.games.filter(g => (g.red === a && g.blue === b) || (g.red === b && g.blue === a)).length, 2);
    }
  }
  rmSync(path);
});
