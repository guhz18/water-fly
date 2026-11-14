// A planform is 32 bounded radial samples, not an icon/category multiplier.
// Shared by collision integration, inheritance, sculpting and silhouette rendering.
export const OUTLINE_SAMPLES=32;
export const OUTLINE_NAMES={round:'圆片',oval:'长椭圆',triangle:'三角片',square:'圆角方片',leaf:'叶形',rough:'天然缺口',ring:'环形',hybrid:'遗传融合',sculpted:'精雕轮廓'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const TAU=Math.PI*2;
const kinds={pebble:'oval',round:'round',flat:'oval',glass:'triangle',toast:'square',crystal:'triangle',key:'square',shell:'leaf',disk:'square',leaf:'leaf',soap:'oval',meteor:'rough',nut:'ring',duck:'leaf',npc:'rough',chip:'square',cap:'round',cookie:'round',potato:'oval'};
const genes={round:'AT',oval:'TA',triangle:'GC',square:'CG',leaf:'TA',rough:'GC',ring:'CG',hybrid:'AT',sculpted:'CG'};
export const OUTLINE_ALLELES={AT:'round',TA:'oval',GC:'triangle',CG:'square'};
export function makeOutline(family='round'){
 if(!OUTLINE_NAMES[family])family='round';
 const radii=Array.from({length:OUTLINE_SAMPLES},(_,i)=>{
  const a=i*TAU/OUTLINE_SAMPLES,c=Math.cos(a),s=Math.sin(a);
  if(family==='oval')return 1/Math.sqrt(c*c+s*s/.72**2);
  if(family==='triangle'){const sector=((a+Math.PI/3)%(TAU/3))-Math.PI/3;return .5/Math.cos(sector);}
  if(family==='square')return .84/(c**4+s**4)**.25;
  if(family==='leaf')return (1-.23*Math.cos(a))/(1.23*Math.sqrt(c*c+s*s/.76**2));
  if(family==='rough')return .84+.11*Math.cos(a*3+.7)+.05*Math.sin(a*7);
  return 1;
 });
 return {family,radii,hole:family==='ring'?.35:0};
}
export function outlineOf(stone={}){
 const o=stone.outline,fallback=makeOutline(kinds[stone.kind]||'round');
 if(!o||!Array.isArray(o.radii)||o.radii.length!==OUTLINE_SAMPLES||!o.radii.every(Number.isFinite))return fallback;
 const radii=o.radii.map(v=>clamp(v,.18,1));
 return {family:OUTLINE_NAMES[o.family]?o.family:'sculpted',radii,hole:Number.isFinite(o.hole)?clamp(o.hole,0,Math.min(.48,Math.min(...radii)*.7)):0};
}
export function outlineGeneOf(stone){return ['AT','TA','GC','CG'].includes(stone.outlineGene)?stone.outlineGene:genes[outlineOf(stone).family]||'AT';}
export function inheritOutline(a,b,edit,random=Math.random){
 return inheritFamilyOutline([a,b],edit,random);
}

export function inheritFamilyOutline(parents,edit,random=Math.random) {
 const count=parents.length;
 const source=Math.floor(random()*count);
 const inherited=outlineGeneOf(parents[source]);
 const gene=Object.hasOwn(OUTLINE_ALLELES,edit)?edit:inherited;
 const shapes=parents.map(outlineOf);
 const order=parents.map((_,i)=>i);
 for(let i=count-1;i>0;i--){
   const j=Math.floor(random()*(i+1));
   [order[i],order[j]]=[order[j],order[i]];
 }
 // Allocate at least four contiguous radial samples to each contributor.
 // Extra samples give siblings different arcs even with the same contributors.
 const lengths=Array(count).fill(4);
 for(let i=4*count;i<OUTLINE_SAMPLES;i++)lengths[Math.floor(random()*count)]++;
 const sectors=Array(OUTLINE_SAMPLES);
 let pos=Math.floor(random()*OUTLINE_SAMPLES);
 for(const index of order){
   for(let j=0;j<lengths[index];j++)sectors[pos++%OUTLINE_SAMPLES]=index;
 }
 const target=gene!==inherited?makeOutline(OUTLINE_ALLELES[gene]):null;
 const radii=sectors.map((donor,i)=>{
   const previous=sectors[(i+OUTLINE_SAMPLES-1)%OUTLINE_SAMPLES];
   const next=sectors[(i+1)%OUTLINE_SAMPLES];
   // Feather just the two rays touching a seam. The interior keeps notches.
   let edge=shapes[donor].radii[i];
   if(previous!==donor)edge += .2*(shapes[previous].radii[i]-shapes[donor].radii[i]);
   if(next!==donor)edge += .2*(shapes[next].radii[i]-shapes[donor].radii[i]);
   return target ? .7*edge+.3*target.radii[i] : edge;
 });
 const openArea=shapes.reduce((sum,s,i)=>sum+s.hole**2*lengths[i]/OUTLINE_SAMPLES,0);
 const hole=Math.min(Math.min(...radii)*.7,Math.sqrt(openArea)*(target ? .7 : 1));
 return {outline:{family:'hybrid',radii,hole},outlineGene:gene,
   inheritance:{source,inherited,gene,edited:gene!==inherited,sectors}};
}
export function chipOutline(stone,random=Math.random){const o=outlineOf(stone),center=Math.floor(random()*OUTLINE_SAMPLES),depth=.08+random()*.22;
 return {...o,family:'rough',radii:o.radii.map((v,i)=>{const d=Math.min(Math.abs(i-center),OUTLINE_SAMPLES-Math.abs(i-center));return Math.max(.18,v-depth*Math.exp(-d*d/5));})};}
export function polishOutline(stone){const o=outlineOf(stone);return {...o,family:'sculpted',radii:o.radii.map((v,i)=>Math.max(.18,Math.min(v,(o.radii[(i+31)%32]+2*v+o.radii[(i+1)%32])/4)))};}
export function cutOutline(stone,family){const o=outlineOf(stone),target=makeOutline(family);return {family:'sculpted',radii:o.radii.map((v,i)=>Math.min(v,target.radii[i])),hole:o.hole};}

function metrics(points){let twice=0,cx=0,cy=0,polar=0,perimeter=0;
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],cross=a[0]*b[1]-b[0]*a[1];twice+=cross;cx+=(a[0]+b[0])*cross;cy+=(a[1]+b[1])*cross;polar+=cross*(a[0]**2+a[0]*b[0]+b[0]**2+a[1]**2+a[1]*b[1]+b[1]**2);perimeter+=Math.hypot(a[0]-b[0],a[1]-b[1]);}
 const area=twice/2;return {area,cx:cx/(3*twice),cy:cy/(3*twice),polar:polar/(12*area),perimeter};
}
export function buildProfile(stone){
 const outline=outlineOf(stone),raw=outline.radii.map((r,i)=>[r*Math.cos(i*TAU/32),r*Math.sin(i*TAU/32)]),m=metrics(raw);
 // Center on the centroid of the material, including the central opening.
 const inner=outline.hole?Array.from({length:32},(_,i)=>[outline.hole*Math.cos(i*TAU/32),outline.hole*Math.sin(i*TAU/32)]):[];
 const im=inner.length?metrics(inner):{area:0,polar:0,perimeter:0};
 const area=m.area-im.area,cx=m.cx*m.area/area,cy=m.cy*m.area/area;
 const points=raw.map(([x,y])=>[x-cx,y-cy]),hole=inner.map(([x,y])=>[x-cx,y-cy]);
 return {outline,points,hole,area,perimeter:m.perimeter+im.perimeter,
  circularity:clamp(4*Math.PI*area/m.perimeter**2,.2,1),
  polarMoment:(m.polar*m.area-im.polar*im.area)/area-cx*cx-cy*cy,
  maxRadius:Math.max(...points.map(p=>Math.hypot(...p)))};
}
// Clip a rotating polygon against the submerged half-plane x <= cut.
// A shoelace integral of the clipped boundary gives wet area and its centroid.
function clipped(points,c,s,cut){
 if(!points.length)return {area:0,moment:0};
 let twice=0,moment=0,firstX,firstY,lastX,lastY;
 const emit=(x,y)=>{if(firstX===undefined){firstX=x;firstY=y;}else{const cross=lastX*y-x*lastY;twice+=cross;moment+=(lastX+x)*cross;}lastX=x;lastY=y;};
 let prev=points.at(-1),px=prev[0]*c-prev[1]*s,py=prev[0]*s+prev[1]*c;
 for(const p of points){const x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c,inside=x<=cut,prior=px<=cut;
  if(inside!==prior){const t=(cut-px)/(x-px);emit(cut,py+(y-py)*t);}if(inside)emit(x,y);px=x;py=y;
 }
 if(firstX===undefined)return {area:0,moment:0};
 const cross=lastX*firstY-firstX*lastY;twice+=cross;moment+=(lastX+firstX)*cross;
 return {area:Math.max(0,twice/2),moment:moment/6};
}
export function wetGeometry(profile,rotation,cut){
 const c=Math.cos(rotation),s=Math.sin(rotation);let min=Infinity,max=-Infinity;
 for(const p of profile.points){const x=p[0]*c-p[1]*s;min=Math.min(min,x);max=Math.max(max,x);}
 const outer=clipped(profile.points,c,s,cut),inner=clipped(profile.hole,c,s,cut),area=clamp(outer.area-inner.area,0,profile.area);
 return {area,fraction:area/profile.area,center:area>1e-10?(outer.moment-inner.moment)/area:0,min,max};
}
export function outlineLabel(stone){const p=buildProfile(stone);return `${OUTLINE_NAMES[p.outline.family]} · 面积 ${(p.area*stone.radius**2*1e4).toFixed(1)} cm² · 圆度 ${Math.round(p.circularity*100)}%`;}
export function drawOutline(c,stone,x,y,size=26,rotation=0,flatten=1){
 const p=buildProfile(stone);c.save();c.translate(x,y);c.scale(size,size*flatten);c.rotate(rotation);
 const path=points=>{points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
 c.beginPath();path(p.points);if(p.hole.length)path(p.hole);c.fillStyle=stone.color||'#94ac86';c.fill('evenodd');c.strokeStyle='#4b695f';c.lineWidth=1.5/size;c.stroke();
 c.clip('evenodd');
 if(stone.surface && size>=9)drawSurface(c,stone.surface);
 c.globalAlpha=.45;c.beginPath();c.moveTo(-.32,-.25);c.lineTo(.12,-.25);c.strokeStyle='#f5f1ce';c.lineWidth=2/size;c.stroke();c.restore();
}

function drawSurface(c,surface){
 const {pattern,grain,glaze}=surface;
 c.fillStyle='#365552';
 c.globalAlpha=.18+.23*grain;
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   const x=-.94+col*.46+(row%2)*.13,y=-.83+row*.43;
   if(pattern==='grid'){
     c.fillRect(x,y,.19,.045);c.fillRect(x,y,.045,.16);
   }else if(pattern==='crumb' || pattern==='spark'){
     const side=.044+.09*grain;
     c.fillRect(x,y,side,side);
     if(pattern==='spark'){c.fillRect(x-.055,y+.03,.16,.035);}
   }else {
     c.fillRect(x,y,.18,.045);c.fillRect(x+.18,y-.04,.11,.045);
     if(pattern==='waves')c.fillRect(x+.28,y,.12,.045);
   }
 }
 c.fillStyle='#fff2c8';c.globalAlpha=.15+glaze*.55;
 c.fillRect(-.48,-.39,.23+.3*glaze,.065);
 c.fillRect(.14,.28,.08+.18*glaze,.055);
}
