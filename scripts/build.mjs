import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
import {generate} from './generate.mjs';
const base=process.env.SITE_BASE||'/';
const input=await generate(base);
await build({root:'.generated',base,publicDir:'../public',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input}},resolve:{alias:{'/src':new URL('../src',import.meta.url).pathname}},server:{fs:{allow:['..']}}});

// Keep external links to the previous Jekyll page addresses working.
for(const [old,target]of Object.entries({'people.html':'team/','news.html':'news/','join.html':'join/','publications.html':'publications/'})){
 const url=base+target;
 await writeFile('dist/'+old,`<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bose Lab</title><link rel="canonical" href="https://the-bose-lab.github.io/${target}"><meta http-equiv="refresh" content="0;url=${url}"><script>location.replace(${JSON.stringify(url)}+location.hash)</script></head><body><a href="${url}">Continue to Bose Lab</a></body></html>`);
}
