import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {ProcessScene} from '../src/site/process-scenes.js';
import {ResearchScene} from '../src/site/research-scenes.js';
import {heroSpecimens,getTheme,openingMolecules} from '../src/site/config.js';
import {widgetChoices} from '../src/site/loading-widget.js';
import {ribbonPeriod} from '../src/site/conditional-ribbon.js';
import {selectVisit} from '../src/site/selection.js';
import {generate} from './generate.mjs';
async function files(dir){const result=[];for(const f of await readdir(dir)){const p=dir+'/'+f;(await stat(p)).isDirectory()?result.push(...await files(p)):result.push(p);}return result;}
for(const p of [...await files('src'),...await files('scripts')].filter(p=>/\.(m?js)$/.test(p)))execFileSync(process.execPath,['--check',p]);
assert.equal(Object.keys(heroSpecimens).length,8);assert.deepEqual(Object.keys(openingMolecules),['atcase','atpase','packing']);assert.deepEqual(widgetChoices,{ribbon:['ubiquitin','myoglobin','cofolding'],generative:['flow','geodesic','quantiles']});
for(let i=0;i<100;i++){const q=new URLSearchParams(),v=selectVisit(q);assert(v.hero in heroSpecimens);assert(widgetChoices[v.loader].includes(v.widget));}
assert.equal(createHash('sha256').update(await readFile('content/normalizing-flow-maps.html')).digest('hex'),'26ea4cc1fb7b65a8c855ba0cd648f146cc8bc769f724118144c9ca0921ad1b81','Original NFM article content changed');
const golden=JSON.parse(await readFile('tests/fixtures/approved-geometry.json','utf8'));let count=0;
for(const {group,key}of golden.frames.filter((f,i,a)=>a.findIndex(x=>x.key===f.key)===i)){
 const model=['sphere','terrain'].includes(key)?new ResearchScene(group,key,getTheme()):new ProcessScene(group,key,getTheme());
 for(const frame of golden.frames.filter(f=>f.key===key)){
  model.update(frame.time,.05);const arrays=[];model.scene.traverse(o=>{if(o.geometry?.attributes.position)for(const name of(o.isInstancedMesh?['instanceMatrix','instanceColor']:['position','color'])){const a=o.isInstancedMesh?o[name]:o.geometry.attributes[name];if(a)arrays.push(a.array);}});
  assert.equal(arrays.length,frame.arrays.length,key);frame.arrays.forEach((saved,i)=>{assert.equal(arrays[i].length,saved.length);saved.ids.forEach((j,k)=>{assert(Math.abs(arrays[i][j]-saved.values[k])<2e-6,`${key} at ${frame.time}: ${saved.name}[${j}] changed`);count++;});});
 }if(key==='conditional')assert.equal(model.playbackSpeed,1);model.dispose();
}
assert(Math.abs(ribbonPeriod-2*Math.PI/.55)<1e-10);
for(const base of ['/','/preview/']){
 const paths=await generate(base);assert.equal(paths.length,12);
 for(const path of paths){const html=await readFile(path,'utf8');assert(html.includes(`<base href="${base}">`));assert(!/site\.html|frame\.html|127\.0\.0\.1|shared-palette|design-panel/i.test(html),path);assert(html.includes('<h1'));
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){let url=m[1];if(/^(https?:|mailto:|data:)/.test(url))continue;if(url.startsWith(base))url=url.slice(base.length);else if(url.startsWith('/'))continue;url=url.replace(/^\.\//,'').split(/[?#]/)[0];if(!url)continue;const target=url.endsWith('/')?'.generated/'+url+'index.html':url.startsWith('src/')?url:'public/'+url;await stat(target);}
 }
}
await generate();
console.log(`Passed: 12 routes at root and /preview/, all local links/assets, 8 hero choices, 6 loaders, ${count} approved geometry/particle samples and ribbon timing.`);
