import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
import {generate} from './generate.mjs';
const base=process.env.SITE_BASE||'/';
const input=await generate(base);
// Chunks that a page always imports dynamically before it reveals are announced in
// its <head>, so they download alongside the entry graph instead of after it.
const dynamicChunks={'index.html':['binding-scene'],'research/':['research-landscape'],'normalizing-flow-maps/':['nfm-math'],'blog/normalizing-flow-maps/':['nfm-math']};
const preloadDynamicChunks={name:'bose-preload-dynamic-chunks',transformIndexHtml:{order:'post',handler(html,ctx){
 if(!ctx.bundle)return html;
 const page=ctx.path.replace(/^\//,'').replace(/index\.html$/,'')||'index.html',names=dynamicChunks[page]||(page.startsWith('research/')?dynamicChunks['research/']:[]);
 const chunks=Object.values(ctx.bundle).filter(c=>c.type==='chunk'),files=new Set();
 const visit=file=>{if(files.has(file))return;files.add(file);for(const dep of chunks.find(c=>c.fileName===file)?.imports||[])visit(dep);};
 for(const name of names){const chunk=chunks.find(c=>c.facadeModuleId?.endsWith('/src/site/'+name+'.js'));if(!chunk)throw new Error('Missing chunk for '+name);visit(chunk.fileName);}
 const present=new Set([...html.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"/g)].map(m=>m[1]));
 return [...files].map(file=>base+file).filter(href=>!present.has(href)).map(href=>({tag:'link',attrs:{rel:'modulepreload',crossorigin:true,href},injectTo:'head'}));
}}};
await build({root:'.generated',base,publicDir:'../public',plugins:[preloadDynamicChunks],build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input}},resolve:{alias:{'/src':new URL('../src',import.meta.url).pathname}},server:{fs:{allow:['..']}}});

// Keep external links to the previous Jekyll page addresses working.
for(const [old,target]of Object.entries({'people.html':'team/','news.html':'news/','join.html':'join/','publications.html':'publications/'})){
 const url=base+target;
 await writeFile('dist/'+old,`<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bose Lab</title><link rel="canonical" href="https://the-bose-lab.github.io/${target}"><meta http-equiv="refresh" content="0;url=${url}"><script>location.replace(${JSON.stringify(url)}+location.hash)</script></head><body><a href="${url}">Continue to Bose Lab</a></body></html>`);
}
