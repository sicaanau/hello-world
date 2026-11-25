// 06 · Scale Zoom Explainer — flat shapes on a night ground, true scale inside each frame, a corner instrument
// reading the field of view. The lens-eyed guide fires its sight line at a next-stop ring around a speck; the camera
// dives in log space: a magazine spread (editorial) → a video window on its page (motion) → the letterforms (graphic)
// → the speck is the point of the ı. "Il tuo ultra, a fuoco": the guide's lens is literally focusing.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, loadFonts, start, txt, seg, clamp, lerp, eio, eo, back, mulberry, wordmark, drawWordmark, fillT, textW } from './shared/core.js';

const { ctx } = setup({ dur: 6, fps: 24 });
const NIGHT = BRAND.ink, RING1 = '#25345A', RING2 = '#304371';
const SUN = '#FFC84A', SUN_S = '#F2A12F', CREAM = '#F7F8F6', CREAM_S = '#DCE4EC', MIST = '#9AA6C8';
const BLUE = '#5B7BFF', BLUE_S = '#3D5BE0', MINT = '#3FD8AE', MINT_S = '#22B38C', CORAL = '#FF6B5E', CORAL_S = '#E14B45';
const S0 = { x: W / 2, y: H / 2 };

// world in millimetres
const PAGE_L = { x: -420, y: -280, w: 420, h: 560 }, PAGE_R = { x: 0, y: -280, w: 420, h: 560 };
const WIN = { x: 50, y: -125, w: 320, h: 180 };
let M, WX, WY, D, C0, C1;
const Z0 = 0.16, Z1 = 9.6, OVER = 1.3;
const STARS = (() => { const r = mulberry(4), out = []; for (let i = 0; i < 520; i++) out.push({ x: (r() - .5) * 17000, y: (r() - .5) * 10000, s: .8 + r() * 1.8, c: r() < .7 ? MIST : r() < .85 ? CREAM : SUN }); return out; })();
const SPARK = (() => { const r = mulberry(8); return Array.from({ length: 9 }, () => ({ x: (r() - .5) * 9000, y: (r() - .5) * 5600, ph: r() * 6 })); })();

function camera(t) {
  const u = eio(seg(t, .9, 3.1)), back_ = eio(seg(t, 3.1, 3.6));
  const lz = lerp(Math.log(Z0), Math.log(Z1 * OVER), u) - Math.log(OVER) * back_;
  const z = Math.exp(lz);
  const w = clamp((1 / Z0 - 1 / z) / (1 / Z0 - 1 / Z1));
  return { z, cx: lerp(C0.x, C1.x, w), cy: lerp(C0.y, C1.y, w) };
}
const toS = (cam, x, y) => [(x - cam.cx) * cam.z + S0.x, (y - cam.cy) * cam.z + S0.y];
// one shade step: the whole shape in shade, then the base on a copy shifted toward the light (upper left), clipped
function twoTone(pathFn, base, shade, off) {
  ctx.fillStyle = shade; ctx.beginPath(); pathFn(0, 0); ctx.fill();
  ctx.save(); ctx.beginPath(); pathFn(0, 0); ctx.clip(); ctx.fillStyle = base; ctx.beginPath(); pathFn(-off, -off); ctx.fill(); ctx.restore();
}

