/* GrooveLab v7 — adult-proportioned fashion sprites and an uncluttered dance floor.
   Original vector artwork; no external asset requests or paid dependencies. */
(()=>{
'use strict';

function maleSprite(a){
 const skin=a.skin||'#e3cabc',hair=a.hairColor||'#211c25',top=a.top||'#2d2735',pants=a.pants||'#18171f';
 const spike=a.preset==='spike',prince=a.preset==='darkprince',E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const id=String(a.id||a.preset||'male').replace(/[^A-Za-z0-9]/g,'').slice(0,23);
 const coat=spike?'#201d22':prince?'#211626':'#17131d';
 const eye=a.eyeColor||(spike?'#92bcd6':'#977765');
 const shirt=spike?'#f5ede6':prince?'#272031':'#0d0d15';
 const gild=prince?'#9f7b92':spike?'#99969e':'#b8acb7';
 const hairshape=spike?
 '<path d="M54 47L51 32L63 35L68 19L78 30L85 15L94 32L106 23L111 39L118 39L111 53Q91 41 80 45Q64 43 54 47Z" fill="url(#hair-'+id+')" stroke="#a9a08a" stroke-width="1.5"/><path d="M62 34L70 43M87 26L89 41M106 34L99 43" stroke="#fff4d8" stroke-width="2.2"/>':
 '<path d="M55 49Q43 23 65 21Q98 12 112 32L114 52L102 42L85 36L68 40Z" fill="url(#hair-'+id+')" stroke="#281c29" stroke-width="1.3"/><path d="M70 30Q85 24 105 36" fill="none" stroke="#ad9eaa" opacity=".55" stroke-width="2"/><path d="M102 32Q96 41 84 49L94 47" fill="'+hair+'"/>';
 const neckline='<path d="M69 107L69 120Q81 129 93 120L93 107" fill="'+skin+'"/>';
 const visage='<path d="M56 58Q53 43 67 41L98 40Q109 47 108 62L104 90Q101 101 85 109L78 109Q63 102 58 91Z" fill="'+skin+'" stroke="#a37c81" stroke-width="1.4"/>'+
 '<path d="M62 68Q68 64 75 68M88 68Q97 63 102 68" stroke="#241c25" stroke-width="3.2" stroke-linecap="round" fill="none"/>'+
 '<path d="M64 76Q70 73 76 75M89 75Q96 72 102 76" stroke="#18121d" stroke-width="2.3" stroke-linecap="round" fill="none"/>'+
 '<ellipse cx="70" cy="75" rx="2.7" ry="2.6" fill="'+eye+'"/><ellipse cx="96" cy="75" rx="2.7" ry="2.6" fill="'+eye+'"/>'+
 '<path d="M81 76L79 89L85 91M75 100Q83 104 92 98" fill="none" stroke="#a8787c" stroke-width="1.8"/>'+
 '<path d="M58 88Q63 100 77 107M104 88Q102 100 88 107" fill="none" stroke="#906e74" opacity=".47" stroke-width="1.5"/>';
 const torso='<path d="M55 116Q81 106 106 116L108 175L52 175Z" fill="'+coat+'" stroke="#171017" stroke-width="2"/>'+
 '<path d="M74 124L81 164L89 124L91 177L73 177Z" fill="'+shirt+'"/>'+
 '<path d="M56 117L68 132L81 162L91 134L104 116L97 113L82 146L66 113Z" fill="'+gild+'" stroke="#201620" stroke-width="1.2"/>'+
 '<path d="M54 131L68 174L63 249L45 245L52 184Z" fill="url(#coat-'+id+')" stroke="#958497" stroke-width="1.4"/>'+
 '<path d="M104 131L91 174L99 249L116 243L108 183Z" fill="url(#coat-'+id+')" stroke="#958497" stroke-width="1.4"/>'+
 '<path d="M79 164L79 241" stroke="#8e7b8e" stroke-width="1.4"/><circle cx="80" cy="187" r="2.2" fill="#e0d1df"/><circle cx="80" cy="214" r="2.2" fill="#e0d1df"/>'+
 '<path d="M50 234L63 228M100 229L114 236" stroke="#c7b0cc" stroke-width="1.6" opacity=".52"/>'+
 (prince?'<path d="M54 120L67 140M106 120L95 139" stroke="#c24a71" stroke-width="2"/>':spike?'<path d="M54 123L66 144" stroke="#ada9b1" stroke-width="1.5"/>':'');
 const crown=prince?'<path d="M61 29L58 10L72 20L81 7L93 20L109 10L107 29Z" fill="#42313f" stroke="#b9a6b6" stroke-width="1.8"/><circle cx="81" cy="21" r="2.3" fill="#e65592"/>':'';
 return '<svg class="avatar-sprite avatar-adult avatar-male" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+E(a.name||a.preset)+' rigged dancer" viewBox="0 0 160 320"><defs>'+
 '<linearGradient id="hair-'+id+'" x2="1" y2="1"><stop stop-color="'+(spike?'#d6c7ac':'#0e0b13')+'"/><stop offset=".5" stop-color="'+hair+'"/><stop offset="1" stop-color="'+(spike?'#e7d9bb':'#241d29')+'"/></linearGradient>'+
 '<linearGradient id="coat-'+id+'" x2="1" y2="1"><stop stop-color="'+top+'"/><stop offset=".6" stop-color="'+coat+'"/><stop offset="1" stop-color="#111017"/></linearGradient></defs>'+
 '<ellipse cx="80" cy="308" rx="33" ry="4" fill="#000" opacity=".35"/>'+
 '<g class="sprite-leg-left"><path d="M61 174L79 177L72 245L56 245Z" fill="'+pants+'" stroke="#544754" stroke-width="1.4"/><g class="sprite-shin-left"><path d="M56 243L72 243L70 291L49 291Z" fill="'+pants+'"/><path d="M49 285L71 288L71 302L38 303Q36 300 45 296Z" fill="#13121b" stroke="#8d7b87" stroke-width="1.5"/></g></g>'+
 '<g class="sprite-leg-right"><path d="M81 177L102 174L106 245L90 245Z" fill="'+pants+'" stroke="#544754" stroke-width="1.4"/><g class="sprite-shin-right"><path d="M90 243L105 242L112 292L91 292Z" fill="'+pants+'"/><path d="M89 286L111 286L122 301L120 303L88 303Z" fill="#13121b" stroke="#8d7b87" stroke-width="1.5"/></g></g>'+
 '<g class="sprite-arm-left"><path d="M57 119Q47 125 43 155" fill="none" stroke="'+coat+'" stroke-width="19" stroke-linecap="round"/><g class="sprite-forearm-left"><path d="M43 155L34 191" stroke="'+coat+'" fill="none" stroke-width="15" stroke-linecap="round"/><path d="M35 185L30 197" stroke="'+skin+'" fill="none" stroke-width="9" stroke-linecap="round"/></g></g>'+
 '<g class="sprite-arm-right"><path d="M104 119Q116 128 117 155" fill="none" stroke="'+coat+'" stroke-width="19" stroke-linecap="round"/><g class="sprite-forearm-right"><path d="M117 155L126 191" fill="none" stroke="'+coat+'" stroke-width="15" stroke-linecap="round"/><path d="M126 185L131 197" stroke="'+skin+'" fill="none" stroke-width="9" stroke-linecap="round"/></g></g>'+
 '<g class="sprite-torso">'+torso+'</g><g class="sprite-head">'+neckline+visage+hairshape+crown+'</g></svg>';
}
window.GrooveSprite = function(a){
 if(["angelus","spike","darkprince"].includes(a.preset))return maleSprite(a);
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const skin=a.skin||'#efcfbb',hair=a.hairColor||'#eeeeff',top=a.top||'#ac3474',
 pants=a.pants||'#1b1723',eye=a.eyeColor||'#8cc5f9',mode=a.outfit||'corset';
 const masculine=['angelus','spike','darkprince'].includes(a.preset)||a.build==='tall',
 coat=mode==='leather'||masculine,formal=['raven','crimson','royal'].includes(mode),
 skirt=!coat,plaid=mode==='punkplaid',pink=mode==='pinkpop',longhair=['waves','fringe','long'].includes(a.hair),
 id=esc(String(a.id||a.preset||'p').replace(/[^a-zA-Z0-9]/g,'').slice(0,22));
 const dark=a.streaks?'#18131f':hair;
 const wing=(a.accessory==='wings'||mode==='raven')?'<path d="M65 121Q32 74 13 56Q26 116 56 172L65 154M95 121Q128 74 147 56Q134 116 104 172L95 154" fill="#17101f" stroke="#564467" stroke-width="2"/>':'';
 const hairback=longhair?'<path d="M53 42Q37 65 35 99Q31 143 38 192Q24 227 39 246Q65 238 65 197L95 200Q110 246 124 241Q134 210 116 187Q123 131 114 72Q108 27 83 24Z" fill="url(#h-'+id+')" stroke="#241b2d" stroke-width="1.4"/><path d="M43 60Q35 155 43 213M114 63Q122 153 112 221" stroke="'+dark+'" stroke-width="8" fill="none" opacity=".82"/>':
 a.hair==='bun'?'<circle cx="48" cy="32" r="18" fill="'+hair+'"/><circle cx="113" cy="32" r="18" fill="'+hair+'"/>':'';
 const boot='<path d="M59 275L72 275L72 294Q68 304 51 303L43 297L46 290L58 288Z" fill="#16131c" stroke="#726075" stroke-width="1.6"/><path d="M88 275L102 275L111 292Q122 296 117 303L91 303L88 291Z" fill="#16131c" stroke="#726075" stroke-width="1.6"/>';
 const footwear='<path d="M48 299L72 299M91 299L117 299" stroke="#d0a9cd" opacity=".55" stroke-width="1.7"/>';
 const clothes=coat?'<path d="M55 116Q80 107 106 116L112 240L93 246L86 172L75 173L65 245L43 240Z" fill="url(#coat-'+id+')" stroke="#8b7996" stroke-width="1.8"/><path d="M57 119L75 157L81 119L87 157L104 119M80 154L79 228" stroke="#d2b9d5" stroke-width="2" fill="none"/><path d="M68 132L79 173L91 132" stroke="#17121f" stroke-width="7" fill="none"/><circle cx="79" cy="177" r="2.5" fill="#eee1e4"/><path d="M51 230L64 219M96 219L110 231" stroke="#b7a5bc" opacity=".7" stroke-width="2"/>':
 '<path d="M55 113Q80 108 106 113L100 175L60 175Z" fill="url(#top-'+id+')" stroke="#291525" stroke-width="2"/><path d="M60 118Q68 112 80 123Q92 111 103 118L99 134L60 134Z" fill="#220f25" opacity=".9"/><path d="M65 137L69 164L93 164L98 137" stroke="#c9a1c0" stroke-width="2" fill="none"/><path d="M74 140L87 150L74 159M87 140L74 150L87 159" stroke="#e6a9d3" stroke-width="1.6" fill="none"/><path d="M62 175L98 175L111 '+(formal?'293':'203')+'L49 '+(formal?'293':'203')+'Z" fill="url(#skirt-'+id+')" stroke="#231423" stroke-width="2"/>'+
 (plaid?'<path d="M54 183L106 183M53 190L107 190M62 178L57 201M81 178L81 204M98 178L105 201" stroke="#2a1726" stroke-width="3" opacity=".82"/>':'')+
 (formal?'<path d="M64 189L51 287M91 189L108 288" stroke="#f0aaca" opacity=".25" stroke-width="3"/>':'');
 const face=masculine?
 '<path d="M61 62Q69 57 75 62M86 62Q94 57 100 62" stroke="#271824" stroke-width="3" fill="none"/><path d="M66 74L73 74M90 74L97 74" stroke="#19151f" stroke-width="2.4" stroke-linecap="round"/><path d="M78 92L82 94L85 92M75 102Q82 105 90 102" fill="none" stroke="#9e6a72" stroke-width="1.8"/>':
 '<path d="M60 66Q66 60 75 65M87 65Q95 60 102 66" stroke="#342132" stroke-width="2.9" fill="none"/><path d="M62 74Q69 68 76 75Q69 80 62 74M86 75Q94 68 102 74Q94 80 86 75" fill="#faf5fb" stroke="#251427" stroke-width="2.2"/><ellipse cx="69" cy="74" rx="4" ry="4.4" fill="'+eye+'"/><ellipse cx="94" cy="74" rx="4" ry="4.4" fill="'+eye+'"/><circle cx="70" cy="73" r="1.6" fill="#131026"/><circle cx="95" cy="73" r="1.6" fill="#131026"/><path d="M80 87L83 89L86 87M73 101Q80 96 91 101Q82 109 73 101" fill="none" stroke="#bf678e" stroke-width="2.5"/><ellipse cx="61" cy="90" rx="8" ry="4" fill="#e38eae" opacity=".3"/><ellipse cx="100" cy="90" rx="8" ry="4" fill="#e38eae" opacity=".3"/>';
 const frontal=a.hair==='mohawk'?'<path d="M58 47L52 15L69 28L79 6L90 27L109 14L103 48Z" fill="'+hair+'" stroke="#241a2e" stroke-width="1.6"/>':
 a.hair==='fringe'?'<path d="M58 45Q70 17 90 29Q105 28 105 53L93 45L78 67L75 43L60 59Z" fill="url(#h-'+id+')" stroke="#554156" stroke-width="1"/>':
 '<path d="M57 48Q66 21 91 29L105 47L93 44L81 50L60 53Z" fill="url(#h-'+id+')" stroke="#554156" stroke-width=".7"/>';
 const icon=a.accessory==='crown'?'<path d="M61 30L57 13L71 23L81 8L94 23L109 13L105 32Z" fill="#645071" stroke="#e7bddb" stroke-width="1.8"/><circle cx="81" cy="23" r="3" fill="#fa64b6"/>':
 a.accessory==='headphones'?'<path d="M56 64Q50 18 82 18Q115 18 107 64" fill="none" stroke="#211829" stroke-width="9"/><path d="M56 56L56 71M107 56L107 71" stroke="#c965ba" stroke-width="10" stroke-linecap="round"/>':'';
 const choker=(!coat&&a.accessory!=='none')?'<path d="M72 109L90 109" stroke="#1d1220" stroke-width="6"/><circle cx="81" cy="111" r="3" fill="#d8b2cd"/>':'';
 return '<svg xmlns="http://www.w3.org/2000/svg" class="avatar-sprite avatar-adult" role="img" aria-label="'+esc(a.name)+' fashion sprite" viewBox="0 0 160 320"><defs>'+
 '<linearGradient id="h-'+id+'" x2="1" y2=".3"><stop stop-color="'+dark+'"/><stop offset=".3" stop-color="'+hair+'"/><stop offset=".7" stop-color="'+hair+'"/><stop offset="1" stop-color="'+dark+'"/></linearGradient>'+
 '<linearGradient id="coat-'+id+'" x2="1" y2="1"><stop stop-color="'+top+'"/><stop offset=".5" stop-color="#19141d"/><stop offset="1" stop-color="#100d16"/></linearGradient>'+
 '<linearGradient id="top-'+id+'" x2="1" y2=".7"><stop stop-color="'+top+'"/><stop offset="1" stop-color="#2b142a"/></linearGradient>'+
 '<linearGradient id="skirt-'+id+'" x2=".8" y2="1"><stop stop-color="'+top+'"/><stop offset=".95" stop-color="'+pants+'"/></linearGradient></defs>'+
 '<ellipse cx="80" cy="310" rx="38" ry="4.5" fill="#000" opacity=".34"/><g class="sprite-wings">'+wing+'</g><g class="sprite-hair-back">'+hairback+'</g>'+
 '<g class="sprite-leg-left"><path d="M62 174L80 177L73 246L68 278L53 278L50 244Z" fill="'+(coat?pants:skin)+'" stroke="#765663" stroke-width=".9"/><g class="sprite-shin-left"><path d="M53 242L71 245L69 288L49 288Z" fill="#1c1723" stroke="#4a3c55"/>'+boot.slice(0,boot.indexOf('<path d="M88'))+'</g></g>'+
 '<g class="sprite-leg-right"><path d="M81 177L99 174L110 244L102 278L87 278L86 245Z" fill="'+(coat?pants:skin)+'" stroke="#765663" stroke-width=".9"/><g class="sprite-shin-right"><path d="M88 243L106 241L109 289L87 288Z" fill="#1c1723" stroke="#4a3c55"/>'+boot.slice(boot.indexOf('<path d="M88'))+'</g></g>'+
 '<g class="sprite-arm-left"><path d="M56 116Q47 127 45 154" stroke="'+(coat?top:skin)+'" stroke-width="15" stroke-linecap="round" fill="none"/><g class="sprite-forearm-left"><path d="M45 154L35 196" stroke="'+(coat?top:skin)+'" stroke-width="12" stroke-linecap="round"/><circle cx="35" cy="196" r="7" fill="'+skin+'"/></g></g>'+
 '<g class="sprite-arm-right"><path d="M104 116Q114 127 115 154" stroke="'+(coat?top:skin)+'" stroke-width="15" stroke-linecap="round" fill="none"/><g class="sprite-forearm-right"><path d="M115 154L125 196" stroke="'+(coat?top:skin)+'" stroke-width="12" stroke-linecap="round"/><circle cx="125" cy="196" r="7" fill="'+skin+'"/></g></g>'+
 '<g class="sprite-torso"><path d="M58 116Q80 105 102 116L101 176L60 176Z" fill="'+(coat?pants:skin)+'"/>'+clothes+choker+'</g>'+
 '<g class="sprite-head"><path d="M74 106L74 113Q82 120 89 113L89 105" fill="'+skin+'"/><path d="M56 59Q56 32 81 32Q107 32 107 59L104 92Q97 108 81 110Q65 108 59 92Z" fill="'+skin+'" stroke="#987781" stroke-width="1"/>'+face+frontal+icon+'</g>'+
 (longhair?'<path d="M53 47Q45 129 43 203M109 47Q121 132 116 206" fill="none" stroke="'+hair+'" stroke-width="9" opacity=".92"/>':'')+
 footwear+'</svg>';
};
document.addEventListener('DOMContentLoaded',()=>{if(document.getElementById('danceStage'))return;
 const root=document.getElementById('avatars'),crew=document.getElementById('floatingCrew'),preview=document.getElementById('avatarPreview');
 if(!root||!crew||!preview)return;
 const card=preview.closest('.card');if(!card)return;
 const floor=document.createElement('div');floor.id='danceFloor';floor.className='dance-floor';
 floor.innerHTML='<div class="dance-floor-head"><span>✦ LIVE DANCE FLOOR</span><small>Characters stay inside this stage while editing</small></div><div class="dance-floor-empty">Add a dancer, then tap Silent Dance Preview.<br>Drag your characters around this stage.</div>';
 card.insertBefore(floor,preview);
 const dock=document.createElement('div');dock.id='danceDock';dock.style.display='none';document.body.append(dock);
 const buttons=document.querySelector('#danceNow');if(buttons)buttons.textContent='Characters move inside the preview stage.';
 const renderMode=document.getElementById('renderMode');if(renderMode){const option=renderMode.querySelector('option[value="3d"]');if(option)option.textContent='◈ 3D — experimental low-poly preview';}
 const labels=document.querySelectorAll('.avatar-form .form-group label');for(const x of labels){if(x.textContent.trim()==='Hair style')x.textContent='Hair style';}
 const sync=()=>{
  const stageActive=!root.classList.contains('hidden-section');
  if(stageActive){if(crew.parentElement!==floor)floor.appendChild(crew);crew.classList.add('on-stage');}
  else {if(crew.parentElement!==document.body)document.body.appendChild(crew);crew.classList.remove('on-stage');}
  const stored=(()=>{try{return JSON.parse(localStorage.getItem('groovelab_crew')||'[]')}catch(e){return[]}})();
  crew.querySelectorAll('.avatar-float').forEach(el=>{
   const data=stored.find(x=>String(x.id)===String(el.dataset.id));
   if(!data)return;
   const x=Math.max(0,Math.min(79,Number(data.x)||15)),y=Math.max(0,Math.min(75,Number(data.y)||15));
   el.style.left=x+(stageActive?'%':'vw');el.style.top=y+(stageActive?'%':'vh');
  });
  floor.classList.toggle('has-crew',crew.querySelectorAll('.avatar-float').length>0);
 };
 const nav=new MutationObserver(sync);nav.observe(root,{attributes:true,attributeFilter:['class']});
 const crewObserver=new MutationObserver(()=>{const old=floor.classList.contains('has-crew');const now=!!crew.querySelector('.avatar-float');if(old!==now)floor.classList.toggle('has-crew',now);});crewObserver.observe(crew,{childList:true});
 sync();
});
})();