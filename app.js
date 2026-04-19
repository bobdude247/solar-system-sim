const AU_KM = 149_597_870.7;
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
const zoomInput = document.getElementById('zoom');
const zoomOut = document.getElementById('zoomOut');
const planetLabelsToggle = document.getElementById('planetLabelsToggle');
const moonLabelsToggle = document.getElementById('moonLabelsToggle');
const orbitPathsToggle = document.getElementById('orbitPathsToggle');
const pauseBtn = document.getElementById('pauseBtn');
const nowBtn = document.getElementById('nowBtn');
const scaleModeSelect = document.getElementById('scaleMode');
const simTimeEl = document.getElementById('simTime');
const scaleNoteEl = document.getElementById('scaleNote');
const speedDetailEl = document.getElementById('speedDetail');

const SPEED_PRESETS = [
  { rate: 1, label: 'Real time (1x)' },
  { rate: 2, label: '2 seconds / second' },
  { rate: 5, label: '5 seconds / second' },
  { rate: 10, label: '10 seconds / second' },
  { rate: 30, label: '30 seconds / second' },
  { rate: 60, label: '1 minute / second' },
  { rate: 300, label: '5 minutes / second' },
  { rate: 3600, label: '1 hour / second' },
  { rate: 86_400, label: '1 day / second' },
  { rate: 259_200, label: '3 days / second' },
  { rate: 604_800, label: '1 week / second' },
  { rate: 1_209_600, label: '2 weeks / second' },
  { rate: 2_592_000, label: '30 days / second' },
  { rate: 31_557_600, label: '1 year / second' },
  { rate: 94_672_800, label: '3 years / second' },
  { rate: 157_788_000, label: '5 years / second' },
  { rate: 315_576_000, label: '10 years / second' },
  { rate: 631_152_000, label: '20 years / second' },
  { rate: 1_577_880_000, label: '50 years / second' },
  { rate: 3_155_760_000, label: '100 years / second' },
  { rate: 6_311_520_000, label: '200 years / second' }
];

const MOONS_BY_PLANET = {
  Earth: [
    { name: 'Moon', aKm: 384_400, periodDays: 27.321661, phaseDeg: 35, color: '#d9d9d9', radiusPx: 1.9 }
  ],
  Mars: [
    { name: 'Phobos', aKm: 9_376, periodDays: 0.31891, phaseDeg: 110, color: '#bfa98c', radiusPx: 1.2 },
    { name: 'Deimos', aKm: 23_463, periodDays: 1.263, phaseDeg: 250, color: '#9f8f7a', radiusPx: 1.2 }
  ],
  Jupiter: [
    { name: 'Io', aKm: 421_700, periodDays: 1.769, phaseDeg: 15, color: '#f9d57d', radiusPx: 1.7 },
    { name: 'Europa', aKm: 671_034, periodDays: 3.551, phaseDeg: 110, color: '#c8d4e6', radiusPx: 1.7 },
    { name: 'Ganymede', aKm: 1_070_412, periodDays: 7.155, phaseDeg: 210, color: '#a8967d', radiusPx: 1.9 },
    { name: 'Callisto', aKm: 1_882_709, periodDays: 16.689, phaseDeg: 300, color: '#8d8173', radiusPx: 1.9 }
  ],
  Saturn: [
    { name: 'Mimas', aKm: 185_539, periodDays: 0.942, phaseDeg: 30, color: '#a9a8a4', radiusPx: 1.2 },
    { name: 'Enceladus', aKm: 238_042, periodDays: 1.37, phaseDeg: 70, color: '#ebf6ff', radiusPx: 1.3 },
    { name: 'Tethys', aKm: 294_672, periodDays: 1.888, phaseDeg: 120, color: '#d7d6ce', radiusPx: 1.3 },
    { name: 'Dione', aKm: 377_415, periodDays: 2.737, phaseDeg: 180, color: '#c6c5be', radiusPx: 1.3 },
    { name: 'Rhea', aKm: 527_108, periodDays: 4.518, phaseDeg: 240, color: '#bdb9af', radiusPx: 1.5 },
    { name: 'Titan', aKm: 1_221_870, periodDays: 15.945, phaseDeg: 300, color: '#d9b77f', radiusPx: 2.2 },
    { name: 'Iapetus', aKm: 3_560_820, periodDays: 79.321, phaseDeg: 20, color: '#8b8275', radiusPx: 1.8 }
  ],
  Uranus: [
    { name: 'Miranda', aKm: 129_390, periodDays: 1.413, phaseDeg: 20, color: '#bdbab5', radiusPx: 1.2 },
    { name: 'Ariel', aKm: 191_020, periodDays: 2.52, phaseDeg: 75, color: '#d6d3cb', radiusPx: 1.3 },
    { name: 'Umbriel', aKm: 266_300, periodDays: 4.144, phaseDeg: 145, color: '#7a7d82', radiusPx: 1.4 },
    { name: 'Titania', aKm: 435_910, periodDays: 8.706, phaseDeg: 225, color: '#bcb7ae', radiusPx: 1.5 },
    { name: 'Oberon', aKm: 583_520, periodDays: 13.463, phaseDeg: 310, color: '#a8a8a3', radiusPx: 1.5 }
  ],
  Neptune: [
    { name: 'Proteus', aKm: 117_647, periodDays: 1.122, phaseDeg: 40, color: '#8b8f95', radiusPx: 1.3 },
    { name: 'Triton', aKm: 354_759, periodDays: 5.877, phaseDeg: 180, color: '#d4d7db', radiusPx: 1.9 },
    { name: 'Nereid', aKm: 5_513_818, periodDays: 360.14, phaseDeg: 290, color: '#9ba5b8', radiusPx: 1.3 }
  ]
};

