// Mouse hover, keyboard focus and touch selection share one visible topic.
// Pointer focus from a click must never keep an abandoned hover open.
export function researchSelection(show){
 let hover='',focus='',touch='';
 const paint=()=>show(hover||focus||touch);
 return{
  hover(id){hover=id;touch='';paint();},
  leave(){hover='';paint();},
  focus(id){hover='';focus=id;touch='';paint();},
  blur(){focus='';paint();},
  pointer(){focus='';},
  select(id){hover=focus='';touch=id;paint();},
  clear(){hover=focus=touch='';paint();}
 };
}
