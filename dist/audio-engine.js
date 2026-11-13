import { makeSfx, makeMusic, makeAmbience, sfxDemo, SAMPLE_RATE, SOUND_PACKS, MUSIC_STYLES } from './synthesis.js';
export const DEFAULT_SETTINGS = Object.freeze({ master:70, music:35, effects:75, ambience:45, muted:false, soundPack:'pocket', musicStyle:'drift', backgroundMute:true, reducedMotion:false, trajectory:true, hints:true, renderRate:60, chargeMode:'hold' });
export function normalizeSettings(input = {}) {
  const s={...DEFAULT_SETTINGS};
  for(const key of ['master','music','effects','ambience'])if(Number.isFinite(input[key]))s[key]=Math.max(0,Math.min(100,input[key]));
  for(const key of ['muted','backgroundMute','reducedMotion','trajectory','hints'])if(typeof input[key]==='boolean')s[key]=input[key];
  if(SOUND_PACKS.some(x=>x.id===input.soundPack))s.soundPack=input.soundPack;
  if(MUSIC_STYLES.some(x=>x.id===input.musicStyle))s.musicStyle=input.musicStyle;
  if([30,60].includes(input.renderRate))s.renderRate=input.renderRate;
  if(['hold','toggle'].includes(input.chargeMode))s.chargeMode=input.chargeMode;
  return s;
}
export class GameAudio {
  constructor(settings){this.settings=normalizeSettings(settings);this.context=null;this.map='reed';this.musicLoop=null;this.ambientLoop=null;this.buffers=new Map();this.sources=new Set();this.activated=false;this.preview=null;this.lastStep=0;this.duck=1;this.hidden=false;}
  async unlock(){
    try {
      if(!this.context){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;this.context=new Context();const c=this.context;this.master=c.createGain();this.compressor=c.createDynamicsCompressor();this.compressor.threshold.value=-10;this.compressor.knee.value=12;this.compressor.ratio.value=5;this.master.connect(this.compressor).connect(c.destination);this.buses={};for(const key of ['music','effects','ambience','preview']){this.buses[key]=c.createGain();this.buses[key].connect(this.master);}this.buses.preview.gain.value=.7;}
      if(this.context.state==='suspended')await this.context.resume();this.activated=true;this.apply();if(!this.settings.muted)this.ensureLoops();return this.context.state==='running';
    }catch{return false;}
  }
  gain(node,value,tau=.06){if(node&&this.context)node.gain.setTargetAtTime(value,this.context.currentTime,tau);}
  apply(settings=this.settings){const old=this.settings;this.settings=normalizeSettings(settings);if(!this.context)return;this.gain(this.master,this.settings.muted||(this.hidden&&this.settings.backgroundMute)?0:this.settings.master/100);this.gain(this.buses.effects,this.settings.effects/100);this.gain(this.buses.music,this.settings.music/100*this.duck*(this.preview?.12:1));this.gain(this.buses.ambience,this.settings.ambience/100*(this.preview?.2:1));if(old.musicStyle!==this.settings.musicStyle)this.replaceLoop('music');if(this.activated&&!this.settings.muted)this.ensureLoops();}
  buffer(key,create){if(this.buffers.has(key))return this.buffers.get(key);const data=create(),buffer=this.context.createBuffer(1,data.length,SAMPLE_RATE);buffer.copyToChannel(data,0);this.buffers.set(key,buffer);if(this.buffers.size>85)this.buffers.delete(this.buffers.keys().next().value);return buffer;}
  start(buffer,bus,loop=false,delay=0){const c=this.context,source=c.createBufferSource(),gain=c.createGain();source.buffer=buffer;source.loop=loop;source.connect(gain).connect(this.buses[bus]);const voice={source,gain};this.sources.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();this.sources.delete(voice);};source.start(c.currentTime+delay);return voice;}
  stop(voice,fade=.15){if(!voice||!this.context)return;const now=this.context.currentTime;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(0,now,fade/3);try{voice.source.stop(now+fade+.03);}catch{}}
  ensureLoops(){if(!this.musicLoop)this.replaceLoop('music');if(!this.ambientLoop)this.replaceLoop('ambience');}
  replaceLoop(kind){if(!this.context||!this.activated)return;const field=kind==='music'?'musicLoop':'ambientLoop';this.stop(this[field],.65);const key=kind==='music'?`music:${this.settings.musicStyle}:${this.map}`:`ambience:${this.map}`;const buffer=this.buffer(key,()=>kind==='music'?makeMusic(this.settings.musicStyle,this.map):makeAmbience(this.map));const voice=this.start(buffer,kind,true);voice.gain.gain.setValueAtTime(0,this.context.currentTime);voice.gain.gain.linearRampToValueAtTime(1,this.context.currentTime+.8);this[field]=voice;}
  setMap(map){if(this.map===map)return;this.map=map;if(this.activated){this.replaceLoop('music');this.replaceLoop('ambience');}}
  event(name,variant=0){if(!this.activated||this.settings.muted||!this.context||this.hidden&&this.settings.backgroundMute)return;if(this.sources.size>24&&name!=='record')return;const v=Math.max(0,Math.min(24,Math.round(variant)));const buffer=this.buffer(`fx:${this.settings.soundPack}:${name}:${v}`,()=>makeSfx(name,this.settings.soundPack,v));this.start(buffer,'effects');}
  step(now){if(now-this.lastStep>.32){this.lastStep=now;this.event('step',Math.floor(now*7)%4);}}
  setFlight(active){this.duck=active?.48:1;this.apply();}
  setHidden(hidden){this.hidden=hidden;this.apply();if(hidden)this.stopPreview();}
  stopPreview(){if(this.preview){this.stop(this.preview);this.preview=null;this.apply();}}
  async audition(kind,id){this.stopPreview();if(!(await this.unlock()))return false;if(this.settings.muted||this.settings.master===0)return false;const key=kind==='music'?`music:${id}:reed`:`demo:${id}`;const buffer=this.buffer(key,()=>kind==='music'?makeMusic(id,'reed'):sfxDemo(id));this.preview=this.start(buffer,'preview');const voice=this.preview;voice.source.addEventListener('ended',()=>{if(this.preview===voice){this.preview=null;this.apply();}});this.apply();return true;}
}
