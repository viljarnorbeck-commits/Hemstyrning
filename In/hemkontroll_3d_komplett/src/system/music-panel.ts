import{updateMarkup}from'./card-design';
import{icon}from'./app-navigation';
import {BrowserSpeaker} from './browser-speaker';
import QRCode from 'qrcode';
import {canonicalJamUrl} from '../../../../shared/ha-contract.js';
import {escapeHtml as esc} from './panels';
import {trackTime} from './music-data';
import type {Connection} from './connection';
import type {Configuration} from './configuration';

type Track={name:string;artist:string;album:string;cover:string;durationMs:number;url:string|null};
type Player={connected:boolean;playing:boolean;track:Track|null;progressMs:number;device:{id:string|null;name:string;volume_percent:number|null}|null};
type Device={id:string;name:string;type:string;is_active:boolean;is_restricted:boolean;supports_volume:boolean;volume_percent:number|null};
type Setup={configured:boolean;connected:boolean;canControl:boolean;canConfigure:boolean;webPlaybackAuthorized?:boolean;message:string};
type SpotifyItem={uri:string;name:string;artist?:string;owner?:string;cover?:string;image?:string};
async function api<T>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch('/spotify-api'+path,{...options,signal:AbortSignal.timeout(15000)});
 const body=await response.json().catch(()=>({})) as T&{message?:string};
 if(!response.ok)throw new Error(body.message||'Spotify svarade inte ('+response.status+').');
 return body;
}
function cover(url:string){try{const u=new URL(url);return u.protocol==='https:'&&['i.scdn.co','mosaic.scdn.co'].includes(u.hostname)?esc(u.href):'';}catch{return '';}}
const blank:Player={connected:false,playing:false,track:null,progressMs:0,device:null};
export class MusicPanel{
 readonly root=document.createElement('aside');
 private dialog=document.createElement('dialog');private embedded=false;private queue:SpotifyItem[]=[];
 private state:Player=blank;private setup:Setup={configured:false,connected:false,canControl:false,canConfigure:false,message:'Ansluter till Spotify…'};
 private devices:Device[]=[];private busy=false;private commandError=false;private feedback='';private open=false;private qr='';private qrLabel='';private timer:ReturnType<typeof setInterval>;
 private speaker=new BrowserSpeaker();private speakerEnabled=false;private readyDevice='';private deviceLoading=false;private sdkRefreshAt=0;
 private refreshInFlight?:Promise<void>;private loading=false;private stopped=false;private lastRefresh=0;
 private searchTerm='';private results:SpotifyItem[]=[];private playlists:SpotifyItem[]=[];
 onVisibilityChange:(open:boolean)=>void=()=>{};
 constructor(_connection:Connection,private config:Configuration,private notify:(message:string)=>void){
  this.speaker.addEventListener('change',()=>{if(this.stopped)return;if(this.speaker.deviceId&&this.readyDevice!==this.speaker.deviceId){this.readyDevice=this.speaker.deviceId;if(this.open)void this.loadDevices();}this.update();});
  this.speaker.addEventListener('playback',()=>{if(!this.stopped&&Date.now()-this.sdkRefreshAt>5000){this.sdkRefreshAt=Date.now();void this.refresh();}});
  this.root.className='music-widget glass';this.root.setAttribute('aria-label','Spotify – direktanslutning');
  this.dialog.className='music-panel spotify-direct';
  document.body.append(this.root,this.dialog);
  this.root.addEventListener('click',e=>{
   const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');
   if(!b)return;
   if(b.dataset.spotify)void this.command(b.dataset.spotify);
   else this.show();
  });
  this.dialog.addEventListener('click',e=>{
   const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;
   if(b.dataset.musicTab){this.dialog.dataset.activeTab=b.dataset.musicTab;for(const tab of this.dialog.querySelectorAll<HTMLElement>('[data-music-tab]'))tab.setAttribute('aria-pressed',String(tab===b));return;}
   if(b.dataset.spotifyDevice){void this.chooseDevice(b.dataset.spotifyDevice);return;}
   if(b.dataset.spotify==='refresh-queue'){void this.loadQueue();return;}
   if(b.dataset.spotify==='allow-audio'){void this.speaker.activate().then(()=>this.command('play',{deviceId:this.speaker.deviceId})).catch(e=>this.report(e.message));return;}
   if(b.dataset.spotify==='close'){this.dialog.close();return;}
   if(b.dataset.spotify==='connect'){location.assign('/spotify-api/connect');return;}
   if(b.dataset.spotify==='disconnect'){if(confirm('Koppla bort Spotify-kontot från Hemstyrning?'))void this.disconnect();return;}
   if(b.dataset.spotify==='jam')void this.showQr();
   if(b.dataset.spotify==='remove-jam')void this.saveJam('');
   if(b.dataset.spotify==='save-jam'){void this.saveJam(this.dialog.querySelector<HTMLInputElement>('#jam-url')?.value.trim()??'');return;}
   if(['play','pause','next','previous'].includes(b.dataset.spotify??''))void this.command(b.dataset.spotify!);
   if(b.dataset.spotify==='devices')void this.loadDevices();
   if(b.dataset.spotify==='play_track'||b.dataset.spotify==='play_playlist'||b.dataset.spotify==='queue')void this.command(b.dataset.spotify,{uri:b.dataset.uri});
   if(b.dataset.spotify==='playlists')void this.loadPlaylists();
  });
  this.dialog.addEventListener('submit',e=>{
   const form=(e.target as HTMLElement).closest<HTMLFormElement>('form[data-spotify-search]');
   if(!form)return;e.preventDefault();
   const input=form.querySelector<HTMLInputElement>('input[name="q"]');
   if(input)void this.search(input.value);
  });
  this.dialog.addEventListener('change',e=>{
   const el=e.target as HTMLInputElement|HTMLSelectElement;
   if(el.id==='spotify-volume')void this.command('volume',{volume:Math.round(Number(el.value))});
  });
  this.dialog.addEventListener('close',()=>{this.open=false;this.qr='';this.onVisibilityChange(false);});
  this.timer=setInterval(()=>{if(!this.stopped&&!document.hidden){void this.refresh();if(this.open)void this.loadDevices();}},7000);
  void this.refresh();
  this.update();
 }
 mountPage(container:HTMLElement){this.embedded=true;this.open=true;this.root.hidden=true;this.dialog.classList.add('embedded-music');this.dialog.dataset.activeTab='search';container.append(this.dialog);this.dialog.setAttribute('open','');this.renderDialog();void this.loadQueue();}
 private async loadQueue(){if(!this.setup.connected)return;try{const data=await api<{queue:SpotifyItem[]}>('/queue');this.queue=Array.isArray(data.queue)?data.queue:[];this.renderDialog();}catch(e){this.report((e as Error).message);}}
 get summary(){return this.state.track?.name??(this.setup.connected?'Ingen låt spelas':'Spotify ej anslutet');}
 private get jamUrl(){return this.config.value?.music?.jamUrl??'';}
 update(){
  const p=this.state,t=p.track,src=cover(t?.cover??'');
  updateMarkup(this.root,`<button class="music-open" aria-label="Öppna Spotify"><span class="music-cover">${src?`<img src="${src}" alt="Albumomslag" referrerpolicy="no-referrer">`:'♪'}</span><span class="track-copy"><small>SPOTIFY · DIREKT</small><strong>${esc(this.summary)}</strong><span>${esc(t?.artist??this.setup.message)}</span><small>${esc(p.device?.name??'Ingen aktiv uppspelningsenhet')} · ${p.playing?'Spelar':'Pausad'}</small></span></button><div class="music-inline-controls">${this.controls()}</div><button class="jam-open" data-music="open">Musik och Jam ↗</button>`);
  if(this.open)this.renderDialog();
 }
 private controls(){
  const allow=this.setup.connected&&this.setup.canControl&&!this.busy;
  return [['previous','Föregående låt',icon('left')],[this.state.playing?'pause':'play',this.state.playing?'Pausa musik':'Spela musik',icon(this.state.playing?'pause':'play')],['next','Nästa låt',icon('right')]].map(([action,label,icon])=>`<button type="button" data-spotify="${action}" aria-label="${label}" ${allow?'':'disabled'}>${icon}</button>`).join('');
 }
 private refresh(afterCurrent=false):Promise<void>{
  if(this.stopped)return Promise.resolve();
  if(this.refreshInFlight)return afterCurrent?this.refreshInFlight.then(()=>this.refresh()):this.refreshInFlight;
  const task=this.readPlayback();this.refreshInFlight=task;return task.finally(()=>{if(this.refreshInFlight===task)this.refreshInFlight=undefined;});
 }
 private async readPlayback(){
  if(this.loading||this.stopped)return;this.loading=true;
  try{
   const wasConnected=this.setup.connected;const setup=await api<Setup>('/status');this.setup=setup;
   this.state=setup.connected?await api<Player>('/playback'):blank;
   const enable=setup.connected&&setup.canControl&&setup.webPlaybackAuthorized===true;if(enable){this.speakerEnabled=true;void this.speaker.enable();}else if(this.speakerEnabled){this.speakerEnabled=false;this.speaker.disable();}
   if(!setup.connected)this.devices=[];else if(this.open&&!wasConnected){void this.loadDevices();void this.loadPlaylists();}
   if(!this.commandError)this.feedback='';this.lastRefresh=Date.now();
  }catch(error){this.feedback=error instanceof Error?error.message:'Spotify går inte att nå.';}
  finally{this.loading=false;this.update();}
 }
 private async loadPlaylists(){
  if(!this.setup.connected)return;
  try{this.playlists=(await api<{playlists:SpotifyItem[]}>('/playlists')).playlists;if(this.open)this.renderDialog();}
  catch(e){this.report(e instanceof Error?e.message:String(e));}
 }
 private async search(query:string){
  this.searchTerm=query.trim();
  if(this.searchTerm.length<2){this.report('Skriv minst två tecken.');return;}
  try{this.results=(await api<{tracks:SpotifyItem[]}>('/search?q='+encodeURIComponent(this.searchTerm))).tracks;this.feedback='';this.renderDialog();}
  catch(e){this.report(e instanceof Error?e.message:String(e));}
 }
 private async loadDevices(){
  if(this.deviceLoading||!this.setup.connected)return;this.deviceLoading=true;
  try{this.devices=(await api<{devices:Device[]}>('/devices')).devices;this.update();}
  catch(e){this.report(e instanceof Error?e.message:String(e));}finally{this.deviceLoading=false;}
 }
 private async chooseDevice(id:string){
  if(this.busy||!this.setup.canControl)return;
  try{if(id===this.speaker.deviceId)await this.speaker.activate();await this.command('transfer',{deviceId:id,play:this.state.playing});}
  catch(error){this.report(error instanceof Error?error.message:String(error));}
 }
 private deviceList(allow:boolean){
  const sdkId=this.speaker.deviceId;
  const devices=this.devices.filter(d=>d.id!==this.speaker.lastDeviceId||d.id===sdkId);
  if(sdkId&&!devices.some(d=>d.id===sdkId))devices.push({id:sdkId,name:this.speaker.name,type:'Computer',is_active:this.state.device?.id===sdkId,is_restricted:false,supports_volume:true,volume_percent:this.state.device?.id===sdkId?this.state.device.volume_percent:null});
  return `<section class="spotify-connect"><h3>Spotify Connect-enheter</h3><ul aria-label="Spotify Connect-enheter">${devices.map(d=>{const active=this.state.device?.id===d.id;return `<li><button type="button" data-spotify-device="${esc(d.id)}" aria-pressed="${active}" ${allow&&!d.is_restricted?'':'disabled'}><span aria-hidden="true">${/computer/i.test(d.type)?'▣':/smartphone/i.test(d.type)?'▯':'◉'}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.type)}${d.id===sdkId?' · den här webbläsaren':''}${active?' · Aktiv':''}${d.is_restricted?' · Kan inte styras':''}</small></span><b aria-hidden="true">${active?'✓':'→'}</b></button></li>`;}).join('')}</ul>${!devices.length?'<p>Inga tillgängliga enheter rapporteras av Spotify.</p>':''}<p class="browser-speaker-status" role="status">${esc(this.speaker.message)}</p>${this.speaker.needsGesture?'<button type="button" data-spotify="allow-audio">Tillåt ljud</button>':''}${!this.setup.webPlaybackAuthorized&&this.setup.canControl?`<p>Godkänn webbläsaruppspelning för att lägga till den här fliken. Spotify Premium krävs.</p>${this.setup.canConfigure?'<button type="button" data-spotify="connect">Godkänn webbläsaruppspelning</button>':''}`:''}<button type="button" data-spotify="devices">Uppdatera enhetslista</button></section>`;
 }
 show(){
  this.open=true;this.onVisibilityChange(true);this.renderDialog();if(!this.dialog.open&&!this.embedded)this.dialog.showModal();
  void this.loadDevices();void this.loadPlaylists();void this.refresh();
 }
 private renderDialog(){
  const focusedDevice=(document.activeElement as HTMLElement)?.dataset.spotifyDevice;
  const settingsOpen=this.dialog.querySelector<HTMLDetailsElement>('.music-settings')?.open??false;
  const focusedId=(document.activeElement as HTMLElement)?.id;
  const {connected,playing,track,device,progressMs}=this.state;
  const art=cover(track?.cover??''),allow=this.setup.connected&&this.setup.canControl&&!this.busy;
  const duration=track?.durationMs??0;

  const preset=this.jamUrl;
  updateMarkup(this.dialog,`<header><div><small>MUSIK I HEMMET · SPOTIFY WEB API</small><h2>Spotify</h2></div>${this.embedded?'':'<button data-spotify="close" aria-label="Stäng musik">×</button>'}</header><nav class="music-tabs" aria-label="Musiksektioner">${[['search','Sök & spellistor'],['queue','Kö'],['devices','Enheter'],['jam','Jam']].map(([id,label])=>`<button data-music-tab="${id}" aria-pressed="${(this.dialog.dataset.activeTab??'search')===id}">${label}</button>`).join('')}</nav>
  ${this.feedback?`<p id="music-feedback" role="status">${esc(this.feedback)}</p>`:''}
  <div class="music-now">${art?`<img class="large-cover" src="${art}" alt="Albumomslag" referrerpolicy="no-referrer">`:'<div class="large-cover empty-cover">♪</div>'}
  <h3>${esc(track?.name??(connected?'Ingen aktiv låt':'Anslut Spotify'))}</h3>
  <p>${esc(track?.artist??'')}<br><small>${esc(track?.album??'')}</small></p>
  <span class="playback-state">${!connected?'Ej ansluten':playing?'Spelar':'Pausad'}</span>
  ${track?`<div class="music-progress"><progress max="${duration>0?duration:1}" value="${Math.min(duration,progressMs)}"></progress><span>${trackTime(progressMs/1000)} / ${trackTime(duration/1000)}</span><small>Senaste status från Spotify</small></div>`:''}
  <div class="music-buttons">${this.controls()}</div>
  ${this.busy?'<p role="status">Väntar på Spotify…</p>':''}</div>
  ${connected?`${this.deviceList(allow)}
  <label>Volym ${typeof device?.volume_percent==='number'?device.volume_percent+' %':''}<input id="spotify-volume" type="range" min="0" max="100" step="1" value="${typeof device?.volume_percent==='number'?device.volume_percent:50}" ${allow&&device?.volume_percent!=null?'':'disabled'}></label>`
  :`<p>${esc(this.setup.message)}</p>${this.setup.configured&&this.setup.canConfigure?'<button class="primary" data-spotify="connect">Anslut mitt Spotify-konto</button>':''}`}
  ${connected?`<section class="spotify-browser" aria-label="Spotify-musikbibliotek">
   <h3>Sök musik</h3>
   <form data-spotify-search><label>Sök efter låt eller artist
    <input name="q" type="search" minlength="2" maxlength="100" placeholder="Sök på Spotify" value="${esc(this.searchTerm)}"></label>
    <button type="submit">Sök</button></form>
   <div class="spotify-hits">${this.results.map(t=>`<article><div><b>${esc(t.name)}</b><small>${esc(t.artist??'')}</small></div><button data-spotify="play_track" data-uri="${esc(t.uri)}" ${allow?'':'disabled'}>Spela</button><button data-spotify="queue" data-uri="${esc(t.uri)}" ${allow?'':'disabled'}>Kö</button></article>`).join('')}</div>
   <h3>Dina spellistor <button data-spotify="playlists" class="spotify-refresh">Uppdatera</button></h3>
   <div class="spotify-hits">${this.playlists.map(p=>`<article><div><b>${esc(p.name)}</b><small>${esc(p.owner??'')}</small></div><button data-spotify="play_playlist" data-uri="${esc(p.uri)}" ${allow?'':'disabled'}>Spela</button></article>`).join('')||'<p>Inga spellistor hittades. Kontrollera att kontot har behörighet för spellistor.</p>'}</div>
   </section>`:''}
  <section class="spotify-queue"><h3>Uppspelningskö</h3><button data-spotify="refresh-queue">Uppdatera kö</button>${this.queue.map(t=>`<article><b>${esc(t.name)}</b><small>${esc(t.artist??'')}</small></article>`).join('')||'<p>Ingen kö hämtad.</p>'}</section><section class="jam-section"><h3>Spotify Jam</h3><p>Jam skapas i Spotify-appen. Klistra in dess delningslänk här för att visa en QR-kod. Hemstyrning kan inte skapa en Jam genom Spotify API.</p>
  ${preset?'<button data-spotify="jam" class="primary">Visa Jam QR-kod</button>':'<p>Ingen Jam-länk sparad.</p>'}
  ${this.qr?`<figure class="jam-qr"><img src="${this.qr}" alt="${esc(this.qrLabel)}"><figcaption>${esc(this.qrLabel)}</figcaption></figure>`:''}</section>
  <details class="music-settings"><summary>Inställningar och Jam-länk</summary>
  <p>Spotify använder nu en direkt serveranslutning, inte Home Assistants media_player. Kontot kopplas på servern.</p>
  ${this.setup.canConfigure?`<label>Jam-inbjudningslänk<input id="jam-url" type="url" placeholder="https://open.spotify.com/socialsession/…" value="${esc(preset)}"></label>
  <button data-spotify="save-jam">Spara Jam-länk</button><button data-spotify="remove-jam">Ta bort Jam-länk</button>
  ${connected?'<button data-spotify="connect">Förnya Spotify-inloggning</button><button data-spotify="disconnect">Koppla bort Spotify</button>':this.setup.configured?'<button data-spotify="connect">Anslut Spotify</button>':''}`
  :'<p>Kontoinställningar kan bara ändras av en administratör.</p>'}
  </details>`);
  const seed=[...(track?.album??track?.name??'Hemstyrning')].reduce((h,c)=>(h*31+c.charCodeAt(0))>>>0,0);this.dialog.style.setProperty('--album-hue',String(seed%360));
  const settings=this.dialog.querySelector<HTMLDetailsElement>('.music-settings');
  if(settings)settings.open=settingsOpen;
  if(focusedId==='jam-url')this.dialog.querySelector<HTMLInputElement>('#jam-url')?.focus({preventScroll:true});
  if(focusedDevice)this.dialog.querySelector<HTMLButtonElement>(`[data-spotify-device="${CSS.escape(focusedDevice)}"]`)?.focus({preventScroll:true});

 }
 private report(text:string){this.feedback=text;this.notify(text);if(this.open)this.renderDialog();}
 private async command(action:string,data:Record<string,unknown>={}){
  if(this.busy||!this.setup.canControl||!this.setup.connected)return;
  this.commandError=false;this.feedback='';this.busy=true;this.update();
  try{await api('/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});await this.refresh(true);if(action==='transfer'){
    const deadline=Date.now()+10000;
    while(this.state.device?.id!==data.deviceId&&Date.now()<deadline){await new Promise(r=>setTimeout(r,1000));await this.refresh(true);}
    if(this.state.device?.id!==data.deviceId)throw new Error('Spotify bekräftade inte enhetsbytet. Försök igen.');
    await this.loadDevices();
   }}
  catch(e){this.commandError=true;this.report(e instanceof Error?e.message:String(e));}
  finally{this.busy=false;this.update();}
 }
 private async disconnect(){try{await api('/disconnect',{method:'POST'});this.state=blank;this.speaker.disable();this.speakerEnabled=false;await this.refresh();}catch(e){this.report(e instanceof Error?e.message:String(e));}}
 private async saveJam(raw:string){
  try{
   let url='';if(raw){const response=await fetch('/workspace-api/music/jam/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:raw}),signal:AbortSignal.timeout(25000)});const json=await response.json();if(!response.ok)throw new Error(json.message);url=json.url;}
   const settings=this.config.value.music??{entities:[],activeEntity:'',jamUrl:'',jamSavedAt:''};
   settings.jamUrl=url;settings.jamSavedAt=url?new Date().toISOString():'';this.config.value.music=settings;
   this.config.changed();await this.config.save();this.qr='';this.report('Jam-länken sparades.');
  }catch(e){this.report(e instanceof Error?e.message:String(e));}
 }
 private async showQr(){
  const url=canonicalJamUrl(this.jamUrl);
  if(!url){this.report('Lägg först in en giltig Spotify Jam-länk.');return;}
  this.qr=await QRCode.toDataURL(url,{width:360,margin:4,errorCorrectionLevel:'M',color:{dark:'#071710',light:'#ffffff'}});
  this.qrLabel='Öppna Spotify Jam · aktuell session kan inte verifieras';this.renderDialog();
 }
 dispose(){this.stopped=true;this.speaker.disable();clearInterval(this.timer);this.onVisibilityChange=()=>{};this.dialog.close();this.dialog.remove();this.root.remove();}
}
