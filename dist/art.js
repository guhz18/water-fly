import {MAPS} from './data.js';
const canv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
function pine(c,x,y,s,color){rect(c,x-1*s,y-29*s,2*s,30*s,'#6c7e59');for(let j=0;j<4;j++)poly(c,[[x,y-(41-j*7)*s],[x-(6+j*2)*s,y-(22-j*5)*s],[x+(6+j*2)*s,y-(22-j*5)*s]],color);}
function tree(c,x,y,s,r,map){rect(c,x-2*s,y-30*s,5*s,32*s,'#6f7950');rect(c,x,y-20*s,2*s,22*s,'#9c9869');const colors=[map.dark,'#668858','#78995e','#87a96b'];for(let j=0;j<28;j++){const dx=(r()-.5)*27*s,dy=(r()-.5)*25*s;const size=(5+r()*8)*s;rect(c,x+dx-size/2,y-38*s+dy,size,size*.8,colors[Math.floor(r()*colors.length)]);}}
function grass(c,x,y,color,size=1){rect(c,x,y-3*size,size,4*size,color);rect(c,x-2*size,y-2*size,size,2*size,color);rect(c,x+2*size,y-4*size,size,3*size,color);}
function house(c,x,y,r,map,urban=false){const w=urban?20:24,h=urban?23:13;rect(c,x,y-h,w,h,urban?'#bbc4af':'#dfd2a3');rect(c,x+w-6,y-h+3,3,h-3,'#9da785');poly(c,[[x-3,y-h],[x+w/2,y-h-12],[x+w+3,y-h]],urban?'#82938a':'#7b8b64');rect(c,x+4,y-9,5,9,'#6c8068');rect(c,x+13,y-10,6,5,'#8ba58b');rect(c,x+14,y-9,2,3,'#dfddb0');rect(c,x+17,y-h-10,3,7,'#8f9780');}
export function makeLandscape(map,mode='explore'){
 const canvas=canv(480,235),c=canvas.getContext('2d');const r=rng(417+MAPS.indexOf(map)*777);c.imageSmoothingEnabled=false;rect(c,0,0,480,235,map.sky);
 // Layered flat-color pixel scenery; all geometry snapped to a low-resolution grid.
 rect(c,0,40,480,32,map.id==='coast'?'#ead5b2':'#d2ddaf');
 for(let j=0;j<8;j++){let x=r()*480,y=12+r()*42;for(let k=0;k<5;k++)rect(c,x+k*9,y+(r()*4|0),12+r()*10,2+r()*3,'#f2efd0');}
 if(map.id==='coast'){rect(c,322,33,28,23,'#f1ddaf');rect(c,327,29,18,31,'#f1ddaf');}else{rect(c,341,22,17,18,'#edf0cb');rect(c,344,19,11,24,'#edf0cb');}
 for(let layer=0;layer<3;layer++){let pts=[[0,102]];for(let x=0;x<=490;x+=7){const y=82-layer*5-14*Math.sin(x*.013+layer*2)-8*Math.sin(x*.029+layer*4)+(r()-.5)*4;pts.push([x,y]);}pts.push([480,114],[0,114]);poly(c,pts,[map.mount,map.id==='coast'?'#b7b5a0':'#82a68b',map.id==='coast'?'#a6ac8c':'#719b7c'][layer]);}
 for(let j=0;j<90;j++){const x=j*6+(r()-.5)*3;pine(c,x,112+r()*3,.25+r()*.28,map.id==='coast'?'#82967c':'#648c70');}
 if(map.id==='canal'){for(let x=10;x<475;x+=29)house(c,x,110,r,map,true);rect(c,0,112,480,5,'#99a38b');rect(c,0,115,480,2,'#bdbaa0');}
 else if(map.id==='dock'){for(let j=0;j<3;j++){rect(c,330+j*27,76+j*4,29,37-j*4,'#a3aa8f');rect(c,335+j*27,67+j*4,5,12,'#828e7d');for(let k=0;k<3;k++)rect(c,334+j*27+k*7,86+j*4,4,8,'#748f7e');}rect(c,292,54,3,59,'#84907a');rect(c,267,55,42,3,'#84907a');rect(c,268,55,1,23,'#84907a');}
 else{house(c,76,112,r,map);house(c,108,113,r,map);for(let j=0;j<17;j++)tree(c,45+j*3,117,.4,r,map);}
 rect(c,0,117,480,118,map.water);rect(c,0,148,480,87,map.deep);
 // Reflections fragment into horizontal bands.
 for(let j=0;j<230;j++){const x=r()*480,y=119+r()*77,w=2+r()*19;c.globalAlpha=.12+r()*.15;rect(c,x,y,w,r()>.8?2:1,j%3===0?'#f1e9bf':j%3===1?map.sky:'#2e7f7b');}c.globalAlpha=1;
 for(let j=0;j<24;j++)rect(c,325+(r()-.5)*(j+16),118+j*2,3+r()*13,1,'#c4d7b1');
 // Far-bank rocks and quiet little landing.
 rect(c,142,118,37,3,'#a5ad86');for(let x=144;x<179;x+=6)rect(c,x,119,1,3,'#767e60');rect(c,146,120,2,8,'#737b5a');rect(c,174,120,2,7,'#737b5a');
 if(mode==='explore'){
  const shore=[];for(let x=0;x<=490;x+=5)shore.push([x,157+10*Math.sin(x*.012+1)+5*Math.sin(x*.037)]);
  poly(c,[...shore,[480,235],[0,235]],map.sand);poly(c,[...shore.map(([x,y])=>[x,y+7]),[480,235],[0,235]],'#b3bd86');poly(c,[...shore.map(([x,y])=>[x,y+13]),[480,235],[0,235]],map.grass);
  for(let j=0;j<480;j++){const x=r()*480,y=177+r()*58;const color=j%4===0?'#c3cb90':j%4===1?'#6f955c':map.grass;rect(c,x,y,1+r()*4,1,color);}
  // A wandering sand path.
  poly(c,[[128,235],[145,213],[166,201],[203,195],[243,191],[279,185],[319,183],[346,183],[349,187],[319,188],[282,190],[245,197],[206,201],[170,207],[151,220],[145,235]],'#bbbe89');
  for(let j=0;j<140;j++){const x=r()*480;const shoreY=157+10*Math.sin(x*.012+1)+5*Math.sin(x*.037);if(j<90){const y=shoreY+2+r()*8;rect(c,x,y,2+r()*3,1,'#e1d4aa');}else grass(c,x,shoreY+11+r()*14,'#719159');}
  for(let j=0;j<12;j++){const x=24+r()*33,y=171+r()*8;rect(c,x,y-11-r()*12,1,24,'#6c8753');rect(c,x,y-22-r()*7,2,6,'#8e8c54');}
  for(let j=0;j<8;j++){const x=376+r()*22,y=157+r()*10;rect(c,x,y-8-r()*7,1,18,'#6f8c56');rect(c,x,y-17-r()*6,2,5,'#9b925d');}
  // Broad foreground trees frame the scene without hiding the playable shore.
  tree(c,7,192,1.8,r,map);tree(c,-7,234,2.2,r,map);tree(c,473,177,1.65,r,map);tree(c,485,226,1.7,r,map);
  for(let j=0;j<45;j++){const x=r()*480;grass(c,x,226+r()*9,'#638950',1+r());}
  // A tiny bench, a sign, flowers.
  rect(c,333,194,23,3,'#81875c');rect(c,334,188,22,4,'#a6a06b');rect(c,336,195,2,5,'#626e4a');rect(c,351,195,2,5,'#626e4a');rect(c,307,186,2,15,'#818363');rect(c,300,181,16,8,'#c2ba85');rect(c,303,183,10,1,'#8c9166');
  for(let j=0;j<38;j++){const x=35+r()*410,y=192+r()*35;if(r()>.5)grass(c,x,y,'#6b9456');rect(c,x,y-3,2,2,j%3===0?'#e4d58c':'#e7dfb5');}
 }else{poly(c,[[0,196],[32,195],[56,204],[78,216],[480,224],[480,235],[0,235]],map.sand);poly(c,[[0,202],[30,203],[47,215],[73,229],[480,235],[0,235]],map.grass);tree(c,-13,215,1.5,r,map);for(let j=0;j<30;j++)grass(c,r()*480,232+r()*3,'#7c985c');}
 return canvas;
}
export function drawStone(c,stone,x,y,scale=1,face=false){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);const col=stone.color||'#91a084';const shade='#667b64',light='#d5dbc0';rect(c,-11,6,22,3,'#4b62422b');
 switch(stone.kind){
 case 'toast':rect(c,-10,-9,20,15,'#9f774e');rect(c,-12,-8,24,7,'#a88050');rect(c,-9,-11,18,3,'#ae8351');rect(c,-8,-8,16,12,col);rect(c,-10,-7,20,5,col);rect(c,-6,-5,12,7,'#ead3a0');rect(c,-3,-3,2,2,'#d8b986');break;
 case 'key':rect(c,-10,-6,20,13,'#637b64');rect(c,-9,-9,18,13,col);rect(c,-6,-7,12,8,'#c6cfb1');c.fillStyle='#6b7e61';c.font='5px monospace';c.fillText('ESC',-5,-1);break;
 case 'disk':rect(c,-11,-11,22,21,'#5b6d72');rect(c,-10,-11,19,19,col);rect(c,-5,-11,12,8,'#c6ccbb');rect(c,2,-10,3,6,'#778d85');rect(c,-7,1,14,7,'#d0cbb1');rect(c,-5,3,10,1,'#9ea68c');break;
 case 'duck':rect(c,-10,-2,18,9,col);rect(c,-7,6,12,2,'#bd9f56');rect(c,3,-10,9,9,col);rect(c,10,-6,5,3,'#cc9253');rect(c,7,-8,2,2,'#485746');rect(c,-6,0,8,3,'#f0d891');rect(c,-13,-3,5,4,col);break;
 case 'chip':rect(c,-11,-10,22,20,'#718976');for(let a=-9;a<11;a+=4){rect(c,a,-13,2,3,'#b5b99d');rect(c,a,10,2,3,'#b5b99d');rect(c,-14,a,3,2,'#b5b99d');rect(c,11,a,3,2,'#b5b99d');}rect(c,-7,-7,14,14,col);rect(c,-5,-5,10,10,'#c9cbb4');break;
 case 'nut':poly(c,[[-7,-10],[7,-10],[12,-3],[12,4],[6,9],[-7,9],[-12,3],[-12,-3]],col);rect(c,-4,-4,8,8,'#687b68');rect(c,-2,-2,5,4,'#e7eadb');rect(c,-7,-8,12,2,'#c4b795');break;
 case 'shell':poly(c,[[-11,0],[-8,-7],[-3,-11],[4,-11],[10,-6],[12,1],[4,8],[-3,8]],col);for(let i=-7;i<=7;i+=4)poly(c,[[0,7],[i,-7],[i+1,-7]],'#ead2ad');break;
 case 'crystal':poly(c,[[-13,0],[-6,-9],[6,-12],[13,-1],[8,7],[-5,10]],col);poly(c,[[-6,-9],[6,-12],[3,1],[-5,10]],'#b9a6cd');poly(c,[[3,1],[13,-1],[8,7],[-5,10]],'#817698');rect(c,3,-6,2,4,'#e4d9e9');break;
 case 'leaf':poly(c,[[-14,0],[-8,-7],[3,-10],[13,-4],[11,5],[-1,9],[-12,5]],col);poly(c,[[-10,3],[10,-4],[0,4]],'#c0cc8d');rect(c,0,4,2,5,'#6e8c55');break;
 case 'cap':rect(c,-9,-8,18,16,col);rect(c,-12,-4,24,8,col);rect(c,-6,-6,12,12,'#d4d7c4');rect(c,-4,-2,8,4,'#8d9f8e');break;
 case 'cookie':poly(c,[[-12,-3],[-7,-10],[5,-10],[12,-3],[10,6],[2,10],[-7,7]],col);for(const [a,b]of[[-5,-4],[4,-5],[1,4],[-6,3],[7,1]])rect(c,a,b,3,2,'#8c7757');break;
 default:{let h=stone.kind==='flat'?5:stone.kind==='round'||stone.kind==='potato'?11:8;poly(c,[[-13,1],[-9,-h+3],[-3,-h],[7,-h+1],[13,-2],[14,3],[8,7],[-7,7]],shade);poly(c,[[-13,0],[-9,-h+2],[-3,-h],[7,-h+1],[13,-2],[10,3],[-9,4]],col);rect(c,-5,-h+2,8,2,light);if(stone.kind==='meteor'){rect(c,-7,-1,4,3,'#716e63');rect(c,4,-4,3,3,'#716e63');}if(stone.kind==='glass'){rect(c,-5,-6,2,6,'#c3e1cf');}if(stone.kind==='npc'||face){rect(c,-5,-2,2,3,'#3b5946');rect(c,4,-2,2,3,'#3b5946');rect(c,-1,3,3,1,'#4d6853');rect(c,-9,-8,4,3,'#74965d');}if(stone.kind==='potato'){rect(c,-5,0,2,2,'#998f6e');rect(c,5,1,2,2,'#998f6e');}}
 }if(stone.level>0){rect(c,12,-12,1,5,'#d4b463');rect(c,10,-10,5,1,'#d4b463');}c.restore();
}
export function stoneIcon(canvas,stone){if(!canvas)return;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;drawStone(c,stone,canvas.width/2,canvas.height/2+4,canvas.width/42);}
export function drawPlayer(c,x,y,time,moving=false,throwing=false){c.save();c.translate(Math.round(x),Math.round(y));const walk=moving?Math.sin(time*13)*2:0;rect(c,-6,2,14,3,'#45694740');rect(c,-4,-3+walk,3,7,'#495d53');rect(c,2,-3-walk,3,7,'#495d53');rect(c,-5,3+walk,4,2,'#596754');rect(c,2,3-walk,4,2,'#596754');rect(c,-6,-14,13,12,'#d7b878');rect(c,-5,-14,11,9,'#d7bc85');rect(c,-7,-12,3,8,'#8b9271');rect(c,-8,-10,4,6,'#72816a');rect(c,5,-12,3,7,'#e8cca0');rect(c,7,-7-(throwing?7:0),4,3,'#e7caa0');rect(c,-3,-22,10,10,'#e9cba0');rect(c,6,-20,2,6,'#ba9872');rect(c,3,-19,2,2,'#53624d');rect(c,-6,-25,14,6,'#c18c54');rect(c,-9,-21,21,3,'#e2b16b');rect(c,-4,-25,10,2,'#dcab64');rect(c,-4,-20,3,6,'#806b4a');c.restore();}
export function ambient(c,t,map,mode){
 c.save();for(let i=0;i<38;i++){const x=(i*79.7+t*(i%2?1:-1)*1.1)%480,y=121+(i*17.31)%49;rect(c,x,y,3+(i%4)*2,1,i%3===0?'#d1e0bc66':'#add2b052');}
 for(let i=0;i<3;i++){const x=(t*2+i*121+66)%510-15,y=47+Math.sin(t*.6+i*3)*6+i*6;const wing=Math.sin(t*5+i)>0?-1:1;rect(c,x,y,2,1,'#708975');rect(c,x-2,y+wing,2,1,'#708975');rect(c,x+2,y+wing,2,1,'#708975');}
 if(map.id==='canal'){for(let i=0;i<80;i++){const x=(i*41.7+t*17)%480,y=(i*33.7+t*90)%235;rect(c,x,y,1,3,'#e3e7cf55');}}
 if(mode==='explore'){for(let i=0;i<6;i++){const x=57+i*69+Math.sin(t+i)*7,y=180+Math.cos(t*.8+i)*12;rect(c,x,y,1,1,'#edf0b9');if(Math.sin(t*7+i)>0)rect(c,x-1,y-1,3,1,'#e7d78f');}}c.restore();
}
