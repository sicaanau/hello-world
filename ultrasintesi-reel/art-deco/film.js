// 03 · Art Deco — black lacquer, engraved gold line, one centre axis. A blue point ignites on the axis; a hairline
// and a stepped arch draw on in gold; door leaves with chevrons; bulbs switch on in counted order; the plaque
// unfolds with the disciplines; the leaves split along the seam onto a sunburst and the wordmark; the point
// takes its place on the ı; the claim card unfolds from the centre; a sheen sweeps.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, seg, clamp, lerp, eio, eo, wordmark, drawWordmark, fillT, textW } from './shared/core.js';

const { ctx } = setup({ dur: 6, fps: 24 });
const CX = 960;
const LACQ = '#16100B', LACQ2 = '#221811', IVORY = '#F4EAD5', JEWEL = '#141B30', JEWEL2 = '#1F2B4D', ACC = BRAND.ultra;

function gold(sheen = 0, x0 = 0, y0 = 0, x1 = W, y1 = H) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const bands = ['#5E4316', '#B88E3E', '#F7E2A4', '#FFF6D8', '#D7AE57', '#7C5A20'];
  const N = 5;
  for (let i = 0; i <= N * bands.length; i++) {
    const p = i / (N * bands.length), q = ((p + sheen) % 1 + 1) % 1;
    g.addColorStop(p, bands[Math.floor(q * N * bands.length) % bands.length]);
  }
  return g;
}
const len = pts => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
function pathOf(pts) { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); return p; }
// the signature stroke: dark engraved underline, the gold line, a hairline highlight; drawn on to `prog`
function gline(pts, w, prog = 1, { sheen = 0, glow = 0 } = {}) {
  if (prog <= 0) return;
  const L = len(pts), p = pathOf(pts), dash = prog >= 1 ? [] : [L * prog, L + 10];
  ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.setLineDash(dash);
  if (glow) { ctx.shadowColor = 'rgba(255,200,110,0.55)'; ctx.shadowBlur = glow; }
  ctx.strokeStyle = '#1E1408'; ctx.lineWidth = w + 1.6; ctx.stroke(p); ctx.shadowBlur = 0;
  ctx.strokeStyle = gold(sheen); ctx.lineWidth = w; ctx.stroke(p);
  ctx.strokeStyle = 'rgba(255,248,220,0.75)'; ctx.lineWidth = .6; ctx.stroke(p);
  ctx.restore();
}
const mirror = half => half.map(([x, y]) => [CX - (x - CX), y]);

// the stepped arch (right half from the bottom to the top centre)
const ARCH_R = [[CX + 520, 930], [CX + 520, 430], [CX + 450, 430], [CX + 450, 300], [CX + 360, 300], [CX + 360, 205], [CX + 230, 205], [CX + 230, 130], [CX, 130]];
const ARCH_L = mirror(ARCH_R);
const ARCH_FULL = ARCH_L.concat(ARCH_R.slice().reverse().slice(1));
const inset = (pts, d) => pts.map(([x, y]) => [x + (x > CX ? -d : x < CX ? d : 0), y + (y < 900 ? d : 0)]);
const ARCH_IN_R = inset(ARCH_R, 22), ARCH_IN_L = mirror(ARCH_IN_R);
const INTERIOR = pathOf(ARCH_IN_L.concat(ARCH_IN_R.slice().reverse().slice(1)));

// bulbs along the outside of the arch, counted from the bottom on both sides
const BULBS = (() => {
  const out = [], pts = inset(ARCH_R, -30), L = len(pts), n = 22;
  for (let i = 0; i < n; i++) {
    let d = (i + .5) / n * L, k = 1;
    while (k < pts.length) { const s = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (d <= s) break; d -= s; k++; }
    const a = pts[k - 1], b = pts[k], s = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const x = a[0] + (b[0] - a[0]) * d / s, y = a[1] + (b[1] - a[1]) * d / s;
    out.push({ x, y, i }, { x: CX - (x - CX), y, i });
  }
  return out;
})();
const bulbLevel = (t, i) => {
  const t0 = .95 + i * .066; if (t < t0) return .08;
  const k = t - t0, ign = k < .18 ? 1 + .6 * (1 - k / .18) : 1;           // ignition overshoot, settling in 0.18 s
  const chase = t > 3.6 ? .82 + .18 * Math.cos((t * 2.2 - i * .18) * Math.PI * 2) : 1;
  return ign * chase;
};

