import {PRESETS,EFFECTS,TRANSITIONS,MOTIONS,clamp,fmt,summarizeAudio,parseDirection,makePlan,findSegment,assertContinuous} from './engine.mjs';
import {drawShot,drawTreatment,drawCutOverlay,transitionMix} from './effects.mjs';
const $=(id)=>document.getElementById(id);
const q=(selector)=>document.querySelector(selector);
const state={audioFile:null,audioUrl:null,audioBuffer:null,analysis:null,media:[],style:'Bass Impact',seed:0,plan:null,selectedId:null,playing:false,position:0,playStart:0,rendering:false,raf:0,lastMediaId:null,previewLooped:false};
const audio=new Audio();
audio.preload='auto';
audio.volume=1;
const canvas=$('previewCanvas'),ctx=canvas.getContext('2d',{alpha:false});
const wave=$('waveform'),waveCtx=wave.getContext('2d');
const styleButtons=()=>[...document.querySelectorAll('[data-style]')];
const defaultCanvas=()=>{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,'#3b224b');g.addColorStop(.6,'#1c152d');g.addColorStop(1,'#0c0a16');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#ead4f7';ctx.textAlign='center';ctx.font='700 '+Math.round(canvas.width*.08)+'px sans-serif';ctx.fillText('✦',canvas.width/2,canvas.height/2);};
function status(message,kind=''){const el=$('status');el.textContent=message;el.className='status '+kind}
function duration(){const master=state.analysis?.duration||0;if(!master)return 0;return $('durationLock').checked?master:clamp(Number($('customDuration').value)||master,.5,Math.max(3600,master*2))}
function settings(){const [a,b]=$('aspect').value.split(':').map(Number);const quality=Number($('quality').value);let width,height;if(a<b){width=quality;height=Math.round(quality*b/a)}else if(a>b){height=quality;width=Math.round(quality*a/b)}else{width=quality;height=quality}
return {width,height};
}
function resizeCanvas(){const {width,height}=settings();canvas.width=width;canvas.height=height;$('previewFrame').style.aspectRatio=String(width)+' / '+String(height);$('exportResolution').textContent=width+' × '+height;renderFrame(state.position);}
function syncLengths(){const d=duration();$('songDuration').textContent=state.analysis?fmt(state.analysis.duration):'—';$('videoDuration').textContent=d?fmt(d):'—';$('exportLength').textContent=d?fmt(d):'—';$('totalTime').textContent=fmt(d);$('waveEnd').textContent=fmt(state.analysis?.duration||0);$('timelineDuration').textContent=fmt(d);$('unlockBox').hidden=$('durationLock').checked;$('lockMessage').innerHTML=$('durationLock').checked?'<span>✓</span> Lock is ON. The video timeline ends with the soundtrack; visuals loop or trim to fit.':'<span>↔</span> Lock is OFF. Your chosen video length controls the edit; audio repeats if needed.';if(state.plan&&Math.abs(state.plan.duration-d)>.0001)createPlan(false);}
function readMetadata(element,event){return new Promise((resolve,reject)=>{if(element.readyState>=1&&Number.isFinite(element.duration)){resolve();return}const timeout=setTimeout(()=>{done();reject(Error('Media metadata timed out'))},12000);function done(){clearTimeout(timeout);element.removeEventListener(event,success);element.removeEventListener('error',fail)}function success(){done();resolve()}function fail(){done();reject(Error('Browser cannot decode this file'))}element.addEventListener(event,success,{once:true});element.addEventListener('error',fail,{once:true})})}
async function loadAudio(file){if(!file)return;stopPreview();status('Decoding soundtrack & finding beats…');try{
  if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);
  state.audioUrl=URL.createObjectURL(file);
  audio.src=state.audioUrl;audio.load();
  const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  try{state.audioBuffer=await audioCtx.decodeAudioData(await file.arrayBuffer());}finally{await audioCtx.close()}
  state.audioFile=file;
  state.analysis=summarizeAudio(Array.from({length:Math.min(2,state.audioBuffer.numberOfChannels)},(_,i)=>state.audioBuffer.getChannelData(i)),state.audioBuffer.sampleRate);
  $('trackTitle').textContent=file.name;$('trackInfo').textContent=state.analysis.confidence==='low'?'Quiet or complex track · tempo is approximate':'Audio analyzed · '+state.analysis.confidence+' BPM';
  $('trackLength').textContent=fmt(state.analysis.duration);
  $('bpmReadout').textContent=state.analysis.bpm.toFixed(1)+' BPM · '+state.analysis.confidence;
  $('bpmInput').value=String(state.analysis.bpm);
  $('customDuration').value=String(Math.round(state.analysis.duration*10)/10);
  drawWave();syncLengths();status('Soundtrack loaded: '+state.analysis.bpm.toFixed(1)+' BPM ('+state.analysis.confidence+').','ok');
  if(state.media.length)createPlan(false);
 }catch(err){state.audioBuffer=null;state.analysis=null;state.audioFile=null;status('Audio load failed: '+err.message,'error')}
}
function getImage(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Image cannot be decoded'));image.src=url})}
async function addMedia(files){if(!files?.length)return;status('Loading '+files.length+' media file(s)…');let added=0,failed=0;
 for(const file of files){
   if(!file.type.startsWith('video/')&&!file.type.startsWith('image/')){failed++;continue}
   const url=URL.createObjectURL(file);
   try{let el,kind,duration=0;
    if(file.type.startsWith('image/')){el=await getImage(url);kind='image';}
    else{el=document.createElement('video');el.src=url;el.muted=true;el.playsInline=true;el.preload='auto';await readMetadata(el,'loadedmetadata');duration=el.duration;kind='video';if(!Number.isFinite(duration)||duration<=0)throw Error('No video duration');}
    const id='m'+Date.now()+'_'+Math.random().toString(36).slice(2);
    state.media.push({id,name:file.name,kind,el,url,duration});
    added++;
   }catch(e){failed++;URL.revokeObjectURL(url);console.warn('Skipped media',file.name,e)}
 }
 updateMediaList();if(state.audioBuffer&&state.media.length)createPlan(false);
 status(added+' file(s) loaded'+(failed?' · '+failed+' unsupported or unreadable file(s)':'')+'.',failed?'error':'ok');
}
function updateMediaList(){const el=$('mediaList');el.replaceChildren();if(!state.media.length){el.textContent='Your footage collection will appear here.';return}
 for(const m of state.media){const chip=document.createElement('div');chip.className='media-chip';const ico=document.createElement('b');ico.textContent=m.kind==='video'?'▣':'▤';const name=document.createElement('span');name.textContent=m.name;name.title=m.name;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove '+m.name;remove.setAttribute('aria-label','Remove '+m.name);remove.addEventListener('click',()=>{stopPreview();if(m.kind==='video')m.el.pause();URL.revokeObjectURL(m.url);state.media=state.media.filter(x=>x.id!==m.id);updateMediaList();if(state.media.length&&state.audioBuffer)createPlan(false);else{state.plan=null;clearEdit();} });chip.append(ico,name,remove);el.append(chip);}
}
function chooseStyle(name) {
  if (!PRESETS[name]) return;
  state.style = name;
  styleButtons().forEach(button=>button.classList.toggle('selected',button.dataset.style===name));
}
function templateLibrary() {
  const grid=$('styleGrid'), query=$('templateSearch').value.toLowerCase().trim(), category=$('templateFilter').value;
  const matches=Object.entries(PRESETS).filter(([name, p])=>(category==='All'||p.category===category)
    &&(!query||[name,p.description,p.category,...p.effects].join(' ').toLowerCase().includes(query)));
  grid.replaceChildren();
  const icons={Viral:'⚡',Cinematic:'◈',Retro:'▤',Experimental:'✳'};
  for(const [name,p] of matches){
    const button=document.createElement('button');
    button.type='button';button.className='style-tile'+(state.style===name?' selected':'');
    button.dataset.style=name;button.title=p.description;
    const ico=document.createElement('span');ico.className='style-icon';ico.textContent=icons[p.category]||'✦';
    const label=document.createElement('b');label.textContent=name;
    const caption=document.createElement('small');caption.textContent=p.description;
    const categoryTag=document.createElement('span');categoryTag.className='style-category';categoryTag.textContent=p.category;
    button.append(ico,label,caption,categoryTag);
    button.addEventListener('click',()=>{
      chooseStyle(name);$('directorPrompt').value='';if(state.audioBuffer&&state.media.length)createPlan(true);
    });
    grid.append(button);
  }
  $('templateCount').textContent=matches.length+' / '+Object.keys(PRESETS).length+' STYLES';
  if(!matches.length)grid.textContent='No templates match. Try a different word.';
}
function variationOptions(){
  return {
    variation:Number($('variation').value)/100,
    avoidRepeats:$('avoidRepeats').checked,
    dynamics:$('dynamics').checked
  };
}
function updateVariation(){
  $('variationValue').textContent=$('variation').value+'%';
}
function drawWave(){const w=wave.width,h=wave.height;waveCtx.clearRect(0,0,w,h);waveCtx.fillStyle='#151020';waveCtx.fillRect(0,0,w,h);
 const a=state.analysis;if(!a){waveCtx.fillStyle='#6f587e';waveCtx.font='12px sans-serif';waveCtx.fillText('Load a song to see its waveform',18,48);return}
 const envelope=a.amplitude,step=envelope.length/w;
 waveCtx.strokeStyle='#ba83da';waveCtx.lineWidth=2;waveCtx.beginPath();
 for(let x=0;x<w;x++){const from=Math.floor(x*step),to=Math.min(envelope.length,Math.max(from+1,Math.floor((x+1)*step)));let max=0;for(let j=from;j<to;j++)max=Math.max(max,envelope[j]);const size=clamp(max*3.2,0,1)*h*.44;waveCtx.moveTo(x,h/2-size);waveCtx.lineTo(x,h/2+size)}waveCtx.stroke();
 waveCtx.strokeStyle='#dea7f74d';waveCtx.lineWidth=1;
 for(const t of a.beats){if(t>a.duration)break;const x=t/a.duration*w;waveCtx.beginPath();waveCtx.moveTo(x,0);waveCtx.lineTo(x,h);waveCtx.stroke()}
 drawWaveHead();
}
function drawWaveHead(){if(!state.analysis)return;const x=state.position/state.analysis.duration*wave.width;waveCtx.strokeStyle='#fff';waveCtx.lineWidth=2;waveCtx.beginPath();waveCtx.moveTo(x,0);waveCtx.lineTo(x,wave.height);waveCtx.stroke();}
function seek(t){const d=duration();state.position=clamp(t,0,d);if(state.analysis){audio.currentTime=Math.min(Math.max(0,((state.position%state.analysis.duration)+state.analysis.duration)%state.analysis.duration),state.analysis.duration-.02)}if(state.playing)state.playStart=performance.now()-state.position*1000;renderFrame(state.position);updateTransport();}
function updateTransport(){const d=duration();$('previewSeek').value=d?String(Math.round(1000*state.position/d)):'0';$('currentTime').textContent=fmt(state.position)}
function sceneMedia(id){return state.media.find(x=>x.id===id)}
function chooseScene(id){state.selectedId=id;document.querySelectorAll('.shot').forEach(x=>x.classList.toggle('active',x.dataset.id===id));document.querySelectorAll('.scene-row').forEach(x=>x.style.borderColor=x.dataset.id===id?'#b986db':'#32273e')}
function updateTimeline() {
  const plan=state.plan;
  $('timelineBar').replaceChildren();$('sceneInspector').replaceChildren();
  if(!plan){clearEdit();return}
  $('sceneCount').textContent=plan.segments.length+' CUTS';
  $('exportScenes').textContent=String(plan.segments.length);
  const barFragment=document.createDocumentFragment();
  for(let i=0;i<plan.segments.length;i++){
    const seg=plan.segments[i],media=sceneMedia(seg.mediaId);
    const bar=document.createElement('button');
    bar.type='button';bar.className='shot';bar.dataset.id=seg.id;
    bar.style.width=(seg.end-seg.start)/plan.duration*100+'%';
    bar.title=(media?.name||'Clip')+' · '+fmt(seg.start)+' – '+fmt(seg.end)+' · '+seg.effect+' / '+seg.motion;
    const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');
    const e=document.createElement('small');e.textContent=seg.effect;
    bar.append(n,e);bar.addEventListener('click',()=>{chooseScene(seg.id);seek(seg.start)});
    barFragment.append(bar);
  }
  $('timelineBar').append(barFragment);
  const rows=document.createDocumentFragment(), maxRows=150;
  for(const seg of plan.segments.slice(0,maxRows)){
    const row=document.createElement('div');row.className='scene-row';row.dataset.id=seg.id;
    const top=document.createElement('div');top.className='scene-top';
    const num=document.createElement('span');num.className='scene-num';num.textContent='#'+String(Number(seg.id.slice(1))+1).padStart(2,'0');
    const title=document.createElement('span');title.className='scene-title';title.textContent=fmt(seg.start)+' → '+fmt(seg.end)+' · '+(seg.end-seg.start).toFixed(2)+'s';
    const mediaSelect=makeChoice('Footage',state.media.map(m=>({value:m.id,label:m.name})),seg.mediaId,value=>{seg.mediaId=value;seg.sourceOffset=0;seek(seg.start)});
    mediaSelect.className+=' clip-choice';
    top.append(num,title,mediaSelect);
    const options=document.createElement('div');options.className='scene-controls';
    options.append(
      makeChoice('FX',EFFECTS.map(v=>({value:v,label:v})),seg.effect,value=>{seg.effect=value;renderFrame(state.position)}),
      makeChoice('Motion',MOTIONS.map(v=>({value:v,label:v})),seg.motion||'static',value=>{seg.motion=value;renderFrame(state.position)}),
      makeChoice('Cut',TRANSITIONS.map(v=>({value:v,label:v})),seg.transition||'cut',value=>{seg.transition=value;renderFrame(state.position)}),
      makeChoice('Speed',[.5,.75,.85,1,1.2,1.35,1.6,2].map(v=>({value:String(v),label:v+'×'})),String(seg.speed||1),value=>{seg.speed=Number(value);renderFrame(state.position)})
    );
    row.append(top,options);
    row.addEventListener('click',event=>{if(['SELECT','OPTION','INPUT'].includes(event.target.tagName))return;chooseScene(seg.id);seek(seg.start)});
    rows.append(row);
  }
  $('sceneInspector').append(rows);
  if(plan.segments.length>maxRows){
    const n=document.createElement('p');n.className='scene-note';
    n.textContent='Showing first '+maxRows+' scene controls. Use the timeline above to preview every cut.';
    $('sceneInspector').append(n);
  }
  chooseScene(plan.segments[0]?.id);
}
function makeChoice(name, items, active, change) {
  const outer=document.createElement('label');outer.className='scene-option';
  const caption=document.createElement('span');caption.textContent=name;
  const select=document.createElement('select');select.setAttribute('aria-label',name+' for shot');
  for(const item of items) {
    const option=document.createElement('option');option.value=item.value;option.textContent=item.label;
    select.append(option);
  }
  select.value=String(active);
  select.addEventListener('change',()=>change(select.value));
  outer.append(caption,select);return outer;
}
function clearEdit(){$('timelineBar').textContent='Your edited shots will appear on this timeline.';$('sceneInspector').textContent='Generate an edit to inspect & customize individual scenes.';$('sceneCount').textContent='0 CUTS';$('exportScenes').textContent='0';renderFrame(0);}
function createPlan(randomize=true) {
  if(!state.audioBuffer){status('Load a soundtrack first.','error');return}
  if(!state.media.length){status('Add at least one video or image first.','error');return}
  stopPreview();
  if(randomize)state.seed++;
  const instructions=$('directorPrompt').value.trim();
  const director=parseDirection(instructions,state.style);
  if(instructions)chooseStyle(director.style);
  try {
    const options=variationOptions();
    state.plan=makePlan({
      duration:duration(),media:state.media,analysis:state.analysis,
      style:state.style,direction:instructions,seed:state.seed,...options
    });
    if(!assertContinuous(state.plan))throw Error('Timeline has a gap');
    const effectCount=new Set(state.plan.segments.map(seg=>seg.effect)).size;
    const motionCount=new Set(state.plan.segments.map(seg=>seg.motion)).size;
    $('directorOutput').textContent=state.plan.director+' '+state.plan.segments.length
      +' beat-led scenes · '+effectCount+' FX · '+motionCount+' camera moves · '
      +state.analysis.bpm.toFixed(1)+' BPM'+(options.avoidRepeats?' · anti-repeat ON':'')
      +($('durationLock').checked?' · full song locked':'');
    syncSummary();updateTimeline();seek(0);$('emptyPreview').hidden=true;
    status('New automatic edit ready: '+effectCount+' looks and '+motionCount+' camera moves. Remix again for new variations.','ok');
  }catch(error){status('Could not make edit: '+error.message,'error')}
}
function syncSummary(){syncLengthsSafe();drawWave();updateTransport()}
function syncLengthsSafe(){const d=duration();$('songDuration').textContent=fmt(state.analysis?.duration||0);$('videoDuration').textContent=fmt(d);$('exportLength').textContent=fmt(d);$('totalTime').textContent=fmt(d);$('timelineDuration').textContent=fmt(d);}
function setVideoMedia(media,target,shot,isForeground=true) {
  if(media.kind!=='video'||!Number.isFinite(media.duration)||media.duration<=0)return;
  const element=media.el, speed=clamp(Number(shot.speed)||1,.5,2);
  element.loop=true;element.muted=true;
  if(Math.abs(element.playbackRate-speed)>.001)element.playbackRate=speed;
  const desired=clamp((target%media.duration+media.duration)%media.duration,0,Math.max(.01,media.duration-.055));
  if(Math.abs(element.currentTime-desired)>.16) {
    try {element.currentTime=desired;} catch {}
  }
  if((state.playing||state.rendering)&&isForeground) {
    if(element.paused)element.play().catch(()=>{});
  }else if(!element.paused && !isForeground) {
    element.pause();
  }else if(!state.playing&&!state.rendering&&!element.paused){
    element.pause();
  }
}
function drawSource(media,segment,time,alpha=1,foreground=true){
  if(!media)return;
  const elapsed=Math.max(0,time-segment.start);
  const speed=clamp(Number(segment.speed)||1,.5,2);
  if(media.kind==='video') {
    setVideoMedia(media,segment.sourceOffset+elapsed*speed,segment,foreground);
    if(media.el.readyState<2)return;
  }
  drawShot(ctx,canvas,media,segment,time,alpha);
}
function renderFrame(time) {
  const w=canvas.width,h=canvas.height;
  ctx.fillStyle='#130f1b';ctx.fillRect(0,0,w,h);
  const segment=state.plan&&findSegment(state.plan.segments,clamp(time,0,Math.max(0,state.plan.duration-.00001)));
  if(!segment){defaultCanvas();return}
  const media=sceneMedia(segment.mediaId);
  if(!media){defaultCanvas();return}
  if(state.lastMediaId && state.lastMediaId!==media.id){
    const old=sceneMedia(state.lastMediaId);
    if(old?.kind==='video')old.el.pause();
  }
  state.lastMediaId=media.id;
  const opacity=transitionMix(segment,time);
  const index=Number(segment.id.slice(1));
  const previous=index>0?state.plan.segments[index-1]:null;
  const oldMedia=previous&&sceneMedia(previous.mediaId);
  const cut=segment.transition;
  const progress=1-opacity;
  if(opacity>0&&oldMedia){
    drawSource(oldMedia,previous,Math.max(previous.start,previous.end-.04),1,false);
    if(cut==='wipe'){
      ctx.save();ctx.beginPath();ctx.rect(0,0,w*progress,h);ctx.clip();
      drawSource(media,segment,time);ctx.restore();
    }else if(cut==='whipLeft'||cut==='whipRight'||cut==='slideUp'){
      ctx.save();
      const travel=(1-progress)*(cut==='slideUp'?h:w);
      if(cut==='slideUp')ctx.translate(0,travel);
      else ctx.translate(cut==='whipLeft'?travel:-travel,0);
      drawSource(media,segment,time);ctx.restore();
    }else if(cut==='spin'){
      ctx.save();ctx.translate(w/2,h/2);
      ctx.rotate((1-progress)*.43*Math.PI);ctx.scale(.7+.3*progress,.7+.3*progress);
      ctx.translate(-w/2,-h/2);drawSource(media,segment,time,progress);
      ctx.restore();
    }else{
      drawSource(media,segment,time,progress);
    }
  }else{
    drawSource(media,segment,time);
  }
  drawTreatment(ctx,canvas,segment,time,$('safeFlash').checked);
  drawCutOverlay(ctx,canvas,segment,time,$('safeFlash').checked);
}
function stopPreview(){if(state.raf)cancelAnimationFrame(state.raf);state.raf=0;state.playing=false;audio.pause();$('previewPlay').textContent='▶';for(const m of state.media){if(m.kind==='video')m.el.pause()}}
function tick(){if(!state.playing)return;const d=duration();let t=$('durationLock').checked?audio.currentTime:(performance.now()-state.playStart)/1000;if(!Number.isFinite(t))t=0;
 if(t>=d-.009){stopPreview();state.position=d;renderFrame(Math.max(0,d-.025));updateTransport();return}
 state.position=clamp(t,0,d);renderFrame(state.position);updateTransport();if(Math.floor(t*5)%3===0)drawWave();state.raf=requestAnimationFrame(tick)}
async function togglePreview(){if(state.rendering)return;if(!state.plan){status('Generate an edit to preview first.','error');return}
 if(state.playing){stopPreview();return}
 const d=duration();if(state.position>=d-.05)state.position=0;
 try{audio.loop=!$('durationLock').checked;audio.currentTime=clamp(state.position%(state.analysis?.duration||d),0,Math.max(0,(state.analysis?.duration||d)-.02));await audio.play();state.playStart=performance.now()-state.position*1000;state.playing=true;$('previewPlay').textContent='Ⅱ';state.raf=requestAnimationFrame(tick)}
 catch(e){status('Playback failed: '+e.message,'error')}
}
function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function filename(){return ($('projectName').value.trim()||'GalaXia-AutoCut').replace(/[^a-z0-9 _-]/gi,'').replace(/\s+/g,'-').slice(0,70)}
function savePlan(){if(!state.plan){status('Generate an edit first.','error');return}const payload={version:1,creator:'GalaXia AutoCut Studio',audio:state.audioFile?.name,durationLock:$('durationLock').checked,audioDuration:state.analysis?.duration,videoDuration:state.plan.duration,tempo:state.analysis?.bpm,tempoConfidence:state.analysis?.confidence,direction:$('directorPrompt').value,aspect:$('aspect').value,media:state.media.map(({id,name,kind,duration})=>({id,name,kind,duration})),scenes:state.plan.segments};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),filename()+'-edit-plan.json');status('Edit plan downloaded. This is metadata, not a rendered video.','ok')}
function renderCompatible(){
 if(!canvas.captureStream||!window.MediaRecorder||!(window.AudioContext||window.webkitAudioContext))return null;
 const candidates=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'];
 return candidates.find(t=>MediaRecorder.isTypeSupported(t))||null;
}
async function exportVideo(){
 if(state.rendering)return;
 if(!state.plan||!state.audioBuffer){status('Load audio + media and generate an edit first.','error');return}
 if(!assertContinuous(state.plan)){status('Cannot export: the edit contains a timeline gap.','error');return}
 const mime=renderCompatible();if(!mime){status('This browser cannot record WebM or MP4 with audio. Try Chrome or Edge on desktop, or download the editable plan.','error');return}
 stopPreview();state.rendering=true;$('exportBtn').disabled=true;$('generateBtn').disabled=true;$('renderProgress').hidden=false;$('renderProgress').value=0;status('Rendering in real time. Keep this tab visible until the file downloads…');
 let ac=null,src=null,recorder=null,stream=null,frameId=0,done=false;
 try{
  resizeCanvas();const length=state.plan.duration;
  ac=new (window.AudioContext||window.webkitAudioContext)();
  const dest=ac.createMediaStreamDestination();
  src=ac.createBufferSource();src.buffer=state.audioBuffer;src.loop=length>state.audioBuffer.duration+.01;src.connect(dest);src.connect(ac.destination);
  stream=canvas.captureStream(30);
  const recorded=new MediaStream([...stream.getVideoTracks(),...dest.stream.getAudioTracks()]);
  recorder=new MediaRecorder(recorded,{mimeType:mime,videoBitsPerSecond:Math.max(1200000,canvas.width*canvas.height*2.5)});
  const chunks=[];
  const finished=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};recorder.onerror=e=>reject(e.error||Error('Recorder failed'));recorder.onstop=()=>resolve(new Blob(chunks,{type:mime}))});
  await ac.resume();recorder.start(500);const startAt=ac.currentTime+.14;src.start(startAt);
  const paint=()=>{if(done)return;const t=Math.max(0,ac.currentTime-startAt);const at=Math.min(t,Math.max(0,length-.0001));state.position=at;renderFrame(at);updateTransport();$('renderProgress').value=Math.round(t/length*100);if(t<length){frameId=requestAnimationFrame(paint)}else{done=true;try{src.stop()}catch{};setTimeout(()=>{if(recorder?.state==='recording')recorder.stop()},50)}};
  frameId=requestAnimationFrame(paint);
  const blob=await finished;
  if(!blob.size)throw Error('Recorder returned an empty file');
  const extension=mime.startsWith('video/mp4')?'.mp4':'.webm';
  downloadBlob(blob,filename()+extension);status('Video downloaded · '+fmt(length)+' timeline · '+(blob.size/1024/1024).toFixed(1)+' MB. Container timing can vary by a frame.','ok');
 }catch(err){status('Render failed: '+err.message,'error')}finally{
  done=true;if(frameId)cancelAnimationFrame(frameId);try{if(src)src.stop()}catch{};try{if(recorder?.state==='recording')recorder.stop()}catch{};if(stream)stream.getTracks().forEach(track=>track.stop());try{await ac?.close()}catch{};
  state.rendering=false;$('exportBtn').disabled=false;$('generateBtn').disabled=false;$('renderProgress').hidden=true;for(const m of state.media){if(m.kind==='video')m.el.pause()}stopPreview();
 }
}
$('audioInput').addEventListener('change',e=>{loadAudio(e.target.files?.[0]);e.target.value=''});
$('mediaInput').addEventListener('change',e=>{addMedia([...e.target.files]);e.target.value=''});
function dropSupport(id,handler){const el=$(id);['dragenter','dragover'].forEach(event=>el.addEventListener(event,e=>{e.preventDefault();el.classList.add('drag-over')}));['dragleave','drop'].forEach(event=>el.addEventListener(event,e=>{e.preventDefault();el.classList.remove('drag-over')}));el.addEventListener('drop',e=>handler([...e.dataTransfer.files]))}
dropSupport('audioDrop',files=>loadAudio(files.find(f=>f.type.startsWith('audio/'))||files[0]));
dropSupport('mediaDrop',files=>addMedia(files));
templateLibrary();
$('templateSearch').addEventListener('input',templateLibrary);
$('templateFilter').addEventListener('change',templateLibrary);
$('variation').addEventListener('input',updateVariation);
$('variation').addEventListener('change',()=>{if(state.audioBuffer&&state.media.length)createPlan(true)});
$('avoidRepeats').addEventListener('change',()=>{if(state.audioBuffer&&state.media.length)createPlan(true)});
$('dynamics').addEventListener('change',()=>{if(state.audioBuffer&&state.media.length)createPlan(true)});
$('safeFlash').addEventListener('change',()=>renderFrame(state.position));
$('surpriseBtn').addEventListener('click',()=>{
  const names=Object.keys(PRESETS);
  const other=names.filter(name=>name!==state.style);
  chooseStyle(other[Math.floor(Math.random()*other.length)]||names[0]);
  $('directorPrompt').value='';
  $('variation').value='100';updateVariation();templateLibrary();createPlan(true);
});

