import {markerMolecules} from './molecule-marks.js';

let serial=0;
// Decorative identities, not molecular models of the labelled research topic.
// Repeated labels always use the same real molecule and element colour mapping.
const identities={
 flow:'glycine',science:'alanine',sampling:'ribose',safety:'glycerol',
 blog:'glycine',writing:'glycine',opportunity:'lacticAcid',publication:'ribose',
 preprint:'alanine',news:'glycerol'
};
export const motifForms=Object.freeze(Object.fromEntries(Object.entries(identities).map(([kind,key])=>[kind,markerMolecules[key]])));
const elementSlot={C:'a',N:'d',O:'c',P:'b',S:'b',H:'a'};
const number=v=>Number(v.toFixed(3));
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function molecularMark(kind='science'){
 const molecule=motifForms[kind]||motifForms.science,id='motif-'+(++serial);
 // One uniform projection scale preserves genuine coordinate geometry and the
 // relative Bondi radii. A compact spacefill treatment matches the site artwork.
 const radii=molecule.atoms.map(a=>a.radius*.56);
 const lo=[0,1].map(k=>Math.min(...molecule.atoms.map((a,i)=>a[k?'y':'x']-radii[i])));
 const hi=[0,1].map(k=>Math.max(...molecule.atoms.map((a,i)=>a[k?'y':'x']+radii[i])));
 const scale=26/Math.max(hi[0]-lo[0],hi[1]-lo[1]);
 const centre=lo.map((v,k)=>(v+hi[k])/2);
 const atoms=molecule.atoms.map((a,i)=>({...a,index:i,x:(a.x-centre[0])*scale,y:(a.y-centre[1])*scale,r:radii[i]*scale}));
 const depth=Math.max(...atoms.map(a=>a.z))-Math.min(...atoms.map(a=>a.z));
 const rear=Math.min(...atoms.map(a=>a.z));
 const defs=atoms.map(a=>{
  const slot=elementSlot[a.element]||'b',front=depth>.001?(a.z-rear)/depth:.5;
  const light=number(87+front*7),shade=number(69+front*7);
  return `<radialGradient id="${id}-${a.index}" cx="28%" cy="22%" r="85%"><stop stop-color="color-mix(in srgb,var(--${slot}) ${light}%,white)"/><stop offset=".52" stop-color="var(--${slot})"/><stop offset="1" stop-color="color-mix(in srgb,var(--${slot}) ${shade}%,var(--outline,var(--ink)))"/></radialGradient>`;
 }).join('');
 const bonds=molecule.bonds.map(([i,j,order])=>{
  const a=atoms[i],b=atoms[j],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  // Keep authentic multiple bonds, including the carboxyl carbonyls; only their
  // exposed portions appear between the depth-ordered spacefill atoms.
  const offsets=order===3?[-.8,0,.8]:order===2?[-.45,.45]:[0];
  return offsets.map(o=>{
   const ox=length>1e-6?-dy/length*o:0,oy=length>1e-6?dx/length*o:0;
   return `<path d="M${number(a.x+ox)},${number(a.y+oy)}L${number(b.x+ox)},${number(b.y+oy)}" fill="none" stroke="var(--outline,var(--ink))" stroke-width="${order>1?'.65':'1.05'}" stroke-linecap="round"/>`;
  }).join('');
 }).join('');
 const spheres=[...atoms].sort((a,b)=>a.z-b.z).map(a=>`<circle data-element="${a.element}" data-atom="${escape(a.id)}" cx="${number(a.x)}" cy="${number(a.y)}" r="${number(a.r)}" fill="url(#${id}-${a.index})" stroke="var(--outline,var(--ink))" stroke-width=".65"/>`).join('');
 return `<svg class="molecular-mark" data-motif="${escape(kind)}" data-molecule="${molecule.ccdId}" viewBox="-17 -17 34 34" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><title>${escape(molecule.name)} · RCSB ${molecule.ccdId}</title><defs>${defs}</defs>${bonds}${spheres}</svg>`;
}
export const fieldMotifs={foundations:'flow',science:'science',sampling:'sampling',safety:'safety'};
