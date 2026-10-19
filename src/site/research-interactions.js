export function bindPublicationFilters(){
 const search=document.querySelector('#paper-search'),year=document.querySelector('#paper-year'),area=document.querySelector('#paper-area');
 if(!search||!year)return;
 const rows=[...document.querySelectorAll('#archive .paper')];
 function filter(){let count=0;const text=search.value.trim().toLowerCase();for(const row of rows){const visible=(!year.value||row.dataset.year===year.value)&&(!area?.value||row.dataset.topics.split(' ').includes(area.value))&&row.dataset.search.includes(text);row.hidden=!visible;if(visible)count++;}document.querySelector('#paper-count').textContent=`${count} ${count===1?'paper':'papers'}`;}
 for(const el of [search,year,area].filter(Boolean))el.addEventListener(el===search?'input':'change',filter);filter();
}
