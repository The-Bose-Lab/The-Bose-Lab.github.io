import {visualSpeed} from './motion-clock.js';
import {fitMotionEnvelope} from './scene-framing.js';
import {ResearchOutline} from './research-outline.js';
import * as T from 'three';
import {ResearchScene} from './research-scenes.js';
import {ProcessScene} from './process-scenes.js';
import {memoVisuals} from './memo-config.js';
let manager;
// One renderer serves visible scientific canvases. All sizes share screen-space ink contours.
class RenderManager{
 constructor(){this.views=new Set();this.renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.setClearColor(0,0);this.renderer.setPixelRatio(1);this.last=performance.now();this.reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;this.raf=requestAnimationFrame(t=>this.draw(t));const redraw=()=>{this.last=performance.now();for(const view of this.views)view.dirty=true;};addEventListener('visibilitychange',redraw);addEventListener('pageshow',redraw);this.renderer.domElement.addEventListener('webglcontextrestored',redraw);addEventListener('pagehide',e=>{if(e.persisted)return;cancelAnimationFrame(this.raf);for(const v of this.views)v.outline?.dispose();this.renderer.dispose();},{once:true});}
 draw(now){
  this.raf=requestAnimationFrame(t=>this.draw(t));if(document.hidden||now-this.last<1000/30-.5)return;
  const elapsed=(now-this.last)/1000,dt=Math.min(.1,elapsed);this.last=now;
  const jobs=[];let maxWidth=1,maxHeight=1;
  for(const v of this.views){
   if((!v.active&&!v.dirty)||!v.container.isConnected)continue;
   const r=v.container.getBoundingClientRect();if(r.width<1||r.height<1||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
   const ratio=Math.min(3,Math.max(2,devicePixelRatio),Math.sqrt(4000000/(r.width*r.height))),w=Math.ceil(r.width*ratio),h=Math.ceil(r.height*ratio);
   if(v.canvas.width!==w||v.canvas.height!==h){v.canvas.width=w;v.canvas.height=h;v.model.setViewport?.(v.container.clientWidth,v.container.clientHeight);v.model.fit(w,h);v.dirty=true;}
   if((this.reduced||v.pose!=null)&&!v.dirty&&!v.model.needsFrame)continue;
   jobs.push({v,w,h,ratio});maxWidth=Math.max(maxWidth,w);maxHeight=Math.max(maxHeight,h);
  }
  if(!jobs.length)return;
  // One drawing buffer, enlarged once for the complete frame. Each view retains
  // its own outline targets, so different memo sizes never reallocate each other.
  if(this.renderer.domElement.width!==maxWidth||this.renderer.domElement.height!==maxHeight)this.renderer.setSize(maxWidth,maxHeight,false);
  const board=document.querySelector('#opening'),artScale=board?board.getBoundingClientRect().width/Number(board.dataset.artWidth||1440):1;
  for(const{v,w,h,ratio}of jobs){
   const speed=v.model.playbackSpeed??visualSpeed;v.clock=(v.clock??v.model.elapsed)+(v.active?elapsed*speed:0);
   v.model.update(v.pose??(this.reduced?3.4:v.clock),v.pose!=null||this.reduced||!v.active?0:dt*speed);
   this.renderer.setViewport(0,0,w,h);this.renderer.setScissor(0,0,w,h);this.renderer.setScissorTest(true);
   v.outline??=new ResearchOutline(this.renderer);v.outline.render(v.model.scene,v.model.camera,w,h,ratio*(v.container.closest('#opening')?artScale:1),v.theme);
   v.context.clearRect(0,0,w,h);v.context.drawImage(this.renderer.domElement,0,maxHeight-h,w,h,0,0,w,h);
   v.dirty=false;v.resolveFirstPaint?.();v.resolveFirstPaint=null;v.updateOverlay();v.onDraw?.();
   Object.assign(v.canvas.dataset,{physicalPixels:`${w}x${h}`,sampling:String(ratio),phase:(v.model.phase||0).toFixed(4),elapsed:v.model.elapsed.toFixed(3),outline:'shared-screen-space',particles:String(v.model.beads?.count||0),frame:String(v.frames=(v.frames||0)+1)});
  }
 }

}
export class SceneView{
 constructor(container,model,theme,name='Scientific visual'){this.container=container;this.theme=theme;this.model=model;this.active=true;this.name=name;this.mount();}
 mount(){this.ready=new Promise(resolve=>{this.resolveFirstPaint=resolve;});this.container.replaceChildren();this.canvas=document.createElement('canvas');this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label',this.name);this.canvas.style.cssText='width:100%;height:100%;display:block;pointer-events:none';this.container.append(this.canvas);this.overlay=document.createElement('div');this.overlay.className='scene-labels';this.overlay.style.cssText='position:absolute;inset:0;pointer-events:none';this.container.append(this.overlay);this.context=this.canvas.getContext('2d');this.dirty=true;this.container.style.position='relative';manager??=new RenderManager();manager.views.add(this);}
 updateOverlay(){this.overlay.hidden=this.container.getBoundingClientRect().width<280;const labels=this.model.labels||[];const state=this.model.sequenceDisplay;
  if(state){if(!this.sequence){this.sequence=document.createElement('div');this.sequence.className='enzyme-sequence';this.sequence.style.cssText='position:absolute;bottom:2%;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--body);color:var(--ink);white-space:nowrap;pointer-events:none';this.sequenceCaption=document.createElement('div');this.sequenceRow=document.createElement('div');this.sequenceRow.style.cssText='display:flex;gap:.12em;line-height:1.25';this.sequence.append(this.sequenceCaption,this.sequenceRow);this.container.append(this.sequence);}const width=this.container.getBoundingClientRect().width,scale=width/Math.max(1,this.container.clientWidth);const memo=!!this.container.closest('.memo');this.sequence.style.display=width<100&&!memo?'none':'flex';this.sequenceRow.style.fontSize=(memo?Math.max(11,Math.min(14,width*.13)):this.model.presentation==='pocket'?Math.max(7,Math.min(16,width*.10)):Math.max(14,Math.min(42,width*.080)))/scale+'px';this.sequenceCaption.style.fontSize=Math.max(10,Math.min(17,width*.033))/scale+'px';this.sequenceCaption.style.opacity='.76';this.sequenceCaption.hidden=width<250;const signature=state.letters+'|'+state.caption+'|'+state.status+'|'+(width<250);if(signature!==this.sequenceSignature){this.sequenceSignature=signature;this.sequenceCaption.textContent=width<250?state.caption:state.caption+' · '+state.status;this.sequenceRow.replaceChildren(...[...state.letters].map((letter,i)=>{const el=document.createElement('span');el.textContent=letter;el.style.opacity=i===state.active?'1':'.65';if(i===state.active)el.style.cssText='border-bottom:3px solid var(--b);font-weight:600;min-width:.7em;text-align:center;color:var(--ink)';return el;}));}}
  while(this.overlay.children.length<labels.length){const el=document.createElement('span');el.style.cssText='position:absolute;transform:translate(-50%,-50%);font:400 13px/1.2 var(--body);white-space:nowrap;color:var(--ink);text-shadow:0 1px 4px var(--bg)';this.overlay.append(el);}while(this.overlay.children.length>labels.length)this.overlay.lastChild.remove();labels.forEach((l,i)=>{const p=new T.Vector3(...l.position).project(this.model.camera),el=this.overlay.children[i];el.textContent=l.text;el.style.left=((p.x+1)*50)+'%';el.style.top=((1-p.y)*50)+'%';el.style.opacity=String(l.opacity??1);});}
 setPose(time){this.pose=time;this.dirty=true;}
 tick(){this.active=true;this.dirty=true;}
 setActive(active){if(active&&!this.active)this.dirty=true;this.active=active;}
 attach(container){this.container=container;container.append(this.canvas,this.overlay);if(this.sequence)container.append(this.sequence);container.style.position='relative';this.dirty=true;}
 dispose(){manager?.views.delete(this);this.outline?.dispose();this.model.dispose();this.canvas.remove();this.overlay.remove();this.sequence?.remove();}
}
export class ResearchVisual extends SceneView{
 constructor(container,group,key,theme){
  if(!(key in memoVisuals[group]))key=Object.keys(memoVisuals[group])[0];
  const model=['sphere','terrain'].includes(key)?new ResearchScene(group,key,theme):new ProcessScene(group,key,theme);
  super(container,fitMotionEnvelope(model),theme,memoVisuals[group][key].name);this.group=group;this.key=key;
 }
}
