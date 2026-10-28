import type{SceneObject,HassState,SceneConfig,EnvironmentFrame}from'./types';
export function robotLightState(object:SceneObject,states:Map<string,HassState>,scene:SceneConfig,frame:EnvironmentFrame,connected:boolean,now=Date.now()){
 const config=object.headlight;if(!config?.enabled)return{on:false,source:'avstängd'};
 const [id,attribute]=object.bindings?.headlight?.split('@')??[object.entityId,'headlight'],state=states.get(id),value=attribute?state?.attributes[attribute]:state?.state;
 const fresh=state&&now-Date.parse(state.last_updated)<=30000;
 if(connected&&fresh&&!['unavailable','unknown'].includes(state.state)&&[true,false,'on','off'].includes(value as string|boolean))return{on:value===true||value==='on',source:'uppmätt'};
 if(!config.estimate)return{on:false,source:'okänd'};
 const lux=states.get(scene.bindings.lux),n=Number(lux?.state),valid=!!lux?.state.trim()&&Number.isFinite(n)&&n>=0&&now-Date.parse(lux!.last_updated)<scene.bindings.luxMaxAge*1000;
 return{on:connected&&['mowing','returning'].includes(states.get(object.entityId)?.state??'')&&(valid?n<config.luxThreshold:frame.daylight<.08),source:'uppskattad'};
}
