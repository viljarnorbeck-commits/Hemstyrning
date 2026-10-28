import type { HassState, SceneObject } from './types';
export function reading(object: SceneObject, states: Map<string,HassState>, key: string, fallback?: string): unknown {
  const binding=object.bindings?.[key];
  if (binding) { const [id,attr]=binding.split('@'); const state=states.get(id); if(!state||['unknown','unavailable'].includes(state.state))return null;return normalize(attr?state.attributes[attr]:state.state,key,attr?undefined:state.attributes.unit_of_measurement); }
  const state=states.get(object.entityId);
  if(!state||['unknown','unavailable'].includes(state.state))return null;
  const own=state.attributes[key];if(own!==undefined)return own;const value=fallback==='state'?state.state:fallback?state.attributes[fallback]:null;return normalize(value,key,fallback==='state'?state.attributes.unit_of_measurement:undefined);
}
export function numberReading(value:unknown): number|null { return value===null||value===undefined||value===''||typeof value==='boolean'||!Number.isFinite(Number(value))?null:Number(value); }
export function formatReading(value:unknown,unit='',digits=1) {const n=numberReading(value);return n===null?'Saknar data':`${n.toLocaleString('sv-SE',{maximumFractionDigits:digits})}${unit?' '+unit:''}`;}

function normalize(value:unknown,key:string,unit:unknown){if(value===null||value===undefined)return null;const n=Number(value);if(Number.isFinite(n)&&((key.endsWith('_kw')&&unit==='W')||(['energy_today','energy_total'].includes(key)&&unit==='Wh')))return n/1000;return value;}

export function booleanReading(value:unknown):boolean|null{if(value===null||value===undefined)return null;if(typeof value==='boolean')return value;if(['on','heat','cool','auto','true','charging','1'].includes(String(value)))return true;if(['off','false','0','not_charging'].includes(String(value)))return false;return null;}
