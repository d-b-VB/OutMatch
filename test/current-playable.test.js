import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const playable = await readFile(new URL("../index.html", import.meta.url), "utf8");

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
  assert.match(playable, /<b>Pike Reach \/ poke<\/b>/);
  assert.match(playable, /Select a pikeman and click an adjacent enemy/);
  assert.match(playable, /Choose <b>Advance<\/b> to occupy the enemy hex or <b>Fall back<\/b>/);
});

test("animates movement, arrows, and defeated pieces", () => {
  assert.match(playable, /async function animateMove\(before,uid,dest\)/);
  assert.match(playable, /const points=cavalryPath\(before,actor,dest\)\.map\(axialToPixel\)/);
  assert.match(playable, /for\(let i=1;i<points\.length;i\+\+\)/);
  assert.match(playable, /async function animateArrow\(before,uid,tid,shooterPos=null\)/);
  assert.match(playable, /head\.setAttribute\("points","14,0 4,-7 4,7"\)/);
  assert.match(playable, /const angle=Math\.atan2\(ty-sy,tx-sx\)\*180\/Math\.PI/);
  assert.match(playable, /translate\(\$\{tx\}px,\$\{ty\}px\) rotate\(\$\{angle\}deg\)/);
  assert.match(playable, /async function animateDeath\(id\)/);
  assert.match(playable, /\{opacity:0,transform:"scale\(\.05\)"\}/);
  assert.match(playable, /await applyAnimatedAction\(state,a,true\)/);
});