let M;
function draw(t) {
  // ground: warm lacquer, lifted behind the arch (never pure black)
  ctx.fillStyle = LACQ; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(CX, 560, 60, CX, 560, 900); rg.addColorStop(0, '#2A1F14'); rg.addColorStop(1, LACQ);
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  if (!M) M = wordmark(ctx, 150, -0.01);
  const sheen = t * .02 + (t > 4 ? eio(seg(t, 4.0, 4.8)) * .35 : 0);

  // ---- the live shot behind the doors: sunburst from the bottom centre + wordmark ----
  const open = eio(seg(t, 2.5, 3.05)), settle = t > 3.05 ? Math.sin(seg(t, 3.05, 3.25) * Math.PI) * 6 : 0;
  ctx.save(); ctx.clip(INTERIOR);
  const ox = CX, oy = 930, rays = 28;
  for (let i = 0; i < rays; i++) {
    const a0 = Math.PI + i / rays * Math.PI, a1 = Math.PI + (i + 1) / rays * Math.PI;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.cos((a0 + a1) / 2) * 900, oy + Math.sin((a0 + a1) / 2) * 900);
    const dark = i % 2 === 0;
    g.addColorStop(0, dark ? '#0F0B07' : JEWEL); g.addColorStop(1, dark ? LACQ2 : JEWEL2);   // airbrush inside hard edges
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, 1200, a0, a1); ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i <= rays; i++) { const a = Math.PI + i / rays * Math.PI; gline([[ox + Math.cos(a) * 120, oy + Math.sin(a) * 120], [ox + Math.cos(a) * 1100, oy + Math.sin(a) * 1100]], 1.2, 1, { sheen }); }
  ctx.restore();

  // the wordmark (ivory, with a gold sheen sweeping across it) — centred on the axis
  const wx = CX - M.width / 2, wy = 575;
  if (open > 0) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    drawWordmark(ctx, M, wx, wy, { color: IVORY, dot: false }); ctx.restore();
    const sw = seg(t, 4.0, 4.9);
    if (sw > 0 && sw < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      const sx = lerp(wx - 200, wx + M.width + 200, sw), g = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      g.addColorStop(0, 'rgba(247,226,164,0)'); g.addColorStop(.5, 'rgba(247,226,164,.95)'); g.addColorStop(1, 'rgba(247,226,164,0)');
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(wx - 10, wy - M.asc - 10, M.width + 20, M.asc + 20); ctx.clip();
      ctx.globalCompositeOperation = 'source-atop';
      // re-draw the wordmark in the sheen colour, masked by the band
      const band = document.createElement('canvas'); band.width = W; band.height = 260;
      const b = band.getContext('2d'); b.translate(0, -(wy - M.asc - 30));
      drawWordmark(b, M, wx, wy, { color: '#FFF6D8', dot: false });
      b.globalCompositeOperation = 'destination-in'; b.fillStyle = g; b.fillRect(0, wy - M.asc - 30, W, 260);
      ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(band, 0, wy - M.asc - 30);
      ctx.restore();
    }
    if (open >= 1) txt('wordmark', 'ultrasintesi', wx, wy - M.asc, wx + M.width, wy);
  }

  // ---- the door leaves: lacquer, airbrushed from the upper left, gold chevrons; split along the seam ----
  const leafDraw = seg(t, .35, 1.45);
  if (open < 1) {
    ctx.save(); ctx.clip(INTERIOR);
    for (const side of [-1, 1]) {
      const shift = side * (open * 560 + (open >= 1 ? settle : 0));
      ctx.save(); ctx.translate(shift, 0);
      const x0 = side < 0 ? CX - 520 : CX, x1 = side < 0 ? CX : CX + 520;
      const g = ctx.createLinearGradient(x0, 130, x1, 930); g.addColorStop(0, '#211810'); g.addColorStop(1, '#0E0A06');
      ctx.fillStyle = g; ctx.fillRect(x0, 120, 520, 820);
      // chevrons pointing up the axis
      for (let k = 0; k < 9; k++) {
        const y = 880 - k * 82, prog = clamp(leafDraw * 1.6 - k * .07);
        const pts = side < 0 ? [[CX - 480, y + 120], [CX - 14, y]] : [[CX + 480, y + 120], [CX + 14, y]];
        gline(pts, 2.2, prog, { sheen });
      }
      gline([[CX + side * 10, 140], [CX + side * 10, 930]], 2.4, leafDraw, { sheen });
      ctx.restore();
    }
    ctx.restore();
  }

  // ---- the arch: a point → a hairline up the axis → the stepped frame opening symmetrically ----
  const hair = seg(t, .12, .5);
  if (open < .2) gline([[CX, 930], [CX, lerp(930, 130, hair)]], 1.4, hair > 0 ? 1 : 0, { sheen, glow: 8 });
  const ad = eio(seg(t, .3, 1.5));
  gline(ARCH_R, 5, ad, { sheen, glow: 10 }); gline(ARCH_L, 5, ad, { sheen, glow: 10 });
  gline(ARCH_IN_R, 2, ad, { sheen }); gline(ARCH_IN_L, 2, ad, { sheen });
  gline([[CX - 600, 930], [CX + 600, 930]], 3, eio(seg(t, .25, .9)), { sheen });

  // ---- bulbs in counted order ----
  for (const b of BULBS) {
    const l = bulbLevel(t, b.i);
    ctx.save();
    if (l > .2) { ctx.shadowColor = `rgba(255,214,140,${clamp(l * .8)})`; ctx.shadowBlur = 18 * l; }
    ctx.fillStyle = l > .2 ? `rgba(255,${Math.round(236 + 19 * clamp(l - 1))},${Math.round(190 + 50 * clamp(l - 1))},${clamp(l)})` : '#3A2A16';
    ctx.beginPath(); ctx.arc(b.x, b.y, 6.5, 0, 7); ctx.fill(); ctx.restore();
  }

  // ---- the plaque: a stepped lacquer bar unfolding from the centre, the disciplines in Poiret One ----
  const pq = eio(seg(t, 1.05, 1.4)), pw = 660 * pq, py = 840;
  if (pq > 0) {
    const step = [[CX - pw / 2, py - 34], [CX + pw / 2, py - 34], [CX + pw / 2, py - 22], [CX + pw / 2 + 14, py - 22], [CX + pw / 2 + 14, py + 22], [CX + pw / 2, py + 22], [CX + pw / 2, py + 34], [CX - pw / 2, py + 34], [CX - pw / 2, py + 22], [CX - pw / 2 - 14, py + 22], [CX - pw / 2 - 14, py - 22], [CX - pw / 2, py - 22], [CX - pw / 2, py - 34]];
    ctx.fillStyle = 'rgba(14,10,6,.92)'; ctx.fill(pathOf(step));
    gline(step, 2, 1, { sheen });
    const s = 'GRAPHIC · MOTION · EDITORIAL', rise = eo(seg(t, 1.35, 1.6));
    if (rise > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(CX - pw / 2, py - 30, pw, 60); ctx.clip();
      fillT(ctx, '400 30px PoiretOne', s, CX, py + 11 + (1 - rise) * 40, IVORY, 6, 'center'); ctx.restore();
      const w = textW(ctx, '400 30px PoiretOne', s, 6); txt('plaque', s, CX - w / 2, py - 14, CX + w / 2, py + 14);
    }
  }

  // ---- the claim card: unfolds from the centre like every title; Josefin Sans ----
  const cc = eio(seg(t, 3.05, 3.35)), cw = 720 * cc, cy = 690;
  if (cc > 0) {
    const h = 58;
    const card = [[CX - cw / 2, cy - h], [CX + cw / 2, cy - h], [CX + cw / 2, cy - h + 14], [CX + cw / 2 + 16, cy - h + 14], [CX + cw / 2 + 16, cy + h - 14], [CX + cw / 2, cy + h - 14], [CX + cw / 2, cy + h], [CX - cw / 2, cy + h], [CX - cw / 2, cy + h - 14], [CX - cw / 2 - 16, cy + h - 14], [CX - cw / 2 - 16, cy - h + 14], [CX - cw / 2, cy - h + 14], [CX - cw / 2, cy - h]];
    ctx.fillStyle = 'rgba(12,9,6,.88)'; ctx.fill(pathOf(card));
    gline(card, 2, 1, { sheen });
    ctx.save(); ctx.translate(CX, cy); ctx.scale(.965, .89); ctx.translate(-CX, -cy); gline(card, 1, 1, { sheen }); ctx.restore();   // double keyline
    const r = eo(seg(t, 3.3, 3.5));
    if (r > 0) {
      ctx.save(); ctx.beginPath(); ctx.rect(CX - cw / 2, cy - h + 4, cw, 2 * h - 8); ctx.clip();
      fillT(ctx, '600 40px Josefin', CLAIM_IT, CX, cy - 4 + (1 - r) * 60, IVORY, 1, 'center');
      fillT(ctx, '400 27px Josefin', CLAIM_EN, CX, cy + 36 + (1 - r) * 60, '#D7AE57', 2, 'center');
      ctx.restore();
      const w1 = textW(ctx, '600 40px Josefin', CLAIM_IT, 1), w2 = textW(ctx, '400 27px Josefin', CLAIM_EN, 2);
      txt('claimIT', CLAIM_IT, CX - w1 / 2, cy - 36, CX + w1 / 2, cy + 4); txt('claimEN', CLAIM_EN, CX - w2 / 2, cy + 14, CX + w2 / 2, cy + 42);
    }
  }

  // ---- the protagonist: the one-colour exception. Ignites on the axis, rises with the open doors to the ı ----
  const ig = seg(t, 0, .2), flash = t < .2 ? 1 + .6 * (1 - t / .2) : 1;
  const dot0 = { x: CX, y: 470 }, dot1 = { x: wx + M.dot.x, y: wy + M.dot.y };
  const mv = eio(seg(t, 2.75, 3.3));
  const lift = Math.sin(mv * Math.PI) * -110;
  const dx = lerp(dot0.x, dot1.x, mv), dy = lerp(dot0.y, dot1.y, mv) + lift, r = M.dot.r * 1.05 * (ig > 0 ? 1 : 0) * Math.min(flash, 1.25);
  if (r > 0) {
    ctx.save(); ctx.shadowColor = 'rgba(80,100,255,.9)'; ctx.shadowBlur = 26 * flash;
    ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = gold(sheen); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(dx, dy, r + 4, 0, 7); ctx.stroke(); ctx.restore();
  }
}

start(draw, loadFonts(['IS', 'PoiretOne', 'Josefin']));
