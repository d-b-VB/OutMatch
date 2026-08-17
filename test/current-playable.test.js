import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playable = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("ships the current G67 playable and its eight AI opponents", () => {
  assert.match(playable, /OutMatch — Sun Tzu G67 Enrollees/);
  const roster = playable.match(/const FINALISTS = (\[[\s\S]*?\]);\n\nconst RADIUS=/);
  assert.ok(roster, "embedded G67 opponent roster is present");
  assert.equal(JSON.parse(roster[1]).length, 8);
});

test("preserves the authoritative current planner and rules constants", () => {
  assert.match(playable, /lookaheadAsync\(state,side,opponent,3,/);
  assert.match(playable, /const breadth=Math\.min\(8,rawBreadth\)/);
  assert.match(playable, /beam=candidates\.slice\(0,Math\.max\(1,Math\.min\(4,candidates\.length\)\)\)/);
  assert.match(playable, /const RADIUS=3/);
  assert.match(playable, /if\(state\.rnd>20\)/);
  assert.match(playable, /function aiRecruit\(/);
  assert.match(playable, /function aiDeploy\(/);
});
