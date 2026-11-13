import {BASES, makeStone, TYPES} from './data.js';
import {clamp} from './physics.js';

export const TRAITS=['radius','mass','flatness','smoothness'];
export const TRAIT_NAMES=['体型 / 半径','密度 / 质量','层理 / 平整','表皮 / 光滑'];
const bounds=[[.014,.07],[.008,.3],[.2,.99],[.2,.99]];
// A locus inherits an actual parental allele. An explicit edit is a small,
// relative change to that inherited phenotype, never a reset to the species template.
export function breedStone(a,b,edits=[],random=Math.random){
  const dominant=random()<.5?a:b;
  const child={...makeStone(dominant.id,false),name:TYPES[dominant.id].name+'·混血',rarity:'奇遇',
    desc:`${a.name}与${b.name}的孩子。认真遗传，偶尔调皮。`,history:[],
    lineage:{generation:1+Math.max(a.lineage?.generation||0,b.lineage?.generation||0),
      parents:[a,b].map(p=>({id:p.id,name:p.name,genes:[...p.genes],traits:TRAITS.map(k=>p[k])})),loci:[]}};
  child.genes=TRAITS.map((key,i)=>{
    const source=random()<.5?0:1,donor=source?b:a,other=source?a:b;
    const inherited=donor.genes[i],gene=BASES.includes(edits[i])?edits[i]:inherited;
    const shift=(BASES.indexOf(gene)-BASES.indexOf(inherited))/3;
    const blended=donor[key]*.65+other[key]*.35;
    child[key]=clamp(i<2?blended*(1+shift*.18):blended+shift*.10,...bounds[i]);
    child.lineage.loci.push({source,inherited,gene,edited:gene!==inherited});
    return gene;
  });
  child.thickness=clamp((a.thickness+b.thickness)/2,.003,.03);
  // Special states pass from the visual dominant parent; parents remain untouched.
  if(dominant.quantum)child.quantum={...dominant.quantum};
  return child;
}

export function discardStone(state,uid){
  const index=state.stones.findIndex(s=>s.uid===uid);
  if(index<0)return false;
  state.stones.splice(index,1);
  if(state.selected===uid)state.selected=state.stones[0]?.uid??null;
  return true;
}
export function newProgress(){return {version:1,credits:360,best:0,bestDistance:0,totalThrows:0,map:0,
  stones:[makeStone(0,false),makeStone(4,false),makeStone(7,false)],selected:null,discovered:[0,4,7],history:[],sound:false};}
export function resetProgress(state){const fresh=newProgress();fresh.selected=fresh.stones[0].uid;for(const k of Object.keys(state))delete state[k];Object.assign(state,fresh);}

// Optional v1.2 metadata is whitelisted on backup import. Display strings are
// rebuilt from known species, and no parent object references are retained.
export function restoreResearch(out,x){
  if(x.quantum&&Number.isFinite(x.quantum.bias)&&Number.isFinite(x.quantum.phase))
    out.quantum={bias:clamp(x.quantum.bias,.1,.9),phase:clamp(x.quantum.phase,0,360)};
  const p=x.recommendedThrow;
  if(p&&['pitch','tilt','spin'].every(k=>Number.isFinite(p[k])))
    out.recommendedThrow={pitch:clamp(p.pitch,-25,15),tilt:clamp(p.tilt,5,50),spin:clamp(p.spin,0,70)};
  else if(Number.isFinite(x.recommendedTilt))out.recommendedThrow={pitch:-8,tilt:clamp(x.recommendedTilt,5,50),spin:35};
  const l=x.lineage;
  if(l?.parents?.length===2&&l.loci?.length===4&&l.parents.every(p=>TYPES[p.id]&&p.genes?.length===4&&p.genes.every(g=>BASES.includes(g))&&p.traits?.length===4&&p.traits.every(Number.isFinite))&&l.loci.every(p=>[0,1].includes(p.source)&&BASES.includes(p.inherited)&&BASES.includes(p.gene))){
    out.lineage={generation:clamp(Math.floor(l.generation)||1,1,9999),
      parents:l.parents.map(p=>({id:p.id,name:TYPES[p.id].name,genes:[...p.genes],traits:p.traits.map((v,i)=>clamp(v,...bounds[i]))})),
      loci:l.loci.map(p=>({source:p.source,inherited:p.inherited,gene:p.gene,edited:p.inherited!==p.gene}))};
    out.name=TYPES[out.id].name+'·混血';out.rarity='奇遇';
    out.desc=out.lineage.parents.map(p=>p.name).join('与')+'的孩子。认真遗传，偶尔调皮。';
  }
  return out;
}
