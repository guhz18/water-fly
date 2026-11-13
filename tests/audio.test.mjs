import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSfx,makeMusic,makeAmbience,sfxDemo,wav,peak,SAMPLE_RATE,SOUND_PACKS,MUSIC_STYLES } from '../dist/synthesis.js';
import { normalizeSettings,DEFAULT_SETTINGS } from '../dist/audio-engine.js';
import { readSettings,writeSettings,SETTINGS_KEY } from '../dist/settings.js';
const maps=['reed','lake','coast','canal','dock'];
function assertSignal(s,ceiling){assert.ok(s.length>0);let sum=0;for(const x of s){assert.ok(Number.isFinite(x));sum+=x*x;}assert.ok(sum/s.length>1e-8,'must be audible, nonempty PCM');assert.ok(peak(s)<=ceiling+1e-6,'no clipping');}
test('all sound palettes and action cues produce finite, unclipped audio',()=>{for(const p of SOUND_PACKS)for(const event of ['step','ui','pickup','charge','throw','skip','sink','craft','record','npc','error','smash','home','factory','fluid','quantum','bio','time','future','plead','farewell','observe'])assertSignal(makeSfx(event,p.id,5),.82);});
test('all map music arrangements and ambience loops are finite and loop without a hard seam',()=>{for(const style of MUSIC_STYLES)for(const map of maps){const pcm=makeMusic(style.id,map);assertSignal(pcm,.65);assert.ok(Math.abs(pcm[0]-pcm.at(-1))<.025,'loop boundary should be smooth');}for(const map of maps)assertSignal(makeAmbience(map),.35);});
test('palettes are audibly distinct numerical waveforms and deterministic',()=>{const shore=makeSfx('pickup','shore'),pocket=makeSfx('pickup','pocket'),glass=makeSfx('pickup','glass');assert.deepEqual(shore,makeSfx('pickup','shore'));assert.notDeepEqual(shore,pocket);assert.notDeepEqual(shore,glass);assert.notDeepEqual(makeMusic('afternoon','reed'),makeMusic('afternoon','canal'));});
test('all sound demos use the same eleven-second comparison sequence',()=>{for(const p of SOUND_PACKS){const pcm=sfxDemo(p.id);assert.equal(pcm.length,11*SAMPLE_RATE);assertSignal(pcm,.82);}});
test('WAV exports have correct PCM metadata and signed sample bounds',()=>{const pcm=new Float32Array([0,.5,-.5,1,-1]),bytes=wav(pcm),v=new DataView(bytes.buffer);assert.equal(bytes.length,54);assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(v.getUint32(24,true),SAMPLE_RATE);assert.equal(v.getUint16(22,true),1);assert.equal(v.getUint16(34,true),16);assert.equal(v.getInt16(50,true),32767);assert.equal(v.getInt16(52,true),-32767);});
test('settings validation rejects unknown choices and clamps volume without mutating defaults',()=>{const s=normalizeSettings({master:900,music:-20,effects:NaN,muted:'false',soundPack:'unknown',musicStyle:'afternoon',renderRate:17,chargeMode:'toggle'});assert.equal(s.master,100);assert.equal(s.music,0);assert.equal(s.effects,DEFAULT_SETTINGS.effects);assert.equal(s.muted,false);assert.equal(s.soundPack,'pocket');assert.equal(s.renderRate,60);assert.equal(s.chargeMode,'toggle');assert.equal(DEFAULT_SETTINGS.master,70);});
test('release soundtrack migrates once while preserving preferences and later user choices',()=>{
  const previous=globalThis.localStorage;
  const entries=new Map([[SETTINGS_KEY,JSON.stringify({soundPack:'shore',musicStyle:'afternoon',master:42,muted:true,renderRate:30,chargeMode:'toggle'})],['little-stone-club-v1','untouched-collection']]);
  globalThis.localStorage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
  try{
    const migrated=readSettings();
    assert.equal(migrated.soundPack,'pocket');assert.equal(migrated.musicStyle,'drift');
    assert.equal(migrated.master,42);assert.equal(migrated.muted,true);assert.equal(migrated.renderRate,30);assert.equal(migrated.chargeMode,'toggle');
    writeSettings({...migrated,soundPack:'glass',musicStyle:'ramble'});
    assert.equal(readSettings().soundPack,'glass');assert.equal(readSettings().musicStyle,'ramble');
    assert.equal(entries.get('little-stone-club-v1'),'untouched-collection');
    entries.delete(SETTINGS_KEY);assert.equal(readSettings().soundPack,'pocket');assert.equal(readSettings().musicStyle,'drift');
  }finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
