// Original procedural sound design and music. No third-party recordings or melodies.
export const SAMPLE_RATE = 22050;
export const SOUND_PACKS = [
  { id: 'shore', name: '河岸手作', badge: 'A · 温柔自然', description: '石头轻碰、圆润水滴、砂砾脚步。柔和、亲近，适合慢慢玩。' },
  { id: 'pocket', name: '口袋像素', badge: 'B · 复古掌机', description: '短方波、三角波与小琶音。反馈清脆，像把一台掌机装进口袋。' },
  { id: 'glass', name: '奇妙实验室', badge: 'C · 轻盈科幻', description: '玻璃钟音、闪烁泛音和电子滑音。保留童趣，也带一点未来感。' },
];
export const MUSIC_STYLES = [
  { id: 'afternoon', name: '午后河岸', badge: '1 · 76 BPM', description: '木琴般的短音、轻拨弦和温暖低音。留出很多空白给水声。' },
  { id: 'ramble', name: '像素远足', badge: '2 · 94 BPM', description: '柔化芯片旋律、跳跃低音和轻鼓点。明快，但不催着你赶路。' },
  { id: 'drift', name: '漂浮梦境', badge: '3 · 64 BPM', description: '绵长和弦、晶莹钟音与稀疏旋律。适合镜湖、落日和量子遐想。' },
];
const TAU = Math.PI * 2;
const midi = n => 440 * 2 ** ((n - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function random(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
function tone(out, start, duration, note, gain, kind = 'wood', rate = SAMPLE_RATE, slide = 1, wrap = false) {
  const offset = Math.round(start * rate), length = Math.ceil(duration * rate), f = midi(note);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const at = offset + i;
    if (!wrap && at >= out.length) break;
    const t = i / rate, p = i / length;
    phase += TAU * f * (1 + (slide - 1) * p) / rate;
    let v, env;
    const attack = Math.min(1, t / (kind === 'pad' ? .14 : .008));
    const release = Math.min(1, (duration - t) / .035);
    if (kind === 'chip') { v = Math.sin(phase) + .25 * Math.sin(3 * phase) + .1 * Math.sin(5 * phase); env = Math.exp(-t * 2.8 / duration); }
    else if (kind === 'bell') { v = Math.sin(phase) * Math.exp(-t * 2.5 / duration) + .35 * Math.sin(phase * 2.003) * Math.exp(-t * 7 / duration) + .15 * Math.sin(phase * 3.97) * Math.exp(-t * 11 / duration); env = 1; }
    else if (kind === 'pad') { v = .72 * Math.sin(phase) + .18 * Math.sin(phase * 1.002) + .1 * Math.sin(phase * 2); env = Math.sin(Math.PI * p) ** .7; }
    else if (kind === 'bass') { v = Math.sin(phase) + .13 * Math.sin(phase * 3); env = Math.exp(-t * 2.2 / duration); }
    else { v = Math.sin(phase) + .28 * Math.sin(phase * 2) * Math.exp(-t * 18) + .12 * Math.sin(phase * 3) * Math.exp(-t * 35); env = Math.exp(-t * 5 / duration); }
    out[wrap ? at % out.length : at] += v * gain * env * attack * release;
  }
}
function noise(out, start, duration, gain, cutoff = .12, seed = 47, rate = SAMPLE_RATE, wrap = false) {
  const rand = random(seed), offset = Math.round(start * rate), length = Math.ceil(duration * rate);
  let low = 0, slow = 0;
  for (let i = 0; i < length; i++) {
    const at = offset + i; if (!wrap && at >= out.length) break;
    low += ((rand() * 2 - 1) - low) * cutoff; slow += (low - slow) * .025;
    const env = Math.min(1, i / (rate * .005)) * Math.exp(-i / length * 5) * Math.min(1, (length - i) / (rate * .015));
    out[wrap ? at % out.length : at] += (low - slow * .6) * gain * env;
  }
}
export function peak(samples) { let p = 0; for (const v of samples) p = Math.max(p, Math.abs(v)); return p; }
function limit(samples, ceiling = .82) { const p = peak(samples); if (p > ceiling) for (let i = 0; i < samples.length; i++) samples[i] *= ceiling / p; return samples; }
export function makeSfx(event, pack = 'shore', variant = 0, rate = SAMPLE_RATE) {
  const len = { step: .15, ui: .13, pickup: .65, charge: .34, throw: .3, skip: .3, sink: .65, craft: 1.1, record: 1.5, npc: .36, error: .3, smash:.45, home:.9, factory:1.2, fluid:1, quantum:1.3, bio:1, time:1.2, future:1.2, plead:.7, farewell:.9, observe:.45 }[event] || .3;
  const out = new Float32Array(Math.ceil(rate * len));
  const kind = pack === 'pocket' ? 'chip' : pack === 'glass' ? 'bell' : 'wood';
  const n = variant % 4;
  const note = (at, duration, pitch, gain, slide = 1) => tone(out, at, duration, pitch, gain, kind, rate, slide);
  if (event === 'step') { noise(out, 0, .12, pack === 'pocket' ? .14 : .24, .18, 111 + variant, rate); if (pack !== 'shore') note(0, .08, 39 + n, .08); }
  if (event === 'ui') note(0, .09, pack === 'glass' ? 86 : 74, .17);
  if (event === 'error') { note(0, .14, 48, .17); note(.13, .14, 45, .13); }
  if (event === 'pickup') [72, 76, 79].forEach((p, i) => note(i * .09, .34, p + (pack === 'glass' ? 12 : 0), .2 - i * .025));
  if (event === 'charge') note(0, .32, 48, .16, 1.8);
  if (event === 'throw') { noise(out, 0, .24, .36, .12, 48, rate); note(.015, .19, 52, .14, 1.65); }
  if (event === 'skip') { note(0, .22, 67 + Math.min(variant, 18), .25, pack === 'pocket' ? .8 : .48); noise(out, .008, .22, .48, pack === 'glass' ? .2 : .35, 23 + variant, rate); }
  if (event === 'sink') { note(0, .32, 49, .34, .42); noise(out, .025, .48, .58, .12, 88, rate); note(.19, .15, 57, .09, .5); }
  if (event === 'craft') { noise(out, 0, .14, .36, .32, 90, rate); [60, 67, 72, 76].forEach((p, i) => note(.13 + i * .13, .44, p, .23)); }
  if (event === 'record') [72, 76, 79, 84, 79, 84].forEach((p, i) => note(i * .16, .48, p, .22));
  if (event === 'npc') [58, 62, 60].forEach((p, i) => note(i * .08, .1, p, .18));
  if (event === 'smash') { noise(out,0,.23,.7,.5,83,rate);note(0,.28,48,.25,.6); }
  if (event === 'home') for(let i=0;i<3;i++)noise(out,i*.24,.22,.3,.35,72+i,rate);
  if (event === 'factory') { note(0,.9,45,.1,1.4);for(let i=0;i<5;i++)noise(out,i*.15,.11,.17,.2,19+i,rate);note(.84,.25,79,.12); }
  if (event === 'plead') [76,79,74,72].forEach((p,i)=>note(i*.12,.20,p,.12,.94));
  if (event === 'farewell') [79,76,72,67].forEach((p,i)=>note(i*.16,.24,p,.12));
  if (event === 'observe') { note(0,.14,variant%2?84:72,.16);note(.12,.25,variant%2?79:67,.10,.97); }
  if (event === 'fluid') [67,72,76,79].forEach((p,i)=>note(i*.16,.24,p,.16,.65));
  if (event === 'quantum') { [72,79,84].forEach((p,i)=>tone(out,i*.08,1,p,.12,'bell',rate));note(.65,.5,60,.1,2); }
  if (event === 'bio') [60,67,64,72].forEach((p,i)=>note(i*.17,.3,p,.17));
  if (event === 'time') { note(0,.9,79,.15,.35);note(.6,.55,55,.14,2.4); }
  if (event === 'future') [72,76,79,84,88,91].forEach((p,i)=>note(i*.11,.23,p,.12));
  return limit(out);
}
const MAP_MUSIC = {
  reed: { shift: 0, progression: [0, 5, 9, 7], melody: [0, 4, 7, 9, 7, 4, 2, 0], beat: 1 },
  lake: { shift: 5, progression: [0, 9, 5, 7], melody: [7, 11, 14, 9, 7, 4, 2, 4], beat: 1.12 },
  coast: { shift: -2, progression: [5, 0, 9, 7], melody: [4, 7, 9, 7, 4, 2, 0, 2], beat: 1.04 },
  canal: { shift: -5, progression: [9, 5, 0, 7], melody: [9, 7, 4, 2, 0, 4, 7, 4], beat: 1.08 },
  dock: { shift: -7, progression: [0, 7, 9, 5], melody: [0, 7, 4, 7, 9, 7, 4, 2], beat: .96 },
};
export function musicDuration(style = 'afternoon', map = 'reed') { return 32 * 60 / ({ afternoon: 76, ramble: 94, drift: 64 }[style] || 76) * (MAP_MUSIC[map] || MAP_MUSIC.reed).beat; }
export function makeMusic(style = 'afternoon', map = 'reed', rate = SAMPLE_RATE) {
  const scene = MAP_MUSIC[map] || MAP_MUSIC.reed, duration = musicDuration(style, map), beat = duration / 32;
  const out = new Float32Array(Math.round(duration * rate)), root = 60 + scene.shift;
  const play = (t, d, n, g, k) => tone(out, t * beat, d * beat, n, g, k, rate, 1, true);
  const chordKind = style === 'drift' ? 'pad' : 'wood', leadKind = style === 'ramble' ? 'chip' : style === 'drift' ? 'bell' : 'wood';
  for (let bar = 0; bar < 8; bar++) {
    const chord = scene.progression[bar % 4], third = chord === 9 ? 3 : 4;
    [0, third, 7, 14].forEach((interval, j) => play(bar * 4 + j * .04, style === 'drift' ? 5 : 2.7, root + chord + interval, style === 'drift' ? .055 : .06, chordKind));
    play(bar * 4, 2.2, root - 24 + chord, .14, 'bass');
    if (style !== 'drift') play(bar * 4 + 2.5, 1.4, root - 24 + chord + 7, .085, 'bass');
    const lead = root + 12 + scene.melody[bar];
    play(bar * 4 + .5, 1.15, lead, .15, leadKind);
    play(bar * 4 + 2, 1.4, root + 12 + scene.melody[(bar + 1) % 8], .12, leadKind);
    // Quiet delayed answers lend space without borrowing a melody or a recording.
    play(bar * 4 + .875, 1.1, lead, .035, leadKind);
    if (style === 'ramble') {
      play(bar * 4 + 3, .45, root + 12 + scene.melody[(bar + 2) % 8], .09, 'chip');
      for (let b = 0; b < 4; b++) { play(bar * 4 + b, .13, 35, .1, 'bass'); noise(out, (bar * 4 + b + .5) * beat, .08, .075, .4, 500 + bar * 4 + b, rate, true); }
    }
  }
  return limit(out, .65);
}
export function makeAmbience(map = 'reed', rate = SAMPLE_RATE) {
  const duration = 16, out = new Float32Array(rate * duration), rand = random(93);
  let low = 0, high = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / rate, white = rand() * 2 - 1; low += (white - low) * .018; high += (white - high) * .25;
    const swell = .55 + .4 * Math.sin(TAU * t / 8 - 1.2);
    out[i] = map === 'coast' ? (low * 1.4 + high * .12) * swell : map === 'canal' ? high * .18 + low * .24 : map === 'lake' ? low * .19 : low * .55 + high * .035;
  }
  if (map === 'reed' || map === 'lake') for (const t of [2.2, 2.38, 8.9, 9.12, 13.6]) tone(out, t, .13, 92 + (map === 'lake' ? 3 : 0), .025, 'wood', rate, 1.15);
  if (map === 'dock') for (const t of [3, 11]) tone(out, t, .65, 51, .035, 'bell', rate);
  // Smooth only the seam; the bed and its modulation repeat every sixteen seconds.
  const edge = Math.round(.04 * rate);
  for (let i = 0; i < edge; i++) { const g = i / edge; out[i] *= g; out[out.length - 1 - i] *= g; }
  return limit(out, .35);
}
export function sfxDemo(pack, rate = SAMPLE_RATE) {
  const out = new Float32Array(rate * 11);
  const events = [[.15,'ui',0],[.65,'step',0],[.98,'step',1],[1.31,'step',2],[2,'pickup',0],[3.2,'charge',0],[3.7,'throw',0],[4.15,'skip',0],[4.6,'skip',3],[5,'skip',6],[5.7,'sink',0],[7,'craft',0],[8.6,'record',0]];
  for (const [at,event,v] of events) { const data = makeSfx(event,pack,v,rate), offset = Math.round(at*rate); for(let i=0;i<data.length&&offset+i<out.length;i++)out[offset+i]+=data[i]; }
  return limit(out);
}
export function wav(samples, rate = SAMPLE_RATE) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const str = (at, value) => [...value].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
  str(0,'RIFF');view.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);
  samples.forEach((v,i)=>view.setInt16(44+i*2,Math.round(clamp(v,-1,1)*32767),true));return new Uint8Array(buffer);
}
