import {readState} from './entity-bindings';
import type{HassState}from'./types';
export type Availability='Ansluten'|'Frånkopplad'|'Saknar data'|'Okänd'|'Otillgänglig'|'Gammal mätning';
export interface Measurement{value:number|null;status:Availability;unit:string}
export interface OverviewBindings{grid:string;gridPositive:'import'|'export'|'unverified';solar:string;house2:string;costToday:string;averageToday:string;luba:string;vacuum:string;rooms:string[];ev6Battery:string;ev6Range:string;ev6Connection:string}
export const overviewBindings:OverviewBindings={grid:'sensor.ferroamp_grid_power',gridPositive:'unverified',solar:'sensor.ferroamp_solar_power',house2:'sensor.elmatare_hus2_effekt_summa',costToday:'$costToday',averageToday:'$averageToday',luba:'$luba',vacuum:'vacuum.xiaomi_vacuum_cleaner',rooms:['sensor.storabadrummet_temperatur'],ev6Battery:'',ev6Range:'',ev6Connection:''};
export function measurement(states:Map<string,HassState>,id:string,connected:boolean,unit:string,now=Date.now(),maxAge=900):Measurement{
 const s=readState(states,id);let status:Availability=!connected?'Frånkopplad':!s?'Saknar data':s.state==='unavailable'?'Otillgänglig':s.state==='unknown'?'Okänd':!Number.isFinite(Date.parse(s.last_reported??s.last_updated))||now-Date.parse(s.last_reported??s.last_updated)>maxAge*1000?'Gammal mätning':'Ansluten';
 const raw=s?.state.trim(),n=raw?Number(raw):NaN;let value=status==='Ansluten'&&Number.isFinite(n)?n:null;
 const source=s?.attributes.unit_of_measurement;
 if(value!==null){if(source==='W'&&unit==='kW')value/=1000;else if(source==='Wh'&&unit==='kWh')value/=1000;else if(source==='SEK/kWh'&&unit==='kr/kWh'){}else if(source!==unit){status='Okänd';value=null;}}
 return{value,status,unit};
}
export function stateText(states:Map<string,HassState>,id:string,connected:boolean,maxAge=Infinity){const s=readState(states,id);if(!connected)return'Frånkopplad';if(!s)return'Saknar data';if(s.state==='unavailable')return'Otillgänglig';if(s.state==='unknown')return'Okänd';if(!Number.isFinite(Date.parse(s.last_reported??s.last_updated))||Date.now()-Date.parse(s.last_reported??s.last_updated)>maxAge*1000)return'Gammal mätning';return({locked:'Låst',unlocked:'Olåst',on:'Öppen',off:'Stängd',docked:'Laddar / dockad',cleaning:'Städar',mowing:'Klipper',paused:'Pausad',returning:'Återvänder'}as Record<string,string>)[s.state]??s.state;}
/** Both counter samples must describe the same verified period boundary, with no reset. */
export function periodCost(start:{value:number;at:number},end:{value:number;at:number},period:{start:number;end:number},reset=false){return !reset&&start.at===period.start&&end.at===period.end&&end.value>=start.value?end.value-start.value:null;}
/** Consumption-weighted average, never an instantaneous tariff or a monthly cost. */
export function averagePrice(cost:number|null,consumedKwh:number|null){return cost!==null&&consumedKwh!==null&&consumedKwh>0?cost/consumedKwh:null;}
export function gridFlow(value:number|null,positive:OverviewBindings['gridPositive']){return value===null?'ELNÄTET':Math.abs(value)<.005?'NOLLFLÖDE':positive==='unverified'?'ELNÄT · RIKTNING EJ VERIFIERAD':(value>0)===(positive==='import')?'KÖPER EL':'SÄLJER EL';}
