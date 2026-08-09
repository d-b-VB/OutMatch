import "./styles.css";
import { BOARD, BASES, TYPES, createGame, commit, deploy, act, endTurn, legalUnitActions, unitAt, deploymentHexes, unitsFor, replayFromEvents, distance } from "./engine.js";
import { GENERALS, runAiTurn } from "./generals.js";
import { encodeReplay, decodeReplay, saveGame, loadArchive } from "./replay.js";

const icons = { pike: "♜", archer: "➶", cavalry: "♞" };
const names = { pike: "Pikeman", archer: "Archer", cavalry: "Cavalry" };
let game, selected = null, humanSide = "red", general = GENERALS[0], screen = "home", toast = "";

function el(tag, cls, html="") { const node=document.createElement(tag); if(cls)node.className=cls; node.innerHTML=html; return node; }
function notify(message) { toast=message; render(); setTimeout(()=>{toast="";document.querySelector(".toast")?.remove();},1800); }
function start() { game=createGame(); selected=null; screen="game"; render(); if(humanSide==="blue") setTimeout(aiTurn,450); }
function aiTurn() { if(game.winner||game.turn===humanSide)return; runAiTurn(game,general); selected=null; if(game.winner) saveGame(game,{opponent:general.name,humanSide}); render(); }
function finishInput() { selected=null; render(); if(!game.winner&&game.turn!==humanSide)setTimeout(aiTurn,400); }

function header() {
  const h=el("header","topbar");
  h.innerHTML=`<button class="brand" data-home><span class="brand-mark">OM</span><span>OUTMATCH</span></button><div class="top-actions"><button class="icon-btn" data-rules aria-label="Rules">?</button><button class="icon-btn" data-audio aria-label="Sound">◖</button></div>`;
  h.querySelector("[data-home]").onclick=()=>{screen="home";render()};
  h.querySelector("[data-rules]").onclick=()=>showRules();
  h.querySelector("[data-audio]").onclick=()=>notify("Sound is muted");
  return h;
}

function home() {
  const main=el("main","home");
  main.innerHTML=`<section class="hero"><p class="eyebrow">A GAME OF PERFECT POSITIONING</p><h1>Outthink.<br><em>Outmaneuver.</em><br>OutMatch.</h1><p class="lede">Three unit types. Thirty-seven hexes. Every activation is a decision your opponent can punish.</p><button class="primary large" data-start>ENTER THE BOARD <span>→</span></button><div class="rule-strip"><span><b>37</b> hexes</span><i></i><span><b>3</b> unit types</span><i></i><span><b>1</b> objective</span></div></section><section class="setup"><div><p class="section-label">CHOOSE YOUR COMMAND</p><div class="side-choice"><button class="side red ${humanSide==="red"?"active":""}" data-side="red"><span class="sigil">R</span><b>RED COMMAND</b><small>First move · Forward pressure</small></button><button class="side blue ${humanSide==="blue"?"active":""}" data-side="blue"><span class="sigil">B</span><b>BLUE COMMAND</b><small>Second move · Reactive posture</small></button></div></div><div><p class="section-label">SELECT YOUR OPPONENT</p><div class="generals"></div></div></section><section class="archive-section"><p class="section-label">WAR ARCHIVE</p><div class="archive"></div></section>`;
  main.querySelectorAll("[data-side]").forEach(b=>b.onclick=()=>{humanSide=b.dataset.side;render()});
  const cards=main.querySelector(".generals");
  GENERALS.forEach(g=>{const c=el("button",`general ${general.id===g.id?"active":""}`,`<span class="portrait" style="--accent:${g.color}">${g.name[0]}</span><span><b>${g.name}</b><small>${g.epithet}</small></span><span class="rank">${g.level}</span>`);c.onclick=()=>{general=g;render()};cards.append(c)});
  main.querySelector("[data-start]").onclick=start;
  const archive=loadArchive(); main.querySelector(".archive").innerHTML=archive.length?archive.slice(0,3).map(a=>`<div class="archive-row"><span>${a.metadata?.opponent||"Unknown general"}</span><b class="${a.winner}">${a.winner?.toUpperCase()} · R${a.rounds}</b></div>`).join(""):`<div class="empty-archive">Your completed campaigns will be preserved here.</div>`;
  return main;
}

