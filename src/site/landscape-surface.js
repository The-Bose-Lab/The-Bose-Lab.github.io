import {T,surfaceGeometry} from './visual-primitives.js';
// Trim only the almost-flat skirt. Peak coordinates and relief are untouched.
// Shared crossing vertices give one continuous, genuinely geometric rim, which
// uses the same screen-space outline pass as the opening energy landscape.
export function landscapeSurfaceGeometry(fn,nu=176,nv=104,level=-.305){
 const grid=surfaceGeometry(fn,nu,nv),positions=grid.attributes.position.array,original=grid.index.array,uv=[],height=[];
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){uv.push([i/nu,j/nv]);height.push(positions[(j*(nu+1)+i)*3+1]);}
 const crossings=new Map(),indices=[];
 const cross=(a,b)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(crossings.has(key))return crossings.get(key);const f=(level-height[a])/(height[b]-height[a]),id=uv.length;uv.push(uv[a].map((x,k)=>x+(uv[b][k]-x)*f));height.push(level);crossings.set(key,id);return id;};
 for(let k=0;k<original.length;k+=3){const triangle=[original[k],original[k+1],original[k+2]],polygon=[];for(let j=0;j<3;j++){const a=triangle[j],b=triangle[(j+1)%3],inside=height[a]>=level;if(inside)polygon.push(a);if(inside!==(height[b]>=level))polygon.push(cross(a,b));}for(let j=1;j<polygon.length-1;j++)indices.push(polygon[0],polygon[j],polygon[j+1]);}
 const used=[...new Set(indices)],lookup=new Map(used.map((id,i)=>[id,i])),g=new T.BufferGeometry();g.setIndex(indices.map(id=>lookup.get(id)));g.setAttribute('uv',new T.Float32BufferAttribute(used.flatMap(id=>uv[id]),2));g.setAttribute('position',new T.BufferAttribute(new Float32Array(used.length*3),3));g.setAttribute('color',new T.BufferAttribute(new Float32Array(used.length*3),3));grid.dispose();return g;
}
export function updateLandscapeSurface(mesh,fn,colour,{positions=true,colours=true}={}){
 const g=mesh.geometry,uv=g.attributes.uv,a=g.attributes.position,c=g.attributes.color;
 for(let i=0;i<uv.count;i++){
  const u=uv.getX(i),v=uv.getY(i),p=positions?fn(u,v,i):[a.getX(i),a.getY(i),a.getZ(i)];
  if(positions)a.setXYZ(i,...p);if(colours)colour(u,v,p,i).toArray(c.array,i*3);
 }
 if(positions){a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}if(colours)c.needsUpdate=true;
}
