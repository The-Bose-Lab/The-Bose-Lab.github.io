import {createServer} from 'vite';
import {generate} from './generate.mjs';
await generate();
const server=await createServer({root:'.generated',publicDir:'../public',resolve:{alias:{'/src':new URL('../src',import.meta.url).pathname}},server:{host:'127.0.0.1',port:4175,strictPort:true,fs:{allow:['..']}}});await server.listen();server.printUrls();
