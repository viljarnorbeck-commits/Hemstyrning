import type{Configuration}from'./configuration';
import type{Connection}from'./connection';
import type{GardenScene}from'./scene';
import{photoUsable,routePower}from'./presentation-state';
import{escapeHtml as esc}from'./panels';
import{reading,formatReading as fmt}from'./device-data';
export function startPresentation(config:Configuration,connection:Connection,garden:GardenScene){
 const image=document.createElement('img');image.className='start-photograph';image.alt='Förgenererad vy från gårdens sparade kamera';image.hidden=true;
 const badge=document.createElement('div');badge.className='presentation-status';badge.setAttribute('role','status');
 const energy=document.createElement('button');energy.className='energy-mode-toggle';energy.textContent='ϟ Energi';energy.setAttribute('aria-pressed','false');
 const legend=document.createElement('section');legend.className='energy-network-legend';legend.hidden=true;
 const outline=document.createElement('div');outline.className='object-outline';outline.hidden=true;outline.setAttribute('aria-hidden','true');
 document.body.append(image,badge,energy,legend,outline);
 let lastHover=0;let home=true,busy=false,serial=0,selected='',imageUrl='',shown=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function hidePhoto(){if(!shown&&!image.classList.contains('visible'))return;shown=false;image.classList.remove('visible');document.body.classList.remove('photo-start');}
 function refresh(){
  if(document.body.classList.contains('energy-view')!==garden.energyNetwork.enabled)document.body.classList.toggle('energy-view',garden.energyNetwork.enabled);
  const photo=config.value.startPhoto,valid=config.value.startMode==='photo'&&connection.connected&&photoUsable(photo,garden.visualStamp(),innerWidth/innerHeight);
  const view=garden.captureView(),saved=config.value.startView;const aligned=saved&&view.position.every((v,i)=>Math.abs(v-saved.position[i])<.15)&&view.target.every((v,i)=>Math.abs(v-saved.target[i])<.15)&&Math.abs(view.fov-saved.fov)<.1&&Math.abs(view.zoom-saved.zoom)<.01;
  if(home&&aligned&&!document.body.classList.contains('home-list')&&!document.body.classList.contains('clean-3d')&&!busy&&!garden.energyNetwork.enabled&&config.value.startMode==='photo'&&valid){
   if(photo!.url!==imageUrl){imageUrl=photo!.url;image.onload=()=>refresh();image.onerror=()=>{hidePhoto();badge.textContent='Startbild saknas · levande 3D används';};image.src=imageUrl;}
   if(image.complete&&image.naturalWidth&&!shown){image.hidden=false;shown=true;image.classList.add('visible');document.body.classList.add('photo-start');badge.textContent='STARTBILD · '+new Date(photo!.createdAt).toLocaleTimeString('sv-SE')+' · status visas live';}
  }else{hidePhoto();if(!busy){const text=home&&config.value.startMode==='photo'?'Levande 3D · startbild saknas eller matchar inte scenen':'';if(badge.textContent!==text)badge.textContent=text;}}
  if(garden.energyNetwork.enabled){const content='<h3>Energiflöden / röntgenvy</h3><p>Schematiska sträckor visas genom mark och byggnader. Inga grävunderlag.</p>'+(config.value.energyRoutes??[]).map(r=>`<article><i style="background:${r.color}"></i><strong>${esc(r.name)}</strong><span>${esc(fmt(routePower(r,connection.states,connection.connected),'kW'))}</span><small>${r.confirmed?'Användarbekräftad sträckning':'Schematisk sträckning'}</small></article>`).join('')+(!(config.value.energyRoutes?.length)?'<p>Inga ledningar konfigurerade. Lägg till dem under Redigera → Energi.</p>':'');if(legend.innerHTML!==content)legend.innerHTML=content;}
  const bounds=selected?garden.screenBounds(selected):null,o=config.value.objects.find(o=>o.id===selected);outline.hidden=!bounds||!o||document.body.classList.contains('home-list')||document.body.classList.contains('clean-3d');
  if(bounds&&o){Object.assign(outline.style,{left:bounds.x+'px',top:bounds.y+'px',width:Math.max(16,bounds.width)+'px',height:Math.max(16,bounds.height)+'px',color:o.type==='car'?'#75aaff':o.type==='solar'?'#36e4ee':o.type==='mower'||o.type==='light'?'#9bff4d':'#eef3ff'});outline.textContent=o.name+(connection.connected?(o.type==='car'?' · '+fmt(reading(o,connection.states,'battery_level','state'),'%'):o.type==='solar'?' · '+fmt(reading(o,connection.states,'production_kw','state'),'kW'):o.type==='mower'?' · '+(connection.states.get(o.entityId)?.state??'Saknar data'):''):' · Frånkopplad');}
 }
 async function enter(action:()=>void){if(document.body.classList.contains('home-list'))document.getElementById('list-button')?.click();const n=++serial;busy=true;badge.textContent='Förbereder 3D…';try{await garden.ready();if(n!==serial)return;if(shown&&config.value.startView){await Promise.race([new Promise<void>(resolve=>garden.transition(config.value.startView!,resolve)),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Kameraförflyttningen avbröts. Försök igen.')),4000))]);if(n!==serial)return;}hidePhoto();if(!reduced)await new Promise(r=>setTimeout(r,350));if(n!==serial)return;home=false;action();badge.textContent='';}catch(error){badge.textContent=(error as Error).message;}finally{if(n===serial)busy=false;}}
 energy.onclick=()=>{if(garden.energyNetwork.enabled){garden.energyNetwork.enabled=false;legend.hidden=true;energy.setAttribute('aria-pressed','false');return;}void enter(()=>{garden.energyNetwork.enabled=true;legend.hidden=false;energy.setAttribute('aria-pressed','true');refresh();});};
 const point=(e:Event)=>{const node=(e.target as HTMLElement).closest<HTMLElement>('[data-object],[data-hero-object]');if(node)selected=node.dataset.object??node.dataset.heroObject??'';};
 const move=(e:PointerEvent)=>{if(e.target!==garden.renderer.domElement||performance.now()-lastHover<100)return;lastHover=performance.now();selected=garden.hoverAtScreen(e.clientX,e.clientY)??'';};document.addEventListener('pointermove',move);
 const clear=()=>{selected='';outline.hidden=true;};document.addEventListener('pointerover',point);document.addEventListener('focusin',point);document.addEventListener('pointerout',clear);
 const timer=setInterval(refresh,120);return{enter,home(value:boolean){home=value;if(value){garden.energyNetwork.enabled=false;legend.hidden=true;energy.setAttribute('aria-pressed','false');}else hidePhoto();refresh();},dispose(){document.body.classList.remove('energy-view');++serial;clearInterval(timer);document.removeEventListener('pointermove',move);document.removeEventListener('pointerover',point);document.removeEventListener('focusin',point);document.removeEventListener('pointerout',clear);for(const node of[image,badge,energy,legend,outline])node.remove();}};
}
