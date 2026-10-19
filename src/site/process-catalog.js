const entry=(name,note,url)=>({name,note,url});
export const processCatalog={
 foundations:{
  sphere:entry('Spherical Transport','Equal-area samples follow exact spherical paths into a spiral-shaped target.','https://arxiv.org/abs/2510.21608'),
  torus:entry('Periodic Transport','Angular coordinates move continuously across a periodic state space.','https://arxiv.org/abs/2510.21608'),
 },
 samplers:{
  terrain:entry('Evolving Energy Landscape','A particle-free potential exchanges wells and peaks; colour follows height.','https://arxiv.org/abs/2506.16471'),
  canopy:entry('Annealed Density Canopy','A fixed potential produces progressively concentrated Boltzmann densities. Sharper cold modes use a logarithmic height scale so the warm state remains visible.','https://arxiv.org/abs/2506.16471'),
  conditional:entry('Conditional Density Ribbons','Three normalized conditional density profiles evolve together in an autoregressive cascade. This is an illustrative density field, not measured molecular energy.','https://arxiv.org/abs/2606.27361')
 },

 safety:{
  mutation:entry('P450 · Sequence → Pocket Cutaway','F87 to alanine removes only the phenyl side-chain atoms at fixed deposited positions. A cutaway of the full heme domain exposes the edited pocket; the mutant is illustrative, not a predicted fold.','https://www.rcsb.org/structure/1BU7')
 }
};
export const generativeLoaders={
 flow:entry('Density · One Mode → Two','A smooth probability-density surface separates into two modes.','https://arxiv.org/abs/2510.21608'),
 geodesic:entry('Sphere · Uniform → Spiral','All samples reorganise on a sphere without highlighted trajectories.','https://arxiv.org/abs/2510.21608'),
 quantiles:entry('Density · Three Scales','Three Gaussian-mixture density ribbons at different scales separate into two modes.','https://arxiv.org/abs/2606.27361')
};
// Keep exactly the five approved mathematical opening visuals.
export const openingProcesses={foundations:['sphere','torus'],samplers:['terrain','canopy','conditional']};
export const processHeroSpecimens=Object.fromEntries(Object.entries(openingProcesses).flatMap(([group,keys])=>keys.map(key=>[group+':'+key,{...processCatalog[group][key],category:group==='foundations'?'Generative Modelling':'Neural Sampling',process:{group,key}}])));
export const topicDetailVisuals={foundations:{name:'Generative Transport on a Manifold',key:'random'},science:{name:'Protein or Crystal Structure',key:'random'},sampling:{name:'Tempering Ladder',key:'tempering'},safety:{name:'Transfer Across Model Responses',key:'transfer'}};
