import { drawOutline } from './outline.js';

// Coordinates are in the same 480 × 150 pixel space as the workshop scenes.
const W = 480, H = 150, WATER = 92, LAUNCH = 70, FINISH = 433;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const palette = {
  frame: '#37605a', post: '#53796b', glass: '#b5d7bc', light: '#d8ebc9',
  sea: '#579c99', deep: '#468a88', foam: '#d8efcd', brass: '#edc47c',
  skin: '#e5b98c', ink: '#354e49', coat: '#eff1d7', shadow: '#acccb9',
};
const trackCache = new WeakMap();

function trackFor(trial) {
  if (!trial || typeof trial !== 'object') return null;
  if (trackCache.has(trial)) return trackCache.get(trial);
  const path = (Array.isArray(trial.path) ? trial.path : [])
    .filter(p => p && [p.t, p.x, p.y].every(Number.isFinite))
    .slice().sort((a, b) => a.t - b.t);
  if (!path.length) return null;
  const contacts = (Array.isArray(trial.contacts) ? trial.contacts : [])
    .filter(hit => hit && Number.isFinite(hit.time) && Number.isFinite(hit.x))
    .slice().sort((a, b) => a.time - b.time);
  const first = path[0], last = path.at(-1);
  const range = Math.max(1, last.x - first.x);
  const tick = Math.max(1, 5 * Math.ceil(range / 30));
  const span = Math.ceil(range / tick) * tick;
  const maxHeight = path.reduce((max, p) => Math.max(max, p.y), .5);
  const track = {
    path, contacts, first, last, tick, span,
    x: value => LAUNCH + clamp((value - first.x) / span, 0, 1) * (FINISH - LAUNCH),
    y: value => WATER - clamp(value / maxHeight, -.23, 1) * 42,
  };
  trackCache.set(trial, track);
  return track;
}

function sample(track, time) {
  const points = track.path;
  let lo = 0, hi = points.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].t <= time) lo = mid;
    else hi = mid;
  }
  const a = points[lo], b = points[hi];
  const mix = clamp((time - a.t) / (b.t - a.t || 1), 0, 1);
  return { x: track.x(a.x + mix * (b.x - a.x)), y: track.y(a.y + mix * (b.y - a.y)) };
}

