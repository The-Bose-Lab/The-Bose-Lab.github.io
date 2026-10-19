export function bindNewsFilters(){
 const filters=document.querySelector('.news-filters');if(!filters)return;
 const rows=[...document.querySelectorAll('#news-results .latest-row')],buttons=[...filters.querySelectorAll('.news-filter')],status=document.querySelector('#news-filter-status');
 let active='';const url=new URL(location.href);
 function apply(kind){
  active=kind;let count=0;
  for(const row of rows){row.hidden=!!active&&row.dataset.kind!==active;if(!row.hidden)count++;}
  for(const button of buttons)button.setAttribute('aria-pressed',String(button.dataset.newsKind===active));
  const selected=buttons.find(button=>button.dataset.newsKind===active);
  const label=selected?(selected.querySelector('span')?.textContent||selected.textContent):'';
  status.textContent=`${label?label.trim()+' · ':''}${count} ${count===1?'item':'items'}`;
 }
 for(const button of buttons)button.addEventListener('click',()=>{const kind=active===button.dataset.newsKind?'':button.dataset.newsKind;kind?url.searchParams.set('category',kind):url.searchParams.delete('category');history.replaceState(null,'',url);apply(kind);});
 apply(buttons.some(b=>b.dataset.newsKind===url.searchParams.get('category'))?url.searchParams.get('category'):'');
}
