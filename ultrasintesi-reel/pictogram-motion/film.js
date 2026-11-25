// 04 · Pictogram Motion — beat-locked catalogue (120 bpm). Chapter card in full-contrast pattern → three cards
// (01 graphic · 02 motion · 03 editorial), each one pictogram doing one action on a sun disc, a huge 900 title, the
// Italian line under it, a mono HUD with a tick bar → rows slide → the wordmark card: its sun disc shrinks into the ı.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, seg, clamp, lerp, mulberry, wordmark, drawWordmark, fillT, textW, mono, expoOut, expoInOut } from './shared/core.js';

const { ctx } = setup({ dur: 6, fps: 24 });
const CELL = 180, COLS = 13, ROWS = 6;
const INK = BRAND.ink, CREAM = '#F7F8F6';
const HUES = {
  ultra: { tones: ['#111877', '#1D28B4', '#2F3DF2', '#717AF7', '#B8BDFB'], light: false },
  acqua: { tones: ['#3D6382', '#6A91B1', '#A9C6DC', '#C8DBE9', '#E5EEF5'], light: true },
  ink: { tones: ['#0E1527', '#1B2744', '#2B3A5D', '#42547D', '#6B7CA4'], light: false },
  cielo: { tones: ['#A7BED2', '#C0D3E2', '#D6E4EE', '#E7EFF5', '#F7F8F6'], light: true },
};
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// ---------- the pattern: five tones of one hue, discs and half-discs on the grid, motifs in half the cells ----------
const patCache = new Map();
function pattern(hue, seed, contrast) {
  const key = hue + seed + contrast; if (patCache.has(key)) return patCache.get(key);
  const c = mk(COLS * CELL, ROWS * CELL), g = c.getContext('2d'), r = mulberry(seed);
  const T = HUES[hue].tones, base = T[1];
  const mix = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  const tone = i => contrast < 1 ? mix(T[2], T[i], contrast) : T[i];
  g.fillStyle = tone(1); g.fillRect(0, 0, c.width, c.height);
  const pick = () => tone([0, 2, 3, 4][Math.floor(r() * 4)]);
  for (let y = 0; y <= ROWS; y++) for (let x = 0; x <= COLS; x++) if (r() < .16) {   // big node discs
    g.fillStyle = pick(); g.beginPath(); g.arc(x * CELL, y * CELL, CELL, 0, 7); g.fill();
    if (r() < .5) { g.fillStyle = pick(); g.beginPath(); g.arc(x * CELL, y * CELL, CELL * .5, 0, 7); g.fill(); }
  }
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const cx = x * CELL, cy = y * CELL;
    if (r() < .22) { g.fillStyle = pick(); g.beginPath(); g.arc(cx + CELL / 2, cy + CELL / 2, CELL / 2, 0, 7); g.fill(); }
    if (r() < .5) motif(g, cx, cy, Math.floor(r() * 8), Math.floor(r() * 4), pick(), pick(), r);
  }
  patCache.set(key, c); return c;
}
function motif(g, x, y, kind, rot, a, b, r) {
  const s = CELL; g.save(); g.translate(x + s / 2, y + s / 2); g.rotate(rot * Math.PI / 2); g.translate(-s / 2, -s / 2);
  g.beginPath(); g.rect(0, 0, s, s); g.clip(); g.fillStyle = a; g.strokeStyle = a;
  if (kind === 0) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, s, 0, Math.PI / 2); g.fill(); }
  else if (kind === 1) { for (let j = 0; j < 4; j++) for (let i = -1; i < 4; i++) { g.fillStyle = (i + j) % 2 ? a : b; g.beginPath(); g.arc(i * s / 3 + (j % 2) * s / 6 + s / 6, j * s / 4 + s / 4, s / 6, Math.PI, 0); g.fill(); } }
  else if (kind === 2) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(s / 8 + i * s / 4, s / 8 + j * s / 4, s / 18, 0, 7); g.fill(); } }
  else if (kind === 3) { g.lineWidth = s / 14; for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(0, s, k * s / 4.6, -Math.PI / 2, 0); g.stroke(); } }
  else if (kind === 4) { g.beginPath(); g.arc(s / 2, s / 2, s * .22, 0, 7); g.fill(); g.lineWidth = s / 22; g.lineCap = 'round'; for (let k = 0; k < 12; k++) { const t = k / 12 * Math.PI * 2; g.beginPath(); g.moveTo(s / 2 + Math.cos(t) * s * .3, s / 2 + Math.sin(t) * s * .3); g.lineTo(s / 2 + Math.cos(t) * s * .44, s / 2 + Math.sin(t) * s * .44); g.stroke(); } }
  else if (kind === 5) { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if ((i + j) % 2 === 0) g.fillRect(i * s / 3, j * s / 3, s / 3, s / 3); }
  else if (kind === 6) { g.beginPath(); g.arc(s / 2, s / 2, s * .38, 0, 7); g.fill(); g.fillStyle = b; g.beginPath(); g.arc(s * .64, s * .42, s * .32, 0, 7); g.fill(); }
  else { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(i * s / 3, (j + 1) * s / 3); g.lineTo(i * s / 3 + s / 6, j * s / 3 + s / 24); g.lineTo((i + 1) * s / 3, (j + 1) * s / 3); g.fill(); } }
  g.restore();
}
// rows drift in alternating directions; `jump` adds a quarter-cell step on each beat (chapter cards)
function drawPattern(g, pat, t, { jump = false, shift = null } = {}) {
  for (let row = 0; row < ROWS; row++) {
    const dir = row % 2 ? 1 : -1;
    let off = dir * t * 22 + (jump ? dir * Math.floor(t * 2) * CELL / 4 : 0) + (shift ? shift(row) : 0);
    off = ((off % CELL) + CELL) % CELL - CELL;
    g.drawImage(pat, 0, row * CELL, pat.width, CELL, off, row * CELL, pat.width, CELL);
  }
}

