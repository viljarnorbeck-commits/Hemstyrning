import {resolveEntity,measurementSourceUnit} from './entity-bindings';
import {escapeHtml as esc} from './panels';
import type {HistoryPoint} from './function-data';
import {measurementHistoryCache} from './measurement-history-cache';

/** No clickable history until the same data used by the dialog contains numeric points. */
export function homeHistoryAttributes(slot:string,unit:string,label:string,source:string){
 const entity=resolveEntity(slot);
 if(!/^[a-z_]+\.[a-z0-9_]+$/.test(entity))return '';
 const probe=`data-history-probe="${esc(entity)}"`;
 const snapshot=measurementHistoryCache.get(source+'|'+entity);
 const available=snapshot&&measurementHistoryPoints(snapshot.rows,unit,Math.max(snapshot.start,Date.now()-86400000),Date.now(),0,entity).some(point=>point.value!==null);
 return probe+(available?' '+historyAttributes(slot,unit,label):'');
}

export function historyAttributes(slot:string,unit:string,label:string){
 if(slot==='sensor.uteknx_temperatur'&&unit==='°C')return weekForecastAttributes();
 return `data-measurement-history="${esc(resolveEntity(slot))}" data-history-unit="${esc(unit)}" data-history-label="${esc(label)}" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${esc(label)} · visa senaste dygnet"`;
}
export function weekForecastAttributes(){return 'data-week-forecast role="button" tabindex="0" aria-haspopup="dialog" aria-label="Utetemperatur · visa veckoprognos"';}
export function measurementHistoryPoints(rows:HistoryPoint[],unit:string,start:number,end:number,offset=0,entityId=''){
 return rows.flatMap(row=>{
  const t=Date.parse(row.last_updated),raw=row.state.trim(),n=raw?Number(raw):NaN,source=measurementSourceUnit(entityId,row.attributes?.unit_of_measurement,row.attributes?.simulated);
  if(!Number.isFinite(t)||t<start||t>end)return[];
  let value:number|null=Number.isFinite(n)?n:null;
  if(value!==null){
   if(source==='W'&&unit==='kW'||source==='Wh'&&unit==='kWh')value/=1000;
   else if(source!==unit&&!(['SEK','kr'].includes(String(source))&&['SEK','kr'].includes(unit))&&!(['SEK/kWh','kr/kWh'].includes(String(source))&&['SEK/kWh','kr/kWh'].includes(unit)))value=null;
   if(value!==null&&unit==='°C'&&row.attributes?.simulated!==true)value+=offset;
  }
  return[{t,value}];
 }).sort((a,b)=>a.t-b.t);
}
