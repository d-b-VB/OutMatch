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

test("offers a dedicated battle menu and a proper three-color hex tiling", () => {
  assert.match(playable, /id="opponentGrid"/);
  assert.match(playable, /data-color="R"/);
  assert.match(playable, /data-color="B"/);
  assert.match(playable, /tone\$\{\(\(p\[0\]-p\[1\]\)%3\+3\)%3\}/);

  const directions = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const tone = ([q, r]) => ((q - r) % 3 + 3) % 3;
  for (let q = -3; q <= 3; q++) for (let r = -3; r <= 3; r++) {
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r)) > 3) continue;
    for (const [dq, dr] of directions) {
      const neighbor = [q + dq, r + dr];
      if (Math.max(Math.abs(neighbor[0]), Math.abs(neighbor[1]), Math.abs(-neighbor[0] - neighbor[1])) <= 3) {
        assert.notEqual(tone([q, r]), tone(neighbor));
      }
    }
  }
});
