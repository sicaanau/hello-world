// 02 · 60s Spy Title Sequence — four inks, cut paper. Shot 1: the disciplines are the set; a silhouette walks in
// front of a giant circle, following the blue point, and catches it on the beat (stop-time). Hard cut on the stab
// at 3.0 s: graphic match cut on the point, the title assembles from cut letters that slap down around it.
import { W, H, BRAND, CLAIM_IT, CLAIM_EN, setup, start, txt, seg, clamp, lerp, eo, eio, mulberry, loadFonts } from './shared/core.js';
import { loadOT, cutText, drawLetter, cutShape, circlePts, cutContour, toPath } from './shared/cut.js';
import { newLayer, paperComposite, finishPaper, paperTexture } from './shared/paper.js';

const { ctx } = setup({ dur: 6, fps: 24 });
const INK = '#1B2744', CREAM = '#F3EFE4', HOT = BRAND.ultra, SEC = BRAND.acqua, SEC_D = '#93B2CA';
const on2 = t => Math.floor(t * 12) / 12;           // puppets on twos

let F = {};
const L1 = newLayer(), L2 = newLayer(), L3 = newLayer();

// ---------------- the figure: pieces in their bone's local space, cut once ----------------
const P = (pts, seed, amp = 1.5) => cutShape([pts], seed, amp);
const PIECES = {
  torso: P([[-26, -232], [-6, -240], [18, -236], [34, -204], [32, -150], [27, -60], [30, 10], [38, 70], [40, 106], [-50, 106], [-40, 40], [-31, -60], [-34, -170]], 1),
  head: P([[-22, -2], [-24, -30], [-20, -58], [6, -66], [26, -56], [30, -40], [44, -32], [30, -24], [32, -12], [22, -2], [2, 4]], 2),
  brim: P([[-40, -60], [50, -64], [52, -56], [-38, -52]], 3, 1),
  crown: P([[-28, -58], [-24, -96], [-4, -102], [8, -94], [22, -100], [32, -58]], 4, 1),
  uarm: P([[-14, -6], [0, -14], [14, -6], [12, 118], [-11, 118]], 5),
  farm: P([[-11, 0], [11, 0], [8, 104], [10, 112], [2, 142], [-7, 110], [-8, 100]], 6),
  thigh: P([[-23, -8], [23, -8], [16, 144], [-14, 144]], 7),
  shin: P([[-14, 0], [15, 0], [11, 132], [16, 134], [52, 148], [50, 158], [-14, 158], [-10, 132]], 8),
};
const deg = d => d * Math.PI / 180;
// angles: forward-positive (the figure faces +x); canvas rotation is the negative
function pose(phase, catchK) {
  const s = Math.sin(phase * 2 * Math.PI), c = Math.sin(phase * 2 * Math.PI + Math.PI);
  const knee = x => 6 + 34 * clamp(Math.sin((x + .3) * 2 * Math.PI), 0, 1);
  const walk = {
    lean: 5, thN: 26 * s, thF: 26 * c, knN: knee(phase), knF: knee(phase + .5),
    uaN: -24 * s, faN: 18, uaF: -24 * c, faF: 18, bob: -7 * Math.abs(Math.cos(phase * 2 * Math.PI)),
  };
  const reach = { lean: -2, thN: 4, thF: -4, knN: 4, knF: 4, uaN: 98, faN: 106, uaF: -10, faF: 12, bob: -4 };
  const o = {}; for (const k in walk) o[k] = lerp(walk[k], reach[k], catchK); return o;
}
function drawFigure(g, hx, hy, p, scale, t) {
  g.save(); g.translate(hx, hy + p.bob * scale); g.scale(scale, scale);
  const limb = (thA, knA) => { g.save(); g.translate(0, 4); g.rotate(-deg(thA)); g.fill(PIECES.thigh); g.translate(0, 140); g.rotate(deg(knA)); g.fill(PIECES.shin); g.restore(); };
  const arm = (ua, fa) => { g.save(); g.rotate(-deg(p.lean)); g.translate(2, -214); g.rotate(-deg(ua)); g.fill(PIECES.uarm); g.translate(0, 116); g.rotate(-deg(fa - ua)); g.fill(PIECES.farm); g.restore(); };
  g.fillStyle = INK;
  limb(p.thF, p.knF); arm(p.uaF, p.faF);
  g.save(); g.rotate(-deg(p.lean)); g.fill(PIECES.torso); g.translate(6, -238); g.fill(PIECES.head); g.fill(PIECES.brim); g.fill(PIECES.crown); g.restore();
  limb(p.thN, p.knN); arm(p.uaN, p.faN);
  // joint slits (merged figure, only thin cuts at shoulder and hip)
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 2.2;
  g.save(); g.rotate(-deg(p.lean)); g.beginPath(); g.moveTo(-6, -196); g.quadraticCurveTo(14, -186, 24, -200); g.stroke(); g.restore();
  g.beginPath(); g.moveTo(-18, 30); g.lineTo(20, 26); g.stroke();
  g.globalCompositeOperation = 'source-over';
  // the scarf: the hero's one hot accent, a multi-segment ribbon with a travelling sine, streaming back
  g.save(); g.rotate(-deg(p.lean)); g.translate(4, -232);
  const segs = 9, wave = t * 9; g.fillStyle = HOT; g.beginPath();
  const pts = []; for (let i = 0; i <= segs; i++) { const u = i / segs; pts.push([-u * 150, u * 40 + Math.sin(wave - u * 5) * 14 * u]); }
  g.moveTo(14, -6); pts.forEach(([x, y], i) => g.lineTo(x, y - 9 * (1 - i / segs * .5)));
  for (let i = segs; i >= 0; i--) { const [x, y] = pts[i]; g.lineTo(x, y + 9 * (1 - i / segs * .5)); }
  g.lineTo(16, 10); g.closePath(); g.fill();
  g.restore();
  g.restore();
}
// forward kinematics of the near hand tip, for the catch
function handTip(hx, hy, p, scale) {
  const R = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  let [sx, sy] = R(2, -214, -deg(p.lean));
  let [ex, ey] = R(0, 116, -deg(p.uaN)); ex += sx; ey += sy;
  let [tx, ty] = R(0, 138, -deg(p.faN)); tx += ex; ty += ey;
  return [hx + tx * scale, hy + (ty + p.bob) * scale];
}

