export const SIDES = Object.freeze({ RED: "red", BLUE: "blue" });
export const TYPES = Object.freeze({ PIKE: "pike", ARCHER: "archer", CAVALRY: "cavalry" });
export const TYPE_LIST = Object.freeze(Object.values(TYPES));
export const RULES_VERSION = "1.0.0";
export const BASES = Object.freeze({ red: [-3, 0], blue: [3, 0] });
export const DIRECTIONS = Object.freeze([[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]]);

export const key = ([q, r]) => `${q},${r}`;
export const fromKey = value => value.split(",").map(Number);
export const otherSide = side => side === SIDES.RED ? SIDES.BLUE : SIDES.RED;
export const distance = (a, b) => (Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs((a[0]+a[1])-(b[0]+b[1]))) / 2;
export const BOARD = Object.freeze(Array.from({ length: 7 }, (_, i) => i - 3).flatMap(q =>
  Array.from({ length: 7 }, (_, i) => i - 3).filter(r => Math.max(Math.abs(q), Math.abs(r), Math.abs(q+r)) <= 3).map(r => [q, r])
));
export const BOARD_KEYS = new Set(BOARD.map(key));
export const neighbors = pos => DIRECTIONS.map(([dq, dr]) => [pos[0]+dq, pos[1]+dr]).filter(p => BOARD_KEYS.has(key(p)));

let nextId = 1;
const unit = (side, type, pos) => ({ id: `${side[0]}${nextId++}`, side, type, pos: [...pos], activated: false });

export function createGame(options = {}) {
  nextId = 1;
  return {
    rulesVersion: RULES_VERSION,
    round: 1,
    turn: SIDES.RED,
    phase: "commit",
    winner: null,
    queues: { red: null, blue: null },
    units: [
      unit("red", "pike", [-2,0]), unit("red", "archer", [-3,1]), unit("red", "cavalry", [-2,-1]),
      unit("blue", "pike", [2,0]), unit("blue", "archer", [3,-1]), unit("blue", "cavalry", [2,1])
    ],
    events: [],
    seed: options.seed ?? Date.now(),
    startedAt: options.startedAt ?? new Date().toISOString()
  };
}

export const cloneGame = game => structuredClone(game);
export const unitAt = (game, pos) => game.units.find(u => key(u.pos) === key(pos));
export const unitsFor = (game, side) => game.units.filter(u => u.side === side);
export const deploymentHexes = (game, side) => neighbors(BASES[side]).filter(pos => !unitAt(game, pos));

export function beginTurn(game) {
  game.units.filter(u => u.side === game.turn).forEach(u => { u.activated = false; });
  const canDeploy = game.queues[game.turn] && deploymentHexes(game, game.turn).length;
  game.phase = canDeploy ? "deploy" : (game.round % 2 === 1 && !game.queues[game.turn] ? "commit" : "activate");
  return game;
}

export function commit(game, type) {
  if (game.phase !== "commit" || !TYPE_LIST.includes(type)) throw new Error("Illegal commitment");
  game.queues[game.turn] = type;
  game.events.push({ round: game.round, side: game.turn, type: "commit", unitType: type });
  game.phase = "activate";
  return game;
}

export function deploy(game, pos) {
  if (game.phase !== "deploy" || !deploymentHexes(game, game.turn).some(p => key(p) === key(pos))) throw new Error("Illegal deployment");
  const produced = unit(game.turn, game.queues[game.turn], pos);
  produced.activated = true;
  game.units.push(produced);
  game.events.push({ round: game.round, side: game.turn, type: "deploy", unitType: produced.type, unitId: produced.id, to: [...pos] });
  game.queues[game.turn] = null;
  game.phase = game.round % 2 === 1 ? "commit" : "activate";
  return game;
}

function enemyPikeZone(game, side, pos) {
  return game.units.some(u => u.side !== side && u.type === TYPES.PIKE && distance(u.pos, pos) === 1);
}

export function cavalryDestinations(game, cavalry) {
  const found = new Map();
  const queue = [{ pos: cavalry.pos, steps: 0 }];
  const best = new Map([[key(cavalry.pos), 0]]);
  while (queue.length) {
    const current = queue.shift();
    if (current.steps === 3) continue;
    for (const next of neighbors(current.pos)) {
      const occupant = unitAt(game, next);
      const steps = current.steps + 1;
      if (!occupant || occupant.side !== cavalry.side) found.set(key(next), next);
      if ((occupant && occupant.side !== cavalry.side) || enemyPikeZone(game, cavalry.side, next)) continue;
      if ((best.get(key(next)) ?? 99) <= steps) continue;
      best.set(key(next), steps);
      queue.push({ pos: next, steps });
      if (!occupant) found.set(key(next), next);
    }
  }
  return [...found.values()];
}