test("highlights opening units and redirects full-tile clicks", () => {
  assert.match(playable, /\.hex\.opening,\.reinforcement-nudge \.hex\.deploy\{animation:goldenPulse 1\.8s ease-in-out infinite\}/);
  assert.match(playable, /if\(openingHint&&g\.rnd===1&&g\.turn===humanSide\)units\(g,humanSide\)\.filter\(u=>u\.id<=6\)\.forEach\(u=>openingCells\.add\(ckey\(u\.pos\)\)\)/);
  assert.match(playable, /if\(openingCells\.has\(ckey\(p\)\)\)cls\+=" opening"/);
  assert.match(playable, /function selectActiveUnit\(u\)\{\n openingHint=false/);
  assert.match(playable, /const occupant=omap\(state\)\.get\(ckey\(p\)\)/);
  assert.match(playable, /if\(occupant\)\{await onUnitClick\(occupant\.id\);return\}/);
  assert.match(playable, /coord\.setAttribute\("pointer-events","none"\)/);
  assert.match(playable, /if\(mode==="deploy"\)\{nudgeReinforcementPlacement\(\);return\}/);
});

test("ships Lords & Hunters as the sole playable edition", () => {
  assert.match(playable, /<title>OutMatch — Lords &amp; Hunters<\/title>/);
  assert.match(playable, /<h2>Lords &amp; Hunters<\/h2>/);
  assert.doesNotMatch(playable, /Mercians &amp; Macedonians/);
  assert.doesNotMatch(playable, /data-version=/);
  assert.doesNotMatch(playable, /const FINALISTS/);
  assert.match(playable, /const activeRoster=G33_OPPONENTS/);
  assert.match(playable, /const usesReachRules=\(\)=>true/);
});

test("embeds all 44 authoritative G33 Lords and Hunters", async () => {
  const roster = playable.match(/const G33_OPPONENTS=(\[[\s\S]*?\]);\nconst activeRoster=/);
  assert.ok(roster, "embedded G33 roster is present");
  const opponents = JSON.parse(roster[1]);
  const handoff = JSON.parse(await readFile(new URL("../data/g33/g33_human_opponents.engine.json", import.meta.url), "utf8"));
  assert.equal(opponents.length, 44);
  assert.deepEqual(opponents, handoff);
  assert.ok(opponents.every(general =>
    general.genomeSchema === "outmatch-core112-complete-position-v1" &&
    general.numericGenomeLoci === 112 &&
    Object.keys(general.genes.position).length === 54
  ));
});

test("lets a human pike choose advance or fall back after attacking", () => {
  assert.match(playable, /async function beginPikeAttack\(u,target\)/);
  assert.match(playable, /pikeOrigin=\[\.\.\.u\.pos\];pikeTargetPos=\[\.\.\.target\.pos\]/);
  assert.match(playable, /mode="pike_attacking"/);
  assert.match(playable, /await applyAnimatedAction\(state,\["poke",u\.id,target\.id\],false\)/);
  assert.match(playable, /if\(kind==="poke"&&mode==="pike_attacking"\)mode="pike_choice"/);
  assert.match(playable, /button\("Advance",\(\)=>finishPikeAttack\(true\)\)/);
  assert.match(playable, /button\("Fall back",\(\)=>finishPikeAttack\(false\)\)/);
  assert.match(playable, /if\(advance\)u\.pos=\[\.\.\.pikeTargetPos\];u\.active=false/);
  assert.match(playable, /if\(same\(p,pikeOrigin\)\)\{finishPikeAttack\(false\)/);
  assert.match(playable, /if\(same\(p,pikeTargetPos\)\)\{finishPikeAttack\(true\)/);
});

test("shows a held spear thrust and highlights both pike choices", () => {
  assert.match(playable, /async function animatePoke\(before,uid,tid\)/);
  assert.match(playable, /const PIKE_TIMING=Object\.freeze\(\{windup:240,thrust:520,impact:220,retract:460\}\)/);
  assert.match(playable, /await playAnimation\(pikeNode,[\s\S]*PIKE_TIMING\.windup/);
  assert.match(playable, /const readyBase=[\s\S]*impactBase=/);
  assert.match(playable, /transform:`\$\{impactBase\} scaleX\(\.55\)`/);
  assert.match(playable, /await Promise\.all\(\[[\s\S]*PIKE_TIMING\.thrust/);
  assert.match(playable, /await sleep\(PIKE_TIMING\.impact\)/);
  assert.match(playable, /animateDeathOver\(tid,PIKE_TIMING\.retract\)/);
  assert.match(playable, /choiceOrigins\.add\(ckey\(pikeOrigin\)\);choiceTargets\.add\(ckey\(pikeTargetPos\)\)/);
  assert.match(playable, /cls\+=" choice-origin"/);
  assert.match(playable, /cls\+=" choice-target"/);
});

test("keeps canonical pike move and poke actions available to the G33 planner", () => {
  assert.match(playable, /if\(usesReachRules\(\)\)for\(const t of archTargets\(g,u\)\)out\.push\(\["poke",u\.id,t\.id\]\)/);
  assert.match(playable, /for\(const m of legalMoves\(g,u\)\)out\.push\(\["move",u\.id,m\]\)/);
  assert.match(playable, /if\(kind==="shoot"\|\|kind==="poke"\)/);
});

test("celebrates wins and treats losses somberly at game end", () => {
  assert.match(playable, /id="endgame" role="dialog"/);
  assert.match(playable, /const result=w===humanSide\?"win":w\?"loss":"draw"/);
  assert.match(playable, /kind==="win"\?64:kind==="loss"\?28:0/);
  assert.match(playable, /\.endgame\.win\.red\{--c1:#c63f35/);
  assert.match(playable, /\.endgame\.win\.blue\{--c1:#3975bd/);
  assert.match(playable, /\.endgame\.loss\{background:radial-gradient/);
  assert.match(playable, /className=kind==="win"\?"confetti":"ash"/);
  assert.match(playable, /showEndgame\(w,outcome\)/);
});

test("offers a new-game menu and timeline review from the result screen", () => {
  assert.match(playable, /id="endNewGame">New game/);
  assert.match(playable, /id="reviewGame">Review game/);
  assert.match(playable, /getElementById\("endNewGame"\)\.onclick=openNewGameMenu/);
  assert.match(playable, /getElementById\("newGame"\)\.onclick=openNewGameMenu/);
  assert.match(playable, /getElementById\("reviewGame"\)\.onclick=reviewFinishedGame/);
  assert.match(playable, /timelineIndex=timeline\.length\?0:-1;render\(\);updateReviewControls\(\)/);
});
