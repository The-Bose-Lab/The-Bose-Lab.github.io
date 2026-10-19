import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
async function htmlFiles(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())files.push(...await htmlFiles(path));else if(path.endsWith('.html'))files.push(path);}return files;}
for(const path of await htmlFiles('dist')){
 const html=await readFile(path,'utf8');
 assert(html.includes('<base href="/">'),'Wrong production base in '+path);
 assert(!html.includes('/preview/'),'Preview URL in production page '+path);
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  const url=match[1];if(/^(?:https?:|mailto:|data:)/.test(url))continue;
  const relative=url.replace(/^\.\//,'').replace(/^\//,'').split(/[?#]/)[0];if(!relative)continue;
  await stat('dist/'+relative+(relative.endsWith('/')?'index.html':''));
 }
}
const post=await readFile('dist/normalizing-flow-maps/index.html','utf8');
assert(post.includes('<title>Normalizing Flow Maps — Bose Lab</title>'));
assert(post.includes('href="https://the-bose-lab.github.io/normalizing-flow-maps/"'));
assert.equal((post.match(/class="katex"/g)||[]).length,77);
assert((await readFile('dist/blog/index.html','utf8')).includes('href="/normalizing-flow-maps/"'));
for(const asset of ['favicon.svg','favicon.ico','apple-touch-icon.png'])assert((await stat('dist/'+asset)).size>0);
console.log('Production paths, assets, NFM canonical URL and all 77 equations passed.');
