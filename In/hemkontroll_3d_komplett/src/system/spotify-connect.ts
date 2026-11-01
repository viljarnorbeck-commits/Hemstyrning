import type{ConnectDevice}from'./spotify-device-picker';
import type{NetworkReceiver}from'./spotify-network';
export function mergeNetworkDevices(reported:readonly ConnectDevice[],network:readonly NetworkReceiver[]):ConnectDevice[]{
 const result=reported.map(d=>({...d}));const name=(s:string)=>s.normalize('NFKC').replace(/\s/g,'').toLocaleLowerCase();
 const preferred=network.filter(d=>d.protocol==='Spotify Connect'||!network.some(other=>other.protocol==='Spotify Connect'&&name(other.name)===name(d.name)));
 for(const d of preferred){if(result.some(other=>other.id===d.spotifyId||name(other.name)===name(d.name)))continue;
  const usable=d.announced&&d.protocol==='Spotify Connect'&&!!d.spotifyId;
  result.push({id:usable?d.spotifyId!:'discovered-'+d.id,name:d.name,type:usable?'Spotify Connect':d.protocol==='Google Cast'?'Google Cast · Spotify-aktivering saknas':'Spotify Connect · inte tillgänglig',is_active:false,is_restricted:!usable,supports_volume:false,volume_percent:null});
 }return result;
}
/** Provider devices plus only the current SDK's actual ready device; IDs stay in memory. */
export function connectDevices(reported:readonly ConnectDevice[],localId:string,localName:string,retired:ReadonlySet<string>):ConnectDevice[]{
 const result:ConnectDevice[]=[],seen=new Set<string>();
 for(const d of reported)if(d.id&&!seen.has(d.id)&&(!retired.has(d.id)||d.id===localId)){seen.add(d.id);result.push({...d,is_local:d.id===localId});}
 if(/^[-\w]{1,100}$/.test(localId)&&!seen.has(localId))result.push({id:localId,name:localName,type:'Computer',is_active:false,is_restricted:false,supports_volume:true,volume_percent:null,is_local:true});
 return result;
}
