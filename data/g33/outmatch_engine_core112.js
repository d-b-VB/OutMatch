// Exact, indexed-board implementation of the OutMatch Reach-v1 depth-3 engine.
// Public results and replay structures match outmatch_tournament_engine_g8_reference.js.

'use strict';
const fs=require('fs');
const RADIUS=3,DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],TYPEV={P:100,A:105,C:110},TYPES=['P','A','C'];
const CELLS=[];for(let q=-RADIUS;q<=RADIUS;q++)for(let r=-RADIUS;r<=RADIUS;r++)if(Math.max(Math.abs(q),Math.abs(r),Math.abs(-q-r))<=RADIUS)CELLS.push([q,r]);
const ckey=p=>p[0]+','+p[1],CELL_INDEX=new Map(CELLS.map((p,i)=>[ckey(p),i]));
const NEI=CELLS.map(p=>DIRS.map(d=>CELL_INDEX.get(`${p[0]+d[0]},${p[1]+d[1]}`)).filter(x=>x!==undefined));
const DIST=CELLS.map(a=>CELLS.map(b=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs((-a[0]-a[1])-(-b[0]-b[1])))));
const BASE={R:CELL_INDEX.get('-3,0'),B:CELL_INDEX.get('3,0')},CENTER=CELL_INDEX.get('0,0');
const foe=s=>s==='R'?'B':'R';
const cloneUnit=u=>({id:u.id,side:u.side,typ:u.typ,cell:u.cell,active:u.active});
const deep=g=>({units:g.units.map(cloneUnit),pending:{R:g.pending.R,B:g.pending.B},rnd:g.rnd,captured:{R:g.captured.R,B:g.captured.B},turn:g.turn});
const publicUnit=u=>({id:u.id,side:u.side,typ:u.typ,pos:[...CELLS[u.cell]],active:u.active});
const publicState=g=>({units:g.units.map(publicUnit),pending:{R:g.pending.R,B:g.pending.B},rnd:g.rnd,captured:{R:g.captured.R,B:g.captured.B},turn:g.turn});
const units=(g,s)=>g.units.filter(u=>u.side===s),unitById=(g,id)=>g.units.find(u=>u.id===id);
const H0=new WeakMap(),HB=new WeakMap(),HO=new WeakMap(),HM=new WeakMap(),HT=new WeakMap(),HC=new WeakMap(),HZ=new WeakMap();
let GAME=null,TURN=null;
const newGameCache=()=>({occ:new Map(),moves:new Map(),targets:new Map(),captures:new Map(),zones:new Map()});
function invalidate(g){H0.delete(g);HB.delete(g);HO.delete(g);HM.delete(g);HT.delete(g);HC.delete(g);HZ.delete(g);}
function stateHash(g){let h=H0.get(g);if(h===undefined){h=g.units.map(u=>`${u.id}${u.side}${u.typ}${u.cell},${u.active?1:0}`).join('|');H0.set(g,h);}return h;}
function boardHash(g){let h=HB.get(g);if(h===undefined){h=g.units.map(u=>`${u.id}${u.side}${u.typ}${u.cell}`).join('|');HB.set(g,h);}return h;}
function occupancy(g){let o=HO.get(g);if(o)return o;const h=GAME&&boardHash(g);o=GAME&&GAME.occ.get(h);if(!o){o=new Array(CELLS.length).fill(null);for(const u of g.units)o[u.cell]=u;if(GAME)GAME.occ.set(h,o);}HO.set(g,o);return o;}
function pikeZones(g){let z=HZ.get(g);if(z)return z;const h=GAME&&boardHash(g);z=GAME&&GAME.zones.get(h);if(!z){z={R:new Uint8Array(CELLS.length),B:new Uint8Array(CELLS.length)};for(const u of g.units)if(u.typ==='P')for(const n of NEI[u.cell])z[foe(u.side)][n]=1;if(GAME)GAME.zones.set(h,z);}HZ.set(g,z);return z;}
function initial(){const make=(id,side,typ,pos)=>({id,side,typ,cell:CELL_INDEX.get(ckey(pos)),active:true});return {units:[make(1,'R','P',[-2,0]),make(2,'R','A',[-3,1]),make(3,'R','C',[-2,-1]),make(4,'B','P',[2,0]),make(5,'B','A',[3,-1]),make(6,'B','C',[2,1])],pending:{R:null,B:null},rnd:1,captured:{R:0,B:0},turn:'R'};}

