// Encodes the mmCIF hero structure as BinaryCIF for the Mol* home-page hero
// (the text .cif.txt copy stays for the research page's in-browser parser).
//
//   cd scripts/molstar && pnpm install --frozen-lockfile && node encode-bcif.mjs
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),assets=new URL('../../public/assets/',import.meta.url).pathname;
for(const name of ['1D09-assembly1']){
 execFileSync(process.execPath,[require.resolve('molstar/lib/commonjs/cli/cif2bcif/index.js'),assets+name+'.cif.txt',assets+name+'.bcif'],{stdio:'inherit'});
 console.log(`\nWrote public/assets/${name}.bcif`);
}
