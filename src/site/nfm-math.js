// Original article equations rendered with the same KaTeX version as the source site.
const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/katex/katex.min.css';document.head.append(css);
const postCSS=document.createElement('link');postCSS.rel='stylesheet';postCSS.href=new URL('./nfm-post.css',import.meta.url).href;document.head.append(postCSS);
for(const file of ['katex.min.js','auto-render.min.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/katex/'+file;script.onload=resolve;script.onerror=reject;document.head.append(script);});
renderMathInElement(document.querySelector('.nfm-post'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],throwOnError:false});
