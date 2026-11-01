import type {Configuration} from './configuration';
import type {Connection} from './connection';
import type {SceneObject,Preset,PresetAction} from './types';
import {escapeHtml as esc} from './panels';
import {isLightingEntity,robotSupports} from '../../../../shared/ha-contract.js';
import {spotifyPresetUri} from './preset-music';
import './preset-composer.css';

/** Authoring only: opening, selecting and saving never send device commands. */
export class PresetComposer{
 readonly button=document.createElement('button');
 readonly dialog=document.createElement('dialog');
 private saving=false;private abort?:AbortController;private previousFocus?:HTMLElement;
 constructor(private config:Configuration,private connection:Connection,private devices:()=>SceneObject[],private saved:()=>void){
  this.button.type='button';this.button.id='control-add-preset';this.button.className='control-add-preset';this.button.setAttribute('aria-label','Lägg till förinställning');this.button.setAttribute('aria-haspopup','dialog');
  this.button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  if(document.body.dataset.serverRole&&document.body.dataset.serverRole!=='admin'){this.button.disabled=true;this.button.title='Administratörsbehörighet krävs för att skapa förinställningar.';}
  this.dialog.id='control-preset-composer';this.dialog.className='preset-composer';this.dialog.setAttribute('aria-labelledby','preset-composer-title');document.body.append(this.dialog);
  this.button.onclick=()=>this.open();
  this.dialog.addEventListener('cancel',e=>{e.preventDefault();if(!this.saving)this.close();});
  this.dialog.addEventListener('click',e=>{if(e.target===this.dialog&&!this.saving){const r=this.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.close();}});
 }
 private field<T extends HTMLElement=HTMLInputElement>(name:string){return this.dialog.querySelector<T>('[name="'+name+'"]')!;}
 private close(){this.abort?.abort();this.dialog.close();this.previousFocus?.focus({preventScroll:true});}
 private open(){
  if(this.dialog.open)return;this.previousFocus=document.activeElement as HTMLElement;this.abort?.abort();this.abort=new AbortController();
  const ids=new Set<string>();const devices=this.devices().filter(o=>{if(ids.has(o.entityId)||! /^(light|switch|vacuum)\./.test(o.entityId))return false;ids.add(o.entityId);return true;});
  const rows=devices.map((o,i)=>{
   const s=this.connection.states.get(o.entityId),pref=this.config.value.entityPreferences?.[o.entityId];
   const saved=this.config.value.objects.some(v=>v.entityId===o.entityId&&['light','device','vacuum'].includes(v.type))||pref?.allowCommands===true;
   const vacuum=o.entityId.startsWith('vacuum.'),allowed=saved&&pref?.allowCommands!==false&&!!s&&!['unknown','unavailable'].includes(s.state)&&(vacuum?robotSupports(s,'vacuum_locate'):['on','off'].includes(s.state));
   const lighting=!!s&&!Array.isArray(s.attributes.entity_id)&&isLightingEntity(o.entityId,s.attributes),detail=!s||['unknown','unavailable'].includes(s.state)?'Otillgänglig':!saved?'Saknar sparad koppling':!allowed?'Styrning saknas':vacuum?'Lokaliseringssignal':s.state==='on'?'På just nu':'Av just nu';
   return '<label class="composer-device" data-entity="'+esc(o.entityId)+'" data-search="'+esc((o.name+' '+o.entityId).toLocaleLowerCase('sv-SE'))+'" data-lighting="'+lighting+'" data-vacuum="'+vacuum+'" style="--row-hue:'+i%5+'"><input type="checkbox" name="target" value="'+esc(o.entityId)+'" '+(!allowed?'disabled data-unavailable="true"':'')+'><span class="composer-device-icon" aria-hidden="true">'+(vacuum?'◉':lighting?'☼':'⏻')+'</span><span class="composer-device-name"><strong>'+esc(o.name)+'</strong><small>'+esc(detail)+'</small></span><select aria-label="Åtgärd för '+esc(o.name)+'" '+(!allowed?'disabled':'')+'>'+(vacuum?'<option value="locate">Var är Max?</option>':'<option value="turn_on">Slå på</option><option value="turn_off">Slå av</option>')+'</select></label>';
  }).join('');
  this.dialog.innerHTML=`<form class="composer-form"><header><div><small>DIN STÄMNING</small><h2 id="preset-composer-title">Skapa en kombination</h2><p>Ljus, enheter och musik. Precis som du vill ha det.</p></div><button type="button" class="composer-close" aria-label="Stäng">×</button></header><div class="composer-scroll"><div class="composer-identity"><label>Namn<input name="title" placeholder="Till exempel Filmkväll" maxlength="80" required autocomplete="off"></label><label class="composer-color">Färg<input name="color" type="color" value="#e78b32"></label></div><fieldset class="composer-mode"><legend>Vad ska hända?</legend><label><input type="radio" name="mode" value="combination" checked><span>En kombination<small>Slå på eller av de valda enheterna</small></span></label><label><input type="radio" name="mode" value="halloween"><span>Spöklikt blink<small>60 sekunder · bara belysning · återställs</small></span></label></fieldset><section class="composer-targets"><div class="composer-section-title"><h3>Välj från listan</h3><span class="composer-count">0 valda</span></div><input name="search" type="search" placeholder="Sök bland enheter…" aria-label="Sök enheter till kombinationen"><div class="composer-device-list">${rows||'<p>Inga enheter tillgängliga.</p>'}</div><p class="composer-no-results" hidden>Inga enheter matchar sökningen.</p></section><details class="composer-music"><summary><span class="composer-spotify-logo" aria-hidden="true">♫</span><span>Spotify<small>Lägg till musik i kombinationen</small></span><span aria-hidden="true">⌄</span></summary><div class="composer-music-fields"><label class="composer-music-enable"><input type="checkbox" name="music"> Inkludera Spotify</label><label>Uppspelning<select name="musicAction"><option value="play">Spela musik</option><option value="pause">Pausa musik</option></select></label><label>Uppspelningsenhet<select name="musicDevice"><option value="">Aktiv Spotify-enhet</option></select><small class="composer-music-status" role="status">Hämtar tillgängliga enheter…</small></label><label class="composer-uri">Låt eller spellista<input name="uri" placeholder="Klistra in en Spotify-länk (valfritt)"><small>Lämna tomt för att fortsätta aktuell uppspelning.</small></label></div></details><p class="composer-hint">Ingenting startas när du sparar. Du kör kombinationen från dess nya kort.</p></div><footer><p class="composer-feedback" role="status" aria-live="polite"></p><button type="button" class="composer-cancel">Avbryt</button><button type="submit" class="composer-save">Spara kombination</button></footer></form>`;
  this.dialog.querySelector('.composer-close')!.addEventListener('click',()=>this.close());this.dialog.querySelector('.composer-cancel')!.addEventListener('click',()=>this.close());
  this.dialog.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();void this.save();});
  this.dialog.addEventListener('change',this.update,{signal:this.abort.signal});this.field('search').addEventListener('input',this.update,{signal:this.abort.signal});this.field('color').addEventListener('input',()=>this.dialog.style.setProperty('--composer-accent',(this.field('color')as HTMLInputElement).value),{signal:this.abort.signal});
  this.dialog.style.setProperty('--composer-accent','#e78b32');this.update();this.dialog.showModal();this.field('title').focus();
  void this.loadMusic(this.abort.signal);
 }
 private update=()=>{
  const blink=this.dialog.querySelector<HTMLInputElement>('[name="mode"]:checked')!.value==='halloween';
  const query=(this.field('search')as HTMLInputElement).value.trim().toLocaleLowerCase('sv-SE');let visible=0,count=0;
  this.dialog.querySelectorAll<HTMLElement>('.composer-device').forEach(row=>{
   const checkbox=row.querySelector<HTMLInputElement>('input')!,select=row.querySelector<HTMLSelectElement>('select')!;
   const ineligible=blink&&row.dataset.lighting!=='true'&&row.dataset.vacuum!=='true';
   checkbox.disabled=checkbox.dataset.unavailable==='true'||ineligible;if(checkbox.disabled)checkbox.checked=false;
   select.disabled=checkbox.disabled||!checkbox.checked||blink;row.classList.toggle('chosen',checkbox.checked);
   row.hidden=!row.dataset.search!.includes(query);if(!row.hidden)visible++;if(checkbox.checked)count++;
   row.classList.toggle('blink-target',blink&&checkbox.checked&&row.dataset.vacuum!=='true');
  });
  this.dialog.querySelector('.composer-count')!.textContent=count+' valda';(this.dialog.querySelector('.composer-no-results')as HTMLElement).hidden=visible>0;
  const music=(this.field('music')as HTMLInputElement).checked,pause=(this.field('musicAction')as HTMLSelectElement).value==='pause';
  for(const name of ['musicAction','musicDevice','uri'])(this.field(name)as HTMLInputElement).disabled=!music;
  (this.dialog.querySelector('.composer-uri')as HTMLElement).hidden=pause;
 };
 private async loadMusic(signal:AbortSignal){
  const status=this.dialog.querySelector('.composer-music-status')!;
  try{const responses=await Promise.all([fetch('/spotify-api/status',{signal}),fetch('/spotify-api/devices',{signal})]);if(responses.some(r=>!r.ok))throw Error('Spotify kunde inte läsas.');const [setup,result]=await Promise.all(responses.map(r=>r.json()));if(signal.aborted)return;
   if(!setup.connected||!setup.canControl)throw Error(setup.connected?'Spotify är skrivskyddat.':'Spotify är inte anslutet.');
   const select=this.field<HTMLSelectElement>('musicDevice');for(const d of result.devices??[])if(d.id&&!d.is_restricted){const option=document.createElement('option');option.value=d.id;option.textContent=d.name+(d.is_active?' · aktiv':'');select.append(option);}
   status.textContent='Tillgängligheten kontrolleras igen när du kör kombinationen.';
  }catch(e){if(!signal.aborted){status.textContent=(e as Error).message;(this.field('music')as HTMLInputElement).disabled=true;}}
 }
 private async save(){
  if(this.saving)return;const feedback=this.dialog.querySelector<HTMLElement>('.composer-feedback')!;
  try{
   const name=(this.field('title')as HTMLInputElement).value.trim();if(!name)throw Error('Ge kombinationen ett namn.');
   const blink=this.dialog.querySelector<HTMLInputElement>('[name="mode"]:checked')!.value==='halloween';
   const actions:PresetAction[]=[];this.dialog.querySelectorAll<HTMLElement>('.composer-device').forEach(row=>{if(row.querySelector<HTMLInputElement>('input')!.checked)actions.push({entityId:row.dataset.entity!,action:row.querySelector<HTMLSelectElement>('select')!.value as PresetAction['action']});});
   const music=(this.field('music')as HTMLInputElement).checked,uri=music&&(this.field('musicAction')as HTMLSelectElement).value==='play'?spotifyPresetUri((this.field('uri')as HTMLInputElement).value):undefined;
   if(!actions.length&&!music)throw Error('Välj minst en enhet eller Spotify.');
   if(blink&&!actions.some(a=>!a.entityId.startsWith('vacuum.')))throw Error('Välj minst en lampa för blinkningen.');
   if(actions.length>100)throw Error('Välj högst 100 enheter.');
   const id='custom-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join(''),deviceId=(this.field('musicDevice')as HTMLSelectElement).value;
   const preset:Preset={id,name,icon:blink?'🎃':'✦',color:(this.field('color')as HTMLInputElement).value,description:'Skapad i kontrollpanelen',effect:blink?'halloween':'combination',entityId:'script.'+id.replaceAll('-','_'),canStop:blink,hidden:false,
    ...(blink?{effectTargets:actions.filter(a=>!a.entityId.startsWith('vacuum.')).map(a=>a.entityId),effectVacuum:actions.find(a=>a.entityId.startsWith('vacuum.'))?.entityId}:{actions}),
    ...(music?{spotify:{action:(this.field('musicAction')as HTMLSelectElement).value as 'play'|'pause',...(uri?{uri}:{}),...(deviceId?{deviceId}:{})}}:{})};
   this.saving=true;this.dialog.setAttribute('aria-busy','true');this.dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=true);feedback.textContent='Sparar…';
   await this.config.addPreset(preset);this.saved();this.close();
  }catch(e){feedback.textContent=(e as Error).message;}finally{this.saving=false;this.dialog.removeAttribute('aria-busy');this.dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.disabled=false);}
 }
 dispose(){this.abort?.abort();this.dialog.remove();this.button.remove();}
}
