import {getTheme} from './config.js';
import {loadingChoices,pick} from './selection.js';
import './page-loading.css';
let active=false,serial=0,widget,frame,prepareTimer;
const root=()=>document.querySelector('#page-loading');
export function beginPageLoading(){
 if(active||!root())return;active=true;const token=++serial,started=performance.now();
 document.documentElement.dataset.pageLoading='true';root().setAttribute('aria-hidden','false');
 // Fast text pages finish before this point and need no graphics download.
 prepareTimer=setTimeout(async()=>{
  const {LoadingWidget}=await import('./loading-widget.js');if(!active||token!==serial)return;
  const choices=window.molstar?loadingChoices:loadingChoices.filter(([family])=>family==='generative'),[kind,key]=pick(choices),view=new LoadingWidget(getTheme(),document.querySelector('#page-loading-widget'));
  widget=view;
  try{await view.prepare(kind,key);if(!active||token!==serial){view.dispose();return;}
   const draw=()=>{if(!active||token!==serial)return;view.draw(Math.min(1,(performance.now()-started)/750));frame=requestAnimationFrame(draw);};draw();
  }catch{view.dispose();}
 },100);
}
export function finishPageLoading(){
 active=false;serial++;clearTimeout(prepareTimer);cancelAnimationFrame(frame);document.documentElement.dataset.pageLoading='false';root()?.setAttribute('aria-hidden','true');widget?.dispose();widget=null;
}
export function bindPageLoading(){
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
  const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname&&url.search===location.search)return;
  beginPageLoading();
 });
 addEventListener('pageshow',event=>{if(event.persisted)finishPageLoading();});
}
