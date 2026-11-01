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
 'applyMVPrompt','mixStyles','shuffleFx','shuffleMotion','shuffleTransitions','doubleFx']){
  assert.ok(app.includes("$('"+id+"').addEventListener("),id+' has no event listener');
 }
});
test('video playback uses drift tolerance and sparse seeks rather than per-frame seeking',()=>{
 assert.ok(app.includes('syncDecision('));
 assert.ok(app.includes('media.lastSeek=now'));
 assert.ok(app.includes('media.pendingSeek'));
 assert.ok(app.includes("if(el.paused)el.play().catch(()=>{})"));
 assert.ok(css.includes('.performance-box'));
});
test('lip animation is disabled by default, loaded lazily and explicitly approximate',()=>{
 assert.ok(html.includes('id="lipSyncToggle" type="checkbox"'));
 assert.ok(!html.includes('id="lipSyncToggle" type="checkbox" checked'));
 assert.ok(lip.includes('await import(VISION)'));
 assert.ok(html.includes('not exact word/phoneme lip-sync'));
 assert.ok(app.includes('state.lip.apply('));
});
test('music video brief uses visual and audio local analysis without falsely claiming lyric recognition',()=>{
 assert.ok(app.includes('sampleFootage('));
 assert.ok(app.includes('analyzeSound('));
 assert.ok(app.includes('suggestMusicVideo('));
 assert.ok(html.includes('Audio energy alone cannot reveal exact lyrics.'));
 assert.ok(css.includes('.smart-director'));
});
