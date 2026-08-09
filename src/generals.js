import { TYPES, cloneGame, legalUnitActions, act, endTurn, unitsFor, distance, otherSide, deploymentHexes, commit, deploy, movementDestinations, archerTargets, unitAt } from "./engine.js";

export const GENERALS = Object.freeze([
  { id: "hannibal_001", name: "Hannibal", epithet: "The patient trap", level: "master", color: "#d0a55b", doctrine: { aggression: .68, safety: .9, cohesion: .35, advance: .55, cavalry: 1.7 }, recruit: [1, .9, 1.5] },
  { id: "scipio_wiser_001", name: "Scipio the Wiser", epithet: "Reply-aware pressure", level: "master", color: "#d8d1bd", doctrine: { aggression: 1.1, safety: 1.25, cohesion: .55, advance: .9, cavalry: 1.3 }, recruit: [.9, 1, 1.25] },
  { id: "surena_001", name: "Surena", epithet: "Distance and patience", level: "veteran", color: "#8bb7ad", doctrine: { aggression: .6, safety: 1.2, cohesion: .45, advance: .25, cavalry: .9 }, recruit: [.8, 1.8, .9] },
  { id: "paullus_001", name: "Paullus", epithet: "The Scipio hunter", level: "veteran", color: "#b2a4cc", doctrine: { aggression: .8, safety: 1.1, cohesion: .9, advance: .5, cavalry: .6 }, recruit: [1.5, 1.25, .65] },
  { id: "emu_001", name: "Emu", epithet: "Irregular velocity", level: "wild", color: "#d68b68", doctrine: { aggression: 1.3, safety: .45, cohesion: .1, advance: 1.2, cavalry: 2 }, recruit: [.55, .7, 2.1] },
  { id: "narses_001", name: "Narses", epithet: "Measured combined arms", level: "standard", color: "#8ca7c7", doctrine: { aggression: .65, safety: 1, cohesion: 1.1, advance: .45, cavalry: .8 }, recruit: [1, 1, 1] },
  { id: "crassus_001", name: "Crassus", epithet: "A brittle command", level: "novice", color: "#8b8b7e", doctrine: { aggression: 1.4, safety: .1, cohesion: .2, advance: 1.3, cavalry: .6 }, recruit: [1.6, .4, .6] }
]);

const value = { pike: 100, archer: 105, cavalry: 110 };
function immediateCaptureCount(game, side) {
  return unitsFor(game, side).reduce((sum, u) => {
    if (u.type === TYPES.ARCHER) return sum + archerTargets(game, u).length;
    return sum + movementDestinations(game, u).filter(pos => unitAt(game, pos)?.side === otherSide(side)).length;
  }, 0);
}
function score(game, side, general) {
  const foe = otherSide(side), own = unitsFor(game, side), enemies = unitsFor(game, foe);
  if (!enemies.length) return 1e7;
  const material = own.reduce((s,u)=>s+value[u.type],0)-enemies.reduce((s,u)=>s+value[u.type],0);
  const danger = immediateCaptureCount(game, foe), force = immediateCaptureCount(game, side);
  const center = own.reduce((s,u)=>s+(3-distance(u.pos,[0,0])),0);
  const support = own.reduce((s,u)=>s+own.filter(v=>v.id!==u.id&&distance(u.pos,v.pos)===1).length,0);
  return material*10 + force*45*general.doctrine.aggression - danger*70*general.doctrine.safety + center*general.doctrine.advance*5 + support*general.doctrine.cohesion*4;
}

export function chooseRecruit(game, general, side) {
  const counts = [TYPES.PIKE,TYPES.ARCHER,TYPES.CAVALRY].map(t=>unitsFor(game,side).filter(u=>u.type===t).length);
  const weights = general.recruit.map((w,i)=>w/(counts[i]+1));
  return [TYPES.PIKE,TYPES.ARCHER,TYPES.CAVALRY][weights.indexOf(Math.max(...weights))];
}

function bestAction(game, general, replyAware) {
  const side = game.turn;
  let best = null;
  for (const unit of unitsFor(game,side).filter(u=>!u.activated)) for (const action of legalUnitActions(game,unit.id)) {
    const next = cloneGame(game); act(next, action);
    let total = score(next,side,general);
    // One-ply tactical sanity: penalize every exact immediate enemy capture after the turn.
    if (replyAware && !next.winner) {
      const reply = cloneGame(next); endTurn(reply);
      total -= immediateCaptureCount(reply, reply.turn) * 85 * general.doctrine.safety;
    }
    if (action.type === "hold") total -= 1;
    if (!best || total > best.score) best = { action, score: total };
  }
  return best?.action;
}

function fastActionScore(game, action, actor, general) {
  if (action.type === "hold") return -2 + general.doctrine.safety;
  if (action.type === "shoot") {
    const victim = game.units.find(u => u.id === action.targetId);
    return value[victim.type] * (8 + general.doctrine.aggression);
  }
  const destination = action.to, victim = unitAt(game, destination);
  let total = victim ? value[victim.type] * (8 + general.doctrine.aggression) : 0;
  const enemyBase = game.turn === "red" ? [3, 0] : [-3, 0];
  total += (distance(actor.pos, enemyBase) - distance(destination, enemyBase)) * 10 * general.doctrine.advance;
  const allies = unitsFor(game, game.turn).filter(u => u.id !== actor.id);
  total += allies.filter(u => distance(u.pos, destination) === 1).length * 7 * general.doctrine.cohesion;
  const foes = unitsFor(game, otherSide(game.turn));
  const adjacentDanger = foes.filter(u => distance(u.pos, destination) === 1 && (u.type !== TYPES.CAVALRY || actor.type !== TYPES.PIKE)).length;
  total -= adjacentDanger * 18 * general.doctrine.safety;
  if (actor.type === TYPES.CAVALRY) total += 2 * general.doctrine.cavalry;
  // Stable deterministic tie-breaker prevents array ordering from erasing small genome differences.
  total += ((destination[0] * 17 + destination[1] * 31 + game.seed + game.events.length) % 13) / 100;
  return total;
}

function bestActionFast(game, general) {
  let best = null;
  for (const actor of unitsFor(game, game.turn).filter(u => !u.activated)) {
    for (const action of legalUnitActions(game, actor.id)) {
      const score = fastActionScore(game, action, actor, general);
      if (!best || score > best.score) best = { action, score };
    }
  }
  return best?.action;
}

export function runAiTurn(game, general, options = {}) {
  const replyAware = options.replyAware ?? general.search?.replyAware ?? true;
  const fast = options.fast ?? false;
  if (game.phase === "deploy") {
    const spots = deploymentHexes(game,game.turn).sort((a,b)=>distance(a,[0,0])-distance(b,[0,0]));
    deploy(game,spots[0]);
  }
  if (game.phase === "commit") commit(game,chooseRecruit(game,general,game.turn));
  let guard = 0;
  while (game.phase === "activate" && !game.winner && guard++ < 30) {
    const action = fast ? bestActionFast(game, general) : bestAction(game,general,replyAware);
    if (!action) break;
    act(game,action);
  }
  if (!game.winner) endTurn(game);
  return game;
}
