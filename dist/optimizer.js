import {evaluateStone} from './physics.js';
import {betterResult} from './goals.js';

self.onmessage = ({data}) => {
  const {stone, start, count, objective} = data;
  let best;
  for (let i = 0; i < count; i++) {
    const index = start + i;
    const massStep = (index % 8) / 7;
    const radiusStep = (Math.floor(index / 8) % 6) / 5;
    const layerStep = Math.floor(index / 48) / 3;
    const candidate = {...stone, mass: .025 + massStep * .12, radius: .029 + radiusStep * .023,
      flatness: Math.min(.99, .82 + layerStep * .17), smoothness: .95, thickness: .004 + (1 - layerStep) * .006};
    const result = evaluateStone(candidate);
    if (betterResult(result, best?.result, objective)) best = {stone: candidate, result};
    if (i % 6 === 0) self.postMessage({progress: i / count});
  }
  self.postMessage({done: true, best});
};
