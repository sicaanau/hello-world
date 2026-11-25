// Shared toolkit for the seven Ultrasintesi intros: page contract, fonts, easing, the brand wordmark.
export * from '/core/lib.js';
import { clamp } from '/core/lib.js';

export const W = 1920, H = 1080;
export const BRAND = { luce: '#F7F8F6', cielo: '#D6E4EE', acqua: '#A9C6DC', ink: '#1B2744', ultra: '#2F3DF2' };
export const CLAIM_IT = 'Il tuo ultra, a fuoco.';
export const CLAIM_EN = 'Your ultra, in focus.';
export const DISCIPLINES = ['graphic', 'motion', 'editorial'];

const FONT_FILES = {
  IS: ['InstrumentSans.ttf', { weight: '400 700', stretch: '75% 100%' }],
  DMMono: ['DMMono-Regular.ttf', { weight: '400' }],
  DMMonoM: ['DMMono-Medium.ttf', { weight: '500' }],
  LeagueGothic: ['LeagueGothic.ttf', { weight: '400', stretch: '75% 100%' }],
  LeagueSpartan: ['LeagueSpartan.ttf', { weight: '100 900' }],
  Limelight: ['Limelight.ttf', { weight: '400' }],
  PoiretOne: ['PoiretOne.ttf', { weight: '400' }],
  Josefin: ['JosefinSans.ttf', { weight: '100 700' }],
  InterTight: ['InterTight.ttf', { weight: '100 900' }],
  Jost: ['Jost.ttf', { weight: '100 900' }],
  Anton: ['Anton.ttf', { weight: '400' }],
  BarlowC: ['BarlowCondensed-SemiBold.ttf', { weight: '600' }],
};

export async function loadFonts(names, probes = []) {
  for (const n of names) {
    const [file, desc] = FONT_FILES[n];
    const f = new FontFace(n, `url(fonts/${file})`, desc);
    document.fonts.add(await f.load());
  }
  for (const p of probes) await document.fonts.load(p);
}

export function setup({ dur, fps = 24 }) {
  document.body.style.cssText = 'margin:0;background:#000;overflow:hidden';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  cv.style.cssText = `display:block;width:${W}px;height:${H}px`;
  document.body.appendChild(cv);
  window.DUR = dur; window.FPS = fps;
  return { cv, ctx: cv.getContext('2d') };
}

// readcheck registry: every film records the texts it draws, with their boxes
const texts = [];
export function txt(id, text, x0, y0, x1, y1, pass) { texts.push({ id, text, x0, y0, x1, y1, ...(pass ? { pass: true } : {}) }); }

export async function start(draw, ready) {
  window.render = t => { texts.length = 0; draw(Math.max(0, Math.min(t, window.DUR - 1e-6))); };
  window.TEXTS = t => { window.render(t); return texts.slice(); };
  await ready;
  window.render(0);
  window.READY = true;
}

// cubic-bezier easing (x1,y1,x2,y2), solved by Newton + bisection
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s, dX = s => (3 * ax * s + 2 * bx) * s + cx;
  return t => {
    t = clamp(t); if (t === 0 || t === 1) return t;
    let s = t;
    for (let i = 0; i < 8; i++) { const e = X(s) - t, d = dX(s); if (Math.abs(e) < 1e-6) return Y(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
    let a = 0, b = 1; s = t;
    for (let i = 0; i < 30; i++) { const v = X(s); if (Math.abs(v - t) < 1e-6) break; if (t > v) a = s; else b = s; s = (a + b) / 2; }
    return Y(s);
  };
}
export const eoQuint = t => 1 - Math.pow(1 - clamp(t), 5);
export const expoOut = t => (t = clamp(t)) === 1 ? 1 : 1 - Math.pow(2, -10 * t);
export const expoInOut = t => { t = clamp(t); if (t === 0 || t === 1) return t; return t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; };

// ---------- the wordmark: "ultra" 700 + "sintesı" 400, the final dotless ı with a Blu Ultra point ----------
const WM = [...'ultra'].map(c => [c, 700]).concat([...'sintes'].map(c => [c, 400]), [['ı', 400]]);
export function wordmark(ctx, size, track = -0.02) {
  const ls = size * track;
  const letters = []; let x = 0;
  for (let i = 0; i < WM.length; i++) {
    const [ch, w] = WM[i];
    ctx.font = `${w} ${size}px IS`;
    const adv = ctx.measureText(ch).width;
    letters.push({ ch, weight: w, x, w: adv });
    x += adv + ls;
  }
  const width = x - ls;
  ctx.font = `400 ${size}px IS`;
  const xh = ctx.measureText('ı').actualBoundingBoxAscent;
  const iTop = ctx.measureText('i').actualBoundingBoxAscent;
  const asc = Math.max(ctx.measureText('l').actualBoundingBoxAscent, ctx.measureText('t').actualBoundingBoxAscent);
  const r = (iTop - xh) * 0.29;
  const last = letters[letters.length - 1];
  const dot = { x: last.x + last.w / 2, y: -(iTop - r * 1.3), r };
  return { size, letters, width, xh, asc, dot };
}
// draw at (x, baseline y). opts.letter(i) → {dx, dy, a, sx} per letter; opts.dot false hides the point
export function drawWordmark(ctx, m, x, y, opts = {}) {
  const { color = BRAND.ink, dotColor = BRAND.ultra, dot = true, letter } = opts;
  ctx.save(); ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  m.letters.forEach((L, i) => {
    const o = letter ? letter(i, L) : null;
    if (o && o.a === 0) return;
    ctx.font = `${L.weight} ${m.size}px IS`;
    ctx.globalAlpha = o && o.a != null ? o.a : 1;
    ctx.fillText(L.ch, x + L.x + (o?.dx || 0), y + (o?.dy || 0));
  });
  ctx.globalAlpha = 1;
  if (dot) { ctx.fillStyle = dotColor; ctx.beginPath(); ctx.arc(x + m.dot.x, y + m.dot.y, m.dot.r, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  return { x, y, dotX: x + m.dot.x, dotY: y + m.dot.y, r: m.dot.r, x1: x + m.width, top: y - m.asc };
}

// text helpers
export function textW(ctx, font, s, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
export function fillT(ctx, font, s, x, y, color, ls = 0, align = 'left') {
  ctx.font = font; ctx.letterSpacing = ls + 'px'; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y); const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; return w;
}

// DM Mono caps micro-text; "→" (missing in DM Mono) is set in Instrument Sans. Returns the width.
export function mono(ctx, s, x, y, size, color, { ls = size * 0.12, align = 'left', weight = 400 } = {}) {
  const fam = weight >= 500 ? 'DMMonoM' : 'DMMono';
  const parts = s.split('→');
  const fontM = `${weight} ${size}px ${fam}`, fontA = `500 ${size}px IS`;
  let w = 0;
  parts.forEach((p, i) => { w += textW(ctx, fontM, p, ls); if (i < parts.length - 1) w += textW(ctx, fontA, '→', ls); });
  let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  parts.forEach((p, i) => {
    cx += fillT(ctx, fontM, p, cx, y, color, ls);
    if (i < parts.length - 1) cx += fillT(ctx, fontA, '→', cx, y, color, ls);
  });
  return w;
}
