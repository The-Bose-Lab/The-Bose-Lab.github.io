import {motionPeriod,motionRate,loopTime,cosinePhase,transportPhase} from './motion-clock.js';
export {transportPhase} from './motion-clock.js';
import {enzymeSequence,mutationIndex} from './enzyme-sequence.js';
// Small explicit mathematical models used by the visual studies, not paper results.
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const loopPhase=cosinePhase;
export function editTimeline(t){
 const cycle=loopTime(t),reverse=cycle>=motionPeriod/2,leg=cycle%(motionPeriod/2),settled=leg>=1.35,change=leg<1.5?0:leg<1.7?ease((leg-1.5)/.20):1;
 return{cycle,leg,reverse,masking:leg>=.5&&leg<.65,proposing:leg>=.65&&leg<1.35,mutated:reverse?!settled:settled,response:reverse?1-change:change};
}
export function seeded(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return(s+.5)/4294967296;};}
export function normal(random){return Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());}
const norm=p=>{const r=Math.hypot(...p);return p.map(x=>x/r);};
// v8 reference: a three-turn seam from -70 to +70 degrees. Greedy
// one-to-one pairing preserves every particle and every target exactly once.
export function sphericalCohort(n=210){
 const src=Array.from({length:n},(_,id)=>{const y=1-2*(id+.5)/n,a=id*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);return[r*Math.cos(a),y,r*Math.sin(a)];});
 const dst=Array.from({length:n},(_,id)=>{const u=(id+.5)/n,lat=(-70+140*u)*Math.PI/180,lon=u*Math.PI*6;return[Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)];});
 const used=new Set();return src.map((start,id)=>{let score=-Infinity,index=0;dst.forEach((p,j)=>{if(used.has(j))return;const d=p.reduce((v,x,k)=>v+x*start[k],0);if(d>score){score=d;index=j;}});used.add(index);return{id,start,target:dst[index],spiralIndex:index};});
}
export function spherePoint(p,s,radius=1.18){const dot=clamp(p.start.reduce((v,x,k)=>v+x*p.target[k],0),-1,1),a=Math.acos(dot),den=Math.sin(a);const point=a<1e-7?p.start:p.start.map((x,k)=>(x*Math.sin((1-s)*a)+p.target[k]*Math.sin(s*a))/den);return norm(point).map(x=>x*radius);}
const ease=x=>(x=clamp(x),x*x*(3-2*x));
export function sequenceState(time){
 const timeline=editTimeline(time),index=mutationIndex,sequence=[...enzymeSequence],original=sequence[index],replacement='A';
 const proposals=timeline.reverse?'AVIFLWY':'YWLFIVA',step=Math.min(proposals.length-1,Math.floor((timeline.leg-.65)/.70*proposals.length)),glyph=timeline.masking?'·':timeline.proposing?proposals[step]:timeline.mutated?replacement:original;sequence[index]=glyph;
 return{...timeline,time,phase:loopPhase(time),index,original,replacement,sequence};
}
export function landscapeParameters(time,kind='terrain'){
 const a=time*motionRate,swap=1-2*transportPhase(time);
 return {wells:[[-.95,-.25,1.65*swap],[.95,.28,-1.65*swap],[0,.8,.25*Math.sin(a)]],ridge:.25*Math.sin(a),ridgeX:0,ridgeZ:0,temperature:1};
}
export function landscapeEnergy(x,z,time,kind='terrain'){
 const p=landscapeParameters(time,kind),smooth=1;let e=.09*(x*x+z*z)+p.ridge*Math.exp(-(x*x/.28+z*z/1.5));
 for(const [cx,cz,depth]of p.wells)e-=depth*Math.exp(-((x-cx)**2/(.37*smooth)+(z-cz)**2/(.43*smooth)));return e;
}
export function landscapeGradient(x,z,t,kind){const h=.002;return[(landscapeEnergy(x+h,z,t,kind)-landscapeEnergy(x-h,z,t,kind))/(2*h),(landscapeEnergy(x,z+h,t,kind)-landscapeEnergy(x,z-h,t,kind))/(2*h)];}
export const heightFromEnergy=e=>e*.8;
export const colourFromEnergy=e=>clamp((e+1.7)/3.4);
