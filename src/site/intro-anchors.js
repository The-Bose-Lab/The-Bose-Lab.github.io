const ease=t=>t*t*(3-2*t);

// Only the two opening frames own gestures. News and the rest of the site
// retain normal scrolling; one continuous trackpad burst advances one frame.
export class IntroAnchors{
 constructor({viewport=window,document:doc=document,stops,enabled=()=>true,reduced=false}){
  Object.assign(this,{w:viewport,doc,stops,enabled,reduced});this.lastWheel=-Infinity;
  this.wheel=e=>{
   if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!this.available())return;
   const now=this.w.performance.now(),fresh=now-this.lastWheel>180;this.lastWheel=now;
   if(fresh){this.wheelUsed=false;this.wheelDelta=0;}
   const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?this.w.innerHeight:1),target=this.next(Math.sign(delta));
   if(target===null&&!this.busy)return;
   e.preventDefault();if(this.busy||this.wheelUsed)return;
   this.wheelDelta+=delta;if(Math.abs(this.wheelDelta)<10)return;
   this.wheelUsed=true;this.move(target);
  };
  this.touchstart=e=>{this.touch=null;if(!this.available()||e.touches.length!==1)return;const p=e.touches[0];this.touch={x:p.clientX,y:p.clientY,used:false};};
  this.touchmove=e=>{
   if(!this.touch||e.touches.length!==1)return;const p=e.touches[0],dy=this.touch.y-p.clientY,dx=this.touch.x-p.clientX;
   if(Math.abs(dx)>Math.abs(dy))return;
   const target=this.next(Math.sign(dy));if(target===null&&!this.busy&&!this.touch.used)return;
   e.preventDefault();if(this.busy||this.touch.used||Math.abs(dy)<12)return;
   this.touch.used=true;this.move(target);
  };
  this.touchend=()=>{this.touch=null;};
  this.key=e=>{
   if(!this.available()||e.altKey||e.ctrlKey||e.metaKey||e.target?.closest?.('a,button,input,textarea,select,[contenteditable]'))return;
   const direction=['ArrowDown','PageDown',' '].includes(e.key)?(e.shiftKey?-1:1):['ArrowUp','PageUp'].includes(e.key)?-1:0;
   if(!direction)return;const target=this.next(direction);if(target===null&&!this.busy)return;
   e.preventDefault();if(!this.busy&&!e.repeat)this.move(target);
  };
  for(const [type,fn]of[['wheel',this.wheel],['touchstart',this.touchstart],['touchmove',this.touchmove],['touchend',this.touchend],['touchcancel',this.touchend],['keydown',this.key]])this.w.addEventListener(type,fn,{passive:!['wheel','touchmove','keydown'].includes(type)});
 }
 available(){return this.enabled()&&this.doc.body.dataset.navOpen!=='true';}
 next(direction){
  if(!direction)return null;const [opening,memo,news]=this.stops(),y=this.w.scrollY,tolerance=12;
  if(y>news+tolerance)return null;
  if(direction>0)return y<memo-tolerance?memo:y<news-tolerance?news:null;
  return y>memo+tolerance?memo:y>opening+tolerance?opening:null;
 }
 move(target){
  if(target===null)return;this.busy=true;const from=this.w.scrollY,start=this.w.performance.now(),duration=this.reduced?0:440;
  const step=now=>{const p=duration?Math.min(1,(now-start)/duration):1;this.w.scrollTo({top:from+(target-from)*ease(p),behavior:'instant'});if(p<1)this.raf=this.w.requestAnimationFrame(step);else this.unlock=this.w.setTimeout(()=>{this.busy=false;},this.reduced?0:180);};
  this.raf=this.w.requestAnimationFrame(step);
 }
 dispose(){this.w.cancelAnimationFrame(this.raf);this.w.clearTimeout(this.unlock);for(const [type,fn]of[['wheel',this.wheel],['touchstart',this.touchstart],['touchmove',this.touchmove],['touchend',this.touchend],['touchcancel',this.touchend],['keydown',this.key]])this.w.removeEventListener(type,fn);}
}

export function bindIntroAnchors(memo){
 const navigation=new IntroAnchors({reduced:memo.reduced,enabled:()=>document.documentElement.dataset.ready==='true',stops:()=>{
  const release=memo.stage.offsetHeight-innerHeight,heading=document.querySelector('#latest .section-heading'),header=document.querySelector('#home-header'),overlap=parseFloat(document.documentElement.style.getPropertyValue('--memo-tail-overlap'))||0;
  const news=heading.getBoundingClientRect().top+scrollY+overlap-memo.tailOverlap-header.getBoundingClientRect().height-24;
  return[0,release,Math.max(release+1,news)];
 }});
 addEventListener('pagehide',e=>{if(!e.persisted)navigation.dispose();},{once:true});return navigation;
}
