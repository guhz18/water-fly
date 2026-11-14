// Momentary controls: keyboard and touch can overlap; releasing one never drops the other.
export function mountFollow(button, available) {
 const held=new Set();
 function set(source,on){if(on&&available())held.add(source);else held.delete(source);paint();}
 function paint(){const active=held.size>0;button.dataset.held=String(active);button.textContent=active?'镜头跟随中 · 松开返回':'按住 F · 镜头跟随';}
 function clear(){held.clear();paint();}
 window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.altKey||e.metaKey||!available()||e.isComposing||e.target?.isContentEditable)return;
  if(e.code==='KeyF'&&!['TEXTAREA','INPUT','SELECT'].includes(e.target?.tagName)){e.preventDefault();if(!e.repeat)set('f',true);}
  if(e.target===button&&['Enter','Space'].includes(e.code)){e.preventDefault();if(!e.repeat)set(e.code,true);}
 });
 window.addEventListener('keyup',e=>{if(e.code==='KeyF')set('f',false);if(['Enter','Space'].includes(e.code)&&held.has(e.code))set(e.code,false);});
 button.addEventListener('pointerdown',e=>{if(e.button!==0||!available())return;e.preventDefault();button.setPointerCapture(e.pointerId);set(e.pointerId,true);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>set(e.pointerId,false));
 button.addEventListener('blur',()=>{set('Space',false);set('Enter',false);});
 button.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('blur',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 return {active:()=>held.size>0,clear};
}
