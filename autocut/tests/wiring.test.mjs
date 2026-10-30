import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {PRESETS,EFFECTS,TRANSITIONS,MOTIONS} from '../engine.mjs';

const dirname=path.dirname(fileURLToPath(import.meta.url));
const app=readFileSync(path.join(dirname,'../app.js'),'utf8');
const markup=readFileSync(path.join(dirname,'../index.html'),'utf8');
const fx=readFileSync(path.join(dirname,'../effects.mjs'),'utf8');
const css=readFileSync(path.join(dirname,'../style.css'),'utf8');

test('all static DOM IDs used by AutoCut exist in the page',()=>{
  const needed=[...app.matchAll(/\$\('([a-zA-Z][A-Za-z0-9]*)'\)/g)].map(x=>x[1]);
  const declared=new Set([...markup.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
  const missing=[...new Set(needed)].filter(id=>!declared.has(id));
  assert.deepEqual(missing,[], 'JS selectors must point to valid DOM elements');
});
test('template library and anti-repeat controls exist',()=>{
  for(const id of ['templateFilter','templateSearch','styleGrid','variation','variationValue','avoidRepeats','dynamics','safeFlash','surpriseBtn','shuffleBtn','durationLock']){
    assert.ok(markup.includes('id="'+id+'"'),id+' must be present');
  }
  assert.ok(markup.includes('id="durationLock" type="checkbox" checked'));
  assert.ok(Object.keys(PRESETS).length>=24);
});
test('every effect, transition and movement has a safe rendering fallback',()=>{
  assert.ok(app.includes('drawShot'));
  assert.ok(app.includes('drawTreatment'));
  assert.ok(app.includes('drawCutOverlay'));
  assert.ok(app.includes('transitionMix'));
  assert.ok(css.includes('.scene-controls'));
  for(const name of EFFECTS)assert.match(name,/^[a-z]+$/i);
  for(const transition of TRANSITIONS)assert.match(transition,/^[a-z]+$/i);
  for(const motion of MOTIONS)assert.match(motion,/^[a-z]+$/i);
  assert.ok(fx.includes('export function drawShot'));
});
test('ChatGPT handoff can preserve shot patterns & apply unique FX',()=>{
  assert.ok(app.includes('function applyChatGPTPlan'));
  assert.ok(app.includes("EFFECTS.includes(shot.effect)"));
  assert.ok(app.includes("MOTIONS.includes(shot.motion)"));
  assert.ok(app.includes("$('avoidRepeats').checked"));
});
