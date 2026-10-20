// Builds public/vendor/molstar.js and public/vendor/molstar.css from the pinned
// Mol* release, with only the MolViewSpec extension compiled in (see entry.js).
//
//   cd scripts/molstar && pnpm install --frozen-lockfile && pnpm build
//
// The bundle settings mirror Mol*'s own scripts/build.mjs (esbuild IIFE,
// global `molstar`, production mode). The resulting file is committed.
import * as esbuild from 'esbuild';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),molstarPackage=require('molstar/package.json');
const types=require.resolve('molstar/lib/mol-model/structure/model/types.js');
const lazyElementSymbolCache={
 name:'lazy-element-symbol-cache',
 setup(build){
  // Mol* fills a 242k-entry upper-case lookup table for every 1–3 character
  // alphanumeric string when the script loads (~200 ms plus garbage collection).
  // Memoise on demand instead; ElementSymbol() returns the same strings.
  build.onLoad({filter:/mol-model[\\/]structure[\\/]model[\\/]types\.js$/},async args=>{
   let contents=await readFile(args.path,'utf8');
   const eager=/const _esCache = \(function \(\) \{[\s\S]*?\}\(\)\);\nexport function ElementSymbol\(s\) \{\n    return _esCache\[s\] \|\| s\.toUpperCase\(\);\n\}/;
   if(!eager.test(contents))throw new Error('Mol* element symbol cache no longer matches; update scripts/molstar/build.mjs');
   contents=contents.replace(eager,"const _esCache = Object.create(null);\nexport function ElementSymbol(s) {\n    return _esCache[s] || (_esCache[s] = s.toUpperCase());\n}");
   return {contents,loader:'js'};
  });
 }
};
const out=new URL('../../public/vendor/',import.meta.url).pathname;
await esbuild.build({
 entryPoints:[new URL('./entry.js',import.meta.url).pathname],
 bundle:true,minify:true,sourcemap:false,format:'iife',globalName:'molstar',
 outfile:out+'molstar.js',
 external:['crypto','fs','path','stream'],
 define:{'process.env.NODE_ENV':'"production"','process.env.DEBUG':'false'},
 plugins:[lazyElementSymbolCache],
 legalComments:'none',logLevel:'warning',
 banner:{js:`/*! Mol* ${molstarPackage.version} (https://molstar.org), MIT licence; trimmed viewer build with the MolViewSpec extension only. */`},
});
await copyFile(require.resolve('molstar/build/viewer/molstar.css'),out+'molstar.css');
const size=(await readFile(out+'molstar.js')).length;
console.log(`Wrote public/vendor/molstar.js (${(size/1024/1024).toFixed(2)} MB) from Mol* ${molstarPackage.version}`);