// ---------- pictograms: round-capped bars, discs, half-discs, capsules; one stroke family; ≤ 2 tones ----------
const SW = 30;
function bar(g, x0, y0, x1, y1, w = SW) { g.lineCap = 'round'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
function pictoGraphic(g, k, c1, c2) {           // a pen nib drawing a line
  const draw = clamp(k / .8);
  g.strokeStyle = c1; bar(g, -230, 170, lerp(-230, 120, draw), 170 - Math.sin(draw * Math.PI) * 60 * draw);
  g.save(); g.translate(lerp(-230, 120, draw) + 4, 170 - Math.sin(draw * Math.PI) * 60 * draw - 4); g.rotate(-.65);
  g.fillStyle = c1; g.beginPath(); g.moveTo(0, 0); g.lineTo(-62, -120); g.quadraticCurveTo(0, -160, 62, -120); g.closePath(); g.fill();
  g.fillRect(-62, -230, 124, 100); g.beginPath(); g.arc(0, -230, 62, Math.PI, 0); g.fill();
  g.fillStyle = c2; g.beginPath(); g.arc(0, -100, 15, 0, 7); g.fill(); g.fillRect(-4, -100, 8, 92);
  g.restore();
}
function pictoMotion(g, k, c1, c2) {             // a disc travelling an arc, trailing capsules
  const p = clamp(k / .85), ang = lerp(Math.PI * 1.05, Math.PI * 1.95, p);
  const P = a => [Math.cos(a) * 210, 120 + Math.sin(a) * 210];
  g.strokeStyle = c2;
  for (let i = 1; i <= 3; i++) { const a0 = ang - i * .2, a1 = ang - i * .2 - .12; const [x0, y0] = P(a0), [x1, y1] = P(a1); bar(g, x0, y0, x1, y1, 44 - i * 8); }
  const [x, y] = P(ang); g.fillStyle = c1; g.beginPath(); g.arc(x, y, 62, 0, 7); g.fill();
  g.strokeStyle = c1; bar(g, -250, 200, 250, 200, 22);
}
function pictoEditorial(g, k, c1, c2) {          // an open magazine whose right page turns
  const p = clamp((k - .15) / .6), sx = Math.cos(p * Math.PI);
  g.fillStyle = c1;
  g.beginPath(); g.moveTo(-14, -150); g.lineTo(-250, -175); g.lineTo(-250, 165); g.lineTo(-14, 190); g.closePath(); g.fill();
  g.strokeStyle = c2; for (let i = 0; i < 4; i++) bar(g, -205, -100 + i * 66 - i * 2, -70, -88 + i * 66, 16);
  g.save(); g.scale(sx, 1); g.fillStyle = sx > 0 ? c1 : c2;
  g.beginPath(); g.moveTo(14, -150); g.lineTo(250, -175); g.lineTo(250, 165); g.lineTo(14, 190); g.closePath(); g.fill();
  if (sx > 0) { g.fillStyle = c2; g.beginPath(); g.arc(132, -60, 52, 0, 7); g.fill(); g.strokeStyle = c2; bar(g, 70, 80, 200, 70, 16); bar(g, 70, 132, 160, 126, 16); }
  g.restore();
  g.strokeStyle = c1; bar(g, 0, -150, 0, 190, 20);
}

const CARDS = [
  { t0: .5, t1: 1.25, hue: 'acqua', title: 'GRAPHIC', it: 'GRAFICA', tag: 'IDENTITY · TYPE · POSTER', picto: pictoGraphic, seed: 3 },
  { t0: 1.25, t1: 2.0, hue: 'ultra', title: 'MOTION', it: 'MOVIMENTO', tag: 'TIME · RHYTHM · LOOP', picto: pictoMotion, seed: 5 },
  { t0: 2.0, t1: 3.0, hue: 'ink', title: 'EDITORIAL', it: 'EDITORIA', tag: 'PAGE · GRID · STORY', picto: pictoEditorial, seed: 8 },
];
const BUF = [mk(), mk()], PIC = mk(900, 900);
let M;

function hud(g, t, idx, light) {
  const col = light ? INK : CREAM;
  mono(g, 'ULTRASINTESI — REBRAND 2026', 96, 70, 20, col, { ls: 3.5 });
  mono(g, `${String(idx + 1).padStart(2, '0')} / 04`, W - 96, 70, 20, col, { ls: 3.5, align: 'right' });
  for (let i = 0; i < 4; i++) {                                     // the tick bar: current tall, done dimmed, rest faint
    g.globalAlpha = i === idx ? 1 : i < idx ? .55 : .22; g.fillStyle = col;
    const h = i === idx ? 26 : 12; g.fillRect(96 + i * 22, H - 70 - h, 10, h);
  }
  g.globalAlpha = 1;
  mono(g, 'LUCE + MATERIA → FORMA', W - 96, H - 70, 18, col, { ls: 3, align: 'right' });
}
function maskUp(g, font, s, x, y, k, col, ls = 0, h = 300) {
  if (k <= 0) return;
  g.save(); g.beginPath(); g.rect(x - 10, y - h, 2000, h + 30); g.clip();
  fillT(g, font, s, x, y + (1 - k) * h * .9, col, ls); g.restore();
}

function renderCard(g, card, idx, t) {
  const k = t - card.t0, T = HUES[card.hue].tones, light = HUES[card.hue].light;
  const typeCol = light ? INK : CREAM;
  drawPattern(g, pattern(card.hue, card.seed, .28), t);
  // the stage: a sun disc in a neighbouring tone, one soft light sweep
  const SX = 1380, SY = 560, SR = 330;
  g.fillStyle = light ? T[4] : T[3]; g.beginPath(); g.arc(SX, SY, SR, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(SX, SY, SR, 0, 7); g.clip();
  const sw = g.createLinearGradient(SX - SR, SY - SR, SX + SR, SY + SR); sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(.45 + .1 * Math.sin(t), 'rgba(255,255,255,.14)'); sw.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sw; g.fillRect(SX - SR, SY - SR, 2 * SR, 2 * SR); g.restore();
  // the hero pictogram arrives as bands sliding into register from alternating sides
  const pg = PIC.getContext('2d'); pg.setTransform(1, 0, 0, 1, 0, 0); pg.clearRect(0, 0, 900, 900); pg.translate(450, 450);
  card.picto(pg, Math.max(0, k - .1) / (card.t1 - card.t0), light ? INK : CREAM, light ? T[1] : T[0]);
  const asm = expoOut(seg(k, 0, .22)), bands = 6;
  for (let b = 0; b < bands; b++) {
    const off = (1 - asm) * 520 * (b % 2 ? 1 : -1), y = b * 150;
    g.drawImage(PIC, 0, y, 900, 150, SX - 450 + off, SY - 450 + y, 900, 150);
  }
  // type: the title by mask slide-up, the Italian line ~0.08 s later, then the tag; meta types on
  const size = Math.min(250, 880 / (textW(g, '900 100px InterTight', card.title, -3) / 100));
  maskUp(g, `900 ${size}px InterTight`, card.title, 110, 560, expoOut(seg(k, 0, .2)), typeCol, -size * .03, size);
  maskUp(g, '800 92px InterTight', card.it, 116, 680, expoOut(seg(k, .08, .28)), typeCol, -2, 100);
  const tg = expoOut(seg(k, .14, .32));
  if (tg > 0) {
    const w = textW(g, '400 20px DMMono', card.tag, 3.5) + 36;
    g.fillStyle = typeCol; g.fillRect(116, 740 + (1 - tg) * 40, w, 40);
    mono(g, card.tag, 134, 767 + (1 - tg) * 40, 20, light ? T[4] : T[1], { ls: 3.5 });
  }
  hud(g, t, idx, light);
  txt('title' + idx, card.title, 110, 560 - size * .72, 110 + textW(g, `900 ${size}px InterTight`, card.title, -size * .03), 566);
  txt('it' + idx, card.it, 116, 612, 116 + textW(g, '800 92px InterTight', card.it, -2), 684);
}

function renderChapter(g, t) {
  drawPattern(g, pattern('ultra', 2, 1), t, { jump: true });
  const k = expoOut(seg(t, .05, .3));
  g.fillStyle = BRAND.ink; g.fillRect(96, 420, 760 * k, 240);
  if (k > .6) { maskUp(g, '900 120px InterTight', 'REBRAND', 130, 590, expoOut(seg(t, .12, .32)), CREAM, -3, 130); }
  hud(g, t, -1, false);
}

function renderFinal(g, t) {
  const k = t - 3.0, T = HUES.cielo.tones;
  drawPattern(g, pattern('cielo', 11, .5), t);
  g.fillStyle = 'rgba(247,248,246,.72)'; g.fillRect(0, 0, W, H);
  if (!M) M = wordmark(g, 230, -0.02);
  const wx = (W - M.width) / 2, wy = 560, dx = wx + M.dot.x, dy = wy + M.dot.y;
  // the sun disc shrinks into the point of the ı (exponential in-out, landing on the 3.5 s beat)
  const s = expoInOut(seg(k, 0, .5));
  const R = lerp(360, M.dot.r, s), X = lerp(W / 2, dx, s), Y = lerp(540, dy, s);
  g.fillStyle = BRAND.ultra; g.beginPath(); g.arc(X, Y, R, 0, 7); g.fill();
  const up = expoOut(seg(k, .24, .48));
  if (up > 0) {
    g.save(); g.beginPath(); g.rect(0, wy - M.asc - 20, W, M.asc + 26); g.clip();
    drawWordmark(g, M, wx, wy + (1 - up) * M.asc * 1.2, { color: INK, dot: false }); g.restore();
    txt('wordmark', 'ultrasintesi', wx, wy - M.asc, wx + M.width, wy);
  }
  const c1 = expoOut(seg(k, .36, .56)), c2 = expoOut(seg(k, .44, .64));
  const w1 = textW(g, '800 58px InterTight', CLAIM_IT, -1), w2 = textW(g, '400 24px DMMono', CLAIM_EN.toUpperCase(), 4);
  maskUp(g, '800 58px InterTight', CLAIM_IT, (W - w1) / 2, 690, c1, INK, -1, 70);
  if (c2 > 0) { g.save(); g.beginPath(); g.rect(0, 712, W, 40); g.clip(); mono(g, CLAIM_EN.toUpperCase(), W / 2, 742 + (1 - c2) * 40, 24, INK, { ls: 4, align: 'center' }); g.restore(); }
  if (c1 > 0) txt('claimIT', CLAIM_IT, (W - w1) / 2, 636, (W + w1) / 2, 704);
  if (c2 > 0) txt('claimEN', CLAIM_EN.toUpperCase(), (W - w2) / 2, 722, (W + w2) / 2, 746);
  hud(g, t, 3, true);
}

function renderAt(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (t < .5) renderChapter(g, t);
  else if (t < 3.0) { const i = CARDS.findIndex(c => t < c.t1); renderCard(g, CARDS[i], i, t); }
  else renderFinal(g, t);
}
// transitions snap to the grid: the outgoing shot's rows slide away, alternating directions, around each cut
const CUTS = [.5, 1.25, 2.0, 3.0], TW = .14;
function draw(t) {
  const cut = CUTS.find(c => t >= c - TW / 2 && t < c + TW / 2);
  if (cut == null) { renderAt(ctx, t); return; }
  const a = BUF[0].getContext('2d'), b = BUF[1].getContext('2d');
  renderAt(a, cut - .001 - (cut - TW / 2 > t ? 0 : 0)); renderAt(b, Math.max(t, cut));
  const p = expoInOut((t - (cut - TW / 2)) / TW);
  ctx.drawImage(BUF[1], 0, 0);
  for (let row = 0; row < ROWS; row++) ctx.drawImage(BUF[0], 0, row * CELL, W, CELL, (row % 2 ? 1 : -1) * p * W * (1 + row * .08), row * CELL, W, CELL);
}

start(draw, loadFonts(['IS', 'InterTight', 'DMMono', 'DMMonoM']));
