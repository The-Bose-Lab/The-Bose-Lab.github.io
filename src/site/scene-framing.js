import {T} from './visual-primitives.js';
// Measure actual projected vertices over a complete motion cycle. One fixed
// envelope keeps the composition steady while containing every sampled pose.
export function fitMotionEnvelope(model,{times=model.framingTimes??[0,2,4,6,8,10,12],progress=false,padding=1.12}={}){
 const e={x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity},point=new T.Vector3(),matrix=new T.Matrix4(),instance=new T.Matrix4();
 const record=(x,y,z,m)=>{point.set(x,y,z).applyMatrix4(m).applyMatrix4(model.camera.matrixWorldInverse);e.x0=Math.min(e.x0,point.x);e.x1=Math.max(e.x1,point.x);e.y0=Math.min(e.y0,point.y);e.y1=Math.max(e.y1,point.y);};
 const oldProgress=model.progress;
 for(const time of times){if(progress)model.setProgress(time);model.update(progress?time*6:time,0);model.scene.updateMatrixWorld(true);
  model.scene.traverse(o=>{if(!o.visible||!o.geometry)return;const g=o.geometry,p=g.attributes.position;if(!p)return;
   if(o.isInstancedMesh){g.computeBoundingBox();for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);for(const x of [g.boundingBox.min.x,g.boundingBox.max.x])for(const y of [g.boundingBox.min.y,g.boundingBox.max.y])for(const z of [g.boundingBox.min.z,g.boundingBox.max.z])record(x,y,z,matrix);}}
   else for(let i=0;i<p.count;i++)record(p.getX(i),p.getY(i),p.getZ(i),o.matrixWorld);
  });
 }
 if(progress)model.setProgress(oldProgress??0);model.update(0,0);model.elapsed=0;
 if(model.sequenceState)e.y0-=(e.y1-e.y0)*.22;model.motionEnvelope=e;
 model.fit=(w,h)=>{const unit=Math.max((e.x1-e.x0)/w,(e.y1-e.y0)/h)*padding,cx=(e.x0+e.x1)/2,cy=(e.y0+e.y1)/2;model.camera.left=cx-w*unit/2;model.camera.right=cx+w*unit/2;model.camera.top=cy+h*unit/2;model.camera.bottom=cy-h*unit/2;model.camera.updateProjectionMatrix();};
 return model;
}