function pixels(c) {
  return (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
}

function label(c, value, x, y, color, size = 7) {
  c.fillStyle = color;
  c.font = `bold ${size}px monospace`;
  c.textAlign = 'left';
  c.fillText(value, Math.round(x), Math.round(y));
}

function glasshouse(r, c, generation) {
  const p = palette;
  r(0, 0, W, H, p.glass);
  r(0, 16, W, 14, '#bfdcc2');
  r(0, 30, W, 18, '#cce1c4');
  r(0, 48, W, 35, '#d6e6c3');
  // Beyond the glass: distant reeds and a clipped hill line.
  for (let x = 0; x < W; x += 5) {
    const ridge = 60 + 6 * Math.sin(x * .028) + 3 * Math.cos(x * .082);
    r(x, ridge, 5, 28, '#b3ceaa');
    if (x % 15 === 0) r(x + 2, ridge - 3, 2, 5, '#aac6a3');
  }
  for (let x = 8; x < W; x += 64) {
    r(x, 0, 3, 83, p.post);
    r(x + 3, 0, 2, 83, '#88aa91');
    for (let j = 0; j < 7; j++) r(x + 8 + j * 3, 37 - j * 2, 3, 1, '#d5e7cb');
  }
  r(0, 0, W, 5, p.frame);
  r(0, 15, W, 3, '#80a18b');
  r(0, 82, W, 5, p.frame);
  // Two pendant lamps with square shades.
  for (const x of [100, 348]) {
    r(x, 2, 2, 12, p.frame);
    r(x - 6, 13, 14, 3, '#718c76');
    r(x - 11, 16, 24, 4, p.frame);
    r(x - 9, 20, 20, 2, '#f7e4a8');
  }
  r(9, 8, 49, 18, p.frame);
  r(11, 10, 45, 14, '#cee0bd');
  label(c, 'GEN ' + String(generation).padStart(2, '0'), 15, 20, p.frame, 8);
}

function waterTank(r, c, track) {
  const p = palette;
  r(0, 118, W, 32, '#759989');
  for (let x = 0; x < W; x += 34) r(x, 131, 32, 1, '#8ca899');
  r(57, 88, 398, 37, p.frame);
  r(60, 90, 392, 32, '#a9d1bc');
  r(62, WATER, 388, 26, p.sea);
  r(62, WATER + 13, 388, 13, p.deep);
  r(62, WATER, 388, 2, p.foam);
  for (let i = 0; i < 22; i++) {
    const x = 65 + (i * 43) % 377, y = 97 + (i * 11) % 17;
    r(x, y, 4 + (i % 4), 1, i % 2 ? '#75b1a7' : '#62a29e');
  }
  r(60, 119, 392, 2, '#b9d4b7');
  for (const x of [68, 221, 431]) {
    r(x, 125, 5, 16, p.frame);
    r(x - 2, 141, 9, 2, '#45685c');
  }
  r(58, 126, 396, 6, '#acc5ae');
  if (track) {
    for (let distance = 0; distance <= track.span; distance += track.tick) {
      const x = track.x(track.first.x + distance);
      r(x, 126, 1, 6, p.frame);
      label(c, distance + 'm', x - 2, 140, '#294b42', 7);
    }
  }
  // Throwing platform beside the tank.
  r(1, 104, 58, 8, '#ba9a71');
  r(1, 103, 58, 2, '#d9c394');
  r(8, 112, 4, 23, p.frame);
  r(49, 112, 4, 23, p.frame);
}

function technician(r, c, stone, progress, ready) {
  const p = palette;
  const windup = progress < .17, release = progress < .37 && !windup;
  const reach = windup ? Math.round(progress / .17 * 6) : 0;
  const lean = release ? 3 : windup ? -Math.round(reach / 3) : 0;
  c.save();
  c.translate(lean, 0);
  r(23, 89, 6, 13, p.ink);
  r(35, 89, 5, 13, '#527467');
  r(20, 100, 10, 3, '#344f48');
  r(35, 100, 10, 3, '#344f48');
  r(22, 73, 19, 20, p.shadow);
  r(24, 72, 14, 17, p.coat);
  r(29, 75, 4, 9, '#759f89');
  r(35, 84, 4, 3, '#b8d1b9');
  r(25, 52, 14, 4, '#665c48');
  r(22, 56, 19, 9, '#6b654d');
  r(24, 60, 16, 11, p.skin);
  r(38, 64, 5, 3, p.skin);
  r(24, 61, 17, 4, p.frame);
  r(28, 61, 4, 2, '#d4e8cf');
  r(36, 61, 3, 2, '#d4e8cf');
  r(36, 68, 3, 1, '#a77b67');
  r(24, 80, 5, 9, p.coat);
  if (windup) {
    r(17 - reach, 76 - reach, 10, 4, p.coat);
    r(15 - reach, 72 - reach, 4, 7, p.skin);
    drawOutline(c, stone, 16 - reach, 71 - reach, 4, 0, .6);
  } else if (release) {
    r(38, 73, 10, 5, p.coat);
    r(46, 70, 8, 4, p.skin);
    r(52, 68, 4, 3, p.skin);
  } else if (ready) {
    r(39, 74, 8, 4, p.coat);
    r(44, 71, 11, 13, '#9a805d');
    r(45, 72, 8, 9, '#eadaad');
    r(46, 75, 5, 1, p.post);
    r(46, 78, 3, 1, p.post);
    r(37, 80, 11, 3, p.skin);
  } else {
    r(38, 75, 6, 5, p.coat);
    r(42, 71, 4, 6, p.skin);
  }
  c.restore();
}

function scoreboard(r, c, trial, finished, skips, distance) {
  const p = palette;
  r(160, 4, 162, 27, p.frame);
  r(163, 7, 156, 21, '#294f4b');
  r(166, 10, 2, 15, trial?.objective === 'skips' ? '#a3c9af' : p.brass);
  r(246, 10, 2, 15, trial?.objective === 'skips' ? p.brass : '#a3c9af');
  label(c, '距离', 171, 17, '#b6d3bb', 8);
  label(c, distance.toFixed(1) + 'm', 191, 22, p.light, 11);
  label(c, '连漂', 251, 17, '#b6d3bb', 8);
  label(c, String(skips), 274, 22, p.light, 11);
  r(309, 12, 4, 4, finished ? p.brass : '#719988');
}

export function drawNurseryTrial(canvas, trial, progress, reducedMotion = false) {
  const c = canvas?.getContext?.('2d');
  if (!c || !canvas.width || !canvas.height) return;
  const track = trackFor(trial), stone = trial?.stone || {};
  const p = reducedMotion && track ? 1 : clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  const flight = clamp((p - .17) / .59, 0, 1);
  const done = !!track && p >= .76;
  c.save();
  c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  c.imageSmoothingEnabled = false;
  const r = pixels(c);
  glasshouse(r, c, Math.max(0, Math.floor(trial?.generation || 0)));
  waterTank(r, c, track);
  technician(r, c, stone, p, done);
  let distance = 0, skips = 0;
  if (track) {
    const time = track.first.t + flight * (track.last.t - track.first.t);
    const position = sample(track, time);
    distance = done ? Number(trial.distance) || 0 : (position.x - LAUNCH) * track.span / (FINISH - LAUNCH);
    // Draw a measured dotted track, retaining the entire trace at the end.
    const stride = Math.max(1, Math.floor(track.path.length / 100));
    for (let i = 0; i < track.path.length && track.path[i].t <= time; i += stride) {
      const point = track.path[i];
      r(track.x(point.x), track.y(point.y), 2, 1, '#7d9d83');
    }
    for (const hit of track.contacts) {
      if (hit.time > time || p < .17) break;
      const x = track.x(hit.x), age = time - hit.time;
      r(x, WATER + 2, 2, 2, palette.brass);
      if (hit.success !== false) skips++;
      if (!reducedMotion && age < .32 && !done) {
        const fade = age / .32, spread = Math.round(2 + fade * 7);
        const height = 2 + Math.sin(fade * Math.PI) * 7;
        r(x - spread, WATER - height, 2, 2, palette.foam);
        r(x + spread, WATER - height + 2, 2, 2, palette.foam);
        r(x - spread - 2, WATER + 1, spread * 2 + 4, 1, palette.foam);
      }
    }
    skips = Math.min(skips, Math.max(0, trial.skips || 0));
    if (done) skips = trial.skips || 0;
    if (p >= .17 && !done) drawOutline(c, stone, position.x, position.y, 4.6, flight * 18, .56);
    if (done) {
      // The tray returns on an overhead rail. The final pose is a still scorecard.
      const recovery = clamp((p - .76) / .20, 0, 1);
      const x = position.x + (435 - position.x) * recovery;
      const y = WATER - 3 - Math.min(recovery * 3, 1) * 24;
      r(61, 44, 389, 2, '#94ac93');
      r(x - 3, 42, 6, 5, palette.frame);
      r(x, 47, 1, y - 46, palette.post);
      r(x - 7, y + 3, 15, 2, '#947b5a');
      drawOutline(c, stone, x, y, 4.8, 0, .65);
    }
  }
  scoreboard(r, c, trial, done, skips, distance);
  c.restore();
}
