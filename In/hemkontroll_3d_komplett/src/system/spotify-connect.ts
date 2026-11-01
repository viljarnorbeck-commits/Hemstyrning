import type{ConnectDevice}from'./spotify-device-picker';
/** Provider devices plus only the current SDK's actual ready device; IDs stay in memory. */
export function connectDevices(reported:readonly ConnectDevice[],localId:string,localName:string,retired:ReadonlySet<string>):ConnectDevice[]{
 const result:ConnectDevice[]=[],seen=new Set<string>();
 for(const d of reported)if(d.id&&!seen.has(d.id)&&(!retired.has(d.id)||d.id===localId)){seen.add(d.id);result.push({...d,is_local:d.id===localId});}
 if(/^[-\w]{1,100}$/.test(localId)&&!seen.has(localId))result.push({id:localId,name:localName,type:'Computer',is_active:false,is_restricted:false,supports_volume:true,volume_percent:null,is_local:true});
 return result;
}
