import assert from 'node:assert/strict';
import {IntroAnchors} from '../src/site/intro-anchors.js';
function harness(reduced=false,stops=[0,600,1200]){
 let now=0,id=0;const frames=new Map(),timers=new Map(),listeners=new Map(),options=new Map(),doc={body:{dataset:{}}};
 const w={scrollY:0,innerHeight:800,performance:{now:()=>now},addEventListener:(type,fn,opts)=>{listeners.set(type,fn);options.set(type,opts)},removeEventListener:type=>listeners.delete(type),requestAnimationFrame:fn=>(frames.set(++id,fn),id),cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,delay)=>(timers.set(++id,{fn,at:now+delay}),id),clearTimeout:id=>timers.delete(id),scrollTo:({top})=>{w.scrollY=top;}};
 const nav=new IntroAnchors({viewport:w,document:doc,stops:()=>stops,reduced});
 const send=(type,values={})=>{let prevented=false;listeners.get(type)?.({deltaX:0,deltaY:0,deltaMode:0,preventDefault:()=>{prevented=true;},...values});return prevented;};
 const advance=ms=>{for(let end=now+ms;now<end;){now=Math.min(now+16,end);const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(now));for(const[k,v]of timers)if(v.at<=now){timers.delete(k);v.fn();}}};
 return{w,nav,doc,send,advance,options};
}
{
 const h=harness();assert(h.send('wheel',{deltaY:12}));h.advance(700);assert.equal(h.w.scrollY,600,'One small wheel movement reaches the second frame');
 h.send('wheel',{deltaY:12});h.advance(700);assert.equal(h.w.scrollY,1200,'The next gesture reaches News');
 assert(!h.send('wheel',{deltaY:50}),'News keeps normal downward scrolling');
 h.send('wheel',{deltaY:-12});h.advance(700);assert.equal(h.w.scrollY,600);h.send('wheel',{deltaY:-12});h.advance(700);assert.equal(h.w.scrollY,0);
 h.nav.dispose();assert(!h.send('wheel',{deltaY:12}));
}
{
 const h=harness();for(let i=0;i<60;i++){h.send('wheel',{deltaY:20});h.advance(20);}assert.equal(h.w.scrollY,600,'A continuous trackpad burst must not skip the second frame');
 h.advance(200);h.send('wheel',{deltaY:20});h.advance(700);assert.equal(h.w.scrollY,1200);
 h.w.scrollY=1300;assert(!h.send('wheel',{deltaY:-20}),'The news list scrolls normally');
}
{
 const h=harness();h.send('touchstart',{touches:[{clientX:100,clientY:200}]});assert(h.send('touchmove',{touches:[{clientX:100,clientY:185}]}));h.advance(700);
 h.send('touchmove',{touches:[{clientX:100,clientY:80}]});h.advance(700);assert.equal(h.w.scrollY,600,'One swipe advances once, regardless of its length');
 h.send('touchend');h.send('touchstart',{touches:[{clientX:100,clientY:200}]});h.send('touchmove',{touches:[{clientX:100,clientY:185}]});h.advance(700);assert.equal(h.w.scrollY,1200);
}
{
 const h=harness(true);assert(!h.send('wheel',{deltaY:12,ctrlKey:true}),'Pinch zoom is not captured');assert(!h.send('wheel',{deltaX:40,deltaY:12}),'Horizontal gestures are not captured');
 h.doc.body.dataset.navOpen='true';assert(!h.send('wheel',{deltaY:12}));h.doc.body.dataset.navOpen='false';
 h.send('keydown',{key:'PageDown'});h.advance(20);assert.equal(h.w.scrollY,600,'Reduced motion reaches its anchor without interpolation');
 assert(!h.send('keydown',{key:' ',target:{closest:()=>true}}),'Buttons and form controls retain keyboard behavior');
}
console.log('Opening anchors passed: small wheel/swipe, momentum isolation, reverse navigation, reduced motion, and normal News scrolling.');

// Regressions: inputs during motion must reverse or advance, never disappear.
{
 const h=harness();h.send('wheel',{deltaY:12});h.advance(140);assert(h.w.scrollY>0&&h.w.scrollY<600);
 h.send('wheel',{deltaY:-12});h.advance(450);assert.equal(h.w.scrollY,0,'A reversal interrupts an in-flight transition immediately');
 h.send('wheel',{deltaY:12});h.advance(1);h.send('wheel',{deltaY:-12});h.advance(450);assert.equal(h.w.scrollY,0,'Reversal before the first animation frame still cancels the move');
}
{
 const h=harness();h.send('wheel',{deltaY:12});h.advance(140);h.send('wheel',{deltaY:12});h.advance(450);assert.equal(h.w.scrollY,1200,'A separate second gesture during motion advances to the next anchor');
 h.send('wheel',{deltaY:-12});h.advance(140);h.send('wheel',{deltaY:-12});h.advance(450);assert.equal(h.w.scrollY,0,'Two quick reverse gestures return through both anchors');
}
{
 const h=harness();h.send('touchstart',{touches:[{clientX:100,clientY:200}]});h.send('touchmove',{touches:[{clientX:100,clientY:180}]});h.advance(100);h.send('touchend');
 h.send('touchstart',{touches:[{clientX:100,clientY:200}]});h.send('touchmove',{touches:[{clientX:100,clientY:220}]});h.advance(450);assert.equal(h.w.scrollY,0,'A new reverse swipe is accepted while the previous swipe is animating');
 h.send('wheel',{deltaY:12});h.advance(100);h.send('keydown',{key:'Home'});h.w.scrollY=0;h.advance(500);assert.equal(h.w.scrollY,0,'Home is not overwritten by a stale animation');
}
console.log('Rapid reversals, successive gestures, touch interruption, and stale-animation cancellation passed.');
{
 const h=harness();h.send('touchstart',{touches:[{clientX:100,clientY:200}]});h.send('touchmove',{touches:[{clientX:100,clientY:197}]});h.send('touchend');h.advance(500);assert.equal(h.w.scrollY,600,'A three-pixel completed swipe selects the next frame');
 h.send('touchstart',{touches:[{clientX:100,clientY:200}]});h.send('touchmove',{touches:[{clientX:100,clientY:203}]});h.send('touchend');h.advance(500);assert.equal(h.w.scrollY,0,'A tiny reverse swipe returns completely');
 h.w.innerWidth=390;h.nav.width=390;h.send('wheel',{deltaY:12});h.advance(100);h.w.innerHeight=720;h.send('resize');h.advance(500);assert.equal(h.w.scrollY,600,'Safari toolbar height changes cannot cancel a frame transition');
}
console.log('Tiny iPhone swipes and toolbar-height changes passed.');

{
 const h=harness(false,[0,600,601]);h.send('wheel',{deltaY:12});h.advance(500);assert.equal(h.w.scrollY,600);
 h.send('wheel',{deltaY:12});h.advance(500);assert.equal(h.w.scrollY,601,'A nearby News anchor cannot trap scrolling on the second frame');
 assert(!h.send('wheel',{deltaY:12}),'Scrolling past the intro remains native');
 assert.equal(h.options.get('wheel').capture,true,'Page gestures are received before embedded viewer handlers');
 assert.equal(h.options.get('touchmove').capture,true,'Embedded viewers cannot consume the first swipe');
 h.nav.dispose();
}
console.log('Viewer event capture and tightly spaced News anchor regressions passed.');
