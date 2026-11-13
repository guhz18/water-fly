import {buildProfile,wetGeometry} from './outline.js';
// SI units. Reduced planing model, not a full free-surface Navier–Stokes solver.
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class Water {
 constructor({wave=.012,wind=.2,current=.08}={}){this.n=512;this.dx=.35;this.depth=1.2;this.eta=new Float64Array(this.n);this.u=new Float64Array(this.n+1);this.wave=wave;this.wind=wind;this.current=current;this.time=0;for(let i=0;i<this.n;i++)this.eta[i]=wave*(Math.sin(i*.13)+.4*Math.sin(i*.31));}
 step(dt){this.time+=dt;const {n,dx,eta,u}=this;for(let i=1;i<n;i++){u[i]+=-9.81*(eta[i]-eta[i-1])/dx*dt;u[i]*=Math.exp(-.045*dt);}for(let i=0;i<n;i++){eta[i]+=-this.depth*(u[i+1]-u[i])/dx*dt;const edge=Math.min(i,n-1-i);if(edge<25){const damping=Math.exp(-dt*3*(1-edge/25)**2);eta[i]*=damping;u[i]*=damping;}}eta[0]=this.wave*.7*Math.sin(this.time*2.2);u[0]=this.wave*2*Math.sin(this.time*2.2);u[n]=0;}
 sample(x){const f=clamp(x/this.dx,1,this.n-3),i=Math.floor(f),t=f-i;return {height:this.eta[i]*(1-t)+this.eta[i+1]*t,slope:(this.eta[i+1]-this.eta[i])/this.dx,velocity:this.current+this.u[i]};}
 impulse(x,amount){const i=Math.round(x/this.dx);for(let k=-3;k<=3;k++){const j=i+k;if(j>0&&j<this.n-1)this.u[j]+=Math.sign(k)*amount*Math.exp(-k*k/3)*.015;}}
}
export class SkipSimulation {
 constructor(stone,params={},environment={}){this.stone={...stone};this.profile=buildProfile(stone);this.rotation=0;this.wetArea=0;this.lift=0;this.drag=0;this.pressureCenter=0;this.water=new Water(environment);this.dt=1/240;this.accumulator=0;this.time=0;this.x=1.5;this.y=.48;const speed=params.speed??13;const pitch=(params.pitch??-8)*Math.PI/180;this.vx=speed*Math.cos(pitch);this.vy=speed*Math.sin(pitch);this.tilt=(params.tilt??20)*Math.PI/180;this.spin=params.spin??35;this.skips=0;this.contacts=[];this.contact=false;this.contactTime=0;this.done=false;this.reason='';this.trail=[];this.maxHeight=.48;this.onSkip=null;this.onContact=null;this.planingLift=1;this.planingDrag=1;this.inputSpeed=speed;this.initialEnergy=.5*stone.mass*speed**2+stone.mass*9.81*this.y;this.energy=this.initialEnergy;}
 advance(elapsed){this.accumulator+=Math.min(elapsed,.1);while(this.accumulator>=this.dt&&!this.done){this.step(this.dt);this.accumulator-=this.dt;}return !this.done;}
 step(dt){this.water.step(dt);for(let s=0;s<4&&!this.done;s++)this.integrate(dt/4);this.time+=dt;if(this.time>24||this.x>172)this.finish('这一漂，已经足够远了。');if(Math.round(this.time/dt)%6===0){this.trail.push({x:this.x,y:this.y,phase:this.phase});if(this.trail.length>180)this.trail.shift();}}
 integrate(dt){
  const stone=this.stone,m=stone.mass,r=stone.radius,w=this.water.sample(this.x),profile=this.profile;
  const stability=clamp(this.spin/24*(profile.polarMoment/.5),0,1);
  const wobble=Math.sin(this.time*(13+this.spin*.2))*(1-stability)*(.16+.12*(1-profile.circularity))+(1-stone.flatness)*.07;
  const alpha=clamp(this.tilt+wobble-Math.atan(w.slope),.035,1.25),sina=Math.sin(alpha);
  const cut=(w.height-this.y+stone.thickness*.5)/(r*sina);
  const geometry=wetGeometry(profile,this.rotation,cut),wet=geometry.fraction;
  const penetration=w.height-(this.y+geometry.min*r*sina-stone.thickness*.5);
  const relativeV=this.vx-w.velocity,speed2=relativeV**2+this.vy**2,fullArea=profile.area*r*r;
  let ax=-.5*1.225*.5*(fullArea*.2)*speed2*Math.sign(this.vx)/m+this.water.wind*.018,ay=-9.81;
  this.wetArea=geometry.area*r*r;this.pressureCenter=geometry.center*r;this.lift=0;this.drag=0;
  if(wet>1e-6){
   if(!this.contact){this.contact=true;this.contactTime=0;this.entrySpeed=Math.hypot(this.vx,this.vy);this.entryVy=this.vy;
    const contact={x:this.x,time:this.time,success:false,rotation:this.rotation,entrySpeed:this.entrySpeed,peakWetArea:0,peakLift:0};
    this.contacts.push(contact);this.onContact?.(contact);
   }
   this.contactTime+=dt;
   const cl=.36*Math.sin(2*alpha)*(.45+.55*stone.flatness)*(.7+.3*stability)*(.84+.16*profile.circularity);
   const cd=.018+.09*sina**2+(1-stone.smoothness)*.032+(1-profile.circularity)*.025+profile.outline.hole*.025;
   const pressure=.5*1000*speed2*this.wetArea;
   this.lift=pressure*cl*this.planingLift;this.drag=pressure*cd*this.planingDrag;
   ax+=(-this.drag*Math.sign(relativeV)-this.lift*sina*.16)/m;
   ay+=this.lift*Math.cos(alpha)/m+9.81*wet*Math.min(.75,1000*fullArea*stone.thickness/m);
   this.spin*=Math.exp(-dt*(.5+3*(1-stone.smoothness)+(1-profile.circularity)*1.5));
   const contact=this.contacts.at(-1);contact.peakWetArea=Math.max(contact.peakWetArea,this.wetArea);contact.peakLift=Math.max(contact.peakLift,this.lift);
   if(wet>.98&&this.y<w.height-r*.8&&this.vy<0)this.finish('入水太深，石头决定去看鱼了。');
   if(this.contactTime>.25||relativeV<1.5)this.finish('速度用完了，水面接住了它。');
  }else if(this.contact){
   this.contact=false;
   if(this.vy>0){const maxSpeed=this.entrySpeed*.985,now=Math.hypot(this.vx,this.vy);if(now>maxSpeed){this.vx*=maxSpeed/now;this.vy*=maxSpeed/now;}
    this.skips++;this.contacts.at(-1).success=true;
    this.water.impulse(this.x,Math.min(6,Math.abs(this.entryVy)*m*15));this.onSkip?.({x:this.x,skips:this.skips,speed:this.vx});
   }
   this.contactTime=0;
  }
  this.vx+=ax*dt;this.vy+=ay*dt;this.x+=this.vx*dt;this.y+=this.vy*dt;
  this.rotation=(this.rotation+this.spin*2*Math.PI*dt)%(Math.PI*2);this.spin*=Math.exp(-.025*dt);
  this.maxHeight=Math.max(this.maxHeight,this.y);this.energy=.5*m*(this.vx**2+this.vy**2)+m*9.81*this.y;
  if(!Number.isFinite(this.energy)||this.y<-.8||this.vx<.15)this.finish('扑通。也是一种圆满。');
 }
 finish(reason){this.done=true;this.reason=reason;this.distance=Math.max(0,this.x-1.5);}
 result(){return {skips:this.skips,distance:+(this.x-1.5).toFixed(1),duration:+this.time.toFixed(2),speed:+Math.hypot(this.vx,this.vy).toFixed(1),reason:this.reason};}
}
export function evaluateStone(stone,params={}){const sim=new SkipSimulation(stone,{speed:13,pitch:-8,tilt:20,spin:35,...params},{wave:0,wind:0,current:0});while(!sim.done)sim.step(1/240);const result=sim.result();return {...result,score:result.skips*4+result.distance};}
