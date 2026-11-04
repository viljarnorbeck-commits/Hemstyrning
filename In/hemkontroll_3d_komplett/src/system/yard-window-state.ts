import profileText from './calibration/kyrkas-photo-windows.json?raw';
import type {HassState} from './types';
type Point=[number,number];
export interface WindowResponse{id:string;color:string;bindings:Array<{entityId:string;weight:number}>;panes:Point[][];spill:Point[];center:Point}
export const yardWindowProfile=JSON.parse(profileText) as {sourcePhotoSha256:string;coordinateSize:Point;windows:WindowResponse[]};
/** Shared confirmed-state response for photographic and model window lighting. */
export function windowLightOutput(window:WindowResponse,states:Map<string,HassState>,enabled:boolean){
 if(!enabled)return 0;
 let output=0;
 for(const binding of window.bindings){
  const state=states.get(binding.entityId);if(state?.state!=='on')continue;
  const brightness=state.attributes.brightness;
  output+=binding.weight*(typeof brightness==='number'&&Number.isFinite(brightness)?Math.max(0,Math.min(1,brightness/255)):1);
 }
 return Math.min(1,output);
}
