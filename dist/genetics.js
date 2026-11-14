import {BASES, makeStone, TYPES} from './data.js';
import {clamp} from './physics.js';
import {outlineOf,outlineGeneOf,inheritFamilyOutline,OUTLINE_SAMPLES} from './outline.js';
import {familyStory,inheritSurface,knownStoryTitle,surfaceOf} from './pedigree.js';
export {familyStory,surfaceLabel} from './pedigree.js';

export const TRAITS=['radius','mass','flatness','smoothness'];
export const TRAIT_NAMES=['体型 / 半径','密度 / 质量','层理 / 平整','表皮 / 光滑'];
const bounds=[[.014,.07],[.008,.3],[.2,.99],[.2,.99]];
// A locus inherits an actual parental allele. An explicit edit is a small,
// relative change to that inherited phenotype, never a reset to the species template.
export function breedStone(a,b,edits=[],random=Math.random,outlineEdit='inherit'){
  return breedFamily([a,b],edits,random,outlineEdit);
}

function parentSnapshot(p){
  return {id:p.id,name:p.name,genes:[...p.genes],traits:TRAITS.map(k=>p[k]),
    outline:outlineOf(p),outlineGene:outlineGeneOf(p),surface:surfaceOf(p)};
}

export function breedFamily(parents,edits=[],random=Math.random,outlineEdit='inherit'){
  if(!Array.isArray(parents)||parents.length<2||parents.length>6||
    parents.some(p=>!p?.uid)||new Set(parents.map(p=>p.uid)).size!==parents.length)
    throw new RangeError('请选择 2 至 6 块不同的亲本石头。');
  const count=parents.length;
  const dominant=parents[Math.floor(random()*count)];
  const story=familyStory(parents);
  const child={...makeStone(dominant.id,false),name:story.title,rarity:'奇遇',desc:story.text,
    lineage:{generation:1+Math.max(...parents.map(p=>p.lineage?.generation||0)),
      parents:parents.map(parentSnapshot),loci:[],story}};
  child.genes=TRAITS.map((key,i)=>{
    const source=Math.floor(random()*count),donor=parents[source];
    const inherited=donor.genes[i],gene=BASES.includes(edits[i])?edits[i]:inherited;
    const shift=(BASES.indexOf(gene)-BASES.indexOf(inherited))/3;
    const rest=parents.reduce((sum,p,j)=>j===source?sum:sum+p[key],0)/(count-1);
    let blended=donor[key]*.65+rest*.35;
    if(key==='smoothness'){
      const {surface,smoothnessDelta}=inheritSurface(parents,source,random);
      child.surface=surface;
      blended+=smoothnessDelta;
    }
    child[key]=clamp(i<2?blended*(1+shift*.18):blended+shift*.10,...bounds[i]);
    child.lineage.loci.push({source,inherited,gene,edited:gene!==inherited});
    return gene;
  });
  const shape=inheritFamilyOutline(parents,outlineEdit,random);
  child.outline=shape.outline;child.outlineGene=shape.outlineGene;child.lineage.outline=shape.inheritance;
  child.thickness=clamp(parents.reduce((sum,p)=>sum+p.thickness,0)/count,.003,.03);
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

function restoredParents(lineage) {
  if(!Array.isArray(lineage?.parents)||lineage.parents.length<2||lineage.parents.length>6)return null;
  const valid=p=>p && Number.isInteger(p.id) && TYPES[p.id] &&
    Array.isArray(p.genes) && p.genes.length===4 && p.genes.every(g=>BASES.includes(g)) &&
    Array.isArray(p.traits) && p.traits.length===4 && p.traits.every(Number.isFinite);
  if(!lineage.parents.every(valid))return null;
  return lineage.parents.map(p=>{
    const species=TYPES[p.id];
    const validName=knownStoryTitle(p.name)||p.name===species.name+'·混血';
    const stone={...species,outline:p.outline,outlineGene:p.outlineGene,surface:p.surface};
    const snapshot={id:p.id,name:validName?p.name:species.name,genes:[...p.genes],
      traits:p.traits.map((v,i)=>clamp(v,...bounds[i])),outline:outlineOf(stone),outlineGene:outlineGeneOf(stone)};
    if(p.surface)snapshot.surface=surfaceOf(stone);
    return snapshot;
  });
}

// Read only recognised material data. Rebuild prose from local recipes.
export function restoreResearch(out,x){
  out.outline=outlineOf({...out,outline:x.outline});out.outlineGene=outlineGeneOf({...out,outlineGene:x.outlineGene});
  if(x.surface)out.surface=surfaceOf({...out,surface:x.surface});
  if(x.quantum&&Number.isFinite(x.quantum.bias)&&Number.isFinite(x.quantum.phase))
    out.quantum={bias:clamp(x.quantum.bias,.1,.9),phase:clamp(x.quantum.phase,0,360)};
  const p=x.recommendedThrow;
  if(p&&['pitch','tilt','spin'].every(k=>Number.isFinite(p[k])))
    out.recommendedThrow={pitch:clamp(p.pitch,-25,15),tilt:clamp(p.tilt,5,50),spin:clamp(p.spin,0,70)};
  else if(Number.isFinite(x.recommendedTilt))out.recommendedThrow={pitch:-8,tilt:clamp(x.recommendedTilt,5,50),spin:35};
  const l=x.lineage,parents=restoredParents(l);
  if(!parents)return out;
  const validSource=i=>Number.isInteger(i)&&i>=0&&i<parents.length;
  const validLocus=p=>p && validSource(p.source) && BASES.includes(p.inherited) && BASES.includes(p.gene);
  const locus=p=>({source:p.source,inherited:p.inherited,gene:p.gene,edited:p.inherited!==p.gene});
  if(!Array.isArray(l.loci)||l.loci.length!==4||!l.loci.every(validLocus))return out;
  out.lineage={generation:clamp(Math.floor(l.generation)||1,1,9999),parents,loci:l.loci.map(locus)};
  if(validLocus(l.outline)){
    out.lineage.outline=locus(l.outline);
    const sectors=l.outline.sectors;
    if(Array.isArray(sectors)&&sectors.length===OUTLINE_SAMPLES&&sectors.every(validSource))
      out.lineage.outline.sectors=[...sectors];
  }
  out.rarity='奇遇';
  if(l.story){
    out.lineage.story=familyStory(parents);
    out.name=out.lineage.story.title;out.desc=out.lineage.story.text;
  }else{
    out.name=TYPES[out.id].name+'·混血';
    out.desc=parents.map(p=>p.name).join('与')+'的孩子。认真遗传，偶尔调皮。';
  }
  return out;
}
