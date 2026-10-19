import {motionPeriod,motionRate} from './motion-clock.js';
import {sequenceState} from './research-models.js';
import {T,BaseScene,Beads,material} from './visual-primitives.js';
import {SurfaceContours} from './surface-contours.js';
import {landscapeSurfaceGeometry,updateLandscapeSurface} from './landscape-surface.js';
import {terrainContourStyle} from './memo-metrics.js';
const g=(x,z,cx,cz,sx,sz)=>Math.exp(-((x-cx)**2/sx+(z-cz)**2/sz));
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function atlasTransportPhase(time){const t=((time%motionPeriod)+motionPeriod)%motionPeriod*6/motionPeriod;return t<1?0:t<2.6?smooth((t-1)/1.6):t<3.6?1:t<5.2?1-smooth((t-3.6)/1.6):0;}
// An illustrative navigation field; neither these heights nor a sequence-driven
// shape change are a measured molecular energy or prediction.
export const researchPeaks=[
 {id:'foundations',x:-2.30,z:-.64},
 {id:'science',x:1.10,z:-1.02},
 {id:'sampling',x:-.95,z:1.00},
 {id:'safety',x:2.42,z:.83}
];
export class LandscapeScene extends BaseScene{
 constructor(theme){
  super(theme,{view:[0,6.6,9.5],span:4});this.reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion:reduce)').matches;this.hoverTopic='';this.focus={foundations:0,science:0,sampling:0,safety:0};this.foundationsClock=0;this.transport=0;this.safetyClock=0;this.safetyAmount=0;this.particleOpacity=0;this.samplingClock=0;
  this.pointer={x:0,z:0,amplitude:0,targetX:0,targetZ:0,targetAmplitude:0};
  this.peaks=researchPeaks.map(p=>({...p,position:[p.x,this.baseHeight(p.x,p.z)+.15,p.z]}));
  this.fn=(u,v,i)=>{if(this.vertexCache&&i!==undefined){const q=this.vertexCache[i],density=this.sampleDensity(q);this.vertexDensity[i]=density;return[q.x,q.base+this.safetyAmount*q.edit+q.edge*this.focus.sampling*(density-q.rest)+this.pointer.amplitude*q.edge*g(q.x,q.z,this.pointer.x,this.pointer.z,.28,.28),q.z];}const x=(u-.5)*8.8,z=(v-.5)*4.5;return[x,this.height(x,z),z];};
  const m=material(0xffffff);m.vertexColors=true;
  this.surface=new T.Mesh(landscapeSurfaceGeometry(this.fn),m);this.scene.add(this.surface);updateLandscapeSurface(this.surface,this.fn,(u,v,q)=>this.colour(u,v,q));
  // Undeformed hit surface avoids a cursor/deformation feedback loop.
  this.restSurface=new T.Mesh(this.surface.geometry.clone(),new T.MeshBasicMaterial({side:T.DoubleSide}));this.restSurface.updateMatrixWorld();this.selectables=[this.restSurface];
  const contourTheme={...theme,ink:theme.mode==='dark'?theme.bg:theme.ink};this.contours=new SurfaceContours(this.scene,contourTheme,{levels:[.18,.36,.54,.72,.90,1.08,1.26,1.44,1.62,1.80],radius:terrainContourStyle.radius,opacity:terrainContourStyle.opacity,capacity:30000});this.contours.mesh.renderOrder=2;
  // The original spiral winds around the peak in its intrinsic x/z chart.
  // Equal 3D arc lengths, rather than a camera-plane stencil, preserve relief.
  const spiral=this.spiralTargets(125);let seed=0x7b1d93a5;const random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;};this.cohort=spiral.map(target=>{let source;do{const a=random()*Math.PI*2,r=Math.sqrt(random());source=[-2.55+.85*r*Math.cos(a),-.20+.65*r*Math.sin(a)];}while(this.baseHeight(...source)<-.05);return{source,target};});
  this.particles=new Beads(this.scene,this.cohort.length,theme,.025);this.particles.mesh.renderOrder=3;this.particles.mesh.material.transparent=true;this.particles.mesh.material.opacity=0;this.particles.mesh.visible=false;
  const uv=this.surface.geometry.attributes.uv;
  this.vertexCache=Array.from({length:uv.count},(_,i)=>{const x=(uv.getX(i)-.5)*8.8,z=(uv.getY(i)-.5)*4.5,w=this.regionWeights(x,z),sum=w.reduce((a,b)=>a+b,0)||1;return{x,z,base:this.baseHeight(x,z),weights:w.map(v=>v/sum),rest:this.samplingRelief(x,z,0),edge:smooth((4.4-Math.abs(x))/.50)*smooth((2.25-Math.abs(z))/.45),edit:.48*g(x,z,2.82,.94,.18,.26)-.48*g(x,z,2.29,.79,.28,.25),a:(x+1.25)**2/.40+(z-.90)**2/.24,b:(x+.35)**2/.18+(z-1.16)**2/.15,mask:Math.exp(-((x+.8)**2/1.7+(z-1)**2/.8))};});
  this.vertexDensity=new Float64Array(uv.count);this.tones=[theme.g,theme.a,theme.c,theme.b].map(c=>new T.Color(c));this.darkTones=this.tones.map(c=>c.clone().multiplyScalar(.88));this.ink=new T.Color(theme.ink);this.samplingLow=new T.Color(theme.c).lerp(new T.Color(theme.bg),.12);this.samplingHigh=new T.Color(theme.c).lerp(this.ink,.24);this.scratch=new T.Color();this.heat=new T.Color();
  this.needsFrame=false;this.update(0,0);this.measure();
 }
 spiralTargets(count){
  // A conical helix on level sets of the actual peak: angle advances while
  // elevation rises. Back-facing dots are occluded by the same 3D surface.
  let cx=-2.30,cz=-.64;for(let k=0;k<35;k++){const e=.001,dx=(this.baseHeight(cx+e,cz)-this.baseHeight(cx-e,cz))/(2*e),dz=(this.baseHeight(cx,cz+e)-this.baseHeight(cx,cz-e))/(2*e);cx+=dx*.08;cz+=dz*.08;}
  const maximum=this.baseHeight(cx,cz),curve=[];let length=0;
  for(let i=0;i<=2400;i++){const u=i/2400,angle=.3+u*Math.PI*5.5,level=.13+(maximum-.19)*u,dx=Math.cos(angle),dz=Math.sin(angle);let lo=0,hi=1.7;for(let n=0;n<32;n++){const r=(lo+hi)/2;if(this.baseHeight(cx+r*dx,cz+r*dz)>level)lo=r;else hi=r;}const r=(lo+hi)/2,x=cx+r*dx,z=cz+r*dz,q=[x,this.baseHeight(x,z),z];if(i)length+=new T.Vector3(...q).distanceTo(new T.Vector3(...curve[i-1].q));curve.push({q,length});}
  let j=1;return Array.from({length:count},(_,i)=>{const d=length*i/(count-1);while(j<curve.length-1&&curve[j].length<d)j++;const A=curve[j-1],B=curve[j],f=(d-A.length)/(B.length-A.length);return[A.q[0]+(B.q[0]-A.q[0])*f,A.q[2]+(B.q[2]-A.q[2])*f];});
 }

 surfacePoint(x,z){const e=.002,dx=(this.height(x+e,z)-this.height(x-e,z))/(2*e),dz=(this.height(x,z+e)-this.height(x,z-e))/(2*e),n=new T.Vector3(-dx,1,-dz).normalize();return new T.Vector3(x,this.height(x,z),z).addScaledVector(n,.032).toArray();}

 baseHeight(x,z){
  const edge=smooth((4.4-Math.abs(x))/.8)*smooth((2.25-Math.abs(z))/.6);
  let h=.13*g(x,z,-.3,0,10,.85)+.10*g(x,z,.2,.15,3,2.4);
  // An oblique shoulder, a paired crest, two unequal sampling modes, and a low asymmetric cap.
  h+=1.12*g(x,z,-2.30,-.64,.48,.70)+.43*g(x,z,-1.67,-.96,.82,.16);
  h+=1.36*g(x,z,1.10,-1.02,.43,.40)+.78*g(x,z,1.86,-.80,.27,.56)-.16*g(x,z,1.47,-.94,.06,.23);
  h+=this.samplingRelief(x,z,0);
  h+=.93*g(x,z,2.42,.83,.76,.32)+.32*g(x,z,2.08,1.25,.17,.23);
  return -.32+edge*h;
 }
 samplingRelief(x,z,beta){
  // Normalised importance weights pi_i exp(-beta E_i), applied to fixed
  // unit-integral Gaussian modes. Relative mass changes, rather than a sine
  // wave arbitrarily lifting the two summits.
  const a=.62*Math.exp(-beta*.8),b=.38,total=a+b,fa=1-.42*smooth(Math.max(0,-beta)/3.2),fb=1-.06*smooth(Math.max(0,beta)/3.2);
  return .88*(a/total*g(x,z,-1.25,.90,.40*fa,.24*fa)/(Math.PI*Math.sqrt(.40*.24)*fa)+b/total*g(x,z,-.35,1.16,.18*fb,.15*fb)/(Math.PI*Math.sqrt(.18*.15)*fb));
 }
 height(x,z){const reweight=this.focus.sampling*(this.samplingRelief(x,z,-3.2*Math.sin(this.samplingClock*motionRate))-this.samplingRelief(x,z,0)),p=this.pointer,edge=smooth((4.4-Math.abs(x))/.50)*smooth((2.25-Math.abs(z))/.45),edit=this.safetyAmount*(.48*g(x,z,2.82,.94,.18,.26)-.48*g(x,z,2.29,.79,.28,.25));return this.baseHeight(x,z)+edit+edge*reweight+p.amplitude*edge*g(x,z,p.x,p.z,.28,.28);}
 setPointer(point){const p=this.pointer;if(point){if(!p.targetAmplitude&&!p.amplitude){p.x=point.x;p.z=point.z;}p.targetX=point.x;p.targetZ=point.z;p.targetAmplitude=.30;}else p.targetAmplitude=0;this.needsFrame=true;}
 setHover(id){if(id===this.hoverTopic)return;this.hoverTopic=id;if(id==='foundations')this.foundationsClock=0;if(id==='safety')this.safetyClock=0;if(id==='sampling')this.samplingClock=0;this.needsFrame=true;}
 regionWeights(x,z){return researchPeaks.map(p=>Math.exp(-((x-p.x)**2/1.8+(z-p.z)**2/1.05)));}
 regionAt(x,z){const w=this.regionWeights(x,z);return researchPeaks[w.indexOf(Math.max(...w))].id;}
 setSamplingParameters(){const beta=-3.2*Math.sin(this.samplingClock*motionRate),a=.62*Math.exp(-beta*.8),total=a+.38,fa=1-.42*smooth(Math.max(0,-beta)/3.2),fb=1-.06*smooth(Math.max(0,beta)/3.2);this.sampleCoefficients=[a/total/(Math.PI*Math.sqrt(.40*.24)*fa),.38/total/(Math.PI*Math.sqrt(.18*.15)*fb),fa,fb];}
 sampleDensity(q){if(!this.sampleCoefficients)this.setSamplingParameters();const[a,b,fa,fb]=this.sampleCoefficients;return .88*(a*Math.exp(-q.a/fa)+b*Math.exp(-q.b/fb));}

 colour(u,v,p,i){
  const t=this.theme,q=this.vertexCache?.[i],weights=q?.weights??(()=>{const w=this.regionWeights(p[0],p[2]),sum=w.reduce((a,b)=>a+b,0)||1;return w.map(x=>x/sum);})(),tones=this.tones??[t.g,t.a,t.c,t.b].map(x=>new T.Color(x)),c=this.scratch??new T.Color();c.setRGB(0,0,0);
  for(let j=0;j<4;j++){c.r+=tones[j].r*weights[j];c.g+=tones[j].g*weights[j];c.b+=tones[j].b*weights[j];}
  c.lerp(this.ink??new T.Color(t.ink),.10*(1-smooth((p[1]+.3)/1.6)));
  for(let j=0;j<4;j++)c.lerp(this.darkTones?.[j]??tones[j].clone().multiplyScalar(.88),this.focus[researchPeaks[j].id]*weights[j]*.28);
  if(!this.focus.sampling)return c;
  const density=i===undefined?this.samplingRelief(p[0],p[2],-3.2*Math.sin(this.samplingClock*motionRate)):this.vertexDensity[i],value=smooth(Math.min(1,density/1.8)),low=this.samplingLow??new T.Color(t.c).lerp(new T.Color(t.bg),.12),high=this.samplingHigh??new T.Color(t.c).lerp(new T.Color(t.ink),.24),heat=(this.heat??new T.Color()).copy(low).lerp(high,value),mask=Math.min(1,density/.30)*(q?.mask??Math.exp(-((p[0]+.8)**2/1.7+(p[2]-1)**2/.8)));
  return c.lerp(heat,this.focus.sampling*.70*mask);
 }

 update(t,dt=.033){
  dt=Math.min(.09,Math.max(.016,dt));const p=this.pointer,blend=1-Math.exp(-16*dt);p.x+=(p.targetX-p.x)*blend;p.z+=(p.targetZ-p.z)*blend;p.amplitude+=(p.targetAmplitude-p.amplitude)*blend;if(Math.abs(p.targetAmplitude-p.amplitude)<.0003)p.amplitude=p.targetAmplitude;
  let settling=false;for(const id of Object.keys(this.focus)){const target=this.hoverTopic===id?1:0;this.focus[id]+=(target-this.focus[id])*(1-Math.exp(-(id==='foundations'?2.4:8)*dt));if(Math.abs(target-this.focus[id])<.001)this.focus[id]=target;else settling=true;}
  if(!this.reduced&&this.hoverTopic==='foundations')this.foundationsClock+=dt;this.transport=this.reduced?1:atlasTransportPhase(this.foundationsClock);
  if(!this.reduced&&this.hoverTopic==='sampling')this.samplingClock+=dt;if(!this.reduced&&this.hoverTopic==='safety')this.safetyClock+=dt;const edit=sequenceState(this.safetyClock),edited=this.reduced?this.hoverTopic==='safety':edit.response>.5,targetEdit=this.hoverTopic==='safety'?(this.reduced?1:edit.response):0;this.safetyAmount+=(targetEdit-this.safetyAmount)*(1-Math.exp(-18*dt));this.sequence={letters:edit.sequence.slice(edit.index-4,edit.index+5).join(''),active:4};
  this.particleOpacity+=((this.hoverTopic==='foundations'?1:0)-this.particleOpacity)*(1-Math.exp(-10*dt));if(this.particleOpacity<.001)this.particleOpacity=0;this.particles.mesh.visible=this.particleOpacity>.001;this.particles.mesh.material.opacity=this.particleOpacity;
  this.needsFrame=settling||!this.reduced&&['foundations','safety','sampling'].includes(this.hoverTopic)||Math.abs(this.particleOpacity-(this.hoverTopic==='foundations'?1:0))>.001||Math.abs(this.safetyAmount-targetEdit)>.001||Math.abs(p.amplitude-p.targetAmplitude)>.0003||p.targetAmplitude>0&&(Math.abs(p.x-p.targetX)+Math.abs(p.z-p.targetZ)>.001);
  this.elapsed=t;this.phase=p.amplitude/.30;
  this.setSamplingParameters();
  const shape=[this.focus.sampling,this.samplingClock,this.safetyAmount,p.amplitude,p.x,p.z],tone=Object.values(this.focus),changed=(a,b)=>!b||a.some((v,i)=>Math.abs(v-b[i])>1e-9),geometryChanged=changed(shape,this.lastShape),colourChanged=geometryChanged||changed(tone,this.lastTone);
  if(geometryChanged||colourChanged){updateLandscapeSurface(this.surface,this.fn,(u,v,q,i)=>this.colour(u,v,q,i),{positions:geometryChanged,colours:colourChanged});if(geometryChanged)this.contours.update(this.surface);this.lastShape=shape;this.lastTone=tone;}

  if(this.particles.mesh.visible){const f=this.transport,points=this.cohort.map(({source:a,target:b})=>{const x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f;return this.surfacePoint(x,z);});this.particles.update(points,null,Array(this.cohort.length).fill(this.theme.mode==='dark'?this.theme.bg:this.theme.ink));}
 }
 measure(){let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;const add=q=>{const p=new T.Vector3(...q).applyMatrix4(this.camera.matrixWorldInverse);x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y);};const a=this.surface.geometry.attributes.position;for(let i=0;i<a.count;i++){add([a.getX(i),a.getY(i),a.getZ(i)]);add([a.getX(i),a.getY(i)+.48,a.getZ(i)]);for(const beta of [-3.2,3.2])add([a.getX(i),a.getY(i)+this.samplingRelief(a.getX(i),a.getZ(i),beta)-this.samplingRelief(a.getX(i),a.getZ(i),0)+.30,a.getZ(i)]);}for(const p of this.peaks)add(p.position);this.envelope={x0:x0-.15,x1:x1+.15,y0:y0-.22,y1:y1+.35};}
 setViewport(w,h){this.viewportWidth=w;this.viewportHeight=h;this.desktopLayout=typeof innerWidth==='number'?innerWidth>1020:w>900;}
 fit(w,h){const e=this.envelope,vw=this.viewportWidth??w,vh=this.viewportHeight??h,desktop=this.desktopLayout??(vw>900),unit=Math.max((e.x1-e.x0)/(w*(desktop?1:.94)),(e.y1-e.y0)/(h-(desktop?0:w*.15)))*(desktop?1.18:1.04),cx=(e.x0+e.x1)/2,cy=(e.y0+e.y1)/2+(desktop?45*h*unit/vh:w*.075*unit);this.camera.left=cx-w*unit/2;this.camera.right=cx+w*unit/2;this.camera.top=cy+h*unit/2;this.camera.bottom=cy-h*unit/2;this.camera.updateProjectionMatrix();this.contours.setStrokeWidth(terrainContourStyle.width,this.camera,vw);}
 dispose(){this.restSurface.geometry.dispose();this.restSurface.material.dispose();super.dispose();}
}
