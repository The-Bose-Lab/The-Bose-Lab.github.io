import assert from 'node:assert/strict';
import {IntroAnchors} from '../src/site/intro-anchors.js';
function harness(reduced=false){
 let now=0,id=0;const frames=new Map(),timers=new Map(),listeners=new Map(),doc={body:{dataset:{}}};
 const w={scrollY:0,innerHeight:800,performance:{now:()=>now},addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:type=>listeners.delete(type),requestAnimationFrame:fn=>(frames.set(++id,fn),id),cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,delay)=>(timers.set(++id,{fn,at:now+delay}),id),clearTimeout:id=>timers.delete(id),scrollTo:({top})=>{w.scrollY=top;}};
 const nav=new IntroAnchors({viewport:w,document:doc,stops:()=>[0,600,1200],reduced});
 const send=(type,values={})=>{let prevented=false;listeners.get(type)?.({deltaX:0,deltaY:0,deltaMode:0,preventDefault:()=>{prevented=true;},...values});return prevented;};
 const advance=ms=>{for(let end=now+ms;now<end;){now=Math.min(now+16,end);const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(now));for(const[k,v]of timers)if(v.at<=now){timers.delete(k);v.fn();}}};
 return{w,nav,doc,send,advance};
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
