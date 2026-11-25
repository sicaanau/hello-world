// 05 · Bauhaus Shapes — point → line → plane. A construction grid draws; the protagonist dot drops and rolls along
// the baseline, drawing its path; three shapes of EQUAL AREA land on the grid (square = graphic, circle = motion,
// triangle = editorial: three disciplines, one weight); they sink through the baseline; the grid retracts; the dot
// falls into the brand's impronta (two discs, an opaque lens) and lifts onto the ı.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, seg, clamp, lerp, eio, back, wordmark, drawWordmark, fillT, textW } from './shared/core.js';
import { paperTexture } from './shared/paper.js';

const { ctx } = setup({ dur: 6, fps: 30 });
const PAPER = BRAND.luce, PROT = BRAND.ultra, FIELD = BRAND.ink, PIVOT = BRAND.acqua, SEC = BRAND.cielo, INK = BRAND.ink;
const BASE = 740, A = 230 * 230;                                    // the shared area
const SQ = Math.sqrt(A), CR = Math.sqrt(A / Math.PI), TS = Math.sqrt(4 * A / Math.sqrt(3)), TH = TS * Math.sqrt(3) / 2;
const SHAPES = [
  { kind: 'sq', x: 520, land: .8, en: 'GRAPHIC', it: 'grafica', col: PIVOT },
  { kind: 'ci', x: 960, land: 1.16, en: 'MOTION', it: 'movimento', col: FIELD },
  { kind: 'tr', x: 1400, land: 1.53, en: 'EDITORIAL', it: 'editoria', col: SEC },
];
const R = 24, X0 = 200, X1 = 1600;
const I1 = { x: 1610, y: 930, r: 300 }, I2 = { x: 1880, y: 820, r: 300 };   // the impronta, cropped by the frame edge
let M;

