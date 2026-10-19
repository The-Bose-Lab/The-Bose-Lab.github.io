import {loadMolecularRenderer,loadJSON} from './assets.js';
import {visualSpeed} from './motion-clock.js';
import {memoMetrics} from './memo-metrics.js';
import {specimens,heroSpecimens} from './config.js';
import {memoCopies,memoDefaults,memoTransitions,memoVisuals} from './memo-config.js';
import {MolecularMotion} from './molecular-motion.js';
import {ResearchVisual,SceneView} from './research-renderer.js';
import {viewerOptions,illustrativeStyle,rendered,fitFootprint,trackResolution,frameFootprintBox} from './molecular-view.js';
const clamp=x=>Math.max(0,Math.min(1,x));
// Memo-only rotation: a fixed pivot and full-turn envelope prevent sideways
// drift and zoom pumping. Frame one's approved framing is returned unchanged.
const rotationEnvelopes=new WeakMap();
export function memoPose(fr,time,amount=1){
 if(amount===0)return fr;
 const a=Math.atan2(Math.sin(time*.7),Math.cos(time*.7))*amount,c=Math.cos(a),s=Math.sin(a),u=fr.up,d=fr.direction,cross=[u[1]*d[2]-u[2]*d[1],u[2]*d[0]-u[0]*d[2],u[0]*d[1]-u[1]*d[0]],uDotD=u.reduce((v,x,k)=>v+x*d[k],0),direction=d.map((x,k)=>x*c+cross[k]*s+u[k]*uDotD*(1-c));
 let envelope=rotationEnvelopes.get(fr);
 if(!envelope){let horizontal=0,vertical=0;
  for(let i=0;i<fr.points.length;i+=3){const p=[0,1,2].map(k=>fr.points[i+k]-fr.centre[k]),y=p.reduce((v,x,k)=>v+x*u[k],0);vertical=Math.max(vertical,Math.abs(y));horizontal=Math.max(horizontal,Math.sqrt(Math.max(0,p.reduce((v,x)=>v+x*x,0)-y*y)));}
  envelope={width:horizontal*2,height:vertical*2};rotationEnvelopes.set(fr,envelope);
 }
 return{...fr,...envelope,direction,centre:fr.centre,padding:fr.padding+1.2};
}
const companionBox=container=>{const sx=container.clientWidth/memoMetrics.slotWidth,sy=container.clientHeight/memoMetrics.slotHeight,b=memoMetrics.box;return{x:b.x*sx,y:b.y*sy,width:b.width*sx,height:b.height*sy};};
const smooth=x=>(x=clamp(x),x*x*(3-2*x));
export class MemoController {
 constructor(theme,specKey,query,plugin,framing,fields,heroGraphic=null){this.heroGraphic=heroGraphic;this.fields=fields;this.plugin=plugin;this.framing=framing;
  this.drawCheck=this.plugin?.canvas3d?.didDraw.subscribe(()=>{if(!this.hero||this.progress<.99)return;const c=this.plugin.canvas3d.camera,p=c.project([0,0,0,0],this.poseCentre||this.framing.centre);document.documentElement.dataset.heroRenderedCentre=JSON.stringify([parseFloat(this.hero.style.left||800)+p[0]/c.viewport.width*560,parseFloat(this.hero.style.top||170)+560-p[1]/c.viewport.height*560]);});
  this.theme=theme;this.specKey=specKey;this.query=query;this.options={...memoDefaults};
  for(const key of ['protein','crystal','foundations','samplers','safety'])if(query.has(key))this.options[key]=query.get(key);
  this.progress=0;this.target=query.get('scene')==='memo'?1:0;this.serial=0;this.visuals=[];
  this.el=document.querySelector('#memo');this.board=document.querySelector('#opening');this.hero=document.querySelector('#molecule');this.copy=document.querySelector('.copy');this.wordmark=document.querySelector('header .wordmark');
  this.heroKind=heroGraphic?(heroSpecimens[specKey].process.group==='science'?'protein':heroSpecimens[specKey].process.group):specimens[specKey].crystal||['packing','sheet'].includes(specKey)?'crystal':'protein';if(heroGraphic&&this.heroKind!=='protein')this.options[this.heroKind]=heroSpecimens[specKey].process.key;
  this.brandClick=e=>{e.preventDefault();this.go(0);};this.wordmark.addEventListener('click',this.brandClick);
  document.body.dataset.story='true';this.el.hidden=false;this.el.setAttribute('aria-hidden','true');
  this.stage=document.querySelector('#story-stage');
  this.scroll=()=>{const length=this.stage.offsetHeight-innerHeight;this.target=clamp(scrollY/Math.max(1,length));};
  if(this.stage){addEventListener('scroll',this.scroll,{passive:true});if(query.get('scene')==='memo'&&scrollY<=1)this.go(1);this.scroll();}
  else{this.wheel=e=>{if(document.documentElement.dataset.state!=='ready')return;e.preventDefault();this.go(this.target+e.deltaY/950);};addEventListener('wheel',this.wheel,{passive:false});}
  this.scrollLength=this.stage?this.stage.offsetHeight-innerHeight:0;
  this.resize=()=>{if(this.stage){const length=this.stage.offsetHeight-innerHeight;if(this.scrollLength>0&&scrollY<=this.scrollLength+1)window.scrollTo({top:scrollY/this.scrollLength*length,behavior:'instant'});this.scrollLength=length;}this.scroll?.();this.measure();this.compose();};addEventListener('resize',this.resize);
  this.reduced=query.get('capture')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches;
 }
 async init(){
  try{await this.configure(this.options);this.ready=true;document.documentElement.dataset.memoReady='true';this.animate(performance.now());dispatchEvent(new Event('memo-scene-ready'));if(parent!==window)parent.postMessage({type:'memo-ready'},location.origin);}
  catch(error){document.documentElement.dataset.memoError=String(error);console.error(error);}
 }
 buildCopy(){
  for(const v of this.visuals)v.dispose();this.visuals=[];const copy=memoCopies.direct;this.options.copy='direct';this.el.replaceChildren();this.slots={};
  for(const [index,parts]of copy.lines.entries()){
   const row=document.createElement('div');row.className='memo-line';row.dataset.row=index;
   for(const part of parts){let node;
    if(['protein','crystal',...Object.keys(memoVisuals)].includes(part)){node=document.createElement('div');node.className='memo-slot '+part;node.setAttribute('role','img');node.setAttribute('aria-label',part==='protein'?'Protein structure':part==='crystal'?'Organic crystal packing':part);this.slots[part]=node;}
    else{node=document.createElement('span');node.className='memo-phrase';node.dataset.final=part;node.textContent=part;}
    row.append(node);
   }this.el.append(row);
  }
  this.el.dataset.lines=copy.lines.length;document.documentElement.dataset.memoOptions=JSON.stringify(this.options);this.pendingVisuals=Object.keys(memoVisuals).filter(group=>!this.heroGraphic||group!==this.heroKind);
 } 
 async prepareVisuals(){
  const groups=this.pendingVisuals;this.pendingVisuals=null;
  for(const group of groups){
   let view;
   if(group==='safety'){const{BindingScene}=await import('./binding-scene.js');view=new SceneView(this.slots[group],new BindingScene('mutation',this.theme),this.theme,'P450 · Sequence and Structure');}
   else view=new ResearchVisual(this.slots[group],group,this.options[group],this.theme);
   if(this.query.get('capture')==='1'&&this.query.has('pose'))view.setPose(Number(this.query.get('pose'))||0);
   view.setActive(this.progress>.65);this.visuals.push(view);
  }

 }
 async configure(values){
  Object.assign(this.options,values);this.options.transition='direct';if(this.heroGraphic&&this.heroKind!=='protein')this.options[this.heroKind]=heroSpecimens[this.specKey].process.key;
  for(const group of Object.keys(memoVisuals))if(!(this.options[group] in memoVisuals[group]))this.options[group]=memoDefaults[group];
  this.buildCopy();await document.fonts.ready;this.measure();this.compose();
  this.companionPending=true;
 }
 measure(){
  if(!this.slots?.[this.heroKind])return;
  // Keep the first specimen below the shared responsive header on short viewports.
  const boardBox=this.board.getBoundingClientRect(),artScale=boardBox.width/Number(this.board.dataset.artWidth||1440),headerBottom=document.querySelector('#home-header').getBoundingClientRect().bottom,firstSlotTop=210+(120-memoMetrics.slotHeight)/2,lastSlotBottom=210+3*120+(120+memoMetrics.slotHeight)/2,wanted=(headerBottom+16-boardBox.top)/artScale-firstSlotTop,available=(innerHeight-16-boardBox.top)/artScale-lastSlotBottom;this.el.style.setProperty('--memo-header-offset',Math.max(0,Math.min(wanted,available))+'px');
  // Fit the actual mixed text / fixed-size object rows, including monospaced styles.
  if(document.body.dataset.artLayout==='stacked')this.el.style.setProperty('--memo-local-top',Math.max(24,Math.min(120,this.board.clientHeight-this.el.offsetHeight-24))+'px');
  let lo=36,hi=64;for(let i=0;i<9;i++){const size=(lo+hi)/2;this.el.style.setProperty('--memo-size',size+'px');const width=Math.max(...[...this.el.children].map(el=>el.scrollWidth));if(width>1232)hi=size;else lo=size;}this.el.style.setProperty('--memo-size',Math.floor(lo*10)/10+'px');
  const board=this.board.getBoundingClientRect(),slot=this.slots[this.heroKind].getBoundingClientRect(),scale=board.width/Number(this.board.dataset.artWidth||1440);
  this.destination={x:(slot.left+slot.width/2-board.left)/scale,y:(slot.top+slot.height/2-board.top)/scale,scale:Math.min(slot.width,slot.height)/scale/560};
  this.phrases=[...this.el.querySelectorAll('.memo-phrase')];
  const origin=this.board.getBoundingClientRect(),factor=origin.width/Number(this.board.dataset.artWidth||1440);this.clearanceBoxes=[...this.el.children].map(row=>[...row.children].filter(el=>el!==this.slots[this.heroKind]).map(el=>{const r=el.getBoundingClientRect(),inset=el.classList.contains('memo-slot')?.1:0;return{left:(r.left-origin.left+r.width*inset)/factor,right:(r.right-origin.left-r.width*inset)/factor,top:(r.top-origin.top+r.height*inset)/factor,bottom:(r.bottom-origin.top-r.height*inset)/factor};}));
  const bottom=Math.max(...[...this.el.querySelectorAll('.memo-phrase,.memo-slot')].map(el=>el.getBoundingClientRect().bottom)),targetBottom=bottom-this.board.getBoundingClientRect().top+Number(this.board.dataset.memoTop),overlap=Math.max(0,innerHeight-targetBottom-24);
  this.tailOverlap=overlap;document.body.dataset.adaptiveTail=String(overlap>0);
 }
 async prepareCompanion(){
  await loadMolecularRenderer();this.fields??=await loadJSON('elastic-modes');
  const serial=++this.serial;for(const c of this.companions||[]){c.motion.dispose();c.resolution.dispose();c.viewer.plugin.dispose();}this.companions=[];
  const kinds=this.heroGraphic?['protein','crystal'].filter(k=>k!==this.heroKind):[this.heroKind==='protein'?'crystal':'protein'];
  const [bounds,views]=await Promise.all(['bounds','views'].map(k=>fetch(`./assets/${k}.json`).then(r=>r.json())));
  for(const kind of kinds){
   const key=this.options[kind],allowed=kind==='protein'?['cofolding','myoglobin']:['packing'],spec=specimens[allowed.includes(key)?key:memoDefaults[kind]],container=this.slots[kind];container.id='memo-companion-'+kind;container.replaceChildren();
   const viewer=await molstar.Viewer.create(container.id,viewerOptions(this.theme));if(serial!==this.serial){viewer.plugin.dispose();return;}const resolution=trackResolution(viewer.plugin);
   const b=molstar.PluginExtensions.mvs.createBuilder();b.canvas({background_color:this.theme.bg});const st=b.download({url:new URL(`./assets/${spec.file}.${spec.format==='mmcif'?'cif':'pdb'}`,document.baseURI).href}).parse({format:spec.format||'pdb'}).modelStructure();
   const r=st.component({selector:kind==='protein'?'protein':'all'}).representation({type:'spacefill',ignore_hydrogens:true,size_factor:kind==='crystal'?.76:1});r.color({color:this.theme.a});
   if(kind==='crystal'){r.color({color:this.theme.c,selector:{type_symbol:'O'}});r.color({color:this.theme.d,selector:{type_symbol:'N'}});}
   else{r.color({color:this.theme.d,selector:{auth_asym_id:'D'}});st.component({selector:'ligand'}).representation({type:'spacefill',ignore_hydrogens:true,size_factor:1.05}).color({color:this.theme.c});}
   const p=bounds[spec.file],v=views[spec.file];b.camera({target:p.center,position:p.center.map((x,i)=>x+v.direction[i]*p.radius*3.45),up:v.up});await viewer.loadMvsData(b.getState(),'mvsj',{sanityChecks:true});if(serial!==this.serial){viewer.plugin.dispose();return;}
   const cells=await illustrativeStyle(viewer.plugin,this.theme);viewer.plugin.canvas3d.setProps({postprocessing:{outline:{name:'on',params:{scale:1,threshold:.45,color:parseInt((this.theme.outline||(this.theme.mode==='dark'?this.theme.bg:this.theme.ink)).slice(1),16),includeTransparent:false}}}});await rendered(viewer.plugin,2);
   const framing=fitFootprint(viewer.plugin,cells,{artWidth:memoMetrics.slotWidth,artHeight:memoMetrics.slotHeight,box:memoMetrics.box,padding:1.8,radius:p.radius});const motion=new MolecularMotion(viewer.plugin,cells.map(c=>c.obj.data.repr),[],this.fields[spec.file],{capture:this.reduced,report:false});motion.limitAmplitude(Math.min(2.2,p.radius*.045));container.setAttribute('aria-label',spec.name);container.dataset.ready='true';this.companions.push({viewer,resolution,framing,motion,kind,container});
  }
 }