export function movementDestinations(game, movingUnit) {
  if (movingUnit.type === TYPES.CAVALRY) return cavalryDestinations(game, movingUnit);
  return neighbors(movingUnit.pos).filter(pos => {
    const occupant = unitAt(game, pos);
    return movingUnit.type === TYPES.PIKE ? occupant?.side !== movingUnit.side : !occupant;
  });
}

export function archerTargets(game, archer) {
  return game.units.filter(u => u.side !== archer.side && distance(u.pos, archer.pos) === 1);
}

export function legalUnitActions(game, unitId) {
  const actor = game.units.find(u => u.id === unitId);
  if (!actor || game.phase !== "activate" || actor.side !== game.turn || actor.activated) return [];
  const actions = [{ type: "hold", unitId }];
  if (!actor.movedThisTurn) for (const to of movementDestinations(game, actor)) actions.push({ type: "move", unitId, to });
  if (actor.type === TYPES.ARCHER && !actor.shotThisTurn) for (const target of archerTargets(game, actor)) actions.push({ type: "shoot", unitId, targetId: target.id });
  return actions;
}

function checkWinner(game) {
  for (const side of [SIDES.RED, SIDES.BLUE]) if (!unitsFor(game, side).length) game.winner = otherSide(side);
  if (game.winner) game.phase = "gameover";
}

export function act(game, action) {
  const actor = game.units.find(u => u.id === action.unitId);
  const legal = legalUnitActions(game, action.unitId).some(a => a.type === action.type && key(a.to || [99,99]) === key(action.to || [99,99]) && (a.targetId || "") === (action.targetId || ""));
  if (!actor || !legal) throw new Error("Illegal action");
  const event = { round: game.round, side: game.turn, type: action.type, unitId: actor.id, unitType: actor.type, from: [...actor.pos] };
  if (action.type === "move") {
    const victim = unitAt(game, action.to);
    if (victim) { game.units = game.units.filter(u => u.id !== victim.id); event.captureId = victim.id; event.captureType = victim.type; }
    actor.pos = [...action.to]; event.to = [...action.to];
    if (actor.type === TYPES.ARCHER) actor.movedThisTurn = true; else actor.activated = true;
  } else if (action.type === "shoot") {
    const victim = game.units.find(u => u.id === action.targetId);
    game.units = game.units.filter(u => u.id !== action.targetId); event.targetId = action.targetId; event.captureType = victim.type;
    // Shooting does not consume the archer's possible move; mark shot and allow a move-only continuation.
    actor.shotThisTurn = true;
  } else actor.activated = true;
  if (actor.type === TYPES.ARCHER && actor.shotThisTurn && actor.movedThisTurn) actor.activated = true;
  game.events.push(event); checkWinner(game); return game;
}

export function endTurn(game) {
  if (game.phase !== "activate") throw new Error("Cannot end turn now");
  for (const u of game.units) { delete u.shotThisTurn; delete u.movedThisTurn; }
  game.events.push({ round: game.round, side: game.turn, type: "end" });
  if (game.turn === SIDES.BLUE) { game.round += 1; game.turn = SIDES.RED; } else game.turn = SIDES.BLUE;
  return beginTurn(game);
}

export function publicState(game, viewer) {
  const copy = cloneGame(game);
  copy.queues[otherSide(viewer)] = copy.queues[otherSide(viewer)] ? "hidden" : null;
  return copy;
}

export function replayFromEvents(events, options = {}) {
  const game = createGame(options);
  for (const event of events) {
    if (event.type === "commit") commit(game, event.unitType);
    else if (event.type === "deploy") deploy(game, event.to);
    else if (event.type === "end") endTurn(game);
    else act(game, event.type === "move" ? { type: "move", unitId: event.unitId, to: event.to } : event.type === "shoot" ? { type: "shoot", unitId: event.unitId, targetId: event.targetId } : { type: "hold", unitId: event.unitId });
  }
  return game;
}
