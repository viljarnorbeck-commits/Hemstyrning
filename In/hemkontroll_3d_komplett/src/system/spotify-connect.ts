import type{ConnectDevice}from'./spotify-device-picker';
import type{NetworkReceiver}from'./spotify-network';
export function mergeNetworkDevices(reported:readonly ConnectDevice[],network:readonly NetworkReceiver[]):ConnectDevice[]{
 const result=reported.map(d=>({...d}));const name=(s:string)=>s.normalize('NFKC').replace(/\s/g,'').toLocaleLowerCase();
 const preferred=network.filter(d=>d.protocol==='Spotify Connect'||!network.some(other=>other.protocol==='Spotify Connect'&&name(other.name)===name(d.name)));
 for(const d of preferred){if(result.some(other=>other.id===d.spotifyId||name(other.name)===name(d.name)))continue;
  // A getInfo ID identifies hardware, but does not establish account availability.
  // Only /me/player/devices or the current SDK's ready event can authorize a target.
  result.push({id:'discovered-'+d.id,name:d.name,type:d.protocol,is_active:false,is_restricted:true,unavailableReason:d.announced?'Välj först i Spotify-appen med samma konto, uppdatera sedan listan.':'Tidigare upptäckt · tillgänglighet obekräftad',supports_volume:false,volume_percent:null});
 }return result;
}
/** Provider devices plus only the current SDK's actual ready device; IDs stay in memory. */
export function connectDevices(reported:readonly ConnectDevice[],localId:string,localName:string,retired:ReadonlySet<string>):ConnectDevice[]{
 const result:ConnectDevice[]=[],seen=new Set<string>();
 for(const d of reported)if(d.id&&!seen.has(d.id)&&(!retired.has(d.id)||d.id===localId)){seen.add(d.id);result.push({...d,is_local:d.id===localId});}
 if(/^[-\w]{1,100}$/.test(localId)&&!seen.has(localId))result.push({id:localId,name:localName,type:'Computer',is_active:false,is_restricted:false,supports_volume:true,volume_percent:null,is_local:true});
 return result;
}