function boardNode() {
  const wrap=el("div","board-wrap"), board=el("div","board");
  const actions=selected?legalUnitActions(game,selected):[];
  const targets=new Map(actions.filter(a=>a.to).map(a=>[a.to.join(","),a]));
  const shots=new Map(actions.filter(a=>a.targetId).map(a=>[a.targetId,a]));
  const deploys=game.phase==="deploy"&&game.turn===humanSide?new Set(deploymentHexes(game,humanSide).map(p=>p.join(","))):new Set();
  BOARD.forEach(([q,r])=>{
    const cell=el("button","hex"); const x=(q+r/2)*72, y=r*62;
    cell.style.transform=`translate(${x}px,${y}px)`; cell.dataset.pos=`${q},${r}`;
    const u=unitAt(game,[q,r]); const isBase=Object.entries(BASES).find(([,p])=>p[0]===q&&p[1]===r);
    if((q-r+12)%3===0)cell.classList.add("tone");
    if(isBase) {cell.classList.add("base",isBase[0]);cell.innerHTML=`<span class="base-mark">${isBase[0][0].toUpperCase()}</span>`}
    if(deploys.has(`${q},${r}`)){cell.classList.add("legal","deployable");cell.onclick=()=>{deploy(game,[q,r]);finishInput()}}
    if(targets.has(`${q},${r}`)){cell.classList.add("legal",u?"capture":"move");cell.onclick=()=>{act(game,targets.get(`${q},${r}`));finishInput()}}
    if(u){const piece=el("span",`piece ${u.side} ${u.type} ${u.activated?"spent":""}`,`<span>${icons[u.type]}</span><small>${u.type[0].toUpperCase()}</small>`);cell.append(piece);cell.setAttribute("aria-label",`${u.side} ${names[u.type]}`);if(shots.has(u.id)){cell.classList.add("capture");cell.onclick=()=>{act(game,shots.get(u.id));finishInput()}}else if(u.side===humanSide&&game.turn===humanSide&&game.phase==="activate"&&!u.activated){cell.onclick=()=>{selected=selected===u.id?null:u.id;render()}}if(selected===u.id)cell.classList.add("selected")}
    board.append(cell);
  }); wrap.append(board); return wrap;
}

