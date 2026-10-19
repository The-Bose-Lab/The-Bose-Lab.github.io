export const memoCopies={direct:{name:'Research memo',lines:[
 ['We turn noise into structure,','foundations'],
 ['design proteins','protein','and crystals,','crystal'],
 ['sample','samplers','equilibrium states,'],
 ['and study safety & robustness.','safety']
]}};
export const memoTransitions={direct:'Carry · direct path'};
export const researchSources={
 nfm:{name:'Normalizing Flow Maps · 2026',url:'https://simons.berkeley.edu/index.php/talks/joey-bose-imperial-college-london-2026-08-04'},
 gfm:{name:'Generalised Flow Maps · 2026',url:'https://arxiv.org/abs/2510.21608'},
 curly:{name:'Curly Flow Matching · 2025',url:'https://arxiv.org/abs/2510.26645'},
 pita:{name:'Progressive Inference-Time Annealing · 2025',url:'https://arxiv.org/abs/2506.16471'},
 guidance:{name:'Optimal Q-Guidance · 2026',url:'https://arxiv.org/abs/2605.12416'},
 disco:{name:'DISCO · sequence–structure co-design · 2026',url:'https://arxiv.org/abs/2604.05181'},
 enzyme:{name:'P450 heme domain · PDB 1BU7',url:'https://www.rcsb.org/structure/1BU7'},
 ddpp:{name:'Discrete Denoising Posterior Prediction · 2025',url:'https://arxiv.org/abs/2410.08134'}
};
export {processCatalog as memoVisuals} from './process-catalog.js';
export const memoDefaults={copy:'direct',transition:'direct',foundations:'sphere',samplers:'terrain',safety:'mutation',protein:'cofolding',crystal:'packing'};
