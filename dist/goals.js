export const GOAL_NAMES = Object.freeze({distance: '距离优先', skips: '次数优先'});
export const TRIAL_CONDITIONS = '标准静水，13 m/s，出手 −8°、倾角 20°、自旋 35 r/s';

// Trials use the same precision as the scoreboard. The other measurement
// breaks a tie; identical results retain the earlier candidate.
export function betterResult(next, previous, objective = 'skips') {
  if (!previous) return true;
  const first = objective === 'distance' ? 'distance' : 'skips';
  const second = first === 'distance' ? 'skips' : 'distance';
  return next[first] > previous[first] ||
    (next[first] === previous[first] && next[second] > previous[second]);
}
