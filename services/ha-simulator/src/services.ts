import {calendarEvents} from './calendar.js';
import type { StateStore } from './store.js';
import type { ServiceCall } from './types.js';
export class ServiceError extends Error {constructor(message:string,readonly status=400){super(message);}}
function entityIds(call:ServiceCall):string[]{const selected=call.target?.entity_id??call.serviceData.entity_id;if(typeof selected==='string')return[selected];if(Array.isArray(selected)&&selected.every(v=>typeof v==='string'))return selected;throw new ServiceError('Service call requires target.entity_id or service_data.entity_id');}
export async function callService(store:StateStore,call:ServiceCall,delayMs:number):Promise<unknown>{
 const ids=entityIds(call),{domain,service}=call;
 if(domain==='calendar'&&service==='get_events'){const from=String(call.serviceData.start_date_time??new Date().toISOString()),duration=call.serviceData.duration as Record<string,unknown>|undefined,to=String(call.serviceData.end_date_time??new Date(Date.parse(from)+Number(duration?.hours??24)*3600000).toISOString());return Object.fromEntries(ids.map(id=>[id,{events:calendarEvents(store,id,from,to).map(e=>({...e,start:e.start.dateTime??e.start.date,end:e.end.dateTime??e.end.date}))}]));}
 if(domain==='weather'&&service==='get_forecasts'){
  return Object.fromEntries(ids.map(id=>{const s=store.get(id);if(!s)throw new ServiceError('Entity not found',404);const now=Date.parse(String(s.attributes.simulated_datetime??new Date().toISOString()));return[id,{forecast:Array.from({length:24},(_,i)=>({datetime:new Date(now+(i+1)*3600000).toISOString(),condition:s.state,temperature:s.attributes.temperature,cloud_coverage:s.attributes.cloud_coverage,wind_speed:s.attributes.wind_speed,precipitation:Number(s.attributes.rain_intensity??0)*8}))}];}));
 }
 const allowed:Record<string,string[]>={light:['turn_on','turn_off','toggle'],climate:['turn_on','turn_off'],switch:['turn_on','turn_off'],lawn_mower:['start_mowing','pause','dock'],vacuum:['start','pause','return_to_base']};
 if(!allowed[domain]?.includes(service))throw new ServiceError(`Unsupported service ${domain}.${service}`);
 const expand=(id:string,seen=new Set<string>()):string[]=>{if(seen.has(id))throw new ServiceError('Cyclic light group');seen.add(id);const members=store.get(id)?.attributes.entity_id;return domain==='light'&&Array.isArray(members)?members.flatMap(member=>expand(String(member),new Set(seen))):[id];};
 const targets=[...new Set(ids.flatMap(id=>expand(id)))];
 for(const id of targets){const s=store.get(id);if(!s)throw new ServiceError(`Entity not found: ${id}`,404);if(!id.startsWith(domain+'.'))throw new ServiceError(`${id} is not a ${domain}`);if(['unknown','unavailable'].includes(s.state))throw new ServiceError(`${id} is unavailable`,503);}
 const brightness=call.serviceData.brightness;if(brightness!==undefined&&(!Number.isFinite(brightness)||Number(brightness)<0||Number(brightness)>255))throw new ServiceError('brightness must be 0–255');
 const kelvin=call.serviceData.color_temp_kelvin;if(kelvin!==undefined&&(!Number.isFinite(kelvin)||Number(kelvin)<1000||Number(kelvin)>12000))throw new ServiceError('Invalid color temperature');
 const rgb=call.serviceData.rgb_color;if(rgb!==undefined&&(!Array.isArray(rgb)||rgb.length!==3||!rgb.every(c=>Number.isFinite(c)&&c>=0&&c<=255)))throw new ServiceError('Invalid RGB color');
 await new Promise(resolve=>setTimeout(resolve,delayMs));
 for(const id of targets){const current=store.get(id)!;if(['unknown','unavailable'].includes(current.state))throw new ServiceError(`${id} became unavailable`,503);
  if(domain==='light'){
   const on=service==='toggle'?current.state!=='on':service==='turn_on',previous=Number(current.attributes.brightness??255),level=on?Number(brightness??(previous>0?previous:current.attributes.last_brightness??255)):0;
   store.set(id,on&&level>0?'on':'off',{brightness:level,last_brightness:previous>0?previous:current.attributes.last_brightness??255,...(kelvin!==undefined?{color_temp_kelvin:kelvin}:{}),...(rgb!==undefined?{rgb_color:rgb}:{})},'simulator-user');
  }else if(domain==='climate')store.set(id,service==='turn_on'?'heat':'off',{},'simulator-user');
  else if(domain==='switch')store.set(id,service==='turn_on'?'on':'off',{},'simulator-user');
  else if(domain==='lawn_mower')store.set(id,service==='start_mowing'?'mowing':service==='pause'?'paused':'returning',{},'simulator-user');
  else store.set(id,service==='start'?'cleaning':service==='pause'?'paused':'returning',service==='start'&&Number(current.attributes.progress??0)>=100?{progress:0}:{},'simulator-user');
 }
 for(const group of store.all().filter(s=>s.entity_id.startsWith('light.')&&Array.isArray(s.attributes.entity_id))){const members=(group.attributes.entity_id as string[]).map(id=>store.get(id));store.set(group.entity_id,members.some(s=>s?.state==='on')?'on':members.every(s=>s?.state==='off')?'off':'unavailable');}
}
