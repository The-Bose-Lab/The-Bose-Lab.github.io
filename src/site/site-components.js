import {siteHref} from './site-navigation.js';
import{githubIcon,xIcon}from'./github-icon.js';
import{imperialLogo}from'./imperial-logo.js';
import{molecularMark,fieldMotifs}from'./motifs.js';
import{topicContent}from'./topic-content.js';
import{researchLayout}from'./research-config.js';
export const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
export const formatDate=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const external=(href,label)=>`<a class="text-link" href="${e(href)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>`;
const internal=(page,label,topic='')=>`<a class="text-link" data-page="${page}"${topic?` data-topic="${topic}"`:''} href="${siteHref(page,topic)}">${e(label)}</a>`;
const githubLink=href=>`<a class="github-link" href="${e(href)}" target="_blank" rel="noopener noreferrer" aria-label="Bose Lab on GitHub" title="Bose Lab on GitHub">${githubIcon}</a>`;
const chip=(text,kind='science')=>`<span class="molecule-label">${molecularMark(kind)}<span>${e(text)}</span></span>`;
const scholarIcon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 0 9l12 7 10-5.83V17h2V9L12 2Zm-7 11.1V18c0 2.2 3.13 4 7 4s7-1.8 7-4v-4.9L12 17l-7-3.9Z"/></svg>';
export function footer(data){return `<footer class="lab-footer" id="contact"><div class="footer-main"><div class="footer-affiliation"><a class="footer-imperial" href="https://www.imperial.ac.uk/" aria-label="Imperial College London">${imperialLogo.replace('id="Layer_1"','')}</a>${external('https://www.imperial.ac.uk/computing/','Department of Computing')}</div><div class="footer-contact">${internal('join','Join & Contact')}<nav class="social-links" aria-label="Social profiles">${githubLink(data.lab.github)}<a class="github-link x-link" href="${e(data.lab.twitter)}" target="_blank" rel="noopener noreferrer" aria-label="Joey Bose on X" title="Joey Bose on X">${xIcon}</a><a class="github-link scholar-link" href="${e(data.lab.scholar)}" target="_blank" rel="noopener noreferrer" aria-label="Joey Bose on Google Scholar" title="Joey Bose on Google Scholar">${scholarIcon}</a></nav></div></div></footer>`;}
function newsKind(n){return n.type==='Blog'?['Blog','blog']:n.text.includes('recruiting')?['Opportunity','opportunity']:n.text.includes('accepted')||n.text.includes('papers at')?['Publication','publication']:n.text.includes('preprint')?['Preprint','preprint']:['Lab News','news'];}
function newsEntries(data){return [...data.news.map(n=>({...n,type:'News'})),...data.posts.map(p=>({...p,type:'Blog'}))].sort((a,b)=>b.date.localeCompare(a.date)||(a.type===b.type?0:a.type==='Blog'?-1:1));}
function newsFilters(data){
 const present=new Set(newsEntries(data).map(n=>newsKind(n)[1])),categories=[['Publication','publication'],['Preprint','preprint'],['Blog','blog'],['Opportunity','opportunity'],['Lab News','news']].filter(([,kind])=>present.has(kind));
 return `<div class="news-filters" role="group" aria-label="Filter news by category">${categories.map(([label,kind])=>`<button type="button" class="molecule-label news-filter" data-kind="${kind}" data-news-kind="${kind}" aria-pressed="false" aria-controls="news-results">${molecularMark(kind)}<span>${label}</span></button>`).join('')}</div><span class="news-filter-status" id="news-filter-status" role="status"></span>`;
}
function latestRows(data,limit){
 const entries=newsEntries(data);
 return `<div class="latest-list"${limit?'':' id="news-results"'}>${entries.slice(0,limit??entries.length).map(n=>{const[label,kind]=newsKind(n);return `<article class="latest-row" data-kind="${kind}"><div class="entry-meta">${chip(label,kind)}<time datetime="${n.date}">${formatDate(n.date)}</time></div><div class="entry-copy">${n.type==='Blog'?`<h3 class="news-announcement">${n.newsTitle?`The ${internal('post','Normalizing Flow Maps')} blogpost is out!`:internal('post',n.title)}</h3>${limit?'':`<p>${e(n.excerpt)}</p>`}`:`<p>${e(n.text.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u,''))}</p>`}</div></article>`;}).join('')}</div>`;
}
export function positions(data,full=false){
 const [intro,phd]=data.join.text.split('Imperial PhD applicants: ');
 const joinCopy=`<p>${e(intro.trim())}</p>${full?'<p>Please read our representative papers before reaching out.</p>':phd?`<div class="phd-applicants"><h3>Imperial PhD applicants</h3><p>${e(phd[0].toUpperCase()+phd.slice(1))}</p></div>`:''}`;
 const heading=e(data.join.heading).replace('&lt;em&gt;','<em>').replace('&lt;/em&gt;','</em>');
 const applicationDetails=full?`<div class="link-row">${internal('research','Read our research')}</div><div class="application-list">${data.applications.filter(a=>a.title!=='Research fit').map(a=>`<article><h3>${molecularMark('science')}<span>${e(a.title)}</span></h3><p>${e(a.text)}</p></article>`).join('')}</div>`:`<div class="link-row">${internal('join','Application Details')}</div>`;
 return `<section class="positions recruitment-card" id="positions"><div class="section-heading">${chip(data.join.kicker,'opportunity')}<h2>${heading}</h2></div><div class="positions-copy">${joinCopy}${applicationDetails}</div></section>`;
}
export function homeTail(data){return `<main class="content-main home-content"><section id="latest"><div class="section-heading"><h2>${molecularMark('flow')}<span>News</span></h2>${internal('latest','All News')}</div>${latestRows(data,5)}</section></main>${footer(data)}`;}
function personLinks(p){const website=p.website;return (website?external(website,'Website'):'')+(p.linkedin?external(p.linkedin,'LinkedIn'):'')+['scholar','github','twitter','email'].filter(k=>p[k]).map(k=>external(k==='email'?'mailto:'+p[k]:p[k],{scholar:'Scholar',github:'GitHub',twitter:'X',email:'Email'}[k])).join('');}
function person(p,pi=false){const alumnus=p.role==='alumni';return `<article class="person${pi?' principal':''}${alumnus?' alumnus':''}">${alumnus?'':`<img src="${e(p.photo)}" alt="${e(p.name)}" width="420" height="420"${pi?'':' loading="lazy"'}>`}<div><h${pi?'2':'3'}>${e(p.name)}</h${pi?'2':'3'}><p class="person-role">${e(pi?p.position:p.title)}</p>${p.cosupervised?`<p class="muted">${e(p.cosupervised)}</p>`:''}${p.bio?`<p>${e(p.bio)}</p>`:''}<div class="link-row">${personLinks(p)}</div></div></article>`;}
function groupPortrait(data,layout){
 if(layout==='portraits')return'';
 const image=data.groupPhoto?.src?`<img src="${e(data.groupPhoto.src)}" alt="${e(data.groupPhoto.alt||'Bose Lab group photograph')}">`:`<div class="group-photo-placeholder" role="img" aria-label="Reserved space for the Bose Lab group photograph"><span>Group Photograph</span></div>`;
 return `<section class="group-portrait ${layout==='contact'?'group-portrait-split':''}"><figure>${image}${data.groupPhoto?.caption?`<figcaption>${e(data.groupPhoto.caption)}</figcaption>`:''}</figure><div class="group-introduction"><h2>Bose Lab</h2><p>${e(data.lab.institution)}</p><p>${e(data.lab.blurb)}</p></div></section>`;
}
function people(data,layout='portraits'){return `<div class="page-heading"><h1>People</h1><p>Meet the researchers behind Bose Lab.</p></div><section class="people-section principal-section"><div class="section-heading"><h2>${molecularMark('science')}<span>Principal Investigator</span></h2></div>${person(data.people.find(p=>p.role==='pi'),true)}</section>${[['phd','Doctoral Students'],['msc','Master’s Students'],['visitor','Visitors'],['alumni','Alumni']].map(([role,label])=>{const list=data.people.filter(p=>p.role===role);return list.length?`<section class="people-section"><div class="section-heading"><h2>${molecularMark('science')}<span>${label}</span></h2></div><div class="people-grid${role==='alumni'?' alumni-grid':''}">${list.map(p=>person(p)).join('')}</div></section>`:'';}).join('')}`;}
const authorKey=name=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const authorAliases={'Joey Bose':['A. J. Bose'],'Francesco Ruscio':['F. M. Ruscio'],'Timothy Hitge':['T. J. Hitge']};
export function formatAuthors(authors,people){
 const members=new Set(people.flatMap(p=>{const words=p.name.trim().split(/\s+/),short=words.slice(0,-1).map(w=>w[0]+'.').join(' ')+' '+words.at(-1);return[p.name,short,...(authorAliases[p.name]||[])].map(authorKey);}));
 return authors.split(',').map(part=>{const match=part.match(/^(\s*)(.*?)([†*‡]*\s*)$/),[,space,name,notes]=match;return e(space)+(members.has(authorKey(name))?`<strong>${e(name)}</strong>`:e(name))+e(notes);}).join(',');
}
function publication(p,area=p.areas?.[0]||'foundations',people=[]){
 const figure=p.figure?`<img src="${e(p.figure)}" alt="Figure from ${e(p.title)}" loading="lazy" width="220" height="155">`:'';
 return `<li class="paper" data-area="${area}" data-year="${p.year}" data-topics="${e(p.areas.join(' '))}" data-search="${e([p.title,p.authors,p.venue,...p.tags].join(' ').toLowerCase())}" id="${e(p.id)}">${figure?`<div class="paper-figure">${p.link?`<a href="${e(p.link)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${e(p.title)}">${figure}</a>`:figure}</div>`:''}<div class="paper-copy"><div class="entry-meta"><span class="venue-label">${molecularMark(fieldMotifs[area])}<span>${e(p.venue)}</span></span></div><h3>${p.link?external(p.link,p.title):e(p.title)}</h3><p class="paper-authors">${formatAuthors(p.authors,people)}</p></div></li>`;
}

