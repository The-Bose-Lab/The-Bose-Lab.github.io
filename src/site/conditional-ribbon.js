import {TAU,ribbonConditionalPDF,ribbonConditionalQuantile} from './process-math.js';
// Original ribbon timing from e464743, independent of the shared 1.5× clock.
export const ribbonRate=.55;
export const ribbonPeriod=TAU/ribbonRate;
export const ribbonBaseline=()=>-.48;
export const ribbonLane=j=>(j-1)*1.03;
export const ribbonHeight=(x,j,focus)=>ribbonBaseline(j)+.70*ribbonConditionalPDF(x,j,focus.slice(0,j));
export function ribbonFocus(theta){
 const qs=[.5+.34*Math.sin(theta),.5+.30*Math.sin(theta-1.1),.5],focus=[];
 for(let j=0;j<3;j++)focus.push(ribbonConditionalQuantile(qs[j],j,focus));
 return focus;
}
