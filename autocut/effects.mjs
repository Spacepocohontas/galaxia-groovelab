/* Canvas-only shot treatments, motion, multi-panel looks and beat-aware transitions. */
const within = (v, min, max) => Math.max(min, Math.min(max, v));
const rgba = (hex, a = 1) => {
  const h = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#cb8eef';
  const n = parseInt(h.slice(1), 16);
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
};
const ease = x => 1 - Math.pow(1 - within(x, 0, 1), 3);
const filter = {
  natural: 'none',
  punch: 'contrast(1.24) saturate(1.3)',
  noir: 'contrast(1.28) saturate(.46) brightness(.83)',
  glitch: 'contrast(1.25) saturate(1.4)',
  dream: 'saturate(1.35) brightness(1.09) blur(.8px)',
  vhs: 'contrast(1.10) saturate(.80)',
  bloom: 'saturate(1.18) brightness(1.12)',
  cyber: 'contrast(1.23) saturate(1.7) hue-rotate(12deg)',
  duotone: 'contrast(1.18) saturate(.65)',
  grain: 'contrast(1.05) saturate(.85)',
  monochrome: 'contrast(1.23) grayscale(1)',
  neon: 'contrast(1.16) saturate(1.95)',
  filmBurn: 'sepia(.22) brightness(1.1)',
  ghost: 'contrast(1.10) saturate(.8)',
  kaleido: 'saturate(1.4)',
  mirror: 'contrast(1.05)',
  split: 'saturate(1.25)',
  pixel: 'contrast(1.24) saturate(1.2)',
  solarize: 'invert(.17) saturate(1.5) contrast(1.5)',
  halftone: 'grayscale(.45) contrast(1.5)',
  blur: 'saturate(1.2) blur(1.5px)',
  chrome: 'contrast(1.4) saturate(.68) brightness(1.12)',
  scanline: 'contrast(1.1) saturate(.93)',
  vignette: 'contrast(1.10) brightness(.94)'
};
const tile = new Map();

