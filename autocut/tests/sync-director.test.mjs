import test from 'node:test';
import assert from 'node:assert/strict';
import {wrappedDrift,syncDecision,videoDelayTarget,drawIntervalFor,syncStatus} from '../sync.mjs';
import {mouthEnergy} from '../lip-sync.mjs';
import {analyzeSound,lyricMood,suggestMusicVideo} from '../director.mjs';
import {makePlan,assertContinuous} from '../engine.mjs';

test('song audio remains timing master with any video offset',()=>{
 const actual=videoDelayTarget(1.5,3,1.25,180);
 assert.ok(Math.abs(actual-5.43)<1e-6);
 assert.ok(Math.abs(videoDelayTarget(0,1,1,-100)-.9)<1e-6);
});
test('video playback catches drift using a small rate adjustment, not repeated seeks',()=>{
 const d=syncDecision({actual:5.12,desired:5.23,duration:30,now:2000,lastSeek:1800,newClip:false,mode:'auto'});
 assert.equal(d.seek,false);
 assert.ok(d.rate>1&&d.rate<1.07);
 const f=syncDecision({actual:1,desired:3,duration:10,now:2200,lastSeek:2000,newClip:false,mode:'auto'});
 assert.equal(f.seek,false,'should not rapidly reseek within the first 850ms');
 const s=syncDecision({actual:1,desired:3,duration:10,now:3200,lastSeek:2000,newClip:false});
 assert.equal(s.seek,true,'should seek for sustained large drift once throttling interval has elapsed');
});
test('wrap-around sync near media loop is not falsely treated as large drift',()=>{
 assert.ok(Math.abs(wrappedDrift(.05,9.95,10)-.1)<1e-6);
 assert.ok(Math.abs(wrappedDrift(9.95,.05,10)+.1)<1e-6);
});
test('smooth mode lowers preview load while leaving soundtrack time alone',()=>{
 assert.ok(drawIntervalFor('smooth')>drawIntervalFor('quality'));
 assert.equal(syncStatus(.04,70,0),'AUDIO MASTER ✓');
 assert.equal(syncStatus(.5,70,0),'CORRECTING DRIFT');
 assert.equal(syncStatus(.04,900,0),'VIDEO STALLED');
});
test('lip motion reacts to energy only, not guessed words',()=>{
 const a={amplitude:Array(100).fill(.25),fps:20,rms:.25};
 const m=mouthEnergy(a,2);
 assert.ok(m>0&&m<=1);
 assert.equal(mouthEnergy(null,2),0);
 assert.equal(mouthEnergy({amplitude:[0,0],fps:20,rms:.2},0),0);
});
test('lyrics contribute mood only when user provided text',()=>{
 assert.equal(lyricMood('my heart is broken, goodbye forever').mood,'heartbreak');
 assert.equal(lyricMood('').mood,'undetermined');
});
test('local on-device song and footage analysis returns credible metadata and prompt',()=>{
 const amplitude=Array.from({length:720},(_,i)=>i>360?.25:.07);
 const analysis={amplitude,duration:8,bpm:125,confidence:'estimated',transients:[{time:4}]};
 const audio=analyzeSound(analysis);
 assert.equal(audio.sections.length,8);
 assert.equal(audio.bpm,125);
 const results=suggestMusicVideo({audio,footage:[{name:'Shot.mp4',kind:'video',duration:2,brightness:.21,palette:'blue/cool',motion:.1}],lyrics:'night shadows and ghost',title:'Song.wav',style:'Dark Cinema'});
 assert.ok(results.prompt.includes('Shot.mp4'));
 assert.ok(results.prompt.includes('125 BPM'));
 assert.ok(results.prompt.includes('dark narrative'));
 assert.equal(results.prompts.length,5);
 assert.ok(results.prompt.includes('original uploaded audio'));
});
test('mix-and-match FX options keep timeline continuous',()=>{
 const clips=[{id:'a',kind:'video',duration:6},{id:'b',kind:'video',duration:8}];
 const opts={duration:150.3921,media:clips,analysis:{bpm:128,beats:Array.from({length:2000},(_,i)=>i*60/128)},style:'Dark Cinema',seed:9,mixStyles:true,doubleFx:true,shuffleFx:true,shuffleMotion:true,shuffleTransitions:true};
 const plan=makePlan(opts);
 assert.ok(assertContinuous(plan));
 assert.equal(plan.segments.at(-1).end,opts.duration);
 assert.ok(plan.segments.some(x=>x.secondaryEffect));
 const single=makePlan({...opts,shuffleFx:false,shuffleMotion:false,shuffleTransitions:false,doubleFx:false});
 assert.ok(assertContinuous(single));
 assert.ok(single.segments.every(x=>!x.secondaryEffect));
 assert.ok(single.segments.every(x=>x.motion===single.segments[0].motion));
});
