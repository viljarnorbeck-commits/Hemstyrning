import type {HassState,SceneConfig,SceneObject} from './types';

export function discoveredLight(state:HassState):SceneObject {
  return {id:'ha-'+state.entity_id,type:'light',name:String(state.attributes.friendly_name??state.entity_id),entityId:state.entity_id,
    placementConfirmed:false,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],color:'#ffffff',intensity:0,angle:45,range:10,roughness:.5,metalness:0,points:[],bindings:{}};
}
/** One identity lookup for rendering, selection, configuration and command routing. */
export function deviceRegistry(scene:SceneConfig,states:Map<string,HassState>,source:string):SceneObject[] {
  const objects=scene.objects.filter(o=>o.type!=='light'||!!o.entityId&&(source==='simulator'||states.has(o.entityId)));
  const known=new Set(objects.map(o=>o.entityId));
  for(const s of states.values())if(s.entity_id.startsWith('light.')&&!known.has(s.entity_id))objects.push(discoveredLight(s));
  return objects;
}
export function lightCapabilities(state:HassState|undefined) {
 const modes=Array.isArray(state?.attributes.supported_color_modes)?state.attributes.supported_color_modes as string[]:[];
 return {brightness:modes.some(m=>m!=='onoff'),color:modes.some(m=>['rgb','rgbw','rgbww','hs','xy'].includes(m)),temperature:modes.includes('color_temp')};
}
export function controlReason(connected:boolean,enabled:boolean,state:HassState|undefined,saved:boolean) {
 if(!connected)return 'Home Assistant är frånkopplad.';
 if(!enabled)return 'Skrivskyddad anslutning. Riktiga enheter får inte styras.';
 if(!saved)return 'Spara lampans koppling innan styrning.';
 if(!state||!['on','off'].includes(state.state))return 'Lampan är otillgänglig eller saknar bekräftat tillstånd.';
 return '';
}
