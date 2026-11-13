import { mkdir,writeFile } from 'node:fs/promises';
import { SOUND_PACKS,MUSIC_STYLES,makeMusic,sfxDemo,wav,SAMPLE_RATE,peak } from '../dist/synthesis.js';
const folder=new URL('../dist/audio/previews/',import.meta.url);await mkdir(folder,{recursive:true});
for(const pack of SOUND_PACKS){const samples=sfxDemo(pack.id);await writeFile(new URL(`sfx-${pack.id}.wav`,folder),wav(samples));console.log(`SFX ${pack.name}: ${samples.length/SAMPLE_RATE}s, peak ${peak(samples).toFixed(3)}`);}
for(const style of MUSIC_STYLES){const samples=makeMusic(style.id);const fade=.5*SAMPLE_RATE;for(let i=0;i<fade;i++){samples[i]*=i/fade;samples[samples.length-1-i]*=i/fade;}await writeFile(new URL(`music-${style.id}.wav`,folder),wav(samples));console.log(`Music ${style.name}: ${(samples.length/SAMPLE_RATE).toFixed(2)}s, peak ${peak(samples).toFixed(3)}`);}
