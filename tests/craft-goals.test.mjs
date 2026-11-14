import test from 'node:test';
import assert from 'node:assert/strict';
import {makeStone} from '../dist/data.js';
import {evaluateStone} from '../dist/physics.js';
import {cutOutline} from '../dist/outline.js';
import {QuantumSkipSimulation} from '../dist/quantum.js';
import {betterResult} from '../dist/goals.js';
import {searchCraft} from '../dist/craft-search.js';
import {searchThrows, throwCandidate} from '../dist/throw-search.js';

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('distance and skips each take priority and the other measurement breaks ties', () => {
  const long = {distance: 21, skips: 4}, many = {distance: 19, skips: 5};
  assert.equal(betterResult(long, many, 'distance'), true);
  assert.equal(betterResult(long, many, 'skips'), false);
  assert.equal(betterResult({...long, skips: 9}, long, 'distance'), true);
  assert.equal(betterResult({...many, distance: 25}, many, 'skips'), true);
  assert.equal(betterResult(many, many, 'skips'), false);
});

test('factory returns different optimal cuts for the same template and allowance', () => {
  const s = makeStone(0, false), opts = {cutShape:'round', mill:75, radius:95};
  const long = searchCraft('factory', s, 'distance', opts), many = searchCraft('factory', s, 'skips', opts);
  assert.ok(long.result.distance > many.result.distance);
  assert.ok(many.result.skips > long.result.skips);
  for (const pick of [long, many]) {
    assert.deepEqual(pick.result, evaluateStone(pick.stone));
    assert.deepEqual(pick.baseline, evaluateStone(s));
    assert.deepEqual(pick.stone.outline, cutOutline(s, 'round'));
    assert.equal(pick.stone.radius, .95 * s.radius);
    assert.ok(pick.stone.mass <= s.mass * .75);
    assert.ok(pick.stone.thickness <= s.thickness);
  }
});

test('workshop trial scores describe the saved geometry and leave the parent intact', () => {
  const s = makeStone(2, false), before = structuredClone(s);
  for (const id of ['smash','home','factory','time']) {
    const recipe = searchCraft(id, s, 'skips', {cutShape:'triangle', formation:'volcano', era:80}, seeded(56239));
    assert.deepEqual(recipe.result, evaluateStone(recipe.stone));
    assert.deepEqual(s, before);
    assert.ok(recipe.count >= 3);
    if (id === 'time') assert.ok(recipe.stone.mass < s.mass);
    if (id === 'factory') assert.deepEqual(recipe.stone.outline, cutOutline(s, 'triangle'));
  }
  const a = searchCraft('smash', s, 'distance', {}, seeded(56239));
  const b = searchCraft('smash', s, 'skips', {}, seeded(56239));
  assert.ok(a.result.distance > b.result.distance && b.result.skips > a.result.skips);
});

test('quantum recipes honor preparation bounds and report the mean of paired quantum trials', () => {
  const s = makeStone(7, false), before = structuredClone(s);
  const options = {quantumBias:10, quantumPhase:0};
  const best = searchCraft('quantum', s, 'skips', options);
  assert.deepEqual(best, searchCraft('quantum', s, 'skips', options));
  assert.deepEqual(s, before);
  assert.ok([0,15,345].includes(best.stone.quantum.phase));
  assert.ok([.1,.2].includes(best.stone.quantum.bias));
  const trials = [41207, 97213, 282229, 677087, 1597919].map(seed => {
    const sim = new QuantumSkipSimulation(best.stone, {}, {wave:0,wind:0,current:0}, seeded(seed));
    while (!sim.done) sim.step(sim.dt);
    return sim.result();
  });
  assert.equal(best.result.skips, trials.reduce((n,t)=>n+t.skips,0)/trials.length);
  assert.equal(best.result.distance, Number((trials.reduce((n,t)=>n+t.distance,0)/trials.length).toFixed(2)));
});

test('each fluid search partition picks the same result as sorting the trials by the chosen goal', () => {
  const s = makeStone(2, false);
  const trials = Array.from({length:32}, (_,i) => {
    const params = throwCandidate(i + 41);
    return {params, result:evaluateStone(s, params)};
  });
  for (const objective of ['distance', 'skips']) {
    const other = objective === 'distance' ? 'skips' : 'distance';
    const expected = trials.slice().sort((a,b)=> b.result[objective]-a.result[objective] || b.result[other]-a.result[other])[0];
    assert.deepEqual(searchThrows(s, 41, 32, ()=>{}, objective), expected);
  }
});
