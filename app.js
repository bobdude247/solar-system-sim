const J2000_UTC_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const TWO_PI = Math.PI * 2;
const DAY_MS = 86_400_000;

const PLANETS = [
  {
    name: 'Mercury',
    a: 0.38709927,
    e: 0.20563593,
    i: 7.00497902,
    L: 252.2503235,
    varpi: 77.45779628,
    Omega: 48.33076593,
    periodDays: 87.969,
    color: '#a9a9a9',
    radiusPx: 3
  },
  {
    name: 'Venus',
    a: 0.72333566,
    e: 0.00677672,
    i: 3.39467605,
    L: 181.9790995,
    varpi: 131.60246718,
    Omega: 76.67984255,
    periodDays: 224.701,
    color: '#ffcb85',
    radiusPx: 5
  },
  {
    name: 'Earth',
    a: 1.00000261,
    e: 0.01671123,
    i: -0.00001531,
    L: 100.46457166,
    varpi: 102.93768193,
    Omega: 0,
    periodDays: 365.256,
    color: '#6ab8ff',
    radiusPx: 5
  },
  {
    name: 'Mars',
    a: 1.52371034,
    e: 0.0933941,
    i: 1.84969142,
    L: -4.55343205,
    varpi: -23.94362959,
    Omega: 49.55953891,
    periodDays: 686.98,
    color: '#ff7f5c',
    radiusPx: 4
  },
  {
    name: 'Jupiter',
    a: 5.202887,
    e: 0.04838624,
    i: 1.30439695,
    L: 34.39644051,
    varpi: 14.72847983,
    Omega: 100.47390909,
    periodDays: 4332.589,
    color: '#f4d6a0',
    radiusPx: 8
  },
  {
    name: 'Saturn',
    a: 9.53667594,
    e: 0.05386179,
    i: 2.48599187,
    L: 49.95424423,
    varpi: 92.59887831,
    Omega: 113.66242448,
    periodDays: 10_759.22,
    color: '#ffe49e',
    radiusPx: 7
  },
  {
    name: 'Uranus',
    a: 19.18916464,
    e: 0.04725744,
    i: 0.77263783,
    L: 313.23810451,
    varpi: 170.9542763,
    Omega: 74.01692503,
    periodDays: 30_688.5,
    color: '#9ee9f5',
    radiusPx: 6
  },
  {
    name: 'Neptune',
    a: 30.06992276,
    e: 0.00859048,
    i: 1.77004347,
    L: -55.12002969,
    varpi: 44.96476227,
    Omega: 131.78422574,
    periodDays: 60_182,
    color: '#7ea2ff',
    radiusPx: 6
  }
];

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

const speedInput = document.getElementById('speed');
const speedOut = document.getElementById('speedOut');
const pauseBtn = document.getElementById('pauseBtn');
const nowBtn = document.getElementById('nowBtn');
const scaleModeSelect = document.getElementById('scaleMode');
const simTimeEl = document.getElementById('simTime');
const scaleNoteEl = document.getElementById('scaleNote');

const state = {
  simTimeMs: Date.now(),
  lastFrameMs: performance.now(),
  speed: 31_557_600,
  speedLabel: '1 year / second',
  paused: false,
  scaleMode: 'exaggerated'
};

function degToRad(v) {
  return (v * Math.PI) / 180;
}

function normalizeAngle(rad) {
  let x = rad % TWO_PI;
  if (x < 0) x += TWO_PI;
  return x;
}

function solveKepler(meanAnomaly, eccentricity) {
  let E = meanAnomaly;
  for (let i = 0; i < 8; i += 1) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly;
    const fPrime = 1 - eccentricity * Math.cos(E);
    E -= f / fPrime;
  }
  return E;
}

function planetHeliocentricPositionAU(planet, timeMs) {
  const daysFromJ2000 = (timeMs - J2000_UTC_MS) / DAY_MS;
  const n = TWO_PI / planet.periodDays;

  const w = degToRad(planet.varpi - planet.Omega);
  const M0 = degToRad(planet.L - planet.varpi);
  const M = normalizeAngle(M0 + n * daysFromJ2000);

  const E = solveKepler(M, planet.e);
  const xv = planet.a * (Math.cos(E) - planet.e);
  const yv = planet.a * Math.sqrt(1 - planet.e ** 2) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const i = degToRad(planet.i);
  const O = degToRad(planet.Omega);
  const xh = r * (Math.cos(O) * Math.cos(v + w) - Math.sin(O) * Math.sin(v + w) * Math.cos(i));
  const yh = r * (Math.sin(O) * Math.cos(v + w) + Math.cos(O) * Math.sin(v + w) * Math.cos(i));

  return { xAU: xh, yAU: yh };
}