document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>{$('directorPrompt').value=b.dataset.prompt;if(state.audioBuffer&&state.media.length)createPlan(false)}));
$('bpmInput').addEventListener('change',()=>{if(!state.analysis)return;const b=clamp(Number($('bpmInput').value)||state.analysis.bpm,62,190);state.analysis.bpm=b;const phase=state.analysis.phase||0,beat=60/b;state.analysis.beats=[];for(let t=phase;t<state.analysis.duration;t+=beat)state.analysis.beats.push(Number(t.toFixed(4)));$('bpmReadout').textContent=b.toFixed(1)+' BPM · manual';drawWave();if(state.media.length)createPlan(false)});
$('generateBtn').addEventListener('click',()=>createPlan(true));
$('shuffleBtn').addEventListener('click',()=>createPlan(true));
$('durationLock').addEventListener('change',()=>{stopPreview();syncLengths()});
$('customDuration').addEventListener('change',()=>{stopPreview();syncLengths()});
$('aspect').addEventListener('change',resizeCanvas);
$('quality').addEventListener('change',resizeCanvas);
$('previewPlay').addEventListener('click',togglePreview);
$('previewStop').addEventListener('click',()=>{stopPreview();seek(0)});
$('previewSeek').addEventListener('input',()=>seek(Number($('previewSeek').value)/1000*duration()));
wave.addEventListener('click',e=>{const x=(e.clientX-wave.getBoundingClientRect().left)/wave.getBoundingClientRect().width;seek(clamp(x,0,1)*(state.analysis?.duration||0))});
$('exportBtn').addEventListener('click',exportVideo);

