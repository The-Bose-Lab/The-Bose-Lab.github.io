import {ResearchVisual} from './research-renderer.js';
import {initHomeShell} from './site-home.js';
import {getTheme,heroSpecimens} from './config.js';
import {selectVisit} from './selection.js';
import {loadJSON,loadMolecularRenderer} from './assets.js';
import {Entrance} from './entrance.js';
import {MolecularMotion} from './molecular-motion.js';
import {MemoController} from './memo.js';
import {viewerOptions,illustrativeStyle,rendered,fitFootprint,trackResolution} from './molecular-view.js';
const q=new URLSearchParams(location.search),choice=selectVisit(q),specKey=choice.hero,spec=heroSpecimens[specKey],theme=getTheme(),html=document.documentElement;
q.set('story','1');q.set('transition','direct');q.set('copy','direct');
const capture=q.get('capture')==='1',skipEntrance=q.get('entrance')==='off',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
Object.assign(html.dataset,{actualSpecimen:specKey,capture:String(capture),skipEntrance:String(skipEntrance)});
Object.assign(document.body.dataset,{layout:'split',lettercase:'title',affiliation:'logo-only',grouping:'close'});
function fit(){
 const narrow=innerWidth<=700,stacked=narrow&&(innerHeight-76)*720/innerWidth>=860,portrait=innerHeight>innerWidth,w=stacked?720:1440,header=narrow?76:0,s=portrait?innerWidth/w:Math.min(innerWidth/w,(innerHeight-header)/900),h=stacked?Math.min(1400,(innerHeight-header)/s):900,board=document.querySelector('#opening');
 document.body.dataset.artLayout=stacked?'stacked':'split';board.dataset.artWidth=w;board.style.width=w+'px';board.style.height=h+'px';board.style.transform=`scale(${s})`;board.style.left=`${(innerWidth-w*s)/2}px`;
 const density=Math.max(0,Math.min(1,(h-900)/500)),heroSize=stacked?450+110*density:560,heroTop=stacked?350+220*density:170;
 Object.assign(board.dataset,{heroSize:String(heroSize),heroX:stacked?'360':'1080',heroY:String(stacked?heroTop+heroSize/2:450)});
 board.style.setProperty('--opening-title-y',(120+90*density)+'px');board.style.setProperty('--opening-sub-y',(280+115*density)+'px');board.style.setProperty('--opening-hero-y',heroTop+'px');board.style.setProperty('--opening-hero-size',heroSize+'px');
 const centred=header+(innerHeight-header-h*s)/2,openingTop=portrait?header+(innerHeight-header-h*s)*.35:centred,memoTop=portrait?Math.min(centred,(narrow?76:104)+24):centred;
 board.dataset.openingTop=openingTop;board.dataset.memoTop=memoTop;board.style.top=openingTop+'px';html.style.setProperty('--story-travel',(portrait?Math.min(innerHeight,Math.max(320,Math.min(680,h*s*.65))):innerHeight)+'px');html.style.setProperty('--page-art-scale',s);
}
addEventListener('resize',fit);fit();initHomeShell();
const entrance=new Entrance(theme,null,{loader:choice.loader,widget:choice.widget,reveal:'quiet',capture:capture||skipEntrance});entrance.begin();
let plugin,motion,memo,hero,loaded=false,onScreen=true,resolution;
function activate(){const active=loaded&&!capture&&!reduced&&onScreen&&!document.hidden&&html.dataset.state==='ready';motion?.setActive(active);hero?.setActive(active);if(memo)memo.onScreen=onScreen;}
const observer=new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;activate();});observer.observe(document.querySelector('#molecule'));
addEventListener('visibilitychange',activate);document.querySelector('#retry').onclick=()=>location.reload();
// Restoring a page from the back/forward cache must retain its live renderers.
addEventListener('pagehide',e=>{if(e.persisted)return;entrance.dispose();memo?.dispose();motion?.dispose();hero?.dispose();resolution?.dispose();observer.disconnect();plugin?.dispose();},{once:true});
try{
 const widgetReady=capture||skipEntrance||reduced?Promise.resolve():entrance.prepareWidget().catch(()=>{});
 let framing,fields;
 if(spec.process){
  hero=new ResearchVisual(document.querySelector('#molecule'),spec.process.group,spec.process.key,theme);hero.setActive(false);if(capture&&q.has('pose'))hero.setPose(Math.max(0,Number(q.get('pose'))||0));
 }else{
  await loadMolecularRenderer();entrance.stage(.3);
  const [bounds,groups,views,elastic]=await Promise.all(['bounds','chain-groups','views','elastic-modes'].map(loadJSON));fields=elastic;
  const viewer=await molstar.Viewer.create('molecule',viewerOptions(theme));plugin=viewer.plugin;resolution=trackResolution(plugin);
  const b=molstar.PluginExtensions.mvs.createBuilder();b.canvas({background_color:theme.bg});
  const st=b.download({url:new URL(`./assets/${spec.file}.${spec.format==='mmcif'?'cif':'pdb'}`,document.baseURI).href}).parse({format:spec.format||'pdb'}).modelStructure();
  const r=st.component({selector:specKey==='packing'?'all':'protein'}).representation({type:'spacefill',ignore_hydrogens:true,...(specKey==='packing'?{size_factor:.76}:{})});r.color({color:theme.a});
  if(specKey==='packing'){r.color({color:theme.c,selector:{type_symbol:'O'}});r.color({color:theme.d,selector:{type_symbol:'N'}});}
  else{(groups[spec.file]||[]).forEach((chain,i)=>r.color({color:[theme.a,theme.b,theme.c,theme.d][i%4],selector:spec.format==='mmcif'?{label_asym_id:chain}:{auth_asym_id:chain}}));st.component({selector:'ligand'}).representation({type:'spacefill',ignore_hydrogens:true,size_factor:1.05}).color({color:theme.b});}
  const p=bounds[spec.file],v=views[spec.file];b.camera({target:p.center,position:p.center.map((x,i)=>x+v.direction[i]*(p.radius+6)*3),up:v.up});
  await viewer.loadMvsData(b.getState(),'mvsj',{sanityChecks:true});entrance.stage(.8);
  const cells=await illustrativeStyle(plugin,theme,{large:spec.large});await rendered(plugin,3);
  framing=fitFootprint(plugin,cells,{box:{x:0,y:0,width:560,height:560},artWidth:560,artHeight:560,padding:specKey==='packing'?3.5:4,radius:p.radius});
  motion=new MolecularMotion(plugin,cells.map(c=>c.obj.data.repr),[],fields[spec.file],{capture:capture||reduced});motion.limitAmplitude(Math.min(2.2,Math.max(framing.width,framing.height)*.025));await rendered(plugin,1);
 }
 if(hero)await hero.ready;
 await document.fonts.ready;loaded=true;await entrance.finish();activate();
 memo=new MemoController(theme,specKey,q,plugin,framing,fields,hero);await memo.init();
 html.dataset.firstVisualReady=String(Math.round(performance.now()));
 if(!capture&&!reduced){const idle=()=>{if(window.molstar||navigator.connection?.saveData)return;const prefetch=document.createElement('link');prefetch.rel='prefetch';prefetch.as='script';prefetch.href='./vendor/molstar.js';document.head.append(prefetch);};if('requestIdleCallback'in window)requestIdleCallback(idle,{timeout:2500});else setTimeout(idle,1200);}
}catch(error){html.dataset.error=String(error);entrance.fail();console.error(error);}
