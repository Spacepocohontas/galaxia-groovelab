/* Local audio/footage inspection: colors, brightness, scene changes, pulse energy.
   No object recognition or lyric transcription. The user can provide lyrics. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const moodWords={
  heartbreak:/heartbreak|goodbye|miss you|broken|cry|alone|lost|tears|betray|empty|never|gone|regret/gi,
  romance:/love|kiss|heart|touch|hold|baby|darling|desire|forever|together|closer|want you/gi,
  dark:/dark|demon|ghost|death|monster|poison|shadow|sin|hell|grave|blood|night|evil/gi,
  defiance:/fight|run|rage|burn|revenge|war|enemy|rebel|destroy|queen|control|power/gi,
  hope:/rise|shine|tomorrow|hope|heal|dream|sky|free|alive|future|light|better/gi
};
export function lyricMood(input=''){
  const text=String(input||'').slice(0,16000);
  const scores=Object.entries(moodWords).map(([name,pattern])=>({name,count:(text.match(pattern)||[]).length}));
  scores.sort((a,b)=>b.count-a.count);
  return scores[0].count ? {mood:scores[0].name,confidence:'lyric keyword hint',top:scores.slice(0,3)} : {mood:'undetermined',confidence:'no lyric evidence',top:[]};
}
export function analyzeSound(analysis){
  if(!analysis?.amplitude?.length)return null;
  const a=analysis.amplitude,total=Number(analysis.duration)||1;
  const span=Math.max(1,Math.floor(a.length/8));
  const chunks=[];
  let max=0;
  for(let i=0;i<8;i++){
    const p=a.slice(i*span,(i===7?a.length:(i+1)*span));
    const avg=p.reduce((sum,v)=>sum+v,0)/Math.max(1,p.length);
    max=Math.max(avg,max);
    chunks.push({from:Number((i*total/8).toFixed(2)),to:Number(((i+1)*total/8).toFixed(2)),energy:avg});
  }
  const global=chunks.reduce((sum,c)=>sum+c.energy,0)/chunks.length || .00001;
  const sections=chunks.map(c=>({...c,energy:Number((c.energy/global).toFixed(2)),level:c.energy/global>1.35?'high':c.energy/global<.68?'low':'medium'}));
  const drops=sections.filter((c,i)=>i>0&&c.energy>1.2&&c.energy>sections[i-1].energy*1.35).map(c=>c.from);
  return {bpm:analysis.bpm,duration:total,confidence:analysis.confidence,sections,drops,energyRange:max/global,
    transientCount:analysis.transients?.length||0};
}
function getSample(image,w=96,h=64){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  try{ctx.drawImage(image,0,0,w,h)}catch{return null}
  let data;try{data=ctx.getImageData(0,0,w,h).data}catch{return null}
  let r=0,g=0,b=0,sat=0,light=0;
  const thumb=[];
  for(let i=0;i<data.length;i+=16){
    const R=data[i]/255,G=data[i+1]/255,B=data[i+2]/255;
    r+=R;g+=G;b+=B;
    sat+=Math.max(R,G,B)-Math.min(R,G,B);
    light+=.2126*R+.7152*G+.0722*B;
  }
  const n=data.length/16;
  for(let y=4;y<h;y+=8)for(let x=4;x<w;x+=8){
    const i=(y*w+x)*4;thumb.push(Math.round((data[i]+data[i+1]+data[i+2])/3));
  }
  return {rgb:[r/n,g/n,b/n],saturation:sat/n,brightness:light/n,thumb};
}
function palette(rgb){
 const [r,g,b]=rgb;
 if(Math.max(r,g,b)-Math.min(r,g,b)<.07)return 'neutral';
 if(r>g*1.21&&r>b*1.1)return 'warm red/pink';
 if(b>r*1.18&&b>g*1.08)return 'blue/cool';
 if(g>r*1.15&&g>b*1.08)return 'green';
 if(r>b*1.09&&g>b*1.09)return 'amber/gold';
 if(b>g*1.08&&r>g*1.08)return 'purple/magenta';
 return 'mixed color';
}
function motionScore(a,b){
 if(!a?.thumb||!b?.thumb)return 0;
 let sum=0;for(let i=0;i<Math.min(a.thumb.length,b.thumb.length);i++)sum+=Math.abs(a.thumb[i]-b.thumb[i]);
 return sum/Math.min(a.thumb.length,b.thumb.length)/255;
}
function waitVideo(video,event,timeout=4200){
 return new Promise((resolve,reject)=>{
  let ended=false;
  const finish=(e,err)=>{if(ended)return;ended=true;clearTimeout(timer);video.removeEventListener(event,done);video.removeEventListener('error',fail);err?reject(err):resolve(e)};
  const done=e=>finish(e),fail=e=>finish(e,Error('Cannot decode video frame'));
  const timer=setTimeout(()=>finish(null,Error('Video decode timed out')),timeout);
  video.addEventListener(event,done,{once:true});video.addEventListener('error',fail,{once:true});
 });
}
export async function sampleFootage(media,onProgress=()=>{},limit=12){
 const clips=media.slice(0,limit),out=[];
 for(let i=0;i<clips.length;i++){
  const item=clips[i];onProgress(i,clips.length,item.name);
  const result={id:item.id,name:item.name,kind:item.kind,duration:item.duration||0,brightness:0,saturation:0,palette:'undetermined',motion:0,samples:0};
  try{
   const samples=[];
   if(item.kind==='image'){const frame=getSample(item.el);if(frame)samples.push(frame)}
   else{
    const vid=document.createElement('video');vid.src=item.url;vid.muted=true;vid.playsInline=true;vid.preload='auto';
    try{
      if(vid.readyState<1)await waitVideo(vid,'loadedmetadata',4500);
      const dur=Number.isFinite(vid.duration)?vid.duration:0;
      for(const fraction of [.08,.45,.82]){
        if(dur<.12)break;
        const target=clamp(dur*fraction,.01,Math.max(.01,dur-.08));
        const seekWait=waitVideo(vid,'seeked',5000);
        vid.currentTime=target;await seekWait;
        if(vid.readyState<2)await waitVideo(vid,'loadeddata',3500).catch(()=>{});
        const frame=getSample(vid);if(frame)samples.push(frame);
      }
    }finally{vid.pause();vid.removeAttribute('src');vid.load()}
   }
   if(samples.length){
    const avg=[0,0,0];for(const frame of samples)for(let j=0;j<3;j++)avg[j]+=frame.rgb[j]/samples.length;
    result.brightness=Number((samples.reduce((v,x)=>v+x.brightness,0)/samples.length).toFixed(2));
    result.saturation=Number((samples.reduce((v,x)=>v+x.saturation,0)/samples.length).toFixed(2));
    result.palette=palette(avg);
    result.motion=Number((samples.slice(1).reduce((sum,x,k)=>sum+motionScore(samples[k],x),0)/Math.max(1,samples.length-1)).toFixed(2));
    result.samples=samples.length;
   }
  }catch(error){result.warning=String(error.message||error)}
  out.push(result);
 }
 return out;
}
export function suggestMusicVideo({audio,footage=[],lyrics='',title='',style='Bass Impact'}){
 if(!audio)throw Error('Analyze a loaded song first');
 const words=lyricMood(lyrics);
 const paletteCounts={};for(const clip of footage)paletteCounts[clip.palette]=(paletteCounts[clip.palette]||0)+1;
 const dominant=Object.keys(paletteCounts).sort((a,b)=>paletteCounts[b]-paletteCounts[a])[0]||'mixed';
 const avgBrightness=footage.reduce((sum,v)=>sum+v.brightness,0)/Math.max(1,footage.length);
 const avgMotion=footage.reduce((sum,v)=>sum+v.motion,0)/Math.max(1,footage.length);
 const visual=avgBrightness<.34?'low-key shadows':avgBrightness>.68?'bright scenes':'balanced light and shade';
 const movement=avgMotion>.22?'kinetic action':avgMotion>.10?'moderate camera motion':'mostly calm or still footage';
 const mood=words.mood==='undetermined'?'let the supplied lyrics guide the narrative':words.mood+' narrative';
 const intensity=audio.sections.filter(x=>x.level==='high').length;
 const pace=intensity>=3?'faster cuts in the most energetic phrases':'balanced cuts with breathing space between musical drops';
 const prompts=[
  'Cinematic narrative: '+mood+', '+dominant+' tones, '+visual+'; build a story with changing shots and dramatic chorus payoffs.',
  'Beat-driven viral montage: punch zooms, whip pans, smash cuts, multiple FX combinations; emphasize '+(audio.drops.length?audio.drops.length+' detected energy lifts':'the musical changes')+'.',
  'Dreamlike surreal edit: mirrored fragments, subtle double exposure, dreamy transitions, visual echoes and rhythmic color pulses.',
  'Dark post-punk alternate: grain, VHS textures, cinematic shadows, aggressive bass-hit cuts and a wide closing scene.',
  'Minimal modern music video: clean edits, deliberate colors, intimate framing, changing motion and restrained FX on quiet sections.'
 ];
 const name=String(title||'untitled soundtrack').slice(0,180);
 const shotNotes=footage.map((c,i)=>'Clip '+i+': "'+c.name+'" ('+c.kind+', '+c.duration.toFixed(1)+'s; '+c.palette+'; brightness '+c.brightness+'; motion '+c.motion+')').join('\n');
 const sections=audio.sections.map(c=>c.from+'-'+c.to+'s '+c.level+' energy').join(' | ');
 const prompt=[
 'CREATE A MUSIC VIDEO EDIT FOR: '+name,
 'MASTER AUDIO: '+audio.duration.toFixed(3)+' seconds, estimated '+audio.bpm+' BPM ('+audio.confidence+' confidence). The song running time NEVER changes. Video edits, transitions, and loops fit the audio.',
 'MUSIC ENERGY MAP: '+sections,
 'POSSIBLE ENERGY-LIFT LOCATIONS: '+(audio.drops.length?audio.drops.join(', ')+' seconds':'none confidently identified'),
 'SONG STORY/MOOD: '+mood+'. '+(lyrics.trim()?'USER-PROVIDED LYRICS:\n'+lyrics.slice(0,5000):'No lyrics supplied: do not invent specific words or meaning.'),
 'VISUAL CHARACTER: '+visual+'; '+dominant+' palette; '+movement+'.',
 'FOOTAGE ASSETS:\n'+shotNotes,
 'DESIRED TEMPLATE: '+style+'. '+pace+'.',
 'EDIT DIRECTIONS:',
 '- Make consecutive shots visually distinct in footage, effect, movement and transition, while keeping coherent style.',
 '- Suggest verse/chorus/bridge contrasts using the measured energy map without inventing song sections.',
 '- Align cuts with measured BPM and energy changes; use a few exciting combined effects rather than constant random noise.',
 '- Add simulated lip motion only when faces are detected; do NOT claim phoneme-accurate singing.',
 '- Prefer vertical 9:16, optional wide or square.',
 '- Output a JSON shot list with mediaIndex, beats, effect, transition, motion, and speed, plus artistic rationale.',
 '- Preserve the original uploaded audio exact duration; never time-stretch or pitch-shift it.',
 'This is local pixel color/motion + audio analysis; no semantic object recognition or auto lyric transcription. Do not hallucinate subjects or actions.'
 ].join('\n\n');
 return {summary:{track:name,bpm:audio.bpm,duration:audio.duration,mood,dominant,visual,movement,pace,footage:footage.length},prompts,prompt};
}