const state = {
  simTimeMs: Date.now(),
  lastFrameMs: performance.now(),
  speed: SPEED_PRESETS[12].rate,
  speedLabel: '30 days / second',
  speedIndex: 12,
  zoomPercent: 260,
  showPlanetLabels: true,
  showMoonLabels: true,
  showOrbitPaths: true,
  paused: false,
  scaleMode: 'exaggerated'
};

function applyZoomBoundsByScaleMode() {
  const maxZoom = 4000;
  zoomInput.max = String(maxZoom);

  if (state.zoomPercent > maxZoom) {
    state.zoomPercent = maxZoom;
  }

  zoomInput.value = String(state.zoomPercent);
  zoomOut.textContent = `${state.zoomPercent}%`;
}

function formatMultiplierWords(multiplier) {
  if (multiplier < 1000) return `${multiplier.toFixed(0)}x realtime`;
  if (multiplier < 1_000_000) return `about ${(multiplier / 1000).toFixed(1)} thousand x realtime`;
  if (multiplier < 1_000_000_000) return `about ${(multiplier / 1_000_000).toFixed(2)} million x realtime`;
  return `about ${(multiplier / 1_000_000_000).toFixed(2)} billion x realtime`;
}

function applySpeedIndex(index) {
  const clamped = Math.max(0, Math.min(SPEED_PRESETS.length - 1, index));
  const preset = SPEED_PRESETS[clamped];

  state.speedIndex = clamped;
  state.speed = preset.rate;
  state.speedLabel = preset.label;

  speedInput.value = String(clamped);
  speedOut.textContent = preset.label;
  speedDetailEl.textContent = `${formatMultiplierWords(preset.rate)} (${preset.rate.toLocaleString()}x)`;
}

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

function moonRelativePositionAU(moon, timeMs) {
  const daysFromJ2000 = (timeMs - J2000_UTC_MS) / DAY_MS;
  const n = TWO_PI / moon.periodDays;
  const phase0 = degToRad(moon.phaseDeg || 0);
  const anomaly = normalizeAngle(phase0 + n * daysFromJ2000);
  const aAU = moon.aKm / AU_KM;

  return {
    xAU: aAU * Math.cos(anomaly),
    yAU: aAU * Math.sin(anomaly),
    rAU: aAU
  };
}

