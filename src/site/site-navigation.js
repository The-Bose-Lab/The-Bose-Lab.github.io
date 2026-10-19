export const sitePages={home:'Home',team:'Team',research:'Research',latest:'News',blog:'Blog',post:'Blog Post',join:'Join & Contact',publications:'Publications'};
export const siteTopics=['foundations','science','sampling','safety'];
const paths={home:'',team:'team/',research:'research/',latest:'news/',blog:'blog/',post:'blog/normalizing-flow-maps/',join:'join/',publications:'publications/'};
let buildBase='/';
export function setRouteBase(base){buildBase=base;}
export function siteHref(page,topic=''){
 const base=typeof document==='undefined'?buildBase:new URL(document.baseURI).pathname;
 return base+(paths[page]??'')+(page==='research'&&siteTopics.includes(topic)?topic+'/':'');
}
export function bindSiteNavigation(root=document){
 document.documentElement.dataset.navigationReady='true';
 for(const a of root.querySelectorAll('a[data-page]'))a.href=siteHref(a.dataset.page,a.dataset.topic);
 const toggle=root.querySelector('.nav-toggle'),nav=root.querySelector('#main-navigation');
 toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){toggle.click();toggle.focus();}});
}
export function siteHeader(current=''){
 return `<header class="content-header"><a class="wordmark clickable-link" data-page="home" href="${siteHref('home')}">Bose Lab</a><button class="nav-toggle" aria-expanded="false" aria-controls="main-navigation" aria-label="Open navigation"><span class="nav-toggle-icon" aria-hidden="true"><span class="nav-toggle-middle"></span></span></button><nav id="main-navigation" aria-label="Main navigation">${['home','team','research','latest','blog','join'].map(id=>`<a class="clickable-link" data-page="${id}" href="${siteHref(id)}"${id===current?' aria-current="page"':''}>${sitePages[id]}</a>`).join('')}</nav></header>`;
}