function chatGPTBrief(){
 if(!state.analysis||!state.media.length){status('Load your soundtrack & video clips before sending a brief to ChatGPT.','error');return}
 const prompt='Act as a music-video creative director. Return ONLY a JSON object with a "shots" array: each shot has mediaIndex (zero-based integer), beats (number 1-12), effect (one of '+EFFECTS.join(', ')+'), transition (one of '+TRANSITIONS.join(', ')+'), motion (one of '+MOTIONS.join(', ')+'), and speed (0.5-2). You may add a "style" (one of '+Object.keys(PRESETS).join(', ')+') and "note". Design a varied short-form edit that does not repeat adjacent footage, look, motion or transition. The webpage will loop your shot pattern to fill the song. Return JSON ONLY: no markdown or comments. CRITICAL: Keep the original soundtrack length without altering pitch, tempo or running time.\n\nSong: '+state.audioFile.name+'\nExact duration seconds: '+state.analysis.duration.toFixed(5)+'\nEstimated BPM: '+state.analysis.bpm+' ('+state.analysis.confidence+')\nVideo format: '+$('aspect').value+'\nDirection: '+($('directorPrompt').value.trim()||state.style)+'\nAvailable media:\n'+state.media.slice(0,40).map((m,i)=>i+': '+m.name+' ('+m.kind+(m.kind==='video'?', '+m.duration.toFixed(2)+'s':'')+')').join('\n')+'\n\nSuggest about 8-24 shots. Prefer cuts on beats & dramatic passages.';
 navigator.clipboard?.writeText(prompt).then(()=>{status('ChatGPT brief copied. Open ChatGPT, paste it, then paste its JSON response here.','ok')}).catch(()=>{window.prompt('Copy this editing brief:',prompt);status('Copy the editing brief, then paste it into ChatGPT.')});
 if(!navigator.clipboard)window.prompt('Copy this editing brief:',prompt);
}
function applyChatGPTPlan(){
  if(!state.analysis||!state.media.length){status('Load music & footage first.','error');return}
  const raw=$('gptPlan').value.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  let obj;try{obj=JSON.parse(raw)}catch{status('Paste valid JSON returned by ChatGPT.','error');return}
  const shots=Array.isArray(obj.shots)?obj.shots.slice(0,200):[];
  if(!shots.length){status('ChatGPT JSON needs a non-empty "shots" array.','error');return}
  if(PRESETS[obj.style])chooseStyle(obj.style);
  stopPreview();
  const length=duration(),beat=60/state.analysis.bpm,segments=[];
  const fallback=makePlan({duration:length,media:state.media,analysis:state.analysis,style:state.style,
    seed:++state.seed,...variationOptions()});
  let start=0,index=0;
  while(start<length-.00001&&segments.length<2400){
    const shot=shots[index%shots.length];
    if(!shot||typeof shot!=='object'){status('Each requested shot must be a JSON object.','error');return}
    const fallbackShot=fallback.segments[index%fallback.segments.length];
    let mediaIndex=Number.isInteger(shot.mediaIndex)?clamp(shot.mediaIndex,0,state.media.length-1):state.media.findIndex(m=>m.id===fallbackShot.mediaId);
    if(mediaIndex<0)mediaIndex=0;
    let selected=state.media[mediaIndex];
    const prev=segments[segments.length-1];
    if($('avoidRepeats').checked&&prev?.mediaId===selected.id&&state.media.length>1)
      selected=state.media[(mediaIndex+1)%state.media.length];
    const requestedBeats=Number(shot.beats);
    const count=clamp(Number.isFinite(requestedBeats)?requestedBeats:4,.5,12);
    let end=Math.min(length,start+Math.max(.23,count*beat));
    if(length-end<.2)end=length;
    let effect=EFFECTS.includes(shot.effect)?shot.effect:fallbackShot.effect;
    let motion=MOTIONS.includes(shot.motion)?shot.motion:fallbackShot.motion;
    let transition=index===0?'cut':TRANSITIONS.includes(shot.transition)?shot.transition:fallbackShot.transition;
    if($('avoidRepeats').checked&&prev){
      if(effect===prev.effect)effect=EFFECTS[(EFFECTS.indexOf(effect)+1)%EFFECTS.length];
      if(motion===prev.motion)motion=MOTIONS[(MOTIONS.indexOf(motion)+1)%MOTIONS.length];
      if(transition===prev.transition)transition=TRANSITIONS[(TRANSITIONS.indexOf(transition)+1)%TRANSITIONS.length];
    }
    segments.push({...fallbackShot,id:'s'+index,start:Number(start.toFixed(5)),end:Number(end.toFixed(5)),
      mediaId:selected.id,effect,motion,transition,sourceOffset:0,
      speed:clamp(Number(shot.speed)||fallbackShot.speed,.5,2)});
    start=end;index++;
  }
  if(segments.length)segments[segments.length-1].end=length;
  const plan={segments,duration:length,style:state.style,director:'ChatGPT-directed variation: '+String(obj.note||'Unique shot pattern').slice(0,220)};
  if(!assertContinuous(plan)){status('ChatGPT scene plan has a timing gap.','error');return}
  state.plan=plan;updateTimeline();$('emptyPreview').hidden=true;syncSummary();seek(0);
  $('directorOutput').textContent='✦ '+plan.director+' · '+segments.length+' varied scenes · exact project duration '+length.toFixed(3)+' seconds.';
  status('ChatGPT edit decisions applied. Every shot gets a varied look & the soundtrack timing stays fixed.','ok');
}
$('copyGPTBrief').addEventListener('click',chatGPTBrief);
$('applyGPTPlan').addEventListener('click',applyChatGPTPlan);
$('downloadEdl').addEventListener('click',savePlan);
audio.addEventListener('ended',()=>{if(!audio.loop){stopPreview();seek(duration())}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)stopPreview()});
window.addEventListener('beforeunload',()=>{state.media.forEach(x=>URL.revokeObjectURL(x.url));if(state.audioUrl)URL.revokeObjectURL(state.audioUrl)});
resizeCanvas();drawWave();syncLengthsSafe();status('Ready when your clips are.');