function legalMoves(g,u,o=occupancy(g)){
  let byUnit=HM.get(g);if(!byUnit){const h=GAME&&boardHash(g);byUnit=GAME&&GAME.moves.get(h);if(!byUnit){byUnit=new Map();if(GAME)GAME.moves.set(h,byUnit);}HM.set(g,byUnit);}if(byUnit.has(u.id))return byUnit.get(u.id);
  let out;
  if(u.typ==='C'){
    out=[];const seen=new Uint8Array(CELLS.length),qc=new Int8Array(CELLS.length),qd=new Uint8Array(CELLS.length),zones=pikeZones(g)[u.side];let head=0,tail=1;seen[u.cell]=1;qc[0]=u.cell;
    while(head<tail){const p=qc[head],d=qd[head++];if(d>=3)continue;for(const n of NEI[p]){if(seen[n])continue;seen[n]=1;const v=o[n],stop=zones[n];if(!v||v.side!==u.side)out.push(n);if((!v||v.side===u.side)&&!stop){qc[tail]=n;qd[tail++]=d+1;}}}
  }else if(u.typ==='A')out=NEI[u.cell].filter(n=>!o[n]);
  else out=NEI[u.cell].filter(n=>!o[n]||o[n].side!==u.side);
  byUnit.set(u.id,out);return out;
}
function archTargets(g,u){let byUnit=HT.get(g);if(!byUnit){const h=GAME&&boardHash(g);byUnit=GAME&&GAME.targets.get(h);if(!byUnit){byUnit=new Map();if(GAME)GAME.targets.set(h,byUnit);}HT.set(g,byUnit);}if(byUnit.has(u.id))return byUnit.get(u.id);const o=occupancy(g),out=NEI[u.cell].map(n=>o[n]).filter(x=>x&&x.side!==u.side);byUnit.set(u.id,out);return out;}
const pikeTargets=archTargets;
const POKE_ORDER=process.env.POKE_ORDER||'before';
function actionList(g,u){
  const out=[['hold',u.id,null]];
  if(u.typ==='A'){
    const o=occupancy(g),targets=archTargets(g,u),moves=legalMoves(g,u,o);
    for(const t of targets)out.push(['shoot',u.id,t.id]);
    for(const m of moves)out.push(['move',u.id,m]);
    for(const m of moves)for(const n of NEI[m]){const t=o[n];if(t&&t.side!==u.side)out.push(['moveshoot',u.id,[m,t.id]]);}
    for(const t of targets)for(const n of NEI[u.cell]){const v=o[n];if(!v||v.id===t.id)out.push(['shootmove',u.id,[t.id,n]]);}
  }else if(u.typ==='P'){
    if(POKE_ORDER==='before')for(const t of pikeTargets(g,u))out.push(['poke',u.id,t.id]);
    for(const m of legalMoves(g,u))out.push(['move',u.id,m]);
    if(POKE_ORDER==='after')for(const t of pikeTargets(g,u))out.push(['poke',u.id,t.id]);
  }else for(const m of legalMoves(g,u))out.push(['move',u.id,m]);
  return out;
}
function applyAction(g,a,mark=true){
  invalidate(g);const [kind,uid,arg]=a,u=unitById(g,uid);if(!u)return;const side=u.side;
  if(kind==='hold'){if(mark)u.active=false;return;}
  if(kind==='shoot'||kind==='poke'){const t=unitById(g,arg);if(t){g.captured[side]+=TYPEV[t.typ];g.units=g.units.filter(x=>x.id!==t.id);}}
  else if(kind==='move'){const victim=g.units.find(x=>x.cell===arg&&x.side!==side);if(victim){g.captured[side]+=TYPEV[victim.typ];g.units=g.units.filter(x=>x.id!==victim.id);}u.cell=arg;}
  else if(kind==='moveshoot'){const [dest,tid]=arg;u.cell=dest;const t=unitById(g,tid);if(t){g.captured[side]+=TYPEV[t.typ];g.units=g.units.filter(x=>x.id!==t.id);}}
  else if(kind==='shootmove'){const [tid,dest]=arg,t=unitById(g,tid);if(t){g.captured[side]+=TYPEV[t.typ];g.units=g.units.filter(x=>x.id!==t.id);}u.cell=dest;}
  if(mark)u.active=false;
}
function immediateCaptures(g,side){let bySide=HC.get(g);if(!bySide){const h=GAME&&boardHash(g);bySide=GAME&&GAME.captures.get(h);if(!bySide){bySide={};if(GAME)GAME.captures.set(h,bySide);}HC.set(g,bySide);}if(bySide[side]!==undefined)return bySide[side];const o=occupancy(g);let n=0;for(const u of units(g,side)){if(u.typ==='A')n+=archTargets(g,u).length;else for(const m of legalMoves(g,u,o))if(o[m]&&o[m].side!==side)n++;}bySide[side]=n;return n;}
function featureScore(before,after,side,genome,action){
  const G=genome.genes,own0=units(before,side),own=units(after,side),en0=units(before,foe(side)),en=units(after,foe(side)),actor0=own0.find(u=>u.id===action[1]),actor=own.find(u=>u.id===action[1])||actor0;let sc=0;
  const killed=en0.filter(u=>!en.some(v=>v.id===u.id));for(const k of killed){sc+=G.captureTarget[k.typ];if(actor0)sc+=G.attacker[actor0.typ];}
  if(actor0&&actor){const prog=DIST[actor0.cell][BASE[foe(side)]]-DIST[actor.cell][BASE[foe(side)]];sc+=prog*G.action.progress;sc+=(DIST[actor0.cell][CENTER]-DIST[actor.cell][CENTER])*G.action.center;sc+=prog*G.action.enemyBase;sc+=(after.units.some(x=>x.id===actor.id)?legalMoves(after,actor).length:0)*G.action.mobility*.15;const friends=own.filter(u=>u.id!==actor.id),nf=friends.filter(u=>DIST[actor.cell][u.cell]===1).length;sc+=nf*G.action.support+(-nf)*G.action.dispersion;for(const [who,arr] of [['friend',friends],['enemy',en]])for(const rr of [1,2]){const c=Math.min(6,arr.filter(u=>DIST[actor.cell][u.cell]<=rr).length);sc+=G.cell[`${who}${rr}_${c}`];}for(const u of friends){const d=DIST[actor.cell][u.cell];if(d>=1&&d<=3)sc+=G.position?.[`${actor.typ}|friend|${u.typ}|${d}`]||0;}for(const u of en){const d=DIST[actor.cell][u.cell];if(d>=1&&d<=3)sc+=G.position?.[`${actor.typ}|enemy|${u.typ}|${d}`]||0;}}
  sc+=immediateCaptures(after,side)*G.action.force;sc+=immediateCaptures(after,foe(side))*G.action.exposure;if(action[0]==='hold')sc+=G.action.hold;return sc;
}
function orderedCandidateActions(g,side,genome){const h=TURN&&stateHash(g),cached=TURN&&TURN.ordered.get(h);if(cached)return cached;const breadth=8,explore=genome.genes.search.exploration,ordering=1,pool=[],o=occupancy(g);for(const u of units(g,side).filter(u=>u.active))for(const a of actionList(g,u)){let quick=0;if(a[0]==='shoot'||a[0]==='moveshoot'||a[0]==='shootmove'||a[0]==='poke')quick+=100;else if(a[0]==='move'&&o[a[2]]&&o[a[2]].side!==side)quick+=100;if(a[0]==='hold')quick-=5;pool.push([quick*ordering,a]);}pool.sort((a,b)=>b[0]-a[0]);if(!pool.length)return[];const k=Math.max(1,Math.min(pool.length,breadth)),ne=Math.min(k-1,Math.round(k*explore)),out=pool.slice(0,k-ne).concat(ne>0?pool.slice(-ne):[]).map(x=>x[1]);if(TURN)TURN.ordered.set(h,out);return out;}
function actionIncrement(before,after,side,genome,a,prior){const key=TURN&&`${boardHash(before)}>${JSON.stringify(a)}`;let sc=key&&TURN.features.get(key);if(sc===undefined){sc=featureScore(before,after,side,genome,a);if(key)TURN.features.set(key,sc);}if(prior.length){sc+=genome.genes.sequence.secondAction;if(prior[prior.length-1][1]!==a[1])sc+=genome.genes.sequence.coordinatedCombo;if(after.units.length<=before.units.length-1)sc+=genome.genes.sequence.doubleCapture;}return sc;}
function lookahead(g,side,genome,depth,history){let beam=[[0,deep(g),[]]];const trans=new Set();for(let ply=0;ply<Math.max(1,depth);ply++){let candidates=[],expanded=false;for(const [baseSc,bg,seq] of beam){if(!units(bg,side).some(u=>u.active)){candidates.push([baseSc,bg,seq]);continue;}const actions=orderedCandidateActions(bg,side,genome);if(!actions.length){candidates.push([baseSc,bg,seq]);continue;}for(const a of actions){const ng=deep(bg);applyAction(ng,a,true);const h=stateHash(ng);if(trans.has(h))continue;trans.add(h);expanded=true;candidates.push([baseSc+actionIncrement(bg,ng,side,genome,a,history.concat(seq)),ng,seq.concat([a])]);}}if(!expanded)break;candidates.sort((a,b)=>b[0]-a[0]);beam=candidates.slice(0,Math.max(1,Math.min(4,candidates.length)));}beam.sort((a,b)=>b[0]-a[0]);return beam[0]||[0,deep(g),[]];}
function planTurn(g,side,genome,nodeBudget=3){const parent=TURN;TURN={ordered:new Map(),features:new Map()};let current=deep(g),history=[],totalSc=0;try{while(true){const active=units(current,side).filter(u=>u.active);if(!active.length)break;const [,,seq]=lookahead(current,side,genome,Math.max(1,nodeBudget),history),a=seq.length?seq[0]:['hold',active[0].id,null],before=current,next=deep(current);applyAction(next,a,true);totalSc+=actionIncrement(before,next,side,genome,a,history);current=next;history.push(a);if(!units(current,foe(side)).length)break;}return [totalSc,current,history];}finally{TURN=parent;}}
function recruitScores(g,side,genome){const G=genome.genes,mc={P:0,A:0,C:0},ec={P:0,A:0,C:0};for(const u of g.units)(u.side===side?mc:ec)[u.typ]++;const R=G.recruit,scores={C:-2.1*mc.C,P:R.baseP-2.1*mc.P,A:R.baseA-2.1*mc.A};for(const e of TYPES){scores.P+=R[`P>${e}`]*ec[e];scores.A+=R[`A>${e}`]*ec[e];}return scores;}
function aiRecruit(g,side,genome){const s=recruitScores(g,side,genome);return TYPES.slice().sort((a,b)=>s[b]-s[a])[0];}
function deploymentSpots(g,side){const o=occupancy(g);return NEI[BASE[side]].filter(c=>!o[c]);}
function aiDeploy(g,side,genome,nextId){if(!g.pending[side])return [null,nextId];const spots=deploymentSpots(g,side);if(!spots.length)return [null,nextId];const G=genome.genes,own=units(g,side),en=units(g,foe(side)),score=c=>{const support=own.filter(u=>DIST[c][u.cell]===1).length,exposure=en.filter(u=>DIST[c][u.cell]===1).length;return -DIST[c][CENTER]*G.deploy.radial+support*G.deploy.support+exposure*G.deploy.exposure;};spots.sort((a,b)=>score(b)-score(a));const dep={id:nextId++,side,typ:g.pending[side],cell:spots[0],active:false};invalidate(g);g.units.push(dep);g.pending[side]=null;return [publicUnit(dep),nextId];}
function convertAction(a){const [kind,unitId,arg]=a;if(kind==='hold')return {kind,unitId};if(kind==='move')return {kind,unitId,destination:[...CELLS[arg]]};if(kind==='shoot'||kind==='poke')return {kind,unitId,targetId:arg};if(kind==='moveshoot')return {kind,unitId,destination:[...CELLS[arg[0]]],targetId:arg[1]};if(kind==='shootmove')return {kind,unitId,targetId:arg[0],destination:[...CELLS[arg[1]]]};}