// ---------------- layout ----------------
const SCALE = 1.05, FEET = 1000, HIP_Y = FEET - 300 * SCALE;
const CATCH = 2.5, STOP = 2.25, SPEED = 250;
let WM, WMX, WMY, DOT, HIP_X1, CIRCLE, WORDS, CLAIM1, CLAIM2;

function build() {
  WM = cutText(F.isB, 'ultra', 210, 11, { ls: -4 });
  const wm2 = cutText(F.isR, 'sintesı', 210, 12, { ls: -4 });
  const wmW = WM.width - 4 + wm2.width;
  wm2.forEach(L => { L.x += WM.width - 4; WM.push(L); }); WM.width = wmW;
  const last = WM[WM.length - 1];
  const reach = pose(0, 1), hand = handTip(0, HIP_Y, reach, SCALE);
  // match cut: the point sits where the hand catches it, and on the ı of the title
  WMX = Math.round((W - wmW) / 2);
  DOT = { x: WMX + last.x + last.cx, y: hand[1], r: 17 };
  WMY = Math.round(DOT.y + 210 * 0.62);
  HIP_X1 = DOT.x - hand[0];
  CIRCLE = cutShape([circlePts(HIP_X1 + 40, 560, 350)], 21, 2.2);
  WORDS = ['GRAPHIC', 'MOTION', 'EDITORIAL'].map((w, i) => ({ w, L: cutText(F.lg, w, 250, 40 + i, { ls: 6 }), y: 330 + i * 232, land: .5 + i * .5 }));
  CLAIM1 = cutText(F.ls, CLAIM_IT, 54, 60, { amp: .8 }); CLAIM2 = cutText(F.ls, CLAIM_EN, 38, 61, { amp: .7 });
  paperTexture();
}

