import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

/** The Windows mDNS helper publishes names only. No tokens, IP addresses or commands. */
export async function localSpotifyDevices(directory:string,now=Date.now()){
 try{
  const text=await readFile(join(directory,'spotify-local-devices.json'),'utf8');
  if(text.length>200000)throw new Error('Snapshot too large');
  const raw=JSON.parse(text);
  if(!Number.isFinite(raw.observedAt)||raw.observedAt>now+5000||now-raw.observedAt>30000||!Array.isArray(raw.devices))throw new Error('Stale snapshot');
  const devices=raw.devices.slice(0,200).filter((d:any)=>d&&typeof d.id==='string'&&typeof d.name==='string'&&typeof d.model==='string'&&['Google Cast','Spotify Connect'].includes(d.protocol)&&typeof d.announced==='boolean'&&Number.isFinite(d.lastSeen)).map((d:any)=>({id:d.id.slice(0,100),name:d.name.slice(0,200),model:d.model.slice(0,200),protocol:d.protocol,announced:d.announced,lastSeen:d.lastSeen}));
  for(const device of devices){const original=raw.devices.find((d:any)=>d.id===device.id);if(device.protocol==='Spotify Connect'&&typeof original?.spotifyId==='string'&&/^[-\w]{1,100}$/.test(original.spotifyId))Object.assign(device,{spotifyId:original.spotifyId});}
  return {available:true,devices,observedAt:raw.observedAt};
 }catch{return {available:false,devices:[],observedAt:null};}
}