function line(x0, y0, x1, y1, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function shape(s, cx, base, k) {
  ctx.fillStyle = s.col; ctx.beginPath();
  if (s.kind === 'sq') ctx.rect(cx - SQ / 2, base - SQ, SQ, SQ);
  else if (s.kind === 'ci') ctx.arc(cx, base - CR, CR, 0, 7);
  else { ctx.moveTo(cx - TS / 2, base); ctx.lineTo(cx + TS / 2, base); ctx.lineTo(cx, base - TH); ctx.closePath(); }
  ctx.fill();
  // a compass mark at the centre a shape was constructed from
  if (k >= 1) { const cy = base - (s.kind === 'sq' ? SQ / 2 : s.kind === 'ci' ? CR : TH / 3); ctx.strokeStyle = s.col === FIELD ? PAPER : INK; ctx.lineWidth = 2; line(cx - 7, cy, cx + 7, cy, 2, ctx.strokeStyle); line(cx, cy - 7, cx, cy + 7, 2, ctx.strokeStyle); }
}
function rollX(t) { return lerp(X0, X1, seg(t, .38, 1.55)); }

function draw(t) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  if (!M) M = wordmark(ctx, 210, -0.02);
  const WX = 170, WY = 520, DOTF = { x: WX + M.dot.x, y: WY + M.dot.y };

  // ---- construction grid: draws from one end, retracts from the other (nothing fades) ----
  const gd = eio(seg(t, 0, .4)), gr = eio(seg(t, 2.35, 2.75));
  const gl = (x0, y0, x1, y1, d) => { if (d <= 0 || gr >= 1) return; line(lerp(x0, x1, gr), lerp(y0, y1, gr), lerp(x0, x1, d), lerp(y0, y1, d), 2, PIVOT); };
  gl(120, BASE - SQ, 1800, BASE - SQ, gd); gl(120, BASE - TH, 1800, BASE - TH, gd);
  SHAPES.forEach(s => gl(s.x, 120, s.x, 960, gd));
  gl(120, BASE, 1800, BASE, gd);

  // ---- the three shapes: equal area, land with a small overshoot, then sink through the baseline slot ----
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, BASE); ctx.clip();
  SHAPES.forEach((s, i) => {
    const k = back(seg(t, s.land - .22, s.land), 1.4), sink = eio(seg(t, 2.1 + i * .08, 2.45 + i * .08));
    if (k <= 0 || sink >= 1) return;
    const lift = (1 - k) * -620 + sink * 420;
    shape(s, s.x, BASE + lift, k >= 1 && sink === 0 ? 1 : 0);
  });
  ctx.restore();
  // labels slide out from under the baseline edge (clipped by it)
  ctx.save(); ctx.beginPath(); ctx.rect(0, BASE + 4, W, 200); ctx.clip();
  SHAPES.forEach((s, i) => {
    const k = eio(seg(t, s.land, s.land + .22)) - eio(seg(t, 2.1 + i * .08, 2.35 + i * .08));
    if (k <= 0) return;
    const dy = (1 - k) * -90;
    const w1 = textW(ctx, '600 28px Jost', s.en, 5), w2 = textW(ctx, '300 28px Jost', s.it, 14);
    fillT(ctx, '600 28px Jost', s.en, s.x - w1 / 2, BASE + 50 + dy, INK, 5);
    fillT(ctx, '300 28px Jost', s.it, s.x - w2 / 2, BASE + 92 + dy, INK, 14);
    if (k >= 1) { txt('en' + i, s.en, s.x - w1 / 2, BASE + 28, s.x + w1 / 2, BASE + 52); txt('it' + i, s.it, s.x - w2 / 2, BASE + 70, s.x + w2 / 2, BASE + 96); }
  });
  ctx.restore();

  // ---- the plane: the impronta lands (two discs, the lens an opaque third colour) ----
  const ip = back(seg(t, 2.35, 2.7), 1.3);
  if (ip > 0) {
    const r1 = I1.r * ip, r2 = I2.r * ip;
    ctx.fillStyle = SEC; ctx.beginPath(); ctx.arc(I1.x, I1.y, r1, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(I2.x, I2.y, r2, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(I1.x, I1.y, r1, 0, 7); ctx.clip(); ctx.fillStyle = PIVOT; ctx.beginPath(); ctx.arc(I2.x, I2.y, r2, 0, 7); ctx.fill(); ctx.restore();
  }

  // ---- the path the dot draws (point → line), retracting with the grid ----
  const rx = rollX(t);
  if (t > .38) line(lerp(X0, Math.min(rx, X1), eio(seg(t, 2.4, 2.8))), BASE - 2.5, rx, BASE - 2.5, 5, INK);

  // ---- the wordmark: letters rise out of a slot on their baseline, one block at a time ----
  const up = i => eio(seg(t, 2.8 + i * .025, 3.1 + i * .025));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, WY + 2); ctx.clip();
  drawWordmark(ctx, M, WX, WY, { color: INK, dot: false, letter: i => { const k = up(i); return k <= 0 ? { a: 0 } : { dy: (1 - k) * M.asc * 1.1 }; } });
  ctx.restore();
  if (t > 3.1) txt('wordmark', 'ultrasintesi', WX, WY - M.asc, WX + M.width, WY);
  // the claim reveals left to right
  [[CLAIM_IT, '500 46px Jost', 0, 3.0, 615], [CLAIM_EN, '300 30px Jost', 6, 3.08, 668]].forEach(([s, f, ls, t0, y], k) => {
    const p = eio(seg(t, t0, t0 + .3)); if (p <= 0) return;
    const w = textW(ctx, f, s, ls);
    ctx.save(); ctx.beginPath(); ctx.rect(WX, y - 50, w * p + 4, 70); ctx.clip(); fillT(ctx, f, s, WX + 6, y, INK, ls); ctx.restore();
    txt('claim' + k, s, WX + 6, y - 36, WX + 6 + w, y + 8);
  });

  // ---- the protagonist dot ----
  const LENS = { x: 1748, y: 878 };
  let dx, dy, sx = 1, sy = 1, r = R;
  const drop = seg(t, .12, .38);
  if (t < .38) { dx = X0; dy = lerp(-40, BASE - R, drop * drop); }
  else if (t < 2.5) { dx = rx; dy = BASE - R; }
  else if (t < 3.15) { const k = eio(seg(t, 2.5, 2.85)); dx = lerp(X1, LENS.x, k); dy = lerp(BASE - R, LENS.y, k) - Math.sin(k * Math.PI) * 160; r = lerp(R, 18, k); }
  else { const k = eio(seg(t, 3.15, 3.55)); dx = lerp(LENS.x, DOTF.x, k); dy = lerp(LENS.y, DOTF.y, k) - Math.sin(k * Math.PI) * 260; r = lerp(18, M.dot.r * 1.1, k); }
  // drops squash once on contact
  const sq = (a) => { const k = seg(t, a, a + .16); return k > 0 && k < 1 ? Math.sin(k * Math.PI) * .22 : 0; };
  const s1 = sq(.38) + sq(2.85) + sq(3.55); sx = 1 + s1; sy = 1 - s1;
  ctx.save(); ctx.translate(dx, dy + r * (1 - sy)); ctx.scale(sx, sy); ctx.fillStyle = PROT; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore();

  // paper: fine tooth, static (it is the paper)
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .38; ctx.drawImage(paperTexture(), 0, 0); ctx.restore();
}

start(draw, loadFonts(['IS', 'Jost']));
