import {motionRate,cosinePhase} from './motion-clock.js';
import {T,BaseScene,Beads,surfaceGeometry,updateSurface,tube,material} from './visual-primitives.js';
const points=(fn,n=48)=>Array.from({length:n+1},(_,i)=>fn(i/n));
export class TopicDetailScene extends BaseScene{
 constructor(topic,theme,data={}){super(theme,{view:topic==='science'?[0,1,7]:[1.4,2.3,6],span:topic==='science'?2.65:2.6});this.topic=topic;this.guides=[];this.data=data;
  if(topic==='science'){const d=data.contacts;this.nodes=d.nodes;this.beads=new Beads(this.scene,d.nodes.length,theme,1.7*.76*d.normalization.scale);for(const[a,b]of d.backboneEdges)this.scene.add(tube([[d.nodes[a].x,d.nodes[a].y,d.nodes[a].z],[d.nodes[b].x,d.nodes[b].y,d.nodes[b].z]],d.nodes[a].chain==='A'?theme.a:theme.b,.023));for(const[a,b]of d.contactEdges){const mesh=tube([[d.nodes[a].x,d.nodes[a].y,d.nodes[a].z],[d.nodes[b].x,d.nodes[b].y,d.nodes[b].z]],theme.c,.009);this.scene.add(mesh);this.guides.push(mesh);}}
  else if(topic==='foundations'){this.beads=new Beads(this.scene,36,theme,.055);for(let i=0;i<18;i++){const y=(i/17-.5)*2.7,z=.35*Math.sin(i*2.4),dest=.8*Math.sin(i*.9);const path=points(s=>[-1.9+3.8*s,(1-s)*y+s*dest+.5*Math.sin(s*Math.PI)*Math.sin(i),z+.3*Math.sin(s*Math.PI)]);this.guides.push(path);this.scene.add(tube(path,i%3===0?theme.b:theme.a,.014));}}
  else if(topic==='sampling'){this.sheets=[];for(let k=0;k<3;k++){const mesh=new T.Mesh(surfaceGeometry((u,v)=>[(u-.5)*3.7,-.6,(v-.5)*.4+(k-1)*1.1],64,5),material([theme.a,theme.b,theme.c][k]));this.scene.add(mesh);this.sheets.push(mesh);}}
  else{this.beads=new Beads(this.scene,18,theme,.065);this.sheets=[];for(let k=0;k<3;k++){const fn=(u,v)=>{const x=(u-.5)*3.2,z=(v-.5)*.5+(k-1)*1.1;return[x,-.2+.3*Math.tanh((x+.2*Math.sin(k))*2),z];},mesh=new T.Mesh(surfaceGeometry(fn,56,8),material([theme.a,theme.b,theme.c][k]));this.scene.add(mesh);this.sheets.push(mesh);}}
  this.update(0,0);
 }
 fit(w,h){
  if(!this.envelope){this.scene.updateMatrixWorld(true);const box=new T.Box3().setFromObject(this.scene),e={x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity};for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new T.Vector3(x,y,z).applyMatrix4(this.camera.matrixWorldInverse);e.x0=Math.min(e.x0,p.x);e.x1=Math.max(e.x1,p.x);e.y0=Math.min(e.y0,p.y);e.y1=Math.max(e.y1,p.y);}this.envelope=e;}
  const e=this.envelope,unit=Math.max((e.x1-e.x0)/w,(e.y1-e.y0)/h)*1.15,cx=(e.x0+e.x1)/2,cy=(e.y0+e.y1)/2;this.camera.left=cx-w*unit/2;this.camera.right=cx+w*unit/2;this.camera.top=cy+h*unit/2;this.camera.bottom=cy-h*unit/2;this.camera.updateProjectionMatrix();
 }
 update(t){this.elapsed=t;this.phase=cosinePhase(t);
  if(this.topic==='science'){this.scene.rotation.y=.12*Math.sin(t*.45);this.beads.update(this.nodes.map(n=>[n.x,n.y,n.z]),null,this.nodes.map(n=>n.chain==='A'?this.theme.a:this.theme.b));this.guides.forEach((g,i)=>g.material.color.set(new T.Color(this.theme.c).lerp(new T.Color(this.theme.b),(.5+.5*Math.sin(t*1.2+i*.3))*.5)));}
  else if(this.topic==='foundations'){const p=this.phase,at=(i,s)=>{const path=this.guides[i],q=s*(path.length-1),n=Math.floor(q),f=q-n;return path[n].map((x,j)=>x+(path[Math.min(n+1,path.length-1)][j]-x)*f);};this.beads.update(Array.from({length:36},(_,i)=>at(i%18,i<18?p:1-p)),null,Array(36).fill(this.theme.b));}
  else if(this.topic==='sampling'){this.sheets.forEach((mesh,k)=>{const beta=.42+k*1.15+.34*Math.sin(t*motionRate),density=x=>Math.exp(-beta*(x*x-1)**2);let norm=0;for(let i=0;i<256;i++)norm+=density(-1.85+(i+.5)*3.7/256)*3.7/256;updateSurface(mesh,(u,v)=>{const x=(u-.5)*3.7;return[x,-.6+density(x)/norm*1.45,(v-.5)*.4+(k-1)*1.1];});});}
  else{this.beads.update(Array.from({length:18},(_,i)=>{const k=i%3,base=-1.2+2.4*Math.floor(i/3)/5,x=base+.18*Math.sin(t*motionRate);return[x,-.2+.3*Math.tanh((x+.2*Math.sin(k))*2)+.067,(k-1)*1.1];}),null,Array(18).fill(this.theme.ink));}
 }
}
