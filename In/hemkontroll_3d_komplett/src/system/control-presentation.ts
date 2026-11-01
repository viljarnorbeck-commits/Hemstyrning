import{isLightingEntity}from'../../../../shared/ha-contract.js';
import type{SceneObject,HassState}from'./types';import type{ControlEntityMetadata}from'./control-devices';
export function controlLight(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(o.type==='light')return true;
 const entry=catalog.find(e=>e.entityId===o.entityId&&e.platform==='knx');
 return !!entry&&isLightingEntity(o.entityId,{friendly_name:entry.name,...states.get(o.entityId)?.attributes});
}
/** Cosmetic label only. Keep entity IDs, saved object types and command routes unchanged. */
export function shortKnxName(name:string){
 let text=name.replace(/^(?:light|switch)\./,'').replace(/^aktor[a-z0-9]+(?:_[a-z]\d+)?(?:_port\d+)?(?:_[a-h](?=_))?[_\s-]*/i,'');
 text=text.replace(/_/g,' ').replace(/([a-zåäö])([A-ZÅÄÖ])/g,'$1 $2').replace(/(sovrum|sov|motorvärmare|motorvarmare)\s*(\d+)/gi,'$1 $2').replace(/\s+/g,' ').trim();
 if(/^(?:kök\s+)?köksbord(?:\s+belysning)?$/i.test(text))return'Köksbord';
 text=text.replace(/\s+belysning$/i,'').trim();
 return text?text[0]!.toLocaleUpperCase('sv-SE')+text.slice(1):name;
}
export function controlGroup(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(controlLight(o,states,catalog))return'lights';
 if(/motorv[aä]rmare/i.test(o.entityId+' '+o.name))return'heaters';
 if(['car','mower','vacuum'].includes(o.type)||o.entityId.includes('vvb_'))return'devices';
 return'other';
}
