import{shortKnxName,roomDisplayName}from'./control-presentation';
import{resolveEntity}from'./entity-bindings';
import{deviceRegistry,discoveredLight}from'./device-registry';import{vehicles}from'./function-data';import type{SceneConfig,SceneObject,HassState}from'./types';
export interface ControlEntityMetadata{entityId:string;name:string;area:string;disabled:boolean;platform:string}
/** Presentation-only additions: no saved binding or 3D coordinate is modified. */
export function controlDevices(config:SceneConfig,states:Map<string,HassState>,source:string,catalog:readonly ControlEntityMetadata[]=[]):SceneObject[]{
 const list=deviceRegistry(config,states,source).filter(o=>['light','car','mower','vacuum','device'].includes(o.type)).map(o=>({...o}));
 for(const o of config.objects)if(o.type==='light'&&!list.some(v=>v.entityId===o.entityId))list.push({...o});
 for(const v of vehicles){const car=list.find(o=>o.id===v.objectId);if(car)car.name=v.name;}
 const add=(slot:string,name:string)=>{const id=resolveEntity(slot);if(!id)return;if(list.some(o=>o.entityId===id))return;const s=states.get(id)??{entity_id:id,state:'unavailable',attributes:{friendly_name:name},last_updated:new Date(0).toISOString(),last_changed:new Date(0).toISOString()};list.push({...discoveredLight(s),id:'panel-'+slot,type:'device',name,placementConfirmed:false});};
 add('climate.vvb_kallaren_termostat','Varmvattenberedaren');
 for(const[id,p]of Object.entries(config.entityPreferences??{}))if(p.control){const s=states.get(id);if(s)add(id,String(s.attributes.friendly_name??id));}
 // KNX actuators are mostly switches, not light entities. Include every registered KNX function.
 const known=new Set(list.map(o=>o.entityId));
 for(const entry of catalog){if(entry.platform!=='knx'||known.has(entry.entityId))continue;const state=states.get(entry.entityId)??{entity_id:entry.entityId,state:'unavailable',attributes:{friendly_name:entry.name},last_updated:new Date(0).toISOString()};list.push({...discoveredLight(state),type:entry.entityId.startsWith('light.')?'light':'device'});known.add(entry.entityId);}
 const rank=(o:SceneObject)=>o.type==='light'?0:o.type==='car'?1:o.entityId.includes('easee_')?2:o.entityId.includes('vvb_')?3:o.type==='mower'?4:o.type==='vacuum'?5:6;
 for(const o of list){const entry=catalog.find(e=>e.entityId===o.entityId&&e.platform==='knx');if(entry||/^aktor/i.test(o.name))o.name=shortKnxName(o.name===o.entityId&&entry?entry.name:o.name);o.name=roomDisplayName(o.name);}
 return list.filter(o=>!config.entityPreferences?.[o.entityId]?.hidden&&(['car','mower'].includes(o.type)||!config.entityPreferences?.[o.entityId]?.hiddenOnDetails||!!states.get(o.entityId)&&!['unknown','unavailable'].includes(states.get(o.entityId)!.state))).sort((a,b)=>rank(a)-rank(b));
}
