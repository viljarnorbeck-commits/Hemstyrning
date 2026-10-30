import {randomBytes} from 'node:crypto';
import {readFile,writeFile,rename,mkdir,chmod} from 'node:fs/promises';
import {join} from 'node:path';
import {Router,type Request,type Response} from 'express';

type Tokens={access_token:string;refresh_token:string;expires_at:number};
type Pending={expires:number};
type SpotifyDevice={id:string|null;name:string;type:string;is_active:boolean;is_restricted:boolean;supports_volume:boolean;volume_percent:number|null};
const scopes='user-read-playback-state user-read-currently-playing user-modify-playback-state';
const validAction=new Set(['play','pause','next','previous','volume','transfer','seek']);
function configured(){
 const id=process.env.SPOTIFY_CLIENT_ID?.trim()??'',secret=process.env.SPOTIFY_CLIENT_SECRET?.trim()??'';
 const redirect=process.env.SPOTIFY_REDIRECT_URI?.trim()??'';
 if(!id||!secret||!redirect)return null;
 try{const url=new URL(redirect);if(url.pathname!=='/spotify-api/callback'||!(url.protocol==='https:'||url.protocol==='http:'&&['127.0.0.1','[::1]'].includes(url.hostname)))return null;}catch{return null;}
 return{id,secret,redirect};
}
function textStatus(response:Response,status:number,message:string){response.status(status).json({message});}
function albumImage(item:any):string{
 const url=item?.album?.images?.[0]?.url;
 try{const u=new URL(url);return u.protocol==='https:'&&['i.scdn.co','mosaic.scdn.co'].includes(u.hostname)?u.href:'';}catch{return '';}
}
export function spotifyApi(directory:string,role:(request:Request)=>'viewer'|'controller'|'admin'|undefined,request:typeof fetch=fetch){
 const router=Router(),file=join(directory,'spotify-account.json'),pending=new Map<string,Pending>();
 let tokens:Tokens|null=null,loaded=false,saveQueue=Promise.resolve(),refreshing:Promise<string>|null=null;
 let playbackCache:{until:number;data:any}|null=null,playbackPromise:Promise<any>|null=null;
 let devicesCache:{until:number;data:any}|null=null,devicesPromise:Promise<any>|null=null;
 let blockedUntil=0;
 async function load(){if(loaded)return;loaded=true;try{const t=JSON.parse(await readFile(file,'utf8'));if(typeof t.access_token==='string'&&typeof t.refresh_token==='string'&&Number.isFinite(t.expires_at))tokens=t;}catch{}}
 function store(){
  const snapshot=tokens?JSON.stringify(tokens):'';
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
   await mkdir(directory,{recursive:true,mode:0o700});
   if(!snapshot)return;const tmp=file+'.tmp';
   await writeFile(tmp,snapshot,{encoding:'utf8',mode:0o600});
   await chmod(tmp,0o600);await rename(tmp,file);
  });return saveQueue;
 }
 async function exchange(params:URLSearchParams){
  const cfg=configured();if(!cfg)throw new Error('Spotify är inte konfigurerat');
  const response=await request('https://accounts.spotify.com/api/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(cfg.id+':'+cfg.secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:params,signal:AbortSignal.timeout(12000),redirect:'error'});
  const data:any=await response.json().catch(()=>({}));
  if(!response.ok||typeof data.access_token!=='string'||!Number.isFinite(data.expires_in))throw new Error('Spotify nekade inloggningen. Kontrollera Client ID, secret och redirect-URI.');
  return data;
 }
 async function accessToken(){
  await load();if(!tokens)throw new SpotifyError(409,'Anslut Spotify under musikinställningarna.');
  if(Date.now()<tokens.expires_at-60000)return tokens.access_token;
  if(refreshing)return refreshing;
  refreshing=(async()=>{const previous=tokens!;const response=await exchange(new URLSearchParams({grant_type:'refresh_token',refresh_token:previous.refresh_token}));
   tokens={access_token:response.access_token,refresh_token:typeof response.refresh_token==='string'?response.refresh_token:previous.refresh_token,expires_at:Date.now()+response.expires_in*1000};
   await store();return tokens.access_token;
  })();
  try{return await refreshing;}finally{refreshing=null;}
 }
 async function spotify(path:string,method='GET',payload?:unknown,tryRefresh=true):Promise<any>{
  if(Date.now()<blockedUntil)throw new SpotifyError(429,'Spotify begränsar antalet förfrågningar. Försök senare.');
  const token=await accessToken();
  const response=await request('https://api.spotify.com/v1'+path,{method,headers:{Authorization:'Bearer '+token,...(payload?{'Content-Type':'application/json'}:{})},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(12000),redirect:'error'});
  if(response.status===401&&tryRefresh){if(tokens)tokens.expires_at=0;return spotify(path,method,payload,false);}
  if(response.status===429){const seconds=Math.min(300,Math.max(5,Number(response.headers.get('retry-after'))||30));blockedUntil=Date.now()+seconds*1000;throw new SpotifyError(429,'Spotify begränsar anropen. Försök igen om '+seconds+' sekunder.');}
  if(!response.ok){const status=response.status;throw new SpotifyError(status>=500?502:status===401?401:status===403?403:400,status===403?'Spotify kräver Premium eller tillåter inte åtgärden på vald enhet.':status===401?'Spotify-inloggningen behöver förnyas.':'Spotify kunde inte utföra åtgärden ('+status+').');}
  if(response.status===204)return null;
  return response.json().catch(()=>null);
 }
 function requireRole(req:Request,res:Response,write=false){
  const r=role(req);
  if(!r){textStatus(res,401,'Logga in i Hemstyrning.');return false;}
  if(write&&r==='viewer'){textStatus(res,403,'Denna skärm får inte styra musik.');return false;}
  return true;
 }
 router.get('/status',async(req,res)=>{if(!requireRole(req,res))return;await load();res.json({configured:!!configured(),connected:!!tokens,canControl:role(req)!=='viewer',canConfigure:role(req)==='admin',message:!configured()?'Ange SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET och SPOTIFY_REDIRECT_URI i serverns .env.':!tokens?'Anslut ditt Spotify-konto via musikpanelen.':'Ansluten till Spotify.'});});
 router.get('/connect',(req,res)=>{if(role(req)!=='admin'){textStatus(res,403,'Administratör krävs för att ansluta Spotify.');return;}
  const cfg=configured();if(!cfg){textStatus(res,409,'Konfigurera Spotify-uppgifterna i serverns .env först.');return;}
  const state=randomBytes(32).toString('hex');pending.set(state,{expires:Date.now()+300000});if(pending.size>40)for(const [k,v] of pending)if(v.expires<Date.now()||pending.size>40)pending.delete(k);
  const url=new URL('https://accounts.spotify.com/authorize');for(const [key,value] of Object.entries({response_type:'code',client_id:cfg.id,redirect_uri:cfg.redirect,state,scope:scopes,show_dialog:'true'}))url.searchParams.set(key,value);
  res.redirect(url.href);
 });
 router.get('/callback',async(req,res)=>{
  const cfg=configured(),state=typeof req.query.state==='string'?req.query.state:'',record=pending.get(state);
  pending.delete(state);
  if(!cfg||!record||record.expires<Date.now()||typeof req.query.code!=='string'||!!req.query.error){textStatus(res,400,'Ogiltigt eller utgånget Spotify-inloggningsförsök.');return;}
  try{const data=await exchange(new URLSearchParams({grant_type:'authorization_code',code:req.query.code,redirect_uri:cfg.redirect}));
   tokens={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+data.expires_in*1000};
   if(typeof tokens.refresh_token!=='string')throw new Error('Spotify skickade ingen förnyelsetoken');
   await store();playbackCache=null;devicesCache=null;
   res.redirect(new URL('/?spotify=connected',cfg.redirect).href);
  }catch{ textStatus(res,502,'Spotify kunde inte anslutas. Kontrollera appinställningarna och försök igen.');}
 });
 router.post('/disconnect',async(req,res)=>{if(role(req)!=='admin'){textStatus(res,403,'Administratör krävs.');return;}await load();tokens=null;playbackCache=null;devicesCache=null;try{const {unlink}=await import('node:fs/promises');await unlink(file);}catch{}res.json({connected:false});});
 router.get('/playback',async(req,res)=>{if(!requireRole(req,res))return;await load();if(!tokens){res.json({connected:false,playing:false,track:null,device:null});return;}
  try{
   if(playbackCache&&Date.now()<playbackCache.until){res.json(playbackCache.data);return;}
   if(!playbackPromise)playbackPromise=(async()=>{
    const raw=await spotify('/me/player'),item=raw?.item;
    const data={connected:true,playing:raw?.is_playing===true,track:item?{name:String(item.name??''),artist:Array.isArray(item.artists)?item.artists.map((a:any)=>String(a.name??'')).join(', '):String(item.show?.name??''),album:String(item.album?.name??''),cover:albumImage(item),durationMs:Math.max(0,Number(item.duration_ms)||0),url:typeof item.external_urls?.spotify==='string'?item.external_urls.spotify:null}:null,progressMs:Math.max(0,Number(raw?.progress_ms)||0),device:raw?.device?{id:raw.device.id??null,name:String(raw.device.name??''),volume_percent:raw.device.volume_percent??null}:null};
    playbackCache={data,until:Date.now()+5000};return data;
   })().finally(()=>{playbackPromise=null;});
   res.json(await playbackPromise);
  }catch(e){textStatus(res,e instanceof SpotifyError?e.status:502,e instanceof Error?e.message:'Spotify är tillfälligt otillgängligt.');}
 });
 router.get('/devices',async(req,res)=>{if(!requireRole(req,res))return;await load();if(!tokens){res.json({devices:[]});return;}
  try{if(devicesCache&&Date.now()<devicesCache.until){res.json(devicesCache.data);return;}
   if(!devicesPromise)devicesPromise=spotify('/me/player/devices').then(data=>{const devices=(Array.isArray(data?.devices)?data.devices:[]).filter((d:any)=>typeof d.id==='string'&&d.id.length>0).map((d:any):SpotifyDevice=>({id:d.id,name:String(d.name??'Spotify-enhet'),type:String(d.type??''),is_active:d.is_active===true,is_restricted:d.is_restricted===true,supports_volume:d.supports_volume===true,volume_percent:typeof d.volume_percent==='number'?d.volume_percent:null}));const output={devices};devicesCache={data:output,until:Date.now()+15000};return output;}).finally(()=>devicesPromise=null);
   res.json(await devicesPromise);
  }catch(e){textStatus(res,e instanceof SpotifyError?e.status:502,e instanceof Error?e.message:'Spotify är tillfälligt otillgängligt.');}
 });
 router.post('/command',async(req,res)=>{
  if(!requireRole(req,res,true))return;const a=req.body?.action;
  if(typeof a!=='string'||!validAction.has(a)){textStatus(res,400,'Otillåtet Spotify-kommando.');return;}
  const deviceId=req.body?.deviceId;if(deviceId!==undefined&&(typeof deviceId!=='string'||!/^[-\w]{1,100}$/.test(deviceId))){textStatus(res,400,'Ogiltigt enhets-ID.');return;}
  const query=deviceId?'?device_id='+encodeURIComponent(deviceId):'';
  try{
   switch(a){
    case 'play':await spotify('/me/player/play'+query,'PUT');break;
    case 'pause':await spotify('/me/player/pause'+query,'PUT');break;
    case 'next':await spotify('/me/player/next'+query,'POST');break;
    case 'previous':await spotify('/me/player/previous'+query,'POST');break;
    case 'volume':{const n=req.body?.volume;if(!Number.isInteger(n)||n<0||n>100){textStatus(res,400,'Volymen måste vara mellan 0 och 100.');return;}await spotify('/me/player/volume?volume_percent='+n+(deviceId?'&device_id='+encodeURIComponent(deviceId):''),'PUT');break;}
    case 'seek':{const n=req.body?.positionMs;if(!Number.isInteger(n)||n<0||n>86400000){textStatus(res,400,'Ogiltig position.');return;}await spotify('/me/player/seek?position_ms='+n+(deviceId?'&device_id='+encodeURIComponent(deviceId):''),'PUT');break;}
    case 'transfer':{if(!deviceId){textStatus(res,400,'Välj en uppspelningsenhet.');return;}await spotify('/me/player','PUT',{device_ids:[deviceId],play:false});break;}
   }
   playbackCache=null;devicesCache=null;res.json({accepted:true});
  }catch(e){textStatus(res,e instanceof SpotifyError?e.status:502,e instanceof Error?e.message:'Spotify-kommandot misslyckades.');}
 });
 return router;
}
class SpotifyError extends Error{constructor(public status:number,message:string){super(message);}}
