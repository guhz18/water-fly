import {clamp, evaluateStone} from './physics.js';
import {QuantumSkipSimulation} from './quantum.js';
import {buildProfile, chipOutline, cutOutline, polishOutline} from './outline.js';
import {betterResult, TRIAL_CONDITIONS} from './goals.js';

function numberOption(value, fallback, low, high) {
  const number = Number(value ?? fallback);
  return clamp(Number.isFinite(number) ? number : fallback, low, high);
}

function chipped(stone, random) {
  // A new random fracture pattern for each independent attempt. Even the best
  // fracture can lose against the original if the stone started well shaped.
  return Array.from({length: 4}, (_, i) => ({
    recipe: `第 ${i + 1} 道裂面`,
    stone: {...stone, outline: chipOutline(stone, random), mass: stone.mass * (.77 + random() * .2),
      flatness: clamp(stone.flatness + (random() - .42) * .38, .22, .99),
      smoothness: clamp(stone.smoothness + (random() - .65) * .25, .18, .99),
      radius: stone.radius * (.92 + random() * .06)}
  }));
}

function polished(stone) {
  const passes = [
    ['细砂纸磨面', .03, .095, .985],
    ['两面交替粗磨', .085, .035, .94],
    ['顺纹修边', .055, .06, .967],
    ['砂纸收光', .04, .08, .97]
  ];
  return passes.map(([recipe, flatness, smoothness, mass]) => ({
    recipe, stone: {...stone, outline: polishOutline(stone), mass: stone.mass * mass,
      flatness: Math.min(.99, stone.flatness + flatness),
      smoothness: Math.min(.99, stone.smoothness + smoothness)}
  }));
}

function machined(stone, options) {
  const mass = numberOption(options.mill, 75, 50, 95) / 100 * stone.mass;
  const radius = numberOption(options.radius, 95, 70, 100) / 100 * stone.radius;
  const outline = cutOutline(stone, options.cutShape || 'round');
  // All cuts respect the same material allowance and operator's template.
  // Compare face grinding and beveling within that envelope.
  return [
    ['平磨刀', .986, .95, .72], ['镜面刀', .96, .99, .93],
    ['窄刃倒角', .965, .975, .56], ['宽刃倒角', .978, .97, .82]
  ].map(([recipe, flatness, smoothness, thickness]) => ({
    recipe, stone: {...stone, mass, radius, outline,
      flatness: Math.max(stone.flatness, flatness), smoothness: Math.max(stone.smoothness, smoothness),
      thickness: Math.min(stone.thickness, Math.max(.003, stone.thickness * thickness))}
  }));
}

const ENVIRONMENTS = {
  sediment: [
    ['细砂慢沉', .98, .16, .02, -.2, -.20], ['交替铺层', 1, .10, .10, -.14, -.12],
    ['河弯急淤', .95, .09, -.03, -.26, -.16]
  ],
  volcano: [
    ['浮渣急冷', .95, .06, -.2, -.33, -.14], ['分段淬冷', 1, .11, -.15, -.24, -.1],
    ['熔壳缓凝', .99, .04, -.05, -.12, -.04]
  ],
  pressure: [
    ['恒压结晶', .98, .08, .20, .20, -.12], ['侧向褶压', 1.03, .13, .06, .10, -.19],
    ['缓慢卸压', 1, .05, .15, .06, -.05]
  ]
};

function formed(stone, options) {
  const strength = numberOption(options.era, 70, 10, 100) / 100;
  const recipes = ENVIRONMENTS[options.formation] || ENVIRONMENTS.sediment;
  return recipes.map(([recipe, radius, flatness, smoothness, mass, thickness]) => ({
    recipe, stone: {...stone, mass: stone.mass * (1 + mass * strength),
      radius: stone.radius * (1 + (radius - 1) * strength),
      flatness: clamp(stone.flatness + flatness * strength, .2, .99),
      smoothness: clamp(stone.smoothness + smoothness * strength, .2, .99),
      thickness: clamp(stone.thickness * (1 + thickness * strength), .003, .03)}
  }));
}

function quantumCandidates(stone, options) {
  const bias = numberOption(options.quantumBias, 100 * (stone.quantum?.bias ?? .5), 10, 90);
  const phase = numberOption(options.quantumPhase, stone.quantum?.phase ?? 0, 0, 360);
  const candidates = new Map();
  for (const [weightStep, phaseStep] of [[0,0], [0,-15], [0,15], [-10,-15], [10,15], [-10,15], [10,-15]]) {
    const candidateBias = clamp(bias + weightStep, 10, 90);
    const candidatePhase = (phase + phaseStep + 360) % 360;
    const recipe = `相位 ${candidatePhase}° · 轻薄态权重 ${candidateBias}%`;
    candidates.set(recipe, {recipe, stone: {...stone, quantum: {phase: candidatePhase, bias: candidateBias / 100}}});
  }
  return [...candidates.values()];
}

const OBSERVATION_SEEDS = [41207, 97213, 282229, 677087, 1597919];
function observationStream(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function quantumTrial(stone) {
  let skips = 0, distance = 0;
  for (const seed of OBSERVATION_SEEDS) {
    const sim = new QuantumSkipSimulation(stone, {}, {wave:0, wind:0, current:0}, observationStream(seed));
    while (!sim.done) sim.step(sim.dt);
    const result = sim.result();
    skips += result.skips;
    distance += result.distance;
  }
  const samples = OBSERVATION_SEEDS.length;
  return {skips: skips / samples, distance: Number((distance / samples).toFixed(2)), samples};
}

export function searchCraft(id, stone, objective, options = {}, random = Math.random) {
  let candidates;
  switch (id) {
    case 'smash': candidates = chipped(stone, random); break;
    case 'home': candidates = polished(stone); break;
    case 'factory': candidates = machined(stone, options); break;
    case 'time': candidates = formed(stone, options); break;
    case 'quantum': candidates = quantumCandidates(stone, options); break;
    default: throw new RangeError('没有这项工艺');
  }

  const quantum = id === 'quantum';
  const evaluate = quantum ? quantumTrial : evaluateStone;
  const baseline = evaluate(stone);
  const originalArea = buildProfile(stone).area;
  let best;
  for (const candidate of candidates) {
    const next = candidate.stone;
    if (['smash', 'home', 'factory'].includes(id)) {
      next.mass *= Math.min(1, buildProfile(next).area / originalArea);
    }
    if (id === 'smash' || id === 'home') {
      next.thickness = Math.min(stone.thickness, .004 + (1 - next.flatness) * .022);
    }
    next.mass = clamp(next.mass, .008, .3);
    next.radius = clamp(next.radius, .014, .07);
    const result = evaluate(next);
    if (betterResult(result, best?.result, objective)) best = {...candidate, result};
  }
  const conditions = quantum ? `${TRIAL_CONDITIONS}，相同 5 组观测种子的平均成绩` : TRIAL_CONDITIONS;
  return {...best, baseline, conditions, count: candidates.length};
}
