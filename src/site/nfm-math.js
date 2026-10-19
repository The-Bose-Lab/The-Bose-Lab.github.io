export {bindArticleMedia} from './article-media.js';
// Equations are rendered at build time, using the pinned KaTeX runtime.
if(location.hash)document.fonts.ready.then(()=>document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({block:'start',behavior:'instant'}));
