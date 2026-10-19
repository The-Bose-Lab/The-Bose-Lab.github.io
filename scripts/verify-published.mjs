import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const paths=JSON.parse(await readFile('.published-files.json','utf8'));
assert(paths.includes('.nojekyll'));
assert(paths.includes('normalizing-flow-maps/index.html'));
for(const path of paths)assert((await readFile(path)).equals(await readFile('dist/'+path)),'Published file differs from the production build: '+path);
console.log(`All ${paths.length} committed production files match the checked build.`);
