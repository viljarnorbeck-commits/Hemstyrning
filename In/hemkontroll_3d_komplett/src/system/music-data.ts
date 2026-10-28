import {mediaSupports,available} from '../../../../shared/ha-contract.js';
import type {HassState} from './types';
export {mediaSupports,available};
export function mediaPosition(state:HassState|undefined,now=Date.now()){
 const a=state?.attributes??{},duration=Number(a.media_duration),position=Number(a.media_position),stamp=Date.parse(String(a.media_position_updated_at??''));
 if(a.media_position==null||!Number.isFinite(position))return null;
 const elapsed=state?.state==='playing'&&Number.isFinite(stamp)?Math.max(0,Math.min(30,(now-stamp)/1000)):0;
 return Math.max(0,Math.min(Number.isFinite(duration)&&duration>0?duration:Infinity,position+elapsed));
}
export function trackTime(value:unknown){const n=Number(value);return value==null||!Number.isFinite(n)?'—':`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;}
export function artwork(state:HassState|undefined,base:string,simulator:boolean){
 const picture=state?.attributes.entity_picture;
 if(typeof picture!=='string')return '';
 if(simulator)return /^\/textures\/music\/[a-z]+\.svg$/.test(picture)?picture:'';
 return `${base}/artwork?entity_id=${encodeURIComponent(state!.entity_id)}&v=${encodeURIComponent(String(state!.attributes.media_content_id??state!.attributes.media_title??''))}`;
}
