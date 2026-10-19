const cache=new Map();
export function loadJSON(name){
 if(!cache.has(name))cache.set(name,fetch(`./assets/${name}.json`).then(r=>{if(!r.ok)throw Error(`Missing asset: ${name}`);return r.json();}).catch(error=>{cache.delete(name);throw error;}));
 return cache.get(name);
}
let molecularRenderer;
export function loadMolecularRenderer(){
 if(window.molstar)return Promise.resolve(window.molstar);
 return molecularRenderer??=new Promise((resolve,reject)=>{
  let script=document.querySelector('script[data-molecular-runtime]');
  if(!script){
   const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/molstar.css';document.head.append(css);
   script=document.createElement('script');script.src='./vendor/molstar.js';script.async=true;script.dataset.molecularRuntime='';document.head.append(script);
  }
  script.addEventListener('load',()=>resolve(window.molstar),{once:true});script.addEventListener('error',()=>{molecularRenderer=null;script.remove();reject(Error('Molecular renderer unavailable'));},{once:true});
 });
}
