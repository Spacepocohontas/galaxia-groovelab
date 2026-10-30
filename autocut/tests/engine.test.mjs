import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESETS,EFFECTS,TRANSITIONS,MOTIONS,makePlan,assertContinuous,parseDirection,summarizeAudio,findSegment} from '../engine.mjs';
const media=[{id:'a',kind:'video',duration:2},{id:'b',kind:'image',duration:0}];
const analysis={bpm:120,beats:Array.from({length:600},(_,i)=>i*.5)};
test('locks video end to soundtrack duration without gaps',()=>{
 for(const seconds of [3.77,42.253,193.3]){
  const p=makePlan({duration:seconds,media,analysis});
  assert.equal(p.duration,seconds);assert.equal(p.segments.at(-1).end,seconds);assert.ok(assertContinuous(p));
 }
});
test('style directions choose concrete presets',()=>{assert.equal(parseDirection('Go glitchy & stutter hard').style,'Glitchcore');assert.equal(parseDirection('Slow dreamy shots').style,'Dreamwave')});
test('clips repeat safely and end accurately even with short sources',()=>{const p=makePlan({duration:81.7,media:[media[0]],analysis,style:'Bass Impact'});assert.ok(assertContinuous(p));assert.ok(p.segments.every(s=>s.mediaId==='a'));assert.equal(findSegment(p.segments,80)?.mediaId,'a')});
test('silence and tempo analysis fail gracefully',()=>{const sr=44100;const ch=new Float32Array(sr*3);const a=summarizeAudio([ch],sr);assert.equal(a.confidence,'low');assert.ok(a.bpm>=62);assert.ok(a.duration===3)});
test('simple pulse estimates BPM range',()=>{const sr=9000,d=18,ch=new Float32Array(sr*d);for(let sec=0;sec<d;sec+=.5){const off=Math.round(sec*sr);for(let j=0;j<230;j++)ch[off+j]=Math.sin(j*.3)*(1-j/230)}const a=summarizeAudio([ch],sr);assert.ok(a.bpm>=62&&a.bpm<=190);assert.ok(a.beats.length>12)});
test('rejects invalid timelines',()=>{assert.throws(()=>makePlan({duration:0,media,analysis}));assert.throws(()=>makePlan({duration:8,media:[],analysis}))});

test('contains 25 curated automatic editing templates with distinct looks',()=>{
  assert.equal(Object.keys(PRESETS).length,25);
  assert.equal(EFFECTS.length,24);
  assert.equal(TRANSITIONS.length,13);
  assert.equal(MOTIONS.length,13);
  const categories=new Set(Object.values(PRESETS).map(x=>x.category));
  assert.deepEqual([...categories].sort(),['Cinematic','Experimental','Retro','Viral']);
  for(const [name,p] of Object.entries(PRESETS)){
    assert.ok(p.effects.length>=3,name+' needs multiple effects');
    assert.ok(p.transitions.length>=3,name+' needs several cuts');
    assert.ok(p.motions.length>=3,name+' needs varied camera moves');
  }
});
test('never selects adjacent identical source footage with multiple media files',()=>{
  const clips=['a','b','c','d'].map(id=>({id,kind:'video',duration:12}));
  for(const name of Object.keys(PRESETS)){
    for(const seed of [0,1,7,19]){
      const plan=makePlan({duration:157.321,media:clips,analysis,style:name,seed,avoidRepeats:true,variation:.88});
      assert.ok(assertContinuous(plan),name+' continuity');
      for(let j=1;j<plan.segments.length;j++)
        assert.notEqual(plan.segments[j].mediaId,plan.segments[j-1].mediaId,name+' should avoid an immediate repeat');
    }
  }
});
test('never repeats adjacent FX/motions/transitions with anti-repeat mode enabled',()=>{
  const plan=makePlan({duration:134.52,media,analysis,style:'Glitchcore',seed:8,avoidRepeats:true,variation:1});
  const changes=(key)=>new Set(plan.segments.map(s=>s[key])).size;
  assert.ok(changes('effect')>=3);
  assert.ok(changes('motion')>=3);
  assert.ok(changes('transition')>=3);
  for(let i=1;i<plan.segments.length;i++){
    assert.notEqual(plan.segments[i].effect,plan.segments[i-1].effect);
    assert.notEqual(plan.segments[i].motion,plan.segments[i-1].motion);
    if(i>1)assert.notEqual(plan.segments[i].transition,plan.segments[i-1].transition);
  }
});
test('with only one source, visual treatment still changes on every cut',()=>{
 const one=[{id:'only',kind:'video',duration:1.4}];
 const plan=makePlan({duration:91.903,media:one,analysis,style:'Hyperpop Frenzy',seed:9,variation:1});
 assert.ok(assertContinuous(plan));
 assert.ok(plan.segments.every(s=>s.mediaId==='only'));
 for(let i=1;i<plan.segments.length;i++){
   assert.notEqual(plan.segments[i].effect,plan.segments[i-1].effect);
   assert.notEqual(plan.segments[i].motion,plan.segments[i-1].motion);
 }
});
test('remix seed makes a different valid edit but never changes the original length',()=>{
 const params={duration:188.498763,media:[...media,{id:'extra',kind:'video',duration:12}],analysis,style:'Trend Sync',variation:.9,avoidRepeats:true};
 const a=makePlan({...params,seed:0});
 const b=makePlan({...params,seed:1});
 assert.ok(assertContinuous(a));assert.ok(assertContinuous(b));
 assert.equal(a.duration,params.duration);assert.equal(b.duration,params.duration);
 assert.equal(a.segments.at(-1).end,params.duration);
 assert.equal(b.segments.at(-1).end,params.duration);
 assert.notDeepEqual(a.segments,b.segments);
});
test('variation intensity changes pacing, without touching soundtrack BPM',()=>{
 const options={duration:100.389,media,analysis,style:'Beat Rush',seed:5};
 const low=makePlan({...options,variation:0,dynamics:false});
 const high=makePlan({...options,variation:1,dynamics:false});
 assert.notDeepEqual(low.segments.map(s=>s.end),high.segments.map(s=>s.end));
 assert.equal(analysis.bpm,120);
});
test('prompt interpreter understands new genre references and preserves default fallback',()=>{
 assert.equal(parseDirection('For tiktok, clean CapCut-like edits').style,'Trend Sync');
 assert.equal(parseDirection('Gothic cinematic and moody').style,'Dark Cinema');
 assert.equal(parseDirection('High-speed velocity whip-pan edit').style,'Velocity Cuts');
 assert.equal(parseDirection('Kaleidoscope prism montage').style,'Kaleidoscope');
 assert.equal(parseDirection('No special prompt','VHS Tape').style,'VHS Tape');
});
test('supports songs exceeding 10 minutes without cutting the plan short',()=>{
 const long=makePlan({duration:660.5,media,analysis,style:'Clean Social',seed:4});
 assert.ok(assertContinuous(long));
 assert.equal(long.segments.at(-1).end,660.5);
 assert.ok(long.segments.length>30);
});
