import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStone} from '../dist/data.js';
import {rng} from '../dist/art.js';
import {quote,nextGeneration,traceTrial,restoreRecord,researchRecord} from '../dist/nursery.js';
import {betterResult} from '../dist/goals.js';
import {ImpactDirector} from '../dist/cinema.js';
import {SkipSimulation} from '../dist/physics.js';
test('quotes include founders and all requested generations; prohibit invalid orders',()=>{
 assert.equal(quote(2),80);assert.equal(quote(3,'program',3),188);assert.equal(quote(6,'program',8),384);
 for(const args of [[1],[7],[2,'program',999],[2,'free']])assert.throws(()=>quote(...args));
});
test('each cohort recombines its parents, tests fresh siblings and carries its best result forward',()=>{
 const parents=[0,4,7,13].map(id=>makeStone(id,false)),snapshot=JSON.stringify(parents),random=rng(91);
 for(const objective of ['distance','skips']){
  let previous=null;const trail=[];
  for(let i=1;i<=3;i++){
   const run=nextGeneration(parents,previous,{objective},random),trial=traceTrial(run.challenger.stone,i,objective);
   assert.equal(run.round,i);assert.equal(trial.distance,run.challenger.result.distance);assert.equal(trial.skips,run.challenger.result.skips);
   assert.equal(run.challenger.stone.lineage.parents.length,4);assert.ok(trial.path.at(-1).t>=trial.contacts.at(-1).time);assert.equal(trial.contacts.filter(c=>c.success).length,trial.skips);
   if(previous){assert.ok(!betterResult(previous.elite.result,run.elite.result,objective));assert.notEqual(run.challenger.stone.uid,previous.elite.stone.uid);}
   trail.push({round:i,...run.elite.result,kept:run.kept,tested:run.challenger.result});previous=run;
  }
  const research=researchRecord(trail,objective,220,4),restored=restoreRecord({},{research}).research;
  assert.equal(restored.cost,quote(4,'program',3));assert.deepEqual(restored.rows,research.rows);
 }
 assert.equal(JSON.stringify(parents),snapshot);
});
test('normal flight stays wide; tracking temporarily zooms, releases and honours reduced motion',()=>{
 const camera=new ImpactDirector(),sim=new SkipSimulation(makeStone(0,false));
 camera.updateView(sim,.2);assert.equal(camera.zoom,1);assert.equal(camera.speed(sim),1);
 camera.updateView(sim,.2,{follow:true});assert.ok(camera.zoom>1);
 sim.contact=true;assert.equal(camera.speed(sim,{follow:true}),.08);assert.equal(camera.speed(sim,{speed:.5,follow:false}),.5);
 camera.updateView(sim,1,{follow:false});assert.equal(camera.zoom,1);
 camera.updateView(sim,.2,{follow:true,reducedMotion:true});assert.equal(camera.zoom,1);
});
