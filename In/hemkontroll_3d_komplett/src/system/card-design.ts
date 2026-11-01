/** Stable themes and DOM reconciliation preserve active controls and scroll positions. */
export function cardTheme(id:string){let hash=0;for(const c of id)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;return `palette-${hash%7}`;}
const pressed=new WeakSet<Element>();
if(typeof document!=='undefined'){
 document.addEventListener('pointerdown',e=>{if(!(e.target instanceof Element))return;const el=e.target.closest('button,input,select,textarea');if(!el)return;pressed.add(el);const release=()=>{pressed.delete(el);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);window.removeEventListener('blur',release);};window.addEventListener('pointerup',release,{once:true});window.addEventListener('pointercancel',release,{once:true});window.addEventListener('blur',release,{once:true});},{capture:true});
}
function key(node:Node){if(!(node instanceof Element))return undefined;return node.getAttribute('data-card')??node.getAttribute('data-dom-key')??(node.id?'id:'+node.id:undefined);}
function interacting(el:HTMLElement){return pressed.has(el)||(el===document.activeElement&&el.matches('input,select,textarea'));}
export function updateMarkup(root:HTMLElement,html:string){
 const template=document.createElement('template');template.innerHTML=html;
 function sync(parent:Node,next:Node){const incoming=Array.from(next.childNodes),keyed=new Map<string,ChildNode>();for(const child of Array.from(parent.childNodes)){const id=key(child);if(id)keyed.set(id,child);}
 for(let i=0;i<incoming.length;i++){const fresh=incoming[i]!;let old=parent.childNodes[i];const id=key(fresh);
 if(id){const match=keyed.get(id);if(match&&match!==old&&match.parentNode===parent&&key(match)===id){parent.insertBefore(match,old??null);old=match;}}
 if(!old){parent.appendChild(fresh.cloneNode(true));continue;}
 if(old.nodeType!==fresh.nodeType||old.nodeName!==fresh.nodeName){parent.replaceChild(fresh.cloneNode(true),old);continue;}
 if(old instanceof Element&&fresh instanceof Element){const active=old instanceof HTMLElement&&interacting(old);
 for(const a of Array.from(old.attributes))if(!fresh.hasAttribute(a.name)&&!(active&&['value','checked','selected'].includes(a.name)))old.removeAttribute(a.name);
 for(const a of Array.from(fresh.attributes)){if(active&&['value','checked','selected'].includes(a.name))continue;if(old.getAttribute(a.name)!==a.value)old.setAttribute(a.name,a.value);}
 if(!active||!old.matches('input,select,textarea'))sync(old,fresh);
 }else if(old.nodeValue!==fresh.nodeValue)old.nodeValue=fresh.nodeValue;
 }
 while(parent.childNodes.length>incoming.length)parent.lastChild?.remove();
 }
 sync(root,template.content);
}
