import {evaluateStone} from './physics.js';
import {betterResult} from './goals.js';
// A finite joint grid, including the default throw as a no-regression baseline.
export const PITCHES=[-20,-14,-8,-2,4,10,15];
export const TILTS=[8,12,16,20,24,28,32,36];
export const SPINS=[0,14,28,35,42,56,70];
export const THROW_COUNT=PITCHES.length*TILTS.length*SPINS.length;
export function throwCandidate(index){return {pitch:PITCHES[index%PITCHES.length],
  tilt:TILTS[Math.floor(index/PITCHES.length)%TILTS.length],
  spin:SPINS[Math.floor(index/(PITCHES.length*TILTS.length))]};}
export function searchThrows(stone,start=0,count=THROW_COUNT,progress=()=>{},objective='skips'){
  let best=null;
  for(let i=start;i<Math.min(start+count,THROW_COUNT);i++){
    const params=throwCandidate(i),result=evaluateStone(stone,params);
    if(betterResult(result,best?.result,objective))best={params,result};
    if((i-start)%4===0)progress((i-start+1)/count);
  }
  return best;
}
