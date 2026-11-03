import type {Connection} from './connection';
import {overviewBindings,measurement,measurementNote,gridFlow} from './overview-data';
import {energyBindings} from './function-data';
import {readState} from './entity-bindings';
import {escapeHtml as esc} from './panels';
import {updateMarkup} from './card-design';
import {icon} from './app-navigation';
import {weekForecastAttributes} from './measurement-history-data';
import './yard-house.css';

/** Main white dwelling, traced in the 1920 x 1080 reference photograph.
 * This is an image hotspot, not a new 3D placement or calibration.
 * The attached garage to the left is deliberately outside this dwelling outline.
 */
export const dwellingOutline='990,244 1228,253 1228,210 1235,210 1235,196 1256,195 1256,212 1274,213 1274,255 1565,272 1555,486 1678,486 1718,604 1700,609 1694,733 1512,719 1321,700 1307,715 1094,694 1080,687 945,648 948,505 936,489';

export function yardHouse(connection:Connection){
 const ns='http://www.w3.org/2000/svg',root=document.createElementNS(ns,'svg'),outline=document.createElementNS(ns,'polygon');
 root.classList.add('yard-house-hotspot');root.setAttribute('viewBox','0 0 1920 1080');root.setAttribute('preserveAspectRatio','none');
 outline.setAttribute('points',dwellingOutline);outline.setAttribute('vector-effect','non-scaling-stroke');outline.setAttribute('role','button');outline.setAttribute('tabindex','0');outline.setAttribute('aria-label','Bostadshuset · visa energi och temperaturer');outline.setAttribute('aria-haspopup','dialog');root.append(outline);
 const dialog=document.createElement('dialog');dialog.className='yard-house-dialog';dialog.setAttribute('aria-labelledby','yard-house-title');dialog.tabIndex=-1;document.body.append(dialog);
 let active=true,outside=false;
 const sample=(label:string,slot:string,unit:string,digits=1)=>{
  const m=measurement(connection.states,slot,connection.connected,unit),note=measurementNote(m);
  return `<div class="house-reading" ${slot==='sensor.uteknx_temperatur'?weekForecastAttributes():''}><span>${esc(label)}</span><strong${note?' class="house-reading-old" title="'+esc(note)+'"':''}>${m.value===null?'<span aria-label="'+esc(m.status)+'">—</span>':m.value.toLocaleString('sv-SE',{maximumFractionDigits:digits})+'<em>'+esc(unit)+'</em>'}</strong></div>`;
 };
 function render(){
  if(!dialog.open)return;
  const grid=measurement(connection.states,overviewBindings.grid,connection.connected,'kW'),flow=gridFlow(grid.value,connection.source==='simulator'?'import':overviewBindings.gridPositive);
  const rooms=overviewBindings.rooms.map(id=>sample(id==='sensor.storabadrummet_temperatur'?'Stora badrummet':String(readState(connection.states,id)?.attributes.friendly_name??id),id,'°C')).join('');
  updateMarkup(dialog,`<div class="house-dialog-heading"><span class="house-dialog-icon">${icon('home')}</span><div><small>BOSTADSHUSET</small><h2 id="yard-house-title">Ditt hus, just nu</h2></div><span class="house-source ${connection.connected?'is-connected':''}">${connection.source==='simulator'?'Simulator':connection.connected?'Home Assistant':'Frånkopplad'}</span></div><div class="house-dialog-sections"><section class="house-energy"><h3>${icon('energy')}Energi</h3>${sample('Husets effekt',energyBindings.house,'kW',2)}${sample(flow,overviewBindings.grid,'kW',2)}${sample('Solproduktion',overviewBindings.solar,'kW',2)}</section><section><h3>${icon('climate')}Temperaturer</h3>${sample('Utomhus','sensor.uteknx_temperatur','°C')}${rooms}<h4>VARMVATTEN</h4>${sample('Övre','sensor.vvb_kallaren_ovre_temperatur_1','°C')}${sample('Mitten','sensor.vvb_kallaren_mittentemperatur_2','°C')}${sample('Nedre','sensor.vvb_kallaren_nedre_temperatur_3','°C')}</section></div>`);
 }
 const close=()=>{dialog.close();root.classList.remove('is-open');outline.setAttribute('aria-expanded','false');if(active&&location.pathname==='/')outline.focus({preventScroll:true});};
 const open=()=>{if(!active)return;if(!dialog.open)dialog.showModal();root.classList.add('is-open');outline.setAttribute('aria-expanded','true');render();dialog.focus({preventScroll:true});};
 outline.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open();});
 outline.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}});
 const isOutside=(e:PointerEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{outside=isOutside(e);});dialog.addEventListener('pointerup',e=>{if(outside&&isOutside(e))close();outside=false;});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 return{root,update(visible:boolean){active=visible;outline.setAttribute('tabindex',visible?'0':'-1');root.classList.toggle('is-inactive',!visible);if(!visible&&dialog.open)close();else render();},dispose(){active=false;if(dialog.open)dialog.close();dialog.remove();root.remove();}};
}
