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

// The atlas camera must contain the complete rim and the full alternating relief.
// Mobile specimens are anchored to the same projected surface coordinates.
const {LandscapeScene}=await import('../src/site/landscape-scene.js');
const atlas=new LandscapeScene(getTheme());
atlas.setHover('foundations');atlas.update(.3,.03);
assert(atlas.particles.mesh.visible,'Foundations transport appears on selection');
assert.equal(atlas.particles.mesh.material.opacity,1,'Transport dots retain their ink colour');
for(const topic of['','safety','science','sampling']){
 atlas.setHover('foundations');atlas.setHover(topic);
 assert.equal(atlas.particles.mesh.visible,false,'Leaving Foundations removes dots before the next frame');
 atlas.update(.6,.03);assert.equal(atlas.particles.mesh.visible,false,'Settling the surface must not restore residual dots');
}
for(const width of[240,320,480,720,900]){
 const height=width*560/900,unit=width/900;atlas.setViewport(width,height);atlas.fit(width,height);
 const topTrim=Math.max(0,(atlas.camera.top-atlas.surfaceViewTop)/(atlas.camera.top-atlas.camera.bottom)*height-16);
 for(const topic of['sampling','safety']){
  atlas.setHover(topic);
  for(let t=0;t<=12;t+=.2){
   atlas.update(t,.2);const a=atlas.surface.geometry.attributes.position;
   for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).project(atlas.camera);assert(Math.max(Math.abs(p.x),Math.abs(p.y))<.98,`Atlas rim or ${topic} relief clipped at ${width}px`);assert((1-p.y)*height/2-topTrim>=0,`Compact atlas headroom clips ${topic} at ${width}px`);}
  }
 }
 for(const [i,x,z]of[[0,.76,-.92],[1,1.57,-.96]]){
  p.set(x,atlas.baseHeight(x,z)+.02,z).project(atlas.camera);
  const centre=(p.x+1)*width/2+(i?52:-58)*unit,top=(1-p.y)*height/2-(112+22)*unit;
  assert(centre-57.5*unit>=0&&centre+57.5*unit<=width&&top>=0,`Atlas science specimen clipped at ${width}px`);
 }
}
atlas.dispose();console.log('Complete atlas rim, alternating peaks, and attached specimens fit at 240–900px.');
