/* Optional experimental face-tracked mouth animation.
   It changes the mouth area based on audio intensity, NOT precise sung words/phonemes.
   MediaPipe model is downloaded only after user enables this toggle. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MODEL='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
// 0.10.22 does not exist as a published stable package. Use verified 0.10.21.
const TASKS_VERSION='0.10.21';
const VISION='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+TASKS_VERSION+'/vision_bundle.mjs';
const VISION_FALLBACK='https://unpkg.com/@mediapipe/tasks-vision@'+TASKS_VERSION+'/vision_bundle.mjs';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@'+TASKS_VERSION+'/wasm';
const WASM_FALLBACK='https://unpkg.com/@mediapipe/tasks-vision@'+TASKS_VERSION+'/wasm';
export function mouthEnergy(audioAnalysis,seconds){
  if(!audioAnalysis?.amplitude?.length||!audioAnalysis.fps)return 0;
  const index=clamp(Math.floor(seconds*audioAnalysis.fps),0,audioAnalysis.amplitude.length-1);
  const window=Math.max(1,Math.round(audioAnalysis.fps*.085));
  let sum=0;
  for(let i=index;i<Math.min(audioAnalysis.amplitude.length,index+window);i++)
    sum+=audioAnalysis.amplitude[i];
  const avg=sum/Math.max(1,Math.min(window,audioAnalysis.amplitude.length-index));
  const reference=audioAnalysis.rms||.09;
  return clamp((avg/reference-.15)*.52,0,1);
}
// Optional LRC timing helps align approximate syllabic mouth poses. Not forced alignment.
export function parseTimedLyrics(text){
 const lines=String(text||'').split(/\r?\n/).map(line=>{
  const match=line.match(/^\s*\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]\s*(.*)\s*$/);
  return match?{start:Number(match[1])*60+Number(match[2]),words:match[3].trim().split(/\s+/).filter(Boolean)}:null;
 }).filter(x=>x&&x.words.length).sort((a,b)=>a.start-b.start).slice(0,1000);
 const cues=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],next=lines[i+1];
  const length=clamp((next?next.start-line.start:3.5),.5,12);
  const wordSpan=length/line.words.length;
  for(let j=0;j<line.words.length;j++){
   const word=line.words[j].replace(/[^a-zA-ZÀ-ÿ]/g,'').toLowerCase();
   const vowel=(word.match(/[aeiouyà-ÿ]/g)||[]).length;
   const shape=/^[bmp]/.test(word)?.12:/[ao]/.test(word)?.88:/[ei]/.test(word)?.65:.42;
   cues.push({time:line.start+j*wordSpan,end:line.start+(j+1)*wordSpan,
     opening:clamp(shape+Math.min(vowel,3)*.035,0,1),word});
  }
 }
 return cues;
}
function timedMouthEnergy(cues,seconds){
 if(!cues?.length)return null;
 let lo=0,hi=cues.length-1;
 while(lo<=hi){
  const mid=(lo+hi)>>1,cue=cues[mid];
  if(seconds<cue.time)hi=mid-1;
  else if(seconds>=cue.end)lo=mid+1;
  else{
    const phase=clamp((seconds-cue.time)/Math.max(.001,cue.end-cue.time),0,1);
    const pulse=.65+.35*Math.sin(Math.PI*phase);
    return cue.opening*pulse;
  }
 }
 return null;
}

export class LipMotion {
 constructor(){
  this.lyricCues=[];this.ready=false;this.loading=null;this.model=null;this.lastDetection=-Infinity;
  this.face=null;this.scan=null;this.patch=null;this.status='Off';this.frameToken=0;this.smoothedOpen=0;
  this.avgDetectMs=0;this.missCount=0;
 }
 async enable(onStatus=()=>{}){
  if(this.ready)return true;
  if(this.loading)return this.loading;
  this.status='Loading optional face landmarks…';onStatus(this.status);
  this.loading=(async()=>{
   let lib;
   try{lib=await import(VISION)}catch(err){
    try{lib=await import(VISION_FALLBACK)}
    catch(fallback){throw Error('Face tracker failed to load from both CDNs. '+String(fallback.message||fallback).slice(0,100))}
   }
   const {FaceLandmarker,FilesetResolver}=lib;
   if(!FaceLandmarker||!FilesetResolver)throw Error('Face tracking library did not supply the necessary components.');
   let vision;
   try{vision=await FilesetResolver.forVisionTasks(WASM)}catch(e){vision=await FilesetResolver.forVisionTasks(WASM_FALLBACK)}
   this.model=await FaceLandmarker.createFromOptions(vision,{
    baseOptions:{modelAssetPath:MODEL,delegate:'CPU'},
    runningMode:'IMAGE',numFaces:1,minFaceDetectionConfidence:.55,
    minFacePresenceConfidence:.55,minTrackingConfidence:.55
   });
   this.scan=document.createElement('canvas');this.scan.width=144;this.scan.height=192;
   // No magnified canvas patch: mouth shading preserves the original face pixels.
   this.ready=true;this.status='Face tracking loaded (approximate mouth motion)';
   onStatus(this.status);return true;
  })().catch(e=>{
   this.status='Face-tracking model unavailable: '+String(e.message||e);
   onStatus(this.status);this.loading=null;this.ready=false;throw e;
  });
  return this.loading;
 }
 reset(){this.face=null;this.lastDetection=-Infinity;this.missCount=0;this.smoothedOpen=0;}
 setLyrics(text){this.lyricCues=parseTimedLyrics(text);return this.lyricCues.length;}
 destroy(){
  try{this.model?.close()}catch{}
  this.model=null;this.ready=false;this.loading=null;this.reset();
 }
 detect(canvas,clock,mode='auto'){
  if(!this.ready)return;
  // MediaPipe detect() runs synchronously on the main thread. Cap scanning and
  // back off automatically when the device cannot keep up.
  const mobile=typeof window!=='undefined' && (window.matchMedia?.('(max-width:780px)')?.matches ?? false);
  const interval=mode==='smooth'?1400:mode==='quality'?(mobile?900:600):(mobile?1200:850);
  const adaptive=Math.max(interval,this.avgDetectMs>70?3200:this.avgDetectMs>38?2300:0);
  const noFaceDelay=this.missCount>=3?Math.max(adaptive,2000):adaptive;
  if(clock-this.lastDetection<noFaceDelay)return;
  this.lastDetection=clock;
  try{
   const w=canvas.width,h=canvas.height;
   const targetWidth=mobile?144:192;
   const targetHeight=Math.max(80,Math.min(mobile?224:280,Math.round(targetWidth*h/w)));
   if(this.scan.width!==targetWidth)this.scan.width=targetWidth;
   if(this.scan.height!==targetHeight)this.scan.height=targetHeight;
   const c=this.scan.getContext('2d',{willReadFrequently:true});
   c.drawImage(canvas,0,0,this.scan.width,this.scan.height);
   const started=performance.now();
   const result=this.model.detect(this.scan);
   const inferenceMs=performance.now()-started;
   this.avgDetectMs=this.avgDetectMs?this.avgDetectMs*.8+inferenceMs*.2:inferenceMs;
   const points=result?.faceLandmarks?.[0];
   if(!points){this.missCount++;this.face=null;this.status='No face detected · scanning slowly to save CPU';return}
   this.missCount=0;
   const left=points[61],right=points[291],top=points[0],bottom=points[17];
   if(!left||!right||!top||!bottom){this.face=null;return}
   const upper=points[13]||top,lower=points[14]||bottom;
   const dx=(right.x-left.x)*canvas.width,dy=(right.y-left.y)*canvas.height;
   const lipWidth=Math.hypot(dx,dy);
   if(lipWidth<4){this.face=null;this.status='Face too small for mouth tracking';return}
   const naturalGap=Math.hypot((lower.x-upper.x)*canvas.width,(lower.y-upper.y)*canvas.height)/lipWidth;
   const x=(left.x+right.x)*.5,y=(upper.y+lower.y)*.5;
   this.face={
     x:clamp(x,0,1),y:clamp(y,0,1),
     w:clamp(lipWidth/canvas.width,.012,.30),
     angle:Math.atan2(dy,dx),naturalGap:clamp(naturalGap,0,.4)
   };
   this.status='Approximate face-tracked lip motion active';
  }catch(error){
   this.face=null;this.status='Face tracking paused: '+String(error.message||error);
  }
 }
 apply(ctx,canvas,analysis,time,{strength=.45,mode='auto',enabled=true,now=performance.now(),detectFrame=true}={}){
  if(!enabled||!this.ready)return false;
  if(detectFrame)this.detect(canvas,now,mode);
  if(!this.face)return false;
  const energy=mouthEnergy(analysis,time);
  const cue=timedMouthEnergy(this.lyricCues,time);
  const requested=clamp(Number(strength)||0,0,1)*(cue===null?energy:energy*.45+cue*.55);
  // One-pole smoothing avoids flickering while remaining responsive to syllables.
  this.smoothedOpen+=clamp(requested-this.smoothedOpen,-.30,.30)*.28;
  const f=this.face;
  const width=f.w*canvas.width;
  // Preserve mouth geometry: do not zoom, crop, scale, enlarge or relocate
  // any part of the face. A feathered dark inner-mouth crease is the only
  // composited effect; fade it when the original lips are already parted.
  const extra=clamp(.015+this.smoothedOpen*.12-f.naturalGap,0,.11);
  if(width<6||extra<.004)return false;
  const cx=f.x*canvas.width,cy=f.y*canvas.height;
  const radiusX=width*.46,radiusY=Math.max(.35,Math.min(width*.065,width*extra*.47));
  const opacity=clamp(.06+this.smoothedOpen*.30,.06,.36);
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(f.angle||0);
  // The gradient fades entirely before the corners of the real mouth.
  const shade=ctx.createRadialGradient(0,0,0,0,0,radiusX);
  shade.addColorStop(0,'rgba(28,8,19,'+opacity.toFixed(3)+')');
  shade.addColorStop(.70,'rgba(28,8,19,'+(opacity*.55).toFixed(3)+')');
  shade.addColorStop(1,'rgba(28,8,19,0)');
  ctx.fillStyle=shade;
  ctx.beginPath();
  ctx.ellipse(0,0,radiusX,radiusY,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
  return true;
 }
}
