import{resolveEntity}from'./entity-bindings';
import{deviceRegistry,discoveredLight}from'./device-registry';import{vehicles}from'./function-data';import type{SceneConfig,SceneObject,HassState}from'./types';
/** Presentation-only additions: no saved binding or 3D coordinate is modified. */
export function controlDevices(config:SceneConfig,states:Map<string,HassState>,source:string):SceneObject[]{
 const list=deviceRegistry(config,states,source).filter(o=>['light','car','mower','vacuum','device'].includes(o.type)).map(o=>({...o}));
 for(const o of config.objects)if(o.type==='light'&&!list.some(v=>v.entityId===o.entityId))list.push({...o});
 for(const v of vehicles){const car=list.find(o=>o.id===v.objectId);if(car)car.name=v.name;}
 const add=(slot:string,name:string)=>{const id=resolveEntity(slot);if(!id)return;if(list.some(o=>o.entityId===id))return;const s=states.get(id)??{entity_id:id,state:'unavailable',attributes:{friendly_name:name},last_updated:new Date(0).toISOString(),last_changed:new Date(0).toISOString()};list.push({...discoveredLight(s),id:'panel-'+slot,type:'device',name,placementConfirmed:false});};
 add('climate.vvb_kallaren_termostat','Varmvattenberedaren');
 for(const[id,p]of Object.entries(config.entityPreferences??{}))if(p.control){const s=states.get(id);if(s)add(id,String(s.attributes.friendly_name??id));}
 const rank=(o:SceneObject)=>o.type==='light'?0:o.type==='car'?1:o.entityId.includes('easee_')?2:o.entityId.includes('vvb_')?3:o.type==='mower'?4:o.type==='vacuum'?5:6;
 return list.filter(o=>!config.entityPreferences?.[o.entityId]?.hidden).sort((a,b)=>rank(a)-rank(b));
}
