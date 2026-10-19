import {transportPhase} from './motion-clock.js';
import {BaseScene,Beads,T,surfaceGeometry,updateSurface,tube,setTube,material} from './visual-primitives.js';
import {sphereParticleColour} from './research-scenes.js';
import {SurfaceContours} from './surface-contours.js';
import {TAU,clamp,smooth,cycle,mix,simplexPoint,torusPoint,torusTransport,potential,densityNormaliser,conditionalPDF,conditionalQuantile,ribbonConditionalPDF,ribbonConditionalQuantile,slerp} from './process-math.js';
import {ribbonPeriod,ribbonRate,ribbonLane,ribbonFocus,ribbonHeight} from './conditional-ribbon.js?v=20261019-original-motion';
import {sphericalCohort,spherePoint} from './research-models.js';
const palettes=new WeakMap();
const palette=(t,p)=>{let c=palettes.get(t);if(!c){c=[new T.Color(t.a),new T.Color(t.b),new T.Color(t.c),new T.Color()];palettes.set(t,c);}return p<.5?c[3].copy(c[0]).lerp(c[1],p*2):c[3].copy(c[1]).lerp(c[2],(p-.5)*2);};
const points=(fn,n=72)=>Array.from({length:n+1},(_,i)=>fn(i/n));
function surface(owner,fn,col,nu=80,nv=48){const mat=material(0xffffff);mat.vertexColors=true;const mesh=new T.Mesh(surfaceGeometry(fn,nu,nv),mat);owner.scene.add(mesh);updateSurface(mesh,fn,col);return mesh;}
const density=(x,m=0,s=.45)=>Math.exp(-.5*((x-m)/s)**2)/(s*Math.sqrt(TAU));
export class ProcessScene extends BaseScene{
 constructor(group,key,theme){super(theme,{view:group==='samplers'?[3.2,3,6]:key==='annulus'?[.8,4.8,6]:[2.5,2.2,6],span:2.65});this.group=group;this.key=key;this.labels=[];this.phase=0;
  if(key==='annulus'){this.beads=new Beads(this.scene,96,theme,.038);this.fn=(u,v)=>{const a=TAU*u,r=.64+.78*v;return[r*Math.cos(a),.12*Math.sin(2*a),r*Math.sin(a)];};this.sheet=surface(this,this.fn,()=>new T.Color(theme.a),96,8);}
  else if(key==='simplex'){this.camera.position.set(3.3,2.6,5.8);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();this.fn=(u,v)=>{const a=u*Math.PI/2,b=v*Math.PI/2;return[1.7*Math.sin(a)*Math.cos(b)-.65,1.7*Math.cos(a)-.65,1.7*Math.sin(a)*Math.sin(b)-.65];};this.sheet=surface(this,this.fn,()=>new T.Color(theme.a),64,64);this.beads=new Beads(this.scene,108,theme,.034);}
  else if(key==='torus'||key==='torsion'){this.fn=(u,v)=>{const a=TAU*u,b=TAU*v,e=Math.cos(3*a)+Math.cos(2*b)+.6*Math.cos(a-b),r=key==='torsion'?.40+.10*this.phase*Math.cos(2*b):.43;return torusPoint(a,b,key==='torsion'?1.18+.22*this.phase*Math.cos(3*a):1.18,r);};this.sheet=surface(this,this.fn,(u,v)=>key==='torsion'?palette(theme,.5+.42*this.phase*(Math.cos(3*TAU*u)+Math.cos(2*TAU*v))/2):new T.Color(theme.a),112,64);if(key==='torus'){this.beads=new Beads(this.scene,156,theme,.038);this.torusSeeds=Array.from({length:156},(_,i)=>{const a=TAU*((i*.61803398875)%1),b=TAU*((i*.754877666)%1),target=.45*Math.sin(2*a)+(i%2)*Math.PI+.20*Math.sin(i*1.7);return{a,b,delta:Math.atan2(Math.sin(target-b),Math.cos(target-b))};});this.torusColour=Array(156).fill(sphereParticleColour(theme));}}
  else if(key==='conditional'){
   this.playbackSpeed=1;
   this.framingTimes=Array.from({length:65},(_,i)=>i*ribbonPeriod*3/64);
   this.focus=ribbonFocus(0);this.ribbons=[];
   for(let j=0;j<3;j++){const fn=(u,v)=>{const x=(u-.5)*3.8;return[x,ribbonHeight(x,j,this.focus),ribbonLane(j)+(v-.5)*.34];};this.ribbons.push({j,fn,mesh:surface(this,fn,()=>new T.Color([theme.a,theme.d,theme.c][j]),160,8)});}
  }
  else{this.canopyCache=[];this.beta=1.7;this.normaliser=densityNormaliser(this.beta);this.fn=(u,v,index)=>{let q=this.canopyCache[index];if(!q){const a=TAU*u,r=v,x=1.8*r*Math.cos(a),z=1.55*r*Math.sin(a);q=[x,z,potential(x,z)];this.canopyCache[index]=q;}const[x,z,e]=q;return[x,-.65+.85*Math.log1p(3*Math.exp(-this.beta*e)/this.normaliser),z];};this.sheet=surface(this,this.fn,(u,v,p)=>palette(theme,clamp((p[1]+.65)/1.7)),160,90);this.contours=new SurfaceContours(this.scene,theme,{levels:[-.55,-.42,-.25,0,.35,.7,1],opacity:.35});}
  this.update(0,0);
 }
 update(time){this.elapsed=time;this.phase=cycle(time);const p=this.phase;
  if(this.key==='annulus'){this.beads.update(Array.from({length:96},(_,i)=>{const a=TAU*i/96+.32*Math.sin(i*2.4)+time*.42,r0=.70+.65*((i*.618034)%1),r=mix(r0,1.02+.075*Math.sin(i*2.4),p);return[r*Math.cos(a),.12*Math.sin(2*a)+.038,r*Math.sin(a)];}),null,Array(96).fill(sphereParticleColour(this.theme)));}
  else if(this.key==='simplex')this.beads.update(Array.from({length:108},(_,i)=>simplexPoint(i,108,p)),null,Array(108).fill(sphereParticleColour(this.theme)));
  else if(this.key==='torus'){this.phase=transportPhase(time);this.beads.update(this.torusSeeds.map(({a,b,delta})=>torusPoint(a+time*.32,b+delta*this.phase,1.18,.47)),null,this.torusColour);}
  else if(this.key==='torsion')updateSurface(this.sheet,this.fn,(u,v)=>palette(this.theme,.5+.42*this.phase*(Math.cos(3*TAU*u)+Math.cos(2*TAU*v))/2));
  else if(this.key==='conditional'){
   this.focus=ribbonFocus(time*ribbonRate);for(const r of this.ribbons)updateSurface(r.mesh,r.fn);

  }
  else{this.beta=1.7+3.8*p;this.normaliser=densityNormaliser(this.beta);updateSurface(this.sheet,this.fn,(u,v,p)=>palette(this.theme,clamp((p[1]+.65)/1.7)));this.contours.update(this.sheet);}
 }
}
function roundedTile(){const s=new T.Shape(),r=.038,h=.115;s.moveTo(-h+r,-h);s.lineTo(h-r,-h);s.quadraticCurveTo(h,-h,h,-h+r);s.lineTo(h,h-r);s.quadraticCurveTo(h,h,h-r,h);s.lineTo(-h+r,h);s.quadraticCurveTo(-h,h,-h,h-r);s.lineTo(-h,-h+r);s.quadraticCurveTo(-h,-h,-h+r,-h);return new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:3,steps:1,curveSegments:6});}
export function isodensityRadius(n,p){const a=.85*p,s=.50,iso=.15;let lo=0,hi=2.5;for(let k=0;k<24;k++){const r=(lo+hi)/2,x=r*n[0],y=r*n[1],z=r*n[2],f=.5*Math.exp(-((x-a)**2+y*y+z*z)/(2*s*s))+.5*Math.exp(-((x+a)**2+y*y+z*z)/(2*s*s));if(f>iso)lo=r;else hi=r;}return(lo+hi)/2;}
export class GenerativeLoaderScene extends BaseScene{
 constructor(theme,{key='flow'}={}){super(theme,{view:key==='steps'?[.8,1.0,6]:key==='flow'?[2.6,1.8,6]:key==='quantiles'?[2.4,3.5,6]:[1,2.7,6],span:2});this.key=key;this.progress=0;this.labels=[];
  if(key==='bridge'){this.fn=(u,v)=>{const a=u*TAU,b=v*Math.PI,n=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)],r=isodensityRadius(n,this.progress);return n.map(x=>x*r);};this.sheet=surface(this,this.fn,(u,v,p)=>new T.Color(theme.a).lerp(new T.Color(theme.b),smooth((p[0]+1.5)/3)),72,48);}
  else if(key==='geodesic'){this.cohort=sphericalCohort(96);this.beads=new Beads(this.scene,96,theme,.042);this.scene.add(new T.Mesh(new T.SphereGeometry(1.15,72,48),material(theme.a)));}
  else if(key==='steps'){this.tiles=new T.InstancedMesh(roundedTile(),material(0xffffff),25);this.tiles.frustumCulled=false;this.dummy=new T.Object3D();this.scene.add(this.tiles);for(let i=0;i<25;i++){this.dummy.position.set(((i%5)-2)*.30,(2-Math.floor(i/5))*.30,0);this.dummy.updateMatrix();this.tiles.setMatrixAt(i,this.dummy.matrix);this.tiles.setColorAt(i,new T.Color(theme.a));}}
  else if(key==='quantiles'){this.ribbons=[];for(let j=0;j<3;j++){const fn=(u,v)=>{const x=(u-.5)*2.9,p=this.progress,spread=.48+j*.07,y=(1-p)*density(x,0,spread)+p*(density(x,-.64,spread*.65)+density(x,.64,spread*.65))*.5;return[x,-.48+y*1.65,(j-1)*.90+(v-.5)*.65];};this.ribbons.push({fn,mesh:surface(this,fn,()=>new T.Color([theme.a,theme.d,theme.c][j]),72,6)});}}
  else{this.fn=(u,v)=>{const a=TAU*u,r=v,x=1.65*r*Math.cos(a),z=1.2*r*Math.sin(a),p=this.progress,h=(1-p)*density(x,0,.45)*density(z,0,.45)+p*.5*(density(x,-.72,.32)+density(x,.72,.32))*density(z,0,.38);return[x,-.48+h*3.00,z];};this.sheet=surface(this,this.fn,(u,v,p)=>palette(theme,clamp((p[1]+.48)/1.2)),112,56);}
  this.update(0,0);
 }
 setProgress(p){this.progress=clamp(p);this.update(this.elapsed,0);}
 update(time){this.elapsed=time;const p=this.phase=this.progress,t=this.theme;
  if(this.key==='bridge')updateSurface(this.sheet,this.fn,(u,v,p)=>new T.Color(t.a).lerp(new T.Color(t.b),smooth((p[0]+1.5)/3)));
  else if(this.key==='geodesic')this.beads.update(this.cohort.map(c=>spherePoint(c,p)),null,Array(96).fill(sphereParticleColour(t)));
  else if(this.key==='steps'){for(let i=0;i<25;i++){const threshold=(((i*17)%25)+.5)/25,revealed=p>=threshold,row=Math.floor(i/5),col=i%5;this.tiles.setColorAt(i,new T.Color(revealed?((row-2)**2+(col-2)**2<3?t.c:t.b):t.a));}this.tiles.instanceColor.needsUpdate=true;}
  else if(this.key==='quantiles')for(const r of this.ribbons)updateSurface(r.mesh,r.fn);
  else updateSurface(this.sheet,this.fn,(u,v,p)=>palette(t,clamp((p[1]+.48)/1.2)));
 }
}
