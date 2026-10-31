/** Stable themes and DOM updates keep ambient animations alive across telemetry. */
export function cardTheme(id:string){let hash=0;for(const c of id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return `palette-${hash%7}`;}
export function updateMarkup(root:HTMLElement,html:string){
 const template=document.createElement('template');template.innerHTML=html;
 function sync(parent:Node,next:Node){
  const incoming=Array.from(next.childNodes);
  incoming.forEach((fresh,i)=>{let old=parent.childNodes[i];
   const key=fresh instanceof HTMLElement?fresh.dataset.card:undefined;
   if(key){const match=Array.from(parent.childNodes).find(n=>n instanceof HTMLElement&&n.dataset.card===key);if(match&&match!==old){parent.insertBefore(match,old??null);old=match;}}
   if(!old){parent.appendChild(fresh.cloneNode(true));return;}
   if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName){parent.replaceChild(fresh.cloneNode(true),old);return;}
   if(old instanceof HTMLElement&&fresh instanceof HTMLElement){
    for(const a of Array.from(old.attributes))if(!fresh.hasAttribute(a.name))old.removeAttribute(a.name);
    for(const a of Array.from(fresh.attributes))if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);
    if(old!==document.activeElement||!old.matches('input,select,textarea'))sync(old,fresh);
   }else if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;
  });
  while(parent.childNodes.length>incoming.length)parent.lastChild?.remove();
 }
 sync(root,template.content);
}

