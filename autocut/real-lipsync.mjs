/* Real (generative) lip-sync workflow.
   Unlike landmark warping, this calls an audio-conditioned video model.
   Neither API key nor media is stored on this website; credits require an explicit Generate click. */
const $=id=>document.getElementById(id);
const KEY_STORAGE='galaxia-sync-labs-key-session';
const JOB_STORAGE='galaxia-sync-labs-job-session';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mimeFor=file=>file.type||(/\.mov$/i.test(file.name)?'video/quicktime':/\.mp3$/i.test(file.name)?'audio/mpeg':/\.wav$/i.test(file.name)?'audio/wav':'video/mp4');

function wavSlice(buffer,startSeconds,seconds){
  const sr=buffer.sampleRate;
  const first=Math.max(0,Math.floor(startSeconds*sr));
  const count=Math.max(1,Math.min(Math.floor(seconds*sr),buffer.length-first));
  const channels=Math.min(2,buffer.numberOfChannels);
  const bytes=44+count*channels*2;
  const arr=new ArrayBuffer(bytes),view=new DataView(arr);
  let p=0;
  const str=s=>{for(const c of s)view.setUint8(p++,c.charCodeAt(0))};
  const u32=x=>{view.setUint32(p,x,true);p+=4};
  const u16=x=>{view.setUint16(p,x,true);p+=2};
  str('RIFF');u32(bytes-8);str('WAVE');str('fmt ');u32(16);u16(1);u16(channels);u32(sr);u32(sr*channels*2);u16(channels*2);u16(16);
  str('data');u32(count*channels*2);
  const samples=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));
  for(let i=0;i<count;i++){
    for(let c=0;c<channels;c++){
      const x=clamp(samples[c][first+i],-1,1);
      view.setInt16(p,x<0?x*32768:x*32767,true);p+=2;
    }
  }
  return new Blob([arr],{type:'audio/wav'});
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function setupRealLipSync({getMedia,getAudioBuffer,getAudioFile,importMedia,appStatus}){
  const state={estimated:false,price:null,busy:false,jobId:null,outputUrl:null,assetCache:new WeakMap(),jobContext:null,estimateSource:null};
  let vocalBuffer=null,vocalFile=null;
  try{$('realLipKey').value=sessionStorage.getItem(KEY_STORAGE)||''}catch{}
  const note=(text,error=false)=>{
    $('realLipStatus').textContent=text;
    $('realLipStatus').classList.toggle('real-error',error);
  };
  const markDirty=()=>{
    state.estimated=false;state.price=null;state.jobContext=null;
    $('realLipPrice').textContent='Check the current model price before generating. No credits spent yet.';
    $('realLipConfirm').checked=false;
    $('realLipGo').disabled=true;
    $('realLipOutput').hidden=true;
  };
  const isOpen=()=>$('realLipToggle').checked;
  const refreshChoices=()=>{
    const el=$('realLipVideo'),chosen=el.value;
    el.replaceChildren(new Option('Choose uploaded footage…',''));
    for(const m of getMedia().filter(x=>x.kind==='video'&&x.file)){
      el.add(new Option(m.name+' ('+Math.round(m.duration*10)/10+'s)',m.id));
    }
    if([...el.options].some(o=>o.value===chosen))el.value=chosen;
    if(!el.value&&[...el.options].length===2)el.selectedIndex=1;
  };
  const getClip=()=>getMedia().find(x=>x.id===$('realLipVideo').value&&x.kind==='video'&&x.file);
  const getDuration=()=>{
    const b=$('realLipDriver').value==='vocals'?vocalBuffer:getAudioBuffer();
    if(!b)throw Error('Load the song, or add a vocal-only file.');
    const start=clamp(Number($('realLipStartAt').value)||0,0,Math.max(0,b.duration-.2));
    const wanted=Number($('realLipSeconds').value)||12;
    const max=$('realLipModel').value==='sync-3'?15:20;
    if(wanted>max)throw Error('Free-tier test limit: '+max+' seconds with this model. Reduce excerpt length.');
    if(wanted<1)throw Error('Choose at least one second of vocals.');
    const len=Math.min(wanted,b.duration-start);
    if(len<.5)throw Error('Not enough audio remains after that start time.');
    return {b,start,seconds:len};
  };
  async function api(action,body,key){
    const response=await fetch('/api/lipsync',{method:'POST',headers:{
      'Content-Type':'application/json','x-sync-key':key
    },body:JSON.stringify({action,...body}),cache:'no-store'});
    const json=await response.json().catch(()=>({error:'Invalid server response'}));
    if(!response.ok)throw Error(String(json.error||'Provider request failed'));
    return json;
  }
  function key(){
    const v=$('realLipKey').value.trim();
    if(!v||v.length<8)throw Error('Provide a Sync Labs API key, or use the no-key Sync Studio button above.');
    try{sessionStorage.setItem(KEY_STORAGE,v)}catch{}
    return v;
  }
  async function prepareAudio(){
    const {b,start,seconds}=getDuration();
    const file=new File([wavSlice(b,start,seconds)],'galaxia-vocals-'+Math.round(start*1000)+'-'+Math.round(seconds*1000)+'.wav',{type:'audio/wav'});
    return {file,start,seconds};
  }
  async function uploadFile(file,keyValue){
    if(state.assetCache.has(file))return state.assetCache.get(file);
    const type=mimeFor(file);
    const presigned=await api('presign',{fileName:file.name,contentType:type,size:file.size},keyValue);
    if(!presigned.uploadUrl||!presigned.url)throw Error('Sync Labs did not provide a valid upload location');
    const url=new URL(presigned.uploadUrl);
    if(url.protocol!=='https:')throw Error('Unsafe upload destination');
    note('Uploading '+file.name+' directly to Sync Labs…');
    const upload=await fetch(presigned.uploadUrl,{method:'PUT',headers:{'Content-Type':type},body:file});
    if(!upload.ok)throw Error('Media upload failed ('+upload.status+'). If a browser/CORS restriction blocks the transfer, use Sync Studio instead.');
    const asset=await api('register',{url:presigned.url,type:type.startsWith('video/')?'VIDEO':'AUDIO',name:file.name},keyValue);
    if(!asset.id)throw Error('Provider did not register the uploaded media');
    state.assetCache.set(file,asset.id);
    return asset.id;
  }
  async function estimate(){
    if(state.busy)return;
    try{
      const k=key();
      const source=getClip();if(!source)throw Error('Upload a singer/character video and choose it above.');
      const {seconds,start}=getDuration();
      state.busy=true;$('realLipEstimate').disabled=true;note('Checking provider price…');
      const model=$('realLipModel').value;
      const estimate=await api('estimate',{model,duration:seconds},k);
      const price=Number(estimate.estimatedGenerationCost);
      if(!Number.isFinite(price))throw Error('Provider did not return a valid price estimate.');
      state.price=price;state.estimated=true;
      state.estimateSource={video:source.id,model,seconds,start,driver:$('realLipDriver').value};
      $('realLipPrice').textContent='Model estimate: $'+price.toFixed(2)
        +(Number.isFinite(Number(estimate.estimatedCredits))?' / '+Number(estimate.estimatedCredits).toFixed(2)+' credits':'')
        +'. Free trial may cover it; the provider controls actual billing. '+seconds.toFixed(1)+'s total.';
      $('realLipGo').disabled=!$('realLipConfirm').checked;
      note('Estimate ready. Check the provider allowance and explicitly approve before generating.');
    }catch(e){state.estimated=false;$('realLipGo').disabled=true;note(e.message,true)}
    finally{state.busy=false;$('realLipEstimate').disabled=false}
  }
  async function pollGeneration(jobId,k){
    const limits=160;let attempts=0;
    while(attempts<limits){
      const result=await api('status',{id:jobId},k);
      const st=String(result.status||'').toUpperCase();
      if(st==='COMPLETED'){
        if(!result.outputUrl)throw Error('Render completed, but output link is missing');
        state.outputUrl=result.outputUrl;state.jobId=jobId;
        $('realLipVideoResult').src=result.outputUrl;
        $('realLipDownload').href=result.outputUrl;
        $('realLipOutput').hidden=false;
        $('realLipProgress').hidden=true;
        try{sessionStorage.removeItem(JOB_STORAGE)}catch{}
        note('Genuine AI lip-sync render ready. Download it or try importing it into AutoCut.');
        return;
      }
      if(st==='FAILED'||st==='REJECTED')throw Error(result.error||'Provider rejected this generation.');
      if(attempts++%3===0)note('Generating real mouth shapes… '+(attempts*4)+' seconds elapsed. Avoid starting a duplicate job.');
      $('realLipProgress').hidden=false;
      $('realLipProgress').value=(attempts%50)*2;
      await sleep(4000);
    }
    note('Still processing. The job ID is saved in this tab; reload and use the same key to check the result.');
  }
  async function generate(){
    if(state.busy)return;
    try{
      const k=key();
      const current=getDuration(),source=getClip();
      if(!source)throw Error('Choose the video to make sing.');
      if(!state.estimated||!$('realLipConfirm').checked||!state.estimateSource)throw Error('Check the cost and approve generation first.');
      const previous=state.estimateSource;
      if(previous.video!==source.id||previous.model!==$('realLipModel').value||
        previous.driver!==$('realLipDriver').value||Math.abs(previous.start-current.start)>.02||
        Math.abs(previous.seconds-current.seconds)>.02)throw Error('Settings changed. Get a new cost estimate.');
      state.busy=true;$('realLipGo').disabled=true;$('realLipEstimate').disabled=true;
      $('realLipOutput').hidden=true;
      const audio=await prepareAudio();
      const fingerprint=[source.id,$('realLipModel').value,audio.start,audio.seconds,
        $('realLipDriver').value,vocalFile?.name||'',vocalFile?.size||0,vocalFile?.lastModified||0].join(':');
      let retry=state.jobContext;
      if(!retry||retry.fingerprint!==fingerprint)
        retry={fingerprint,idempotencyKey:crypto.randomUUID(),videoAssetId:null,audioAssetId:null};
      state.jobContext=retry;
      // Keep the exact same asset references and idempotency key if a request timed out.
      note('Preparing face footage for AI generation…');
      if(!retry.videoAssetId)retry.videoAssetId=await uploadFile(source.file,k);
      if(!retry.audioAssetId)retry.audioAssetId=await uploadFile(audio.file,k);
      const videoAssetId=retry.videoAssetId,audioAssetId=retry.audioAssetId;
      note('Submitting to real lip-sync model. Credits may now be consumed.');
      const job=await api('generate',{
        model:$('realLipModel').value,videoAssetId,audioAssetId,
        idempotencyKey:retry.idempotencyKey
      },k);
      if(!job.id)throw Error('Model accepted a request without returning a job ID; do not submit a second generation.');
      state.jobId=job.id;
      try{sessionStorage.setItem(JOB_STORAGE,JSON.stringify({id:job.id}))}catch{}
      await pollGeneration(job.id,k);
      state.jobContext=null;
    }catch(e){note('Real lip-sync: '+e.message,true);$('realLipProgress').hidden=true}
    finally{state.busy=false;$('realLipEstimate').disabled=false;$('realLipGo').disabled=!state.estimated||!$('realLipConfirm').checked}
  }
  async function importOutput(){
    if(!state.outputUrl){note('No completed lip-sync output yet.',true);return}
    try{
      note('Fetching lip-sync result to add as video footage…');
      const response=await fetch(state.outputUrl,{mode:'cors'});
      if(!response.ok)throw Error('Provider file download failed');
      const blob=await response.blob();
      if(!blob.size)throw Error('Provider returned an empty video');
      const file=new File([blob],'GalaXia-AI-LipSync.mp4',{type:blob.type.startsWith('video/')?blob.type:'video/mp4'});
      await importMedia([file]);
      note('AI-lip-synced footage added to your media collection. Choose it in your video scenes; the original song stays locked.');
    }catch(e){
      note('Import blocked by provider or browser security. Use Download, then Add video & images. Your song stays intact.',true);
    }
  }
  async function loadVocals(file){
    vocalBuffer=null;vocalFile=file;
    if(!file)return;
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    try{vocalBuffer=await ctx.decodeAudioData(await file.arrayBuffer())}finally{await ctx.close()}
    note('Vocal-only driver loaded: '+file.name+' ('+vocalBuffer.duration.toFixed(1)+'s).');
  }
  const dirtyOn=['realLipVideo','realLipModel','realLipDriver','realLipStartAt','realLipSeconds'];
  for(const id of dirtyOn)$(id).addEventListener('change',()=>{
    markDirty();
    if(id==='realLipModel'&&$('realLipModel').value==='sync-3'){
      $('realLipSeconds').max='15';
      if(Number($('realLipSeconds').value)>15)$('realLipSeconds').value=15;
    }else if(id==='realLipModel')$('realLipSeconds').max='20';
  });
  $('realLipToggle').addEventListener('change',()=>{
    $('realLipDetails').hidden=!isOpen();
    if(isOpen())refreshChoices();
  });
  $('realLipVideo').addEventListener('focus',refreshChoices);
  $('realLipKey').addEventListener('change',markDirty);
  $('realLipClearKey').addEventListener('click',()=>{
    $('realLipKey').value='';try{sessionStorage.removeItem(KEY_STORAGE)}catch{}
    markDirty();note('Key cleared from this tab. Sync Studio remains available without a key.');
  });
  $('realLipVocals').addEventListener('change',async e=>{
    markDirty();
    try{await loadVocals(e.target.files?.[0])}catch(error){note('Unsupported vocal file: '+error.message,true)}
  });
  $('realLipEstimate').addEventListener('click',estimate);
  $('realLipConfirm').addEventListener('change',()=>{$('realLipGo').disabled=!state.estimated||!$('realLipConfirm').checked});
  $('realLipGo').addEventListener('click',generate);
  $('realLipImport').addEventListener('click',importOutput);
  // Do not restart a paid generation automatically after a reload.
  try{
    const last=JSON.parse(sessionStorage.getItem(JOB_STORAGE)||'null');
    if(last?.id)note('Previous render '+last.id+' may still be running. Reconnect with your key and use Sync Studio to check the result; do not generate again.');
  }catch{}
  return {refreshChoices};
}
