// Download near the figure, decode and play only while it is on screen.
export function bindArticleMedia(){
 const videos=[...document.querySelectorAll('video[data-motion-src]')];
 const visible=new IntersectionObserver(entries=>{for(const {target:video,isIntersecting}of entries){video.dataset.visible=String(isIntersecting);if(isIntersecting&&!document.hidden&&video.src)video.play().catch(()=>{});else video.pause();}});
 const nearby=new IntersectionObserver(entries=>{for(const {target:video,isIntersecting}of entries)if(isIntersecting){video.muted=true;video.src=video.dataset.motionSrc;video.preload='auto';if(video.dataset.visible==='true'&&!document.hidden)video.play().catch(()=>{});nearby.unobserve(video);}},{rootMargin:'350px'});
 for(const video of videos){visible.observe(video);nearby.observe(video);}
 addEventListener('visibilitychange',()=>{for(const video of videos)if(document.hidden)video.pause();else if(video.dataset.visible==='true'&&video.src)video.play().catch(()=>{});});
 addEventListener('pagehide',event=>{for(const video of videos)video.pause();if(!event.persisted){visible.disconnect();nearby.disconnect();}});
 addEventListener('pageshow',()=>{for(const video of videos)if(video.dataset.visible==='true'&&video.src)video.play().catch(()=>{});});
}