function simulate(red,blue,maxRounds=20){GAME=newGameCache();let g=initial(),nextId=7;const turns=[];for(let rnd=1;rnd<=maxRounds;rnd++){g.rnd=rnd;for(const side of ['R','B']){g.turn=side;for(const u of units(g,side))u.active=true;let dep=null;[dep,nextId]=aiDeploy(g,side,side==='R'?red:blue,nextId);let rec=null;if(rnd%2===1&&g.pending[side]===null){rec=aiRecruit(g,side,side==='R'?red:blue);g.pending[side]=rec;}const [,after,acts]=planTurn(g,side,side==='R'?red:blue,3);g=after;turns.push({round:rnd,side,deployed:dep,recruited:rec,actions:acts.map(convertAction),state:publicState(g)});if(!units(g,foe(side)).length)return {turns,result:{winner:side,round:rnd},finalState:publicState(g)};}}return {turns,result:{winner:'',round:maxRounds},finalState:publicState(g)};}
function simulateStats(red,blue,maxRounds=20){
  GAME=newGameCache();let g=initial(),nextId=7,winner='',finalRound=maxRounds;
  const z={redP:0,redA:0,redC:0,blueP:0,blueA:0,blueC:0,redPokes:0,bluePokes:0,redPokeKills:0,bluePokeKills:0,redKillByP:0,redKillByA:0,redKillByC:0,blueKillByP:0,blueKillByA:0,blueKillByC:0,redVictimP:0,redVictimA:0,redVictimC:0,blueVictimP:0,blueVictimA:0,blueVictimC:0,redCommittedP:0,redCommittedA:0,redCommittedC:0,blueCommittedP:0,blueCommittedA:0,blueCommittedC:0};
  for(let rnd=1;rnd<=maxRounds&&!winner;rnd++){g.rnd=rnd;for(const side of ['R','B']){g.turn=side;for(const u of units(g,side))u.active=true;let dep=null;[dep,nextId]=aiDeploy(g,side,side==='R'?red:blue,nextId);const pref=side==='R'?'red':'blue';if(dep)z[pref+dep.typ]++;if(rnd%2===1&&g.pending[side]===null){const rec=aiRecruit(g,side,side==='R'?red:blue);g.pending[side]=rec;z[pref+'Committed'+rec]++;}const beforePlan=deep(g),planned=planTurn(g,side,side==='R'?red:blue,3),acts=planned[2];let trace=beforePlan;for(const a of acts){const actor=unitById(trace,a[1]);let victim=null;if(a[0]==='shoot'||a[0]==='poke')victim=unitById(trace,a[2]);else if(a[0]==='moveshoot')victim=unitById(trace,a[2][1]);else if(a[0]==='shootmove')victim=unitById(trace,a[2][0]);else if(a[0]==='move')victim=trace.units.find(x=>x.cell===a[2]&&x.side!==side);if(a[0]==='poke')z[pref+'Pokes']++;applyAction(trace,a,true);if(victim&&!unitById(trace,victim.id)){z[pref+'KillBy'+actor.typ]++;z[pref+'Victim'+victim.typ]++;if(a[0]==='poke')z[pref+'PokeKills']++;}}g=planned[1];if(!units(g,foe(side)).length){winner=side;finalRound=rnd;break;}}}
  const speed=.5*(20-finalRound)/19;return {outcome:winner?'elimination':'draw',winner,round:finalRound,redScore:winner==='R'?1+speed:winner==='B'?-speed:0,blueScore:winner==='B'?1+speed:winner==='R'?-speed:0,...z,engineRulesVersion:'reach-v1',depth:3};
}


