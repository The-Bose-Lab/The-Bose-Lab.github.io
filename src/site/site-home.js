import {imperialLogo} from './imperial-logo.js';
import {bindSiteNavigation} from './site-navigation.js';
export function initHomeShell(){
 document.documentElement.classList.add('has-site-scroll');bindSiteNavigation();
 document.querySelector('.affiliation-logo').setAttribute('aria-label','at Imperial');document.body.dataset.logoPlacement='corner';
 const corner=document.createElement('div');corner.className='opening-imperial';corner.setAttribute('role','img');corner.setAttribute('aria-label','Imperial College London');corner.innerHTML=imperialLogo.replace('id="Layer_1"','');document.querySelector('.copy').append(corner);
 document.documentElement.dataset.homeContentReady='true';
 let queued=false;
 function report(){queued=false;const stage=document.querySelector('#story-stage'),release=Math.max(1,stage.offsetHeight-document.querySelector('.story-viewport').clientHeight),overrun=Math.max(0,scrollY-release),fade=Math.min(1,overrun/Math.max(1,innerHeight*.7)),surface=Math.max(0,Math.min(1,(scrollY-release+32)/32));document.documentElement.style.setProperty('--header-surface-opacity',surface);document.documentElement.style.setProperty('--scene-departure',1-fade*fade*(3-2*fade));}
 const queue=()=>{if(!queued){queued=true;requestAnimationFrame(report);}};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);report();
}