function worldToCanvas(xAU, yAU, centerX, centerY, pxPerAU) {
  return {
    x: centerX + xAU * pxPerAU,
    y: centerY + yAU * pxPerAU
  };
}

function projectedRadiusForDistance(distanceAU, mode) {
  if (mode === 'realistic') return distanceAU;
  return Math.sqrt(distanceAU);
}

function getPxPerAU(width, height, mode) {
  const drawRadius = Math.min(width, height) * 0.5;
  const edgeReservePx = 140;
  const usableRadius = Math.max(24, drawRadius - edgeReservePx);

  // Use apoapsis so every planet stays visible at any timestamp.
  const maxProjectedRadius = Math.max(
    ...PLANETS.map((p) => projectedRadiusForDistance(p.a * (1 + p.e), mode))
  );

  const baseScale = usableRadius / maxProjectedRadius;
  return baseScale * (state.zoomPercent / 100);
}

function orbitDisplayRadiusAU(planetA, mode) {
  return mode === 'realistic' ? planetA : Math.sqrt(planetA);
}

function projectPoint(xAU, yAU, mode) {
  if (mode === 'realistic') {
    return { x: xAU, y: yAU };
  }

  const r = Math.sqrt(xAU * xAU + yAU * yAU);
  const theta = Math.atan2(yAU, xAU);
  const rp = Math.sqrt(r);

  return {
    x: rp * Math.cos(theta),
    y: rp * Math.sin(theta)
  };
}

function drawLabel(text, x, y, viewW, viewH) {
  ctx.font = '12px Segoe UI, Arial, sans-serif';
  ctx.fillStyle = '#d9e4ff';

  const margin = 8;
  const textWidth = ctx.measureText(text).width;

  let lx = x + 8;
  let ly = y - 8;

  if (lx + textWidth > viewW - margin) {
    lx = x - textWidth - 8;
  }

  if (ly < 14) {
    ly = y + 14;
  }

  if (ly > viewH - margin) {
    ly = viewH - margin;
  }

  ctx.fillText(text, lx, ly);
}

