// 01 · Swiss Motion Graphics — the grid grows from one blue point; three bars snap in on the beat; the point
// (the one exception: linear, unsnapped) glides to the ı; knife cuts subtract the bars; the lockup re-flows up.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, bezier, seg, clamp, lerp, wordmark, drawWordmark, mono, fillT, textW } from './shared/core.js';

const { ctx } = setup({ dur: 6, fps: 24 });
const SNAP = bezier(.7, 0, .2, 1);
const PAGE = BRAND.luce, INK = BRAND.ink, GRID = BRAND.cielo, GRID2 = BRAND.acqua, SIG = BRAND.ultra;
const COL = c => 96 + c * 146, ROW = r => 96 + r * 152, CW = 122, RH = 128;
const snapIn = (t, land, dur = .25) => SNAP(seg(t, land - dur, land));

const BARS = [
  { word: 'graphic', note: '01 — GRAFICA', c0: 0, span: 7, row: 0, land: .5 },
  { word: 'motion', note: '02 — MOTION', c0: 3, span: 5, row: 1, land: 1.0 },
  { word: 'editorial', note: '03 — EDITORIA', c0: 5, span: 7, row: 2, land: 1.5 },
];
const DOT0 = { x: COL(10), y: 160 };
let M;   // wordmark metrics

function grid(t) {
  const grow = (d, k) => clamp((t - .08 - d * k) / .38);          // linear growth, ordered by distance from the point
  const retract = seg(t, 3.45, 3.95);                              // lines shrink from one end to the other
  ctx.lineWidth = 1; ctx.strokeStyle = GRID;
  for (let c = 0; c <= 12; c++) {
    const x = c === 12 ? W - 96 : COL(c), g = grow(Math.abs(x - DOT0.x) / 146, .035);
    if (g <= 0 || retract >= 1) continue;
    let y0 = lerp(DOT0.y, 96, g), y1 = lerp(DOT0.y, H - 96, g);
    y0 = lerp(y0, y1, retract);
    ctx.beginPath(); ctx.moveTo(Math.round(x) + .5, y0); ctx.lineTo(Math.round(x) + .5, y1); ctx.stroke();
  }
  for (let r = 0; r <= 6; r++) {
    const y = r === 6 ? H - 96 : ROW(r), g = grow(Math.abs(y - DOT0.y) / 152 + .5, .05);
    if (g <= 0 || retract >= 1) continue;
    let x0 = lerp(DOT0.x, 96, g), x1 = lerp(DOT0.x, W - 96, g);
    x0 = lerp(x0, x1, retract);
    ctx.beginPath(); ctx.moveTo(x0, Math.round(y) + .5); ctx.lineTo(x1, Math.round(y) + .5); ctx.stroke();
  }
}

function bar(t, b, i) {
  const x = COL(b.c0), w = b.span * 146 - 24, y = ROW(b.row);
  const wipe = snapIn(t, b.land);
  if (wipe <= 0) return;
  // knife cut: a paper-coloured line crosses the bar on its midline, then the bar collapses onto it
  const kc = 3.25 + i * .08, knife = clamp((t - kc) / .16), col = SNAP(seg(t, kc + .16, kc + .4));
  if (col >= 1) return;
  const hh = RH / 2 * (1 - col), my = y + RH / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, my - hh, w * wipe, hh * 2); ctx.clip();
  ctx.fillStyle = INK; ctx.fillRect(x - 1, y, w * wipe + 2, RH);
  // the word rises out of its clip from below the baseline
  const rise = SNAP(seg(t, b.land - .05, b.land + .2));
  if (rise > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, RH); ctx.clip();
    fillT(ctx, '700 104px IS', b.word, x + 28, y + 96 + (1 - rise) * RH, PAGE, -2);
    ctx.restore();
  }
  if (knife > 0 && knife < 1 || (knife >= 1 && col < 1)) { ctx.fillStyle = PAGE; ctx.fillRect(x, my - 1.5, w * knife, 3); }
  ctx.restore();
  if (col === 0 && rise > .5) txt('bar' + i, b.word, x + 28, y + 20, x + 28 + textW(ctx, '700 104px IS', b.word, -2), y + 122);
  // caption: a 1 px rule and a DM Mono note beside the bar
  const nr = SNAP(seg(t, b.land, b.land + .25)) * (1 - col);
  if (nr > 0) {
    const right = b.c0 + b.span < 12, nx = right ? x + w + 24 : x - 24 - 146 + 24;
    ctx.fillStyle = INK; ctx.fillRect(nx, y, (CW) * nr, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(nx, y + 2, CW + 40, 40); ctx.clip();
    mono(ctx, b.note, nx, y + 26 + (1 - nr) * 30, 15, INK);
    ctx.restore();
  }
}

