// Playback consumes wall time against fixed simulation steps. Changing speed
// never changes the integrator dt, the contact count, or the awarded result.
import {drawOutline} from './outline.js';
export const PLAYBACK_SPEEDS=[1,.5,.25,.1];
export class ImpactDirector {
 constructor(){this.reset();}
 reset(){this.wallBudget=0;this.shots=[];this.lastImpact=-Infinity;this.zoom=1;this.focus=null;this.rate=1;}
 impact(contact,sim){this.lastImpact=sim.time;this.shots.push({index:sim.contacts.length,x:contact.x,time:sim.time});}
 isClose(sim){
  if(!sim)return false;
  if(sim.contact||sim.time-this.lastImpact<.105)return true;
  const height=sim.water.sample(sim.x).height,clearance=sim.y-sim.stone.radius*sim.profile.maxRadius*Math.sin(sim.tilt)-sim.stone.thickness/2-height;
  return sim.vy<-.03&&clearance/Math.max(.1,-sim.vy)<.115;
 }
 speed(sim,{speed=1,follow=false}={}){return follow&&this.isClose(sim)?Math.min(speed,sim.contact?.08:.18):speed;}
 advance(sim,elapsed,options={},onRate=()=>{}){
  this.wallBudget+=Math.min(.1,Math.max(0,elapsed));
  while(!sim.done){
   const rate=this.speed(sim,options),cost=sim.dt/rate;
   this.rate=rate;onRate(rate);
   if(this.wallBudget+1e-12<cost)break;
   this.wallBudget=Math.max(0,this.wallBudget-cost);sim.step(sim.dt);
  }
 }
 updateView(sim,dt,{follow=false,reducedMotion=false}={}){
  const active=follow&&this.isClose(sim),target=active?3.6:follow&&sim&&!sim.done?1.8:1;
  this.zoom=reducedMotion?1:this.zoom+(target-this.zoom)*(1-Math.exp(-dt*15));
  if(Math.abs(this.zoom-1)<.005)this.zoom=1;
  this.focus=sim?{x:sim.x,y:Math.max(0,sim.y)}:null;
  return active;
 }
}

export function drawImpactHUD(c,sim,director,compact=false){
 if(!sim||director.zoom<1.15)return;
 const w=compact?146:198,x=(480-w)/2;
 c.save();c.fillStyle='#183d42ec';c.fillRect(x,194,w,30);c.strokeStyle='#b9d9bd';c.strokeRect(x,194,w,30);
 c.fillStyle='#edf0cb';c.font='7px monospace';c.textAlign='center';
 drawOutline(c,sim.stone,x+15,210,10,sim.rotation);c.fillText(`IMPACT ${String(sim.contacts.length||1).padStart(2,'0')} / ${director.rate.toFixed(2)}x`,250,205);
 c.fillStyle='#b9d9bd';c.font='6px monospace';
 c.fillText(`WET ${(sim.wetArea*1e4).toFixed(1)} cm2  LIFT ${sim.lift.toFixed(1)} N`,250,217);c.restore();
}

export function settleThrow(state,result,stoneUid,mapName,replay=false){
 if(replay)return {reward:0,isRecord:false};
 const isRecord=result.skips>state.best,reward=8+result.skips*5+Math.floor(result.distance/4);
 state.best=Math.max(state.best,result.skips);state.bestDistance=Math.max(state.bestDistance||0,result.distance);state.totalThrows++;state.credits+=reward;
 const stone=state.stones.find(s=>s.uid===stoneUid);if(stone)stone.best=Math.max(stone.best||0,result.skips);
 state.history.unshift({...result,map:mapName,stone:stone?.name||'石头'});state.history=state.history.slice(0,20);
 return {reward,isRecord};
}
