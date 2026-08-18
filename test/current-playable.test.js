import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playable = await readFile(new URL("../index.html", import.meta.url), "utf8");
const latestOpponentFile = JSON.parse(await readFile(new URL("../OutMatch_G82_human_opponents_selected16.txt", import.meta.url), "utf8"));

test("ships the current playable and its sixteen selected G82 AI opponents", () => {
  assert.match(playable, /<h1>OutMatch<\/h1>/);
  const roster = playable.match(/const FINALISTS = (\[[\s\S]*?\]);\n/);
  assert.ok(roster, "embedded G82 opponent roster is present");
  const opponents = JSON.parse(roster[1]);
  assert.equal(opponents.length, 16);
  assert.ok(opponents.every(opponent => opponent.id.startsWith("G82_") && opponent.round_robin_record));
  assert.equal(JSON.stringify(opponents), JSON.stringify(latestOpponentFile.opponents));
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

test("offers a dedicated battle menu and a subdued three-tone hex tiling", () => {
  assert.match(playable, /for="opponent">Choose opponent/);
  assert.match(playable, /data-color="R"/);
  assert.match(playable, /data-color="B"/);
  assert.match(playable, /tone\$\{\(\(p\[0\]-p\[1\]\)%3\+3\)%3\}/);
  assert.match(playable, /\.hex\.tone0\{fill:#b8a477\}\.hex\.tone1\{fill:#849991\}\.hex\.tone2\{fill:#aa8378\}/);

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

test("requires recruitment from a board modal", () => {
  assert.match(playable, /id="recruitModal"/);
  assert.match(playable, /Choose before moving your pieces/);
  assert.match(playable, /recruitModal"\)\.classList\.add\("active"\)/);
  assert.doesNotMatch(playable, /<h2>Game log<\/h2>/);
  assert.doesNotMatch(playable, /<h2>Opponent<\/h2>/);
});

test("offers concise help and a downloadable text game log", () => {
  assert.match(playable, /id="howToPlay">How to Play/);
  assert.match(playable, /id="downloadGame">Download Game/);
  assert.match(playable, /new Blob\(\[text\+"\\n"\],\{type:"text\/plain;charset=utf-8"\}\)/);
  assert.match(playable, /link\.download=`outmatch-game-\$\{stamp\}\.txt`/);
  assert.match(playable, /URL\.revokeObjectURL\(url\)/);
});

test("how-to-play orders units and illustrates their matchups", () => {
  const cavalry = playable.indexOf("<b>Cavalry</b>");
  const pikeman = playable.indexOf("<b>Pikeman</b>");
  const archer = playable.indexOf("<b>Archer</b>");
  assert.ok(cavalry < pikeman && pikeman < archer);
  assert.match(playable, /aria-label="Cavalry moves three spaces to capture an archer"/);
  assert.match(playable, /Cavalry can move 3 spaces\./);
  assert.match(playable, /aria-label="Pikeman stops cavalry one space away"/);
  assert.match(playable, /aria-label="Archer moves then attacks an adjacent pikeman"/);
  assert.match(playable, /class="shot"/);
  assert.match(playable, /Archer attacks an adjacent tile before or after moving\./);
});

test("shows star difficulty and a tactical clue emoji in the opponent dropdown", () => {
  assert.match(playable, /Math\.max\(1,Math\.min\(5,Math\.round\(g\.round_robin_record\.win_rate\*10-1\)\)\)/);
  assert.match(playable, /`\$\{g\.name\} — \$\{"★"\.repeat\(difficulty\)\} \$\{OPPONENT_EMOJIS\[g\.name\]\}`/);

  const emojiSource = playable.match(/const OPPONENT_EMOJIS=Object\.freeze\((\{[\s\S]*?\})\);/);
  assert.ok(emojiSource, "opponent emoji map should be embedded");
  const emojis = JSON.parse(emojiSource[1]);
  assert.deepEqual(emojis, {
    "Æthelwulf": "🏹", "Æthelberht": "🏹", Menelaus: "🐎", Cenwulf: "🏃",
    Aeropus: "⚔️", Sigeric: "🏹", Alcetas: "🐎", Eadberht: "🏹",
    Heliodoros: "🛡️", Hector: "🏰", Aeneas: "🤝", Beornred: "🏹",
    Polemon: "🛡️", Helenus: "🏰", Deiphobus: "🤝", Argaeus: "🐎",
  });
});

test("animates movement, arrows, and defeated pieces", () => {
  assert.match(playable, /async function animateMove\(before,uid,dest\)/);
  assert.match(playable, /const points=cavalryPath\(before,actor,dest\)\.map\(axialToPixel\)/);
  assert.match(playable, /for\(let i=1;i<points\.length;i\+\+\)/);
  assert.match(playable, /async function animateArrow\(before,uid,tid,shooterPos=null\)/);
  assert.match(playable, /arrow\.textContent="➶"/);
  assert.match(playable, /async function animateDeath\(id\)/);
  assert.match(playable, /\{opacity:0,transform:"scale\(\.05\)"\}/);
  assert.match(playable, /await applyAnimatedAction\(state,a,true\)/);
});

test("highlights opening units and redirects full-tile clicks", () => {
  assert.match(playable, /\.unit\.opening circle,\.reinforcement-nudge \.hex\.deploy\{animation:goldenPulse 1\.8s ease-in-out infinite\}/);
  assert.match(playable, /const opening=g\.rnd===1&&g\.turn===humanSide&&u\.side===humanSide&&u\.id<=6/);
  assert.match(playable, /const occupant=omap\(state\)\.get\(ckey\(p\)\)/);
  assert.match(playable, /if\(occupant\)\{await onUnitClick\(occupant\.id\);return\}/);
  assert.match(playable, /coord\.setAttribute\("pointer-events","none"\)/);
  assert.match(playable, /if\(mode==="deploy"\)\{nudgeReinforcementPlacement\(\);return\}/);
});
