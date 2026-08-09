import { RULES_VERSION } from "./engine.js";

const PREFIX = "OM1.";
const toBase64 = text => typeof btoa === "function" ? btoa(unescape(encodeURIComponent(text))) : Buffer.from(text).toString("base64");
const fromBase64 = text => typeof atob === "function" ? decodeURIComponent(escape(atob(text))) : Buffer.from(text,"base64").toString();

export function encodeReplay(game, metadata = {}) {
  return PREFIX + toBase64(JSON.stringify({ v: RULES_VERSION, seed: game.seed, startedAt: game.startedAt, metadata, events: game.events }));
}
export function decodeReplay(code) {
  if (!code.trim().startsWith(PREFIX)) throw new Error("Not an OutMatch replay code");
  const data = JSON.parse(fromBase64(code.trim().slice(PREFIX.length)));
  if (!Array.isArray(data.events)) throw new Error("Replay contains no events");
  return data;
}
export function saveGame(game, metadata = {}) {
  const item = { id: `game_${Date.now()}`, savedAt: new Date().toISOString(), winner: game.winner, rounds: game.round, metadata, code: encodeReplay(game,metadata) };
  const archive = loadArchive(); archive.unshift(item);
  localStorage.setItem("outmatch.archive",JSON.stringify(archive.slice(0,50)));
  return item;
}
export function loadArchive() {
  try { return JSON.parse(localStorage.getItem("outmatch.archive")) || []; } catch { return []; }
}