function world(t, cam) {
  ctx.save(); ctx.translate(S0.x, S0.y); ctx.scale(cam.z, cam.z); ctx.translate(-cam.cx, -cam.cy);
  // the spread: two cream pages (one shade step), the right one with a window onto the night
  for (const P of [PAGE_L, PAGE_R]) {
    const rr = 6;
    const path = (ox, oy) => {
      ctx.roundRect(P.x + ox, P.y + oy, P.w, P.h, rr);
      if (P === PAGE_R) { ctx.rect(WIN.x + WIN.w + ox, WIN.y + oy, -WIN.w, WIN.h); }   // the window (reversed winding = hole)
    };
    twoTone(path, CREAM, CREAM_S, 9);
  }
  // left page: heading, a coral picture, text columns
  ctx.fillStyle = NIGHT; ctx.fillRect(-380, -240, 210, 30); ctx.fillRect(-380, -198, 140, 30);
  twoTone((ox, oy) => ctx.arc(-110 + ox, -120 + oy, 70, 0, 7), CORAL, CORAL_S, 8);
  ctx.fillStyle = MIST; for (let c = 0; c < 2; c++) for (let i = 0; i < 9; i++) ctx.fillRect(-380 + c * 180, -20 + i * 26, i === 8 ? 90 : 160, 9);
  // right page: caption under the window, a mint progress bar on the window's edge
  ctx.fillStyle = MIST; for (let i = 0; i < 4; i++) ctx.fillRect(50, 90 + i * 26, i === 3 ? 160 : 320, 9);
  ctx.fillStyle = NIGHT; ctx.fillRect(50, 205, 200, 26);
  ctx.fillStyle = RING2; ctx.fillRect(WIN.x, WIN.y + WIN.h - 8, WIN.w, 8);
  ctx.fillStyle = MINT; ctx.fillRect(WIN.x, WIN.y + WIN.h - 8, WIN.w * (.2 + .5 * seg(t, 0, 6)), 8);
  // the play triangle in the window's corner
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(WIN.x + 14, WIN.y + 14); ctx.lineTo(WIN.x + 14, WIN.y + 34); ctx.lineTo(WIN.x + 31, WIN.y + 24); ctx.closePath(); ctx.fill();
  // the wordmark inside the window; its point sits on two hard glow rings
  ctx.fillStyle = RING2; ctx.beginPath(); ctx.arc(D.x, D.y, M.dot.r * 2.3, 0, 7); ctx.fill();
  ctx.fillStyle = RING1; ctx.beginPath(); ctx.arc(D.x, D.y, M.dot.r * 1.65, 0, 7); ctx.fill();
  drawWordmark(ctx, M, WX, WY, { color: CREAM, dotColor: BRAND.ultra });
  ctx.restore();
}

function label(t, t0, t1, ax, ay, tag, line, side = 1) {
  const a = eio(seg(t, t0, t0 + .25)), b = eio(seg(t, t1 - .2, t1)); if (a <= 0 || b >= 1) return;
  const lx = ax + side * 90, ly = ay - 70;
  ctx.strokeStyle = CREAM; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, lx, a), lerp(ay, ly, a)); ctx.stroke();
  const wtag = textW(ctx, '600 17px Jost', tag, 3), wl = textW(ctx, '600 30px Jost', line, 0), w = Math.max(wtag, wl) + 8;
  const x = side > 0 ? lx + 12 : lx - 12 - w;
  ctx.save(); ctx.beginPath(); ctx.rect(x + w * b - 14, ly - 60, w * (a - b) + 32, 84); ctx.clip();
  ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.roundRect(x - 14, ly - 52, w + 28, 74, 10); ctx.fill();
  fillT(ctx, '600 17px Jost', tag, x, ly - 26, SUN, 3); fillT(ctx, '600 30px Jost', line, x, ly + 8, CREAM);
  ctx.restore();
  txt('lab' + tag, tag + ' ' + line, x, ly - 44, x + w, ly + 12, true);
}

