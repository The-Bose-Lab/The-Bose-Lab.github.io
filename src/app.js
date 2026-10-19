import './site/site.css';
import './site/navigation.css';
import './site/design-code.css';
import './responsive.css';
import {bindSiteNavigation} from './site/site-navigation.js';
import {bindNewsFilters} from './site/news-interactions.js';
import {bindPublicationFilters} from './site/research-interactions.js';
import {bindPageLoading,beginPageLoading,finishPageLoading} from './site/page-loading.js';
const {page,topic}=document.body.dataset;
bindPageLoading();beginPageLoading();
bindSiteNavigation();bindNewsFilters();bindPublicationFilters();
await document.fonts.ready;
document.documentElement.dataset.siteReady='true';document.body.dataset.siteReady='true';
try{
 if(page==='research'){
  const {bindResearchLandscape}=await import('./site/research-landscape.js');
  const {getTheme}=await import('./site/config.js');await bindResearchLandscape(getTheme());
 }
 if(page==='post')await import('./site/nfm-math.js');
}catch(error){
 document.body.dataset.enhancementError=String(error);
 document.querySelector('.landscape-overview')?.classList.add('is-static');
 document.querySelector('.landscape-peaks')?.style.removeProperty('visibility');
 const visual=document.querySelector('#topic-visual');if(visual)visual.hidden=true;
 console.warn('Scientific enhancement unavailable',error);
}

finishPageLoading();
