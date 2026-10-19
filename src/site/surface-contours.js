import {T} from './visual-primitives.js';
// Isolines intersect the exact displayed triangles. Every segment belongs to
// a level set, with neighbouring triangles sharing identical crossing points.
export class SurfaceContours{
 constructor(parent,theme,{levels=[-.5,0,.5],radius=.004,opacity=.4,capacity=10000}={}){Object.assign(this,{levels,capacity,radius,baseRadius:radius});this.mesh=new T.InstancedMesh(new T.CylinderGeometry(radius,radius,1,8,1,true),new T.MeshBasicMaterial({color:theme.ink,transparent:true,opacity,depthWrite:false}),capacity);this.mesh.userData.skipOutline=true;this.mesh.frustumCulled=false;parent.add(this.mesh);this.dummy=new T.Object3D();this.a=new T.Vector3();this.b=new T.Vector3();this.axis=new T.Vector3(0,1,0);this.delta=new T.Vector3();}
 setStrokeWidth(width,camera,viewportWidth){this.radius=width*(camera.right-camera.left)/viewportWidth/2;}
 update(surface){
  const p=surface.geometry.attributes.position.array,indices=surface.geometry.index.array;let count=0;
  for(const level of this.levels)for(let j=0;j<indices.length;j+=3){
   const ia=indices[j]*3,ib=indices[j+1]*3,ic=indices[j+2]*3,ya=p[ia+1],yb=p[ib+1],yc=p[ic+1];
   if(level<Math.min(ya,yb,yc)||level>Math.max(ya,yb,yc))continue;
   let hits=0,x0=0,z0=0,x1=0,z1=0;
   for(let k=0;k<3;k++){
    const a=k===0?ia:k===1?ib:ic,b=k===0?ib:k===1?ic:ia,ea=p[a+1]-level,eb=p[b+1]-level;
    if((ea<0)===(eb<0))continue;const t=ea/(ea-eb),x=p[a]+(p[b]-p[a])*t,z=p[a+2]+(p[b+2]-p[a+2])*t;
    if(hits++===0){x0=x;z0=z;}else{x1=x;z1=z;}
   }
   if(hits!==2||count>=this.capacity)continue;
   this.a.set(x0,level+.006,z0);this.b.set(x1,level+.006,z1);this.delta.subVectors(this.b,this.a);const length=this.delta.length();if(length<1e-7)continue;
   this.dummy.position.copy(this.a).add(this.b).multiplyScalar(.5);this.dummy.quaternion.setFromUnitVectors(this.axis,this.delta.multiplyScalar(1/length));this.dummy.scale.set(this.radius/this.baseRadius,length,this.radius/this.baseRadius);this.dummy.updateMatrix();this.mesh.setMatrixAt(count++,this.dummy.matrix);
  }
  this.mesh.count=count;this.mesh.instanceMatrix.needsUpdate=true;
 }
}
