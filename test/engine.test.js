import test from "node:test";
import assert from "node:assert/strict";
import { BOARD, createGame, commit, deploy, act, endTurn, movementDestinations, legalUnitActions, deploymentHexes, distance, unitAt } from "../src/engine.js";

const has = (positions, expected) => positions.some(p => p[0] === expected[0] && p[1] === expected[1]);
const activationGame = () => { const g=createGame({seed:1,startedAt:"test"}); commit(g,"pike"); return g; };

test("radius-three board has exactly 37 valid hexes", () => {
  assert.equal(BOARD.length,37);
  assert.ok(BOARD.every(p=>distance(p,[0,0])<=3));
});

test("canonical initial position and Red first turn", () => {
  const g=createGame();
  assert.equal(g.turn,"red"); assert.equal(g.round,1); assert.equal(g.units.length,6);
  assert.equal(unitAt(g,[-2,0]).type,"pike"); assert.equal(unitAt(g,[3,-1]).type,"archer");
});

test("pikeman moves one and captures but cannot enter a friendly", () => {
  const g=activationGame(), p=g.units.find(u=>u.id==="r1");
  assert.ok(!has(movementDestinations(g,p),[-3,1]));
  g.units.find(u=>u.side==="blue"&&u.type==="pike").pos=[-1,0];
  assert.ok(has(movementDestinations(g,p),[-1,0]));
  act(g,{type:"move",unitId:p.id,to:[-1,0]});
  assert.equal(g.units.some(u=>u.side==="blue"&&u.type==="pike"),false);
});

test("archer shoots only adjacent and may shoot before moving", () => {
  const g=activationGame(), a=g.units.find(u=>u.type==="archer"&&u.side==="red");
  const enemy=g.units.find(u=>u.side==="blue"&&u.type==="pike"); enemy.pos=[-2,1];
  const far=g.units.find(u=>u.side==="blue"&&u.type==="archer"); far.pos=[-1,1];
  assert.ok(legalUnitActions(g,a.id).some(x=>x.type==="shoot"&&x.targetId===enemy.id));
  assert.ok(!legalUnitActions(g,a.id).some(x=>x.type==="shoot"&&x.targetId===far.id));
  act(g,{type:"shoot",unitId:a.id,targetId:enemy.id});
  assert.equal(a.activated,false);
  assert.ok(legalUnitActions(g,a.id).some(x=>x.type==="move"));
});

test("archer may move then shoot and cannot move twice", () => {
  const g=activationGame(), a=g.units.find(u=>u.type==="archer"&&u.side==="red"), enemy=g.units.find(u=>u.side==="blue"&&u.type==="pike");
  enemy.pos=[-1,1]; act(g,{type:"move",unitId:a.id,to:[-2,1]});
  const actions=legalUnitActions(g,a.id);
  assert.ok(actions.some(x=>x.type==="shoot"&&x.targetId===enemy.id));
  assert.ok(!actions.some(x=>x.type==="move"));
});

test("cavalry travels three, passes allies, and cannot end on allies", () => {
  const g=activationGame(), c=g.units.find(u=>u.type==="cavalry"&&u.side==="red");
  g.units.find(u=>u.id==="r1").pos=[-1,-1];
  const moves=movementDestinations(g,c);
  assert.ok(has(moves,[1,-1])); assert.ok(!has(moves,[-1,-1]));
});

test("cavalry can enter a pike stop zone but cannot continue through it", () => {
  const g=activationGame(), c=g.units.find(u=>u.type==="cavalry"&&u.side==="red"), p=g.units.find(u=>u.type==="pike"&&u.side==="blue");
  c.pos=[-2,0]; p.pos=[0,0]; g.units=g.units.filter(u=>u.id!=="r1");
  const moves=movementDestinations(g,c);
  assert.ok(has(moves,[-1,0]));
  // (1,0) would require continuing through a pike-adjacent entry on the direct route; alternate routes exceed range.
  assert.ok(!has(moves,[1,0]));
});

test("odd commitment remains queued and deploys inactive on following round", () => {
  const g=createGame(); commit(g,"archer");
  // Vacate one home-adjacent cell during Red's first activation phase.
  act(g,{type:"move",unitId:g.units.find(u=>u.side==="red"&&u.type==="pike").id,to:[-1,0]});
  endTurn(g); commit(g,"pike"); endTurn(g);
  assert.equal(g.round,2); assert.equal(g.phase,"deploy"); assert.equal(g.queues.red,"archer");
  const pos=deploymentHexes(g,"red")[0]; deploy(g,pos);
  const made=unitAt(g,pos); assert.equal(made.type,"archer"); assert.equal(made.activated,true); assert.equal(g.queues.red,null);
});

test("blocked deployment queue persists without soft-lock", () => {
  const g=createGame(); commit(g,"archer"); endTurn(g); commit(g,"pike"); endTurn(g);
  for (const pos of deploymentHexes(g,"red")) g.units.push({id:`x${pos}`,side:"red",type:"pike",pos,activated:false});
  // Re-enter start-turn resolution after spaces become blocked.
  g.phase="activate"; endTurn(g); // Blue round 2 can continue despite Red's queued unit.
  assert.equal(g.queues.red,"archer");
});

test("eliminating every enemy unit wins immediately", () => {
  const g=activationGame(); const a=g.units.find(u=>u.side==="red"&&u.type==="archer");
  g.units=g.units.filter(u=>u.side==="red"||u.type==="pike"); const victim=g.units.find(u=>u.side==="blue"); victim.pos=[-2,1];
  act(g,{type:"shoot",unitId:a.id,targetId:victim.id});
  assert.equal(g.winner,"red"); assert.equal(g.phase,"gameover");
});
