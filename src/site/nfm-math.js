import './nfm-post.css';
// Original article equations rendered with the same KaTeX version as the source site.
const css=document.createElement('link');css.rel='stylesheet';css.href='./vendor/katex/katex.min.css';const styled=new Promise((resolve,reject)=>{css.onload=resolve;css.onerror=reject;});document.head.append(css);
for(const file of ['katex.min.js','auto-render.min.js'])await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./vendor/katex/'+file;script.onload=resolve;script.onerror=reject;document.head.append(script);});
renderMathInElement(document.querySelector('.nfm-post'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}],throwOnError:false});

await styled;await document.fonts.ready;

if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));target?.scrollIntoView({block:'start',behavior:'instant'});}