const topicIds=['foundations','science','sampling','safety'];
const topicNames=['Foundations of Generative Models','AI for Science','Neural Sampling','Safety & Robustness'];
function publicationArchive(data,area=''){
 return `<section class="research-publications" aria-label="Publication filters and papers"><div class="publication-tools motif-card"><label for="paper-search">Search Papers<input id="paper-search" type="search" placeholder="Title, author, topic…"></label><label for="paper-area">Research Topic<select id="paper-area"><option value="">All Topics</option>${topicIds.map((id,i)=>`<option value="${id}"${area===id?' selected':''}>${topicNames[i]}</option>`).join('')}</select></label><label for="paper-year">Year<select id="paper-year"><option value="">All Years</option>${[...new Set(data.publications.map(p=>p.year))].map(y=>`<option>${y}</option>`).join('')}</select></label><p id="paper-count" role="status">${data.publications.length} papers</p></div><ol class="paper-list" id="archive">${data.publications.map(p=>publication(p,undefined,data.people)).join('')}</ol></section>`;
}
function topicLinks(active=''){
 return `<nav class="topic-index" aria-label="Research directions">${topicIds.map((id,i)=>`<a class="topic-chip" data-area="${id}" data-page="research" data-topic="${id}" href="${siteHref('research',id)}"${active===id?' aria-current="page"':''}>${molecularMark(fieldMotifs[id])}<span>${topicNames[i]}</span></a>`).join('')}</nav>`;
}
function topicDetail(data,topic){
 const i=topicIds.indexOf(topic),r=data.research[i],c=topicContent[topic],papers=data.publications.filter(p=>p.areas.includes(topic));
 return `<article class="topic-article"><div class="page-heading">${internal('research','All Research Directions')}<h1>${e(r.title)}</h1></div><section class="topic-introduction"><div class="topic-visual" id="topic-visual" data-topic="${topic}" role="img" aria-label="${e(c.visual)}"></div><div class="topic-annotation"><p>${e(c.annotation)}</p><div class="topic-keywords">${c.keywords.map(k=>`<span>${e(k)}</span>`).join('')}</div></div></section><section class="topic-key-directions"><div class="section-heading"><h2>${molecularMark(fieldMotifs[topic])}<span>Key Directions</span></h2></div><div class="key-direction-grid">${c.directions.map(([title,text])=>`<article><h3>${e(title)}</h3><p>${e(text)}</p></article>`).join('')}</div></section><section><div class="section-heading"><h2>${molecularMark(fieldMotifs[topic])}<span>Selected Publications</span></h2>${internal('publications','All Publications')}</div><ol class="paper-list">${papers.slice(0,5).map(p=>publication(p,topic,data.people)).join('')}</ol></section></article>`;
}
function landscapeResearch(data){return `<div class="page-heading research-overview"><h1>Research</h1><p>We investigate generative models and their applications in science.</p></div><section class="landscape-overview"><div class="landscape-map-area"><div id="research-landscape"></div><nav class="landscape-peaks" aria-label="Explore research directions">${data.research.map((r,i)=>`<div class="peak-link" role="group" data-topic="${topicIds[i]}" data-title="${e(r.title)}" data-href="${siteHref('research',topicIds[i])}"><button class="peak-title" type="button">${topicNames[i]}</button></div>`).join('')}</nav></div><div class="atlas-annotation" aria-live="polite"><p></p><a class="atlas-explore">Explore</a></div></section><details class="atlas-publications"><summary>${molecularMark('flow')}<span>View All Publications</span><span class="archive-count">${data.publications.length} Papers</span></summary>${publicationArchive(data)}</details>`;}

