import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {parse} from 'yaml';
import {renderPage,footer,homeTail} from '../src/site/site-components.js';
import {siteHeader,setRouteBase,sitePages,siteHref} from '../src/site/site-navigation.js';
export async function generate(base='/'){
 setRouteBase(base);const imageSizes=JSON.parse(await readFile('scripts/image-sizes.json','utf8'));const data={};for(const f of await readdir('_data'))if(f.endsWith('.yml'))data[f.slice(0,-4)]=parse(await readFile('_data/'+f,'utf8'));
 data.posts[0].html=(await readFile('content/normalizing-flow-maps.html','utf8')).replaceAll('.gif"','.webp"');
 const routes=[['home',''],['team','team'],['research','research'],...['foundations','science','sampling','safety'].map(t=>['research','research/'+t,t]),['latest','news'],['blog','blog'],['post','blog/normalizing-flow-maps'],['join','join'],['publications','publications']];
 const inputs=[];
 for(const[page,path,topic='']of routes){
  const dir='.generated/'+path;await mkdir(dir,{recursive:true});
  const title=page==='home'?'Bose Lab — Generative Models for Science':`${topic?data.research[['foundations','science','sampling','safety'].indexOf(topic)].title:sitePages[page]} — Bose Lab`;
  const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><title>${title.replaceAll('&','&amp;')}</title><meta name="description" content="Bose Lab at Imperial College London. Generative models, neural sampling, AI for science, and safety and robustness."><meta name="theme-color" content="#FCFCF4"><link rel="preload" href="${base}assets/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin><style>:root{--bg:#FCFCF4;--ink:#162D65;--muted:#4F5D79;--a:#4167C7;--b:#92AEDF;--c:#A83A42;--d:#FCFCF4;--e:#5F806B;--f:#C09A52;--g:#E8DDBF;--body:'Hanken Grotesk';--display:'Hanken Grotesk';--title-weight:500;--tracking:-.055em;--title-size:140px;--outline:#162D65}html,body{background:#FCFCF4;color:#162D65}</style>`;
  let html;
  if(page==='home'){
   html=await readFile('src/home-template.html','utf8');html=html.replace(/<head>[\s\S]*?<\/head>/,`<head>${head}<script type="module" src="${base}src/home.js"></script></head>`).replace(/<div id="home-header-art">[\s\S]*?<\/header>/,`<div id="home-header-art">${siteHeader('home')}`).replace('<div class="site-tail" id="site-tail"></div>',`<div class="site-tail" id="site-tail">${homeTail(data)}</div>`).replace(/<script type="module" src=".\/render.js"><\/script>/,'').replace('<body>','<body data-page="home" data-theme="axiom-sans" data-mode="light" data-link-style="capsule" data-logo-colour="ink">');
  }else html=`<!doctype html><html lang="en"><head>${head}<script type="module" src="${base}src/app.js"></script></head><body class="site-view" data-page="${page}" data-topic="${topic}" data-theme="axiom-sans" data-mode="light" data-research-navigation="true" data-link-style="capsule" data-logo-colour="ink"><noscript><style>.landscape-map-area{height:auto!important;min-height:0!important}#research-landscape{display:none}.landscape-peaks{position:relative!important;display:flex!important;flex-wrap:wrap;gap:16px;padding:0!important}.landscape-peaks .peak-link{position:relative!important;left:auto!important;top:auto!important;transform:none!important;height:auto!important}</style></noscript><a class="skip-link" href="#main">Skip to content</a><div id="site-header">${siteHeader(page==='post'?'blog':page)}</div><main class="content-main quiet-content" id="main">${renderPage(page,data,{topic,researchLayout:'landscape',teamLayout:'portraits'})}</main><div id="site-footer">${footer(data)}</div></body></html>`;
  html=html.replace(/href="#/g,`href="${base}${path?path+'/':''}#`);
  html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1],size=imageSizes[src];return size&&!/\bwidth=/.test(tag)?tag.replace(/\s*\/?>(?=$)/,` width="${size[0]}" height="${size[1]}">`):tag;});
  if(html.includes('site.html?page='))throw new Error('Legacy panel URL in '+path);
  await writeFile(dir+'/index.html',html);inputs.push(new URL('../'+dir+'/index.html',import.meta.url).pathname);
 }
 return inputs;
}
