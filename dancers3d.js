/* GrooveLab procedural 3D avatars: zero external dependencies, runs offline. */
(function(){
'use strict';
const scenes=new WeakMap();
const PI=Math.PI;
const vertex=`attribute vec3 position; attribute vec3 normal; attribute vec3 color; varying vec3 vColor; varying vec3 vNorm; uniform float turn; void main(){float c=cos(turn),s=sin(turn);vec3 p=vec3(position.x*c+position.z*s,position.y,-position.x*s+position.z*c); vec3 n=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);float perspective=4.6/(4.6-p.z*.2);gl_Position=vec4(p.x*perspective/1.24,(p.y-1.68)*perspective/1.78,-p.z/4.,1.);vColor=color;vNorm=n;}`;
const fragment=`precision mediump float;varying vec3 vColor;varying vec3 vNorm;void main(){vec3 n=normalize(vNorm);vec3 light=normalize(vec3(-0.42,0.76,0.62));float diffuse=max(dot(n,light),0.);float bounce=.08*max(dot(n,normalize(vec3(.45,-.4,.9))),0.);float rim=pow(1.-max(dot(n,vec3(0.,0.,1.)),0.),3.)*.12;float intensity=.72+diffuse*.32+bounce+rim;vec3 lit=pow(max(vColor,vec3(.001)),vec3(.94))*intensity;gl_FragColor=vec4(min(lit,vec3(1.)),1.);}`;
function shader(gl,type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function mount(canvas){if(scenes.has(canvas))return scenes.get(canvas);let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false})||canvas.getContext('experimental-webgl');if(!gl)return null;const prog=gl.createProgram();gl.attachShader(prog,shader(gl,gl.VERTEX_SHADER,vertex));gl.attachShader(prog,shader(gl,gl.FRAGMENT_SHADER,fragment));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('No WebGL shader support');const scene={gl,prog,buffer:gl.createBuffer(),p:gl.getAttribLocation(prog,'position'),n:gl.getAttribLocation(prog,'normal'),c:gl.getAttribLocation(prog,'color'),turn:gl.getUniformLocation(prog,'turn')};gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);scenes.set(canvas,scene);return scene;}catch(e){console.warn('GrooveLab 3D unavailable:',e);return null;}}
function rgb(hex){let h=(hex||'#ffffff').replace('#','');if(!/^[a-f\d]{6}$/i.test(h))h='ffffff';return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];}
function shade(hex,f=1){return rgb(hex).map(v=>Math.max(0,Math.min(1,v*f)));}
function vecsub(a,b){return a.map((v,i)=>v-b[i]);}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}function norm(a){const l=Math.hypot(...a)||1;return a.map(v=>v/l);}
function body3d(a,clock=0,move='bounce',power=.4,pulse=0,beatClock=null,pose=null){const tri=[];const skin=a.skin||'#f2d8cf',hair=a.hairColor||'#f5f1ff',eye=a.eyeColor||'#80c9ff',coat=a.top||'#a94d94',pants=a.pants||'#242339',outfit=a.outfit||'corset';const male=['angelus','spike','darkprince'].includes(a.preset)||a.build==='tall';const tall=a.build==='tall'?1.06:a.build==='petite'?.95:1;const intensity=Math.min(1.5,Math.max(0,power));const speed=move==='shuffle'?8:move==='goth'?3.6:move==='sway'?3.3:move==='hiphop'?5.4:move==='wild'?7:5;const ph=beatClock===null?clock*speed:beatClock*PI*(move==='sultry'?.62:move==='goth'?.86:move==='shuffle'?1.5:move==='rave'?1.75:move==='headbang'?1.65:move==='popstar'?1.12:1.05);const step=Math.sin(ph),double=Math.sin(ph*2),groove=Math.sin(ph*.5),triWave=(2/PI)*Math.asin(Math.sin(ph));const bounce=(Math.abs(step)*.055+Math.abs(double)*.022)*intensity+pulse*.065;const lean=groove*intensity*.10+(pose?.torso||0)*.005;const hips=triWave*intensity*.12+(pose?.hip||0)*.007;const shoulderLift=Math.max(0,double)*intensity*.08;const bodyTwist=Math.sin(ph*.7)*intensity*.08+(pose?.rot||0)*.002;const armAccent=pulse*intensity*.22;const legRaise=move==='shuffle'?.29:move==='hiphop'?.28:move==='popstar'?.25:move==='rave'?.31:move==='club'?.18:.13;const leftKick=Math.max(0,step)*legRaise*intensity+(pose?Math.max(0,pose.legL)*.004:0),rightKick=Math.max(0,-step)*legRaise*intensity+(pose?Math.max(0,pose.legR)*.004:0);
function emit(p1,p2,p3,normal,color){const col=Array.isArray(color)?color:rgb(color);for(const p of [p1,p2,p3])tri.push(...p,...normal,...col);}
function ball(x,y,z,rx,ry,rz,color,detail=false){let c=Array.isArray(color)?color:rgb(color),lat=detail?13:8,lon=detail?18:12;for(let j=0;j<lat;j++)for(let k=0;k<lon;k++){const q=(ii,kk)=>{const p=PI*ii/lat,t=PI*2*kk/lon;return [Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t)];};const a1=q(j,k),a2=q(j+1,k),a3=q(j+1,k+1),a4=q(j,k+1);const pt=v=>[x+v[0]*rx,y+v[1]*ry,z+v[2]*rz];emit(pt(a1),pt(a2),pt(a3),norm(a1.map((v,i)=>v+a2[i]+a3[i])),c);emit(pt(a1),pt(a3),pt(a4),norm(a1.map((v,i)=>v+a3[i]+a4[i])),c);}}
function tube(a,b,r1,r2,color){const up=norm(vecsub(b,a)),ref=Math.abs(up[1])>.88?[1,0,0]:[0,1,0],side=norm(cross(up,ref)),side2=norm(cross(up,side)),steps=10,c=Array.isArray(color)?color:rgb(color);for(let i=0;i<steps;i++){const pos=(pt,r,j)=>pt.map((v,n)=>v+r*(side[n]*Math.cos(j*2*PI/steps)+side2[n]*Math.sin(j*2*PI/steps)));let p1=pos(a,r1,i),p2=pos(b,r2,i),p3=pos(b,r2,i+1),p4=pos(a,r1,i+1);let n=norm(vecsub(p1,a));emit(p1,p2,p3,n,c);emit(p1,p3,p4,n,c);}}
function ribbon(a,b,width,color){tube(a,b,width,width*.6,color);}
// Long loose hair strands are real three-dimensional meshes, behind the shoulders and hips.
if(!male&&['waves','fringe','bob','bun','long'].includes(a.hair)){for(let k=0;k<9;k++){let theta=PI*.08+k*PI*.22;let xx=Math.cos(theta)*.32,zz=-.12-Math.sin(theta)*.21;let end=a.hair==='bob'?2.0:a.hair==='bun'?2.65:1.28;const strand=k%4===1&&a.streaks?'#19131f':hair;const offset=Math.sin(ph*.6+k)*.085*intensity+Math.sin(ph*.22+k*1.5)*.02;const mid=[xx*.88+offset*.45,(2.75+end)*.5*tall,zz-.03];tube([xx*.72,2.76*tall,zz],mid,.068,.048,strand);tube(mid,[xx+offset,end*tall,zz-.03],.048,.012,strand);}}
// Optional game-like accessories, following character customization in both render modes.
if(a.accessory==='wings'||a.outfit==='raven'){
 for(let side of [-1,1]){for(let i=0;i<5;i++){
  const k=i/4,flap=Math.sin(ph*.6)*intensity*.095;
  const root=[side*.24,2.15*tall,-.15],tip=[side*(.55+k*.48+flap), (2.55-k*.69)*tall,-.28-k*.17];
  tube(root,tip,.078,.013,k%2?'#261d34':'#13101d');
  ball(tip[0],tip[1],tip[2],.065,.085,.04,'#3a294c');
 }}
}
if(a.accessory==='crown'){for(let i=-2;i<=2;i++){let x=i*.14;
 tube([x,3.18*tall,-.04],[x, (3.27+(i===0?.15:.06))*tall,-.04],.023,.008,'#d6b2de');
 ball(x,(3.27+(i===0?.15:.06))*tall,-.04,.028,.028,.025,i===0?'#ff68bc':'#9a7cff');}}
