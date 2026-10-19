import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

let renderer;
export async function prerenderArticle(html){
 if(!renderer){const scope={};runInNewContext(await readFile('scripts/vendor/katex.min.js','utf8'),scope);renderer=scope.katex;}
 html=html.replace(/<span class="math (inline|display)">([\s\S]*?)<\/span>/g,(_,mode,source)=>{
  const tex=source.trim().slice(2,-2).replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&#39;',"'").replaceAll('&quot;','"');
  return `<span class="math ${mode}">${renderer.renderToString(tex,{displayMode:mode==='display',throwOnError:true})}</span>`;
 });
 return html.replace(/<img\b[^>]*\/>/g,tag=>{
  const src=tag.match(/src="([^"]+)"/)?.[1];
  if(!/\/(WY|chignolin)-md-transparent\.webp$/.test(src||''))return tag;
  const alt=tag.match(/alt="([^"]*)"/)?.[1]||'',name=src.replace(/\.webp$/,''),[width,height]=src.includes('/WY-')?[467,538]:[633,500];
  return `<video class="figure-img" width="${width}" height="${height}" role="img" aria-label="${alt}" muted loop playsinline preload="none" poster="${name}-poster.webp" data-motion-src="${name}.mp4"></video><noscript>${tag}</noscript>`;
 });
}
