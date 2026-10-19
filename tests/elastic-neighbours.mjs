import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {elasticNeighbours} from '../src/site/elastic-neighbours.js';
const fields=JSON.parse(readFileSync('public/assets/elastic-modes.json','utf8'));
const reference=(nodes,x,y,z)=>{let nearest=[];for(let n=0;n<nodes.length;n++){const p=nodes[n],d=(x-p[0])**2+(y-p[1])**2+(z-p[2])**2;if(nearest.length<4||d<nearest.at(-1)[1]){nearest.push([n,d]);nearest.sort((a,b)=>a[1]-b[1]);if(nearest.length>4)nearest.pop();}}return nearest;};
let count=0;for(const field of Object.values(fields)){
 const query=elasticNeighbours(field),ids=new Int32Array(4),distances=new Float64Array(4);
 for(const [index,p]of field.nodes.entries())for(const offset of[0,.0001,.7,3,15]){
  const x=Math.fround(p[0]+offset),y=Math.fround(p[1]-offset*.6),z=Math.fround(p[2]+offset*.3);query(x,y,z,ids,distances);const expected=reference(field.nodes,x,y,z);
  assert.deepEqual([...ids],expected.map(p=>p[0]));assert.deepEqual([...distances],expected.map(p=>p[1]));count++;
 }
}
const field=fields['1BMF'],query=elasticNeighbours(field),ids=new Int32Array(4),distances=new Float64Array(4),points=Array.from({length:10000},(_,i)=>field.nodes[i%field.nodes.length].map((x,k)=>x+Math.sin(i*.1+k)*3));
let start=performance.now();for(const p of points)reference(field.nodes,...p);const before=performance.now()-start;
start=performance.now();for(const p of points)query(...p,ids,distances);const after=performance.now()-start;
console.log(`Elastic initialization: ${count} exact neighbour/distance matches; 10,000-query check ${before.toFixed(1)}ms → ${after.toFixed(1)}ms on this machine.`);
