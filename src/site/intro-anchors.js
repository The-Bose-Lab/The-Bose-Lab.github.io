const ease=t=>t*t*(3-2*t);
const captures=new Set(['wheel','touchstart','touchmove','touchend','touchcancel','click']);
const inputEvents=['wheel','touchstart','touchmove','touchend','touchcancel','keydown','click','resize'];

// One gesture chooses an anchor; one clock drives both scroll and scene progress.
// Reversals interrupt immediately. Only uninterrupted, same-direction momentum
// is consumed, so a new gesture never waits for an animation lock to expire.
export class IntroAnchors{
 constructor({viewport=window,document:doc=document,stops,enabled=()=>true,reduced=false,onPosition=()=>{}}){
  Object.assign(this,{w:viewport,doc,stops,enabled,reduced,onPosition});this.lastWheel=-Infinity;this.width=this.w.innerWidth;this.height=this.w.innerHeight;
  this.wheel=e=>{
   if(e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!this.available())return;
   const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?this.w.innerHeight:1),direction=Math.sign(delta);if(!direction)return;
   const now=this.w.performance.now(),fresh=direction!==this.wheelDirection||now-this.lastWheel>110;this.lastWheel=now;
   if(fresh){this.wheelUsed=false;this.wheelDelta=0;this.wheelDirection=direction;}
   const target=this.targetFor(direction,fresh);if(target===null)return;
   e.preventDefault();if(this.wheelUsed)return;
   this.wheelDelta+=delta;if(Math.abs(this.wheelDelta)<10)return;
   this.wheelUsed=true;this.move(target);
  };
  this.touchstart=e=>{this.touch=null;if(!this.available()||e.touches.length!==1)return;const p=e.touches[0];if(e.target?.closest?.('a,button,input,textarea,select'))return;this.touch={x:p.clientX,y:p.clientY,used:false};};
  this.touchmove=e=>{
   if(!this.touch||e.touches.length!==1)return;const p=e.touches[0],dy=this.touch.y-p.clientY,dx=this.touch.x-p.clientX;this.touch.dy=dy;if(Math.abs(dx)>Math.abs(dy))return;
   const target=this.targetFor(Math.sign(dy),true);if(target===null&&!this.touch.used)return;
   e.preventDefault();if(this.touch.used||Math.abs(dy)<4)return;
   this.touch.used=true;this.move(target);
  };
  this.touchend=()=>{if(this.touch&&!this.touch.used&&Math.abs(this.touch.dy||0)>=2)this.move(this.targetFor(Math.sign(this.touch.dy),true));this.touch=null;};
  this.key=e=>{
   if(['Home','End','Escape'].includes(e.key)){this.cancel();return;}
   if(!this.available()||e.altKey||e.ctrlKey||e.metaKey||e.target?.closest?.('a,button,input,textarea,select,[contenteditable]'))return;
   const direction=['ArrowDown','PageDown',' '].includes(e.key)?(e.shiftKey?-1:1):['ArrowUp','PageUp'].includes(e.key)?-1:0;if(!direction)return;
   const target=this.targetFor(direction,true);if(target===null)return;e.preventDefault();if(!e.repeat)this.move(target);
  };
  this.click=e=>{if(e.target?.closest?.('a,button,input,textarea,select'))this.cancel();};
  this.resize=()=>{if(this.width===this.w.innerWidth&&(this.height===this.w.innerHeight||this.width<=700||this.w.matchMedia?.('(pointer:coarse)').matches))return;this.width=this.w.innerWidth;this.height=this.w.innerHeight;const moving=this.busy;this.cancel();if(moving){const y=this.w.scrollY;this.move(this.stops().reduce((a,b)=>Math.abs(y-a)<Math.abs(y-b)?a:b));}};
  this.handlers={wheel:this.wheel,touchstart:this.touchstart,touchmove:this.touchmove,touchend:this.touchend,touchcancel:()=>{this.touch=null;},keydown:this.key,click:this.click,resize:this.resize};
  for(const type of inputEvents)this.w.addEventListener(type,this.handlers[type],{passive:!['wheel','touchmove','keydown'].includes(type),capture:captures.has(type)});
 }
 available(){return this.enabled()&&this.doc.body.dataset.navOpen!=='true';}
 next(direction,y=this.w.scrollY){
  if(!direction)return null;const [opening,memo,news]=this.stops(),tolerance=Math.min(12,(memo-opening)/3,(news-memo)/3);if(y>news+tolerance)return null;
  if(direction>0)return y<memo-tolerance?memo:y<news-tolerance?news:null;
  return y>memo+tolerance?memo:y>opening+tolerance?opening:null;
 }
 targetFor(direction,fresh){if(this.busy&&fresh){if(direction===this.motionDirection)return this.next(direction,this.destination);return this.next(direction)??this.stops()[direction>0?2:0];}return this.next(direction);}
 cancel(){this.w.cancelAnimationFrame(this.raf);this.busy=false;this.destination=null;}
 move(target){
  if(target===null)return;this.cancel();const from=this.w.scrollY,distance=target-from;if(Math.abs(distance)<.5){this.w.scrollTo({top:target,behavior:'auto'});this.onPosition();return;}
  this.busy=true;this.destination=target;this.motionDirection=Math.sign(distance);const start=this.w.performance.now(),duration=this.reduced?0:Math.max(160,Math.min(380,380*Math.abs(distance)/Math.max(1,this.stops()[1])));
  const step=now=>{const p=duration?Math.min(1,(now-start)/duration):1;this.w.scrollTo({top:from+distance*ease(p),behavior:'auto'});this.onPosition();if(p<1)this.raf=this.w.requestAnimationFrame(step);else{this.busy=false;this.destination=null;}};
  this.raf=this.w.requestAnimationFrame(step);
 }
 dispose(){this.cancel();for(const type of inputEvents)this.w.removeEventListener(type,this.handlers[type],{capture:captures.has(type)});}
}

export function bindIntroAnchors(memo){
 memo.directScroll=true;
 const navigation=new IntroAnchors({reduced:memo.reduced,enabled:()=>document.documentElement.dataset.ready==='true',onPosition:()=>{memo.scroll();memo.progress=memo.target;memo.compose();},stops:()=>{
  const release=memo.stage.offsetHeight-memo.viewportHeight,heading=document.querySelector('#latest .section-heading'),header=document.querySelector('#home-header'),overlap=parseFloat(document.documentElement.style.getPropertyValue('--memo-tail-overlap'))||0;
  const news=heading.getBoundingClientRect().top+scrollY+overlap-memo.tailOverlap-header.getBoundingClientRect().height-24;
  return[0,release,Math.max(release+1,news)];
 }});
 memo.navigateOpening=()=>navigation.move(0);memo.anchorAnimating=()=>navigation.busy;
 addEventListener('pagehide',e=>{if(!e.persisted)navigation.dispose();},{once:true});return navigation;
}