function shot1(t) {
  const tp = on2(t), frozen = t >= CATCH;                                   // stop-time from the catch to the cut
  const tt = frozen ? CATCH : tp;
  ctx.fillStyle = SEC; ctx.fillRect(0, 0, W, H);
  // the giant circle
  L1.clear(); L1.ctx.fillStyle = CREAM; L1.ctx.fill(CIRCLE);
  paperComposite(ctx, L1, SEC);
  // the disciplines as the set: slide in along their baselines, stop dead on the beat
  L2.clear(); const g = L2.ctx; g.fillStyle = INK;
  WORDS.forEach(({ w, L, y, land }, i) => {
    const k = eo(seg(t, land - .22, land)); if (k <= 0) return;
    const x = lerp(-L.width - 60, 120, frozen ? 1 : k);
    L.forEach((l, j) => drawLetter(g, l, x, y, { s: 1 }));
    if (k >= 1) txt('w' + i, w, 120, y - 200, 120 + L.width, y + 4);
  });
  paperComposite(ctx, L2, SEC);
  // the figure walks (on twos), stops on 2.25, reaches and catches the point on the 2.5 beat
  const walkT = Math.min(tt, STOP), hx = HIP_X1 - (STOP - walkT) * SPEED;
  const phase = (walkT * 1.0) % 1, ck = eio(seg(tt, STOP, CATCH));
  const p = pose(phase, ck);
  L3.clear(); drawFigure(L3.ctx, hx, HIP_Y, p, SCALE, tt);
  // the point: cobalt on an ink backing, floating ahead at head height, then into the hand
  const tip = handTip(hx, HIP_Y, p, SCALE);
  const fx = lerp(hx + 300, DOT.x, eio(seg(tt, 0, CATCH))), fy = DOT.y - 40 * Math.sin(tt * Math.PI * 2) * (1 - seg(tt, 1.6, CATCH));
  const dx = tt >= CATCH ? DOT.x : fx, dy = tt >= CATCH ? DOT.y : fy;
  const gg = L3.ctx; gg.fillStyle = INK; gg.beginPath(); gg.arc(dx, dy, DOT.r + 5, 0, 7); gg.fill();
  gg.fillStyle = HOT; gg.beginPath(); gg.arc(dx, dy, DOT.r, 0, 7); gg.fill();
  paperComposite(ctx, L3, SEC);
}

function shot2(t) {
  const tp = on2(t);
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  // the title assembles: cut letters slap down one drawing at a time, left to right, around the point
  L1.clear(); const g = L1.ctx; g.fillStyle = CREAM;
  let all = true;
  WM.forEach((l, i) => {
    const t0 = 3.0 + i * .045, k = tp - t0;
    if (k < 0) { all = false; return; }
    const s = k < 1 / 12 ? 1.16 : 1, rot = k < 1 / 12 ? .05 * (i % 2 ? 1 : -1) : 0;
    drawLetter(g, l, WMX, WMY, { s, rot });
  });
  if (all) txt('wordmark', 'ultrasintesi', WMX, WMY - 155, WMX + WM.width, WMY + 4);
  paperComposite(ctx, L1, INK, { shadow: .45 });
  // the point keeps its centre and size across the cut; a cream keyline makes it read on the dark ground
  L2.clear(); const h = L2.ctx;
  h.fillStyle = CREAM; h.beginPath(); h.arc(DOT.x, DOT.y, DOT.r + 5, 0, 7); h.fill();
  h.fillStyle = HOT; h.beginPath(); h.arc(DOT.x, DOT.y, DOT.r, 0, 7); h.fill();
  paperComposite(ctx, L2, INK, { shadow: .45 });
  // the claim slides in along its baseline and stops dead
  L3.clear(); const c = L3.ctx;
  const y1 = WMY + 120, y2 = y1 + 58;
  [[CLAIM1, y1, 3.15, CREAM], [CLAIM2, y2, 3.25, SEC]].forEach(([L, y, t0, col], k) => {
    const e = eo(seg(t, t0, t0 + .18)); if (e <= 0) return;
    const x = lerp(-L.width - 40, (W - L.width) / 2, e);
    c.fillStyle = col; L.forEach(l => drawLetter(c, l, x, y));
    if (e >= 1) txt('claim' + k, k ? CLAIM_EN : CLAIM_IT, x, y - 44, x + L.width, y + 12);
  });
  paperComposite(ctx, L3, INK, { shadow: .45 });
}

function draw(t) {
  if (t < 3.0) shot1(t); else shot2(t);
  finishPaper(ctx, t, { texture: .95, voids: t < 3 ? .12 : .2, grain: .05 });
}

start(draw, (async () => {
  await loadFonts(['IS']);
  const [isB, isR, lg, ls] = await Promise.all(['IS-Bold', 'IS-Regular', 'LeagueGothic-Static', 'LeagueSpartan-600'].map(n => loadOT(`fonts/${n}.ttf`)));
  F = { isB, isR, lg, ls }; build();
})());