if(a.accessory==='headphones'){for(let side of [-1,1])ball(side*.33,2.83*tall,.035,.08,.21,.08,'#bb68c9');tube([-.32,2.99*tall,0],[.32,2.99*tall,0],.06,.06,'#332439');}
// Legs: articulated hips, knees, high-heeled boots.
const hipY=(1.37+bounce)*tall;for(let dir of [-1,1]){const raise=dir<0?leftKick:rightKick;const stepSide=(pose?(dir<0?pose.legL:pose.legR):0)*.003,extraKnee=Math.max(0,pose?(dir<0?pose.kneeL:pose.kneeR):0)*.004;const knee=[dir*(.18+hips*.12)+stepSide*.4,(.75+bounce+raise+extraKnee*.5)*tall,.035+raise*.26+extraKnee*.1];const hip=[dir*.18+hips*.17,hipY,0];const foot=[dir*(.2+step*.035)+stepSide,(.16+raise*.65+extraKnee*.4)*tall,.12+raise*.35];tube(hip,knee,male?.128:.15,.10,pants);tube(knee,foot,male?.10:.11,.075,pants);ball(foot[0],foot[1],foot[2]+.09,male?.17:.14,.11,.24,a.shoes||'#17131e');tube([foot[0],foot[1]-.02,foot[2]],[foot[0],foot[1]-.09,foot[2]-.04],.075,.06,'#17121d');}
// Swishing skirt panels / gothic gowns / punk plaid, articulated around steps.
if(['raven','crimson','royal','pinkpop','punkplaid'].includes(outfit)){
 const formal=['raven','crimson','royal'].includes(outfit);const length=formal?.91:.35;
 for(let k=0;k<16;k++){
  const a1=k*PI*2/16,a2=(k+1)*PI*2/16,swish=(hips*.18+Math.sin(ph*.75+k*.5)*intensity*.015);
  const r1=formal?.35:.34,r2=formal?.60:.45,topY=1.39*tall,botY=(1.39-length+bounce*.3)*tall;
  const shadeFactor=k%2?.94:1;
  const col=outfit==='punkplaid'?(k%2?'#6f203c':pants):outfit==='pinkpop'?shade(coat,shadeFactor):shade(coat,shadeFactor*.83);
  emit([Math.cos(a1)*r1,topY,Math.sin(a1)*r1],[Math.cos(a2)*r1,topY,Math.sin(a2)*r1],[Math.cos(a2+swish)*r2,botY,Math.sin(a2+swish)*r2],norm([Math.cos(a1),.25,Math.sin(a1)]),col);
  emit([Math.cos(a1)*r1,topY,Math.sin(a1)*r1],[Math.cos(a2+swish)*r2,botY,Math.sin(a2+swish)*r2],[Math.cos(a1+swish)*r2,botY,Math.sin(a1+swish)*r2],norm([Math.cos(a1),.25,Math.sin(a1)]),col);
 }
}
// Torso and jacket/corset contours.
ball(lean*.55,(1.86+bounce)*tall,bodyTwist*.18,male?.46:.37,.52,male?.205:.23,coat);if(['corset','royal','raven','crimson','pinkpop','punkplaid'].includes(outfit)){ball(lean*.46,(1.73+bounce)*tall,.185,.31,.3,.052,shade(coat,.72));for(let i=-2;i<=2;i++)ribbon([i*.11,1.49*tall,.24],[i*.08,1.95*tall,.27],.008,i===0?'#f0d4d5':'#161321');ball(0,1.31*tall,0,.47,.18,.31,coat);for(let k=0;k<16;k++){
 const t0=k*PI*2/16,t1=(k+1)*PI*2/16;
 const swish=hips*.15+Math.sin(ph*.7+k*.45)*intensity*.014;
 const top0=[Math.cos(t0)*.31,1.35*tall,Math.sin(t0)*.28];
 const top1=[Math.cos(t1)*.31,1.35*tall,Math.sin(t1)*.28];
 const hem0=[Math.cos(t0+swish)*.43,1.025*tall,Math.sin(t0+swish)*.42];
 const hem1=[Math.cos(t1+swish)*.43,1.025*tall,Math.sin(t1+swish)*.42];
 const normal=norm([Math.cos((t0+t1)*.5),.24,Math.sin((t0+t1)*.5)]);
 const panel=shade(coat,k%2?.89:.98);
 emit(top0,top1,hem1,normal,panel);
 emit(top0,hem1,hem0,normal,panel);
}}else if(outfit==='leather'){for(let dir of [-1,1]){const flap=Math.sin(ph*.65+dir)*.07*intensity;const x=dir*(.23+flap);tube([dir*.28,2.14*tall,.17],[x,1.18*tall,.22],.14,.08,'#12121c');tube([dir*.12,2.22*tall,.225],[dir*.25,1.76*tall,.245],.045,.015,dir>0?'#4b3b51':'#b8a6b5');tube([x,1.21*tall,.2],[dir*(.29+flap),.98*tall,.18],.10,.07,'#17131c');}ribbon([-.18,2.23*tall,.24],[.17,1.73*tall,.27],.022,'#bfb0c2');ball(0,1.50*tall,.235,.26,.043,.055,'#27212c');ball(0,1.50*tall,.290,.043,.035,.015,'#aaa0ad');}else {ribbon([-.3,1.48*tall,.17],[.3,1.48*tall,.17],.035,'#171420');}
// Necklace and tiny metallic decoration.
ball(0,2.255*tall,.25,.043,.043,.026,'#e6d8f2');
// Arms move independently, with shoulder lifts and alternating accents.
for(let dir of [-1,1]){const jazz=move==='wild'?.86:move==='rave'?.91:move==='popstar'?.70:move==='club'?.56:move==='sultry'?.24:move==='headbang'?.73:move==='goth'?.3:.42;const swing=Math.sin(ph+(dir>0?PI:0))*intensity*jazz;const reach=(['club','wild','rave','popstar'].includes(move)?Math.max(0,dir<0?double:-double)*.23:0)+armAccent*.08*dir;const shoulder=[dir*.39,(2.12+bounce+shoulderLift*(dir<0?1:.6))*tall,bodyTwist*dir*.08];const armAngle=pose?(dir<0?pose.armL:pose.armR):0,raised=Math.max(0,Math.min(1.15,(Math.abs(armAngle)-26)/118));const elbowBend=pose?(dir<0?pose.elbowL:pose.elbowR)/180:0;const elbow=[dir*(.57+swing*.19+reach-raised*.17),(1.78+bounce+swing*.16+shoulderLift*.4+raised*.43)*tall,.05+swing*.09+bodyTwist*.08];const wrist=[dir*(.65+swing*.20+reach*.8-raised*.29+elbowBend*.05),(1.43+bounce+(move==='wild'?Math.abs(swing)*.29:swing*.16)+shoulderLift*.2+raised*1.16+elbowBend*.09)*tall,.2+Math.abs(swing)*.08];tube(shoulder,elbow,.12,.09,outfit==='leather'?coat:skin);tube(elbow,wrist,.087,.06,outfit==='leather'?coat:skin);ball(wrist[0],wrist[1]-.045,wrist[2],.069,.099,.056,skin);}
// Neck and head have an intentional small rhythmic tilt.
const faceX=lean*.55+bodyTwist*.18; tube([faceX,2.24*tall,0],[faceX,2.51*tall,bodyTwist*.06],.13,.12,skin);
const headStart=tri.length;
ball(faceX,(2.77+bounce+shoulderLift*.18)*tall,bodyTwist*.08,male?.30:.34,male?.39:.42,male?.27:.32,skin,true);ball(faceX,(3.08+bounce)*tall,-.08+bodyTwist*.08,male?.34:.35,.145,.29,hair);if(male){ball(faceX,(2.54+bounce)*tall,.065,.22,.10,.18,skin);for(let dir of [-1,1])ball(faceX+dir*.22,(2.68+bounce)*tall,.15,.082,.12,.08,skin);}
// Fringe sits over the forehead, lighter highlights and dark contrast streaks.
if(!male&&(a.hair==='fringe'||a.hair==='waves'||a.hair==='long')){for(let k=0;k<9;k++){const xx=-.3+k*.079;const col=a.streaks&&k===2?'#16141d':hair;tube([xx,3.155*tall,.10],[xx+(k%2?-.04:.03),(a.hair==='fringe'?(k%2?2.85:2.94):2.97)*tall,.295],.052,.008,col);}}else if(a.hair==='mohawk'){for(let k=-3;k<=3;k++)ball(faceX+k*.06,3.21*tall,-k*.08,.095,.18,.11,hair);}else if(a.hair==='bun'){for(let dir of [-1,1])ball(faceX+dir*.34,3.11*tall,-.08,.19,.19,.18,hair);}
// Textured side-swept short hair shapes; male silhouettes differ from the female bun.
if(male){for(let k=0;k<8;k++){const dir=k%2?1:-1,xx=-.29+k*.082,level=(3.135+(k%3)*.025)*tall,end=(2.97+(k%2)*.04)*tall;tube([faceX+xx,level,-.04],[faceX+xx+dir*.077,end,.204],.051,.009,k%4===0?shade(hair,.78):hair);}}
// Face: dimensional irises, brows, a nose and mouth.
for(let dir of [-1,1]){let iy=(2.795+bounce)*tall,iz=male?.252:.292;ball(faceX+dir*.14,iy,iz,male?.050:.054,male?.031:.038,.014,'#f0edf1');ball(faceX+dir*.144,(2.791+bounce)*tall,iz+.032,male?.027:.031,male?.030:.035,.012,eye);ball(faceX+dir*.144,(2.789+bounce)*tall,iz+.045,.012,.019,.006,'#131524');ball(faceX+dir*.127,(2.816+bounce)*tall,iz+.048,.007,.007,.004,'#ffffff');tube([faceX+dir*.21,2.905*tall,iz+.01],[faceX+dir*.08,2.93*tall,iz+.025],male?.014:.017,.010,a.brow||'#29202e');}
ball(faceX,(2.665+bounce)*tall,male?.285:.315,.034,.054,.035,skin);tube([faceX-(male?.071:.082),2.565*tall,male?.248:.305],[faceX+(male?.071:.082),2.565*tall,male?.248:.305],male?.008:.009,.008,male?'#765762':'#b25f83');
// Metal septum ring on Alice preset; gothic ear accents.
if(a.preset==='alice'){ball(faceX-.025,2.609*tall,.369,.019,.019,.01,'#f5e9fa');ball(faceX+.025,2.609*tall,.369,.019,.019,.01,'#f5e9fa');}
for(let dir of [-1,1])ball(faceX+dir*.31,(2.63+bounce)*tall,.01,.036,.065,.055,skin);
// Scale the head as one cohesive mesh around the base of the skull.
// Earlier model had a massive head and protruding eyes; keep its facial pieces aligned.
const pivotY=(2.77+bounce)*tall, sx=male?.85:.86, sy=male?.84:.87, sz=male?.84:.86;
const nod=Math.max(-.12,Math.min(.12,(pose?.head||0)*PI/180*.48)),cs=Math.cos(nod),sn=Math.sin(nod);
for(let v=headStart;v<tri.length;v+=9){
 const dx=(tri[v]-faceX)*sx,dy=(tri[v+1]-pivotY)*sy;
 tri[v]=faceX+dx*cs-dy*sn;
 tri[v+1]=pivotY+dx*sn+dy*cs;
 tri[v+2]=tri[v+2]*sz;
}
return new Float32Array(tri);}
function draw(canvas,a,seconds=0,move='bounce',power=.4,pulse=0,previousMove=move,blend=1,beatClock=null,pose=null){const s=mount(canvas);if(!s)return false;const {gl,prog}=s;if(seconds>0&&s.lastDrawTime!==undefined&&seconds-s.lastDrawTime>0&&seconds-s.lastDrawTime<1/30)return true;s.lastDrawTime=seconds;const w=Math.max(80,Math.min(480,Math.round(canvas.clientWidth*(Math.min(devicePixelRatio||1,2))))),h=Math.max(110,Math.min(600,Math.round(canvas.clientHeight*(Math.min(devicePixelRatio||1,2)))));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(prog);let mesh=body3d(a,seconds,move,power,pulse,beatClock,pose);if(blend<.999&&previousMove!==move){const before=body3d(a,seconds,previousMove,power,pulse,beatClock,pose);if(before.length===mesh.length){for(let j=0;j<mesh.length;j++)mesh[j]=before[j]*(1-blend)+mesh[j]*blend;}}gl.bindBuffer(gl.ARRAY_BUFFER,s.buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.DYNAMIC_DRAW);for(const [slot,attr]of [[0,s.p],[3,s.n],[6,s.c]]){gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,3,gl.FLOAT,false,36,slot*4);}gl.uniform1f(s.turn,Math.sin(seconds*.45)*.20+.09);gl.drawArrays(gl.TRIANGLES,0,mesh.length/9);return true;}
window.Groove3D={draw,mount};
})();
