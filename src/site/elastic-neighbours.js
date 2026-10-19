// Exact four-neighbour queries. Ties retain source order, matching the original
// exhaustive search; only the search work changes, never the deformation basis.
const samplers=new WeakMap();
export function elasticNeighbours(field){
 if(samplers.has(field))return samplers.get(field);
 const nodes=field.nodes,build=(ids,depth=0)=>{if(!ids.length)return null;const axis=depth%3;ids.sort((a,b)=>nodes[a][axis]-nodes[b][axis]||a-b);const mid=ids.length>>1;return{id:ids[mid],axis,left:build(ids.slice(0,mid),depth+1),right:build(ids.slice(mid+1),depth+1)};},root=build(nodes.map((_,i)=>i));
 const nearest=(x,y,z,ids,distances)=>{
  ids.fill(-1);distances.fill(Infinity);
  const visit=node=>{if(!node)return;const p=nodes[node.id],dx=x-p[0],dy=y-p[1],dz=z-p[2],d=dx*dx+dy*dy+dz*dz;let at=3;
   if(d<distances[3]||d===distances[3]&&node.id<ids[3]){while(at>0&&(d<distances[at-1]||d===distances[at-1]&&node.id<ids[at-1])){ids[at]=ids[at-1];distances[at]=distances[at-1];at--;}ids[at]=node.id;distances[at]=d;}
   const delta=node.axis===0?dx:node.axis===1?dy:dz,near=delta<0?node.left:node.right,far=delta<0?node.right:node.left;visit(near);if(delta*delta<=distances[3])visit(far);
  };visit(root);
 };
 samplers.set(field,nearest);return nearest;
}