function worldToCanvas(xAU, yAU, centerX, centerY, pxPerAU) {
  return {
    x: centerX + xAU * pxPerAU,
    y: centerY + yAU * pxPerAU
  };
}

function getPxPerAU(width, height, mode) {
  const pad = 72;
  const maxR = Math.max(...PLANETS.map((p) => p.a * (1 + p.e)));
  const realistic = (Math.min(width, height) * 0.5 - pad) / maxR;

  if (mode === 'realistic') return realistic;
  const exaggerated = (Math.min(width, height) * 0.5 - pad) / Math.sqrt(maxR);
  return exaggerated;
}

function orbitDisplayRadiusAU(planetA, mode) {
  return mode === 'realistic' ? planetA : Math.sqrt(planetA);
}

function projectCoord(v, mode) {
  if (mode === 'realistic') return v;
  return Math.sign(v) * Math.sqrt(Math.abs(v));
}

function drawLabel(text, x, y) {
  ctx.font = '12px Segoe UI, Arial, sans-serif';
  ctx.fillStyle = '#d9e4ff';
  ctx.fillText(text, x + 6, y - 6);
}

function drawBackground(w, h) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, h * 0.7);
  g.addColorStop(0, '#0d1426');
  g.addColorStop(1, '#04080f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function render() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const pxScale = getPxPerAU(w, h, state.scaleMode);

  drawBackground(w, h);

  for (const planet of PLANETS) {
    const orbitR = orbitDisplayRadiusAU(planet.a, state.scaleMode) * pxScale;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(185, 208, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, TWO_PI);
  ctx.fillStyle = '#ffd36c';
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  drawLabel('Sun', cx, cy);

  for (const planet of PLANETS) {
    const pos = planetHeliocentricPositionAU(planet, state.simTimeMs);
    const plotX = projectCoord(pos.xAU, state.scaleMode);
    const plotY = projectCoord(pos.yAU, state.scaleMode);
    const p = worldToCanvas(plotX, plotY, cx, cy, pxScale);

    ctx.beginPath();
    ctx.arc(p.x, p.y, planet.radiusPx, 0, TWO_PI);
    ctx.fillStyle = planet.color;
    ctx.fill();
    drawLabel(planet.name, p.x, p.y);
  }

  simTimeEl.textContent = `${new Date(state.simTimeMs).toISOString()} (${state.speedLabel})`;
  if (state.scaleMode === 'realistic') {
    scaleNoteEl.textContent = 'Distance-proportional AU projection fit to screen.';
  } else {
    scaleNoteEl.textContent = 'Exaggerated distance mapping (sqrt) fit to screen.';
  }
}

function frame(nowMs) {
  const dt = nowMs - state.lastFrameMs;
  state.lastFrameMs = nowMs;

  if (!state.paused) {
    state.simTimeMs += dt * state.speed;
  }

  render();
  requestAnimationFrame(frame);
}

function resizeCanvasToDisplaySize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const nextW = Math.round(rect.width * dpr);
  const nextH = Math.round(rect.height * dpr);

  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW;
    canvas.height = nextH;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

speedInput.addEventListener('change', () => {
  state.speed = Number(speedInput.value);
  state.speedLabel = speedInput.options[speedInput.selectedIndex].textContent;
  speedOut.textContent = state.speedLabel;
});

pauseBtn.addEventListener('click', () => {
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
});

nowBtn.addEventListener('click', () => {
  state.simTimeMs = Date.now();
  state.paused = false;
  pauseBtn.textContent = 'Pause';
});

scaleModeSelect.addEventListener('change', () => {
  state.scaleMode = scaleModeSelect.value;
});

window.addEventListener('resize', resizeCanvasToDisplaySize);

speedInput.value = String(state.speed);
speedOut.textContent = state.speedLabel;
resizeCanvasToDisplaySize();
requestAnimationFrame((t) => {
  state.lastFrameMs = t;
  frame(t);
});