function draw(t) {
  ctx.fillStyle = PAGE; ctx.fillRect(0, 0, W, H);
  if (!M) M = wordmark(ctx, 248, -0.02);
  grid(t);
  BARS.forEach((b, i) => bar(t, b, i));

  // the lockup: lands low at 2.5 s, re-flows up two rows on the 4.0 s beat
  const flow = SNAP(seg(t, 3.75, 4.0)) * 304;
  const wx = 96 - M.letters[0].w * 0.06, wy = ROW(4) + RH - flow;   // optical flush-left
  const show = t >= 2.2;
  let mark = null;
  if (show) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, wy + 4); ctx.clip();
    mark = drawWordmark(ctx, M, wx, wy, {
      color: INK, dot: false,
      letter: i => { const p = SNAP(seg(t, 2.27 + i * .018, 2.5 + i * .018)); return p <= 0 ? { a: 0 } : { dy: (1 - p) * M.asc * 1.15 }; },
    });
    ctx.restore();
    if (t > 2.4) txt('wordmark', 'ultrasintesi', wx, wy - M.asc, wx + M.width, wy);
  }
  // the exception: the point. Placed on the first frame, still while the system builds, then linear and unsnapped
  const fx = wx + M.dot.x, fy = wy + M.dot.y;
  const p1 = clamp((t - 1.95) / .3), p2 = clamp((t - 2.32) / .26);       // two linear legs with a pause in mid-flight
  const mid = { x: lerp(DOT0.x, fx, .55), y: DOT0.y + 120 };
  let dx = DOT0.x, dy = DOT0.y;
  if (t >= 1.95) { dx = lerp(DOT0.x, mid.x, p1); dy = lerp(DOT0.y, mid.y, p1); }
  if (t >= 2.32) { dx = lerp(mid.x, fx, p2); dy = lerp(mid.y, wy + M.dot.y + flow, p2) - (p2 >= 1 ? flow : 0); }
  if (p2 >= 1) { dx = fx; dy = fy; }
  const born = SNAP(seg(t, 0, .12));
  ctx.fillStyle = SIG; ctx.beginPath(); ctx.arc(dx, dy, M.dot.r * born, 0, Math.PI * 2); ctx.fill();

  // the claim: Italian above, English below, one bold word each; rises out of its clip on 3.0 s
  const cy = ROW(5) + 50 - flow;
  [[CLAIM_IT, 50, 3.0, cy], [CLAIM_EN, 34, 3.08, cy + 52]].forEach(([s, sz, t0, y], k) => {
    const p = SNAP(seg(t, t0 - .2, t0 + .05)); if (p <= 0) return;
    const bold = k === 0 ? 'fuoco.' : 'focus.', head = s.slice(0, s.length - bold.length);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - sz * 1.1, W, sz * 1.45); ctx.clip();
    const yy = y + (1 - p) * sz * 1.3;
    const w1 = fillT(ctx, `400 ${sz}px IS`, head, 96, yy, INK, -sz * .01);
    const w2 = fillT(ctx, `700 ${sz}px IS`, bold, 96 + w1, yy, INK, -sz * .01);
    ctx.restore();
    txt('claim' + k, s, 96, y - sz * .8, 96 + w1 + w2, y + sz * .25);
  });

  // four corner notes (fine print), the bottom-right one reads the point's position
  mono(ctx, '01 — REBRAND 2026', 96, 58, 15, INK);
  mono(ctx, 'ULTRASINTESI STUDIO', W - 96, 58, 15, INK, { align: 'right' });
  mono(ctx, 'LUCE + MATERIA → FORMA', 96, H - 44, 15, INK);
  const moving = t >= 1.95 && p2 < 1;
  const rd = p2 >= 1 ? 'A FUOCO · IN FOCUS' : `X ${String(Math.round(dx)).padStart(4, '0')} · Y ${String(Math.round(dy)).padStart(4, '0')} — ${moving ? 'OFF GRID' : 'ON GRID'}`;
  mono(ctx, rd, W - 96, H - 44, 15, INK, { align: 'right' });
  ['n1', 'n2', 'n3', 'n4'].forEach((id, k) => txt(id, ['01 — REBRAND 2026', 'ULTRASINTESI STUDIO', 'LUCE + MATERIA → FORMA', rd][k], k % 2 ? W - 300 : 96, k < 2 ? 44 : H - 58, k % 2 ? W - 96 : 360, k < 2 ? 62 : H - 40, true));
}

start(draw, loadFonts(['IS', 'DMMono', 'DMMonoM']));
