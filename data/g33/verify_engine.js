#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=__dirname;
const eng=require(path.join(root,'outmatch_engine_core112.js'));
const pop=JSON.parse(fs.readFileSync(path.join(root,'g33_human_opponents.engine.json')));
const tests=JSON.parse(fs.readFileSync(path.join(root,'engine_regression_cases.json'))).cases;
const byId=new Map(pop.map(x=>[x.id,x]));
let bad=0;
for(const t of tests){
  const r=eng.simulateStats(byId.get(t.red),byId.get(t.blue));
  const winner=r.winner||'D';
  const ok=winner===t.winner && r.round===t.round && r.outcome===t.outcome;
  if(!ok){ bad++; console.error('FAIL',t.redName,'vs',t.blueName,'expected',t,'got',{winner,round:r.round,outcome:r.outcome}); }
}
if(bad){process.exitCode=1;} else console.log(`PASS: ${tests.length} canonical G33 engine regression cases`);
