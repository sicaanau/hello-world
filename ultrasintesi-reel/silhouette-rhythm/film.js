// 07 · Silhouette Rhythm — a heron, one black shape, in the sun's glitter column. Poses snap on every beat (120 bpm)
// while the disciplines land on the water one per beat; they sink; on the key beat it takes off and on 3.0 s
// everything freezes at the top of the wingbeat — only the sky's colour and the sinking sun keep going. The wordmark
// lands on the water. Adaptation: the ı's point is a small sun (cream), since blue would vanish in this sky.
import { W, H, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, seg, clamp, lerp, mulberry, vnoise, eo, back, wordmark, drawWordmark, fillT, textW } from './shared/core.js';

const { ctx } = setup({ dur: 6, fps: 30 });
const FIG = '#090307', SUNC = '#FFF6DC', HOR = 640, FEET = 870, FX = 1060;
const FREEZE = 3.0;
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const SKY = mk(), FIGC = mk(), TMP = mk(), LIGHT = mk(W / 2, H / 2), RAYS = mk(W / 2, H / 2);
const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
const mixc = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };

// ---------- the sky: two ramps blended by the story phase (gold → crimson … magenta → violet) ----------
const RAMP_A = ['#E8452A', '#FC6A2E', '#FF9440', '#FFB347', '#FFD98A'];
const RAMP_B = ['#380A52', '#7A1458', '#E0245C', '#FC4D2B', '#FF9A55'];
function sky(g, phase, sunX, sunY, tt) {
  const grd = g.createLinearGradient(0, 0, 0, HOR);
  [0, .35, .7, .9, 1].forEach((p, i) => grd.addColorStop(p, mixc(RAMP_A[i], RAMP_B[i], phase)));
  g.fillStyle = grd; g.fillRect(0, 0, W, HOR + 2);
  // sun glow, then the disc and its horizontal flare band
  const glow = g.createRadialGradient(sunX, sunY, 150, sunX, sunY, 900);
  glow.addColorStop(0, 'rgba(255,214,150,.75)'); glow.addColorStop(.35, 'rgba(255,170,90,.28)'); glow.addColorStop(1, 'rgba(255,140,80,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, HOR + 2);
  g.save(); g.beginPath(); g.rect(0, 0, W, HOR); g.clip();
  g.fillStyle = SUNC; g.beginPath(); g.arc(sunX, sunY, 250, 0, 7); g.fill();
  // perspective cloud streaks crossing the sun, lit on their sun-facing (lower) edge
  const r = mulberry(5);
  for (let i = 0; i < 7; i++) {
    const y = 140 + i * 62 + r() * 20, w = 500 + r() * 700, x = ((r() * W + tt * (12 + i * 4)) % (W + w)) - w * .5, h = 7 + i * 2.4;
    g.fillStyle = mixc(mixc(RAMP_A[1], RAMP_B[1], phase), '#000000', .12);
    g.beginPath(); g.ellipse(x, y, w / 2, h, 0, 0, 7); g.fill();
    g.fillStyle = mixc(mixc(RAMP_A[3], RAMP_B[4], phase), '#FFFFFF', .25);
    g.beginPath(); g.ellipse(x + 20, y + h * .55, w / 2 * .9, 2.2, 0, 0, 7); g.fill();
  }
  const band = g.createLinearGradient(0, sunY - 12, 0, sunY + 12); band.addColorStop(0, 'rgba(255,246,220,0)'); band.addColorStop(.5, 'rgba(255,246,220,.55)'); band.addColorStop(1, 'rgba(255,246,220,0)');
  g.fillStyle = band; g.fillRect(0, HOR - 60, W, 120);
  g.restore();
}

// ---------- the heron: hand-keyed poses, blended with a snap (ease-out-back) on each beat ----------
const POSES = {
  alert:  { tilt: -12, nx1: 90, ny1: -300, nx2: 30, ny2: -360, hx: 72, hy: -405, beak: -4, wing: 0, legs: 0, lift: 0, fwd: 0 },
  fish:   { tilt: 4, nx1: 120, ny1: -255, nx2: 150, ny2: -300, hx: 182, hy: -282, beak: 38, wing: 0, legs: 0, lift: 0, fwd: 0 },
  coil:   { tilt: -6, nx1: 95, ny1: -250, nx2: -5, ny2: -300, hx: 46, hy: -335, beak: 2, wing: 0, legs: 0, lift: 0, fwd: 0 },
  call:   { tilt: -18, nx1: 70, ny1: -310, nx2: 60, ny2: -380, hx: 96, hy: -430, beak: -38, wing: .35, legs: 0, lift: 0, fwd: 0 },
  crouch: { tilt: 8, nx1: 100, ny1: -230, nx2: 40, ny2: -270, hx: 100, hy: -286, beak: 6, wing: .55, legs: .5, lift: 18, fwd: 0 },
  flight: { tilt: -4, nx1: 110, ny1: -232, nx2: 70, ny2: -262, hx: 150, hy: -262, beak: 4, wing: 1, legs: 1, lift: -190, fwd: 120 },
};
const BEATS = [[0, 'alert'], [.5, 'fish'], [1, 'coil'], [1.5, 'alert'], [2, 'call'], [2.5, 'crouch'], [2.75, 'flight']];
function poseAt(t) {
  let i = 0; while (i < BEATS.length - 1 && t >= BEATS[i + 1][0]) i++;
  const [t0, name] = BEATS[i], prev = i ? POSES[BEATS[i - 1][1]] : POSES[name], cur = POSES[name];
  const dur = name === 'flight' ? .25 : .13, k = name === 'flight' ? eo(seg(t, t0, t0 + dur)) : back(seg(t, t0, t0 + dur), 1.6);
  const o = {}; for (const key in cur) o[key] = lerp(prev[key], cur[key], k); return o;
}
function heron(g, p, wingPhase) {
  g.save(); g.translate(FX + p.fwd, FEET + p.lift); g.fillStyle = FIG; g.strokeStyle = FIG; g.lineCap = 'round'; g.lineJoin = 'round';
  // legs: standing (two thin legs with a backward ankle) → trailing behind in flight
  const L = p.legs;
  for (const s of [0, 1]) {
    const fx = lerp(s * 22, -170 - s * 18, L), fy = lerp(0, -170 + s * 12, L), kx = lerp(-8 + s * 22, -90 - s * 10, L), ky = lerp(-95, -190, L);
    g.lineWidth = 6; g.beginPath(); g.moveTo(fx, fy); g.lineTo(kx, ky); g.lineTo(lerp(0, -40, L) + s * 6, -200); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + lerp(26, -14, L), fy + lerp(2, 2, L)); g.stroke();
  }
  // body: a tilted teardrop with a tail point
  g.save(); g.translate(0, -222); g.rotate(p.tilt * Math.PI / 180);
  g.beginPath(); g.moveTo(-108, 18); g.bezierCurveTo(-60, -40, 40, -52, 72, -18); g.bezierCurveTo(88, 2, 60, 40, 0, 42); g.bezierCurveTo(-50, 42, -85, 32, -108, 18); g.fill();
  // the wing: folded on the body → raised high behind at the top of a wingbeat (side view, primaries as fingers)
  const wv = p.wing;
  if (wv > .02) {
    const up = wv * (0.75 + 0.25 * Math.cos(wingPhase));
    g.beginPath(); g.moveTo(-40, -20); g.quadraticCurveTo(-20, -40 - 160 * up, -120 - 60 * up, -60 - 290 * up);
    for (let f = 0; f < 5; f++) { const a = -120 - 60 * up - f * 26, b = -60 - 290 * up + f * (34 + 20 * up); g.lineTo(a - 18, b + 10); g.lineTo(a - 6, b + 22); }
    g.quadraticCurveTo(-120, -10, -70, 10); g.closePath(); g.fill();
  }
  g.restore();
  // the neck: a thick S curve from the chest to the head, the head and a long beak
  const cx = 52, cy = -238;
  g.lineWidth = 17; g.beginPath(); g.moveTo(cx, cy); g.bezierCurveTo(p.nx1, p.ny1, p.nx2, p.ny2, p.hx, p.hy); g.stroke();
  g.save(); g.translate(p.hx, p.hy); g.rotate(p.beak * Math.PI / 180);
  g.beginPath(); g.ellipse(0, 0, 20, 13, 0, 0, 7); g.fill();
  g.beginPath(); g.moveTo(-26, -4); g.lineTo(-58, -10); g.lineTo(-28, 2); g.fill();     // crest plume
  g.beginPath(); g.moveTo(12, -6); g.lineTo(96, 1); g.lineTo(12, 7); g.closePath(); g.fill();
  g.restore();
  g.restore();
}

