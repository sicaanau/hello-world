// Scissor-cut shapes and type: outlines flattened, resampled every ~9 px and displaced along their normals by
// low-frequency noise, cut ONCE in the piece's own space and cached (a moving cutout keeps its edge).
import opentype from './vendor/opentype.module.js';
import { mulberry, vnoise } from '/core/lib.js';

export async function loadOT(url) { const b = await (await fetch(url)).arrayBuffer(); return opentype.parse(b); }

function flatten(cmds) {
  const out = []; let cur = null, sx = 0, sy = 0, px = 0, py = 0;
  const push = (x, y) => { cur.push([x, y]); px = x; py = y; };
  for (const c of cmds) {
    if (c.type === 'M') { if (cur && cur.length > 2) out.push(cur); cur = []; push(c.x, c.y); sx = c.x; sy = c.y; }
    else if (c.type === 'L') push(c.x, c.y);
    else if (c.type === 'Q') { const x0 = px, y0 = py; for (let i = 1; i <= 8; i++) { const t = i / 8, u = 1 - t; push(u * u * x0 + 2 * u * t * c.x1 + t * t * c.x, u * u * y0 + 2 * u * t * c.y1 + t * t * c.y); } }
    else if (c.type === 'C') { const x0 = px, y0 = py; for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; push(u * u * u * x0 + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x, u * u * u * y0 + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y); } }
    else if (c.type === 'Z') { if (cur && cur.length > 2) out.push(cur); cur = null; px = sx; py = sy; }
  }
  if (cur && cur.length > 2) out.push(cur);
  return out;
}

function resample(pts, step) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  return out;
}

// displace a closed contour along its normals: amp px of low-frequency noise plus a rare 1–2 px notch
export function cutContour(pts, seed, amp = 1.6, step = 9.5) {
  const r = mulberry(seed), p = resample(pts, step), n = p.length, off = r() * 100;
  return p.map((q, i) => {
    const a = p[(i - 1 + n) % n], b = p[(i + 1) % n];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    let d = (vnoise(off + i * 0.23) * 2 - 1) * amp + (vnoise(off * 2 + i * 0.9) * 2 - 1) * amp * 0.35;
    if (r() < 0.035) d -= 1 + r();
    return [q[0] + nx * d, q[1] + ny * d];
  });
}
export function toPath(contours) {
  const p = new Path2D();
  for (const c of contours) { p.moveTo(c[0][0], c[0][1]); for (let i = 1; i < c.length; i++) p.lineTo(c[i][0], c[i][1]); p.closePath(); }
  return p;
}
export const cutShape = (contours, seed, amp) => toPath(contours.map((c, i) => cutContour(c, seed + i * 17, amp)));
export function circlePts(cx, cy, r, n = 0) { n = n || Math.max(24, Math.round(r * 2 * Math.PI / 9)); return Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i / n * 2 * Math.PI), cy + r * Math.sin(i / n * 2 * Math.PI)]); }

// a line of type as cut letters: each letter re-cut, with its own small rotation and baseline jitter.
// Returns [{ch, x, w, path, rot, dy, cx, cy}] in a space whose origin is the line's start on the baseline.
export function cutText(font, str, size, seed, { ls = 0, amp = 1.2, jitter = true } = {}) {
  const r = mulberry(seed); let x = 0; const out = [];
  const glyphs = font.stringToGlyphs(str);
  glyphs.forEach((g, i) => {
    const adv = g.advanceWidth * size / font.unitsPerEm;
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) * size / font.unitsPerEm : 0;
    const path = g.getPath(0, 0, size), bb = path.getBoundingBox();
    const contours = flatten(path.commands);
    out.push({
      ch: str[i], x, w: adv, path: contours.length ? cutShape(contours, seed * 31 + i * 7, amp) : null,
      rot: jitter ? (r() * 2 - 1) * 0.8 * Math.PI / 180 : 0, dy: jitter ? (r() * 2 - 1) * 1.5 : 0,
      cx: (bb.x1 + bb.x2) / 2, cy: (bb.y1 + bb.y2) / 2, top: bb.y1, bottom: bb.y2,
    });
    x += adv + kern + ls;
  });
  out.width = x - ls;
  return out;
}
export function drawLetter(ctx, L, x, y, { s = 1, rot = 0 } = {}) {
  if (!L.path) return;
  ctx.save(); ctx.translate(x + L.x + L.cx, y + L.dy + L.cy); ctx.rotate(L.rot + rot); ctx.scale(s, s); ctx.translate(-L.cx, -L.cy);
  ctx.fill(L.path); ctx.restore();
}
