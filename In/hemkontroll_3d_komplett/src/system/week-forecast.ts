import type {Configuration} from './configuration';
import type {Connection} from './connection';
import {weekForecastSnapshot} from './weather-source';
import {measurement,measurementNote} from './overview-data';
import {escapeHtml as esc} from './panels';
import {updateMarkup} from './card-design';
import './week-forecast.css';

function weatherIcon(condition?:string){
 if(!condition)return '<span class="forecast-no-symbol">—</span>';
 const cloud='M7 19a5 5 0 0 1-1-10 6 6 0 0 1 11-1 5.5 5.5 0 0 1 0 11H7';
 const path=condition==='sunny'?'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M12 1v2 M12 21v2 M1 12h2 M21 12h2 M4 4l2 2 M18 18l2 2 M20 4l-2 2 M6 18l-2 2':condition==='clear-night'?'M20 15a9 9 0 0 1-11-11 9 9 0 1 0 11 11':cloud+(condition.includes('snow')?' M7 22h.01 M12 22h.01 M17 22h.01':condition.includes('rain')||condition==='pouring'?' M7 22l-1 2 M12 22l-1 2 M17 22l-1 2':condition==='fog'?' M4 22h16':condition==='partlycloudy'?' M18 2v2 M22 6h2 M20 3l2-2':'');
 return `<svg class="forecast-symbol" data-condition="${esc(condition)}" viewBox="0 0 26 27" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
}

export class WeekForecast{
 private dialog=document.createElement('dialog');private abort=new AbortController();private invoker?:HTMLElement;private outside=false;private timer:ReturnType<typeof setInterval>;
 constructor(private config:Configuration,private connection:Connection){
  this.dialog.className='week-forecast-dialog';this.dialog.setAttribute('aria-labelledby','week-forecast-title');this.dialog.tabIndex=-1;document.body.append(this.dialog);
  const signal=this.abort.signal,open=(target:HTMLElement)=>{this.invoker=target;if(!this.dialog.open)this.dialog.showModal();this.render();this.dialog.focus({preventScroll:true});};
  document.addEventListener('click',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-week-forecast]');if(!target)return;e.preventDefault();e.stopPropagation();open(target);},{signal});
  document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const target=(e.target as Element).closest<HTMLElement>('[data-week-forecast]');if(!target)return;e.preventDefault();e.stopPropagation();open(target);},{signal});
  const outside=(e:PointerEvent)=>{const r=this.dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
  this.dialog.addEventListener('pointerdown',e=>{this.outside=outside(e);},{signal});this.dialog.addEventListener('pointerup',e=>{if(this.outside&&outside(e))this.close();this.outside=false;},{signal});this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},{signal});
  window.addEventListener('hem-weather-updated',()=>this.render(),{signal});document.addEventListener('hem-route-changed',()=>this.close(),{signal});
  this.timer=setInterval(()=>this.render(),60000);
  // Warm the same weather cache used by the photograph and home card.
  weekForecastSnapshot(config.value,connection.states,connection.connected,connection.source);
 }
 private render(){
  if(!this.dialog.open)return;
  const forecast=weekForecastSnapshot(this.config.value,this.connection.states,this.connection.connected,this.connection.source),days=forecast?.days??[],outdoor=measurement(this.connection.states,'sensor.uteknx_temperatur',this.connection.connected,'°C'),note=measurementNote(outdoor);
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const temperature=(n:number|null)=>n===null?'—':(Number(n.toFixed(0))||0).toLocaleString('sv-SE')+'°';
  const cards=days.map(day=>{const date=new Date(day.date+'T12:00:00Z');return `<article class="forecast-day" data-dom-key="forecast-${day.date}"><div class="forecast-day-heading"><b>${day.date===today?'Idag':esc(date.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm',weekday:'short'}))}</b><span>${esc(date.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm',day:'numeric',month:'short'}))}</span></div>${weatherIcon(day.condition)}<span class="forecast-condition">${esc(day.description??'Prognos saknas')}</span><div class="forecast-temperatures"><strong title="Prognosens högsta temperatur">${temperature(day.max)}</strong><span title="Prognosens lägsta temperatur">${temperature(day.min)}</span></div><small>${day.windMax===null?'Vind saknas':day.windMax.toLocaleString('sv-SE',{maximumFractionDigits:0})+' m/s · max'}</small></article>`;}).join('');
  updateMarkup(this.dialog,`<div class="forecast-heading"><div><small>SMHI · ${esc(this.config.value.weather?.placeName??'Kyrkås')}</small><h2 id="week-forecast-title">Veckoprognos</h2></div><div class="forecast-current" ${note?'title="'+esc(note)+'"':''}><small>Uppmätt ute · KNX</small><strong>${outdoor.value===null?'—':outdoor.value.toLocaleString('sv-SE',{maximumFractionDigits:1})+'<em>°C</em>'}</strong></div></div>${!forecast?.available?`<p class="forecast-message" role="status">${esc(forecast?.message??(days.length?'Visar senast hämtad prognos.':'Prognosen är inte tillgänglig just nu.'))}</p>`:''}<div class="forecast-week">${cards||'<p>Inga prognosvärden är tillgängliga ännu.</p>'}</div><p class="forecast-footnote">Prognostemperaturer, inte uppmätta dygnsvärden. Idag räknas från aktuell prognostimme.${forecast?.fetchedAt?' Uppdaterad '+esc(new Date(forecast.fetchedAt).toLocaleTimeString('sv-SE',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'}))+'.':''}</p>`);
 }
 private close(){if(!this.dialog.open)return;this.dialog.close();if(this.invoker?.isConnected)this.invoker.focus({preventScroll:true});}
 dispose(){clearInterval(this.timer);this.abort.abort();this.close();this.dialog.remove();}
}