function tintOf(src, color) { const g = TMP.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; return TMP; }

const DROPS = (() => { const r = mulberry(12); return Array.from({ length: 34 }, () => ({ vx: (r() - .3) * 260, vy: -260 - r() * 420, r: 2 + r() * 4, x0: (r() - .5) * 60 })); })();
let M, grain;

function draw(t) {
  const tt = Math.min(t, FREEZE);                         // subject time stops at the freeze
  const phase = seg(t, 0, 6) * .8;                        // the sky keeps going
  const sunX = 1180, sunY = lerp(470, 575, seg(t, 0, 6));
  const g = SKY.getContext('2d'); sky(g, phase, sunX, sunY, tt);
  ctx.drawImage(SKY, 0, 0);

  // ---------- water: the sky reflected with world-anchored wobble, darker toward the camera ----------
  for (let y = HOR; y < H; y += 2) {
    const d = y - HOR, src = HOR - 1 - d * .55, wob = (vnoise(y * .09 + tt * 1.3) - .5) * (4 + d * .05) + (vnoise(y * .31 - tt * 2.1 + 40) - .5) * 3;
    ctx.drawImage(SKY, 0, Math.max(0, src), W, 2, wob, y, W, 2);
  }
  const dk = ctx.createLinearGradient(0, HOR, 0, H); dk.addColorStop(0, 'rgba(26,8,61,0)'); dk.addColorStop(.45, 'rgba(26,8,61,.45)'); dk.addColorStop(1, 'rgba(18,4,40,.88)');
  ctx.fillStyle = dk; ctx.fillRect(0, HOR, W, H - HOR);
  // the glitter column under the sun: short bright dashes anchored to the world
  const rg = mulberry(21);
  for (let i = 0; i < 260; i++) {
    const y = HOR + 4 + Math.pow(rg(), 1.4) * (H - HOR), spread = 60 + (y - HOR) * .55, x = sunX + (rg() - .5) * 2 * spread * (.4 + rg() * .6);
    const on = vnoise(i * 3.1 + tt * 3) > .45 ? 1 : 0; if (!on) continue;
    const w = 8 + rg() * 40 * (1 - (y - HOR) / (H - HOR) * .5);
    ctx.fillStyle = `rgba(255,236,196,${.35 + .5 * (1 - (y - HOR) / (H - HOR))})`; ctx.fillRect(x - w / 2, y, w, 2 + (y - HOR) * .006);
  }

  // ---------- the figure layer ----------
  const p = poseAt(tt), wingPhase = tt > 2.75 ? (tt - 2.75) * Math.PI * 4 : 0;
  const fg = FIGC.getContext('2d'); fg.clearRect(0, 0, W, H); heron(fg, p, wingPhase);
  // volumetric rays from the sun, occluded by the silhouette (half-res zoom blur toward the sun)
  const lg = LIGHT.getContext('2d'); lg.clearRect(0, 0, W / 2, H / 2);
  lg.save(); lg.beginPath(); lg.rect(0, 0, W / 2, HOR / 2); lg.clip();
  const lgl = lg.createRadialGradient(sunX / 2, sunY / 2, 40, sunX / 2, sunY / 2, 260); lgl.addColorStop(0, 'rgba(255,240,200,1)'); lgl.addColorStop(1, 'rgba(255,160,90,0)');
  lg.fillStyle = lgl; lg.fillRect(0, 0, W / 2, H / 2); lg.restore();
  lg.globalCompositeOperation = 'destination-out'; lg.drawImage(FIGC, 0, 0, W / 2, H / 2); lg.globalCompositeOperation = 'source-over';
  const rr = RAYS.getContext('2d'); rr.clearRect(0, 0, W / 2, H / 2); rr.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const s = 1 + i * .035; rr.globalAlpha = .16 * (1 - i / 14); rr.drawImage(LIGHT, sunX / 2 * (1 - s), sunY / 2 * (1 - s), W / 2 * s, H / 2 * s); }
  rr.globalAlpha = 1; rr.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .55; ctx.drawImage(RAYS, 0, 0, W, H); ctx.restore();

  // reflection of the figure: flipped about its waterline, wobbled, darkened (row strips)
  for (let y = FEET; y < H; y += 3) {
    const src = FEET - (y - FEET), wob = (vnoise(y * .12 + tt * 2) - .5) * 9;
    if (src < 0) break;
    ctx.globalAlpha = .7; ctx.drawImage(FIGC, 0, src, W, 3, wob, y, W, 3);
  }
  ctx.globalAlpha = 1;
  // halo and rim on the sun-facing edge, then the shape itself
  const dirx = sunX - (FX + p.fwd), diry = sunY - (FEET - 260 + p.lift), dl = Math.hypot(dirx, diry);
  ctx.save(); ctx.filter = 'blur(7px)'; ctx.globalAlpha = .45; ctx.drawImage(tintOf(FIGC, '#FFE6B0'), 0, 0); ctx.restore();
  ctx.drawImage(tintOf(FIGC, '#FFF0CC'), dirx / dl * 2.2, diry / dl * 2.2);
  ctx.drawImage(FIGC, 0, 0);

  // ripples at the feet on every beat (bright crest + dark trough); they stop with the freeze
  for (let b = 0; b <= 2.5; b += .5) {
    const k = tt - b; if (k < 0 || k > 1.6) continue;
    const rx = 30 + k * 260, ry = rx * .12, a = (1 - k / 1.6);
    ctx.strokeStyle = `rgba(255,220,170,${.55 * a})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(FX + 10, FEET + 4, rx, ry, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = `rgba(20,4,30,${.5 * a})`; ctx.beginPath(); ctx.ellipse(FX + 10, FEET + 8, rx * .96, ry * .96, 0, 0, 7); ctx.stroke();
  }
  // droplets thrown at take-off: bright beads, never black specks; frozen mid-air
  if (tt > 2.6) {
    const k = tt - 2.6;
    for (const d of DROPS) {
      const x = FX + d.x0 + d.vx * k, y = FEET - 10 + d.vy * k + 900 * k * k;
      if (y > FEET + 10) continue;
      ctx.fillStyle = 'rgba(255,240,210,.95)'; ctx.beginPath(); ctx.arc(x, y, d.r, 0, 7); ctx.fill();
    }
  }

  // ---------- type on the dark lower water, left-aligned, one word per beat; a small ripple lands under each ----------
  const TX = 120;
  const words = [['GRAPHIC', 1.0], ['MOTION', 1.5], ['EDITORIAL', 2.0]];
  let x = TX;
  words.forEach(([w, t0], i) => {
    const land = back(seg(t, t0, t0 + .13), 1.6), sink = seg(t, 2.6 + i * .05, 2.85 + i * .05);
    const ww = textW(ctx, '400 92px Anton', w, 2);
    if (land > 0 && sink < 1) {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 940); ctx.clip();
      fillT(ctx, '400 92px Anton', w, x, 930 + (1 - land) * 40 + sink * 110, SUNC, 2); ctx.restore();
      if (sink === 0 && land >= 1) txt('w' + i, w, x, 860, x + ww, 932);
      const rk = t - t0;
      if (rk > 0 && rk < .7) { ctx.strokeStyle = `rgba(255,236,200,${.5 * (1 - rk / .7)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + ww / 2, 944, ww * .3 + rk * 120, 6 + rk * 10, 0, 0, 7); ctx.stroke(); }
    }
    x += ww + 34;
  });
  if (!M) M = wordmark(ctx, 150, -0.02);
  const wl = back(seg(t, FREEZE, FREEZE + .13), 1.6);
  if (wl > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 912); ctx.clip();
    drawWordmark(ctx, M, TX, 905 + (1 - wl) * 50, { color: SUNC, dotColor: '#FFF6DC' }); ctx.restore();
    txt('wordmark', 'ultrasintesi', TX, 905 - M.asc, TX + M.width, 905);
    const rk = t - FREEZE;
    if (rk < .8) { ctx.strokeStyle = `rgba(255,236,200,${.5 * (1 - rk / .8)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(TX + M.width / 2, 920, M.width * .3 + rk * 160, 6 + rk * 12, 0, 0, 7); ctx.stroke(); }
  }
  [[CLAIM_IT, '600 42px BarlowC', 3.25, 968], [CLAIM_EN, '600 30px BarlowC', 3.33, 1012]].forEach(([s, f, t0, y], k) => {
    const l = back(seg(t, t0, t0 + .13), 1.6); if (l <= 0) return;
    ctx.save(); ctx.globalAlpha = k ? .82 : 1; fillT(ctx, f, s, TX + 4, y + (1 - l) * 24, SUNC, 1); ctx.restore();
    txt('claim' + k, s, TX + 4, y - 32, TX + 4 + textW(ctx, f, s, 1), y + 6);
  });

  // light film grain at the master
  if (!grain) { grain = mk(512, 512); const gg = grain.getContext('2d'), img = gg.createImageData(512, 512), r = mulberry(3); for (let i = 0; i < img.data.length; i += 4) { const n = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; } gg.putImageData(img, 0, 0); }
  const fr = Math.floor(t * 30), r = mulberry(fr + 5), ox = -Math.floor(r() * 512), oy = -Math.floor(r() * 512);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .045;
  for (let gx = ox; gx < W; gx += 512) for (let gy = oy; gy < H; gy += 512) ctx.drawImage(grain, gx, gy);
  ctx.restore();
}

start(draw, loadFonts(['IS', 'Anton', 'BarlowC']));
