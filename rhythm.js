/* GalaXia GrooveLab rhythm engine: local spectral-onset detection and manual tempo.
   No song/audio leaves the device. The detector estimates tempo; it does not
   claim perfect metrical beat tracking for every genre. */
(function(root){
 'use strict';
 class RhythmTracker {
  constructor(){this.previous=null;this.fluxHistory=[];this.hits=[];this.lastHit=-Infinity;this.lastSample=-Infinity;this.estimatedBpm=0;this.flux=0;this.low=0;this.mid=0;this.high=0;}
  reset(){this.previous=null;this.fluxHistory.length=0;this.hits.length=0;this.lastHit=-Infinity;this.lastSample=-Infinity;this.estimatedBpm=0;}
  static median(xs){const a=[...xs].sort((x,y)=>x-y);return a.length?(a.length%2?a[a.length>>1]:(a[a.length/2-1]+a[a.length/2])/2):0;}
  update(bins,now=performance.now(),sensitivity=55){
   if(!bins||bins.length<32)return null;
   if(now-this.lastSample<55)return null;this.lastSample=now;
   const count=Math.min(bins.length,180),bands=[0,0,0],sizes=[0,0,0];let flux=0,total=0;
   if(!this.previous||this.previous.length!==count)this.previous=new Float32Array(count);
   for(let i=2;i<count;i++){
    const value=bins[i]/255,old=this.previous[i],weight=i<24?1.45:i<70?1.18:.7;
    flux+=Math.max(0,value-old)*weight;
    const k=i<24?0:i<70?1:2;bands[k]+=value;sizes[k]++;total+=value;
    this.previous[i]=value;
   }
   this.low=bands[0]/Math.max(1,sizes[0]);this.mid=bands[1]/Math.max(1,sizes[1]);this.high=bands[2]/Math.max(1,sizes[2]);
   flux/=Math.max(1,count-2);this.flux=flux;
   let history=this.fluxHistory;history.push(flux);if(history.length>42)history.shift();
   if(history.length<7)return null;
   const avg=history.reduce((a,b)=>a+b,0)/history.length;
   const dev=Math.sqrt(history.reduce((a,v)=>a+(v-avg)**2,0)/history.length);
   const threshold=avg+(1.95-(sensitivity/100)*1.38)*dev;
   const enoughAudio=total/(count-2)>.065;
   // 205ms minimum interval avoids false double-triggers from single drum transients.
   if(!enoughAudio||flux<Math.max(.006,threshold)||now-this.lastHit<205)return null;
   this.lastHit=now;this.hits.push(now);if(this.hits.length>22)this.hits.shift();
   const intervals=[];
   for(let i=1;i<this.hits.length;i++){
    const delta=this.hits[i]-this.hits[i-1];if(delta<235||delta>1250)continue;
    let bpm=60000/delta;
    // Keep half-time and double-time estimates within dance-friendly 72–174 BPM.
    while(bpm<72)bpm*=2;
    while(bpm>174)bpm/=2;
    intervals.push(bpm);
   }
   if(intervals.length>=3){const candidate=RhythmTracker.median(intervals.slice(-12));
    this.estimatedBpm=this.estimatedBpm?this.estimatedBpm*.77+candidate*.23:candidate;
   }
   return {strength:Math.min(1.5,.32+flux*7+this.low*.6),bpm:this.estimatedBpm||0,low:this.low,mid:this.mid,high:this.high};
  }
 }
 root.GrooveRhythm=RhythmTracker;
 if(typeof module!=='undefined'&&module.exports)module.exports=RhythmTracker;
})(typeof window!=='undefined'?window:globalThis);
