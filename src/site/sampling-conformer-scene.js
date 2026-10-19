import {T,BaseScene,Beads} from './visual-primitives.js';
// Same molecular identity and camera in both poses; only a real single-bond torsion differs.
export class SamplingConformerScene extends BaseScene{
 constructor(data,index,theme){
  super(theme,{view:[0,0,8]});const poses=data.poses.map(p=>p.map(q=>new T.Vector3(...q))),all=poses.flat(),box=new T.Box3().setFromPoints(all),centre=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3()).length(),scale=3.2/size;
  let best=-Infinity,direction;for(let i=0;i<96;i++){const y=1-2*(i+.5)/96,a=i*2.39996323,d=new T.Vector3(Math.sqrt(1-y*y)*Math.cos(a),y,Math.sqrt(1-y*y)*Math.sin(a)),r=new T.Vector3(0,1,0).cross(d).normalize(),u=d.clone().cross(r),q=poses[0].map(v=>[v.dot(r),v.dot(u)]),spread=(Math.max(...q.map(p=>p[0]))-Math.min(...q.map(p=>p[0])))*(Math.max(...q.map(p=>p[1]))-Math.min(...q.map(p=>p[1])));if(spread>best){best=spread;direction=d;}}
  this.camera.position.copy(direction.multiplyScalar(8));this.camera.lookAt(0,0,0);this.camera.updateMatrixWorld();this.positions=poses[index].map(p=>p.clone().sub(centre).multiplyScalar(scale).toArray());this.radii=data.atoms.map(a=>a.radius*scale*.83);this.beads=new Beads(this.scene,data.atoms.length,theme);this.beads.update(this.positions,this.radii,data.atoms.map(a=>a.element==='P'?theme.c:a.element==='O'?theme.b:theme.a));const bounds=new T.Box3();all.forEach(p=>{const q=p.clone().sub(centre).multiplyScalar(scale).applyMatrix4(this.camera.matrixWorldInverse);bounds.expandByPoint(q.clone().addScalar(.22));bounds.expandByPoint(q.clone().addScalar(-.22));});this.envelope={x0:bounds.min.x,x1:bounds.max.x,y0:bounds.min.y,y1:bounds.max.y};
 }
 fit(w,h){const e=this.envelope,unit=Math.max((e.x1-e.x0)/w,(e.y1-e.y0)/h),cx=(e.x1+e.x0)/2,cy=(e.y1+e.y0)/2;this.camera.left=cx-w*unit/2;this.camera.right=cx+w*unit/2;this.camera.top=cy+h*unit/2;this.camera.bottom=cy-h*unit/2;this.camera.updateProjectionMatrix();}
 attachmentPoint(){let bottom;this.positions.forEach((p,i)=>{const q=new T.Vector3(...p).applyMatrix4(this.camera.matrixWorldInverse);q.y-=this.radii[i];if(!bottom||q.y<bottom.y)bottom=q;});return{x:(bottom.x-this.camera.left)/(this.camera.right-this.camera.left)*2-1,y:(bottom.y-this.camera.bottom)/(this.camera.top-this.camera.bottom)*2-1};}
 update(t){this.elapsed=t;}
}
