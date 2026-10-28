import {available,robotSupports} from '../../../../shared/ha-contract.js';
import './style.css';
import {HomeControls} from './home-controls';
import { Configuration } from './configuration';
import { Connection } from './connection';
import { GardenScene } from './scene';
import { environmentTarget, liveInputs, automaticSeason, freshState } from './environment';
import { escapeHtml as esc } from './panels';
import { reading,booleanReading,formatReading as fmt } from './device-data';
import type { EnvironmentFrame, Season, SceneObject } from './types';

const $=(id:string)=>document.getElementById(id)!;
const config=new Configuration(), connection=new Connection();
let hud:HomeControls;
let garden:GardenScene, selected:string|undefined, showList=false, busy=false;
let target:EnvironmentFrame;
document.body.classList.add('home-mode');
$('environment-button').hidden=true;$('editor-button').hidden=true;$('save-button').hidden=true;$('save-status').hidden=true;
$('mode-badge').textContent='';$('mode-badge').hidden=true;
$('data-status').textContent='';
$('list-button').textContent='☷ Lista';
const settings=document.createElement('a');settings.href='/editor';settings.textContent='✎ Redigera gård';settings.className='settings-link edit-yard';document.querySelector('nav')!.append(settings);
const skyButton=document.createElement('button');skyButton.id='sky-button';skyButton.textContent='Visa himmel';skyButton.title='Rikta kameran mot sol eller måne. Återställ vy återgår till gården.';$('reset-button').after(skyButton);
const markers=document.createElement('div');markers.id='device-markers';document.body.append(markers);
const pendingError=new Map<string,string>();
const pendingLamps=new Set<string>();
async function select3D(id:string){const o=config.value.objects.find(o=>o.id===id);if(!o)return;if(o.type!=='light'){select(id);return;}if(pendingLamps.has(id))return;const toast=$('toast'),state=connection.states.get(o.entityId);if(!connection.connected||!['on','off'].includes(state?.state??'')){toast.textContent='Lampan saknar tillgänglig, bekräftad status';toast.hidden=false;setTimeout(()=>toast.hidden=true,4500);return;}pendingLamps.add(id);const marker=markers.querySelector<HTMLElement>(`[data-object="${CSS.escape(id)}"]`);marker?.classList.add('pending');marker?.setAttribute('aria-busy','true');try{await connection.toggle(o.entityId,'live');}catch(error){toast.textContent=error instanceof Error?error.message:String(error);toast.hidden=false;setTimeout(()=>toast.hidden=true,5000);}finally{pendingLamps.delete(id);marker?.classList.remove('pending');marker?.removeAttribute('aria-busy');}}

