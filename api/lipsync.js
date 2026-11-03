/* BYOK proxy for Sync Labs API. Credentials are forwarded per request and never stored.
   No public shared API key or unpaid billing is exposed by this serverless endpoint. */
const SYNC='https://api.sync.so';
const MODELS=new Set(['lipsync-2','sync-3']);
const MAX_BYTES=5*1024*1024*1024;
function error(res,status,message){res.status(status).json({error:message})}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return error(res,405,'POST required');
 const origin=req.headers.origin;
 const host=req.headers['x-forwarded-host']||req.headers.host;
 if(origin&&host){
   try{if(new URL(origin).host!==host)return error(res,403,'This endpoint accepts same-origin requests only')}catch{return error(res,400,'Invalid origin')}
 }
 const apiKey=String(req.headers['x-sync-key']||'').trim();
 if(apiKey.length<8||apiKey.length>512)return error(res,401,'Connect a Sync Labs API key to run an in-app model. Or open Sync Studio instead.');
 let body=typeof req.body==='object'&&req.body?req.body:{};
 const action=body.action;
 if(!['presign','register','estimate','generate','status'].includes(action))return error(res,400,'Invalid operation');
 let endpoint='',method='POST',payload=null,headers={'x-api-key':apiKey,'Content-Type':'application/json'};
 const string=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
 if(action==='presign'){
   if(!string(body.fileName,200)||!string(body.contentType,100)||!Number.isSafeInteger(body.size)||body.size<1||body.size>MAX_BYTES)return error(res,400,'Invalid file metadata');
   if(!/^(video|audio)\/[a-z0-9.+_-]+$/i.test(body.contentType))return error(res,400,'Only video or audio supported');
   endpoint='/v2/assets/upload';
   payload={fileName:body.fileName,contentType:body.contentType,size:body.size};
 }else if(action==='register'){
   const url=String(body.url||'');
   let parsed;try{parsed=new URL(url)}catch{return error(res,400,'Invalid asset URL')}
   if(parsed.protocol!=='https:'||parsed.hostname!=='assets.sync.so')return error(res,400,'Expected an uploaded Sync Labs asset URL');
   if(!['VIDEO','AUDIO'].includes(body.type))return error(res,400,'Invalid asset type');
   endpoint='/v2/assets';payload={url:parsed.href,type:body.type,name:String(body.name||'AutoCut upload').slice(0,180)};
 }else if(action==='estimate'){
   if(!MODELS.has(body.model))return error(res,400,'Unsupported AI lip-sync model');
   const duration=Number(body.duration);
   if(!Number.isFinite(duration)||duration<=0||duration>1200)return error(res,400,'Estimate requires a valid duration (max 1200 seconds)');
   endpoint='/v2/generations/estimate';payload={model:body.model,duration,fps:25};
 }else if(action==='generate'){
   if(!MODELS.has(body.model)||!string(body.videoAssetId,150)||!string(body.audioAssetId,150))return error(res,400,'Invalid generation assets or model');
   if(!/^[A-Za-z0-9._~-]{8,128}$/.test(String(body.idempotencyKey||'')))return error(res,400,'Invalid generation idempotency key');
   endpoint='/v2/generate';payload={
     model:body.model,
     input:[{type:'video',assetId:body.videoAssetId},{type:'audio',assetId:body.audioAssetId}],
     options:{sync_mode:'loop'},
     outputFileName:'GalaXia-AutoCut-LipSync'
   };
   headers['Idempotency-Key']=body.idempotencyKey;
 }else if(action==='status'){
   if(!/^[0-9a-fA-F-]{24,64}$/.test(String(body.id||'')))return error(res,400,'Invalid generation id');
   endpoint='/v2/generate/'+encodeURIComponent(body.id);method='GET';
 }
 try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),23000);
   let response;try{response=await fetch(SYNC+endpoint,{
      method,headers,body:method==='POST'?JSON.stringify(payload):undefined,
      signal:controller.signal
   })}finally{clearTimeout(timer)}
   let data;try{data=await response.json()}catch{data={error:'Non-JSON provider response'}}
   if(!response.ok){
     const message=String(data.message||data.error||data.detail||'Sync Labs request failed').slice(0,250);
     return error(res,response.status<500?response.status:502,message);
   }
   // Only return fields required for the browser flow. No credentials are echoed.
   if(action==='presign')return res.status(200).json({uploadUrl:data.uploadUrl,url:data.url,expiresIn:data.expiresIn});
   if(action==='register')return res.status(200).json({id:data.id,type:data.type,name:data.name});
   if(action==='estimate')return res.status(200).json({estimatedGenerationCost:data.estimatedGenerationCost,estimatedCredits:data.estimatedCredits,estimatedFrameCount:data.estimatedFrameCount});
   if(action==='generate'||action==='status')return res.status(200).json({
     id:data.id,status:data.status,outputUrl:data.outputUrl||null,outputDuration:data.outputDuration||null,
     error:data.error||null,errorCode:data.errorCode||null
   });
 }catch(e){
   return error(res,502,e.name==='AbortError'?'Sync Labs request timed out; retry status instead of resubmitting the generation':'Provider connection failed');
 }
};
