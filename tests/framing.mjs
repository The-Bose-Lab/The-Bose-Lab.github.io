import assert from 'node:assert/strict';
import {T} from '../src/site/visual-primitives.js';
import {ResearchScene} from '../src/site/research-scenes.js';
import {ProcessScene} from '../src/site/process-scenes.js';
import {fitMotionEnvelope} from '../src/site/scene-framing.js';
import {getTheme} from '../src/site/config.js';
const p=new T.Vector3(),m=new T.Matrix4(),instance=new T.Matrix4();let maximum=0;
for(const[group,key]of[['foundations','sphere'],['foundations','torus'],['samplers','terrain'],['samplers','canopy'],['samplers','conditional']]){
 const model=fitMotionEnvelope(['sphere','terrain'].includes(key)?new ResearchScene(group,key,getTheme()):new ProcessScene(group,key,getTheme()));
 for(const[w,h]of[[160,144],[560,560],[184,160]]){
  model.fit(w,h);
  for(let t=0;t<=24;t+=.15){
   model.update(t,.15);model.scene.updateMatrixWorld(true);
   const check=(x,y,z,matrix)=>{p.set(x,y,z).applyMatrix4(matrix).project(model.camera);const extent=Math.max(Math.abs(p.x),Math.abs(p.y));maximum=Math.max(maximum,extent);assert(extent<.98,`${key} at ${t.toFixed(2)}s clipped: ${extent} (${w}×${h})`);};
   model.scene.traverse(o=>{if(!o.visible||!o.geometry)return;const g=o.geometry,a=g.attributes.position;if(!a)return;if(o.isInstancedMesh){g.computeBoundingBox();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);m.multiplyMatrices(o.matrixWorld,instance);for(const x of[g.boundingBox.min.x,g.boundingBox.max.x])for(const y of[g.boundingBox.min.y,g.boundingBox.max.y])for(const z of[g.boundingBox.min.z,g.boundingBox.max.z])check(x,y,z,m);}}else for(let i=0;i<a.count;i++)check(a.getX(i),a.getY(i),a.getZ(i),o.matrixWorld);});
  }
 }model.dispose();
}
console.log(`Full-motion framing passed for all five procedural visuals at three canvas aspect ratios; maximum projected extent ${maximum.toFixed(4)} < .98.`);
