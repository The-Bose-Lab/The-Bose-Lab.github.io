import {getTheme} from './config.js';
import {loadingChoices,pick} from './selection.js';
import './page-loading.css';
let active=false,serial=0,widget,frame,timer,started=0,navigation=0;
const root=()=>document.querySelector('#page-loading');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function beginPageLoading({outgoing=false}={}){
 if(active||!root())return;active=true;const token=++serial;started=performance.now();
 document.documentElement.dataset.pageLoading='true';root().setAttribute('aria-hidden','false');
 if(outgoing)return;
 // Text pages never wait for a graphics import or a demonstration animation.
 timer=setTimeout(async()=>{
  const {LoadingWidget}=await import('./loading-widget.js');if(!active||token!==serial)return;
  const [kind,key]=pick(loadingChoices),view=new LoadingWidget(getTheme(),document.querySelector('#page-loading-widget'));widget=view;
  try{await view.prepare(kind,key);if(!active||token!==serial){view.dispose();return;}
   view.started=performance.now();const draw=()=>{if(!active||token!==serial)return;const p=Math.min(1,(performance.now()-view.started)/500);view.draw(p*p*(3-2*p));frame=requestAnimationFrame(draw);};draw();
  }catch{view.dispose();}
 },250);
}
export async function finishPageLoading({immediate=false}={}){
 const token=serial;clearTimeout(timer);
 if(!immediate)await delay(Math.max(0,widget?.started?500-(performance.now()-widget.started):90-(performance.now()-started)));
 if(token!==serial)return;active=false;serial++;cancelAnimationFrame(frame);document.documentElement.dataset.pageLoading='false';root()?.setAttribute('aria-hidden','true');
 const old=widget;widget=null;if(immediate)old?.dispose();else setTimeout(()=>old?.dispose(),200);
}
export function navigatePage(url){beginPageLoading({outgoing:true});const ticket=++navigation;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ticket===navigation)location.assign(url);}));}
export function bindPageLoading(){
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
  const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;
  event.preventDefault();navigatePage(url.href);
 });
 addEventListener('pageshow',event=>{if(event.persisted)finishPageLoading({immediate:true});});
}
