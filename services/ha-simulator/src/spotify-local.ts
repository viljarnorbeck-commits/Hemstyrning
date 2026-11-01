import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

async function activationSnapshot(directory:string,now:number){
 try{const text=await readFile(join(directory,'spotify-local-activation.json'),'utf8');if(text.length>200000)return null;const raw=JSON.parse(text);return Number.isFinite(raw.observedAt)&&raw.observedAt<=now+5000&&now-raw.observedAt<=30000&&Array.isArray(raw.devices)?raw:null;}catch{return null;}
}
/** Public discovery is allowlisted: private endpoints and helper keys never leave the server. */
export async function localSpotifyDevices(directory:string,now=Date.now()){
 try{
  const text=await readFile(join(directory,'spotify-local-devices.json'),'utf8');
  if(text.length>200000)throw new Error('Snapshot too large');
  const raw=JSON.parse(text);
  if(!Number.isFinite(raw.observedAt)||raw.observedAt>now+5000||now-raw.observedAt>30000||!Array.isArray(raw.devices))throw new Error('Stale snapshot');
  const devices=raw.devices.slice(0,200).filter((d:any)=>d&&typeof d.id==='string'&&typeof d.name==='string'&&typeof d.model==='string'&&['Google Cast','Spotify Connect'].includes(d.protocol)&&typeof d.announced==='boolean'&&Number.isFinite(d.lastSeen)).map((d:any)=>({id:d.id.slice(0,100),name:d.name.slice(0,200),model:d.model.slice(0,200),protocol:d.protocol,announced:d.announced,lastSeen:d.lastSeen}));
  const activation=await activationSnapshot(directory,now);
  for(const device of devices){const original=raw.devices.find((d:any)=>d.id===device.id);const capable=activation?.devices.find((d:any)=>d.id===device.id&&d.spotifyId===original?.spotifyId&&d.announced);if(device.protocol==='Spotify Connect'&&typeof original?.spotifyId==='string'&&/^[-\w]{1,100}$/.test(original.spotifyId))Object.assign(device,{spotifyId:original.spotifyId,activationSupported:(capable?.activationSupported===true&&typeof activation.activationKey==='string')||(original.activationSupported===true&&typeof raw.activationKey==='string')});}
  return {available:true,devices,observedAt:raw.observedAt};
 }catch{return {available:false,devices:[],observedAt:null};}
}

/** The private discovery capability never crosses the app API boundary. */
export async function activateLocalSpotify(directory:string,id:string,credentials:()=>Promise<{accessToken:string;username:string}>,request:typeof fetch=fetch){
 if(!/^discovered-[a-f0-9]{24}$/.test(id))throw new Error('Ogiltig nätverksmottagare.');
 const text=await readFile(join(directory,'spotify-local-devices.json'),'utf8');
 if(text.length>200000)throw new Error('Ogiltigt discovery-svar.');
 const now=Date.now(),raw=await activationSnapshot(directory,now)??JSON.parse(text);
 const row=Array.isArray(raw.devices)?raw.devices.find((d:any)=>'discovered-'+d.id===id):null;
 if(!Number.isFinite(raw.observedAt)||raw.observedAt>now+5000||now-raw.observedAt>30000||!row?.announced||row.protocol!=='Spotify Connect'||row.activationSupported!==true||!/^[-\w]{1,100}$/.test(row.spotifyId??'')||typeof raw.activationKey!=='string'||!/^[A-Za-z0-9_-]{32,100}$/.test(raw.activationKey)||!Number.isInteger(raw.activationPort)||raw.activationPort<1024||raw.activationPort>65535)throw new Error('Lokal Spotify-aktivering är inte tillgänglig för mottagaren.');
 const auth=await credentials();
 const response=await request('http://127.0.0.1:'+raw.activationPort+'/activate',{method:'POST',headers:{'Content-Type':'application/json','X-Hemstyrning-Activation':raw.activationKey},body:JSON.stringify({id:row.id,...auth}),signal:AbortSignal.timeout(12000),redirect:'error'});
 const result=await response.json() as {deviceId?:string;message?:string};
 if(!response.ok)throw new Error('Mottagaren kunde inte aktiveras med den befintliga Spotify-inloggningen. En separat Connect-auktorisering kan behövas.');
 if(result.deviceId!==row.spotifyId)throw new Error('Mottagarens identitet kunde inte bekräftas.');
 return row.spotifyId as string;
}
