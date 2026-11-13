import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStone,MAPS,TYPES} from '../dist/data.js';
import {breedStone,discardStone,newProgress,resetProgress,restoreResearch,TRAITS} from '../dist/genetics.js';
import {QuantumSkipSimulation,QuantumWater,TAU} from '../dist/quantum.js';
import {searchThrows,throwCandidate,THROW_COUNT} from '../dist/throw-search.js';
import {SkipSimulation,evaluateStone} from '../dist/physics.js';
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const finish=sim=>{while(!sim.done)sim.step(1/240);return sim;};

test('discarding selected, unselected and final stones leaves valid selection and retains discoveries',()=>{
 const s=newProgress();s.selected=s.stones[0].uid;const selected=s.selected,discoveries=[...s.discovered];
 assert.equal(discardStone(s,'missing'),false);discardStone(s,s.stones[1].uid);assert.equal(s.selected,selected);
 discardStone(s,selected);assert.equal(s.selected,s.stones[0].uid);discardStone(s,s.selected);
 assert.equal(s.stones.length,0);assert.equal(s.selected,null);assert.deepEqual(s.discovered,discoveries);
 const next=makeStone(2);s.stones.push(next);s.selected=next.uid;assert.equal(s.stones[0].uid,s.selected);
});
test('reset replaces progress with fresh starter stones without touching independent preferences',()=>{
 const s=newProgress(),oldIds=s.stones.map(x=>x.uid),settings={music:12,muted:true};
 s.credits=999;s.best=33;s.map=4;s.history=[{}];s.stones[0].quantum={phase:45,bias:.5};
 resetProgress(s);assert.equal(s.credits,360);assert.equal(s.best,0);assert.equal(s.map,0);assert.deepEqual(s.history,[]);
 assert.deepEqual(s.stones.map(x=>x.id),[0,4,7]);assert.ok(s.stones.every(x=>!oldIds.includes(x.uid)&&!x.quantum));
 assert.deepEqual(settings,{music:12,muted:true});
});
test('unmodified children inherit actual parent alleles, processed traits, thickness and dominant special state',()=>{
 const a={...makeStone(0,false),flatness:.97,smoothness:.96,thickness:.005,genes:['AT','TA','GC','CG'],quantum:{phase:90,bias:.6}};
 const b={...makeStone(4,false),flatness:.71,smoothness:.65,thickness:.018,genes:['CG','GC','TA','AT']};
 const before=JSON.stringify([a,b]);const sources=new Set();
 for(let i=1;i<40;i++){
  const c=breedStone(a,b,[],seeded(i));assert.equal(c.lineage.generation,1);assert.equal(c.thickness,.0115);
  for(let j=0;j<4;j++){const k=TRAITS[j],l=c.lineage.loci[j];sources.add(l.source);assert.equal(c.genes[j],[a,b][l.source].genes[j]);assert.ok(c[k]>=Math.min(a[k],b[k])&&c[k]<=Math.max(a[k],b[k]));assert.equal(l.edited,false);}
  assert.equal(c.kind,TYPES[c.id].kind);if(c.id===a.id)assert.deepEqual(c.quantum,a.quantum);else assert.equal(c.quantum,undefined);
 }
 assert.equal(sources.size,2);assert.equal(JSON.stringify([a,b]),before);
});
test('editing one inherited locus changes only its matching trait and survives backup roundtrip',()=>{
 const a=makeStone(0,false),b=makeStone(4,false);a.genes=['AT','AT','AT','AT'];b.genes=['AT','AT','AT','AT'];
 const natural=breedStone(a,b,[],seeded(9)),edited=breedStone(a,b,['CG'],seeded(9));
 assert.ok(edited.radius>natural.radius);for(const k of TRAITS.slice(1))assert.equal(edited[k],natural[k]);
 assert.equal(edited.lineage.loci[0].edited,true);edited.quantum={bias:.7,phase:135};edited.recommendedThrow={pitch:-14,tilt:16,spin:56};
 const copy=restoreResearch({...edited,lineage:undefined,quantum:undefined,recommendedThrow:undefined},JSON.parse(JSON.stringify(edited)));
 assert.deepEqual(copy.lineage.loci,edited.lineage.loci);assert.deepEqual(copy.quantum,edited.quantum);assert.deepEqual(copy.recommendedThrow,edited.recommendedThrow);
 edited.lineage.parents[0].genes[0]='CG';assert.notEqual(a.genes[0],'CG');
});
test('unsafe or malformed research metadata is ignored and strings are rebuilt',()=>{
 const s=makeStone(0,false),c=restoreResearch({...s},{quantum:{bias:NaN,phase:'bad'},recommendedThrow:{pitch:NaN,tilt:20,spin:30},lineage:{parents:[{}],loci:[]}});
 assert.equal(c.quantum,undefined);assert.equal(c.lineage,undefined);assert.equal(c.recommendedThrow,undefined);
});
test('quantum phase accumulates in flight, water carries phase and each contact is exactly one measurement',()=>{
 const sim=new QuantumSkipSimulation({...makeStone(0,false),quantum:{bias:.5,phase:0}},{},MAPS[0],seeded(55));
 assert.ok(sim.water instanceof QuantumWater);sim.step(1/240);assert.ok(sim.flightPhase>0);assert.equal(sim.observations.length,0);
 assert.notEqual(sim.water.phaseAt(1),sim.water.phaseAt(2));finish(sim);
 assert.equal(sim.observations.length,sim.contacts.length);assert.ok(sim.observations.length>=sim.skips);assert.ok(sim.observations.length>1);
 assert.ok(sim.observations.every(o=>o.probability>=0&&o.probability<=1&&o.relative>=0&&o.relative<TAU));
 assert.ok(sim.trail.some(p=>Number.isFinite(p.phase)));assert.ok(Number.isFinite(sim.result().distance));
});
test('relative phase controls observation probability and collapse; contact does not remeasure every substep',()=>{
 const stone=makeStone(0,false),a=new QuantumSkipSimulation(stone,{}, {},()=>.5),b=new QuantumSkipSimulation(stone,{}, {},()=>.5);
 a.phase=a.water.phaseAt(a.x);b.phase=b.water.phaseAt(b.x)+Math.PI;
 a.observe({});b.observe({});assert.equal(a.observations[0].outcome,'+');assert.equal(b.observations[0].outcome,'−');
 assert.ok(a.observations[0].probability>.99);assert.ok(b.observations[0].probability<.01);assert.notEqual(a.planingLift,b.planingLift);
 const sim=new QuantumSkipSimulation(stone,{}, {},seeded(1));while(!sim.contact&&!sim.done)sim.step(1/240);
 const n=sim.observations.length,phase=sim.flightPhase;sim.integrate(.000001);
 assert.equal(sim.observations.length,n);assert.equal(sim.flightPhase,phase);
});
test('quantum throws are reproducible across frame rates and all materials remain finite',()=>{
 const stone={...makeStone(0,false),quantum:{phase:45,bias:.6}},a=new QuantumSkipSimulation(stone,{},MAPS[0],seeded(42)),b=new QuantumSkipSimulation(stone,{},MAPS[0],seeded(42));
 while(!a.done)a.advance(1/30);while(!b.done)b.advance(1/144);assert.deepEqual(a.result(),b.result());assert.deepEqual(a.observations,b.observations);
 for(const t of TYPES){const sim=finish(new QuantumSkipSimulation(makeStone(t.id,false),{},MAPS[2],seeded(t.id)));assert.ok(Number.isFinite(sim.x)&&Number.isFinite(sim.energy));assert.ok(sim.time<=24.01);}
});
test('classic solver contact hooks do not change its output',()=>{
 const a=new SkipSimulation(makeStone(0,false)),b=new SkipSimulation(makeStone(0,false));let count=0;b.onContact=()=>count++;
 finish(a);finish(b);assert.deepEqual(a.result(),b.result());assert.equal(count,b.contacts.length);
});
test('joint search explores all three controls and combines worker partitions without losing the optimum',()=>{
 assert.equal(THROW_COUNT,392);const grid=Array.from({length:THROW_COUNT},(_,i)=>throwCandidate(i));
 assert.equal(new Set(grid.map(p=>p.pitch)).size,7);assert.equal(new Set(grid.map(p=>p.tilt)).size,8);assert.equal(new Set(grid.map(p=>p.spin)).size,7);
 assert.equal(new Set(grid.map(JSON.stringify)).size,392);
 const stone=makeStone(0,false),a=searchThrows(stone,0,196),b=searchThrows(stone,196,196),best=a.result.score>=b.result.score?a:b;
 assert.ok(best.result.score>=evaluateStone(stone).score);assert.deepEqual(best.result,evaluateStone(stone,best.params));
});
