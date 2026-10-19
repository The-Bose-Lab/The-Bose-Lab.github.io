import {fitMotionEnvelope} from './scene-framing.js';
import {SceneView} from './research-renderer.js';
import {GenerativeLoaderScene} from './process-scenes.js';
import {generativeLoaders} from './process-catalog.js';
import {ProteinLoaderScene} from './protein-loader-scene.js';
import {widgetSpecimens} from './config.js';
import {loadJSON} from './assets.js';
export const widgetChoices={ribbon:['ubiquitin','myoglobin','cofolding'],generative:Object.keys(generativeLoaders)};
export class LoadingWidget{
 constructor(theme,container=document.querySelector('#arrival-ribbon')){this.theme=theme;this.container=container;this.serial=0;}
 async prepare(kind,key){
  kind=kind in widgetChoices?kind:'ribbon';key=widgetChoices[kind].includes(key)?key:widgetChoices[kind][0];const serial=++this.serial;this.ready=false;this.lastProgress=null;this.scientific?.dispose();this.container.replaceChildren();this.container.hidden=false;this.container.style.cssText+=';clip-path:none;opacity:0;transition:opacity 220ms ease';this.kind=kind;this.key=key;document.documentElement.dataset.widgetSpecimen=key;
  let model,name;
  if(kind==='generative'){model=new GenerativeLoaderScene(this.theme,{key});name=generativeLoaders[key].name;}
  else{const spec=widgetSpecimens[key],[text,views]=await Promise.all([fetch(`./assets/${spec.file}.pdb`).then(r=>r.text()),loadJSON('views')]);if(serial!==this.serial)return;model=new ProteinLoaderScene(text,views[spec.file],this.theme);name=spec.name;}
  if(serial!==this.serial){model.dispose();return;}
  const inner=document.createElement('div');inner.style.cssText='position:absolute;left:25%;top:13.6842%;width:50%;height:73.6842%';this.container.append(inner);
  this.scientific=new SceneView(inner,fitMotionEnvelope(model,{times:kind==='generative'?[0,.2,.4,.6,.8,1]:[1],progress:true}),this.theme,name);this.scientific.setActive(false);this.draw(0);await this.scientific.ready;if(serial!==this.serial)return;
  this.ready=true;this.container.style.opacity='1';document.documentElement.dataset.widgetReady='true';document.documentElement.dataset.widgetEnvelope='140';
 }
 draw(progress){this.progress=Math.max(0,Math.min(1,progress));if(!this.scientific||this.lastProgress===this.progress)return;this.lastProgress=this.progress;this.scientific.model.setProgress(this.progress);this.scientific.setPose(this.progress*6);}
 dispose(){this.serial++;this.scientific?.dispose();this.scientific=null;}
}