function drawBackground(w, h) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, h * 0.7);
  g.addColorStop(0, '#0d1426');
  g.addColorStop(1, '#04080f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function drawPlanetOrbitPath(planet, cx, cy, pxScale, mode) {
  const steps = 220;
  const w = degToRad(planet.varpi - planet.Omega);
  const i = degToRad(planet.i);
  const O = degToRad(planet.Omega);

  ctx.beginPath();
  for (let s = 0; s <= steps; s += 1) {
    const E = (s / steps) * TWO_PI;
    const xv = planet.a * (Math.cos(E) - planet.e);
    const yv = planet.a * Math.sqrt(1 - planet.e ** 2) * Math.sin(E);
    const v = Math.atan2(yv, xv);
    const r = Math.sqrt(xv * xv + yv * yv);

    const xh = r * (Math.cos(O) * Math.cos(v + w) - Math.sin(O) * Math.sin(v + w) * Math.cos(i));
    const yh = r * (Math.sin(O) * Math.cos(v + w) + Math.cos(O) * Math.sin(v + w) * Math.cos(i));

    const projected = projectPoint(xh, yh, mode);
    const p = worldToCanvas(projected.x, projected.y, cx, cy, pxScale);

    if (s === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = 'rgba(185, 208, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMoonOrbitPath(planetPos, moon, cx, cy, pxScale, mode, moonScaleBoost, planetCanvas) {
  const steps = 120;
  ctx.beginPath();

  for (let s = 0; s <= steps; s += 1) {
    const theta = (s / steps) * TWO_PI;
    const aAU = moon.aKm / AU_KM;
    const moonAbsX = planetPos.xAU + aAU * Math.cos(theta);
    const moonAbsY = planetPos.yAU + aAU * Math.sin(theta);
    const moonProjected = projectPoint(moonAbsX, moonAbsY, mode);
    const moonCanvas = worldToCanvas(moonProjected.x, moonProjected.y, cx, cy, pxScale);

    const moonDrawX = planetCanvas.x + (moonCanvas.x - planetCanvas.x) * moonScaleBoost;
    const moonDrawY = planetCanvas.y + (moonCanvas.y - planetCanvas.y) * moonScaleBoost;

    if (s === 0) ctx.moveTo(moonDrawX, moonDrawY);
    else ctx.lineTo(moonDrawX, moonDrawY);
  }

  ctx.strokeStyle = 'rgba(180, 190, 215, 0.2)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function render() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const pxScale = getPxPerAU(w, h, state.scaleMode);
  const moonScaleBoost = Math.max(1, state.zoomPercent / 70);
  const drawMoonOrbits = state.zoomPercent >= 220;

  drawBackground(w, h);

  if (state.showOrbitPaths) {
    for (const planet of PLANETS) {
      drawPlanetOrbitPath(planet, cx, cy, pxScale, state.scaleMode);
    }
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, TWO_PI);
  ctx.fillStyle = '#ffd36c';
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 24;
  ctx.fill();
  ctx.shadowBlur = 0;
  if (state.showPlanetLabels) {
    drawLabel('Sun', cx, cy, w, h);
  }

  for (const planet of PLANETS) {
    const pos = planetHeliocentricPositionAU(planet, state.simTimeMs);
    const projected = projectPoint(pos.xAU, pos.yAU, state.scaleMode);
    const p = worldToCanvas(projected.x, projected.y, cx, cy, pxScale);

    ctx.beginPath();
    ctx.arc(p.x, p.y, planet.radiusPx, 0, TWO_PI);
    ctx.fillStyle = planet.color;
    ctx.fill();
    if (state.showPlanetLabels) {
      drawLabel(planet.name, p.x, p.y, w, h);
    }

    const moons = MOONS_BY_PLANET[planet.name] || [];
    for (const moon of moons) {
      const rel = moonRelativePositionAU(moon, state.simTimeMs);

      const moonAbsX = pos.xAU + rel.xAU;
      const moonAbsY = pos.yAU + rel.yAU;
      const moonProjected = projectPoint(moonAbsX, moonAbsY, state.scaleMode);
      const mp = worldToCanvas(moonProjected.x, moonProjected.y, cx, cy, pxScale);

      if (state.showOrbitPaths && drawMoonOrbits) {
        drawMoonOrbitPath(pos, moon, cx, cy, pxScale, state.scaleMode, moonScaleBoost, p);
      }

      const moonDrawX = p.x + (mp.x - p.x) * moonScaleBoost;
      const moonDrawY = p.y + (mp.y - p.y) * moonScaleBoost;

      ctx.beginPath();
      ctx.arc(moonDrawX, moonDrawY, moon.radiusPx, 0, TWO_PI);
      ctx.fillStyle = moon.color;
      ctx.fill();

      if (state.showMoonLabels) {
        drawLabel(moon.name, moonDrawX, moonDrawY, w, h);
      }
    }
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

speedInput.addEventListener('input', () => {
  applySpeedIndex(Number(speedInput.value));
});

zoomInput.addEventListener('input', () => {
  state.zoomPercent = Number(zoomInput.value);
  zoomOut.textContent = `${state.zoomPercent}%`;
});

planetLabelsToggle.addEventListener('change', () => {
  state.showPlanetLabels = planetLabelsToggle.checked;
});

moonLabelsToggle.addEventListener('change', () => {
  state.showMoonLabels = moonLabelsToggle.checked;
});

orbitPathsToggle.addEventListener('change', () => {
  state.showOrbitPaths = orbitPathsToggle.checked;
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
  applyZoomBoundsByScaleMode();
});

window.addEventListener('resize', resizeCanvasToDisplaySize);

speedInput.max = String(SPEED_PRESETS.length - 1);
applySpeedIndex(state.speedIndex);
applyZoomBoundsByScaleMode();
planetLabelsToggle.checked = state.showPlanetLabels;
moonLabelsToggle.checked = state.showMoonLabels;
orbitPathsToggle.checked = state.showOrbitPaths;
resizeCanvasToDisplaySize();
requestAnimationFrame((t) => {
  state.lastFrameMs = t;
  frame(t);
});