function guide(t, cam) {
  const gx = 250, gy = 850, bob = Math.sin(t * 2.4) * 4;
  ctx.save(); ctx.translate(gx, gy + bob);
  // feet, ears (panels flapping), antenna with a lagging bead
  ctx.fillStyle = SUN_S; ctx.beginPath(); ctx.ellipse(-30, 78, 22, 12, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(30, 78, 22, 12, 0, 0, 7); ctx.fill();
  const flap = Math.sin(t * 7) * .15;
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 78, -6); ctx.rotate(s * flap); ctx.fillStyle = SUN_S; ctx.beginPath(); ctx.roundRect(-12, -26, 24, 52, 12); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = SUN_S; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -78); ctx.lineTo(Math.sin(t * 2.4 - .8) * 8, -120); ctx.stroke();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(Math.sin(t * 2.4 - .8) * 8, -126, 9, 0, 7); ctx.fill();
  twoTone((ox, oy) => ctx.arc(ox, oy, 80, 0, 7), SUN, SUN_S, 12);
  // the lens eye: the barrel steps out with turning grooves while the camera zooms
  const zoomK = Math.sin(seg(t, .9, 3.4) * Math.PI), barrel = 18 * zoomK;
  ctx.fillStyle = CREAM_S; ctx.beginPath(); ctx.arc(6, -4, 48 + barrel * .2, 0, 7); ctx.fill();
  ctx.strokeStyle = MIST; ctx.lineWidth = 2;
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + t * 6 * zoomK; ctx.beginPath(); ctx.moveTo(6 + Math.cos(a) * 40, -4 + Math.sin(a) * 40); ctx.lineTo(6 + Math.cos(a) * (48 + barrel * .2), -4 + Math.sin(a) * (48 + barrel * .2)); ctx.stroke(); }
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(6, -4, 40, 0, 7); ctx.fill();
  const smile = eio(seg(t, 3.5, 3.8)) * (1 - eio(seg(t, 5.2, 5.5)));
  const blink = t > 4.6 && t < 4.72;
  if (blink) { ctx.fillStyle = SUN_S; ctx.fillRect(-36, -8, 84, 8); }
  else if (smile > .5) { ctx.strokeStyle = NIGHT; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(6, 4, 20, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  else {
    const ir = 26 + 4 * Math.sin(seg(t, .25, .6) * Math.PI);   // the iris widens as it fires
    ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.arc(10, -4, ir, 0, 7); ctx.fill();
    ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(10, -4, ir * .5, 0, 7); ctx.fill();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(2, -13, 6, 0, 7); ctx.fill();
  }
  ctx.restore();
  return { x: gx + 16, y: gy - 4 + bob };
}

function instrument(t, cam) {
  // field of view, top right; it never moves
  const fov = W / cam.z;  // mm across the frame
  const str = fov >= 1000 ? (fov / 1000).toFixed(fov >= 10000 ? 0 : 1) + ' m' : fov >= 100 ? (fov / 10).toFixed(0) + ' cm' : fov.toFixed(0) + ' mm';
  const x = W - 96 - 380, y = 92;
  ctx.fillStyle = NIGHT; ctx.beginPath(); ctx.roundRect(x - 24, y - 40, 428, 168, 14); ctx.fill();
  fillT(ctx, '600 17px Jost', 'FIELD OF VIEW · CAMPO VISIVO', x, y, MIST, 3);
  fillT(ctx, '700 44px Jost', str, x, y + 50, CREAM, -1);
  const tx0 = x, tx1 = x + 380, ty = y + 92;
  ctx.strokeStyle = RING2; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx0, ty); ctx.lineTo(tx1, ty); ctx.stroke();
  const pos = f => lerp(tx0, tx1, clamp((Math.log(W / Z0) - Math.log(f)) / (Math.log(W / Z0) - Math.log(W / Z1 / OVER))));
  // stop icons: the spread, the window, the letter, the point
  const stops = [[840, 'page'], [320, 'win'], [120, 'letter'], [W / Z1, 'dot']];
  stops.forEach(([f, k]) => {
    const sx = pos(f), passed = fov <= f * 1.02; ctx.fillStyle = passed ? CREAM : MIST;
    if (k === 'page') { ctx.fillRect(sx - 9, ty - 30, 8, 14); ctx.fillRect(sx + 1, ty - 30, 8, 14); }
    else if (k === 'win') { ctx.fillRect(sx - 10, ty - 30, 20, 12); }
    else if (k === 'letter') { ctx.fillRect(sx - 3, ty - 32, 6, 16); }
    else { ctx.fillStyle = passed ? BRAND.ultra : MIST; ctx.beginPath(); ctx.arc(sx, ty - 24, 6, 0, 7); ctx.fill(); }
  });
  ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(pos(fov), ty, 9, 0, 7); ctx.fill();
  txt('fov', str, x, y + 14, x + 200, y + 54, true);
}

