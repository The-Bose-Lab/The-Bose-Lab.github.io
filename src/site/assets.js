const cache=new Map();
export function loadJSON(name){
 if(!cache.has(name))cache.set(name,fetch(`./assets/${name}.json`).then(r=>{if(!r.ok)throw Error(`Missing asset: ${name}`);return r.json();}).catch(error=>{cache.delete(name);throw error;}));
 return cache.get(name);
}
let molecularRenderer;
export function loadMolecularRenderer(){
 if(window.molstar)return Promise.resolve(window.molstar);
 return molecularRenderer??=new Promise((resolve,reject)=>{
  const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/molstar.css';document.head.append(css);
  const script=document.createElement('script');script.src='./vendor/molstar.js';script.async=true;
  script.onload=()=>resolve(window.molstar);script.onerror=()=>{molecularRenderer=null;script.remove();reject(Error('Molecular renderer unavailable'));};document.head.append(script);
 });
}
