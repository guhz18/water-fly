import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStone,MAPS} from '../dist/data.js';
import {makeOutline,outlineOf,buildProfile,wetGeometry,cutOutline,chipOutline,inheritOutline} from '../dist/outline.js';
import {breedStone,restoreResearch,newProgress} from '../dist/genetics.js';
import {SkipSimulation,evaluateStone} from '../dist/physics.js';
import {QuantumSkipSimulation} from '../dist/quantum.js';
import {ImpactDirector,settleThrow} from '../dist/cinema.js';
import {GameAudio,normalizeSettings} from '../dist/audio-engine.js';
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

test('polygon clipping integrates full, dry and half-submerged circles, including an opening',()=>{
 for(const family of ['round','ring']){const p=buildProfile({outline:makeOutline(family)});
  for(const angle of [0,.2,1.3,4.7]){const dry=wetGeometry(p,angle,-2),full=wetGeometry(p,angle,2),half=wetGeometry(p,angle,0);
   assert.equal(dry.area,0);assert.ok(Math.abs(full.area-p.area)<1e-10);assert.ok(Math.abs(half.area-p.area/2)<1e-10);assert.ok(half.center<0);}
 }
 assert.ok(buildProfile({outline:makeOutline('ring')}).area<buildProfile({outline:makeOutline('round')}).area);
});
test('noncircular rotating boundaries change real wetted area and same-material skip results',()=>{
 const s=makeStone(0,false),oval=buildProfile({...s,outline:makeOutline('oval')});
 assert.notEqual(wetGeometry(oval,0,-.5).area,wetGeometry(oval,Math.PI/2,-.5).area);
 const round=evaluateStone({...s,outline:makeOutline('round')}),triangle=evaluateStone({...s,outline:makeOutline('triangle')});
 assert.notDeepEqual(round,triangle);assert.notEqual(round.distance,triangle.distance);
 assert.ok(oval.polarMoment>0&&oval.polarMoment<.5);
});
test('cutting and chipping remove boundary material and inherited outlines retain processed parents',()=>{
 const a={...makeStone(0,false),outline:makeOutline('round'),outlineGene:'AT'},b={...makeStone(4,false),outline:makeOutline('triangle'),outlineGene:'GC'};
 a.outline=chipOutline(a,seeded(5));const before=JSON.stringify([a,b]),cut=cutOutline(a,'square');
 assert.ok(cut.radii.every((r,i)=>r<=a.outline.radii[i]));assert.ok(buildProfile({outline:cut}).area<=buildProfile(a).area);
 const child=breedStone(a,b,[],seeded(7));
 assert.ok(child.outline.radii.every((r,i)=>r>=Math.min(a.outline.radii[i],b.outline.radii[i])-1e-12&&r<=Math.max(a.outline.radii[i],b.outline.radii[i])+1e-12));
 assert.ok(['AT','GC'].includes(child.outlineGene));assert.equal(JSON.stringify([a,b]),before);
 const natural=inheritOutline(a,b,'inherit',()=>0),edited=inheritOutline(a,b,'GC',()=>0);assert.notDeepEqual(natural.outline,edited.outline);assert.equal(edited.inheritance.edited,true);
 const copy=restoreResearch(makeStone(child.id,false),JSON.parse(JSON.stringify(child)));assert.deepEqual(copy.outline,child.outline);assert.deepEqual(copy.lineage.outline,child.lineage.outline);
});
test('legacy and malformed outlines migrate to bounded finite profiles',()=>{
 assert.equal(outlineOf({kind:'key'}).family,'square');assert.equal(outlineOf({kind:'leaf',outline:{radii:[NaN]}}).family,'leaf');
 const s={...makeStone(0,false),outline:{family:'<script>',radii:Array(32).fill(-999),hole:99}},p=buildProfile(s);
 assert.ok(p.area>0&&Number.isFinite(p.polarMoment));assert.ok(p.outline.radii.every(r=>r>=.18));
 const sim=new SkipSimulation(s);while(!sim.done)sim.step(sim.dt);assert.ok(Number.isFinite(sim.x));
});
function runPlayback({speed=1,hero=false,fps=60,quantum=false}={}){
 const s={...makeStone(0,false),quantum:{phase:45,bias:.6}},sim=quantum?new QuantumSkipSimulation(s,{},MAPS[0],seeded(77)):new SkipSimulation(s,{},MAPS[0]),director=new ImpactDirector();
 const old=sim.onContact;sim.onContact=contact=>{director.impact(contact,sim);old?.(contact);};let wall=0,minRate=1;
 while(!sim.done&&wall<300){director.advance(sim,1/fps,{speed,hero},rate=>minRate=Math.min(minRate,rate));wall+=1/fps;director.updateView(sim,1/fps,{hero});}
 assert.ok(sim.done);return {result:sim.result(),observations:sim.observations,contacts:sim.contacts,shots:director.shots,wall,minRate,sim};
}
test('slow playback preserves physics and quantum observations at every supported speed and frame rate',()=>{
 for(const quantum of [false,true]){const normal=runPlayback({quantum});for(const speed of [.5,.25,.1]){const slow=runPlayback({speed,fps:30,quantum});assert.deepEqual(slow.result,normal.result);assert.deepEqual(slow.observations,normal.observations);assert.ok(slow.wall>normal.wall/speed-.1);}}
});
test('hero camera covers every contact including final sink without changing the throw',()=>{
 const normal=runPlayback(),hero=runPlayback({hero:true,fps:144});assert.deepEqual(hero.result,normal.result);assert.equal(hero.shots.length,hero.contacts.length);
 assert.equal(hero.minRate,.08);assert.ok(hero.wall>normal.wall);assert.equal(hero.shots.at(-1).time,hero.contacts.at(-1).time);
 const director=new ImpactDirector();director.updateView(hero.sim,.1,{hero:true,reducedMotion:true});assert.equal(director.zoom,1);
});
test('replays never change credits, personal records, history or total throw count',()=>{
 const state=newProgress(),before=JSON.stringify(state),result={skips:99,distance:150,duration:12};
 assert.deepEqual(settleThrow(state,result,state.stones[0].uid,'河湾',true),{reward:0,isRecord:false});assert.equal(JSON.stringify(state),before);
 const normal=settleThrow(state,result,state.stones[0].uid,'河湾');assert.ok(normal.reward>0);assert.equal(state.totalThrows,1);assert.equal(state.stones[0].best,99);
});
test('Web Audio flight cues track playback speed and pause; UI and music remain at normal pitch',()=>{
 const audio=new GameAudio({muted:false});
 const param=()=>({value:1,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const gain=()=>({gain:param(),connect(){return this;},disconnect(){}});
 audio.context={currentTime:2,createGain:gain,createBufferSource:()=>({playbackRate:param(),connect(){return this;},disconnect(){},start(){},stop(){}})};
 audio.buses={effects:gain(),music:gain(),preview:gain()};audio.activated=true;audio.apply=()=>{};audio.buffer=()=>({});
 audio.setFlight(true);audio.setTimeScale(.25);audio.event('impact');audio.event('ui');
 const [impact,ui]=[...audio.sources];assert.equal(impact.source.playbackRate.value,.25);assert.equal(ui.source.playbackRate.value,1);
 const music=audio.start({},'music',true);audio.setTimeScale(.1);assert.equal(impact.source.playbackRate.value,.1);assert.equal(music.source.playbackRate.value,1);
 audio.setFlightPaused(true);assert.equal(impact.source.playbackRate.value,0);assert.equal(ui.source.playbackRate.value,1);
 audio.setFlightPaused(false);assert.equal(impact.source.playbackRate.value,.1);audio.setFlight(false);audio.setTimeScale(1);assert.equal(impact.source.playbackRate.value,.1,'finishing sound retains its slowed tail');
 const prefs=normalizeSettings({playbackSpeed:.25,heroCamera:false});assert.equal(prefs.playbackSpeed,.25);assert.equal(prefs.heroCamera,false);assert.equal(normalizeSettings({playbackSpeed:-9}).playbackSpeed,1);
});
