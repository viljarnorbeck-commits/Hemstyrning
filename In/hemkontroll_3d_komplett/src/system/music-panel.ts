import {libraryRows,type SpotifyItem,type CatalogResult,type BrowseResult} from './spotify-library';
import{connectDevices}from'./spotify-connect';
import {SpotifyDevicePicker,type ConnectDevice} from './spotify-device-picker';
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
type Device=ConnectDevice;
type Setup={configured:boolean;connected:boolean;canControl:boolean;canConfigure:boolean;webPlaybackAuthorized?:boolean;message:string};
async function api<T>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch('/spotify-api'+path,{...options,signal:AbortSignal.timeout(15000)});
 const body=await response.json().catch(()=>({})) as T&{message?:string};
 if(!response.ok)throw Object.assign(new Error(body.message||'Spotify svarade inte ('+response.status+').'),{spotifyError:(body as {spotifyError?:unknown}).spotifyError});
 return body;
}
function cover(url:string){try{const u=new URL(url);return u.protocol==='https:'&&['i.scdn.co','mosaic.scdn.co'].includes(u.hostname)?esc(u.href):'';}catch{return '';}}
const blank:Player={connected:false,playing:false,track:null,progressMs:0,device:null};
export class MusicPanel{
 readonly root=document.createElement('aside');
 private compact=document.createElement('section');private compactMode=false;
 private picker=new SpotifyDevicePicker(id=>this.chooseDevice(id),()=>this.loadDevices(true));
 private progressTimer:ReturnType<typeof setInterval>;private deviceError='';
 readonly dialog=document.createElement('dialog');private embedded=false;private queue:SpotifyItem[]=[];
 private state:Player=blank;private setup:Setup={configured:false,connected:false,canControl:false,canConfigure:false,message:'Ansluter till Spotify…'};
 private chosenDeviceId:string|null=null;private devices:Device[]=[];private busy=false;private commandError=false;private feedback='';private open=false;private qr='';private qrLabel='';private timer:ReturnType<typeof setInterval>;
 private speaker=new BrowserSpeaker();private speakerEnabled=false;private readyDevice='';private deviceLoading=false;private sdkRefreshAt=0;
 private refreshInFlight?:Promise<void>;private loading=false;private stopped=false;private lastRefresh=0;
 private searchTerm='';private catalog:CatalogResult={tracks:[],artists:[],albums:[],playlists:[]};private searchKind='all';private playlists:SpotifyItem[]=[];private playlistsNext:number|null=null;private playlistsLoading=false;private browse:BrowseResult|null=null;private browseUri='';private browseTab='search';private browsing=false;private browseError='';private browseSerial=0;
 private searching=false;private searched=false;private searchError='';private playlistError='';private queueError='';private searchSerial=0;
 onVisibilityChange:(open:boolean)=>void=()=>{};
 constructor(_connection:Connection,private config:Configuration,private notify:(message:string)=>void){
  this.speaker.addEventListener('change',()=>{if(this.stopped)return;if(this.speaker.deviceId&&this.readyDevice!==this.speaker.deviceId){this.readyDevice=this.speaker.deviceId;if(this.open)void this.loadDevices();}this.update();});
  this.speaker.addEventListener('playback',()=>{if(!this.stopped&&Date.now()-this.sdkRefreshAt>5000){this.sdkRefreshAt=Date.now();void this.refresh();}});
  this.root.className='music-widget glass';this.root.setAttribute('aria-label','Spotify – direktanslutning');
  this.dialog.className='music-panel spotify-direct';this.dialog.id='spotify-player';
  this.root.hidden=true;this.dialog.hidden=true;document.body.append(this.dialog);
  this.root.addEventListener('click',e=>{
   const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');
   if(!b)return;
   if(b.dataset.spotify)void this.command(b.dataset.spotify);
   else this.show();
  });
  this.compact.className='spotify-compact';this.compact.setAttribute('aria-label','Spotify-spelare');
  this.compact.addEventListener('click',e=>{e.stopPropagation();const trigger=(e.target as Element).closest<HTMLButtonElement>('[data-compact-devices]');if(trigger){e.preventDefault();this.picker.toggle(trigger);return;}const b=(e.target as Element).closest<HTMLElement>('[data-spotify]');if(b&&!b.matches(':disabled'))void this.command(b.dataset.spotify!);});
  this.compact.addEventListener('keydown',e=>{const trigger=(e.target as Element).closest<HTMLButtonElement>('[data-compact-devices]');if(trigger&&['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(!this.picker.isOpen)this.picker.show(trigger,e.key==='ArrowUp');}});
  this.compact.addEventListener('change',e=>{const input=e.target as HTMLInputElement;if(input.hasAttribute('data-compact-seek')){void this.command('seek',{positionMs:Math.round(Number(input.value))});return;}if(input.hasAttribute('data-compact-volume'))void this.command('volume',{volume:Math.round(Number(input.value))});});
  this.dialog.addEventListener('click',e=>{
   const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b)return;
   if(b.hasAttribute('data-compact-devices')){e.preventDefault();this.picker.toggle(b);return;}
   if(b.dataset.browse){void this.loadBrowse(b.dataset.browse);return;}if(b.hasAttribute('data-browse-back')){this.browse=null;this.browseUri='';this.browseError='';++this.browseSerial;this.renderDialog();return;}if(b.hasAttribute('data-browse-more')){void this.loadBrowse(this.browseUri,true);return;}if(b.dataset.searchKind){this.searchKind=b.dataset.searchKind;this.browse=null;this.browseUri='';this.browsing=false;++this.browseSerial;this.renderDialog();return;}if(b.dataset.musicTab){this.dialog.dataset.activeTab=b.dataset.musicTab;this.renderDialog();if(b.dataset.musicTab==='playlists')void this.loadPlaylists();if(b.dataset.musicTab==='queue')void this.loadQueue();if(b.dataset.musicTab==='devices')void this.loadDevices(true);return;}
   if(b.dataset.spotify==='refresh'){void this.refresh();void this.loadDevices(true);return;}
   if(b.dataset.spotify==='browser-retry'){void this.speaker.reconnect();return;}
   if(b.dataset.spotifyDevice){void this.chooseDevice(b.dataset.spotifyDevice);return;}
   if(b.dataset.spotify==='refresh-queue'){void this.loadQueue();return;}
   if(b.dataset.spotify==='allow-audio'){void this.speaker.activate().then(()=>this.report('Ljud är tillåtet i den här webbläsaren. Välj en låt för att spela.')).catch(e=>this.report((e as Error).message));return;}
   if(b.dataset.spotify==='close'){this.dialog.close();return;}
   if(b.dataset.spotify==='connect'){location.assign('/spotify-api/connect');return;}
   if(b.dataset.spotify==='disconnect'){if(confirm('Koppla bort Spotify-kontot från Hemstyrning?'))void this.disconnect();return;}
   if(b.dataset.spotify==='jam')void this.showQr();
   if(b.dataset.spotify==='remove-jam')void this.saveJam('');
   if(b.dataset.spotify==='save-jam'){void this.saveJam(this.dialog.querySelector<HTMLInputElement>('#jam-url')?.value.trim()??'');return;}
   if(['play','pause','next','previous'].includes(b.dataset.spotify??''))void this.command(b.dataset.spotify!);
   if(b.dataset.spotify==='devices')void this.loadDevices(true);
   if(['play_track','play_playlist','play_context','queue'].includes(b.dataset.spotify??''))void this.command(b.dataset.spotify!,{uri:b.dataset.uri,...(b.dataset.context?{contextUri:b.dataset.context}:{}),...(b.dataset.position!==undefined?{position:Number(b.dataset.position)}:{})});
   if(b.dataset.spotify==='playlists')void this.loadPlaylists();if(b.hasAttribute('data-playlists-more'))void this.loadPlaylists(true);
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
   if(el.hasAttribute('data-music-seek'))void this.command('seek',{positionMs:Math.round(Number(el.value))});
  });
  this.dialog.addEventListener('input',e=>{const el=e.target as HTMLInputElement;if(el.name==='q')this.searchTerm=el.value;});
  this.dialog.addEventListener('keydown',e=>{const target=(e.target as Element).closest('[data-music-tab]');if(!target||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...this.dialog.querySelectorAll<HTMLButtonElement>('[data-music-tab]')],at=tabs.indexOf(target as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(at+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next]?.click();tabs[next]?.focus({preventScroll:true});});
  this.dialog.addEventListener('close',()=>{this.open=false;this.qr='';this.onVisibilityChange(false);});
  this.timer=setInterval(()=>{if(!this.stopped&&!document.hidden){void this.refresh();if(this.open||this.picker.isOpen)void this.loadDevices();}},7000);
  this.progressTimer=setInterval(()=>{if(!document.hidden&&this.state.playing){if(this.compactMode)this.renderCompact();if(this.open)this.updateTimeline();}},1000);
  void this.refresh();
  this.update();
 }

 setNotify(notify:(text:string)=>void,config?:Configuration){this.notify=notify;if(config)this.config=config;}
 suspendView(){this.picker.close(false);this.compactMode=false;this.compact.remove();this.root.hidden=true;this.open=false;this.embedded=false;this.dialog.removeAttribute("open");this.dialog.hidden=true;document.body.append(this.dialog);}
 mountPage(container:HTMLElement){this.picker.close(false);this.compactMode=false;this.compact.remove();this.dialog.hidden=false;this.dialog.classList.remove('compact-player');this.embedded=true;this.open=true;this.root.hidden=true;this.dialog.classList.add('embedded-music');const requestedTab=new URLSearchParams(location.search).get('tab')??'search';this.dialog.dataset.activeTab=['search','playlists','queue','devices','jam'].includes(requestedTab)?requestedTab:'search';container.append(this.dialog);this.dialog.setAttribute('open','');this.renderDialog();void this.loadDevices();void this.loadPlaylists();void this.loadQueue();}
 mountCompact(container:HTMLElement){this.picker.close(false);this.compactMode=true;this.embedded=false;this.open=false;this.root.hidden=true;this.dialog.removeAttribute('open');this.dialog.hidden=true;container.append(this.compact);this.renderCompact();}
 private renderCompact(){
  const p=this.state,output=this.chosenOutput()??this.activeOutput(),t=p.track,src=cover(t?.cover??''),allow=this.setup.connected&&this.setup.canControl&&!this.busy;
  const position=Math.min(t?.durationMs??0,p.progressMs+(p.playing&&this.lastRefresh?Math.min(15000,Math.max(0,Date.now()-this.lastRefresh)):0));
  updateMarkup(this.compact,`<div class="compact-playing" data-dom-key="compact-playing"><div class="compact-art">${src?'<img src="'+src+'" alt="Albumomslag" referrerpolicy="no-referrer">':'<span aria-hidden="true">♪</span>'}</div><div class="compact-track"><h3 title="${esc(this.summary)}">${esc(this.summary)}</h3><p title="${esc(t?.artist??'')}">${esc(t?.artist??this.setup.message)}</p></div></div><div class="compact-playback" data-dom-key="compact-playback"><div class="compact-transport">${this.controls()}</div><div class="compact-timeline"><input class="compact-seek" data-compact-seek type="range" aria-label="Position i låten" min="0" max="${Math.max(1,t?.durationMs??1)}" step="1000" value="${position}" ${!allow||!t?'disabled':''}><div class="compact-times"><span>${trackTime(position/1000)}</span><span>${trackTime((t?.durationMs??0)/1000)}</span></div></div></div><div class="compact-output" data-dom-key="compact-output"><button type="button" class="compact-device-button" data-compact-devices aria-label="Välj uppspelningsenhet" aria-haspopup="menu" aria-expanded="${this.picker.isOpen}" aria-controls="${this.picker.id}"><span aria-hidden="true">◉</span><strong>${esc(output?.name??'Välj enhet')}</strong><span aria-hidden="true">⌄</span></button><label class="compact-volume">${icon('volume')}<input type="range" aria-label="Spotify-volym" data-compact-volume min="0" max="100" value="${output?.volume_percent??0}" ${!allow||p.device?.volume_percent==null?'disabled':''}></label></div><p class="compact-feedback" role="status" data-dom-key="compact-feedback">${esc(this.feedback||(!this.setup.connected?this.setup.message:!this.setup.canControl?'Spotify är anslutet utan styrbehörighet.':!this.speaker.deviceId?this.speaker.message:''))}</p>`);
  // The picker lives outside this reconciled subtree and keeps its focused row across status updates.
  this.picker.update(this.connectDevices(),this.activeOutput()?.id??null,allow,this.deviceLoading,this.deviceError||(!this.setup.connected?this.setup.message:!this.speaker.deviceId?this.speaker.message:''),this.chosenOutput()?.id??null);
 }
 private async loadQueue(){if(!this.setup.connected)return;this.queueError='';try{const data=await api<{queue:SpotifyItem[]}>('/queue');this.queue=Array.isArray(data.queue)?data.queue:[];}catch(e){this.queueError=(e as Error).message;}if(this.open)this.renderDialog();}
 get summary(){return this.state.track?.name??(this.setup.connected?'Ingen låt spelas':'Spotify ej anslutet');}
 private get jamUrl(){return this.config.value?.music?.jamUrl??'';}
 update(){
  const p=this.state,t=p.track,src=cover(t?.cover??'');
  updateMarkup(this.root,`<button class="music-open" aria-label="Öppna Spotify"><span class="music-cover">${src?`<img src="${src}" alt="Albumomslag" referrerpolicy="no-referrer">`:'♪'}</span><span class="track-copy"><small>SPOTIFY · DIREKT</small><strong>${esc(this.summary)}</strong><span>${esc(t?.artist??this.setup.message)}</span><small>${esc(p.device?.name??'Ingen aktiv uppspelningsenhet')} · ${p.playing?'Spelar':'Pausad'}</small></span></button><div class="music-inline-controls">${this.controls()}</div><button class="jam-open" data-music="open">Musik och Jam ↗</button>`);
  if(this.compactMode)this.renderCompact();
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
   if(!setup.connected){this.devices=[];this.chosenDeviceId=null;}else if(this.open&&!wasConnected){void this.loadDevices();void this.loadPlaylists();}
   if(!this.commandError)this.feedback='';this.lastRefresh=Date.now();
  }catch(error){this.feedback=error instanceof Error?error.message:'Spotify går inte att nå.';}
  finally{this.loading=false;this.update();}
 }
 private async loadPlaylists(more=false){
  if(!this.setup.connected||this.playlistsLoading||more&&this.playlistsNext===null)return;
  this.playlistsLoading=true;this.playlistError='';
  try{const data=await api<{playlists:SpotifyItem[];nextOffset:number|null}>('/playlists?offset='+(more?this.playlistsNext??0:0));this.playlists=more?[...new Map([...this.playlists,...data.playlists].map(item=>[item.uri,item])).values()]:data.playlists;this.playlistsNext=data.nextOffset??null;}
  catch(e){this.playlistError=e instanceof Error?e.message:String(e);}finally{this.playlistsLoading=false;if(this.open)this.renderDialog();}
 }
 private async loadBrowse(uri:string,more=false){
  const match=/^spotify:(artist|album|playlist):([a-zA-Z0-9]{1,100})$/.exec(uri);if(!match)return;
  const serial=++this.browseSerial,previous=more&&this.browseUri===uri?this.browse:null;
  this.browseUri=uri;this.browseTab=this.dialog.dataset.activeTab==='playlists'?'playlists':'search';this.browsing=true;this.browseError='';if(!more)this.browse=null;this.renderDialog();
  try{const page=await api<BrowseResult>('/browse/'+match[1]+'/'+match[2]+'?offset='+(previous?.nextOffset??0));if(serial!==this.browseSerial)return;this.browse={...page,items:previous?[...previous.items,...page.items]:page.items};}
  catch(e){if(serial===this.browseSerial)this.browseError=(e as Error).message;}
  finally{if(serial===this.browseSerial){this.browsing=false;if(this.open)this.renderDialog();}}
 }
 private browseMarkup(allow:boolean){
  const page=this.browse,item=page?.item;
  return `<div class="music-collection" aria-busy="${this.browsing}"><button type="button" data-browse-back>← Tillbaka</button><div class="music-section-heading"><div><h3>${esc(item?.name??'Musikinnehåll')}</h3><p>${item?.kind==='artist'?'Artistens album och singlar':page?.total!==null&&page?.total!==undefined?page.total+' låtar':''}</p></div><button type="button" data-spotify="play_context" data-uri="${esc(this.browseUri)}" ${allow?'':'disabled'}>${icon('play')} Spela</button></div>${this.browseError?`<p role="status">${esc(this.browseError)}</p>`:''}<div class="spotify-hits">${libraryRows(page?.items??[],allow)}</div>${this.browsing?'<p role="status">Hämtar innehåll…</p>':page&&!page.items.length&&!this.browseError?'<p>Inget tillgängligt innehåll returnerades av Spotify.</p>':''}${page?.nextOffset!=null?`<button type="button" data-browse-more ${this.browsing?'disabled':''}>Visa fler</button>`:''}</div>`;
 }
 private async search(query:string){
  this.searchTerm=query.trim();
  if(this.searchTerm.length<2){this.report('Skriv minst två tecken.');return;}
  ++this.browseSerial;this.browseUri='';this.browse=null;this.browsing=false;
  const serial=++this.searchSerial;this.searching=true;this.searchError='';this.renderDialog();
  try{const data=await api<CatalogResult>('/search?q='+encodeURIComponent(this.searchTerm));if(serial===this.searchSerial){this.catalog={tracks:data.tracks??[],artists:data.artists??[],albums:data.albums??[],playlists:data.playlists??[]};this.searched=true;this.browse=null;this.browseUri='';}}
  catch(e){if(serial===this.searchSerial)this.searchError=e instanceof Error?e.message:String(e);}
  finally{if(serial===this.searchSerial){this.searching=false;if(this.open)this.renderDialog();}}
 }
 private async loadDevices(fresh=false){
  if(this.deviceLoading||!this.setup.connected)return;this.deviceLoading=true;this.deviceError='';this.update();
  try{this.devices=(await api<{devices:Device[]}>('/devices'+(fresh?'?refresh=1':''))).devices;this.update();}
  catch(e){this.deviceError=e instanceof Error?e.message:String(e);this.report(this.deviceError);}finally{this.deviceLoading=false;this.update();}
 }
 private async chooseDevice(id:string){
  if(this.busy||!this.setup.canControl)return;
  if(!this.connectDevices().some(d=>d.id===id&&!d.is_restricted)){this.report('Enheten är inte längre tillgänglig. Uppdatera enhetslistan.');return;}this.chosenDeviceId=id;
  try{if(id===this.speaker.deviceId)await this.speaker.activate();if(!this.state.track&&!this.state.playing){this.commandError=false;this.report('Enheten är vald. Välj en låt eller spellista för att starta uppspelningen här.');this.update();return;}await this.command('transfer',{deviceId:id,play:this.state.playing});}
  catch(error){this.report(error instanceof Error?error.message:String(error));}
 }
 private connectDevices(){return connectDevices(this.devices,this.speaker.deviceId,this.speaker.name,this.speaker.retiredDeviceIds);}
 private chosenOutput(){return this.connectDevices().find(d=>d.id===this.chosenDeviceId)??null;}
 private activeOutput(){const device=this.state.device;if(device?.id&&!this.speaker.retiredDeviceIds.has(device.id))return device;const d=this.connectDevices().find(d=>d.is_active);return d?{id:d.id,name:d.name,volume_percent:d.volume_percent}:null;}
 private deviceList(allow:boolean){
  const sdkId=this.speaker.deviceId,devices=this.connectDevices();
  return `<section class="spotify-connect" data-dom-key="spotify-connect"><h3>Spotify Connect-enheter</h3><ul aria-label="Spotify Connect-enheter">${devices.map(d=>{const active=this.activeOutput()?.id===d.id;return `<li><button type="button" data-spotify-device="${esc(d.id)}" aria-pressed="${active}" ${allow&&!d.is_restricted?'':'disabled'}><span aria-hidden="true">${/computer/i.test(d.type)?'▣':/smartphone/i.test(d.type)?'▯':'◉'}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.type)}${d.id===sdkId?' · den här webbläsaren':''}${active?' · Aktiv':d.id===this.chosenDeviceId?' · Vald för nästa låt':''}${d.is_restricted?' · Kan inte styras':''}</small></span><b aria-hidden="true">${active?'✓':'→'}</b></button></li>`;}).join('')}</ul>${!devices.length?'<p>Inga tillgängliga enheter rapporteras av Spotify.</p>':''}<p class="browser-speaker-status" role="status">${esc(this.speaker.message)}</p>${this.speaker.needsGesture?'<button type="button" data-spotify="allow-audio">Tillåt ljud</button>':''}${!this.setup.webPlaybackAuthorized&&this.setup.canControl?`<p>Godkänn webbläsaruppspelning för att lägga till den här fliken. Spotify Premium krävs.</p>${this.setup.canConfigure?'<button type="button" data-spotify="connect">Godkänn webbläsaruppspelning</button>':''}`:''}<button type="button" data-spotify="devices">Uppdatera enhetslista</button></section>`;
 }
 show(){
  if(!['/control','/music'].includes(location.pathname))return;
  this.open=true;this.onVisibilityChange(true);this.renderDialog();if(!this.dialog.open&&!this.embedded)this.dialog.showModal();
  void this.loadDevices();void this.loadPlaylists();void this.refresh();
 }
 private position(){const t=this.state.track;return Math.min(t?.durationMs??0,this.state.progressMs+(this.state.playing&&this.lastRefresh?Math.min(15000,Math.max(0,Date.now()-this.lastRefresh)):0));}
 private updateTimeline(){const position=this.position(),input=this.dialog.querySelector<HTMLInputElement>('[data-music-seek]');if(input&&document.activeElement!==input)input.value=String(position);const label=this.dialog.querySelector('[data-music-elapsed]');if(label)label.textContent=trackTime(position/1000);}
 private renderDialog(){
  const settingsOpen=this.dialog.querySelector<HTMLDetailsElement>('.music-settings')?.open??false;
  const connected=this.setup.connected,{playing,track}=this.state,output=this.chosenOutput()??this.activeOutput();
  const art=cover(track?.cover??''),allow=connected&&this.setup.canControl&&!this.busy,tab=this.dialog.dataset.activeTab??'search';
  const duration=track?.durationMs??0,position=this.position(),preset=this.jamUrl;
  const panel=(id:string)=>`id="music-section-${id}" role="tabpanel" aria-labelledby="music-tab-${id}" ${tab===id?'':'hidden'}`;
  const rows=(items:SpotifyItem[])=>libraryRows(items,allow);
  updateMarkup(this.dialog,`<header data-dom-key="music-header"><div><small>DIN MUSIK</small><h2>Spotify</h2></div><div class="music-account"><span class="music-connection ${connected?'is-connected':''}">${connected?'Ansluten':esc(this.setup.message)}</span><button type="button" data-spotify="refresh" aria-label="Uppdatera Spotify">↻</button>${this.embedded?'':'<button type="button" data-spotify="close" aria-label="Stäng musik">×</button>'}</div></header>
  <section class="music-now" data-dom-key="music-now" aria-label="Aktuell uppspelning"><div class="music-artwork">${art?`<img class="large-cover" src="${art}" alt="Albumomslag" referrerpolicy="no-referrer">`:'<div class="large-cover empty-cover" aria-hidden="true">♪</div>'}</div><div class="music-player-copy"><span class="music-eyebrow">${playing?'SPELAR NU':track?'PAUSAD':'REDO FÖR MUSIK'}</span><h3>${esc(track?.name??(connected?'Vad vill du lyssna på?':'Din musik, hemma.'))}</h3><p class="music-artist">${esc(track?.artist??(connected?'Sök efter en låt eller välj en spellista nedan.':this.setup.message))}</p>${track?.album?`<p class="music-album">${esc(track.album)}</p>`:''}<div class="music-buttons compact-transport" data-dom-key="music-buttons">${this.controls()}</div><div class="music-progress" data-dom-key="music-progress"><input data-music-seek type="range" aria-label="Position i låten" min="0" max="${Math.max(1,duration)}" step="1000" value="${position}" ${allow&&track?'':'disabled'}><div class="music-times"><span data-music-elapsed>${trackTime(position/1000)}</span><span>${trackTime(duration/1000)}</span></div></div><div class="music-player-output"><button type="button" class="compact-device-button" data-compact-devices aria-label="Välj uppspelningsenhet" aria-haspopup="menu" aria-controls="${this.picker.id}" aria-expanded="${this.picker.isOpen}"><span aria-hidden="true">◉</span><strong>${esc(output?.name??'Välj uppspelningsenhet')}</strong><span aria-hidden="true">⌄</span></button><label class="music-volume" for="spotify-volume">${icon('volume')}<span class="music-sr-only">Volym</span><input id="spotify-volume" type="range" aria-label="Spotify-volym" min="0" max="100" value="${output?.volume_percent??0}" ${allow&&output?.volume_percent!=null?'':'disabled'}></label></div>${!connected&&this.setup.configured&&this.setup.canConfigure?'<button type="button" data-spotify="connect">Anslut Spotify</button>':''}</div></section>
  <p id="music-feedback" class="music-feedback" role="status" data-dom-key="music-feedback">${esc(this.feedback||(!connected?this.setup.message:!this.setup.canControl?'Kontot är anslutet utan styrbehörighet.':''))}</p>
  <div class="music-library" data-dom-key="music-library"><nav class="music-tabs" role="tablist" aria-label="Musiksektioner">${[['search','Sök'],['playlists','Spellistor'],['queue','Kö'],['devices','Enheter'],['jam','Jam']].map(([id,label])=>`<button type="button" role="tab" id="music-tab-${id}" data-music-tab="${id}" aria-controls="music-section-${id}" aria-selected="${tab===id}" aria-pressed="${tab===id}">${label}</button>`).join('')}</nav>
  <section class="spotify-browser" data-dom-key="spotify-browser" ${panel('search')} aria-label="Sök i Spotify"><form data-spotify-search><label for="spotify-query" class="music-sr-only">Sök låtar, artister, album och spellistor</label><input id="spotify-query" name="q" type="search" minlength="2" maxlength="100" placeholder="Sök låt, artist, album eller spellista" value="${esc(this.searchTerm)}" ${connected?'':'disabled'}><button type="submit" ${connected&&!this.searching?'':'disabled'}>${this.searching?'Söker…':'Sök musik'}</button></form><div class="music-search-filters" role="group" aria-label="Typ av sökresultat">${[['all','Alla'],['tracks','Låtar'],['artists','Artister'],['albums','Album'],['playlists','Spellistor']].map(([id,name])=>`<button type="button" data-search-kind="${id}" aria-pressed="${this.searchKind===id}">${name}</button>`).join('')}</div>${this.searchError?`<p role="status">${esc(this.searchError)}</p>`:''}${this.browseUri&&this.browseTab==='search'?this.browseMarkup(allow):`<div class="music-search-results" aria-busy="${this.searching}">${([['artists','Artister'],['tracks','Låtar'],['albums','Album'],['playlists','Spellistor']]as const).filter(([key])=>this.searchKind==='all'||this.searchKind===key).map(([key,name])=>this.catalog[key].length?`<section class="music-result-group"><h3>${name}</h3><div class="spotify-hits">${rows(this.catalog[key])}</div></section>`:'').join('')}${this.searched&&!this.searching&&!Object.values(this.catalog).some(items=>items.length)&&!this.searchError?'<p>Inga träffar. Prova ett annat sökord.</p>':''}</div>`}</section>
  <section class="spotify-browser" data-dom-key="spotify-playlists" ${panel('playlists')} aria-label="Dina spellistor"><div class="music-section-heading"><h3>Dina spellistor</h3><button type="button" data-spotify="playlists" ${connected?'':'disabled'}>Uppdatera</button></div>${this.playlistError?`<p role="status">${esc(this.playlistError)}</p>`:''}${this.browseUri&&this.browseTab==='playlists'?this.browseMarkup(allow):`<div class="spotify-hits music-playlists">${rows(this.playlists)||`<p>${connected?'Dina spellistor visas här när de har hämtats.':'Anslut Spotify för att se dina spellistor.'}</p>`}</div>${this.playlistsNext!==null?`<button type="button" data-playlists-more ${this.playlistsLoading?'disabled':''}>Visa fler spellistor</button>`:''}`}</section>
  <section class="spotify-queue" data-dom-key="spotify-queue" ${panel('queue')}><div class="music-section-heading"><div><h3>Nästa i kön</h3><p>Musiken som väntar på den aktiva enheten. Uppspelningen fortsätter i valt album eller spellista.</p><p class="music-autoplay-note">Vill du fortsätta med liknande musik efter sista låten? Aktivera Automatisk uppspelning i Spotify. <a class="settings-link" href="https://support.spotify.com/se/article/autoplay/" target="_blank" rel="noopener noreferrer">Visa hur ↗</a></p></div><button type="button" data-spotify="refresh-queue" ${connected?'':'disabled'}>Uppdatera kö</button></div>${this.queueError?`<p role="status">${esc(this.queueError)}</p>`:this.queue.map((t,i)=>`<article data-dom-key="queue-${i}"><span class="music-queue-number">${i+1}</span><div><b>${esc(t.name)}</b><small>${esc(t.artist??'')}</small></div></article>`).join('')||'<p>Kön är tom eller ingen uppspelning är aktiv. Välj en låt för att börja.</p>'}</section>
  <section class="music-devices" data-dom-key="music-devices" ${panel('devices')}>${this.deviceList(allow)}${this.deviceError?`<p role="status">${esc(this.deviceError)}</p>`:''}${connected&&this.setup.webPlaybackAuthorized&&!this.speaker.deviceId?'<button type="button" data-spotify="browser-retry">Återanslut den här webbläsaren</button>':''}</section>
  <section class="jam-section" data-dom-key="jam-section" ${panel('jam')}><h3>Lyssna tillsammans</h3><p>Starta en Jam i Spotify och dela inbjudan här.</p>${preset?'<button type="button" data-spotify="jam">Visa Jam QR-kod</button>':'<p>Ingen Jam-inbjudan sparad ännu.</p>'}${this.qr?`<figure class="jam-qr"><img src="${this.qr}" alt="${esc(this.qrLabel)}"><figcaption>${esc(this.qrLabel)}</figcaption></figure>`:''}<details class="music-settings" data-dom-key="music-settings"><summary>Jam-länk och konto</summary>${this.setup.canConfigure?`<label for="jam-url">Jam-inbjudningslänk</label><input id="jam-url" type="url" placeholder="https://open.spotify.com/socialsession/…" value="${esc(preset)}"><div class="music-settings-actions"><button type="button" data-spotify="save-jam">Spara länk</button><button type="button" data-spotify="remove-jam" ${preset?'':'disabled'}>Ta bort länk</button>${this.setup.configured?'<button type="button" data-spotify="connect">Förnya inloggning</button>':''}${connected?'<button type="button" data-spotify="disconnect">Koppla bort konto</button>':''}</div>`:'<p>En administratör kan ändra konto och Jam-länk.</p>'}</details></section></div>`);
  const settings=this.dialog.querySelector<HTMLDetailsElement>('.music-settings');if(settings)settings.open=settingsOpen;
  this.picker.update(this.connectDevices(),this.activeOutput()?.id??null,allow,this.deviceLoading,this.deviceError||(!connected?this.setup.message:!this.speaker.deviceId?this.speaker.message:''),this.chosenOutput()?.id??null);
 }

 private report(text:string){this.feedback=text;if(this.compactMode)this.renderCompact();this.notify(text);if(this.open)this.renderDialog();}
 private async command(action:string,data:Record<string,unknown>={}){
  if(this.busy||!this.setup.canControl||!this.setup.connected)return;
  const content=['play_track','play_playlist','play_context'].includes(action),active=this.activeOutput();
  const target=typeof data.deviceId==='string'?data.deviceId:this.chosenOutput()?.id??active?.id??(content||action==='play'?this.speaker.deviceId:'');
  if(action!=='transfer'&&!target){this.commandError=true;this.report('Välj en tillgänglig Spotify Connect-enhet först. Den här webbläsaren visas när Spotify SDK är redo.');return;}
  if(action==='play'&&!this.state.track&&!active){this.commandError=true;if(this.open)this.dialog.dataset.activeTab='search';this.report('Välj en låt eller spellista nedan för att börja spela.');this.dialog.querySelector<HTMLInputElement>('#spotify-query')?.focus({preventScroll:true});return;}
  this.commandError=false;this.feedback='';this.busy=true;this.update();
  try{
   // Invoke within the original click gesture, before awaiting any network request.
   if((action==='play'||content)&&target===this.speaker.deviceId)await this.speaker.activate();
   await api('/command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data,...(target?{deviceId:target}:{})})});
   await this.refresh(true);
   if(action==='transfer'){
    await this.loadDevices(true);const confirmed=()=>this.state.device?.id===target||this.devices.some(d=>d.id===target&&d.is_active);
    const deadline=Date.now()+10000;
    while(!confirmed()&&Date.now()<deadline){await new Promise(r=>setTimeout(r,1500));await this.refresh(true);await this.loadDevices(true);}
    if(!confirmed())throw new Error('Spotify bekräftade inte enhetsbytet. Enheten är vald som mål, men är ännu inte aktiv.');
   }
  }catch(e){
   const details=(e as {spotifyError?:{upstreamStatus?:number}})?.spotifyError;
   if(details?.upstreamStatus===404){await this.loadDevices(true);await this.refresh(true);if(this.chosenDeviceId&&!this.chosenOutput())this.chosenDeviceId=null;}
   this.commandError=true;this.report(e instanceof Error?e.message:String(e));
  }finally{this.busy=false;this.update();}
 }

 private async disconnect(){try{await api('/disconnect',{method:'POST'});this.state=blank;this.chosenDeviceId=null;this.speaker.disable();this.speakerEnabled=false;await this.refresh();}catch(e){this.report(e instanceof Error?e.message:String(e));}}
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
 dispose(){this.picker.dispose();clearInterval(this.progressTimer);this.compact.remove();this.stopped=true;this.speaker.disable();clearInterval(this.timer);this.onVisibilityChange=()=>{};this.dialog.close();this.dialog.remove();this.root.remove();}
}
