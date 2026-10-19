import {memoMetrics,terrainContourStyle} from './memo-metrics.js';
import * as T from 'three';
import {sphericalCohort,spherePoint,loopPhase,transportPhase,landscapeEnergy,heightFromEnergy,colourFromEnergy} from './research-models.js';
const V=p=>new T.Vector3(...p);
const STEPS=80;
const luminance=hex=>{const c=new T.Color(hex);return .2126*c.r+.7152*c.g+.0722*c.b;};
export function sphereParticleColour(theme){const a=luminance(theme.a),contrast=c=>{const b=luminance(c);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);};return[theme.b,theme.c,theme.ink,theme.bg].reduce((best,c)=>contrast(c)>contrast(best)?c:best,theme.ink);}

function material(color){return new T.MeshStandardMaterial({color,roughness:1,metalness:0,side:T.DoubleSide});}
function strip(scene,color,width=.026){const g=new T.BufferGeometry(),p=new Float32Array((STEPS+1)*6),indices=[];for(let i=0;i<STEPS;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}g.setAttribute('position',new T.BufferAttribute(p,3));g.setIndex(indices);const m=new T.Mesh(g,material(color));scene.add(m);return {g,p,m,width};}
function updateStrip(r,fn){for(let i=0;i<=STEPS;i++){const s=i/STEPS,p=fn(s),a=fn(Math.max(0,s-.002)),b=fn(Math.min(1,s+.002)),d=V(b).sub(V(a)).normalize(),side=new T.Vector3(...(r.axis||[0,0,1])).cross(d).normalize().multiplyScalar(r.width/2);for(let j=0;j<2;j++){r.p[i*6+j*3]=p[0]+side.x*(j?1:-1);r.p[i*6+j*3+1]=p[1]+side.y*(j?1:-1);r.p[i*6+j*3+2]=p[2]+side.z*(j?1:-1);}}r.g.attributes.position.needsUpdate=true;r.g.computeVertexNormals();r.g.computeBoundingSphere();}
class Beads{
 constructor(scene,count,theme,radius=.048){this.count=count;this.radius=radius;const geo=new T.SphereGeometry(1,24,16);this.mesh=new T.InstancedMesh(geo,material(0xffffff),count);this.edge=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:theme.outline||(theme.mode==='dark'?theme.bg:theme.ink),side:T.FrontSide,depthWrite:false}),count);this.edge.renderOrder=1;this.mesh.renderOrder=2;this.edge.visible=false;this.edge.userData.skipOutline=true;scene.add(this.edge,this.mesh);this.dummy=new T.Object3D();for(let i=0;i<count;i++)this.mesh.setColorAt(i,new T.Color(i%7===0?theme.c:i%3===0?theme.b:theme.a));this.mesh.instanceColor.needsUpdate=true;}
 update(points){points.forEach((p,i)=>{this.dummy.position.set(...p);const radius=this.radii?.[i]??this.radius;this.dummy.scale.setScalar(radius);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);this.dummy.scale.setScalar(radius+(this.edgePadding||radius*.10));this.dummy.updateMatrix();this.edge.setMatrixAt(i,this.dummy.matrix);});this.mesh.instanceMatrix.needsUpdate=true;this.edge.instanceMatrix.needsUpdate=true;this.mesh.computeBoundingSphere();this.edge.computeBoundingSphere();}
}
export class ResearchScene{
 constructor(group,key,theme){this.group=group;this.key=key;this.theme=theme;this.scene=new T.Scene();this.scene.add(new T.AmbientLight(0xffffff,2.2));const sun=new T.DirectionalLight(0xffffff,1);this.sun=sun;sun.position.set(-3,6,5);this.scene.add(sun);this.camera=new T.OrthographicCamera(-3,3,2,-2,.1,100);this.camera.position.set(...(group==='samplers'?[3.4,4,5.4]:[0,1.05,6]));this.camera.lookAt(0,group==='samplers'?-.18:0,0);this.camera.updateMatrixWorld();this.bounds=group==='samplers'?[[-1.95,-1.2,-1.45],[1.95,1.1,1.45]]:[[-1.95,-1.3,-.8],[1.95,1.45,.9]];this.cohort=[];this.elapsed=0;this.strips=[];this.paths=[];if(group==='samplers')this.buildTerrain();else this.buildSphere();this.camera.updateMatrixWorld();const right=new T.Vector3().setFromMatrixColumn(this.camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(this.camera.matrixWorld,1),direction=new T.Vector3().setFromMatrixColumn(this.camera.matrixWorld,2);this.sun.position.copy(right.multiplyScalar(-3).add(up.multiplyScalar(6)).add(direction.multiplyScalar(5)));this.update(0,0);this.measureEnvelope();}
 measureEnvelope(){
  if(this.group==='foundations'){this.envelope={x0:-1.26,x1:1.26,y0:-1.26,y1:1.26};return;}
  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;const include=(point,r=0)=>{const v=V(point).applyMatrix4(this.camera.matrixWorldInverse);x0=Math.min(x0,v.x-r);x1=Math.max(x1,v.x+r);y0=Math.min(y0,v.y-r);y1=Math.max(y1,v.y+r);};
  if(this.group==='samplers'){for(let t=0;t<9;t+=.25)for(const [x,z]of this.base)include([x,heightFromEnergy(landscapeEnergy(x,z,t,this.key)),z],.025);}
  this.envelope={x0:x0-.035,x1:x1+.035,y0:y0-.035,y1:y1+.035};
 }
 fit(width,height){const e=this.envelope,m=memoMetrics,bodyHeight=this.group==='safety'?m.sequenceHeight:m.box.height,box={x:m.box.x/m.slotWidth*width,y:m.box.y/m.slotHeight*height,width:m.box.width/m.slotWidth*width,height:bodyHeight/m.slotHeight*height},units=Math.max((e.x1-e.x0)/box.width,(e.y1-e.y0)/box.height),cx=(e.x0+e.x1)/2-((box.x+box.width/2)-width/2)*units,cy=(e.y0+e.y1)/2-(height/2-(box.y+box.height/2))*units;this.camera.left=cx-width*units/2;this.camera.right=cx+width*units/2;this.camera.top=cy+height*units/2;this.camera.bottom=cy-height*units/2;this.camera.updateProjectionMatrix();}
 buildSphere(){
  this.sphereGroup=new T.Group();this.scene.add(this.sphereGroup);const parent=this.sphereGroup;
  this.cohort=sphericalCohort(210);this.beads=new Beads(parent,210,this.theme,.036);this.beads.edge.visible=true;this.beads.edgePadding=.006;
  parent.add(new T.Mesh(new T.SphereGeometry(1.165,96,64),material(this.theme.a)));
  this.graticules=[];const lineMat=new T.MeshBasicMaterial({color:this.theme.outline||(this.theme.mode==='dark'?this.theme.bg:this.theme.ink),transparent:true,opacity:.8});
  const curve=fn=>{const points=Array.from({length:193},(_,i)=>V(fn(i/192))),g=new T.TubeGeometry(new T.CatmullRomCurve3(points,false),192,.005,5,false),grid=new T.Mesh(g,lineMat);grid.userData.skipOutline=true;parent.add(grid);this.graticules.push(points);};
  for(const lat of [-Math.PI/3,-Math.PI/6,0,Math.PI/6,Math.PI/3])curve(s=>[1.168*Math.cos(lat)*Math.cos(s*2*Math.PI),1.168*Math.sin(lat),1.168*Math.cos(lat)*Math.sin(s*2*Math.PI)]);
  for(let k=0;k<6;k++)curve(s=>{const a=s*2*Math.PI,l=k*Math.PI/6;return[1.168*Math.sin(a)*Math.cos(l),1.168*Math.cos(a),1.168*Math.sin(a)*Math.sin(l)];});
  this.particleColour=sphereParticleColour(this.theme);this.cohort.forEach((p,i)=>this.beads.mesh.setColorAt(i,new T.Color(this.particleColour)));this.beads.mesh.instanceColor.needsUpdate=true;this.guides=[];
 }
 updateGuide({particle,tube}){
  tube.visible=this.phase>.02;if(!tube.visible)return;
  const a=tube.geometry.attributes.position.array,A=new T.Vector3(),B=new T.Vector3(),D=new T.Vector3(),radial=new T.Vector3(),binormal=new T.Vector3();
  for(let i=0;i<=64;i++){const t=this.phase*i/64,p=spherePoint(particle,t);A.fromArray(spherePoint(particle,Math.max(0,t-.0001)));B.fromArray(spherePoint(particle,Math.min(1,t+.0001)));D.subVectors(B,A).normalize();radial.fromArray(p).normalize();binormal.crossVectors(D,radial).normalize();
   for(let j=0;j<=5;j++){const angle=j/5*Math.PI*2;for(let k=0;k<3;k++)a[(i*6+j)*3+k]=p[k]+.005*(radial.getComponent(k)*Math.cos(angle)+binormal.getComponent(k)*Math.sin(angle));}
  }tube.geometry.attributes.position.needsUpdate=true;tube.geometry.computeVertexNormals();tube.geometry.computeBoundingSphere();
 }
 buildTerrain(){
  this.nx=80;this.nz=56;const geom=new T.BufferGeometry(),positions=new Float32Array((this.nx+1)*(this.nz+1)*3),colors=new Float32Array(positions.length),indices=[];this.base=[];
  for(let j=0;j<=this.nz;j++)for(let i=0;i<=this.nx;i++){const u=i/this.nx*2-1,v=j/this.nz*2-1;this.base.push([1.8*u*Math.sqrt(1-v*v*.27),1.3*v*Math.sqrt(1-u*u*.27)]);}
  for(let j=0;j<this.nz;j++)for(let i=0;i<this.nx;i++){const a=j*(this.nx+1)+i,b=a+1,c=a+this.nx+1,d=c+1;indices.push(a,c,b,b,c,d);}
  geom.setAttribute('position',new T.BufferAttribute(positions,3));geom.setAttribute('color',new T.BufferAttribute(colors,3));geom.setIndex(indices);const mat=material(this.theme.a);mat.vertexColors=true;mat.color.set(0xffffff);this.surface=new T.Mesh(geom,mat);this.scene.add(this.surface);this.geo=geom;this.colors=[new T.Color(this.theme.b),new T.Color(this.theme.a),new T.Color(this.theme.c),new T.Color(this.theme.c).lerp(new T.Color(this.theme.b),.28)];
  this.contourArray=new Float32Array(90000);this.contour=new T.InstancedMesh(new T.CylinderGeometry(terrainContourStyle.radius,terrainContourStyle.radius,1,8,1,true),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:terrainContourStyle.opacity,depthWrite:false}),15000);this.contour.userData.skipOutline=true;this.contour.count=0;this.contourDummy=new T.Object3D();this.scene.add(this.contour);
  this.perimeter=strip(this.scene,this.theme.outline||(this.theme.mode==='dark'?this.theme.bg:this.theme.ink),.024);this.perimeter.axis=[0,1,0];this.perimeter.m.visible=false; // The shared contour pass draws the rim once.

 }
 updateTerrain(t,dt){const positions=this.geo.attributes.position.array,colors=this.geo.attributes.color.array,E=[];const c=new T.Color();for(let i=0;i<this.base.length;i++){const [x,z]=this.base[i],e=landscapeEnergy(x,z,t,this.key),a=colourFromEnergy(e);E.push(e);positions[i*3]=x;positions[i*3+1]=heightFromEnergy(e);positions[i*3+2]=z;const band=Math.min(2,Math.floor(a*3));c.copy(this.colors[band]).lerp(this.colors[band+1],a*3-band);c.toArray(colors,i*3);}
  this.geo.attributes.position.needsUpdate=true;this.geo.attributes.color.needsUpdate=true;this.geo.computeVertexNormals();this.geo.computeBoundingSphere();
  // Contours intersect the exact same triangles used by the visible mesh.
  let count=0;const index=this.geo.index.array;for(const level of [-1.2,-.6,0,.6,1.2])for(let j=0;j<index.length;j+=3){const ids=[index[j],index[j+1],index[j+2]],hits=[];for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],ea=E[a]-level,eb=E[b]-level;if((ea<0)===(eb<0))continue;const u=ea/(ea-eb),A=this.base[a],B=this.base[b];hits.push([A[0]+(B[0]-A[0])*u,heightFromEnergy(level)+.008,A[1]+(B[1]-A[1])*u]);}if(hits.length===2){this.contour.setColorAt(count/6,new T.Color(this.theme.ink));for(const point of hits){this.contourArray.set(point,count);count+=3;}}}
  this.contour.count=count/6;const A=new T.Vector3(),B=new T.Vector3(),D=new T.Vector3(),axis=new T.Vector3(0,1,0);for(let i=0;i<count/6;i++){A.fromArray(this.contourArray,i*6);B.fromArray(this.contourArray,i*6+3);D.subVectors(B,A);const length=D.length();this.contourDummy.position.copy(A).add(B).multiplyScalar(.5);this.contourDummy.quaternion.setFromUnitVectors(axis,D.normalize());this.contourDummy.scale.set(1,length,1);this.contourDummy.updateMatrix();this.contour.setMatrixAt(i,this.contourDummy.matrix);}this.contour.instanceMatrix.needsUpdate=true;this.contour.instanceColor.needsUpdate=true;this.contour.computeBoundingSphere();
  updateStrip(this.perimeter,s=>{const f=Math.min(3.999999,s*4),side=Math.floor(f),q=f-side,[u,v]=[[-1+2*q,-1],[1,-1+2*q],[1-2*q,1],[-1,1-2*q]][side],x=1.8*u*Math.sqrt(1-v*v*.27),z=1.3*v*Math.sqrt(1-u*u*.27);return[x,heightFromEnergy(landscapeEnergy(x,z,t,this.key))+.006,z];});

 }
 update(time,dt){this.elapsed=time;this.phase=this.group==='foundations'?transportPhase(time):loopPhase(time);if(this.group==='samplers')this.updateTerrain(time,dt);else if(this.group==='foundations'){this.beads.update(this.cohort.map(p=>spherePoint(p,this.phase)));for(const guide of this.guides)this.updateGuide(guide);this.sphereGroup.rotation.set(.38,time*.32,0);this.sphereGroup.updateMatrixWorld(true);}}
 dispose(){this.scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
}
