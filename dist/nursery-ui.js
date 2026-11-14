import {BASES} from './data.js';
import {TRAIT_NAMES,familyStory} from './genetics.js';
import {BATCH,GENERATIONS,quote,researchRecord} from './nursery.js';
import {drawNurseryTrial} from './nursery-art.js';
import {GOAL_NAMES} from './goals.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const q=s=>document.querySelector(s);
export function objectiveControl(selected='distance'){
 return '<fieldset class="opt-field"><legend>优化目标</legend><div class="opt-tabs">'+[['distance','↗','距离优先','把它送到更远的水面'],['skips','≈','次数优先','争取多一次离水']].map(([id,icon,name,tip])=>`<label><input type="radio" name="objective" value="${id}" ${selected===id?'checked':''}><span><b>${icon}　${name}</b><small>${tip}</small></span></label>`).join('')+'</div></fieldset>';
}
export function nurseryForm(stone,collection){
 const others=collection.filter(s=>s.uid!==stone.uid);
 return `<div class="nursery-form"><fieldset class="opt-field"><legend>研究方式</legend><div class="opt-tabs"><label><input type="radio" name="brood" value="cross" checked><span><b>手动配组</b><small>培育一窝，留一块</small></span></label><label><input type="radio" name="brood" value="program"><span><b>委托自动育种</b><small>逐代试漂，择优留种</small></span></label></div></fieldset>
 <label class="generations" hidden>委托代数 <select id="generations">${GENERATIONS.map(n=>`<option value="${n}">${n} 代 · 每代 ${BATCH} 个候选</option>`).join('')}</select></label>
 <fieldset class="opt-field"><legend>亲本席位 <small>2–6 块 · 亲本都保留</small></legend><div class="parent-list"><span class="founder"><b>主亲本</b> ${esc(stone.name)}</span>${others.map((s,i)=>`<label><input type="checkbox" name="founder" value="${esc(s.uid)}" ${i===0?'checked':''}><span>${esc(s.name)}</span></label>`).join('')}</div></fieldset>
 <div id="familyPreview" class="family-preview" aria-live="polite"></div>
 <details class="gene-options"><summary>基因编辑 <small>默认自然遗传</small></summary><div class="science-controls"><div class="gene-row">${TRAIT_NAMES.map((t,i)=>`<label>${t}<select id="gene${i}"><option value="inherit">自然继承</option>${BASES.map(g=>`<option value="${g}">${g}</option>`).join('')}</select></label>`).join('')}</div><label>轮廓 / 第五位点<select id="outlineGene"><option value="inherit">拼接亲本轮廓</option>${['AT · 圆片','TA · 椭圆','GC · 三角','CG · 方片'].map(t=>`<option value="${t.slice(0,2)}">${t}</option>`).join('')}</select></label></div></details></div>`;
}
export function readPlan(stone,collection){
 const ids=new Set([...document.querySelectorAll('[name=founder]:checked')].map(el=>el.value));
 const parents=[stone,...collection.filter(s=>s.uid!==stone.uid&&ids.has(s.uid))];
 const mode=q('[name=brood]:checked').value,rounds=mode==='program'?Number(q('#generations').value):1;
 return {parents,mode,rounds,cost:parents.length<2?null:quote(parents.length,mode,rounds),objective:q('[name=objective]:checked').value,edits:TRAIT_NAMES.map((_,i)=>q('#gene'+i).value),outlineEdit:q('#outlineGene').value};
}
export function bindNursery(stone,collection,credits){
 const update=()=>{
  const p=readPlan(stone,collection),selected=p.parents.length,btn=q('#applyFacility');
  for(const el of document.querySelectorAll('[name=founder]'))el.disabled=!el.checked&&selected>=6;
  q('.generations').hidden=p.mode!=='program';
  const story=selected>=2?familyStory(p.parents):null;
  q('#familyPreview').innerHTML=story?`<small>配组手记 · ${selected} 亲本</small><strong>${esc(story.title)}</strong><p>${esc(story.text)}</p>`:'至少再选一块亲本。口袋还没伙伴的话，去浅滩拾一块。';
  const lack=(p.cost??0)-credits;
  q('#quote').textContent=p.cost===null?'等待配组':`✦ ${p.cost} / 现有 ${credits}`;
  q('#budgetNote').textContent=p.cost===null?'选择亲本后报价。':`每窝试漂 ${BATCH} 块；配组 80，第三块亲本起每块 +12，委托每代 +32。完成后一次结算。 ${lack>0?'还差 '+lack+' 灵感。':''}`;
  btn.disabled=selected<2||lack>0;btn.textContent=p.mode==='program'?`委托 ${p.rounds} 代育种 ↗`:'试配这一窝 ↗';
 };
 for(const el of document.querySelectorAll('[name=brood],[name=founder],#generations,[name=objective]'))el.addEventListener('change',update);
 update();return update;
}
export function recordContent(r,pending=false){
 if(!r?.rows?.length)return '';
 return `<div class="study-ledger"><b>水槽试漂簿 · ${GOAL_NAMES[r.objective]}</b><small>${r.founders} 亲本 · ${pending?"预算":"消耗"} ✦ ${r.cost} · 静水 13 m/s</small><ol>${r.rows.map(v=>`<li><span>第 ${v.round} 轮</span><strong>${v.distance.toFixed(1)} m</strong><strong>${v.skips} 漂</strong><small>${v.kept?(v.tested?'本代试漂 '+v.tested.distance.toFixed(1)+' m / '+v.tested.skips+' 漂；':'')+'留用上代优胜者':'本代入选'}</small></li>`).join('')}</ol></div>`;
}
export async function runNursery(plan,{reducedMotion,sound}){
 if(typeof Worker==='undefined')throw Error('育种水槽需要浏览器支持 Worker。');
 const worker=new Worker(new URL('./nursery-worker.js',import.meta.url),{type:'module'});
 const status=q('#processStatus');q('#workshopScene').closest('.workshop-scene').hidden=true;
 q('#facilityInputs').hidden=true;q('#workButtons').hidden=true;
 status.innerHTML=`<div class="trial-room"><header><span>RIVER FIELD STATION</span><b>研究员试漂中</b></header><canvas width="960" height="300" id="trialScene" aria-label="研究员在水槽逐代试漂"></canvas><div id="trialStatus" role="status">正在培育第一窝候选…</div></div><div id="roundHistory"></div><button class="secondary" type="button" id="cancelStudy">撤回本次研究 · 不扣灵感</button>`;
 status.scrollIntoView({block:'nearest'});let cancelWait,stopped=false;
 const rows=[];let champion;const scene=q('#trialScene'),label=q('#trialStatus');
 const cancel=()=>{stopped=true;cancelWait?.(Error('本次研究已撤回，灵感和亲本都已保留。'));};
 q('#cancelStudy').onclick=cancel;
 try{
 for(let i=1;i<=plan.rounds;i++){
  label.textContent=`第 ${i} / ${plan.rounds} 轮 · 同一水槽试漂 ${BATCH} 个候选…`;
  const data=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('试漂超时，未扣除灵感。')),60000);
   const fail=error=>{clearTimeout(timer);reject(error);};cancelWait=fail;
   worker.onerror=()=>fail(Error('试漂被中断，未扣除灵感。'));
   worker.onmessage=({data})=>{clearTimeout(timer);if(data.error)reject(Error(data.error));else resolve(data);};
   worker.postMessage(i===1?{founders:plan.parents,options:{objective:plan.objective,edits:plan.edits,outlineEdit:plan.outlineEdit}}:{next:true});
  });
  const trial=data.trial;champion=data.champion;
  label.textContent=`第 ${i} / ${plan.rounds} 轮 · ${trial.stone.name} · ${GOAL_NAMES[plan.objective]}`;
  await new Promise((resolve,reject)=>{
   let frame,prev=0,elapsed=0,launched=false,hits=0;
   const length=reducedMotion()?450:2700;
   cancelWait=error=>{cancelAnimationFrame(frame);reject(error);};
   const paint=now=>{if(stopped)return cancelWait(Error('研究已撤回。'));if(prev&&!document.hidden)elapsed+=Math.min(80,now-prev);prev=now;
    const p=Math.min(1,elapsed/length);drawNurseryTrial(scene,trial,p,reducedMotion());
    if(!launched&&p>=.17){launched=true;sound('throw');}
    const phase=Math.max(0,Math.min(1,(p-.17)/.59)),n=trial.contacts.filter(c=>c.time<=phase*trial.path.at(-1).t).length;
    if(!reducedMotion()&&n>hits){hits=n;sound('impact');}
    if(p>=1)resolve();else frame=requestAnimationFrame(paint);};frame=requestAnimationFrame(paint);
  });
  rows.push({round:i,skips:data.result.skips,distance:data.result.distance,kept:data.kept,tested:{skips:trial.skips,distance:trial.distance}});
  q('#roundHistory').innerHTML=recordContent(researchRecord(rows,plan.objective,plan.cost,plan.parents.length),true);sound('craft');
 }
 const research=researchRecord(rows,plan.objective,plan.cost,plan.parents.length);return {...champion,research};
 }finally{cancelWait=null;worker.terminate();}
}
