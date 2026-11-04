import type{Configuration}from'./configuration';
import type{Connection}from'./connection';
import type{GardenScene}from'./scene';
import{yardPhotograph}from'./yard-photograph';
import{routePower}from'./presentation-state';
import{escapeHtml as esc}from'./panels';
import{reading,formatReading as fmt}from'./device-data';
export function startPresentation(config:Configuration,connection:Connection,garden:GardenScene){
 const photo=yardPhotograph(config,connection,garden),badge=document.createElement('div');badge.className='presentation-status';badge.setAttribute('role','status');
 const energy=document.createElement('button');energy.className='energy-mode-toggle';energy.textContent='ϟ Energi';energy.setAttribute('aria-pressed','false');
 const legend=document.createElement('section');legend.className='energy-network-legend';legend.hidden=true;
 const outline=document.createElement('div');outline.className='object-outline';outline.hidden=true;outline.setAttribute('aria-hidden','true');document.body.append(badge,energy,legend,outline);
 let lastHover=0,serial=0,busy=false,selected='';
 function refresh(){
  document.body.classList.toggle('energy-view',garden.energyNetwork.enabled);
  if(garden.energyNetwork.enabled){const content='<h3>Energiflöden / röntgenvy</h3><p>Schematiska sträckor visas genom mark och byggnader. Inga grävunderlag.</p>'+(config.value.energyRoutes??[]).map(r=>`<article><i style="background:${r.color}"></i><strong>${esc(r.name)}</strong><span>${esc(fmt(routePower(r,connection.states,connection.connected),'kW'))}</span><small>${r.confirmed?'Användarbekräftad sträckning':'Schematisk sträckning'}</small></article>`).join('')+(!(config.value.energyRoutes?.length)?'<p>Inga ledningar konfigurerade. Lägg till dem under Redigera → Energi.</p>':'');if(legend.innerHTML!==content)legend.innerHTML=content;}
  const focused=document.activeElement?.closest<HTMLElement>('[data-object],[data-hero-object]');if(focused)selected=focused.dataset.object??focused.dataset.heroObject??selected;const bounds=selected?garden.screenBounds(selected):null,o=config.value.objects.find(o=>o.id===selected);outline.hidden=!bounds||!o||document.body.classList.contains('home-list')||document.body.classList.contains('clean-3d')||document.body.classList.contains('yard-photo-home');
  if(bounds&&o){Object.assign(outline.style,{left:bounds.x+'px',top:bounds.y+'px',width:Math.max(16,bounds.width)+'px',height:Math.max(16,bounds.height)+'px',color:o.type==='car'?'#75aaff':o.type==='solar'?'#36e4ee':o.type==='mower'||o.type==='light'?'#9bff4d':'#eef3ff'});outline.textContent=o.name+(connection.connected?(o.type==='car'?' · '+fmt(reading(o,connection.states,'battery_level','state'),'%'):o.type==='solar'?' · '+fmt(reading(o,connection.states,'production_kw','state'),'kW'):o.type==='mower'?' · '+(connection.states.get(o.entityId)?.state??'Saknar data'):''):' · Frånkopplad');}
 }
 async function enter(action:()=>void){if(busy)return;if(document.body.classList.contains('home-list'))document.getElementById('list-button')?.click();const n=++serial;busy=true;badge.textContent='Förbereder 3D…';try{await photo.enter(()=>{if(n===serial)action();});if(n===serial)badge.textContent='';}catch(error){badge.textContent=(error as Error).message;}finally{if(n===serial)busy=false;}}
 energy.onclick=()=>{if(garden.energyNetwork.enabled){garden.energyNetwork.enabled=false;legend.hidden=true;energy.setAttribute('aria-pressed','false');return;}void enter(()=>{garden.energyNetwork.enabled=true;legend.hidden=false;energy.setAttribute('aria-pressed','true');refresh();});};
 const point=(e:Event)=>{const node=(e.target as HTMLElement).closest<HTMLElement>('[data-object],[data-hero-object]');if(node)selected=node.dataset.object??node.dataset.heroObject??'';};
 const move=(e:PointerEvent)=>{if(e.target!==garden.renderer.domElement||performance.now()-lastHover<100)return;lastHover=performance.now();selected=garden.hoverAtScreen(e.clientX,e.clientY)??'';};document.addEventListener('pointermove',move);
 const clear=()=>{selected='';outline.hidden=true;};document.addEventListener('pointerover',point);document.addEventListener('focusin',point);document.addEventListener('pointerout',clear);
 const timer=setInterval(refresh,120);return{enter,showPhoto:(id:'home'|'janne')=>photo.showPhoto(id),cancel(clearView=false){++serial;busy=false;photo.cancel();badge.textContent='';if(clearView){selected='';outline.hidden=true;garden.energyNetwork.enabled=false;legend.hidden=true;energy.setAttribute('aria-pressed','false');}},home(value:boolean){photo.home(value);if(value){garden.energyNetwork.enabled=false;legend.hidden=true;energy.setAttribute('aria-pressed','false');}refresh();},dispose(){document.body.classList.remove('energy-view');++serial;clearInterval(timer);photo.dispose();document.removeEventListener('pointermove',move);document.removeEventListener('pointerover',point);document.removeEventListener('focusin',point);document.removeEventListener('pointerout',clear);for(const node of[badge,energy,legend,outline])node.remove();}};
}
