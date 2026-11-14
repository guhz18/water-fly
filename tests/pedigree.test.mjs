import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStone} from '../dist/data.js';
import {breedFamily, familyStory, restoreResearch, surfaceLabel} from '../dist/genetics.js';
import {chipOutline, buildProfile} from '../dist/outline.js';
import {evaluateStone} from '../dist/physics.js';

function seeded(state) {
  return () => ((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
}
const stone = id=>makeStone(id,false);

test('each of 2–6 parents contributes contiguous segments of its actual cut profile',()=>{
  const parents=[0,3,4,7,13,16].map(stone);
  parents[0].outline=chipOutline(parents[0],seeded(15));
  const before=JSON.stringify(parents);
  for(let count=2;count<=6;count++){
    const family=parents.slice(0,count);
    const child=breedFamily(family,[],seeded(99));
    const sectors=child.lineage.outline.sectors;
    assert.equal(new Set(sectors).size,count);
    for(let i=0;i<count;i++){
      const inside=sectors.findIndex((source,j)=>source===i&&sectors[(j+31)%32]===i&&sectors[(j+1)%32]===i);
      assert.ok(inside>=0);
      assert.equal(child.outline.radii[inside],family[i].outline.radii[inside]);
    }
    assert.ok(buildProfile(child).area>0);
    assert.ok(Number.isFinite(evaluateStone(child).distance));
  }
  assert.equal(before,JSON.stringify(parents));
  assert.throws(()=>breedFamily([parents[0],{...parents[0]}]),RangeError);
  assert.throws(()=>breedFamily(parents.slice(0,1)),RangeError);
  assert.throws(()=>breedFamily([...parents,stone(18)]),RangeError);
});

test('family stories follow the material pairing; siblings vary and inherited finishes affect smoothness',()=>{
  const saved=[0,4,7].map(stone);
  assert.equal(familyStory(saved.slice(1)).title,'回车烤盘');
  assert.equal(familyStory(saved).title,'河湾早餐机');
  assert.deepEqual(familyStory(saved),familyStory([...saved].reverse()));
  const natural=breedFamily(saved,[],seeded(11));
  const sibling=breedFamily(saved,[],seeded(30));
  assert.deepEqual(natural.lineage.story,sibling.lineage.story);
  assert.notDeepEqual(natural.outline.radii,sibling.outline.radii);
  const polished=saved.map(s=>({...s,smoothness:s.smoothness+.09}));
  const other=breedFamily(polished,[],seeded(11));
  assert.ok(Math.abs(other.smoothness-natural.smoothness-.09)<1e-8);
  const differentFinish=saved.map(s=>({...s,surface:{pattern:'glaze',grain:0,glaze:1}}));
  const shiny=breedFamily(differentFinish,[],seeded(11));
  assert.notDeepEqual(shiny.surface,natural.surface);
  assert.notEqual(shiny.smoothness,natural.smoothness);
  assert.notEqual(surfaceLabel(shiny),surfaceLabel(natural));
});

test('multigeneration names, finishes and immediate parent snapshots survive a bounded backup round trip',()=>{
  const founders=[0,4,7,13,17].map(stone);
  let child=stone(3);
  for(let generation=1;generation<=8;generation++){
    child=breedFamily([child,...founders],[],seeded(generation));
    assert.equal(child.lineage.generation,generation);
    assert.ok(child.lineage.parents.every(p=>!p.lineage));
  }
  const backup=JSON.parse(JSON.stringify(child));
  const restored=restoreResearch(stone(child.id),backup);
  assert.deepEqual(restored.lineage,child.lineage);
  assert.deepEqual(restored.surface,child.surface);
  assert.equal(restored.name,child.name);
  assert.equal(restored.desc,child.desc);
  backup.lineage.parents[0].name='<b>untrusted</b>';backup.lineage.story.text='<b>untrusted</b>';
  const clean=restoreResearch(stone(child.id),backup);
  assert.ok(!clean.desc.includes('untrusted')&&!clean.lineage.parents[0].name.includes('untrusted'));
  backup.lineage.loci[2].source=7;
  assert.equal(restoreResearch(stone(child.id),backup).lineage,undefined);
});
