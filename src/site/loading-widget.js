import {loadMolecularRenderer} from './assets.js';
import {fitMotionEnvelope} from './scene-framing.js';
import {SceneView} from './research-renderer.js';
import {GenerativeLoaderScene} from './process-scenes.js';
import {generativeLoaders} from './process-catalog.js';
import {RibbonReveal} from './ribbon-reveal.js';
import{widgetSpecimens}from'./config.js';
import{viewerOptions,illustrativeStyle,rendered,fitFootprint,trackResolution}from'./molecular-view.js';
export const widgetChoices={ribbon:['ubiquitin','myoglobin','cofolding'],generative:Object.keys(generativeLoaders)};
export class LoadingWidget{
 constructor(theme){this.theme=theme;this.container=document.querySelector('#arrival-ribbon');this.key='';this.serial=0;this.reprs=[];}
 async prepare(kind,key){kind=kind in widgetChoices?kind:'ribbon';key=widgetChoices[kind].includes(key)?key:widgetChoices[kind][0];if(this.key===key&&this.kind===kind&&this.ready)return;this.key=key;this.kind=kind;this.ready=false;const serial=++this.serial;this.resolution?.dispose();this.viewer?.plugin.dispose();this.scientific?.dispose();this.scientific=null;this.viewer=null;this.reprs=[];this.container.replaceChildren();this.container.hidden=false;this.container.style.clipPath='none';this.container.style.opacity='0';const spec=widgetSpecimens[key];document.documentElement.dataset.widgetSpecimen=key;
  if(kind==='generative'){
   if(serial!==this.serial)return;
   const inner=document.createElement('div');inner.style.cssText='position:absolute;left:25%;top:13.6842%;width:50%;height:73.6842%';this.container.append(inner);
   const model=fitMotionEnvelope(new GenerativeLoaderScene(this.theme,{key}),{times:[0,.2,.4,.6,.8,1],progress:true});
   this.scientific=new SceneView(inner,model,this.theme,generativeLoaders[key].name);
   this.ready=true;this.container.style.opacity='1';document.documentElement.dataset.widgetReady='true';document.documentElement.dataset.widgetEnvelope='140';this.draw(this.progress||0);return;
  }
  await loadMolecularRenderer();if(serial!==this.serial)return;
  const viewer=await molstar.Viewer.create('arrival-ribbon',viewerOptions(this.theme));if(serial!==this.serial){viewer.plugin.dispose();return;}this.viewer=viewer;this.resolution=trackResolution(viewer.plugin);const [bounds,views]=await Promise.all([fetch('./assets/bounds.json').then(r=>r.json()),fetch('./assets/views.json').then(r=>r.json())]);if(serial!==this.serial)return;
  const b=molstar.PluginExtensions.mvs.createBuilder();b.canvas({background_color:this.theme.bg});const st=b.download({url:new URL(`./assets/${spec.file}.pdb`,document.baseURI).href}).parse({format:'pdb'}).modelStructure();
  const r=st.component({selector:'protein'}).representation({type:'cartoon'});r.color({color:this.theme.a});if(key==='cofolding')r.color({color:this.theme.d,selector:{auth_asym_id:'D'}});
  const p=bounds[spec.file];b.camera({target:p.center,position:p.center.map((v,k)=>v+views[spec.file].direction[k]*p.radius*3.45),up:views[spec.file].up});await viewer.loadMvsData(b.getState(),'mvsj',{sanityChecks:true});if(serial!==this.serial)return;const cells=await illustrativeStyle(viewer.plugin,this.theme);await rendered(viewer.plugin);fitFootprint(viewer.plugin,cells,{box:{x:70,y:26,width:140,height:140},artWidth:280,artHeight:190,padding:.25,radius:p.radius});await rendered(viewer.plugin,1);if(serial!==this.serial)return;this.reprs=cells.map(c=>c.obj.data.repr);this.ribbonReveal=new RibbonReveal(cells);this.ready=true;this.container.style.opacity='1';document.documentElement.dataset.widgetReady='true';document.documentElement.dataset.widgetEnvelope='140';this.draw(this.progress||0);
 }
 draw(progress){this.progress=Math.max(0,Math.min(1,progress));if(!this.ready)return;if(this.scientific){this.scientific.model.setProgress(this.progress);this.scientific.setPose(this.progress*6);return;}this.container.style.clipPath='none';this.ribbonReveal.draw(this.progress);this.viewer.plugin.canvas3d.update(undefined,true);this.viewer.plugin.canvas3d.requestDraw();
 }
 dispose(){this.scientific?.dispose();this.serial++;this.resolution?.dispose();this.viewer?.plugin.dispose();}
}
