import {drawStone} from './art.js';
const themes={smash:['#646a4d','#cbd096','手动塑形台'],home:['#9a755c','#edc896','河边的小工作室'],factory:['#506c70','#a4ddc8','精密减材车间'],fluid:['#46687b','#9cdef0','三变量循环水槽'],quantum:['#514a79','#d8b2f3','相干态制备舱'],bio:['#496e60','#c0e3b3','泛生物温室'],time:['#7e6455','#f3d99c','地质时间中转站'],future:['#425f78','#9fd9f0','并行材料机房']};
export const STAGE_LINES={smash:['瞄准棱角','轻敲裂面','收集小脾气'],home:['铺好砂纸','慢慢去毛刺','把手感磨圆'],factory:['夹紧工件','数控减材','检测公差'],fluid:['校准水槽','联合搜索姿态','复核最佳组合'],quantum:['隔离噪声','制备叠加态','装好相位罗盘'],bio:['读取双亲','配对碱基','欢迎小石头'],time:['定位出生年代','改写形成条件','签收新历史'],future:['分发候选','并行水漂模拟','收敛最佳解']};
export function workshopMarkup(id){return `<div class="workshop-scene"><canvas id="workshopScene" data-scene="${id}" width="960" height="300" aria-label="${themes[id][2]}像素场景"></canvas><div class="stage-caption"><span class="stage-light"></span><b id="stageLabel">${themes[id][2]} · 等你开工</b><small>STONE WORKS / 08</small></div></div>`;}
export function drawWorkshop(canvas,stone,time,busy,reducedMotion=false,parent=null){
  if(!canvas||!stone)return;
  const c=canvas.getContext('2d'),id=canvas.dataset.scene,[dark,light]=themes[id];
  const t=reducedMotion?0:time,work=busy?1:0;
  c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=false;
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
  r(0,0,480,150,dark);r(0,100,480,50,'#293e42');
  for(let x=0;x<480;x+=24){r(x,105,1,45,'#3e5454');r(x,124,24,1,'#3e5454');}
  r(14,14,98,65,'#293e42');r(18,18,90,57,light);
  for(let j=0;j<8;j++){r(22+j*10,30+(j%3)*6,5,2,dark);r(22+j*10,55-Math.sin(t*2+j)*6,5,2,dark);}
  r(128,14,216,5,light);r(128,19,3,75,'#9ba8a1');r(341,19,3,75,'#9ba8a1');
  r(170,99,135,9,light);r(180,108,7,31,dark);r(289,108,7,31,dark);
  // Instruments, drawers and tiny resident technician.
  r(367,42,88,72,'#22383c');r(372,48,78,26,light);r(376,51,70,20,dark);
  c.font='7px monospace';c.fillStyle=light;c.fillText(busy?'PROCESSING':'READY / HI',378,64);
  for(let i=0;i<4;i++){r(376+i*17,83,9,5,(Math.floor(t*3)+i)%3===0?light:'#617c79');r(376+i*17,96,9,3,'#617c79');}
  r(56,102,19,17,'#eee0b2');r(59,98,13,6,light);r(59,108,2,3,dark);r(69,108,2,3,dark);r(61,116,9,2,dark);r(58,119,15,12,light);r(58,131,5,7,'#afbdac');r(68,131,5,7,'#afbdac');
  const bob=work*Math.sin(t*4)*2;
  if(id==='smash'||id==='home'){
    r(150,64,23,35,'#b0946c');r(153,67,17,3,light);
    const toolY=id==='smash'?40+Math.max(0,Math.sin(t*8))*34*work:80;
    r(249+(id==='home'?Math.sin(t*14)*12*work:0),toolY,4,32,'#beaa7d');
    r(237+(id==='home'?Math.sin(t*14)*12*work:0),toolY,27,id==='home'?6:12,id==='home'?'#dbb281':'#a5b9b0');
    if(busy)for(let i=0;i<10;i++)r(220+Math.sin(t*8+i)*24,90-((t*21+i*7)%20),2,2,light);
  }else if(id==='factory'){
    r(195,24,85,13,'#8ca69b');r(232,37,7,28+work*Math.sin(t*8)*8,light);
    r(197,87,14,11,'#839d94');r(268,87,14,11,'#839d94');
    if(busy)for(let i=0;i<6;i++)r(238+Math.sin(t*13+i)*25,76+i*3,2,1,'#f7dca0');
  }else if(id==='fluid'){
    r(145,67,184,28,'#8cc9d1');r(149,70,176,22,'#477f94');
    for(let x=150;x<320;x+=6)r(x,77+Math.sin(x*.11-t*4)*3,4,1,light);
    c.fillStyle=light;c.fillText('PITCH / TILT / SPIN',166,48);
    if(busy)for(let i=0;i<4;i++)r(155+(t*65+i*40)%165,86,3,2,'#d7eee7');
  }else if(id==='quantum'||id==='time'){
    c.strokeStyle=light;c.lineWidth=2;
    for(let i=0;i<3;i++){c.beginPath();c.ellipse(237,64,47-i*10,35,Math.sin(t+i)*.6,0,Math.PI*2);c.stroke();}
    for(let i=0;i<6;i++){const a=t*(busy?3:1)+i*Math.PI/3;r(237+Math.cos(a)*47,64+Math.sin(a)*35,3,3,light);}
    if(id==='time'){c.fillStyle=light;c.fillText('4,600,000,000 BC',186,129);}
  }else if(id==='bio'){
    for(let j=0;j<12;j++){const y=28+j*5,a=t*2+j*.6,x=237+Math.sin(a)*26,x2=237-Math.sin(a)*26;r(Math.min(x,x2),y,Math.abs(x-x2)+1,1,'#779f91');r(x,y,4,3,light);r(x2,y,4,3,'#e8bfc3');}
    drawStone(c,stone,169,88,.4);if(parent)drawStone(c,parent,307,88,.4);
  }else if(id==='future'){
    for(let i=0;i<12;i++){const x=156+(i%4)*42,y=29+Math.floor(i/4)*20;r(x,y,33,16,'#243f4e');r(x+3,y+3,27,2,light);r(x+4,y+9,3,3,(Math.floor(t*5)+i)%4?'#567c8b':light);}
  }
  drawStone(c,stone,237,93+bob,id==='bio'?.38:.65,true);
  if(busy&&!reducedMotion){c.globalAlpha=.15;r(140,24+(t*38)%70,193,3,light);c.globalAlpha=1;}
}
