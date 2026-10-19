// Reveal the already-built cartoon in residue order. No screen-space wipe,
// no camera motion and no geometry reconstruction as the protein grows.
export class RibbonReveal {
 constructor(cells){
  this.entries=[];this.last=-1;
  for(const cell of cells){
   const {repr,sourceData}=cell.obj.data,structure=sourceData||repr.getAllLoci()[0]?.structure;
   if(!structure)throw Error('Ribbon structure unavailable');
   const units=structure.units.filter(u=>u.kind===0).map(unit=>{
    const hierarchy=unit.model.atomicHierarchy,residues=hierarchy.residueAtomSegments.index,chains=hierarchy.chainAtomSegments.index,orders=new Map();
    for(const atom of unit.elements){const chain=chains[atom],residue=residues[atom];if(!orders.has(chain))orders.set(chain,new Map());const order=orders.get(chain);if(!order.has(residue))order.set(residue,order.size);}
    const ranks=Array.from(unit.elements,atom=>{const order=orders.get(chains[atom]);return [order.get(residues[atom]),order.size];});
    return {unit,ranks,counts:[...orders.values()].map(m=>m.size)};
   });this.entries.push({repr,structure,units});
  }
 }
 draw(progress){
  // 120 temporal steps are smooth at miniature size and avoid redundant uploads.
  const step=Math.round(progress*120);if(step===this.last)return;this.last=step;
  for(const {repr,structure,units}of this.entries){
   const layers=(progress>=1?[]:[1,.7,.3]).map((value,band)=>{
    const elements=[];for(const {unit,ranks}of units){const indices=[];ranks.forEach(([rank,count],index)=>{const head=progress*count,distance=rank-head;if((band===0&&distance>=1)||(band===1&&distance>=0&&distance<1)||(band===2&&distance>=-1&&distance<0))indices.push(index);});if(indices.length)elements.push({unit,indices:Int32Array.from(indices)});}
    return {loci:molstar.lib.structure.StructureElement.Loci(structure,elements),value};
   }).filter(l=>l.loci.elements.length);
   repr.setState({transparency:{kind:'element-loci',layers},pickable:false});
  }
  document.documentElement.dataset.ribbonReveal='residue-order';
  document.documentElement.dataset.ribbonChains=JSON.stringify(this.entries.flatMap(e=>e.units.flatMap(u=>u.counts.map(count=>({total:count,shown:Math.min(count,Math.ceil(progress*count))})))));
 }
}
