import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const html=readFileSync(path.join(here,'../index.html'),'utf8');
const app=readFileSync(path.join(here,'../app.js'),'utf8');
const css=readFileSync(path.join(here,'../style.css'),'utf8');
const lip=readFileSync(path.join(here,'../lip-sync.mjs'),'utf8');
test('added lip, fullscreen, soundtrack analysis and performance controls all exist',()=>{
 const required=['fullscreenApp','fullscreenPreview','performanceMode','videoOffset','syncState','lagReadout',
 'lipSyncToggle','lipStrength','lipStatus','lyricsInput','analyzeBtn','copyMVPrompt',
 'generatedMVPrompt','showSuggestedPrompts','promptSuggestions','applyMVPrompt',
 'mixStyles','shuffleFx','shuffleMotion','shuffleTransitions','doubleFx'];
 for(const id of required)assert.ok(html.includes('id="'+id+'"'),'missing '+id);
 const parsed=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
 const duplicate=[...parsed].filter(id=>[...html.matchAll(new RegExp('id="'+id+'"','g'))].length>1);
 assert.deepEqual(duplicate,[],'duplicate element ID');
});
test('all new controls connected to event listeners',()=>{
 for(const id of ['fullscreenApp','fullscreenPreview','performanceMode','videoOffset',
 'lipSyncToggle','lipStrength','analyzeBtn','copyMVPrompt','showSuggestedPrompts',
 'applyMVPrompt']){
  assert.ok(app.includes("$('"+id+"').addEventListener("),id+' has no event listener');
 }
 for(const key of ['mixStyles','shuffleFx','shuffleMotion','shuffleTransitions','doubleFx'])
   assert.ok(app.includes("'"+key+"'"),'FX combo selector '+key+' was not wired');
 assert.ok(app.includes('$(key).addEventListener('),'combo settings need a shared listener');
});
test('video playback uses drift tolerance and sparse seeks rather than per-frame seeking',()=>{
 assert.ok(app.includes('syncDecision('));
 assert.ok(app.includes('media.lastSeek=now'));
 assert.ok(app.includes('media.pendingSeek'));
 assert.ok(app.includes('if(el.paused)el.play().catch(e=>{'),'video play rejections must be reported rather than silently discarded');
 assert.ok(css.includes('.performance-box'));
});
test('free automatic lip animation is enabled by default and loaded lazily',()=>{
 assert.ok(html.includes('id="lipSyncToggle" type="checkbox" checked'));
 assert.ok(html.includes('id="lipSyncToggle" type="checkbox" checked'));
 assert.ok(html.includes('id="freeLipSection"'));
 assert.ok(html.includes('id="freeLipDriver"'));
 assert.ok(html.includes('id="freeLipVocals"'));
 assert.ok(app.includes('state.lip.apply(ctx,canvas,freeLipAudio(),time'));
 assert.ok(app.includes("$('freeLipDriver').addEventListener('change'"));
 assert.ok(lip.includes('await import(VISION)'));
 assert.ok(lip.includes('VISION_FALLBACK'));
 assert.ok(lip.includes('detectFrame=true'));
 assert.ok(app.includes("if($('lipSyncToggle').checked)void activateLipMotion()"));
 assert.ok(app.includes('state.lip.detect(canvas,performance.now()'));
 assert.ok(lip.includes('this.avgDetectMs'));
 assert.ok(lip.includes('this.missCount'));
 assert.ok(app.includes('state.frameCostMs'));
 assert.ok(app.includes('state.rendering ||'));
 assert.ok(!app.includes('media.shotKey=shot.id;state.activeShot=shot.id;state.lip.reset()'));
 assert.ok(html.includes('role="status" aria-live="polite"'));
 assert.ok(html.includes('not AI-generated speech or word-accurate dubbing'));
 assert.ok(app.includes('state.lip.apply('));
 assert.ok(!lip.includes('ctx.scale(1,expansion)'),'old lens/magnification animation must not return');
 assert.ok(!lip.includes('ctx.drawImage(patch'),'mouth pixels must not be copied and stretched');
 assert.ok(lip.includes('this.smoothedOpen'),'mouth transitions should be smoothed');
 assert.ok(lip.includes('naturalGap'),'original open lips should not get artificially enlarged');
 assert.ok(lip.includes("const TASKS_VERSION='0.10.21'"),'verified MediaPipe dependency must be pinned');
 assert.ok(!lip.includes('@0.10.22/'),'invalid CDN pin must never return');
 assert.ok(app.includes("$('lipRetry').hidden=false"),'failed model download must remain retryable');
 assert.ok(!app.includes('toggle.checked=false;'),'library failures must never switch lip toggle off');
 assert.ok(app.includes("liveShot=lowLag?"),'low-lag mobile canvas rendering should be active');
 assert.ok(app.includes('newClip:needsNewPosition'),'avoid forced seeks on every beat cut');
 assert.ok(html.includes('id="lipRetry"'),'retry control should exist');
});
test('music video brief uses visual and audio local analysis without falsely claiming lyric recognition',()=>{
 assert.ok(app.includes('sampleFootage('));
 assert.ok(app.includes('analyzeSound('));
 assert.ok(app.includes('suggestMusicVideo('));
 assert.ok(html.includes('Audio alone cannot identify words.'));
 assert.ok(css.includes('.smart-director'));
});


test('imported video has a mounted decoder and prepares frames before painting effects',()=>{
 assert.ok(app.includes("videoRack.append(el)"),'video should remain attached for mobile decoding');
 assert.ok(app.includes("el.setAttribute('playsinline','')"),'video should use inline playback');
 assert.ok(app.includes("await readMetadata(el,'loadedmetadata')"),'metadata must be available');
 assert.ok(app.includes("el.addEventListener('loadeddata',refresh)"),'decoded frames must repaint paused preview');
 assert.ok(app.includes("el.addEventListener('seeked',refresh)"),'seek completion should repaint paused preview');
 assert.ok(app.includes("if(!videoFrameReady(media))"),'undecoded frames must never replace a valid preview');
 assert.ok(app.includes("showFrameLoading()"),'initial blank screen should show stable loading state');
 assert.ok(app.includes("state.hasGoodFrame=true"),'preview should retain last decoded picture');
 assert.ok(app.includes("&&videoFrameReady(oldMedia)"),'transitions must skip undecoded old video');
});
test('video playback is unlocked from user click without blocking soundtrack startup',()=>{
 const first=app.indexOf("const videoStart=firstMedia?.kind==='video'");
 const music=app.indexOf('await audio.play();',first);
 assert.ok(first>0&&music>first,'picture play should be requested before audio play await');
 assert.ok(app.includes('void videoStart;'),'slow video decode must not stall audio timekeeping');
 assert.ok(app.includes('Video playback blocked or codec unsupported:'),'decoder failures should be visible');
 assert.ok(app.includes('const videoFile=file.type.startsWith('),'Android file type fallback should be present');
 assert.ok(app.includes('Face tracking paused:'),'optional face model failures must not break the preview');

});
