import type {SceneObject,HassState} from './types';
/** Cable state/availability is never evidence of absence. Only explicit presence hides a configured car. */
export function carVisible(object:SceneObject,states:Map<string,HassState>,previous?:boolean){
 if(!object.entityId)return false;
 if(object.presence==='away')return false;if(object.presence==='home')return true;
 const binding=object.bindings?.presence;const [id,attr]=binding?.split('@')??[object.entityId,'location'];
 const state=states.get(id);if(!state)return previous??false;if(['unavailable','unknown'].includes(state.state))return previous??true;
 const value=attr?state.attributes[attr]:state.state;
 return !['away','not_home','Borta','off',false].includes(value as string|boolean);
}
