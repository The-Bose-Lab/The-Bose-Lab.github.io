import {readFile,writeFile,readdir,mkdir,copyFile,unlink} from 'node:fs/promises';
import {dirname} from 'node:path';
const home=await readFile('dist/index.html','utf8');
if(!home.includes('<base href="/">'))throw Error('Build with the production root before publishing.');
await readFile('dist/normalizing-flow-maps/index.html');
async function files(dir,prefix=''){const result=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=prefix+entry.name;if(entry.isDirectory())result.push(...await files(dir+'/'+entry.name,path+'/'));else result.push(path);}return result.sort();}
const current=await files('dist'),allowed=path=>!path.split('/').includes('..')&&(/^(assets|vendor)\//.test(path)||/^(?:[a-z-]+\/)+index\.html$/.test(path)||path==='blog/normalizing-flow-maps/index.html'||/^[a-z.-]+\.(html|svg|ico|png)$/.test(path)||path==='.nojekyll');
const previous=await readFile('.published-files.json','utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return[];throw error;});
for(const path of [...previous,...current])if(!allowed(path))throw Error('Unexpected published path: '+path);
for(const path of previous)if(!current.includes(path))await unlink(path).catch(error=>{if(error.code!=='ENOENT')throw error;});
for(const path of current){await mkdir(dirname(path),{recursive:true});await copyFile('dist/'+path,path);}
await writeFile('.published-files.json',JSON.stringify(current,null,2)+'\n');
console.log(`Prepared ${current.length} production files for the existing GitHub Pages branch source.`);
