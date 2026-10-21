/* GalaXia GrooveLab v7. Offline-only video clip recording and precision playback.
   All enhancements use user-gesture-friendly feature detection and gracefully
   disable unsupported media recording APIs. */
(function(root){
 'use strict';
 const $=id=>document.getElementById(id);
 const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
 const timeLabel=s=>{const n=Math.max(0,Math.floor(s||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');};
 function install(api){
  const player=api.playMedia;
  let abA=null,abB=null,loopTrack=null,guardSeeking=false;
  let sleepDeadline=0,sleepTimeout=0,sleepTick=0;
  let clip=null,lastClip=null,lastURL=null,spriteCache=new Map();

  function writeLoop(){
   $('loopStatus').textContent=abA===null?'A–B loop off. Set A while a song is playing.':
     abB===null?'A '+timeLabel(abA)+' — set B to finish the loop.':
       '🔁 Loop A '+timeLabel(abA)+' → B '+timeLabel(abB)+' · '+timeLabel(abB-abA)+' seconds';
   $('loopSetA').classList.toggle('selected',abA!==null);
   $('loopSetB').classList.toggle('selected',abB!==null);
  }
  function resetLoop(){abA=null;abB=null;loopTrack=api.getCurrent()?.id||null;writeLoop();}
  $('loopSetA').onclick=()=>{
   if(!player.src||!Number.isFinite(player.duration)){api.notice('Import and play a song before marking a loop.');return;}
   loopTrack=api.getCurrent()?.id||null;abA=Math.max(0,player.currentTime);abB=null;writeLoop();api.notice('A marker placed at '+timeLabel(abA));
  };
  $('loopSetB').onclick=()=>{
   if(abA===null||loopTrack!==api.getCurrent()?.id){api.notice('Place the A marker first.');return;}
   const point=player.currentTime;
   if(point-abA<0.4){api.notice('B must be at least 0.4 seconds after A.');return;}
   abB=point;writeLoop();api.notice('Looping '+timeLabel(abA)+' → '+timeLabel(abB));
  };
  $('loopClear').onclick=()=>{resetLoop();api.notice('A–B loop cleared.');};
  player.addEventListener('timeupdate',()=>{
   if(abA!==null&&abB!==null&&loopTrack===api.getCurrent()?.id&&!guardSeeking&&player.currentTime>=abB-.06){
    guardSeeking=true;player.currentTime=abA;
    setTimeout(()=>{guardSeeking=false;},80);
   }
  });
  player.addEventListener('loadstart',resetLoop);
  const savedRate=Number(localStorage.getItem('groovelab_play_speed_v7')||1);
  const speedSelect=$('playbackRate');
  const allowed=[.75,1,1.25,1.5];
  speedSelect.value=String(allowed.includes(savedRate)?savedRate:1);
  player.defaultPlaybackRate=player.playbackRate=Number(speedSelect.value);
  speedSelect.onchange=()=>{
   player.defaultPlaybackRate=player.playbackRate=Number(speedSelect.value);
   localStorage.setItem('groovelab_play_speed_v7',speedSelect.value);
   updatePosition();api.notice('Playback speed '+speedSelect.value+'×');
  };

  // Lock-screen / Bluetooth / media-key integration (limited by iOS/browser behavior).
  let lastPosition=0;
  function updatePosition(){
   if(!('mediaSession' in navigator)||!navigator.mediaSession.setPositionState)return;
   if(!Number.isFinite(player.duration)||player.duration<=0)return;
   try{navigator.mediaSession.setPositionState({duration:player.duration,position:clamp(player.currentTime,0,player.duration),playbackRate:player.playbackRate||1});}catch(e){}
  }
  function refreshMedia(){
   if(!('mediaSession' in navigator))return;
   try{navigator.mediaSession.playbackState=player.paused?'paused':'playing';
    const name=api.getCurrent()?.name||'GalaXia GrooveLab';
    if(typeof MediaMetadata==='function')navigator.mediaSession.metadata=new MediaMetadata({title:name,artist:'GalaXia GrooveLab · Local music',album:'Your pocket sound universe',artwork:[{src:new URL('/icon.svg',location.href).href,type:'image/svg+xml',sizes:'any'}]});
    updatePosition();
   }catch(e){}
  }
  function useAction(action,fn){try{navigator.mediaSession.setActionHandler(action,fn);}catch(e){}}
  if('mediaSession' in navigator){
   useAction('play',()=>api.ensureAudio().then(()=>player.play()).catch(()=>{}));
   useAction('pause',()=>player.pause());
   useAction('stop',()=>{player.pause();if(Number.isFinite(player.duration))player.currentTime=0;});
   useAction('previoustrack',()=>api.nextTrack(true,-1));
   useAction('nexttrack',()=>api.nextTrack(true,1));
   useAction('seekbackward',d=>{if(Number.isFinite(player.duration))player.currentTime=clamp(player.currentTime-(d.seekOffset||10),0,player.duration);updatePosition();});
   useAction('seekforward',d=>{if(Number.isFinite(player.duration))player.currentTime=clamp(player.currentTime+(d.seekOffset||10),0,player.duration);updatePosition();});
   useAction('seekto',d=>{if(Number.isFinite(player.duration)&&Number.isFinite(d.seekTime))player.currentTime=clamp(d.seekTime,0,player.duration);updatePosition();});
  }
  ['play','pause','loadedmetadata','emptied'].forEach(evt=>player.addEventListener(evt,refreshMedia));
  player.addEventListener('timeupdate',()=>{let now=performance.now();if(now-lastPosition>850){lastPosition=now;updatePosition();}});

  // Sleep timer: no network, no account and no background task needed.
  function clearSleep(){clearTimeout(sleepTimeout);clearInterval(sleepTick);sleepTimeout=sleepTick=0;sleepDeadline=0;}
  $('sleepTimer').onchange=()=>{
   clearSleep();const minutes=Number($('sleepTimer').value);
   if(!minutes){$('sleepStatus').textContent='🌙 Sleep timer is off.';api.notice('Sleep timer disabled.');return;}
   sleepDeadline=Date.now()+minutes*60000;
   const tick=()=>{$('sleepStatus').textContent='⏳ Music pauses in '+timeLabel((sleepDeadline-Date.now())/1000);};
   tick();sleepTick=setInterval(tick,10000);
   sleepTimeout=setTimeout(()=>{
    player.pause();clearSleep();$('sleepTimer').value='0';$('sleepStatus').textContent='🌙 Sleep timer finished · music paused.';
    api.notice('Sleep timer finished; playback paused.');
   },minutes*60000);
   api.notice('Sleep timer set for '+minutes+' minutes.');
  };
  const sleepStatus=document.createElement('p');sleepStatus.id='sleepStatus';sleepStatus.className='loop-status';sleepStatus.textContent='🌙 Sleep timer is off.';
  $('sleepTimer').closest('.extras-control').after(sleepStatus);

  // Retro glow/response controls are persisted in the existing visualizer config.
  const retro=root.GrooveVisuals;
  if(retro){
   const sync=()=>{
    $('visualGain').value=String(Math.round(retro.config.gain*100));
    $('visualTrails').value=String(Math.round(retro.config.trails*100));
    $('visualGainLabel').textContent=Math.round(retro.config.gain*100)+'%';
    $('visualTrailsLabel').textContent=Math.round(retro.config.trails*100)+'%';
   };
   sync();
   $('visualGain').oninput=e=>{retro.set('gain',Number(e.target.value)/100);$('visualGainLabel').textContent=e.target.value+'%';};
   $('visualTrails').oninput=e=>{retro.set('trails',Number(e.target.value)/100);$('visualTrailsLabel').textContent=e.target.value+'%';};
  }

  // Fast, local filtering for people with large imported music libraries.
  const search=document.createElement('input');search.id='trackSearch';search.type='search';search.placeholder='🔎 Search your imported songs';search.setAttribute('aria-label','Search imported tracks');
  search.className='track-search';$('trackList').before(search);
  function filterTracks(){const term=search.value.trim().toLocaleLowerCase();for(const row of $('trackList').querySelectorAll('.track'))row.hidden=!!term&&!row.textContent.toLocaleLowerCase().includes(term);}
  search.oninput=filterTracks;
  const trackObserver=new MutationObserver(filterTracks);trackObserver.observe($('trackList'),{childList:true});

  // This canvas remains visible in the studio, while a separate canvas is used
  // to generate original visualizer art at the chosen output resolution.
  const preview=$('clipCanvas'),captureStatus=$('clipStatus'),recordButton=$('clipRecord'),result=$('clipResult');
  const fx=document.createElement('canvas');fx.id='clipFxSource';fx.style.cssText='position:fixed;left:-5000px;top:-5000px;pointer-events:none;width:960px;height:540px;opacity:0;';document.body.append(fx);
  const styles=preview.getContext('2d',{alpha:false});
  const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/mp4','video/webm'];
  function supportedMime(){if(typeof MediaRecorder==='undefined')return null;return types.find(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(e){return false}})||'';}
  let mime=supportedMime();
  if(!preview.captureStream||mime===null){recordButton.disabled=true;captureStatus.textContent='Video recorder unavailable on this browser · use screen recording instead';}
  function configCanvas(){const vertical=$('clipFormat').value==='tall',w=vertical?540:960,h=vertical?960:540;
   preview.width=w;preview.height=h;preview.classList.toggle('tall',vertical);fx.style.width=w+'px';fx.style.height=h+'px';fx.width=w;fx.height=h;
   spriteCache.clear();paintIdle();
  }
  function paintIdle(){if(clip)return;styles.fillStyle='#070716';styles.fillRect(0,0,preview.width,preview.height);styles.fillStyle='#e6c7f1';styles.textAlign='center';styles.font='bold 24px system-ui';styles.fillText('✦ RETRO CLIP STUDIO',preview.width/2,preview.height/2-8);styles.font='16px system-ui';styles.fillStyle='#b59ac5';styles.fillText('Play a track & record your visuals',preview.width/2,preview.height/2+28);}
  $('clipFormat').addEventListener('change',()=>{if(!clip)configCanvas();});configCanvas();
  // Snapshot SVG pose art. Inline transforms preserve articulated dancing.
  function dancerFrame(a,liveNode,now){
   const id=String(a.id),entry=spriteCache.get(id)||{image:new Image(),signature:'',at:0,loaded:false,loading:false};
   if(now-entry.at>120&&!entry.loading){
    const svg=liveNode?.querySelector('svg.avatar-sprite');
    const markup=svg?new XMLSerializer().serializeToString(svg):api.avatarSvg(a);
    if(markup!==entry.signature){
     entry.signature=markup;entry.loading=true;
     const next=new Image();
     next.onload=()=>{entry.image=next;entry.loaded=true;entry.loading=false;};
     next.onerror=()=>{entry.loading=false;};
     next.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);
    }
    entry.at=now;
   }
   spriteCache.set(id,entry);
   return entry;
  }
  function drawDancers(g,w,h,now){
   if(!$('clipDancers').checked)return;
   const dancers=api.getCrew().slice(0,4);if(!dancers.length)return;
   const baseH=(w<h?h*.25:h*.43),bodyH=clamp(baseH,125,330),bodyW=bodyH*120/178;
   for(let i=0;i<dancers.length;i++){
    const a=dancers[i],live=[...document.querySelectorAll('.avatar-float')].find(n=>n.dataset.id===String(a.id));
    const image=dancerFrame(a,live,now);
    const sway=Math.sin(now/420+i*1.6)*w*.008,step=Math.abs(Math.sin(now/340+i*1.33))*h*.008;
    const cx=w*(i+1)/(dancers.length+1)+sway,top=h-bodyH-h*.045-step;
    if(image.loaded){g.save();g.shadowBlur=18;g.shadowColor='#de6bbd9c';g.drawImage(image.image,cx-bodyW/2,top,bodyW,bodyH);g.restore();}
    g.fillStyle='#fbdffa';g.font=`bold ${Math.max(12,Math.round(w*.018))}px system-ui`;g.textAlign='center';g.shadowBlur=5;g.shadowColor='#10091f';g.fillText(a.name||'Dancer',cx,h-h*.028);g.shadowBlur=0;
   }
  }
  let raf=0,frameAt=0,firstFrame=false;
  function videoFrame(now){if(!clip)return;
   raf=requestAnimationFrame(videoFrame);if(now-frameAt<37)return;frameAt=now;
   const w=preview.width,h=preview.height;
   if(retro)retro.paint(fx,api.getAnalyser(),!player.paused||api.isBeatOn());
   styles.clearRect(0,0,w,h);styles.drawImage(fx,0,0,w,h);
   drawDancers(styles,w,h,now);
   styles.save();styles.textAlign='left';styles.font=`bold ${Math.round(w*.017)}px system-ui`;styles.fillStyle='#ffe4fb';styles.shadowColor='#ff68bc';styles.shadowBlur=9;
   styles.fillText('✦ GalaXia GrooveLab',w*.027,h*.052);styles.restore();
   styles.textAlign='right';styles.fillStyle='#ffffff99';styles.font=`${Math.round(w*.014)}px system-ui`;
   const track=api.getCurrent();styles.fillText(track?track.name.slice(0,46):'RETRO VISUALS',w*.974,h*.052);
   firstFrame=true;
  }
  let nextIndex=0;
  async function startClip(){
   if(clip)return;
   if(!preview.captureStream||typeof MediaRecorder==='undefined'){api.notice('This browser cannot capture a canvas video; use the device screen recorder.');return;}
   const duration=Number($('clipDuration').value)||30;
   const mediaType=supportedMime();
   if(mediaType===null){api.notice('Video recording is unavailable here.');return;}
   recordButton.disabled=true;
   let audioDestination=null,sourceStream=null,rec=null;
   try{
    const ctx=await api.ensureAudio();
    configCanvas();
    clip={start:performance.now(),duration,rec:null,stream:null,audioDestination:null,timer:null,blobParts:[],running:true};
    // Provide the canvas with a first frame before capture begins.
    videoFrame(performance.now());
    sourceStream=preview.captureStream(25);
    if(!sourceStream.getVideoTracks().length)throw Error('Your browser did not provide a video track.');
    audioDestination=ctx.createMediaStreamDestination();
    api.getMaster().connect(audioDestination);
    const stream=new MediaStream([...sourceStream.getVideoTracks(),...audioDestination.stream.getAudioTracks()]);
    rec=new MediaRecorder(stream,mediaType?{mimeType:mediaType,videoBitsPerSecond:1800000}:undefined);
    clip.rec=rec;clip.stream=stream;clip.audioDestination=audioDestination;
    rec.ondataavailable=e=>{if(e.data&&e.data.size)clip?.blobParts.push(e.data);};
    rec.onerror=e=>{api.notice('Clip recording error: '+(e.error?.message||'Unknown error'));stopClip();};
    rec.onstop=()=>finishClip();
    rec.start(500);
    captureStatus.textContent='🔴 Recording · 00:00 / '+timeLabel(duration);
    captureStatus.classList.add('recording');
    recordButton.textContent='■ Finish clip';
    recordButton.disabled=false;
    const startedAt=performance.now();
    clip.timer=setInterval(()=>{
     if(!clip||!clip.running)return;
     const elapsed=(performance.now()-startedAt)/1000;
     captureStatus.textContent='🔴 Recording · '+timeLabel(elapsed)+' / '+timeLabel(duration);
     if(elapsed>=duration)stopClip();
    },220);
   }catch(err){
    console.warn('GrooveLab clip recorder:',err);
    if(clip?.timer)clearInterval(clip.timer);cancelAnimationFrame(raf);
    try{api.getMaster()?.disconnect(audioDestination);}catch(e){}
    if(sourceStream)sourceStream.getTracks().forEach(track=>track.stop());
    clip=null;recordButton.disabled=false;recordButton.textContent='⏺ Record video';captureStatus.classList.remove('recording');
    captureStatus.textContent='Unavailable: '+String(err.message||err).slice(0,75);
    api.notice('Video capture unavailable: '+String(err.message||err).slice(0,90));
    paintIdle();
   }
  }
  function stopClip(){
   if(!clip||!clip.running)return;
   clip.running=false;recordButton.disabled=true;captureStatus.textContent='Encoding your clip…';
   clearInterval(clip.timer);cancelAnimationFrame(raf);
   try{if(clip.rec.state!=='inactive')clip.rec.stop();else finishClip();}catch(e){finishClip();}
  }
  let finishing=false;
  async function finishClip(){
   if(finishing||!clip)return;finishing=true;
   const prev=clip;clip=null;
   clearInterval(prev.timer);cancelAnimationFrame(raf);
   try{api.getMaster()?.disconnect(prev.audioDestination);}catch(e){}
   prev.stream?.getTracks().forEach(t=>{try{t.stop();}catch(e){}});
   const mimeType=prev.rec?.mimeType||'video/webm';
   const blob=new Blob(prev.blobParts,{type:mimeType});
   recordButton.textContent='⏺ Record video';recordButton.disabled=false;captureStatus.classList.remove('recording');
   if(blob.size<1024){captureStatus.textContent='Nothing captured. Try playing a track before recording.';api.notice('The browser did not produce video data.');finishing=false;paintIdle();return;}
   const ext=mimeType.includes('mp4')?'mp4':'webm',name='GalaXia Clip '+new Date().toISOString().replace(/[:.]/g,'-')+'.'+ext;
   lastClip=new File([blob],name,{type:mimeType});
   if(lastURL)URL.revokeObjectURL(lastURL);lastURL=URL.createObjectURL(blob);
   const link=$('clipDownload');link.href=lastURL;link.download=name;
   result.hidden=false;
   $('clipShare').hidden=!(navigator.canShare?.({files:[lastClip]}));
   captureStatus.textContent='✅ Video ready · '+(blob.size/1048576).toFixed(1)+' MB';
   try{await api.importFiles([lastClip]);}catch(e){api.notice('Video recorded; use Save clip to download.');}
   finishing=false;
  }
  recordButton.onclick=()=>clip?stopClip():startClip();
  $('clipShare').onclick=async()=>{if(!lastClip||!navigator.share)return;try{await navigator.share({files:[lastClip],title:'GalaXia GrooveLab clip'});}catch(e){if(e.name!=='AbortError')api.notice('Sharing unavailable; use Save clip.');}};

  // Spacebar & arrow controls avoid form fields and work in fullscreen visualizer.
  document.addEventListener('keydown',e=>{
   if(e.altKey||e.metaKey||e.ctrlKey||e.target.closest('input,textarea,select,button,[contenteditable]'))return;
   if(e.code==='Space'){e.preventDefault();api.togglePlay();}
   if(e.code==='ArrowLeft'&&Number.isFinite(player.duration)){e.preventDefault();player.currentTime=clamp(player.currentTime-5,0,player.duration);}
   if(e.code==='ArrowRight'&&Number.isFinite(player.duration)){e.preventDefault();player.currentTime=clamp(player.currentTime+5,0,player.duration);}
  });
  return {resetLoop,stopClip,refreshMedia,configCanvas};
 }
 root.GrooveExtras={install};
})(window);