// Cross-game exact-state caches.  These change execution only, never policy.
// The full state key includes unit IDs/types/cells/activation plus pending queues,
// captures, round and side-to-move.  Per-game tactical memoization remains GAME.
function compactUnitsKey(g,withActive=true){
  let s='';
  for(const u of g.units){s+=String.fromCharCode(u.id&255,(u.id>>>8)&255,u.side==='B'?1:0,u.typ==='P'?1:u.typ==='A'?2:3,u.cell&255,withActive?(u.active?1:0):0);}
  return s;
}
function pendingCode(x){return x==='P'?1:x==='A'?2:x==='C'?3:0;}
function exactStateKey(g){const cr=g.captured.R|0,cb=g.captured.B|0;return String.fromCharCode(g.rnd&255,g.turn==='B'?1:0,pendingCode(g.pending.R),pendingCode(g.pending.B),cr&255,(cr>>>8)&255,cb&255,(cb>>>8)&255)+compactUnitsKey(g,true);}
function cloneAction(a){return [a[0],a[1],Array.isArray(a[2])?[...a[2]]:a[2]];}
function clonePlanned(p){return [p[0],deep(p[1]),p[2].map(cloneAction)];}
function createWorkerScopedCaches(){return {openRed:new Map(),openBlue:new Map(),blueRR:new Map(),stats:{lookups:{openRed:0,openBlue:0,redFocal:0,blueRR:0},hits:{openRed:0,openBlue:0,redFocal:0,blueRR:0},stores:{openRed:0,openBlue:0,redFocal:0,blueRR:0}}};}
function cachedPlan(g,side,genome,map,key,label,allowStore,caches){
  caches.stats.lookups[label]++;
  const hit=map.get(key);
  if(hit){caches.stats.hits[label]++;return clonePlanned(hit);}
  const p=planTurn(g,side,genome,3);
  if(allowStore){map.set(key,clonePlanned(p));caches.stats.stores[label]++;}
  return p;
}
function simulateStatsScoped(red,blue,opts={},maxRounds=20){
  GAME=newGameCache();let g=initial(),nextId=7,winner='',finalRound=maxRounds;
  const caches=opts.workerCaches||createWorkerScopedCaches(),redFocal=opts.redFocal||new Map(),redKey=opts.redKey||red.id||'',blueKey=opts.blueKey||blue.id||'';
  let redStored=false,blueStored=false;
  const z={redP:0,redA:0,redC:0,blueP:0,blueA:0,blueC:0,redPokes:0,bluePokes:0,redPokeKills:0,bluePokeKills:0,redKillByP:0,redKillByA:0,redKillByC:0,blueKillByP:0,blueKillByA:0,blueKillByC:0,redVictimP:0,redVictimA:0,redVictimC:0,blueVictimP:0,blueVictimA:0,blueVictimC:0,redCommittedP:0,redCommittedA:0,redCommittedC:0,blueCommittedP:0,blueCommittedA:0,blueCommittedC:0};
  for(let rnd=1;rnd<=maxRounds&&!winner;rnd++){
    g.rnd=rnd;
    for(const side of ['R','B']){
      g.turn=side;for(const u of units(g,side))u.active=true;
      let dep=null;[dep,nextId]=aiDeploy(g,side,side==='R'?red:blue,nextId);
      const pref=side==='R'?'red':'blue';if(dep)z[pref+dep.typ]++;
      if(rnd%2===1&&g.pending[side]===null){const rec=aiRecruit(g,side,side==='R'?red:blue);g.pending[side]=rec;z[pref+'Committed'+rec]++;}
      const beforePlan=deep(g),state=exactStateKey(g);let planned;
      if(rnd===1&&side==='R') planned=cachedPlan(g,side,red,caches.openRed,redKey+'|'+state,'openRed',true,caches);
      else if(rnd===1&&side==='B') planned=cachedPlan(g,side,blue,caches.openBlue,blueKey+'|'+state,'openBlue',true,caches);
      else if(side==='R'){
        const had=redFocal.has(state);planned=cachedPlan(g,side,red,redFocal,state,'redFocal',!redStored,caches);if(!had&&!redStored)redStored=true;
      }else{
        const k=blueKey+'|'+state,had=caches.blueRR.has(k);planned=cachedPlan(g,side,blue,caches.blueRR,k,'blueRR',!blueStored,caches);if(!had&&!blueStored)blueStored=true;
      }
      const acts=planned[2];let trace=beforePlan;
      for(const a of acts){const actor=unitById(trace,a[1]);let victim=null;if(a[0]==='shoot'||a[0]==='poke')victim=unitById(trace,a[2]);else if(a[0]==='moveshoot')victim=unitById(trace,a[2][1]);else if(a[0]==='shootmove')victim=unitById(trace,a[2][0]);else if(a[0]==='move')victim=trace.units.find(x=>x.cell===a[2]&&x.side!==side);if(a[0]==='poke')z[pref+'Pokes']++;applyAction(trace,a,true);if(victim&&!unitById(trace,victim.id)){z[pref+'KillBy'+actor.typ]++;z[pref+'Victim'+victim.typ]++;if(a[0]==='poke')z[pref+'PokeKills']++;}}
      g=planned[1];if(!units(g,foe(side)).length){winner=side;finalRound=rnd;break;}
    }
  }
  const speed=.5*(20-finalRound)/19;return {outcome:winner?'elimination':'draw',winner,round:finalRound,redScore:winner==='R'?1+speed:winner==='B'?-speed:0,blueScore:winner==='B'?1+speed:winner==='R'?-speed:0,...z,engineRulesVersion:'reach-v1',depth:3};
}
function scopedCacheSnapshot(c){return {sizes:{openRed:c.openRed.size,openBlue:c.openBlue.size,blueRR:c.blueRR.size},stats:JSON.parse(JSON.stringify(c.stats))};}

module.exports={simulate,simulateStats,simulateStatsScoped,createWorkerScopedCaches,scopedCacheSnapshot};
if(require.main===module){const pop=JSON.parse(fs.readFileSync(process.argv[2])),red=pop.find(x=>x.id===process.argv[3]),blue=pop.find(x=>x.id===process.argv[4]);if(!red||!blue)throw Error('missing');console.log(JSON.stringify(process.argv.includes('--stats')?simulateStats(red,blue):simulate(red,blue),null,2));}
