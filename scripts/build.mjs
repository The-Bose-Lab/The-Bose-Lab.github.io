import {build} from 'vite';
import {generate} from './generate.mjs';
const base=process.env.SITE_BASE||'/';
const input=await generate(base);
await build({root:'.generated',base,publicDir:'../public',build:{outDir:'../dist',emptyOutDir:true,rollupOptions:{input}},resolve:{alias:{'/src':new URL('../src',import.meta.url).pathname}},server:{fs:{allow:['..']}}});
