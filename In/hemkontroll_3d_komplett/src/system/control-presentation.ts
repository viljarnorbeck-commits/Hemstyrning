import{isLightingEntity}from'../../../../shared/ha-contract.js';
import type{SceneObject,HassState}from'./types';import type{ControlEntityMetadata}from'./control-devices';
export function controlLight(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(o.type==='light')return true;
 const entry=catalog.find(e=>e.entityId===o.entityId&&e.platform==='knx');
 if(!entry)return false;
 const attributes={friendly_name:entry.name,...states.get(o.entityId)?.attributes};
 if(isLightingEntity(o.entityId,attributes))return true;
 // Display classification only. This does not add Halloween targets or command permissions.
 const name=String(attributes.friendly_name).toLocaleLowerCase('sv-SE').replace(/_/g,' ');
 if(/uttag|matning|konstant|kyl|micro|vatten|motor|ladd|\bnil\b/.test(name))return false;
 return o.entityId.startsWith('switch.')&&/(?:^|[\s-])tak(?:$|[\s-])|f[öo]nster/.test(name);
}
/** Cosmetic label only. Keep entity IDs, saved object types and command routes unchanged. */
export function shortKnxName(name:string){
 let text=name.replace(/^(?:light|switch)\./,'').replace(/^aktor[a-z0-9]+(?:_[a-z]\d+)?(?:_port\d+)?(?:_[a-h](?=_))?[_\s-]*/i,'');
 text=text.replace(/_/g,' ').replace(/([a-zåäö])([A-ZÅÄÖ])/g,'$1 $2').replace(/(sovrum|sov|motorvärmare|motorvarmare)\s*(\d+)/gi,'$1 $2').replace(/\s+/g,' ').trim();
 if(/^(?:kök\s+)?köksbord(?:\s+belysning)?$/i.test(text))return'Köksbord';
 text=text.replace(/\s+belysning$/i,'').trim();
 if(/^nil$/i.test(text)){const port=name.match(/port(\d+)/i);return port?'Ej namngiven port '+port[1]:'Ej namngiven kanal';}
 if(text)return text[0]!.toLocaleUpperCase('sv-SE')+text.slice(1);
 const channel=name.match(/aktor([a-z]\d+)([a-z])?/i);
 return channel?'Kanal '+channel[1]!.toUpperCase()+(channel[2]?' '+channel[2].toUpperCase():''):'Ej namngiven kanal';
}
export function controlGroup(o:SceneObject,states:Map<string,HassState>,catalog:readonly ControlEntityMetadata[]=[]){
 if(controlLight(o,states,catalog))return'lights';
 if(/motorv[aä]rmare/i.test(o.entityId+' '+o.name))return'heaters';
 if(['car','mower','vacuum'].includes(o.type)||o.entityId.includes('vvb_'))return'devices';
 const entry=catalog.find(e=>e.entityId===o.entityId),name=(entry?.name??o.name).toLocaleLowerCase('sv-SE');
 if(o.entityId.startsWith('switch.')&&/uttag|vinkyl|vattenkokare|micro|tv[-_\s]?b[äa]nk/.test(name))return'outlets';
 if(o.entityId.startsWith('switch.'))return'switches';
 return'other';
}
