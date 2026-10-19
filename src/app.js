import './site/site.css';
import './site/navigation.css';
import './site/design-code.css';
import './responsive.css';
import {bindSiteNavigation} from './site/site-navigation.js';
import {bindNewsFilters} from './site/news-interactions.js';
import {bindPublicationFilters} from './site/research-interactions.js';
const {page,topic}=document.body.dataset;
bindSiteNavigation();bindNewsFilters();bindPublicationFilters();
if(page==='research'){
 const {bindResearchLandscape}=await import('./site/research-landscape.js');
 const {getTheme}=await import('./site/config.js');await bindResearchLandscape(getTheme());
}
if(page==='post')await import('./site/nfm-math.js');
await document.fonts.ready;
document.documentElement.dataset.siteReady='true';document.body.dataset.siteReady='true';
