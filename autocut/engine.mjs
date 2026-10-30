/* GalaXia AutoCut: varied, beat-aware, deterministic local video editing. */
const style = (category, beats, effects, transitions, motions, description) =>
  ({ category, beats, effects, transitions, motions, description });

export const EFFECTS = [
  'natural', 'punch', 'noir', 'glitch', 'dream', 'vhs', 'bloom', 'cyber',
  'duotone', 'grain', 'monochrome', 'neon', 'filmBurn', 'ghost', 'kaleido',
  'mirror', 'split', 'pixel', 'solarize', 'halftone', 'blur', 'chrome',
  'scanline', 'vignette'
];
export const TRANSITIONS = [
  'cut', 'flash', 'dissolve', 'glitch', 'whipLeft', 'whipRight', 'zoom',
  'wipe', 'dip', 'spin', 'slideUp', 'snap', 'filmBurn'
];
export const MOTIONS = [
  'static', 'pushIn', 'pullOut', 'panLeft', 'panRight', 'panUp',
  'panDown', 'tiltLeft', 'tiltRight', 'bounce', 'spin', 'drift', 'shake'
];

export const PRESETS = {
  'Bass Impact': style('Viral', 2, ['punch','glitch','chrome','neon','duotone'], ['flash','zoom','snap','glitch'], ['pushIn','shake','bounce','pullOut'], 'Hard bass drops, punch zooms, impact edits.'),
  'Beat Rush': style('Viral', 1, ['punch','neon','chrome','solarize'], ['snap','whipLeft','whipRight','flash'], ['pushIn','panLeft','panRight','shake'], 'Quick-fire cuts that land on the beat.'),
  'Trend Sync': style('Viral', 2, ['natural','bloom','duotone','punch'], ['zoom','snap','wipe','cut'], ['pushIn','drift','pullOut','panLeft'], 'Short-form social pacing, fresh angles every scene.'),
  'Velocity Cuts': style('Viral', 1.5, ['punch','chrome','glitch','blur'], ['whipLeft','whipRight','zoom','snap'], ['panLeft','panRight','pushIn','spin'], 'Fast/slow footage movement with whip transitions.'),
  'Flash Zoom': style('Viral', 1, ['punch','neon','solarize','chrome'], ['flash','zoom','snap','cut'], ['pushIn','bounce','pullOut','shake'], 'Camera punches and sharp transitions on strong beats.'),
  'Hyperpop Frenzy': style('Viral', 1, ['pixel','glitch','solarize','halftone','duotone'], ['glitch','snap','wipe','whipRight'], ['spin','bounce','pushIn','panRight'], 'Candy-colored glitch edits & energetic reframes.'),
  'Clean Social': style('Viral', 3, ['natural','bloom','punch','vignette'], ['cut','wipe','dissolve','zoom'], ['pushIn','pullOut','panLeft','drift'], 'Crisp, readable montage edits with varied angles.'),
  'Dark Cinema': style('Cinematic', 4, ['noir','vignette','filmBurn','grain','monochrome'], ['dissolve','dip','wipe','cut'], ['drift','pushIn','panLeft','tiltLeft'], 'Moody compositions, shadows & dramatic fades.'),
  'Epic Trailer': style('Cinematic', 4, ['chrome','punch','filmBurn','noir','bloom'], ['dip','zoom','flash','spin'], ['pushIn','tiltLeft','pullOut','panUp'], 'A rising cinematic edit with major hit moments.'),
  'Noir Thriller': style('Cinematic', 5, ['noir','monochrome','grain','vignette'], ['dip','dissolve','wipe','snap'], ['panLeft','drift','pushIn','tiltRight'], 'Slow suspense, dark contrast & sudden cuts.'),
  'Heartbreak Film': style('Cinematic', 6, ['dream','filmBurn','grain','vignette'], ['dissolve','dip','wipe'], ['pullOut','drift','panRight','tiltLeft'], 'Melancholic memory montage with subtle movement.'),
  'Dreamwave': style('Cinematic', 6, ['dream','bloom','ghost','vignette'], ['dissolve','wipe','zoom'], ['drift','pullOut','panUp','tiltRight'], 'Airy dreamlight, soft movement & glowing cuts.'),
  'Romantic Slowburn': style('Cinematic', 7, ['bloom','dream','filmBurn','grain'], ['dissolve','wipe','dip'], ['pushIn','drift','pullOut','panLeft'], 'Long-lingering shots and gentle transitions.'),
  '90s Alt': style('Retro', 3, ['vhs','grain','monochrome','duotone','filmBurn'], ['flash','cut','dip','snap'], ['shake','pushIn','panRight','tiltLeft'], 'Gritty VHS tape meets post-punk music video.'),
  'VHS Tape': style('Retro', 4, ['vhs','grain','scanline','filmBurn'], ['cut','glitch','dip','wipe'], ['drift','panLeft','pullOut','shake'], 'Tracking lines, tape texture & nostalgic reframing.'),
  'Y2K Camcorder': style('Retro', 2.5, ['chrome','scanline','pixel','bloom'], ['zoom','snap','cut','whipLeft'], ['pushIn','bounce','tiltRight','panUp'], 'Shiny digital-camera nostalgia & video noise.'),
  'Retro Rave': style('Retro', 2, ['neon','solarize','duotone','ghost','chrome'], ['flash','spin','glitch','zoom'], ['spin','bounce','panLeft','panRight'], 'Club-energy color shifts & old-school rave cuts.'),
  'Glitchcore': style('Experimental', 2, ['glitch','pixel','cyber','duotone','solarize'], ['glitch','snap','whipRight','flash'], ['shake','pushIn','panRight','tiltRight'], 'Digital distortion, signal breakup & RGB splits.'),
  'Neon Pulse': style('Experimental', 2.5, ['neon','cyber','bloom','chrome'], ['flash','dissolve','zoom','snap'], ['pushIn','drift','panUp','bounce'], 'Light-trail energy synchronized to the bass.'),
  'Ghost Trail': style('Experimental', 4, ['ghost','dream','bloom','blur'], ['dissolve','wipe','dip'], ['drift','pullOut','panLeft','tiltLeft'], 'Double exposures, echoes & floating motion.'),
  'Mirrorverse': style('Experimental', 3, ['mirror','split','kaleido','chrome'], ['spin','wipe','snap','zoom'], ['spin','panRight','pushIn','tiltRight'], 'Reflections, mirrored frames & kinetic geometry.'),
  'Kaleidoscope': style('Experimental', 3, ['kaleido','mirror','solarize','neon'], ['spin','glitch','zoom','wipe'], ['spin','drift','pullOut','bounce'], 'Prismatic repetitions and rotating panels.'),
  'Comic Pop': style('Experimental', 2, ['halftone','duotone','punch','pixel'], ['snap','wipe','flash','zoom'], ['pushIn','bounce','panLeft','tiltRight'], 'Pop-art contrasts, halftone textures & panels.'),
  'Liquid Motion': style('Experimental', 4, ['dream','blur','ghost','solarize'], ['dissolve','wipe','spin'], ['drift','panRight','tiltLeft','pullOut'], 'Fluid transitions, color shifts & smooth movement.'),
  'Industrial Grit': style('Experimental', 2, ['noir','glitch','grain','scanline','chrome'], ['glitch','dip','whipLeft','cut'], ['shake','tiltLeft','pushIn','panRight'], 'Noisy industrial edits with harsh contrast.')
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmt = s => {
  if (!Number.isFinite(s)) return '0:00';
  const t = Math.max(0, Math.floor(s));
  return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
};
export function summarizeAudio(channels,sampleRate,limitSeconds=240){
  if(!channels?.length||!Number.isFinite(sampleRate)||sampleRate<=0)throw Error('Invalid decoded audio');
  const maxSamples=Math.min(channels[0].length,Math.round(sampleRate*limitSeconds));
  const step=Math.max(256,Math.round(sampleRate/90)),amp=[],flux=[];
  for(let i=0;i<maxSamples;i+=step){
    let total=0,n=0;
    for(let j=i;j<Math.min(maxSamples,i+step);j+=2){
      let value=0;
      for(let c=0;c<Math.min(2,channels.length);c++)value+=channels[c][j]||0;
      value/=Math.min(2,channels.length);
      total+=value*value;n++;
    }
    amp.push(Math.sqrt(total/Math.max(1,n)));
  }
  for(let i=0;i<amp.length;i++){
    const prev=amp[Math.max(0,i-1)],older=amp[Math.max(0,i-2)];
    flux.push(Math.max(0,(amp[i]-prev)+.35*(prev-older)));
  }
  const fps=sampleRate/step;
  const rms=Math.sqrt(amp.reduce((acc,v)=>acc+v*v,0)/Math.max(1,amp.length));
  const search=flux.slice(0,Math.min(flux.length,Math.floor(fps*60)));
  let best={bpm:120,score:-Infinity,lag:Math.round(fps/2)};
  const maxLag=Math.min(search.length-1,Math.floor(fps*60/62));
  for(let lag=Math.ceil(fps*60/190);lag<=maxLag;lag++){
    let score=0;
    for(let i=lag;i<search.length;i++)score+=search[i]*search[i-lag];
    const normalized=score/(Math.max(1,search.length-lag));
    if(normalized>best.score){best={bpm:60*fps/lag,score:normalized,lag}};
  }
  const fluxSorted=search.slice().sort((a,b)=>a-b);
  const threshold=Math.max(0.0001,fluxSorted[Math.floor(fluxSorted.length*.81)]||0);
  const transients=[];
  let last=-10;
  for(let i=1;i<flux.length-1;i++){
    if(flux[i]>threshold&&flux[i]>=flux[i-1]&&flux[i]>=flux[i+1]){
      const t=i/fps;
      if(t-last>.11){transients.push({time:t,strength:flux[i]});last=t}
    }
  }
  let confidence=best.score>threshold*threshold*.03 && rms>.001?'estimated':'low';
  if(transients.length<8)confidence='low';
  const bpm=clamp(Math.round(best.bpm*10)/10,62,190);
  const spacing=60/bpm;
  let phase=0,strongest=-Infinity;
  const candidates=transients.filter(v=>v.time<30).slice(0,100);
  for(const peak of candidates){
    let total=0;
    for(const p of candidates){
      const delta=Math.abs((p.time-peak.time)/spacing);
      const distance=Math.abs(delta-Math.round(delta));
      total+=p.strength*Math.exp(-distance*distance*35);
    }
    if(total>strongest){strongest=total;phase=peak.time%spacing}
  }
  const duration=channels[0].length/sampleRate;
  const beats=[];
  for(let t=phase;t<duration-.015;t+=spacing)beats.push(Number(t.toFixed(4)));
  return {bpm,confidence,rms,duration,amplitude:amp,fps,transients,beats,phase};
}
function hash(value) {
  let x = 2166136261;
  for (let i = 0; i < value.length; i++) x = Math.imul(x ^ value.charCodeAt(i), 16777619);
  return x >>> 0;
}
function rngFor(seed, styleName, media) {
  let state = hash(String(seed) + '|' + styleName + '|' + media.map(m => m.id).join('|')) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296);
  };
}
function pickDifferent(items, previous, random, enabled = true) {
  const options = enabled && items.length > 1 ? items.filter(x => x !== previous) : items;
  return options[Math.floor(random() * options.length)] ?? items[0];
}
function nearestBeat(grid, target) {
  if (!grid?.length) return target;
  let low = 0, high = grid.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (grid[mid] < target) low = mid + 1;
    else high = mid;
  }
  const before = grid[Math.max(0, low - 1)] ?? target;
  const after = grid[low] ?? target;
  return Math.abs(before - target) < Math.abs(after - target) ? before : after;
}
function energyAt(analysis, t, seconds = .3) {
  if (!analysis?.amplitude?.length || !analysis?.fps) return 1;
  const values = analysis.amplitude;
  const start = clamp(Math.round((t - seconds / 2) * analysis.fps), 0, values.length - 1);
  const end = clamp(Math.round((t + seconds / 2) * analysis.fps), start + 1, values.length);
  let local = 0;
  for (let i = start; i < end; i++) local += values[i];
  let global = 0;
  const step = Math.max(1, Math.floor(values.length / 800));
  for (let i = 0; i < values.length; i += step) global += values[i];
  return (local / Math.max(1, end - start)) / Math.max(.00001, global / Math.ceil(values.length / step));
}
function makeClipChooser(media, random) {
  let bag = [];
  let last = null;
  return () => {
    if (!bag.length) {
      bag = media.map(m => m.id);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    if (media.length > 1 && bag[0] === last) {
      const swap = 1 + Math.floor(random() * (bag.length - 1));
      if (bag.length > 1) [bag[0], bag[swap]] = [bag[swap], bag[0]];
      else {
        const choices = media.filter(m => m.id !== last);
        bag[0] = choices[Math.floor(random() * choices.length)].id;
      }
    }
    const id = bag.shift();
    last = id;
    return media.find(m => m.id === id) || media[0];
  };
}
export function parseDirection(prompt, initial = 'Bass Impact') {
  const p = String(prompt || '').toLowerCase();
  let chosen = PRESETS[initial] ? initial : 'Bass Impact';
  const rules = [
    [/hyperpop|candy|chaotic|frenzy/, 'Hyperpop Frenzy'],
    [/glitch|digital|pixel|stutter|cyber|signal/, 'Glitchcore'],
    [/kaleid|prism/, 'Kaleidoscope'],
    [/mirror|reflection/, 'Mirrorverse'],
    [/ghost|double exposure|afterimage/, 'Ghost Trail'],
    [/velocity|speed ramp|speed.ramp|whip pan/, 'Velocity Cuts'],
    [/trailer|epic|orchestral/, 'Epic Trailer'],
    [/romantic|love song|tender/, 'Romantic Slowburn'],
    [/melanchol|heartbreak|sad|heart broken/, 'Heartbreak Film'],
    [/dream|ethereal|soft|float/, 'Dreamwave'],
    [/y2k|camcorder/, 'Y2K Camcorder'],
    [/vhs|tape|nostalgic/, 'VHS Tape'],
    [/90s|grunge|post.punk|alt.rock/, '90s Alt'],
    [/rave|techno|dance club/, 'Retro Rave'],
    [/industrial|metal|grit/, 'Industrial Grit'],
    [/comic|manga|pop.art/, 'Comic Pop'],
    [/noir|thriller|horror/, 'Noir Thriller'],
    [/cinemat|goth|dark|film|moody/, 'Dark Cinema'],
    [/neon|laser|glow/, 'Neon Pulse'],
    [/liquid|water|flowing/, 'Liquid Motion'],
    [/clean|minimal|tiktok|capcut|social/, 'Trend Sync'],
    [/fast zoom|zoom punch/, 'Flash Zoom'],
    [/beat rush|every beat|quick cut/, 'Beat Rush'],
    [/bass|drop|hard|explos|punch/, 'Bass Impact']
  ];
  for (const [pattern, styleName] of rules) {
    if (pattern.test(p)) { chosen = styleName; break; }
  }
  const aggressive = /rapid|quick|fast|double.time|every beat|aggress|chaotic|hyper|hard cuts/.test(p);
  const restrained = /slow|linger|hold|long shot|gentle|soft|calm/.test(p);
  const beats = clamp(PRESETS[chosen].beats * (aggressive ? .65 : restrained ? 1.6 : 1), .5, 12);
  return {
    style: chosen,
    beats,
    message: PRESETS[chosen].description + ' ' +
      (aggressive ? 'Quick-paced cuts.' : restrained ? 'Longer, flowing shots.' : 'Varied beat-led pacing.')
  };
}

/**
 * A musical edit decision list. A seed changes the choreography without
 * changing the soundtrack duration. When footage runs out, source frames
 * loop and are reframed; the original audio is never speed-adjusted.
 */
export function makePlan({
  duration, media, analysis, style: requestedStyle = 'Bass Impact',
  direction = '', seed = 0, beatsPerCut = null, variation = .85,
  avoidRepeats = true, dynamics = true
}) {
  if (!Number.isFinite(duration) || duration <= 0) throw Error('Load a soundtrack or choose a valid timeline length');
  if (!Array.isArray(media) || !media.length) throw Error('Add at least one video or image');
  const creative = parseDirection(direction, requestedStyle);
  const preset = PRESETS[creative.style];
  const random = rngFor(seed, creative.style, media);
  const beat = 60 / clamp(Number(analysis?.bpm) || 120, 62, 190);
  const baseBeats = clamp(Number(beatsPerCut) || creative.beats, .5, 12);
  const diversity = clamp(Number(variation) || 0, 0, 1);
  const grid = (analysis?.beats || []).filter(t => t > 0 && t < duration);
  const segments = [];
  const nextMedia = makeClipChooser(media, random);
  let start = 0;
  let prevEffect = null, prevMotion = null, prevTransition = null, prevMediaId = null, prevOffset = null;
  let lastAccent = null;
  const accentColors = ['#eb7df4','#70d7fc','#ff8b8b','#fcb864','#a9f59a','#c49aff'];
  for (let i = 0; start < duration - .00001 && i < 2400; i++) {
    // Every scene gets a distinct rhythmic phrase, while beats remain quantized.
    const rhythmicPatterns = [.5, .75, 1, 1, 1.25, 1.5, 2, .625, 1.75];
    const rhythmicScale = diversity >= .2
      ? rhythmicPatterns[Math.floor(random() * rhythmicPatterns.length)]
      : 1;
    let beats = clamp(baseBeats * (1 + (rhythmicScale - 1) * diversity), .5, 16);
    const energy = dynamics ? energyAt(analysis, start) : 1;
    if (dynamics && diversity > .05) {
      beats *= energy > 1.65 ? .66 : energy < .65 ? 1.24 : 1;
    }
    beats = Math.max(.5, Math.round(beats * 2) / 2);
    const ideal = Math.min(duration, start + Math.max(.26, beats * beat));
    let end = ideal;
    if (grid.length && ideal < duration - .01) {
      const snapped = nearestBeat(grid, ideal);
      if (snapped > start + .22 && Math.abs(snapped - ideal) < Math.min(beat * .38, .26)) end = snapped;
    }
    end = Math.min(duration, Math.max(start + .23, end));
    if (duration - end < .22) end = duration;
    end = Math.min(end, duration);
    const mediaClip = nextMedia();
    let effect = pickDifferent(preset.effects, prevEffect, random, avoidRepeats);
    let motion = pickDifferent(preset.motions, prevMotion, random, avoidRepeats);
    let transition = i === 0 ? 'cut' : pickDifferent(preset.transitions, prevTransition, random, avoidRepeats);
    // The exact same shot presentation must never be repeated consecutively.
    if (avoidRepeats && i > 0 && mediaClip.id === prevMediaId && effect === prevEffect) {
      effect = pickDifferent(EFFECTS, prevEffect, random, true);
    }
    if (avoidRepeats && i > 0 && motion === prevMotion) {
      motion = pickDifferent(MOTIONS, prevMotion, random, true);
    }
    const crop = diversity < .1 ? 1.02 : 1.05 + random() * (.31 * diversity);
    const flip = diversity >= .5 && random() > .82;
    const speeds = diversity >= .45 ? [.75, .85, 1, 1, 1.2, 1.35] : [1];
    const speed = mediaClip.kind === 'image' ? 1 : speeds[Math.floor(random() * speeds.length)];
    const span = end - start;
    const sourceDuration = Math.max(.001, Number(mediaClip.duration) || span);
    const usableSource = Math.max(0, sourceDuration - span * speed);
    let offset = Number((random() * usableSource).toFixed(3));
    if (mediaClip.id === prevMediaId && usableSource > .5 && Math.abs(offset - prevOffset) < .2) {
      offset = Number(((offset + .41) % usableSource).toFixed(3));
    }
    const color = pickDifferent(accentColors, lastAccent, random, true);
    const segment = {
      id: 's' + i, start: Number(start.toFixed(5)), end: Number(end.toFixed(5)),
      mediaId: mediaClip.id, sourceOffset: offset, transition, effect, motion,
      crop: Number(crop.toFixed(3)), flip, speed, accent: color,
      intensity: Number((.25 + diversity * .7).toFixed(2)),
      variant: Math.floor(random() * 10000), energy: Number(energy.toFixed(2))
    };
    segments.push(segment);
    prevEffect = effect; prevMotion = motion; prevTransition = transition;
    prevMediaId = mediaClip.id; prevOffset = offset; lastAccent = color;
    start = end;
  }
  if (segments.length) segments[segments.length - 1].end = duration;
  return {
    segments, duration, style: creative.style,
    variation: diversity, avoidRepeats: Boolean(avoidRepeats), dynamics: Boolean(dynamics),
    director: creative.message
  };
}
export function findSegment(segments, t) {
  let low = 0, high = segments.length - 1;
  while (low <= high) {
    const i = (low + high) >> 1;
    if (t < segments[i].start) high = i - 1;
    else if (t >= segments[i].end) low = i + 1;
    else return segments[i];
  }
  return segments[segments.length - 1] || null;
}
export function assertContinuous(plan) {
  if (!plan?.segments?.length) return false;
  let previous = 0;
  for (const shot of plan.segments) {
    if (Math.abs(shot.start - previous) > .0001 || shot.end <= shot.start) return false;
    previous = shot.end;
  }
  return Math.abs(previous - plan.duration) < .0001;
}