function draw(t) {
  if (!M) {
    M = wordmark(ctx, 23, -0.02);
    WX = WIN.x + WIN.w / 2 - M.width / 2; WY = WIN.y + WIN.h / 2 + M.asc * .42;
    D = { x: WX + M.dot.x, y: WY + M.dot.y };
    C0 = { x: -720, y: -180 }; C1 = { x: WIN.x + WIN.w / 2, y: WY - 30 / Z1 };
  }
  const cam = camera(t);
  ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
  // stars on a far layer (parallax ~0.18 of the zoom); dots never flicker, a few sparkles breathe slowly
  const zs = Z0 * Math.pow(cam.z / Z0, .18);
  for (const s of STARS) { const x = (s.x - cam.cx * .18) * zs + S0.x, y = (s.y - cam.cy * .18) * zs + S0.y; if (x < -5 || x > W + 5 || y < -5 || y > H + 5) continue; ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(x, y, s.s, 0, 7); ctx.fill(); }
  for (const s of SPARK) {
    const x = (s.x - cam.cx * .18) * zs + S0.x, y = (s.y - cam.cy * .18) * zs + S0.y, k = 1 + .16 * Math.sin(t * .3 * 6.28 + s.ph), r = 9 * k;
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }
  world(t, cam);
  const [dx, dy] = toS(cam, D.x, D.y);

  // stop labels: one per screen, attached by a leader, wiping in and out
  const [px, py] = toS(cam, -420, -280); label(t, .05, .95, px + 10, py + 10, 'EDITORIAL · 84 CM', 'la rivista', -1);
  const [wx2, wy2] = toS(cam, WIN.x, WIN.y); label(t, 1.75, 2.35, Math.max(wx2, 160), Math.max(wy2, 200), 'MOTION · 32 CM', 'il video', 1);
  const [lx, ly] = toS(cam, WX, WY - M.asc); label(t, 2.45, 3.0, Math.max(lx, 160), Math.max(ly, 200), 'GRAPHIC · 12 CM', 'il segno', 1);

  // the guide fires its sight line at the next-stop ring around the speck
  const lens = guide(t, cam);
  const fire = seg(t, .25, .75), gone = seg(t, .95, 1.25);
  if (fire > 0 && gone < 1) {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const pop = clamp(fire * n - i), stream = (t * .08) % (1 / n);
      const u = i / n + stream, x = lerp(lens.x, dx, u), y = lerp(lens.y, dy, u) - Math.sin(u * Math.PI) * 120;
      const s = pop < .6 ? pop / .6 * 1.3 : lerp(1.3, 1, (pop - .6) / .4);
      const r = 6 * s * (1 - gone) * Math.min(1, u * 6) * Math.min(1, (1 - u) * 6);
      if (r > 0) { ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    }
  }
  const ring = back(seg(t, .55, .8), 2) * (1 - eio(seg(t, 1.5, 1.75)));
  if (ring > 0) {
    ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(dx, dy, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = SUN; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(dx, dy, 26 * ring, 0, 7); ctx.stroke();
    ctx.setLineDash([8, 9]); ctx.lineDashOffset = -t * 30; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(dx, dy, 42 * ring, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(dx + 30 * ring, dy - 30 * ring); ctx.lineTo(dx + 90, dy - 90); ctx.stroke();
    if (ring > .5) { fillT(ctx, '600 17px Jost', 'NEXT STOP · PROSSIMA FERMATA', dx + 100, dy - 120, SUN, 3); fillT(ctx, '600 30px Jost', 'il tuo ultra', dx + 100, dy - 86, CREAM); }
    txt('next', 'NEXT STOP il tuo ultra', dx + 100, dy - 140, dx + 480, dy - 80, true);
  }
  instrument(t, cam);

  // the lockup: the wordmark is in the world; the claim rises from below its baseline (spring) once we land
  if (t > 3.2) {
    const left = WX, [sx0] = toS(cam, left, 0), [sx1] = toS(cam, WX + M.width, 0), [, sb] = toS(cam, 0, WY), [, st] = toS(cam, 0, WY - M.asc);
    txt('wordmark', 'ultrasintesi', sx0, st, sx1, sb);
  }
  [[CLAIM_IT, '600 50px Jost', CREAM, 3.12, 700], [CLAIM_EN, '500 32px Jost', MIST, 3.2, 752]].forEach(([s, f, c, t0, y], k) => {
    const p = clamp(back(seg(t, t0, t0 + .3), 1.6), 0, 1.2); if (p <= 0) return;
    const w = textW(ctx, f, s);
    ctx.save(); ctx.beginPath(); ctx.rect(0, y - 52, W, 66); ctx.clip(); fillT(ctx, f, s, (W - w) / 2, y + (1 - p) * 60, c); ctx.restore();
    txt('claim' + k, s, (W - w) / 2, y - 40, (W + w) / 2, y + 10);
  });
}

start(draw, loadFonts(['IS', 'Jost']));
