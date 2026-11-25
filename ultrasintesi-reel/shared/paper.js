// Paper: layers separated by a cut gap in the ground colour + a small paper shadow; a static paper texture;
// ink voids; a light per-frame grain.
import { mulberry, vnoise } from '/core/lib.js';
import { W, H } from './core.js';

const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tint = mk();
const tctx = tint.getContext('2d');

export function newLayer() { const c = mk(); return { c, ctx: c.getContext('2d'), clear() { this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, W, H); } }; }

function tinted(src, color) {
  tctx.globalCompositeOperation = 'source-over'; tctx.clearRect(0, 0, W, H); tctx.drawImage(src, 0, 0);
  tctx.globalCompositeOperation = 'source-in'; tctx.fillStyle = color; tctx.fillRect(0, 0, W, H);
  tctx.globalCompositeOperation = 'source-over'; return tint;
}
// composite a layer onto ctx: shadow → cut gap in the ground colour → the layer itself
export function paperComposite(ctx, layer, ground, { gap = 2.4, shadow = 0.3, off = [3, 4] } = {}) {
  ctx.save();
  if (shadow > 0) { ctx.filter = 'blur(4px)'; ctx.globalAlpha = shadow; ctx.drawImage(tinted(layer.c, '#000'), off[0], off[1]); ctx.filter = 'none'; ctx.globalAlpha = 1; }
  if (gap > 0) { const g = tinted(layer.c, ground); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; ctx.drawImage(g, Math.cos(a) * gap, Math.sin(a) * gap); } }
  ctx.drawImage(layer.c, 0, 0);
  ctx.restore();
}

let tex = null, grain = null;
export function paperTexture(seed = 7) {
  if (tex) return tex;
  tex = mk(); const g = tex.getContext('2d'), img = g.createImageData(W, H), d = img.data, r = mulberry(seed);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const m = vnoise(x / 180 + vnoise(y / 260) * 3) * .55 + vnoise(y / 90 + x / 400 + 50) * .3 + r() * .15;
    const streak = vnoise(y / 14 + 300) * .5;                    // faint squeegee streaks
    const v = 255 - m * 16 - streak * 6, i = (y * W + x) * 4;
    d[i] = v; d[i + 1] = v - 2; d[i + 2] = v - 6; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(120,105,85,0.10)'; g.lineWidth = 0.8;        // fibres
  for (let k = 0; k < 900; k++) { const x = r() * W, y = r() * H, a = r() * Math.PI * 2, l = 6 + r() * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return tex;
}
let voids = null;
function inkVoids(seed = 9) {
  if (voids) return voids;
  voids = mk(); const g = voids.getContext('2d'), r = mulberry(seed);
  g.fillStyle = 'rgba(255,250,240,0.55)';
  for (let k = 0; k < 2600; k++) { const x = r() * W, y = r() * H, s = .4 + r() * r() * 2.2; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill(); }
  return voids;
}
export function finishPaper(ctx, t, { texture = 0.9, voids: v = 0.22, grain: gr = 0.05 } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = texture; ctx.drawImage(paperTexture(), 0, 0);
  ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = v; ctx.drawImage(inkVoids(), 0, 0);
  if (gr > 0) {
    if (!grain) { grain = mk(512, 512); const g = grain.getContext('2d'), img = g.createImageData(512, 512), r = mulberry(3); for (let i = 0; i < img.data.length; i += 4) { const n = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = n; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); }
    const f = Math.floor(t * 24), r = mulberry(f + 11), ox = -Math.floor(r() * 512), oy = -Math.floor(r() * 512);
    ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = gr;
    for (let x = ox; x < W; x += 512) for (let y = oy; y < H; y += 512) ctx.drawImage(grain, x, y);
  }
  ctx.restore();
}
