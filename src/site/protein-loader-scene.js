import {T,BaseScene,material} from './visual-primitives.js';
// Actual C-alpha backbones, prepared as lightweight ribbon geometry. Loading a
// small protein widget never requires booting a second molecular application.
export class ProteinLoaderScene extends BaseScene{
 constructor(text,view,theme){
  super(theme,{view:view.direction.map(v=>v*8)});this.camera.up.set(...view.up);this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();this.parts=[];
  const chains=new Map();for(const line of text.split('\n')){if(!line.startsWith('ATOM  ')||line.slice(12,16).trim()!=='CA'||![' ','A'].includes(line[16]))continue;const chain=line[21],points=chains.get(chain)||[];points.push(new T.Vector3(...[30,38,46].map(i=>Number(line.slice(i,i+8)))));chains.set(chain,points);}
  const all=[...chains.values()].flat(),box=new T.Box3().setFromPoints(all),centre=box.getCenter(new T.Vector3()),scale=3/box.getSize(new T.Vector3()).length();
  for(const [chain,raw]of chains){if(raw.length<3)continue;const points=raw.map(p=>p.sub(centre).multiplyScalar(scale)),curve=new T.CatmullRomCurve3(points,false,'centripetal'),steps=(points.length-1)*6,frames=curve.computeFrenetFrames(steps,false),positions=new Float32Array((steps+1)*6),indices=[];
   for(let i=0;i<=steps;i++){const p=curve.getPointAt(i/steps),side=frames.normals[i],width=scale*.95;for(let j=0;j<2;j++){const q=p.clone().addScaledVector(side,(j?1:-1)*width);q.toArray(positions,i*6+j*3);}if(i<steps){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,material(chain==='D'?theme.d:theme.a));this.scene.add(mesh);this.parts.push(mesh);
  }
  this.progress=1;this.update(0);
 }
 setProgress(p){this.progress=p;for(const mesh of this.parts)mesh.geometry.setDrawRange(0,Math.max(0,Math.floor(mesh.geometry.index.count*p/6)*6));}
 update(t){this.elapsed=t;}
}
