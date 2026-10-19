// Scientific state changes share the approved spherical transport's cadence.
// Loading widgets remain tied to actual readiness rather than this demo clock.
export const visualSpeed=1.5;
export const motionPeriod=9;
export const motionRate=2*Math.PI/motionPeriod;
export const loopTime=time=>((time%motionPeriod)+motionPeriod)%motionPeriod;
export const cosinePhase=time=>(1-Math.cos(time*motionRate))/2;
const ease=x=>(x=Math.max(0,Math.min(1,x)),x*x*(3-2*x));
export function transportPhase(time){const x=loopTime(time);return x<1.15?0:x<3.85?ease((x-1.15)/2.7):x<5?1:x<7.7?1-ease((x-5)/2.7):0;}