function research(data,options={}){return topicIds.includes(options.topic)?topicDetail(data,options.topic):landscapeResearch(data);}

function blog(data){return `<div class="page-heading"><h1>Blog</h1></div>${data.posts.map(p=>`<article class="blog-entry motif-card"><div class="entry-meta"><time datetime="${p.date}">${formatDate(p.date)} · ${e(p.author)}${p.readingTime?` · ${e(p.readingTime)}`:''}</time></div><h2>${internal('post',p.title)}</h2><p>${e(p.excerpt)}</p>${internal('post','Read the Post')}</article>`).join('')}`;}
function talks(data){return `<div class="page-heading"><h1>Talks</h1></div>${data.talks.map(t=>`<article class="blog-entry motif-card" id="${e(t.id)}"><div class="entry-meta"><span>${e(t.kind)} · ${e(t.when)} · ${e(t.speaker)}</span></div><h2><a class="text-link" href="talks/${e(t.id)}/">${e(t.title)}</a></h2>${t.abstract.map(p=>`<p>${e(p)}</p>`).join('')}<div class="link-row"><a class="text-link" href="talks/${e(t.id)}/">Open the Slides</a>${t.links.map(l=>l.page?internal(l.page,l.label):external(l.href,l.label)).join('')}</div><div class="entry-meta talk-hint">The slides run in your browser: click or use the arrow keys to advance, and press f for full screen.</div></article>`).join('')}`;}
export function renderPage(page,data,options={}){
 switch(page){
 case'team':return people(data,options.teamLayout);
 case'research':return research(data,options);
 case'latest':return `<div class="page-heading news-page-heading"><h1>News</h1>${newsFilters(data)}</div>${latestRows(data)}`;
 case'blog':return blog(data);
 case'talks':return talks(data);
 case'post':{const p=data.posts[0];return `<article class="blog-post"><div class="page-heading">${internal('blog','All Posts')}<div class="entry-meta"><time datetime="${p.date}">${formatDate(p.date)} · ${e(p.author)}${p.readingTime?` · ${e(p.readingTime)}`:''}</time></div><h1>${e(p.title)}</h1></div><div class="prose motif-card">${p.html}</div></article>`;}
 case'join':return `<div class="page-heading"><h1>Join & Contact</h1></div>${positions(data,true)}<section class="contact-location motif-card"><h2>${molecularMark('science')}<span>Find Us</span></h2><p>${e(data.lab.institution)}<br>${e(data.lab.address)}</p></section>`;
 case'publications':return `<div class="page-heading"><h1>Publications</h1>${internal('research','Browse by Research Direction')}</div><div class="publication-tools motif-card"><label for="paper-search">Search Papers<input id="paper-search" type="search" placeholder="Title, author, topic…"></label><label for="paper-year">Year<select id="paper-year"><option value="">All Years</option>${[...new Set(data.publications.map(p=>p.year))].map(y=>`<option>${y}</option>`).join('')}</select></label><p id="paper-count" role="status">${data.publications.length} papers</p></div><ol class="paper-list" id="archive">${data.publications.map(p=>publication(p,undefined,data.people)).join('')}</ol>`;
 default:return'';
 }
}
