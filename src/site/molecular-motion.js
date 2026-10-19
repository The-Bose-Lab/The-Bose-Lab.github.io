import {elasticNeighbours} from './elastic-neighbours.js';
import {motionRate,visualSpeed} from './motion-clock.js';
// Pinned Mol* sphere-texture adapter. Updates position ValueCells; no atom picking.
const touch=cell=>{cell.ref={...cell.ref,version:cell.ref.version+1};};
export class MolecularMotion{
 constructor(plugin,atoms,ribbons,field,{capture=false,report=true}={}){
  this.report=report;this.plugin=plugin;this.atoms=atoms;this.ribbons=ribbons;this.buffers=[];this.field=field;this.capture=capture;this.elapsed=0;this.frames=0;this.kind='elastic';this.running=false;const neighbours=field?elasticNeighbours(field):null,nearIds=new Int32Array(4),nearDistances=new Float64Array(4);
  for(const repr of atoms)for(const object of repr.renderObjects){object.state.pickable=false;const cell=object.values.tPositionGroup;if(!cell)continue;const array=cell.ref.value.array;if(!(array instanceof Float32Array))continue;const base=array.slice(),count=Math.min(base.length/4,object.values.uVertexCount.ref.value/6),weights=capture?null:[new Float32Array(count*3),new Float32Array(count*3),new Float32Array(count*3)];
   if(weights&&field){for(let i=0;i<count;i++){
    const x=base[i*4],y=base[i*4+1],z=base[i*4+2];const rigid=field.rigidMap?.[[x,y,z].map(v=>Math.round(v*1000)).join(',')];let nearest=[];
    if(rigid!==undefined)nearest=[[rigid,1]];
    else{neighbours(x,y,z,nearIds,nearDistances);nearest=Array.from(nearIds,(n,j)=>[n,1/(nearDistances[j]+2)]).filter(([n])=>n>=0);let total=0;for(const pair of nearest)total+=pair[1];for(const pair of nearest)pair[1]/=total;}
    for(let m=0;m<3;m++)for(let k=0;k<3;k++)for(const[n,w]of nearest)weights[m][i*3+k]+=field.modes[m][n][k]*w;
   }}this.buffers.push({cell,array,base,count,weights});
  }
  // Uniformly scale the entire mode basis; never clip individual atoms or distort crystal molecules.
  // Triangle inequality bounds every phase combination to <= 2.2 A displacement.
  let peak=0;for(const b of this.buffers)if(b.weights)for(let i=0;i<b.count;i++){let bound=0;for(let m=0;m<3;m++)bound+=Math.hypot(...b.weights[m].subarray(i*3,i*3+3));peak=Math.max(peak,bound);}
  this.peak=peak;this.limitAmplitude(2.2);
  if(this.report)document.documentElement.dataset.maxDisplacement=String(Math.round(peak*this.safeGain*100)/100);
  if(this.report)document.documentElement.dataset.atomSamples=String(this.buffers.reduce((s,b)=>s+b.count,0));if(this.report)document.documentElement.dataset.motionBuffers=String(this.buffers.length);if(this.report)document.documentElement.dataset.elasticNodes=String(field?.nodes.length||0);
  for(const repr of ribbons)repr.setState({visible:false,pickable:false});
 }
 limitAmplitude(limit){this.safeGain=Math.min(.85*(this.field?.gainScale||1),this.peak?limit/this.peak:0);if(this.report)document.documentElement.dataset.maxDisplacement=String(Math.round(this.peak*this.safeGain*100)/100);}
 setActive(active,kind=this.kind){this.kind=kind;if(this.running===active)return;this.running=active;this.last=0;if(active)this.raf=requestAnimationFrame(t=>this.tick(t));else cancelAnimationFrame(this.raf);}
 tick(now){if(!this.running)return;if(!this.last)this.last=now;if(now-this.last>=1000/30){this.elapsed+=(now-this.last)/1000*visualSpeed;this.last=now;const gain=this.safeGain,phase=[Math.sin(this.elapsed*motionRate),Math.sin(this.elapsed*motionRate*2+.7),Math.sin(this.elapsed*motionRate*3+1.8)];
   for(const b of this.buffers){if(!b.weights)continue;for(let i=0;i<b.count;i++)for(let k=0;k<3;k++)b.array[i*4+k]=b.base[i*4+k]+gain*(b.weights[0][i*3+k]*phase[0]+b.weights[1][i*3+k]*phase[1]+b.weights[2][i*3+k]*phase[2]);touch(b.cell);}
   this.plugin.canvas3d.update(undefined,true);this.plugin.canvas3d.requestDraw();if(++this.frames%10===0){this.plugin.canvas3dContext.canvas.dataset.molecularMotionFrame=String(this.frames);if(this.report)document.documentElement.dataset.motionFrame=String(this.frames);}
  }this.raf=requestAnimationFrame(t=>this.tick(t));
 }
 reset(){for(const b of this.buffers){b.array.set(b.base);touch(b.cell);}this.plugin.canvas3d.update(undefined,true);this.plugin.canvas3d.requestDraw();}
 dispose(){this.setActive(false);}
}
