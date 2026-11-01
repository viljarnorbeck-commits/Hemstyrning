/** Disable browser form history, including fields mounted after route changes. */
export function disableInputHistory(){
 const selector='input,textarea,form';
 const disable=(field:Element)=>{if(field.getAttribute('autocomplete')!=='off')field.setAttribute('autocomplete','off');};
 const apply=(node:Node)=>{
  if(!(node instanceof Element))return;
  if(node.matches(selector))disable(node);
  node.querySelectorAll(selector).forEach(disable);
 };
 apply(document.documentElement);
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='attributes'){if(record.target instanceof Element&&record.target.matches(selector))disable(record.target);}
   else for(const node of record.addedNodes)apply(node);
  }
 });
 observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['autocomplete']});
}
