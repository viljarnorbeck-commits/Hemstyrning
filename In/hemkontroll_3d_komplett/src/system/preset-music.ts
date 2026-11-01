import type {PresetMusic} from './types';

export function spotifyPresetUri(value:string):string|undefined{
 const text=value.trim();if(!text)return;
 if(/^spotify:(track|playlist):[a-zA-Z0-9]{1,100}$/.test(text))return text;
 try{const url=new URL(text),match=/^\/(?:intl-[a-z]+\/)?(track|playlist)\/([a-zA-Z0-9]{1,100})$/.exec(url.pathname);if(url.protocol==='https:'&&url.hostname==='open.spotify.com'&&match)return'spotify:'+match[1]+':'+match[2];}catch{}
 throw Error('Använd en Spotify-länk till en låt eller spellista.');
}
async function musicRequest(path:string,body?:unknown){
 const r=await fetch('/spotify-api'+path,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.message??'Spotify kunde inte utföra åtgärden.');return data;
}
/** Re-resolve availability at activation; never send commands to a retired saved ID. */
export async function runPresetMusic(music:PresetMusic){
 const status=await musicRequest('/status');if(!status.connected||!status.canControl)throw Error('Spotify är inte anslutet eller saknar styrbehörighet.');
 const result=await musicRequest('/devices?refresh=1');
 const device=(result.devices??[]).find((d:{id:string;is_active:boolean;is_restricted:boolean})=>!d.is_restricted&&(music.deviceId?d.id===music.deviceId:d.is_active));
 if(!device)throw Error(music.deviceId?'Den valda Spotify-enheten är inte tillgänglig. Öppna Spotify på den och försök igen.':'Ingen aktiv Spotify-enhet. Välj en enhet i spelaren först.');
 if(music.action==='play'&&!device.is_active)await musicRequest('/command',{action:'transfer',deviceId:device.id,play:false});
 await musicRequest('/command',{action:music.action==='pause'?'pause':music.uri?.startsWith('spotify:playlist:')?'play_playlist':music.uri?'play_track':'play',deviceId:device.id,...(music.uri&&music.action==='play'?{uri:music.uri}:{})});
}
