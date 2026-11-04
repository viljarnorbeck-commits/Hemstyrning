import type {Connection} from './connection';
import {measurement,measurementNote} from './overview-data';
import {resolveEntity} from './entity-bindings';

export interface PowerMeterNode{id:string;label:string;slot:string;parent?:string;color:string}
/** Electrical hierarchy supplied by the owner; children are already included in their parent. */
export const powerMeterHierarchy:readonly PowerMeterNode[]=[
 {id:'ferroamp',label:'Ferroamp',slot:'sensor.ferroamp_consumption_power',color:'#f4ab65'},
 {id:'heat',parent:'ferroamp',label:'Värme',slot:'sensor.elmatare_varme_effekt_2',color:'#e2a26e'},
 {id:'home',parent:'ferroamp',label:'Bostad',slot:'sensor.elmatare_bostad_effekt_summa',color:'#81b5e5'},
 {id:'house2',parent:'ferroamp',label:'Hus 2',slot:'sensor.elmatare_hus2_effekt_summa',color:'#a7c88d'},
 {id:'workshop',parent:'ferroamp',label:'Verkstad',slot:'sensor.elmatare_verkstad_effekt_summa',color:'#7acac5'},
 {id:'easee-left',parent:'workshop',label:'Easee vänster',slot:'sensor.easee_vanster_power',color:'#b3a0e3'},
 {id:'easee-right',parent:'workshop',label:'Easee höger',slot:'sensor.easee_hoger_power',color:'#d59fcb'},
 ...[1,2,3,4].map(number=>({id:'heater-'+number,parent:'workshop',label:'Motorvärmare '+number,slot:'sensor.motorvarmare'+number+'_kw',color:['#c8a76f','#b9ad73','#cfad86','#b69c7d'][number-1]!})),
];
export function powerMeterSample(node:PowerMeterNode,connection:Connection){
 const entity=resolveEntity(node.slot),m=measurement(connection.states,node.slot,connection.connected,'kW');
 return{...node,entity,value:m.value,note:m.value===null?m.status:measurementNote(m),reportedAt:m.reportedAt};
}
export function additionalPowerMeters(connection:Connection){
 const known=new Set(powerMeterHierarchy.map(n=>resolveEntity(n.slot)));
 return [...connection.states.values()].filter(s=>s.entity_id.startsWith('sensor.')&&!known.has(s.entity_id)&&['W','kW'].includes(String(s.attributes.unit_of_measurement))&&!/reactive|_l[123]$/.test(s.entity_id)).map(s=>({
  id:s.entity_id,label:String(s.attributes.friendly_name??s.entity_id),
  kind:s.entity_id==='sensor.elmatare_varme_effekt'?'Alternativ värmesensor · summa används i diagrammet':s.entity_id==='sensor.motorvarmare_effekt'?'Motorvärmare · verkstad · totalen visas separat tills summeringen bekräftats':/solar_power|pv_string_power/.test(s.entity_id)?'Solproduktion · ingår inte som förbrukningsgren':/grid_power/.test(s.entity_id)?'Nätutbyte · separat från total last':/inverter/.test(s.entity_id)?'Växelriktare · ska inte adderas till förbrukningen':/battery/.test(s.entity_id)?'Batteriflöde · separat från förbrukningsgrenarna':/easee.*total_power/.test(s.entity_id)?'Alternativ laddboxsensor · undvik dubbelräkning':'Mätarens placering behöver bekräftas',
  sample:measurement(connection.states,s.entity_id,connection.connected,'kW'),
 }));
}
