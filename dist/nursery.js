import {breedFamily} from './genetics.js';
import {evaluateStone,SkipSimulation} from './physics.js';
import {betterResult} from './goals.js';

export const BATCH=6, GENERATIONS=[3,5,8];
export function quote(n,mode='cross',generations=3){
 if(!Number.isInteger(n)||n<2||n>6)throw Error('请选择 2 至 6 块不同的亲本。');
 if(!['cross','program'].includes(mode)||(mode==='program'&&!GENERATIONS.includes(generations)))throw Error('请选择有效的育种计划。');
 return 80+(n-2)*12+(mode==='program'?generations*32:0);
}
// Score all siblings at identical conditions. Only the best child enters the pocket.
// The nursery keeps an elite across generations; surviving founders remain available for backcross.
export function nextGeneration(founders,previous,{objective,edits=[],outlineEdit='inherit'},random=Math.random){
 const count=founders.length;quote(count);
 if(new Set(founders.map(s=>s.uid)).size!==count)throw Error('同一块石头不能同时占据两个亲本席位。');
 if(!['distance','skips'].includes(objective))throw Error('未知育种目标');
 const parents=previous?[previous.elite.stone,previous.mate.stone,...founders.slice(previous.round%count),...founders.slice(0,previous.round%count)]:founders;
 const unique=[...new Map(parents.map(s=>[s.uid,s])).values()].slice(0,count);
 const siblings=Array.from({length:BATCH},()=>{const stone=breedFamily(unique,edits,random,outlineEdit);return {stone,result:evaluateStone(stone)};});
 siblings.sort((a,b)=>betterResult(a.result,b.result,objective)?-1:betterResult(b.result,a.result,objective)?1:0);
 const fresh=siblings[0],kept=!!previous&&!betterResult(fresh.result,previous.elite.result,objective);
 const elite=kept?previous.elite:fresh;
 return {round:(previous?.round||0)+1,elite,challenger:fresh,mate:kept?fresh:siblings[1],kept};
}
// Record the entire winning throw, independent of the rolling in-game trail buffer.
export function traceTrial(stone,generation,objective){
 const sim=new SkipSimulation(stone,{}, {wave:0,wind:0,current:0}),path=[];let tick=0;
 const sample=()=>path.push({t:sim.time,x:sim.x,y:sim.y});sample();
 while(!sim.done){sim.step(sim.dt);if(++tick%4===0||sim.done)sample();}
 return {...sim.result(),stone,path,contacts:sim.contacts.map(({time,x,success})=>({time,x,success})),generation,objective};
}
export function researchRecord(rows,objective,cost,n){return {objective,cost,founders:n,rows:rows.map(({round,skips,distance,kept,tested})=>({round,skips,distance,kept,...(tested?{tested:{skips:tested.skips,distance:tested.distance}}:{})}))};}
export function restoreRecord(out,x){
 const r=x.research;if(!r||!['distance','skips'].includes(r.objective)||!Number.isInteger(r.founders)||r.founders<2||r.founders>6||!Array.isArray(r.rows)||!r.rows.length||r.rows.length>8)return out;
 if(!r.rows.every((v,i)=>v?.round===i+1&&Number.isInteger(v.skips)&&v.skips>=0&&v.skips<10000&&Number.isFinite(v.distance)&&v.distance>=0&&v.distance<1000))return out;
 if(r.rows.length!==1&&!GENERATIONS.includes(r.rows.length))return out;
 out.research=researchRecord(r.rows.map(v=>({...v,kept:v.kept===true,tested:Number.isInteger(v.tested?.skips)&&v.tested.skips>=0&&v.tested.skips<10000&&Number.isFinite(v.tested?.distance)&&v.tested.distance>=0&&v.tested.distance<1000?v.tested:null})),r.objective,quote(r.founders,r.rows.length===1?'cross':'program',r.rows.length),r.founders);return out;
}
