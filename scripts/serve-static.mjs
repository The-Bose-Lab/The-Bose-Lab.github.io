// Serves a published site root the way GitHub Pages does, for local previews
// and load-time comparisons: gzip for text-like types and unknown binaries,
// no gzip for .pdb/.cif (served as application/vnd.palm, chemical/x-cif),
// images, fonts and video; Cache-Control: max-age=600.
//
//   node scripts/serve-static.mjs . 8081            # this checkout
//   node scripts/serve-static.mjs ../site-main 8080 # another worktree
import http from 'node:http';
import {createReadStream, statSync, existsSync} from 'node:fs';
import {extname, join, normalize} from 'node:path';
import zlib from 'node:zlib';
const root=process.argv[2]||'.',port=Number(process.argv[3]||8080);
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.pdb':'application/vnd.palm','.cif':'chemical/x-cif','.md':'text/markdown; charset=utf-8','.yml':'text/yaml','.gz':'application/gzip','.bcif':'application/octet-stream'};
const compressible=new Set(['.html','.js','.mjs','.css','.json','.svg','.txt','.md','.yml']);
http.createServer((req,res)=>{
 let path=decodeURIComponent(new URL(req.url,'http://x').pathname);
 if(path.endsWith('/'))path+='index.html';
 let file=normalize(join(root,path));
 if(!file.startsWith(normalize(root))){res.writeHead(403);res.end();return;}
 if(existsSync(file)&&statSync(file).isDirectory()){res.writeHead(301,{location:path+'/'});res.end();return;}
 if(!existsSync(file)){res.writeHead(404,{'content-type':'text/plain'});res.end('not found: '+path);return;}
 const ext=extname(file),type=types[ext]||'application/octet-stream',size=statSync(file).size;
 const gzip=(compressible.has(ext)||type==='application/octet-stream')&&size>=1000&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
 const headers={'content-type':type,'cache-control':'max-age=600','vary':'Accept-Encoding'};
 if(gzip){headers['content-encoding']='gzip';res.writeHead(200,headers);createReadStream(file).pipe(zlib.createGzip({level:6})).pipe(res);}
 else{headers['content-length']=size;res.writeHead(200,headers);createReadStream(file).pipe(res);}
}).listen(port,'127.0.0.1',()=>console.log(`serving ${root} on http://127.0.0.1:${port}`));
