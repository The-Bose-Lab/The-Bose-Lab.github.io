// Structure files are published as .txt so GitHub Pages serves them gzip-compressed
// (chemical/x-cif and application/vnd.palm responses are sent uncompressed).
export const structurePath=spec=>`assets/${spec.file}.${spec.format==='mmcif'?'cif':'pdb'}.txt`;
// The Mol* hero and companions read mmCIF specimens as BinaryCIF (same data, a
// fraction of the bytes and parse time); the text copies serve the in-browser parsers.
export const molecularSource=spec=>spec.format==='mmcif'?{path:`assets/${spec.file}.bcif`,format:'bcif'}:{path:structurePath(spec),format:spec.format||'pdb'};
export const molecularUrl=spec=>new URL('./'+molecularSource(spec).path,document.baseURI).href;
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
