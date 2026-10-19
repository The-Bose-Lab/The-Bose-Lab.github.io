import {heroSpecimens} from './config.js';
export const pick=items=>items[Math.floor(Math.random()*items.length)];
export function selectVisit(query){
 const main=query.get('specimen'),hero=main in heroSpecimens?main:pick(Object.keys(heroSpecimens));
 const loaders=[['ribbon','ubiquitin'],['ribbon','myoglobin'],['ribbon','cofolding'],['generative','flow'],['generative','geodesic'],['generative','quantiles']];
 const forced=loaders.find(([kind,key])=>kind===query.get('loader')&&key===query.get('widget')),[loader,widget]=forced||pick(loaders);
 const scenes={foundations:pick(['sphere','torus']),samplers:pick(['terrain','canopy','conditional']),protein:pick(['cofolding','myoglobin']),crystal:'packing',safety:'mutation'};
 for(const[key,value]of Object.entries(scenes))if(!query.has(key))query.set(key,value);
 return {hero,loader,widget};
}
