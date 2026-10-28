import QRCode from 'qrcode';
import {canonicalJamUrl} from '../../../../shared/ha-contract.js';
import {escapeHtml as esc} from './panels';
import {mediaSupports,available,mediaPosition,trackTime,artwork} from './music-data';
import type {Connection} from './connection';
import type {Configuration} from './configuration';
import type {MusicConfig} from './types';

export class MusicPanel{
 readonly root=document.createElement('aside');
 private dialog=document.createElement('dialog');private busy=false;private qr='';private qrLabel='';private open=false;private feedback='';
 onVisibilityChange:(open:boolean)=>void=()=>{};
 constructor(private connection:Connection,private config:Configuration,private notify:(text:string)=>void){
  this.root.className='music-widget glass';this.root.setAttribute('aria-label','Spotify');this.dialog.className='music-panel';
  document.body.append(this.root,this.dialog);
  this.root.addEventListener('click',e=>{const button=(e.target as HTMLElement).closest<HTMLElement>('button');if(!button)return;if(button.dataset.media)void this.command(button.dataset.media);else this.show();});
  this.dialog.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('button');if(!b)return;
   if(b.dataset.music==='close'){this.dialog.close();return;}
   if(b.dataset.media)void this.command(b.dataset.media);
   if(b.dataset.music==='jam')void this.showQr();
   if(b.dataset.music==='demo')void this.showQr(true);
   if(b.dataset.music==='save')void this.saveSettings();
   if(b.dataset.music==='remove'){this.settings.jamUrl='';this.settings.jamSavedAt='';this.qr='';this.config.changed();this.renderDialog();}
  });
  this.dialog.addEventListener('change',e=>{const el=e.target as HTMLInputElement|HTMLSelectElement;if(el.id==='music-source')void this.command('select_source',{source:el.value});if(el.id==='music-volume')void this.command('volume_set',{volume_level:Number(el.value)/100});if(el.id==='music-account'){this.settings.activeEntity=el.value;this.config.changed();this.update();}});
  this.dialog.addEventListener('close',()=>{this.open=false;this.qr='';this.onVisibilityChange(false);});
 }
 private get settings():MusicConfig{return this.config.value.music??=( {entities:[],activeEntity:'',jamUrl:'',jamSavedAt:''});}
 private get state(){return this.connection.states.get(this.settings.activeEntity);}
 update(){const s=this.state,a=s?.attributes??{},ready=available(s)&&this.connection.connected,title=ready?String(a.media_title??'Ingen musik vald'):'Spotify är inte tillgängligt',cover=ready?artwork(s,'/connection-api',this.connection.source==='simulator'):'';
  this.root.innerHTML=`<button class="music-open" aria-label="Öppna Spotify"><span class="music-cover">${cover?`<img src="${esc(cover)}" alt="Albumomslag" referrerpolicy="no-referrer">`:'♪'}</span><span class="track-copy"><small>SPOTIFY ${this.connection.source==='simulator'?'· DEMO':''}</small><strong>${esc(title)}</strong><span>${esc(ready?a.media_artist??'':this.settings.activeEntity?'Otillgänglig':'Välj konto i inställningarna')}</span><small>${esc(ready?a.source??'Ingen uppspelningsenhet':'')} · ${ready&&s?.state==='playing'?'Spelar':'Pausad'}</small></span></button><div class="music-inline-controls">${this.controls()}</div><button class="jam-open" data-music="open">Spotify Jam ↗</button>`;
  if(this.open&&(this.busy||(!this.dialog.querySelector('details[open]')&&!this.dialog.querySelector('input:focus,select:focus'))))this.renderDialog();
  if(this.open)this.syncAvailability();
 }
 private syncAvailability(){
  const state=this.state,ready=this.connection.connected&&this.connection.commandsEnabled;
  for(const button of this.dialog.querySelectorAll<HTMLButtonElement>('[data-media]'))button.disabled=this.busy||!ready||!mediaSupports(state,button.dataset.media!);
  const source=this.dialog.querySelector<HTMLSelectElement>('#music-source'),volume=this.dialog.querySelector<HTMLInputElement>('#music-volume');
  if(source)source.disabled=this.busy||!ready||!mediaSupports(state,'select_source');if(volume)volume.disabled=this.busy||!ready||!mediaSupports(state,'volume_set');
  const status=this.dialog.querySelector('.playback-state');if(status&&!available(state))status.textContent='Otillgänglig';
 }
 private controls(){const s=this.state;return [['media_previous_track','Föregående låt','⏮'],[s?.state==='playing'?'media_pause':'media_play',s?.state==='playing'?'Pausa musik':'Spela musik',s?.state==='playing'?'Ⅱ':'▶'],['media_next_track','Nästa låt','⏭']].map(([service,label,symbol])=>`<button data-media="${service}" aria-label="${label}" ${this.busy||!this.connection.connected||!this.connection.commandsEnabled||!mediaSupports(s,service)?'disabled':''}>${symbol}</button>`).join('');}
 show(){this.open=true;this.onVisibilityChange(true);this.renderDialog();if(!this.dialog.open)this.dialog.showModal();}
 private renderDialog(){
  const s=this.state,a=s?.attributes??{},ready=available(s)&&this.connection.connected,cover=ready?artwork(s,'/connection-api',this.connection.source==='simulator'):'',position=mediaPosition(s),duration=Number(a.media_duration),accounts=this.settings.entities,players=[...this.connection.states.values()].filter(s=>s.entity_id.startsWith('media_player.'));
  this.dialog.innerHTML=`<header><div><small>MUSIK I HEMMET</small><h2>Spotify</h2></div><button data-music="close" aria-label="Stäng musik">×</button></header><p id="music-feedback" role="status" ${this.feedback?'':'hidden'}>${esc(this.feedback)}</p><div class="music-now">${cover?`<img class="large-cover" src="${esc(cover)}" alt="Albumomslag" referrerpolicy="no-referrer">`:'<div class="large-cover empty-cover">♪</div>'}<h3>${esc(ready?a.media_title??'Ingen musik vald':'Ingen tillgänglig uppspelning')}</h3><p>${esc(ready?a.media_artist??'':'')}<br><small>${esc(ready?a.media_album_name??'':'')}</small></p><span class="playback-state">${!ready?'Otillgänglig':s?.state==='playing'?'Spelar':s?.state==='paused'?'Pausad':'Ingen musik spelas'}</span><div class="music-progress"><progress max="${duration>0?duration:1}" value="${position??0}"></progress><span>${trackTime(position)} / ${trackTime(a.media_duration)}</span>${s?.state==='playing'?'<small>Uppskattad position mellan HA-rapporter</small>':''}</div><div class="music-buttons">${this.controls()}</div>${this.busy?'<p role="status">Väntar på Home Assistant… Låtinformation kan dröja.</p>':''}</div>
  ${accounts.length>1?`<label>Spotify-konto<select id="music-account">${accounts.map(id=>`<option value="${esc(id)}" ${id===this.settings.activeEntity?'selected':''}>${esc(this.connection.states.get(id)?.attributes.friendly_name??id)}</option>`).join('')}</select></label>`:''}
  <label>Uppspelningsenhet<select id="music-source" ${!ready||!this.connection.commandsEnabled||!mediaSupports(s,'select_source')||this.busy?'disabled':''}><option value="">${esc(a.source??'Ingen tillgänglig enhet')}</option>${(Array.isArray(a.source_list)?a.source_list:[]).filter(x=>typeof x==='string').map(source=>`<option value="${esc(source)}" ${source===a.source?'selected':''}>${esc(source)}</option>`).join('')}</select></label>
  <label>Volym ${typeof a.volume_level==='number'?Math.round(a.volume_level*100)+' %':''}<input id="music-volume" type="range" min="0" max="100" step="1" value="${typeof a.volume_level==='number'?a.volume_level*100:0}" ${!ready||!this.connection.commandsEnabled||!mediaSupports(s,'volume_set')||this.busy?'disabled':''}></label>
  <section class="jam-section"><h3>Lyssna tillsammans</h3><button class="primary" data-music="jam">Visa Jam QR-kod</button>${this.settings.jamUrl?`<p>Länk sparad ${esc(this.settings.jamSavedAt?new Date(this.settings.jamSavedAt).toLocaleString('sv-SE'):'tidigare')}. Sessionens status kan inte verifieras. Be värden om en ny länk om den inte fungerar.</p>`:'<p>Ingen Jam-inbjudningslänk finns. Skapa en Jam i Spotify och lägg in länken nedan.</p>'}${this.qr?`<figure class="jam-qr"><img src="${this.qr}" alt="${esc(this.qrLabel)}"><figcaption>${esc(this.qrLabel)}</figcaption></figure>`:''}</section>
  <details class="music-settings"><summary>Musikinställningar och Jam-länk</summary><label>Home Assistant-konton<select id="music-entities" multiple size="${Math.max(2,Math.min(5,players.length))}">${players.map(p=>`<option value="${esc(p.entity_id)}" ${accounts.includes(p.entity_id)?'selected':''}>${esc(p.attributes.friendly_name??p.entity_id)} · ${esc(p.entity_id)}</option>`).join('')}</select></label><p>Välj motsvarande Spotify media_player. Flera konton kan sparas.</p><label>Jam-inbjudningslänk<input id="jam-url" type="url" placeholder="https://open.spotify.com/socialsession/…" value="${esc(this.settings.jamUrl)}" autocomplete="off"></label><p>Spotify → Anslut enhet → Starta en Jam → Bjud in → Dela länk. Premium krävs för värden. Kortlänkar kontrolleras så att de leder till en Jam, inte en låt eller spellista.</p><div class="button-row"><button data-music="save">Spara musikinställningar</button><button data-music="remove">Ta bort Jam-länk</button></div></details>${this.connection.source==='simulator'?'<button data-music="demo">Demonstrera QR · testlänk, ingen riktig Jam</button>':''}`;
 }
 private report(text:string){this.feedback=text;const el=this.dialog.querySelector<HTMLElement>('#music-feedback');if(el){el.textContent=text;el.hidden=false;}this.notify(text);}
 private async command(action:string,data:Record<string,unknown>={}){if(this.busy)return;this.busy=true;this.feedback='';this.update();try{await this.connection.media(this.settings.activeEntity,action,data);}catch(e){this.report(e instanceof Error?e.message:String(e));}finally{this.busy=false;this.update();}}
 private async saveSettings(){
  const select=this.dialog.querySelector<HTMLSelectElement>('#music-entities')!,jam=this.dialog.querySelector<HTMLInputElement>('#jam-url')!.value.trim(),entities=[...select.selectedOptions].map(o=>o.value);
  try{let url='';if(jam){const response=await fetch('/workspace-api/music/jam/resolve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:jam}),signal:AbortSignal.timeout(30000)}),data=await response.json();if(!response.ok)throw new Error(data.message);url=data.url;}
   const previous=this.settings.jamUrl;this.config.value.music={entities,activeEntity:entities.includes(this.settings.activeEntity)?this.settings.activeEntity:entities[0]??'',jamUrl:url,jamSavedAt:url===previous?this.settings.jamSavedAt:url?new Date().toISOString():''};this.qr='';this.config.changed();await this.config.save();this.report(this.config.status);this.renderDialog();this.update();
  }catch(e){this.report(e instanceof Error?e.message:String(e));}
 }
 private async showQr(demo=false){const url=demo?'https://example.invalid/hemkontroll/jam-demo':canonicalJamUrl(this.settings.jamUrl);if(!url){this.report('Ingen giltig Jam-inbjudningslänk finns. Lägg in en delad länk från Spotify.');return;}this.qr=await QRCode.toDataURL(url,{width:360,margin:4,errorCorrectionLevel:'M',color:{dark:'#071710',light:'#ffffff'}});this.qrLabel=demo?'TESTLÄNK · Ingen riktig Spotify Jam':'Skanna för att öppna Jam-inbjudan · aktiv session ej verifierad';this.renderDialog();}
 dispose(){this.onVisibilityChange=()=>{};this.dialog.close();this.dialog.remove();this.root.remove();}
}
