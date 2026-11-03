import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const html=readFileSync(path.join(dir,'../index.html'),'utf8');
const app=readFileSync(path.join(dir,'../app.js'),'utf8');
const real=readFileSync(path.join(dir,'../real-lipsync.mjs'),'utf8');
const require=createRequire(import.meta.url);
const handler=require('../../api/lipsync.js');
function mock(method='POST',body={},key='not-a-real-demo-key',origin='https://galaxia-groovelab.vercel.app'){
  const req={method,body,headers:{origin,host:'galaxia-groovelab.vercel.app','x-sync-key':key}};
  const response={statusCode:200,headers:{},data:null,
    setHeader(k,v){this.headers[k]=v},
    status(n){this.statusCode=n;return this},
    json(v){this.data=v;return this}};
  return {req,response};
}
test('old pixel-warp panel is hidden and new real lip-sync control is visible',()=>{
 assert.ok(html.includes('<section class="panel real-lip-panel">'));
 assert.ok(html.includes('<section class="panel lip-panel" hidden>'));
 assert.ok(html.includes('id="realLipToggle" type="checkbox"'));
 assert.ok(app.includes('setupRealLipSync('));
 assert.ok(app.includes('const entry={id,name:file.name,file,kind'));
 assert.ok(real.includes('realLipGo'));
});
test('app never starts a paid Sync generation automatically',()=>{
 assert.ok(real.includes("$('realLipGo').addEventListener('click',generate)"));
 assert.ok(real.includes("state.estimated||!$('realLipConfirm').checked"));
 assert.ok(real.includes("sessionStorage.setItem(KEY_STORAGE"));
 assert.ok(real.includes("window.prompt")===false);
});
test('unauthorized, cross-origin and missing keys rejected without provider calls',async()=>{
 let calls=0;const old=globalThis.fetch;globalThis.fetch=async()=>{calls++;return {}};
 try{
  let m=mock('GET');await handler(m.req,m.response);assert.equal(m.response.statusCode,405);
  m=mock('POST',{action:'estimate',model:'lipsync-2',duration:8},'short');
  await handler(m.req,m.response);assert.equal(m.response.statusCode,401);
  m=mock('POST',{action:'estimate',model:'lipsync-2',duration:8},'valid-long-demo-key','https://malicious.example');
  await handler(m.req,m.response);assert.equal(m.response.statusCode,403);
  assert.equal(calls,0);
 }finally{globalThis.fetch=old}
});
test('cost is estimated without submitting a generation',async()=>{
 let called=[];const old=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{
  called.push({url,opts});return {ok:true,status:200,json:async()=>({estimatedGenerationCost:.45,estimatedCredits:1.5,estimatedFrameCount:200})}
 };
 try{
  const m=mock('POST',{action:'estimate',model:'lipsync-2',duration:8});
  await handler(m.req,m.response);
  assert.equal(m.response.statusCode,200);assert.equal(m.response.data.estimatedGenerationCost,.45);
  assert.equal(called.length,1);
  assert.ok(called[0].url.endsWith('/v2/generations/estimate'));
 }finally{globalThis.fetch=old}
});
test('generation uses two registered assets, loop mode and stable idempotency',async()=>{
 const sent=[];const old=globalThis.fetch;
 globalThis.fetch=async(url,opts)=>{sent.push({url,opts});return {ok:true,status:201,json:async()=>({id:'12345678-1234-1234-1234-123456789012',status:'PENDING'})}};
 try{
  const m=mock('POST',{action:'generate',model:'lipsync-2',videoAssetId:'video-asset-id',audioAssetId:'audio-asset-id',idempotencyKey:'one-generation-123'});
  await handler(m.req,m.response);
  assert.equal(m.response.data.status,'PENDING');
  assert.equal(sent.length,1);
  const payload=JSON.parse(sent[0].opts.body);
  assert.equal(payload.options.sync_mode,'loop');
  assert.deepEqual(payload.input,[{type:'video',assetId:'video-asset-id'},{type:'audio',assetId:'audio-asset-id'}]);
  assert.equal(sent[0].opts.headers['Idempotency-Key'],'one-generation-123');
 }finally{globalThis.fetch=old}
});
test('real app requires consent, allows no-key Studio path, and retains song-length lock',()=>{
 assert.ok(html.includes('https://sync.so/try'));
 assert.ok(html.includes('id="realLipConfirm"'));
 assert.ok(html.includes('id="durationLock" type="checkbox" checked'));
 assert.ok(real.includes('await pollGeneration'));
 assert.ok(real.includes('sync_mode')===false,'model duration mode is fixed by the protected server');
});
