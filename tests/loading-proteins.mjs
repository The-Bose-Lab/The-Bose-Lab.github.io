import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ProteinLoaderScene} from '../src/site/protein-loader-scene.js';
import {widgetSpecimens,getTheme} from '../src/site/config.js';
import {fitMotionEnvelope} from '../src/site/scene-framing.js';
const views=JSON.parse(await readFile('public/assets/views.json','utf8'));
for(const spec of Object.values(widgetSpecimens)){
 const model=fitMotionEnvelope(new ProteinLoaderScene(await readFile(`public/assets/${spec.file}.pdb`,'utf8'),views[spec.file],getTheme()),{times:[1],progress:true});
 assert(model.parts.length>0,spec.name);assert(Object.values(model.motionEnvelope).every(Number.isFinite));
 for(const progress of [0,.25,.5,.75,1]){model.setProgress(progress);for(const mesh of model.parts){assert.equal(mesh.geometry.drawRange.count,Math.floor(mesh.geometry.index.count*progress/6)*6);assert([...mesh.geometry.attributes.position.array].every(Number.isFinite));}}
 model.dispose();
}
console.log('All three lightweight protein loaders contain finite deposited backbones and complete, continuous construction ranges.');