 go(value){this.target=clamp(Number(value));if(this.stage)window.scrollTo({top:this.target*(this.stage.offsetHeight-innerHeight),behavior:'instant'});}
 control(data){if(data.command==='replay'){if(data.reveal)this.query.set('reveal',data.reveal);this.target=this.progress=0;this.go(0);this.compose();}if(data.command==='scene')this.go(data.progress);if(data.command==='memo-options'){if(!this.ready){Object.assign(this.options,data.options);return;}this.configQueue=(this.configQueue||Promise.resolve()).then(()=>this.configure(data.options)).then(()=>{if(parent!==window)parent.postMessage({type:'memo-ready'},location.origin);}).catch(error=>{document.documentElement.dataset.memoError=String(error);});}}
 compose(){
  if(!this.destination)return;const p=this.progress;this.board.style.top=(Number(this.board.dataset.openingTop)+(Number(this.board.dataset.memoTop)-Number(this.board.dataset.openingTop))*smooth(p))+'px';document.documentElement.style.setProperty('--memo-tail-overlap',(this.tailOverlap*smooth((p-.35)/.65))+'px');const portrait=innerHeight>innerWidth,move=portrait?smooth(p/.65):this.options.transition==='settle'?smooth((p-.16)/.74):smooth(p),d=this.destination,scale=1+(d.scale-1)*move;
  const start={x:Number(this.board.dataset.heroX),y:Number(this.board.dataset.heroY)},bend=this.options.transition==='arc'?-Math.sin(move*Math.PI)*160:0,x=start.x+(d.x-start.x)*move,y=start.y+(d.y-start.y)*move-bend;
  this.hero.style.transform='none';const startSize=Number(this.board.dataset.heroSize||560),size=this.reduced?(p>.5?d.scale*560:startSize):startSize+(d.scale*560-startSize)*move;
  const cx=this.reduced?(p>.5?d.x:start.x):x,cy=this.reduced?(p>.5?d.y:start.y):y;
  if(this.heroGraphic){this.hero.style.width=size+'px';this.hero.style.height=size+'px';this.hero.style.left=(cx-size/2)+'px';this.hero.style.top=(cy-size/2)+'px';this.hero.style.position='absolute';}else{const outlineScale=1;if(this.outlineScale!==outlineScale){this.plugin.canvas3d.setProps({postprocessing:{outline:{name:'on',params:{scale:outlineScale,threshold:.45,color:parseInt((this.theme.outline||(this.theme.mode==='dark'?this.theme.bg:this.theme.ink)).slice(1),16),includeTransparent:false}}}});this.outlineScale=outlineScale;}const half=this.hero.clientWidth/2;this.hero.style.left=(cx-half)+'px';this.hero.style.top=(cy-half)+'px';const pose=this.reduced?this.framing:memoPose(this.framing,this.motionTime||0,smooth((p-.8)/.2));this.poseCentre=pose.centre;frameFootprintBox(this.plugin,pose,{x:half-size/2,y:half-size/2,width:size,height:size});}
  this.copy.style.opacity=String(1-smooth(p/.32));this.copy.style.transform=`translateY(${-smooth(p/.4)*14}px)`;
  document.body.dataset.researchNavigation='true';this.el.style.pointerEvents='none';const brand=smooth((p-.3)/.4);this.wordmark.style.opacity=String(brand);this.wordmark.style.pointerEvents=brand>.9?'auto':'none';this.wordmark.setAttribute('aria-hidden',String(brand<.5));this.wordmark.tabIndex=brand>.9?0:-1;
  this.copy.setAttribute('aria-hidden',String(p>.4));this.el.setAttribute('aria-hidden',String(p<.4));
  const starts=this.el.children.length===5?[.32,.44,.83,.85,.81]:[.44,.83,.85,.81];
  const rowAlpha=index=>{if(portrait){const boxes=this.clearanceBoxes[index],gap=Math.min(...boxes.map(b=>Math.max(b.left-(cx+size/2),(cx-size/2)-b.right,b.top-(cy+size/2),(cy-size/2)-b.bottom))),clear=Math.max(smooth(gap/24),smooth((p-.88)/.1));return smooth((p-.30-index*.025)/.22)*clear;}const start=this.options.transition==='direct'?.72+index*.022:starts[index],duration=index<2?.23:1-start;const a=smooth((p-start)/duration);return this.options.transition==='settle'?Math.max(a,smooth((p-.15)/.3)*.2):a;};
  for(const row of this.el.children){const index=Number(row.dataset.row),a=rowAlpha(index);row.style.setProperty('--row-opacity',a);row.style.setProperty('--row-y',`${(1-a)*8}px`);}
  // The hero slot never fades: it is the same live canvas throughout the move.
  for(const [kind,el]of Object.entries(this.slots))if(kind!==this.heroKind)el.style.opacity=String(rowAlpha(Number(el.parentElement.dataset.row)));
  const html=document.documentElement;html.dataset.storyProgress=p.toFixed(3);html.dataset.storyFrame=p>.98?'memo':p<.02?'opening':'transition';html.dataset.heroSlot=this.heroKind;
 }
 animate(now){if(this.disposed)return;const rawDt=Math.min(.2,(now-(this.last||now))/1000),dt=Math.min(.05,rawDt);this.last=now;const before=this.progress;this.progress+= (this.target-this.progress)*(1-Math.exp(-dt*13));if(Math.abs(this.target-this.progress)<.0002)this.progress=this.target;
  if(this.pendingVisuals&&this.progress>.12)this.prepareVisuals().catch(error=>{document.documentElement.dataset.memoError=String(error);});
  if(this.companionPending&&this.progress>.12){this.companionPending=false;this.prepareCompanion().then(()=>{this.measure();this.compose();}).catch(error=>{document.documentElement.dataset.memoError=String(error);});}
  const active=this.progress>.65&&!document.hidden&&this.onScreen!==false&&!this.reduced;this.motionTime=(this.motionTime||0)+(active&&this.progress>.995&&this.target===1?rawDt*visualSpeed:0);document.documentElement.dataset.memoRotation=((this.motionTime*.7)%(Math.PI*2)).toFixed(3);if(before!==this.progress||this.lastPosted===undefined||active)this.compose();this.heroGraphic?.setActive(!document.hidden&&this.onScreen!==false);for(const c of this.companions||[]){c.motion.setActive(active);if(active){frameFootprintBox(c.viewer.plugin,memoPose(c.framing,this.motionTime),companionBox(c.container));c.container.dataset.motion='elastic-and-complete-turn';}}for(const v of this.visuals)v.setActive(this.progress>.65&&!document.hidden&&this.onScreen!==false);
  if(this.lastPosted!==this.progress){this.lastPosted=this.progress;if(parent!==window)parent.postMessage({type:'story-progress',progress:this.progress,target:this.target},location.origin);}
  this.raf=requestAnimationFrame(t=>this.animate(t));
 }
 dispose(){this.disposed=true;this.wordmark.removeEventListener('click',this.brandClick);this.drawCheck?.unsubscribe();for(const v of this.visuals)v.dispose();this.serial++;cancelAnimationFrame(this.raf);for(const c of this.companions||[]){c.motion.dispose();c.resolution.dispose();c.viewer.plugin.dispose();}removeEventListener('scroll',this.scroll);removeEventListener('wheel',this.wheel);removeEventListener('keydown',this.key);removeEventListener('touchstart',this.touchStart);removeEventListener('touchmove',this.touchMove);removeEventListener('resize',this.resize);}
}