function imageDimensions(media) {
  const element = media?.el;
  return [element?.videoWidth || element?.naturalWidth || 0, element?.videoHeight || element?.naturalHeight || 0];
}
function applyMotion(ctx, w, h, segment, local, span) {
  const p = within(local / Math.max(.1, span), 0, 1);
  const intensity = within(segment.intensity ?? .75, .1, 1);
  let scale = segment.crop || 1.07, rotation = 0;
  let x = 0, y = 0;
  const amount = Math.min(w, h) * .11 * intensity;
  switch (segment.motion) {
    case 'pushIn': scale *= 1 + .18 * p; break;
    case 'pullOut': scale *= 1.22 - .2 * p; break;
    case 'panLeft': x = amount * (1 - 2 * p); break;
    case 'panRight': x = amount * (2 * p - 1); break;
    case 'panUp': y = amount * (1 - 2 * p); break;
    case 'panDown': y = amount * (2 * p - 1); break;
    case 'tiltLeft': rotation = -.055 * Math.PI + .09 * p; break;
    case 'tiltRight': rotation = .055 * Math.PI - .09 * p; break;
    case 'bounce': y = Math.sin(p * Math.PI * 3) * amount * .23; scale *= 1 + Math.sin(p * Math.PI * 3) * .035; break;
    case 'spin': rotation = .17 * Math.PI * (2 * p - 1); scale *= 1.2; break;
    case 'drift': x = Math.sin(p * Math.PI) * amount * .4; y = -p * amount * .4; break;
    case 'shake': x = Math.sin(local * 51 + segment.variant) * amount * .15; y = Math.cos(local * 37 + segment.variant) * amount * .11; break;
  }
  ctx.translate(w / 2 + x, h / 2 + y);
  ctx.rotate(rotation);
  ctx.scale(scale * (segment.flip ? -1 : 1), scale);
}
function imageCover(ctx, media, w, h) {
  const [iw, ih] = imageDimensions(media);
  if (!iw || !ih) return false;
  const ratio = Math.max(w / iw, h / ih), dw = iw * ratio, dh = ih * ratio;
  try {
    ctx.drawImage(media.el, -dw / 2, -dh / 2, dw, dh);
  } catch { return false; }
  return true;
}
function drawSingle(ctx, canvas, media, segment, local, alpha) {
  const w = canvas.width, h = canvas.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = filter[segment.effect] || 'none';
  applyMotion(ctx, w, h, segment, local, segment.end - segment.start);
  imageCover(ctx, media, w, h);
  ctx.restore();
}
function drawMirror(ctx, canvas, media, segment, local, alpha) {
  const w = canvas.width, h = canvas.height;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.beginPath();ctx.rect(i * w / 2, 0, w / 2, h);ctx.clip();
    ctx.translate(i ? w : 0, 0);ctx.scale(i ? -1 : 1, 1);
    drawSingle(ctx, canvas, media, segment, local, alpha);
    ctx.restore();
  }
}
function drawSplit(ctx, canvas, media, segment, local, alpha, quad = false) {
  const w = canvas.width, h = canvas.height;
  const count = quad ? 4 : 2;
  for (let n = 0; n < count; n++) {
    const x = quad ? (n % 2) * w / 2 : n * w / 2;
    const y = quad ? Math.floor(n / 2) * h / 2 : 0;
    const pw = w / 2, ph = quad ? h / 2 : h;
    ctx.save();ctx.beginPath();ctx.rect(x, y, pw, ph);ctx.clip();
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.scale(quad ? .75 : .98, quad ? .75 : .98);
    ctx.translate(-w / 2, -h / 2);
    drawSingle(ctx, canvas, media, segment, local + n * .1, alpha);
    ctx.restore();
  }
  ctx.save();ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(w / 2 - 1, 0, 2, h);
  if (quad) ctx.fillRect(0, h / 2 - 1, w, 2);
  ctx.restore();
}
function pixelDraw(ctx, canvas, media, seg, local, alpha) {
  const w = canvas.width, h = canvas.height;
  const factor = 14;
  let work = tile.get('pixel');
  if (!work) {work = document.createElement('canvas'); tile.set('pixel', work);}
  const sw = Math.max(20, Math.floor(w / factor)), sh = Math.max(20, Math.floor(h / factor));
  if (work.width !== sw || work.height !== sh) {work.width = sw;work.height = sh;}
  const wc = work.getContext('2d');
  wc.save();wc.setTransform(sw / w, 0, 0, sh / h, 0, 0);wc.clearRect(0, 0, w, h);
  drawSingle(wc, canvas, media, seg, local, 1);
  wc.restore();
  ctx.save();ctx.globalAlpha = alpha;ctx.imageSmoothingEnabled = false;ctx.drawImage(work, 0, 0, w, h);ctx.restore();
}
export function drawShot(ctx, canvas, media, segment, time, alpha = 1) {
  if (!media) return;
  const local = Math.max(0, time - segment.start);
  if (segment.effect === 'mirror') return drawMirror(ctx, canvas, media, segment, local, alpha);
  if (segment.effect === 'split') return drawSplit(ctx, canvas, media, segment, local, alpha);
  if (segment.effect === 'kaleido') return drawSplit(ctx, canvas, media, segment, local, alpha, true);
  if (segment.effect === 'pixel') return pixelDraw(ctx, canvas, media, segment, local, alpha);
  drawSingle(ctx, canvas, media, segment, local, alpha);
}
function pattern(ctx, canvas, kind) {
  if (!tile.has(kind)) {
    const p = document.createElement('canvas');p.width = 64;p.height = 64;
    const pc = p.getContext('2d');
    if (kind === 'grain') {
      const img = pc.createImageData(64, 64);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (i * 37 + Math.floor(i / 37) * 137) % 255;
        img.data[i] = n;img.data[i + 1] = n;img.data[i + 2] = n;img.data[i + 3] = 55;
      }
      pc.putImageData(img, 0, 0);
    } else {
      pc.fillStyle = '#ffffff42';
      for (let y = 0; y < 64; y += 8)
        for (let x = 0; x < 64; x += 8) {
          pc.beginPath();pc.arc(x, y, 1.6, 0, Math.PI * 2);pc.fill();
        }
    }
    tile.set(kind, p);
  }
  return ctx.createPattern(tile.get(kind), 'repeat');
}
export function drawTreatment(ctx, canvas, segment, time, safeFlash = true) {
  const w = canvas.width, h = canvas.height;
  const local = Math.max(0, time - segment.start);
  const intensity = within(segment.intensity ?? .75, .1, 1);
  ctx.save();
  const color = segment.accent || '#de8bed';
  const burn = (strength = 1) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, rgba('#f4a65f', .28 * strength));
    g.addColorStop(.4, rgba('#ed6692', .10 * strength));
    g.addColorStop(1, rgba(color, .45 * strength));
    ctx.fillStyle = g;ctx.fillRect(0, 0, w, h);
  };
  switch (segment.effect) {
    case 'filmBurn': burn(.7 * intensity);break;
    case 'grain':
    case 'vhs':
    case 'scanline': {
      ctx.globalAlpha = (segment.effect === 'vhs' ? .28 : .12) * intensity;
      ctx.fillStyle = pattern(ctx, canvas, 'grain');
      ctx.fillRect(0, 0, w, h);
      if (segment.effect !== 'grain') {
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        for (let y = 0; y < h; y += 7) ctx.fillRect(0, y, w, 1);
        if (segment.effect === 'vhs') {ctx.fillStyle = rgba(color, .5);ctx.fillRect(0, ((time * 80) % h), w, h * .025);}
      }
      break;
    }
    case 'halftone':ctx.globalAlpha = .7 * intensity;ctx.fillStyle = pattern(ctx, canvas, 'dots');ctx.fillRect(0, 0, w, h);break;
    case 'duotone':ctx.fillStyle = rgba(color, .22 * intensity);ctx.fillRect(0, 0, w, h);break;
    case 'neon':
    case 'cyber': {
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, rgba(color, .26 * intensity));
      gradient.addColorStop(.5, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, rgba('#43def3', .30 * intensity));
      ctx.fillStyle = gradient;ctx.fillRect(0, 0, w, h);break;
    }
    case 'glitch': {
      if (Math.floor(time * 12 + segment.variant) % 7 < 2) {
        const y = (Math.sin(time * 13 + segment.variant) * .5 + .5) * h;
        ctx.fillStyle = rgba(color, .32 * intensity);ctx.fillRect(0, y, w, h * .055);
        ctx.fillStyle = 'rgba(50,238,251,.21)';ctx.fillRect(w * .12, y + 12, w * .8, h * .018);
      }
      break;
    }
    case 'ghost': {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rgba(color, .09 * intensity);
      ctx.fillRect(Math.sin(time * 3) * 8, 0, w, h);
      break;
    }
    case 'solarize':ctx.fillStyle = rgba(color, .16 * intensity);ctx.fillRect(0, 0, w, h);break;
    case 'bloom':
    case 'dream': {
      const glow = ctx.createRadialGradient(w * .5, h * .25, 0, w * .5, h * .25, h * .72);
      glow.addColorStop(0, rgba(color, .12 * intensity));glow.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = glow;ctx.fillRect(0, 0, w, h);break;
    }
    case 'chrome': {
      ctx.fillStyle = 'rgba(255,255,255,.045)';
      ctx.fillRect(0, h * .18, w, h * .07);break;
    }
    case 'punch': {
      // One impact accent per cut. Default minimizes intense flicker.
      if (local < .07) {
        ctx.fillStyle = 'rgba(255,240,255,' + ((safeFlash ? .07 : .18) * intensity * (1 - local / .07)) + ')';
        ctx.fillRect(0, 0, w, h);
      }
      break;
    }
    default: break;
  }
  // Every scene has an edge treatment, not a full-screen effect.
  const shade = ctx.createRadialGradient(w / 2, h / 2, h * .12, w / 2, h / 2, Math.max(w, h) * .72);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,.44)');
  ctx.fillStyle = shade;ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