function gameScreen() {
  const main=el("main","game-screen"); const opponentSide=humanSide==="red"?"blue":"red";
  main.innerHTML=`<section class="battle-head"><div><p class="eyebrow">ROUND ${game.round} · ${game.turn.toUpperCase()} TO ACT</p><h2>${game.winner?`${game.winner.toUpperCase()} IS VICTORIOUS`:game.turn===humanSide?"Your command":"Enemy command"}</h2></div><div class="versus"><span class="dot ${humanSide}"></span>You <b>VS</b> ${general.name}<span class="dot ${opponentSide}"></span></div></section><section class="battle"><aside class="panel enemy-panel"></aside><div class="board-slot"></div><aside class="panel command-panel"></aside></section><section class="mobile-command"></section>`;
  const panel=main.querySelector(".enemy-panel"); panel.innerHTML=`<p class="section-label">ENEMY COMMAND</p><div class="commander"><span class="portrait" style="--accent:${general.color}">${general.name[0]}</span><div><b>${general.name}</b><small>${general.epithet}</small></div></div><div class="army">${armyHtml(opponentSide)}</div><div class="intel"><span>Hidden order</span><b>${game.queues[opponentSide]?"SEALED":"NONE"}</b></div>`;
  main.querySelector(".board-slot").append(boardNode());
  const command=main.querySelector(".command-panel"); command.innerHTML=commandHtml(); wireCommand(command);
  const mobile=main.querySelector(".mobile-command"); mobile.innerHTML=commandHtml(); wireCommand(mobile);
  return main;
}
function armyHtml(side){return Object.values(TYPES).map(t=>`<div><span>${icons[t]}</span><b>${unitsFor(game,side).filter(u=>u.type===t).length}</b><small>${names[t]}</small></div>`).join("")}
function commandHtml(){
  if(game.winner)return `<p class="section-label">BATTLE COMPLETE</p><div class="victory">${game.winner===humanSide?"VICTORY":"DEFEAT"}<small>Decided in round ${game.round}</small></div><button class="primary" data-rematch>PLAY AGAIN</button><button class="secondary" data-copy>COPY REPLAY</button>`;
  let controls="";
  if(game.turn!==humanSide)controls=`<div class="waiting"><span></span>Studying the board…</div>`;
  else if(game.phase==="commit")controls=`<p class="hint">Commit a unit. Your choice remains hidden until deployment.</p><div class="recruits">${Object.values(TYPES).map(t=>`<button data-commit="${t}">${icons[t]}<span>${names[t]}</span></button>`).join("")}</div>`;
  else if(game.phase==="deploy")controls=`<p class="hint">Deploy your queued <b>${names[game.queues[humanSide]]}</b> on a glowing home hex.</p>`;
  else controls=`<p class="hint">${selected?`Choose a destination, target, or hold.`:"Select an unspent unit. Each may activate once."}</p>${selected?`<button class="secondary" data-hold>HOLD POSITION</button>`:""}<button class="primary" data-end>END TURN <span>→</span></button>`;
  return `<p class="section-label">YOUR COMMAND</p><div class="army">${armyHtml(humanSide)}</div><div class="phase"><small>CURRENT PHASE</small><b>${game.phase.toUpperCase()}</b></div>${controls}`;
}
function wireCommand(root){
  root.querySelectorAll("[data-commit]").forEach(b=>b.onclick=()=>{commit(game,b.dataset.commit);finishInput()});
  root.querySelector("[data-end]")?.addEventListener("click",()=>{endTurn(game);finishInput()});
  root.querySelector("[data-hold]")?.addEventListener("click",()=>{act(game,{type:"hold",unitId:selected});finishInput()});
  root.querySelector("[data-rematch]")?.addEventListener("click",start);
  root.querySelector("[data-copy]")?.addEventListener("click",async()=>{await navigator.clipboard.writeText(encodeReplay(game,{opponent:general.name,humanSide}));notify("Replay copied")});
}

function showRules(){const modal=el("div","modal",`<div class="modal-card"><button class="close">×</button><p class="eyebrow">FIELD MANUAL</p><h2>Win by eliminating every enemy unit.</h2><div class="rules-grid"><div><b>♜ PIKEMAN</b><p>Move or capture one hex. Enemy pikes stop Cavalry movement in adjacent hexes.</p></div><div><b>➶ ARCHER</b><p>Move one empty hex and shoot one adjacent enemy, in either order.</p></div><div><b>♞ CAVALRY</b><p>Move up to three hexes, pass through allies, and stop immediately on capture.</p></div><div><b>⌛ RECRUITMENT</b><p>Commit secretly on odd rounds. Deploy beside your base on the following round.</p></div></div><button class="secondary" data-import>IMPORT REPLAY</button><textarea placeholder="Paste an OM1 replay code…"></textarea></div>`);document.body.append(modal);modal.onclick=e=>{if(e.target===modal)modal.remove()};modal.querySelector(".close").onclick=()=>modal.remove();modal.querySelector("[data-import]").onclick=()=>{try{const data=decodeReplay(modal.querySelector("textarea").value);game=replayFromEvents(data.events,{seed:data.seed,startedAt:data.startedAt});screen="game";modal.remove();render()}catch(e){notify(e.message)}}}
function render(){const app=document.querySelector("#app");app.innerHTML="";app.append(header(),screen==="home"?home():gameScreen());if(toast)document.body.append(el("div","toast",toast))}
render();
