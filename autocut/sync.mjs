/* Media follows audio, never the reverse. Deliberately sparse seeks to avoid video decode stalls. */
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export function wrappedDrift(actual,desired,duration) {
  if(!Number.isFinite(duration)||duration<=0)return actual-desired;
  const x=((actual-desired+duration/2)%duration+duration)%duration-duration/2;
  return x;
}
export function syncDecision({actual,desired,duration,speed=1,now=0,lastSeek=-Infinity,newClip=false,mode='auto'}){
  const nominal=clamp(Number(speed)||1,.5,2);
  const drift=wrappedDrift(actual,desired,duration);
  const threshold=mode==='smooth'?1.0:mode==='quality'?.36:.48;
  const tolerance=mode==='smooth'?.105:.070;
  const minInterval=mode==='smooth'?1700:850;
  if(newClip||(!Number.isFinite(actual))|| (Math.abs(drift)>threshold&&now-lastSeek>minInterval))
    return {seek:true,rate:nominal,drift};
  if(Math.abs(drift)<tolerance)return {seek:false,rate:nominal,drift};
  // behind desired: speed up a little; ahead: slow down a little, capped to avoid audible artifacts (video is muted)
  const correction=clamp(-drift*.22,-.065,.065);
  return {seek:false,rate:clamp(nominal*(1+correction),.45,2.1),drift};
}
export function videoDelayTarget(sourceOffset,elapsed,speed,offsetMilliseconds=0){
  return Number(sourceOffset||0)+Math.max(0,elapsed)*clamp(Number(speed)||1,.5,2)+clamp(Number(offsetMilliseconds)||0,-1200,1200)/1000;
}
export function drawIntervalFor(mode,isMobile=false){
  return mode==='smooth'?1000/20:mode==='quality'?1000/30:(isMobile?1000/22:1000/26);
}
export function syncStatus(drift,frameAgeMs,droppedFrames=0){
  if(frameAgeMs>750)return 'VIDEO STALLED';
  if(Math.abs(drift)> .35)return 'CORRECTING DRIFT';
  if(droppedFrames>4)return 'DROPPED FRAMES';
  return 'AUDIO MASTER ✓';
}
