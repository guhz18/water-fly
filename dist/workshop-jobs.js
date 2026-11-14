import {evaluateStone} from './physics.js';
import {betterResult} from './goals.js';
import {THROW_COUNT} from './throw-search.js';
export async function searchFacility(id,stone,objective,{params,options={},onProgress=()=>{}}={}){
 if(typeof Worker==='undefined')throw Error('浏览器不支持计算线程，本次未扣除灵感。');
 const grid=id==='fluid'||id==='future',count=id==='fluid'?THROW_COUNT:192,parts=grid?2:1;
 const script=id==='fluid'?'./fluid-worker.js':id==='future'?'./optimizer.js':'./craft-worker.js';
 const workers=[],timers=[],progress=Array(parts).fill(0);
 try{
  const bests=await Promise.all(progress.map((_,i)=>new Promise((resolve,reject)=>{
   const w=new Worker(new URL(script,import.meta.url),{type:'module'});workers.push(w);
   const timer=setTimeout(()=>reject(Error('试验超时，本次未扣除灵感。')),90000);timers.push(timer);
   w.onerror=()=>reject(Error('试验中断，本次未扣除灵感。'));
   w.onmessage=({data})=>{if(data.error)return reject(Error(data.error));progress[i]=data.done?1:data.progress;onProgress(progress.reduce((a,b)=>a+b,0)/parts);
    if(data.done){clearTimeout(timer);resolve(data.best);}};
   w.postMessage({id,stone,objective,options,start:i*count/parts,count:count/parts});
  })));
  if(!grid)return bests[0];
  const baseline=evaluateStone(stone,id==='fluid'?params:{}),base={result:baseline,params,stone};
  const best=bests.reduce((a,b)=>betterResult(b.result,a.result,objective)?b:a,base);
  return {...best,baseline,count,recipe:best===base?'保留原方案':id==='fluid'?'三变量联合搜索':'材料网格筛选',conditions:id==='fluid'?'标准静水 · 13 m/s · 联合比较出手角、倾角及旋转':'标准静水 · 13 m/s · 出手 −8°、倾角 20°、旋转 35 r/s'};
 }finally{workers.forEach(w=>w.terminate());timers.forEach(clearTimeout);}
}
