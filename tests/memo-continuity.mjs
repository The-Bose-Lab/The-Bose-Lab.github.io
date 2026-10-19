import assert from 'node:assert/strict';
import {MemoController} from '../src/site/memo.js';
const previous={document:globalThis.document,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight};
const style=()=>({setProperty(){}}),node=()=>({style:style(),setAttribute(){}});
globalThis.document={documentElement:{style:style(),dataset:{}},body:{dataset:{}}};globalThis.innerWidth=1440;globalThis.innerHeight=900;
try{
 const carry=Object.create(MemoController.prototype),camera={viewport:{width:560,height:560},state:{target:[0,0,0],position:[0,0,100],radiusMax:100},transition:{target:{},finish(){}},getPixelSize(){return Math.hypot(...this.state.position.map((v,i)=>v-this.state.target[i]))/560;},setState(pose){Object.assign(this.state,pose);},update(){}};
 let resizes=0;
 Object.assign(carry,{theme:{ink:'#162D65'},board:{dataset:{openingTop:'0',memoTop:'-80',heroX:'1080',heroY:'450',heroSize:'560'},style:style()},hero:{...node(),clientWidth:560},heroHalf:280,plugin:{canvas3d:{camera,setProps(){},requestDraw(){},handleResize(){resizes++;}},canvas3dContext:{canvas:{clientWidth:560,clientHeight:560}},handleResize(){resizes++;}},framing:{width:20,height:30,padding:4,centre:[0,0,0],direction:[0,0,1],up:[0,1,0],radius:30,points:new Float32Array([-10,-15,-6,10,15,6,-10,15,6,10,-15,-6])},destination:{x:600,y:400,scale:160/560},tailOverlap:100,options:{transition:'direct'},copy:node(),el:{...node(),children:[]},wordmark:node(),slots:{},motionTime:4.47});
 const direction=()=>{const d=camera.state.position.map((v,i)=>v-camera.state.target[i]),n=Math.hypot(...d);return d.map(v=>v/n);};
 for(const forward of[true,false]){
  let last;
  for(let frame=0;frame<=60;frame++){
   carry.progress=forward?frame/60:1-frame/60;carry.compose();const d=direction();
   if(last){const angle=Math.acos(Math.max(-1,Math.min(1,d.reduce((sum,v,i)=>sum+v*last[i],0))));assert(angle<.12,'The carried camera must turn smoothly over the complete transition');}last=d;
  }
 }
 assert.equal(resizes,0,'The carried molecular drawing buffer must not be cleared at either endpoint');
 carry.progress=.5;carry.compose();const before=direction();carry.motionTime=4.6;carry.compose();assert(direction().every((v,i)=>Math.abs(v-before[i])<1e-12),'The transition freezes its rotation phase across the +/-pi boundary');
}finally{for(const[k,v]of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
console.log('Carried protein camera continuity and unchanged drawing-buffer endpoints passed.');