export function drawCutOverlay(ctx, canvas, segment, time, safeFlash = true) {
  if (segment.start <= 0) return;
  const t = Math.max(0, time - segment.start), w = canvas.width, h = canvas.height;
  const alpha = x => within(x, 0, 1);
  const fill = (color, power) => {ctx.fillStyle = rgba(color, power);ctx.fillRect(0, 0, w, h);};
  ctx.save();
  switch (segment.transition) {
    case 'flash':
      if (t < .15) fill('#ffffff', (safeFlash ? .17 : .55) * (1 - t / .15));
      break;
    case 'snap':
      if (t < .085) fill(segment.accent, .20 * (1 - t / .085));
      break;
    case 'glitch':
      if (t < .18) {fill(segment.accent, .21 * (1 - t / .18));ctx.fillStyle = '#61e5f444';ctx.fillRect(0, (t * 1200) % h, w, h * .025);}
      break;
    case 'filmBurn':
      if (t < .36) {
        const g = ctx.createLinearGradient(0, 0, w, h);
        const power = 1 - t / .36;
        g.addColorStop(0, rgba('#ffba68', .72 * power));
        g.addColorStop(.5, rgba('#e4578e', .46 * power));
        g.addColorStop(1, rgba(segment.accent, .11 * power));
        ctx.fillStyle = g;ctx.fillRect(0, 0, w, h);
      }
      break;
    case 'dip':
      if (t < .22) fill('#000000', alpha(1 - t / .22) * .75);
      break;
    case 'zoom':
      if (t < .15) fill('#ffffff', .10 * (1 - t / .15));
      break;
  }
  ctx.restore();
}
/* Opacity of previous shot during transition, 0 outside crossfade. */
export function transitionMix(segment, time) {
  const t = time - segment.start;
  const duration = segment.transition === 'dissolve' ? .33
    : ['whipLeft','whipRight','slideUp','wipe','spin'].includes(segment.transition) ? .22 : 0;
  return duration && t >= 0 && t < duration ? 1 - ease(t / duration) : 0;
}
