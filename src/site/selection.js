import {heroSpecimens} from './config.js';
export const loadingChoices=[['ribbon','ubiquitin'],['ribbon','myoglobin'],['ribbon','cofolding'],['generative','flow'],['generative','geodesic'],['generative','quantiles']];
export const pick=items=>items[Math.floor(Math.random()*items.length)];
export function selectVisit(query){
 const early=typeof window==='undefined'?null:window.__boseVisit,main=query.get('specimen'),hero=main in heroSpecimens?main:early?.hero in heroSpecimens?early.hero:pick(Object.keys(heroSpecimens));
 const loaders=loadingChoices;
 const forced=loaders.find(([kind,key])=>kind===query.get('loader')&&key===query.get('widget')),preloaded=loaders.find(([kind,key])=>kind===early?.loader&&key===early?.widget),[loader,widget]=forced||preloaded||pick(loaders);
 const scenes={foundations:pick(['sphere','torus']),samplers:pick(['terrain','canopy','conditional']),protein:pick(['cofolding','myoglobin']),crystal:'packing',safety:'mutation'};
 for(const[key,value]of Object.entries(scenes))if(!query.has(key))query.set(key,value);
 return {hero,loader,widget};
}
