import {SkipSimulation,Water,clamp} from './physics.js';
export const TAU=2*Math.PI;
export const wrapPhase=phase=>((phase%TAU)+TAU)%TAU;
// A two-state interferometer toy coupled to the classical planing solver.
// This is sci-fi gameplay, not a physical quantum model of macroscopic stones.
export class QuantumWater extends Water {
  phaseAt(x){return wrapPhase(.38*x-this.time*1.7);}
}
export class QuantumSkipSimulation extends SkipSimulation {
  constructor(stone,params={},environment={},random=Math.random){
    super(stone,params,environment);this.water=new QuantumWater(environment);
    this.phase=wrapPhase((stone.quantum?.phase??0)*Math.PI/180);
    this.bias=clamp(stone.quantum?.bias??.5,.1,.9);this.coherence=1;
    this.observations=[];this.flightPhase=0;this.random=random;this.onObservation=null;
    this.onContact=contact=>this.observe(contact);
  }
  integrate(dt){
    // Accumulate a relative phase only between contacts, with no impulse or
    // extra energy. A measurement changes bounded planing coefficients.
    if(!this.contact){const delta=(2.4+Math.hypot(this.vx,this.vy)*.22+this.spin*.025)*dt;
      this.phase=wrapPhase(this.phase+delta);this.flightPhase+=delta;}
    super.integrate(dt);
  }
  observe(contact){
    const waterPhase=this.water.phaseAt(this.x),relative=wrapPhase(this.phase-waterPhase);
    const probability=clamp(.5+Math.sqrt(this.bias*(1-this.bias))*this.coherence*Math.cos(relative),0,1);
    const plus=this.random()<probability;
    const observation={index:this.observations.length+1,x:this.x,time:this.time,
      phase:this.phase,waterPhase,relative,probability,outcome:plus?'+':'−'};
    this.observations.push(observation);contact.observation=observation;
    this.phase=wrapPhase(waterPhase+(plus?0:Math.PI));this.coherence*=.94;this.bias=.5;
    this.planingLift=plus?1.12:.88;this.planingDrag=plus?.96:1.04;
    this.water.impulse(this.x,.8);this.onObservation?.(observation);
  }
  result(){return {...super.result(),observations:this.observations.length,phase:this.phase,flightPhase:this.flightPhase};}
}

export function drawQuantum(ctx,sim,camera,stone,drawStone,{trajectory=true,reducedMotion=false,compact=false}={}){
  const phase=sim.phase,x=53+(sim.x-camera)*11,y=172-sim.y*24;
  ctx.save();ctx.lineWidth=1;
  // The two water quadratures are actual spatial phase samples, not waves in
  // the shallow-water solver; their hue is the shared legend of the phase dial.
  for(let px=53;px<480;px+=3){const p=sim.water.phaseAt(camera+(px-53)/11);
    ctx.fillStyle=`hsla(${p/TAU*360},75%,78%,.8)`;
    ctx.fillRect(px,172+Math.sin(p)*3,2,1);
    ctx.globalAlpha=.3;ctx.fillRect(px,180+Math.cos(p)*3,2,1);ctx.globalAlpha=1;}
  if(trajectory){for(const p of sim.trail){ctx.fillStyle=`hsla(${(p.phase??0)/TAU*360},75%,78%,.8)`;
    ctx.fillRect(53+(p.x-camera)*11,172-p.y*24,2,2);}}
  for(const o of sim.observations){const ox=53+(o.x-camera)*11;if(ox<53||ox>475)continue;
    ctx.strokeStyle=o.outcome==='+'?'#aeefdf':'#f1b9d8';ctx.strokeRect(ox-6,162,12,6);
    ctx.fillStyle=ctx.strokeStyle;ctx.font='5px monospace';ctx.fillText(o.outcome,ox-2,167);}
  if(!sim.done){
    const offset=reducedMotion?5:5+Math.sin(phase)*2;
    for(const side of [-1,1]){ctx.globalAlpha=.28;drawStone(ctx,stone,x+side*4,y+side*offset,.27);}
    ctx.globalAlpha=1;ctx.strokeStyle=`hsl(${phase/TAU*360},75%,78%)`;
    ctx.beginPath();ctx.arc(x,y,8,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(phase)*8,y-Math.sin(phase)*8);ctx.stroke();
  }
  // Keep essential phase readout even when decorative animation is reduced.
  if(!compact){ctx.translate(0,48);ctx.fillStyle='#223a49e8';ctx.fillRect(302,13,166,48);
  ctx.strokeStyle='#9ad9d1';ctx.strokeRect(302,13,166,48);
  ctx.beginPath();ctx.arc(323,36,13,0,TAU);ctx.stroke();
  ctx.strokeStyle=`hsl(${phase/TAU*360},80%,80%)`;ctx.beginPath();ctx.moveTo(323,36);ctx.lineTo(323+12*Math.cos(phase),36-12*Math.sin(phase));ctx.stroke();
  ctx.fillStyle='#eff6d9';ctx.font='7px monospace';ctx.fillText(`PHASE ${Math.round(phase/TAU*360)}°`,344,29);
  ctx.font='6px monospace';ctx.fillText(`OBS ${sim.observations.length}  ${sim.observations.at(-1)?.outcome||'SUPERPOSED'}`,344,41);
  ctx.fillStyle='#a8cbc9';ctx.fillText(`FLIGHT +${(sim.flightPhase/TAU).toFixed(2)} TURNS`,344,52);}ctx.restore();
}
