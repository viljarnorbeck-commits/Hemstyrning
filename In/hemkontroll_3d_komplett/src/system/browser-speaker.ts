/** Only the official SDK receives the ephemeral token. Never store tokens or device IDs. */
export interface SDKPlayer {
 addListener(event:string,callback:(event:any)=>void):boolean;
 connect():Promise<boolean>;disconnect():void;activateElement():Promise<void>;
}
interface SDK {Player:new(options:{name:string;volume:number;enableMediaSession:boolean;getOAuthToken:(callback:(token:string)=>void)=>void})=>SDKPlayer}
declare global {interface Window {Spotify?:SDK;onSpotifyWebPlaybackSDKReady?:()=>void}}
let sdkPromise:Promise<SDK>|undefined;
function loadSDK(){
 if(window.Spotify)return Promise.resolve(window.Spotify);
 if(sdkPromise)return sdkPromise;
 sdkPromise=new Promise<SDK>((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://sdk.scdn.co/spotify-player.js';script.async=true;
  const previous=window.onSpotifyWebPlaybackSDKReady;
  const cleanup=()=>{clearTimeout(timer);if(window.onSpotifyWebPlaybackSDKReady===ready)window.onSpotifyWebPlaybackSDKReady=previous;};
  const fail=()=>{cleanup();script.remove();sdkPromise=undefined;reject(new Error('Webbläsarspelaren kunde inte laddas. Kontrollera nätverket eller innehållsblockeraren.'));};
  const ready=()=>{previous?.();if(window.Spotify){cleanup();resolve(window.Spotify);}else fail();};
  const timer=setTimeout(fail,20000);window.onSpotifyWebPlaybackSDKReady=ready;script.onerror=fail;document.head.append(script);
 });return sdkPromise;
}
export class BrowserSpeaker extends EventTarget {
 deviceId='';lastDeviceId='';name='Hemstyrning · Webbläsare';message='';needsGesture=false;
 private player?:SDKPlayer;private enabled=false;private pending=false;private serial=0;private retryAt=0;private failures=0;private timer?:ReturnType<typeof setTimeout>;
 private changed(){this.dispatchEvent(new Event('change'));}
 async enable(){
  this.enabled=true;if(this.player||this.pending||Date.now()<this.retryAt)return;
  const serial=++this.serial;this.pending=true;this.message='Ansluter den här webbläsaren…';this.changed();
  try{
   if(!window.isSecureContext)throw new Error('Webbläsaruppspelning kräver HTTPS eller localhost.');
   const sdk=await loadSDK();if(!this.enabled||serial!==this.serial)return;
   const player=new sdk.Player({name:this.name,volume:.35,enableMediaSession:true,getOAuthToken:callback=>{
    void fetch('/spotify-api/sdk-token',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{
     if(!response.ok)throw new Error('Godkänn webbläsaruppspelning genom att ansluta Spotify igen.');
     const data=await response.json();if(this.enabled&&serial===this.serial&&typeof data.accessToken==='string')callback(data.accessToken);
    }).catch(()=>{if(serial===this.serial)this.fail('Spotify-behörigheten behöver förnyas. Anslut kontot igen.');});
   }});this.player=player;
   player.addListener('ready',({device_id})=>{if(serial!==this.serial||!this.enabled||typeof device_id!=='string')return;clearTimeout(this.timer);this.deviceId=this.lastDeviceId=device_id;this.failures=0;this.message='Tillgänglig som Spotify Connect-enhet';this.changed();});
   player.addListener('not_ready',()=>{if(serial===this.serial)this.fail('Webbläsaren tappade Spotify-anslutningen. Återansluter…');});
   player.addListener('autoplay_failed',()=>{if(serial!==this.serial)return;this.needsGesture=true;this.message='Välj Tillåt ljud för att aktivera webbläsarens ljud.';this.changed();});
   player.addListener('player_state_changed',()=>{if(serial===this.serial)this.dispatchEvent(new Event('playback'));});
   for(const [event,message]of [['initialization_error','Webbläsaren stöder inte Spotify-uppspelning. Prova Chrome eller Edge med skyddat innehåll aktiverat.'],['authentication_error','Anslut Spotify igen för att förnya webbläsarbehörigheten.'],['account_error','Webbläsaruppspelning kräver Spotify Premium.'],['playback_error','Spotify kunde inte spela ljud i den här webbläsaren.']])player.addListener(event,()=>{if(serial===this.serial)this.fail(message);});
   this.timer=setTimeout(()=>{if(serial===this.serial&&!this.deviceId)this.fail('Spotify kunde inte registrera webbläsaren. Kontrollera Premium, Web Playback SDK i utvecklarappen och nätverket.');},25000);
   if(!await player.connect()&&serial===this.serial)this.fail('Spotify kunde inte ansluta webbläsaren.');
  }catch(error){if(serial===this.serial)this.fail(error instanceof Error?error.message:'Webbläsaren kunde inte anslutas.');}
  finally{if(serial===this.serial)this.pending=false;}
 }
 private fail(message:string){++this.serial;this.pending=false;clearTimeout(this.timer);this.player?.disconnect();this.player=undefined;this.deviceId='';this.retryAt=Date.now()+Math.min(120000,10000*2**Math.min(this.failures++,4));this.message=message;this.changed();}
 /** Must be invoked directly by the user's device choice, before any await. */
 activate(){if(!this.player||!this.deviceId)return Promise.reject(new Error('Webbläsarspelaren är inte redo.'));return this.player.activateElement().then(()=>{this.needsGesture=false;this.changed();}).catch(()=>{this.needsGesture=true;this.changed();throw new Error('Webbläsaren blockerar ljud. Välj Tillåt ljud.');});}
 disable(){this.enabled=false;++this.serial;clearTimeout(this.timer);this.pending=false;this.player?.disconnect();this.player=undefined;this.deviceId='';this.needsGesture=false;this.message='';this.changed();}
}
