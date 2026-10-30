import type {Configuration} from './configuration';
import type {Connection} from './connection';
import type {GardenScene} from './scene';
import {energyValues} from './energy-overview';
import {reading,booleanReading,formatReading as fmt} from './device-data';
import {escapeHtml as esc} from './panels';

/** Presentation only: camera selection never dispatches a Home Assistant action. */
export function heroExperience(config:Configuration,connection:Connection,garden:GardenScene){
 const root=document.createElement('div');root.className='hero-experience';
 root.innerHTML='<div class="hero-heading"><small>HEMSTYRNING / LIVE WORLD</small><h1>Hela ditt hem.<br><span>En levande värld.</span></h1><p data-hero-status role="status"></p><button data-hero-overview>↙ Hela gården</button></div><nav class="hero-subjects" aria-label="Utforska hemmet"></nav><section class="hero-energy" aria-label="Levande energiflöde"></section><div class="hero-caption"><span>01 / ÖVERSIKT</span><span>Välj ett objekt för att komma närmare</span></div>';
 const subjects=root.querySelector<HTMLElement>('.hero-subjects')!,energy=root.querySelector<HTMLElement>('.hero-energy')!,status=root.querySelector<HTMLElement>('[data-hero-status]')!;
 let signature='';
 function render(){
  const c=config.value,v=energyValues(c,connection.states,connection.connected);
  status.textContent=connection.connected?(connection.source==='simulator'?'SIMULERAD VÄRLD · LIVE DATA':'ANSLUTEN · LIVE DATA'):'FRÅNKOPPLAD · INVÄNTAR DATA';
  const objects=c.objects.filter(o=>['car','mower','solar'].includes(o.type)&&o.entityId);
  const cards=objects.map(o=>{const online=connection.connected&&connection.states.get(o.entityId)&&!['unavailable','unknown'].includes(connection.states.get(o.entityId)!.state);const get=(key:string)=>online?reading(o,connection.states,key):null;const metric=o.type==='solar'?fmt(get('production_kw'),'kW'):fmt(get('battery_level'),'%');const proxy=o.type==='mower'&&!o.asset?' · Testmodell':'';const detail=o.type==='car'?`Laddning ${fmt(get('charging_power_kw'),'kW')} · Klimat ${get('climate_on')===null?'okänt':booleanReading(get('climate_on'))===true?'på':booleanReading(get('climate_on'))===false?'av':'okänt'}`:o.type==='mower'?`Klippning ${fmt(get('progress'),'%')} · Följ i 3D${proxy}`:'Solel · Visa taket';return `<button data-hero-object="${esc(o.id)}" class="hero-subject hero-${o.type}" ${online?'':'disabled'}><small>${o.type==='car'?'MOBILITET':o.type==='mower'?'AUTONOMI':'SOLENERGI'}</small><span>${esc(o.name)}</span><strong>${esc(metric)}</strong><small>${esc(online?detail:'Otillgänglig')}</small><b aria-hidden="true">↗</b></button>`;}).join('');
  if(subjects.dataset.content!==cards){const focused=(document.activeElement as HTMLElement)?.dataset.heroObject;subjects.innerHTML=cards;subjects.dataset.content=cards;if(focused)subjects.querySelector<HTMLButtonElement>(`[data-hero-object="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});}
  const flow=v.import===null||v.export===null?'Nätflöde saknas':v.import>0?`NÄT → HUS · ${fmt(v.import,'kW')}`:v.export>0?`HUS → NÄT · ${fmt(v.export,'kW')}`:'NÄT ↔ HUS · 0 kW';
  const html=`<div class="hero-flow"><i></i>${esc(flow)}</div><div class="hero-metrics">${[['ELPRIS',v.price,'kr/kWh','price'],['HUSET NU',v.power,'kW','power'],['SOLEL',v.solar,'kW','solar'],['IDAG',v.today,'kWh','today']].map(([name,value,unit,tone])=>`<div class="hero-metric ${tone}"><small>${name}</small><strong>${esc(fmt(value,String(unit)))}</strong></div>`).join('')}</div>`;
  if(html!==signature){energy.innerHTML=html;signature=html;}
 }
 subjects.onclick=e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-hero-object]');if(!button||button.disabled)return;const object=config.value.objects.find(o=>o.id===button.dataset.heroObject);if(!object)return;try{garden.focusObject(object.id,object.type==='mower');status.textContent=object.type==='mower'?'FÖLJER ROBOT · POSITIONENS KVALITET VISAS I 3D':`FOKUS · ${object.name}`;}catch(error){status.textContent=(error as Error).message;}};
 root.querySelector<HTMLButtonElement>('[data-hero-overview]')!.onclick=()=>garden.overview();
 render();const timer=setInterval(render,1000);return{root,dispose(){clearInterval(timer);root.remove();}};
}
