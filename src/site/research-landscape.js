import {motionRate} from './motion-clock.js';
import {openingMolecules} from './config.js';
import {SceneView,ResearchVisual} from './research-renderer.js';
import {LandscapeScene} from './landscape-scene.js?v=20261019-rim';
import {TopicDetailScene} from './detail-scenes.js';
import {openingProcesses} from './process-catalog.js';
import {topicContent} from './topic-content.js';
import {T} from './visual-primitives.js';
import {SamplingConformerScene} from './sampling-conformer-scene.js';
import {AtlasMolecularScene} from './atlas-molecular-scene.js';
const annotations={
 foundations:'Score-based models that turn noise into structure.',
 science:'Generative models for proteins, cofolding, and organic crystals.',
 sampling:'Learned samplers for molecular equilibria and unnormalised distributions.',
 safety:'Adversarial learning and the stability of generative models.'
};
const svgNS='http://www.w3.org/2000/svg';
export async function bindResearchLandscape(theme){
 const map=document.querySelector('#research-landscape'),detail=document.querySelector('#topic-visual');if(!map&&!detail)return;let main;
 if(detail){
  const topic=detail.dataset.topic;
  if(topic==='foundations'){
   const choices=openingProcesses.foundations,key=choices[Math.floor(Math.random()*choices.length)];main=new ResearchVisual(detail,'foundations',key,theme);detail.dataset.visual=key;detail.setAttribute('aria-label',main.name);
  }else{
   let model;if(topic==='science'){
    const choices=Object.keys(openingMolecules),key=choices[Math.floor(Math.random()*choices.length)],spec=openingMolecules[key],crystal=key==='packing';
    const [text,views,groups]=await Promise.all([fetch(`./assets/${spec.file}.${spec.format==='mmcif'?'cif':'pdb'}`).then(r=>r.text()),fetch('./assets/views.json').then(r=>r.json()),fetch('./assets/chain-groups.json').then(r=>r.json())]);
    const chainColours=Object.fromEntries((groups[spec.file]||[]).map((chain,i)=>[chain,[theme.a,theme.b,theme.c,theme.d][i%4]]));model=new AtlasMolecularScene(text,views[spec.file],theme,crystal,{format:spec.format,chainColours});detail.dataset.visual=key;detail.setAttribute('aria-label',spec.name);
   }
   else model=new TopicDetailScene(topic,theme);
   main=new SceneView(detail,model,theme,topic==='science'?detail.getAttribute('aria-label'):topicContent[topic].visual);
  }
  detail.dataset.ready='true';
 }
 if(map){
  const wrapper=map.closest('.landscape-overview'),peakNav=wrapper.querySelector('.landscape-peaks'),model=new LandscapeScene(theme),links=[...wrapper.querySelectorAll('.peak-link')],raycaster=new T.Raycaster();peakNav.style.visibility='hidden';
  main=new SceneView(map,model,theme,'Interactive research manifold: particle transport, alternating Boltzmann reweighting, molecular structures, and sequence-driven local geometry');map.style.position='absolute';main.canvas.style.pointerEvents='auto';
  const layer=document.createElement('div');layer.className='atlas-instance-layer';map.after(layer);
  const science=document.createElement('div');science.className='atlas-instance atlas-science-pair';layer.append(science);let scienceViews=[],scienceReady;
  let samplingViews=[],samplingReady;const conformers=document.createElement('div');conformers.className='atlas-sampling-conformers';layer.append(conformers);
  const prepareSampling=()=>samplingReady??=(async()=>{const data=await fetch('./assets/sampling-conformers.json').then(r=>r.json());for(let i=0;i<2;i++){const cell=document.createElement('div');cell.className='atlas-conformer';conformers.append(cell);const view=new SceneView(cell,new SamplingConformerScene(data,i,theme),theme,'ATP · '+(i?'bent':'extended')+' torsional conformation');cell.style.position='absolute';view.setActive(false);samplingViews.push(view);}place();})();
  const connectors=document.createElementNS(svgNS,'svg');connectors.classList.add('atlas-connectors');connectors.setAttribute('aria-hidden','true');layer.append(connectors);
  const connectorParts=[0,1].map(()=>{const path=document.createElementNS(svgNS,'path'),dots=[0,1].map(()=>document.createElementNS(svgNS,'circle'));path.setAttribute('fill','none');for(const dot of dots)dot.setAttribute('r','3.1');connectors.append(path,...dots);return{path,dots};});
  const safetyLink=links.find(link=>link.dataset.topic==='safety'),sequence=document.createElement('span');sequence.className='atlas-sequence';sequence.setAttribute('aria-hidden','true');sequence.setAttribute('aria-label','Illustrative sequence-dependent surface: F87 to A');layer.append(sequence);for(let i=0;i<9;i++)sequence.append(document.createElement('span'));for(const link of links)link.setAttribute('aria-label',link.textContent.trim());
  const annotation=wrapper.querySelector('.atlas-annotation'),annotationText=annotation.querySelector('p'),explore=annotation.querySelector('span');annotation.setAttribute('aria-hidden','true');
  function drawConnections(){
   const visible=model.hoverTopic==='science'&&scienceViews.length===2;connectors.classList.toggle('is-visible',visible);if(!visible)return;
   const box=map.getBoundingClientRect(),scale=map.clientWidth/box.width;connectors.setAttribute('viewBox',`0 0 ${map.clientWidth} ${map.clientHeight}`);
   scienceViews.forEach((view,i)=>{const q=view.model.connectorPoint(),r=view.container.getBoundingClientRect(),source=[(r.left+(q.x+1)*r.width/2-box.left)*scale,(r.top+(1-q.y)*r.height/2-box.top)*scale],[x,z]=i?[1.57,-.96]:[.76,-.92],p=new T.Vector3(x,model.height(x,z)+.02,z).project(model.camera),target=[(p.x+1)*map.clientWidth/2,(1-p.y)*map.clientHeight/2],part=connectorParts[i],bend=Math.min(24,Math.abs(target[1]-source[1])*.4);part.path.setAttribute('d',`M ${source[0]} ${source[1]} C ${source[0]} ${source[1]+bend},${target[0]} ${target[1]-bend},${target[0]} ${target[1]}`);[source,target].forEach((p,j)=>{part.dots[j].setAttribute('cx',p[0]);part.dots[j].setAttribute('cy',p[1]);});});
  }
  const prepareScience=()=>scienceReady??=(async()=>{const [protein,crystal,views]=await Promise.all([fetch('./assets/complex.pdb').then(r=>r.text()),fetch('./assets/aspirin-packing.pdb').then(r=>r.text()),fetch('./assets/views.json').then(r=>r.json())]);for(const [text,file,isCrystal]of [[protein,'complex',false],[crystal,'aspirin-packing',true]]){const cell=document.createElement('div');cell.className=isCrystal?'atlas-crystal':'atlas-protein';science.append(cell);const view=new SceneView(cell,new AtlasMolecularScene(text,views[file],theme,isCrystal),theme,isCrystal?'Aspirin crystal packing':'Barnase–barstar protein complex');cell.style.position='absolute';view.onDraw=drawConnections;scienceViews.push(view);}science.style.position='absolute';place();for(const view of scienceViews)view.setActive(model.hoverTopic==='science');science.classList.toggle('is-visible',model.hoverTopic==='science');drawConnections();})();
  let foundationLayoutKey='',foundationSweep=[],samplingFront=0;
  const sequenceAnchor=new T.Vector3(1.30,model.baseHeight(1.30,1.16)+.055,1.16);
  const project=id=>new T.Vector3(...model.peaks.find(p=>p.id===id).position).project(model.camera);
  const placeSampling=()=>{const beta=-3.2*Math.sin(model.samplingClock*motionRate),a=.62*Math.exp(-beta*.8),b=.38,total=a+b;samplingViews.forEach((view,i)=>{const x=i?-.35:-1.25,z=i?1.16:.90,q=new T.Vector3(x,model.height(x,z)+.045,z).project(model.camera);const tip=view.model.attachmentPoint();view.container.style.left=((q.x+1)*.5*map.clientWidth-tip.x*view.container.clientWidth/2)+'px';view.container.style.top=((1-q.y)*.5*map.clientHeight-(1-tip.y)*view.container.clientHeight/2-4*(innerWidth<=1020?map.clientWidth/900:1))+'px';const weight=Math.max(0,Math.min(1,((i?b:a)/total-.15)/.70));view.container.style.opacity=String(model.hoverTopic==='sampling'?model.focus.sampling*weight*weight*(3-2*weight):0);view.dirty=model.hoverTopic==='sampling';});};
  const place=()=>{const mobile=innerWidth<=1020,unit=mobile?map.clientWidth/900:1,p=project('science'),x=(p.x+1)*.5*map.clientWidth,y=(1-p.y)*.5*map.clientHeight;
   // All mobile annotations use the atlas coordinate scale, including sizes and gaps.
   if(mobile){
    for(const view of scienceViews){view.container.style.width=115*unit+'px';view.container.style.height=112*unit+'px';}
    for(const view of samplingViews){view.container.style.width=110*unit+'px';view.container.style.height=85*unit+'px';}
    sequence.style.fontSize=18*unit+'px';
   }else{for(const view of [...scienceViews,...samplingViews]){view.container.style.width='';view.container.style.height='';}sequence.style.fontSize='';}
   // Both specimens sit just above their own attachment on the Science slope.
   science.style.left=(mobile?0:x)+'px';science.style.top=(mobile?0:y-118)+'px';
   scienceViews.forEach((view,i)=>{const [sx,sz]=i?[1.57,-.96]:[.76,-.92],q=new T.Vector3(sx,model.baseHeight(sx,sz)+.02,sz).project(model.camera),groundX=(q.x+1)*map.clientWidth/2,groundY=(1-q.y)*map.clientHeight/2;
    const card=links.find(l=>l.dataset.topic==='science'),box=map.getBoundingClientRect(),scale=map.clientWidth/box.width,cardLeft=(card.getBoundingClientRect().left-box.left)*scale,half=view.container.clientWidth/2,centre=mobile?groundX+(i?52:-58)*unit:Math.min(groundX+(i?10:-50),cardLeft-half-16);view.container.style.left=(mobile?centre-half:centre-x+science.clientWidth/2-half)+'px';view.container.style.right='auto';view.container.style.top=(groundY-(mobile?0:y-118)-view.container.clientHeight-22*unit)+'px';view.container.style.bottom='auto';});
   placeSampling();
   const sp=sequenceAnchor.clone().project(model.camera),half=sequence.offsetWidth/2,box=map.getBoundingClientRect(),scale=map.clientWidth/box.width,cardLeft=(safetyLink.getBoundingClientRect().left-box.left)*scale,railInset=(map.clientWidth-map.closest('.content-main').clientWidth)/2;
   sequence.style.left=(mobile?(sp.x+1)*.5*map.clientWidth:Math.max(railInset+half,Math.min((sp.x+1)*.5*map.clientWidth,cardLeft-half-24)))+'px';sequence.style.top=((1-sp.y)*.5*map.clientHeight-sequence.offsetHeight/2)+'px';
   drawConnections();};

  const navigate=link=>{wrapper.classList.add('landscape-opening');const go=()=>{if(parent!==window)parent.postMessage({type:'site-navigation',page:'research',topic:link.dataset.topic},location.origin);else location.assign(link.href);};if(matchMedia('(prefers-reduced-motion:reduce)').matches)go();else setTimeout(go,240);};
  const show=id=>{
   if(id===model.hoverTopic)return;model.setHover(id);main.tick();wrapper.dataset.preview=id;for(const link of links)link.classList.toggle('is-preview',link.dataset.topic===id);
   science.classList.toggle('is-visible',id==='science'&&scienceViews.length>0);connectors.classList.toggle('is-visible',id==='science'&&scienceViews.length===2);for(const view of scienceViews)view.setActive(id==='science');sequence.classList.toggle('is-visible',id==='safety');sequence.setAttribute('aria-hidden',String(id!=='safety'));
   annotation.classList.toggle('is-visible',!!id);annotation.setAttribute('aria-hidden',String(!id));
   if(id){const link=links.find(link=>link.dataset.topic===id);annotationText.textContent=annotations[id];link.append(annotation);}
   for(const view of samplingViews){view.setActive(id==='sampling');if(id!=='sampling')view.container.style.opacity='0';}
   if(id==='science')prepareScience();if(id==='sampling')prepareSampling();place();
  };

  let layoutDirty=true;document.fonts.ready.then(()=>{layoutDirty=true;main.dirty=true;});
  main.onDraw=()=>{
   if(layoutDirty){
   const mapRect=map.getBoundingClientRect(),railRect=map.closest('.content-main').getBoundingClientRect(),railScale=map.clientWidth/mapRect.width,railLeft=(railRect.left-mapRect.left)*railScale,railRight=(railRect.right-mapRect.left)*railScale;
   peakNav.style.visibility='visible';for(const link of links){if(innerWidth<=1020){link.style.left='';link.style.top='';continue;}const p=project(link.dataset.topic),px=(p.x+1)*.5*map.clientWidth,py=(1-p.y)*.5*map.clientHeight;
    // Fixed outward callouts use horizontal room; their footprints never change on hover.
    const width=link.clientWidth,offset={foundations:[-width-90,-65],science:[145,-65],sampling:[-100,140],safety:[45,90]}[link.dataset.topic];
    let left=Math.max(0,Math.min(map.clientWidth-width,px+offset[0])),top=Math.max(8,Math.min((link.dataset.topic==='sampling'?map.parentElement.clientHeight:map.clientHeight)-link.clientHeight-4,py+offset[1]));
    if(link.dataset.topic==='foundations'&&innerWidth>1020){
     // Reserve the complete transport envelope, not just the stationary summit.
     const key=map.clientWidth+':'+map.clientHeight;if(key!==foundationLayoutKey){foundationLayoutKey=key;foundationSweep=[];for(let k=0;k<=32;k++)for(const {source:a,target:b}of model.cohort){const f=k/32,x=a[0]+(b[0]-a[0])*f,z=a[1]+(b[1]-a[1])*f,q=new T.Vector3(x,model.baseHeight(x,z)+.06,z).project(model.camera);foundationSweep.push([(q.x+1)*map.clientWidth/2,(1-q.y)*map.clientHeight/2]);}samplingFront=0;for(const beta of [-3.2,0,3.2])for(let x=-1.9;x<=.2;x+=.045)for(let z=.55;z<=1.65;z+=.045){const y=model.baseHeight(x,z)+model.samplingRelief(x,z,beta)-model.samplingRelief(x,z,0);if(y<.20)continue;const q=new T.Vector3(x,y,z).project(model.camera);samplingFront=Math.max(samplingFront,(1-q.y)*map.clientHeight/2);}}
     left=railLeft;top=Math.max(64,top);
     while(top>64&&foundationSweep.some(([x,y])=>x>left-15&&x<left+width+15&&y>top-15&&y<top+link.clientHeight+15))top=Math.max(64,top-2);
    }
    if(link.dataset.topic==='sampling'&&innerWidth>1020){const foundation=links.find(l=>l.dataset.topic==='foundations');left=railLeft;top=Math.max(parseFloat(foundation.style.top)+foundation.clientHeight+40,samplingFront+14);wrapper.style.paddingBottom=Math.max(0,top+link.clientHeight-map.clientHeight+24)+'px';}
    if(innerWidth>1020&&(link.dataset.topic==='science'||link.dataset.topic==='safety'))left=railRight-width;
    if(innerWidth>1020&&link.dataset.topic==='science')top=parseFloat(links.find(l=>l.dataset.topic==='foundations').style.top);
    if(innerWidth>1020&&link.dataset.topic==='safety'){const sampling=links.find(l=>l.dataset.topic==='sampling');top=parseFloat(sampling.style.top)+sampling.clientHeight-link.clientHeight;}
    const title=link.firstElementChild;link.style.setProperty('--pill-width',title.offsetWidth+'px');link.style.setProperty('--pill-height',title.offsetHeight+'px');
    link.style.left=left+'px';link.style.top=top+'px';}


   layoutDirty=false;place();}
   if(model.hoverTopic==='sampling')placeSampling();
   [...sequence.children].forEach((el,i)=>{el.textContent=model.sequence.letters[i];el.classList.toggle('is-edit',i===4);});main.canvas.dataset.lift=model.pointer.amplitude.toFixed(4);main.canvas.dataset.transport=model.transport.toFixed(3);main.canvas.dataset.samplingTilt=(-3.2*Math.sin(model.samplingClock*motionRate)).toFixed(3);main.active=model.needsFrame;
  };
  for(const link of links){link.addEventListener('pointerenter',()=>{model.setPointer(null);show(link.dataset.topic);main.tick();});link.addEventListener('focus',()=>show(link.dataset.topic));link.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();event.stopPropagation();navigate(link);});}
  const regionAt=event=>{const r=main.canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2),model.camera);const hit=raycaster.intersectObject(model.restSurface)[0];if(!hit||model.baseHeight(hit.point.x,hit.point.z)<-.22)return null;return{id:model.regionAt(hit.point.x,hit.point.z),point:hit.point};};
  main.canvas.addEventListener('pointermove',event=>{const hit=regionAt(event);if(hit)show(hit.id);main.canvas.style.cursor=hit?'pointer':'default';main.tick();});
  let pressed;main.canvas.addEventListener('pointerdown',event=>{pressed=[event.clientX,event.clientY];});main.canvas.addEventListener('click',event=>{if(pressed&&Math.hypot(event.clientX-pressed[0],event.clientY-pressed[1])>6)return;const hit=regionAt(event);if(hit)navigate(links.find(l=>l.dataset.topic===hit.id));});
  const release=()=>{model.setPointer(null);const focused=wrapper.querySelector('.peak-link:focus-visible');show(focused?.dataset.topic||'');main.tick();};main.canvas.addEventListener('pointerleave',()=>{model.setPointer(null);main.tick();});wrapper.addEventListener('pointerleave',release);wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))release();});addEventListener('resize',()=>{layoutDirty=true;main.dirty=true;});addEventListener('pagehide',e=>{if(!e.persisted)[...scienceViews,...samplingViews].forEach(v=>v.dispose());},{once:true});wrapper.dataset.ready='true';
 }
 addEventListener('pagehide',e=>{if(!e.persisted)main?.dispose();},{once:true});
}
