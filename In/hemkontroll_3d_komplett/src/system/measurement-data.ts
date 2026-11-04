import {setEntityRefreshFailed} from './entity-display-data';
import type {Connection} from './connection';
import type {HassState} from './types';
import {hasSensorBinding,readState,resolveEntity} from './entity-bindings';
import {averagePrice,overviewBindings,periodCost,rememberMeasurement} from './overview-data';

const waterSlots=['sensor.vvb_kallaren_ovre_temperatur_1','sensor.vvb_kallaren_mittentemperatur_2','sensor.vvb_kallaren_nedre_temperatur_3'];
const costCounter='sensor.ferroamp_external_energy_consumed_cost',energyCounter='sensor.ferroamp_external_energy_consumed';
const numeric=(s:HassState|undefined)=>!!s&&!!s.state.trim()&&Number.isFinite(Number(s.state))&&Number.isFinite(Date.parse(s.last_updated));

/** Read-only display enrichment, owned by the app, never by an individual route.
 * Historical/calculated values stay in the measurement cache, not the live HA state map.
 */
export function startMeasurementData(connection:Connection){
 const attempted=new Map<string,number>(),pending=new Set<string>();let scheduled:ReturnType<typeof setTimeout>|undefined;
 async function history(entity:string,start:number,end:number){
  const query=new URLSearchParams({entity_id:entity,start:new Date(start).toISOString(),end:new Date(end).toISOString()});
  const response=await fetch('/connection-api/history?'+query,{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Historik saknas');
  const data=await response.json();return (Array.isArray(data?.[0])?data[0]:[])as HassState[];
 }
 async function refresh(){
  if(!connection.connected||connection.source!=='home-assistant')return;
  const states=connection.states,source=connection.source,now=Date.now(),valid=()=>connection.states===states&&connection.source===source;
  const run=async(key:string,work:()=>Promise<void>,affected:string[]=[])=>{
   if(pending.has(key)||now-(attempted.get(key)??0)<300000)return;
   pending.add(key);attempted.set(key,now);
   try{await work();}catch{if(valid()){for(const id of affected)setEntityRefreshFailed(states,id,true);connection.dispatchEvent(new Event('measurement'));}}
   finally{pending.delete(key);}
  };
  const slots=[...waterSlots,...overviewBindings.rooms,overviewBindings.house2,'sensor.elmatare_hus2_energy'];
  const backfills=Promise.all(slots.map(slot=>{
   const entity=resolveEntity(slot),current=readState(states,slot);
   if(!entity||numeric(current))return Promise.resolve();
   return run(source+'|'+entity,async()=>{
    const points=await history(entity,now-7*86400000,now);
    const last=[...points].reverse().find(numeric);
    if(!last||!valid()||resolveEntity(slot)!==entity)return;
    rememberMeasurement(states,slot,{...last,entity_id:entity,attributes:{...points.find(p=>p.attributes?.unit_of_measurement)?.attributes,...current?.attributes,...last.attributes}});
    connection.dispatchEvent(new Event('measurement'));
   });
  }));
  // Explicit sensor selections take precedence over the automatic calculation.
  if(hasSensorBinding('$costToday')||hasSensorBinding('$averageToday')){await backfills;return;}
  const day=new Date(now);day.setHours(0,0,0,0);const start=day.getTime();
  await run(source+'|daily-cost|'+start,async()=>{
   const [costRows,energyRows]=await Promise.all([history(costCounter,start,now),history(energyCounter,start,now)]);
   if(!valid()||new Date().toDateString()!==day.toDateString()||hasSensorBinding('$costToday')||hasSensorBinding('$averageToday'))return;
   // HA's initial history state must be present at the requested midnight boundary.
   // Reject resets, gaps in validity and wrong units; monthly/current-price sensors are not substitutes.
   const delta=(rows:HassState[],entity:string,unit:string,stateClass:string)=>{
    if(rows.length<1||rows.some(p=>p.entity_id!==entity||!numeric(p)||p.attributes?.unit_of_measurement!==unit||p.attributes?.state_class!==stateClass))return null;
    if(Date.parse(rows[0]!.last_updated)!==start)return null;
    const reset=rows[0]!.attributes.last_reset;
    for(let i=1;i<rows.length;i++)if(rows[i]!.attributes.last_reset!==reset||Number(rows[i]!.state)<Number(rows[i-1]!.state))return null;
    return periodCost({value:Number(rows[0]!.state),at:start},{value:Number(rows.at(-1)!.state),at:now},{start,end:now});
   };
   const cost=delta(costRows,costCounter,'SEK','total'),energy=delta(energyRows,energyCounter,'kWh','total_increasing'),average=averagePrice(cost,energy);
   for(const [slot,value,unit]of [['$costToday',cost,'SEK'],['$averageToday',average,'SEK/kWh']]as const){
    if(hasSensorBinding(slot))continue;
    setEntityRefreshFailed(states,slot,value===null);
    if(value===null)continue;
    const stamp=new Date(now).toISOString();
    rememberMeasurement(states,slot,{entity_id:slot,state:String(value),last_updated:stamp,attributes:{unit_of_measurement:unit,period_start:new Date(start).toISOString(),period_end:stamp,derived:true,cost_source:costCounter,energy_source:energyCounter}});
   }
   connection.dispatchEvent(new Event('measurement'));
  },['$costToday','$averageToday']);
  await backfills;
 }
 const schedule=()=>{clearTimeout(scheduled);scheduled=setTimeout(()=>void refresh(),250);};
 connection.addEventListener('state',schedule);connection.addEventListener('connection',schedule);
 const interval=setInterval(()=>void refresh(),60000);schedule();
 return()=>{clearTimeout(scheduled);clearInterval(interval);connection.removeEventListener('state',schedule);connection.removeEventListener('connection',schedule);};
}