function status(o:SceneObject){if(!connection.connected)return'Frånkopplad';return connection.states.get(o.entityId)?.state??'Saknar data';}
function panel(){
  const object=config.value.objects.find(o=>o.id===selected);
  const visible=showList||!!object;$('panel').hidden=!visible;
  if(!visible)return;
  if(showList){$('panel-body').innerHTML=`<h2>Hela hemmet</h2><p>Enheter och energi</p>${config.value.objects.filter(o=>!['surface','parking','occluder'].includes(o.type)).map(o=>`<button class="object-row" data-object="${esc(o.id)}"><span><strong>${esc(o.name)}</strong><small>${esc(o.type==='light'?'Belysning':o.type==='car'?'Fordon':o.type==='solar'?'Solproduktion':o.type==='mower'?'Robotgräsklippare':o.type==='energy'?'Energi':'Robotdammsugare')}</small></span><span class="object-state">${esc(status(o))}</span></button>`).join('')}`;return;}
  if(!object)return;
  const r=(key:string,fallback?:string)=>['plugged_in','climate_on','charging'].includes(key)?booleanReading(reading(object,connection.states,key,fallback)):reading(object,connection.states,key,fallback);
  const card=(label:string,value:unknown,unit='',fallback?:string)=>`<div class="stat"><label>${label}</label><strong>${typeof value==='number'||unit?esc(fmt(value,unit)):esc(value??fallback??'Saknar data')}</strong></div>`;
  let html=`<h2>${esc(object.name)}</h2><p class="device-availability">${esc(status(object))}${!connection.connected?' · senaste kända värden':''}</p>`;
  if(object.type==='light')html+=`<div class="bigval">${status(object)==='on'?'Tänt':status(object)==='off'?'Släckt':'Okänt läge'}</div><div class="info-grid">${card('Ljusstyrka',r('brightness')===null?null:Number(r('brightness'))/255*100,'%')}${card('Färgtemperatur',r('color_temp_kelvin'),'K')}</div><button class="primary" data-command="light" ${busy||!connection.connected||!['on','off'].includes(status(object))?'disabled':''}>${busy?'Väntar på bekräftelse…':status(object)==='on'?'Släck':'Tänd'}</button>`;
  if(['car','mower'].includes(object.type))html+=`<p class="muted">${esc(garden.assetInfo(object.id))}</p>`;
  if(object.type==='car')html+=`<div class="info-grid">${card('Batteri',r('battery_level','state'),'%')}${card('Räckvidd',r('range_km'),'km')}${card('Laddeffekt',r('charging_power_kw'),'kW')}${card('Laddström',r('charging_current'),'A')}${card('Spänning',r('charging_voltage'),'V')}${card('Laddgräns',r('charge_limit'),'%')}${card('Återstående laddtid',r('remaining_minutes'),'min')}${card('Kupétemperatur',r('cabin_temperature'),'°C')}${card('Laddkabel',r('plugged_in')===null?null:r('plugged_in')?'Ansluten':'Frånkopplad')}${card('Klimatisering',r('climate_on')===null?null:r('climate_on')?'På':'Av')}${card('Plats',r('location'))}${card('Fel',r('error'))}</div><div class="button-row">${command('Klimatisering',r('climate_on')?'climate_off':'climate_on',object)}${command('Laddning',r('charging')?'charge_off':'charge_on',object)}</div>`;
  if(object.type==='solar'||object.type==='energy'){
    html+=`<div class="info-grid">${object.type==='solar'?`${card('Produktion nu',r('production_kw','state'),'kW')}${card('Idag',r('energy_today'),'kWh')}${card('Totalt',r('energy_total'),'kWh')}${card('Växelriktare',r('inverter_status'))}${card('Antal paneler',r('panel_count'))}`:`${card('Husets effekt',r('house_power_kw','state'),'kW')}${card('Köpt effekt',r('grid_import_kw'),'kW')}${card('Såld effekt',r('grid_export_kw'),'kW')}${card('Egen solel',r('self_consumption_kw'),'kW')}${card('Förbrukning idag',r('energy_today'),'kWh')}${card('Total förbrukning',r('energy_total'),'kWh')}${card('Elpris',r('price'),'SEK/kWh')}${card('Kostnad idag',r('cost_today'),'SEK')}`}</div><h3>Historik · uppmätta värden</h3><div id="device-history">Läser historik…</div>`;
    const panels=r('panel_values');if(Array.isArray(panels))html+=`<details><summary>Paneler (${panels.length})</summary>${panels.map((p:{id:string;power_w:number})=>`<div class="update">${esc(p.id)} <b>${esc(fmt(p.power_w,'W',0))}</b></div>`).join('')}</details>`;
  }
  if(object.type==='mower'||object.type==='vacuum'){
    const tracking=object.type==='mower'?garden.trackingInfo(object.id):null;
    html+=`<div class="info-grid">${card('Batteri',r('battery_level'),'%')}${card('Framsteg',r('progress'),'%')}${object.type==='mower'?card('Robotljus',garden.headlightInfo(object.id)):''}${card('Uppdrag',r('task'))}${card('Fel',r('error'))}${object.type==='mower'?`${card('Position',tracking?.label??'Saknar positionsdata')}${card('Mätålder',tracking?.ageSeconds===undefined?null:tracking.ageSeconds,'s')}${card('GPS-noggrannhet',r('accuracy_m'),'m')}${card('Hastighet',r('speed_mps'),'m/s')}`:''}</div><div class="notice">${tracking?.estimated?'Positionen är uppskattad från tidigare mätningar.':''}${tracking?.rejected?' Orimlig GPS-punkt ignorerad.':''}${tracking?.blocked?' Rörelse stoppad: sträckan lämnar konfigurerad körbar yta.':''}</div><div class="button-row">${command('Starta',object.type==='mower'?'mower_start':'vacuum_start',object)}${command('Pausa',object.type==='mower'?'mower_pause':'vacuum_pause',object)}${command('Till laddstation',object.type==='mower'?'mower_dock':'vacuum_dock',object)}</div>`;
  }
  html+=`<p class="muted">${esc(pendingError.get(object.id)??'')}${r('error')?` ${esc(r('error'))}`:''}</p>`;
  $('panel-body').innerHTML=html;
  if(object.type==='solar'||object.type==='energy')void history(object);
}
function command(label:string,action:string,o:SceneObject){
 let supported=robotSupports(connection.states.get(o.entityId),action);
 if(o.type==='car'){const kind=action.startsWith('climate')?'climate':'charging',attrs=connection.states.get(o.entityId)?.attributes.command_entities as Record<string,string>|undefined,id=o.bindings?.[kind]??(connection.source==='simulator'?attrs?.[kind]:undefined),state=id?connection.states.get(id):undefined;supported=available(state)&&(kind==='charging'||(Number(state?.attributes.supported_features??0)&(action==='climate_on'?256:128))!==0);}
 return `<button data-command="${action}" ${busy||!connection.connected||!connection.commandsEnabled||!supported?'disabled':''}>${label}</button>`;
}
let historySerial=0;const historyCache=new Map<string,{at:number;data:{state:string;attributes?:Record<string,unknown>}[][]}>();
async function history(o:SceneObject){const serial=++historySerial;try{const cached=historyCache.get(o.entityId);const response=cached&&Date.now()-cached.at<30000?cached.data:await connection.history(o.entityId);if(!cached||Date.now()-cached.at>=30000)historyCache.set(o.entityId,{at:Date.now(),data:response});if(serial!==historySerial||selected!==o.id)return;const values=(response[0]??[]).map((s:{state:string;attributes?:Record<string,unknown>})=>Number(s.state)/(s.attributes?.unit_of_measurement==='W'?1000:1)).filter(Number.isFinite);const el=$('device-history');if(!el)return;if(values.length<2){el.textContent='Historik saknas ännu';return;}const max=Math.max(...values,0.001),pts=values.map((v:number,i:number)=>`${i/(values.length-1)*300},${80-v/max*70}`).join(' ');el.innerHTML=`<svg viewBox="0 0 300 90" aria-label="Historik"><polyline points="${pts}" fill="none" stroke="#a4e4c7" stroke-width="2"/></svg><p>${values.length} mätpunkter · ${esc(fmt(Math.min(...values),'kW'))}–${esc(fmt(max,'kW'))}</p>`;}catch{const el=$('device-history');if(el)el.textContent='Historik är inte tillgänglig';}}
function select(id:string){for(const el of markers.querySelectorAll<HTMLElement>('[data-object]'))el.classList.toggle('selected',el.dataset.object===id);selected=id;showList=false;garden.select(id);panel();}
function update(){
  $('connection-status').textContent=connection.connected?'Ansluten':'Frånkopplad · återansluter';
  $('connection-status').classList.toggle('offline',!connection.connected);
  $('mode-badge').hidden=connection.source!=='simulator';$('mode-badge').textContent='DEMO';
  if(!config.value)return;
  const live=liveInputs(config.value,connection.states,connection.connected), weather=connection.states.get(config.value.bindings.weather);
  const weatherAttrs=connection.connected&&freshState(weather,config.value.bindings.weatherMaxAge)?weather!.attributes:{};
  const clock=weatherAttrs.simulated_datetime;
  const date=connection.source==='simulator'&&typeof clock==='string'?new Date(clock):new Date();
  hud?.update(config.value,date);
  target=environmentTarget({date,...config.value.location,cloud:live.cloud,lux:live.lux,weather:live.weather,sensorWeight:config.value.luxCalibration.weight,brightness:1,
    rainIntensity:Number(weatherAttrs.rain_intensity??(live.weather==='rain'?0.6:0)),snowIntensity:Number(weatherAttrs.snow_intensity??(live.weather==='snow'?0.6:0)),windSpeed:Number(weatherAttrs.wind_speed??0),windDirection:Number(weatherAttrs.wind_bearing??0),gust:Number(weatherAttrs.wind_gust_speed??0),visibility:Number(weatherAttrs.visibility??20)});
  const manual=connection.source==='simulator'?weatherAttrs.season_model:null;
  const season=typeof manual==='string'&&manual in config.value.models?manual as Season:automaticSeason(config.value,connection.states,date,connection.connected);
  target.season=season;
  void garden.models.select(season,config.value.models[season]);
  $('model-status').hidden=!garden.models.loading&&!garden.models.status.includes('kunde inte');$('model-status').textContent=garden.models.status;
  $('data-status').textContent=!connection.connected?'Enheternas senaste kända status visas.':live.warnings?'Vissa miljövärden saknas.':'';
}
async function start(){try{
 await config.load();garden=new GardenScene($('garden') as HTMLCanvasElement);garden.setConfig(config.value);garden.onSelect=id=>void select3D(id);hud=new HomeControls(connection,garden,select,text=>{const toast=$('toast');toast.textContent=text;toast.hidden=false;setTimeout(()=>toast.hidden=true,5000);},config);
 garden.models.onStatus=()=>{$('model-status').textContent=garden.models.status;$('model-status').hidden=!garden.models.loading&&!garden.models.status.includes('kunde inte');};
 markers.innerHTML=config.value.objects.filter(o=>!['surface','parking','occluder'].includes(o.type)).map(o=>`<button class="device-marker" data-object="${esc(o.id)}" aria-label="${esc(o.name)}"><span>${o.type==='light'?'✦':o.type==='car'?'▰':o.type==='solar'?'☀':o.type==='mower'?'◆':o.type==='energy'?'ϟ':'◉'}</span><small>${esc(o.name)}</small></button>`).join('');
 markers.addEventListener('pointerdown',e=>{const marker=(e.target as HTMLElement).closest<HTMLElement>('[data-object]');if(marker)garden.forwardMarkerPointer(e,marker.dataset.object!);});
 markers.onclick=e=>{if(e.detail!==0)return;const marker=(e.target as HTMLElement).closest<HTMLElement>('[data-object]');if(marker)garden.activateMarker(marker.dataset.object!);};
 $('list-button').onclick=()=>{selected=undefined;showList=false;panel();hud.setListMode(!document.body.classList.contains('home-list'));};$('close-panel').onclick=()=>{selected=undefined;showList=false;panel();};$('reset-button').onclick=()=>garden.reset();skyButton.onclick=()=>garden.lookAtSky();
 $('panel-body').onclick=async e=>{const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.object){select(button.dataset.object);return;}const o=config.value.objects.find(o=>o.id===selected);if(!o||!button.dataset.command||busy)return;busy=true;panel();try{if(button.dataset.command==='light')await connection.toggle(o.entityId,'live');else await connection.command(o,button.dataset.command);pendingError.delete(o.id);}catch(error){pendingError.set(o.id,error instanceof Error?error.message:String(error));}finally{busy=false;panel();}};
 let panelTimer=0;connection.addEventListener('state',()=>{if(!panelTimer)panelTimer=window.setTimeout(()=>{panelTimer=0;update();panel();},250);});connection.addEventListener('connection',()=>{update();panel();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=undefined;showList=false;panel();}});
 update();void connection.start();setInterval(update,1000);
 const markerEls=[...markers.querySelectorAll<HTMLElement>('[data-object]')];let frame=0;
 const animate=()=>{if(target)garden.frame(target,connection.states,connection.connected,new Map(),false);$('garden').dataset.renderFrames=String(++frame);if(frame%3===0){const occupied:{x:number;y:number}[]=[];for(const el of markerEls){const p=garden.screenPosition(el.dataset.object!);el.hidden=!p||p.z>1||p.z< -1||p.x<0||p.x>innerWidth||p.y<0||p.y>innerHeight||p.occluded;if(p&&!p.occluded){el.classList.toggle('far',p.distance>95);let y=p.y;for(let attempt=0;attempt<8&&occupied.some(o=>Math.hypot(o.x-p.x,o.y-y)<33);attempt++)y-=32;occupied.push({x:p.x,y});el.style.transform=`translate(${p.x}px,${y}px) translate(-50%,-50%)`;el.style.setProperty('--leader',`${p.y-y}px`);}}}};hud.onViewChange=list=>{$('garden').dataset.camera=JSON.stringify(garden.camera.position.toArray());garden.renderer.setAnimationLoop(list?null:animate);markers.hidden=list;};garden.renderer.setAnimationLoop(animate);
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 window.addEventListener('pagehide',()=>{connection.stop();hud.dispose();garden.dispose();},{once:true});
 }catch(error){$('model-status').textContent=error instanceof Error?error.message:String(error);}}
void start();
