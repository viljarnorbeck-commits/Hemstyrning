import type {Connection} from './connection';
import {houseControls as controls,houseMediaSupports} from '../../../../shared/house-controls.js';
import {escapeHtml as esc} from './panels';
import {updateMarkup} from './card-design';
import {icon} from './app-navigation';
import './yard-house.css';

/** Entire connected white building, traced on the actual 1920 x 1080 asset.
 * This is an image hotspot, not a new 3D placement or calibration.
 * Includes the attached garage, roof overhangs, chimney and right sunroom.
 * The separate timber building and garage tent are outside the outline.
 */
export const dwellingOutline='489,457 518,442 619,357 949,382 993,245 1237,255 1240,214 1248,211 1250,196 1283,193 1286,212 1292,214 1289,258 1561,271 1558,484 1687,496 1716,603 1682,609 1665,711 1663,722 1500,704 1499,695 1310,673 1307,701 1087,667 1087,643 947,618 923,613 921,605 915,602 855,591 848,595 848,600 842,599 842,589 728,574 687,567 590,554 558,550 522,550 515,543 511,467 495,466';

export function yardHouse(connection:Connection){
 const ns='http://www.w3.org/2000/svg',root=document.createElementNS(ns,'svg'),outline=document.createElementNS(ns,'polygon');
 root.classList.add('yard-house-hotspot');root.setAttribute('viewBox','0 0 1920 1080');root.setAttribute('preserveAspectRatio','none');
 outline.classList.add('yard-house-outline');outline.setAttribute('points',dwellingOutline);outline.setAttribute('vector-effect','non-scaling-stroke');outline.setAttribute('role','button');outline.setAttribute('tabindex','0');outline.setAttribute('aria-label','Huset och garaget · öppna hemmabio');outline.setAttribute('aria-haspopup','dialog');root.append(outline);
 const dialog=document.createElement('dialog');dialog.className='yard-house-dialog';dialog.setAttribute('aria-labelledby','yard-house-title');dialog.tabIndex=-1;document.body.append(dialog);
 let active=true,outside=false,busy=false,message='';
 const state=(id:string)=>connection.states.get(id);
 const available=(id:string)=>{const s=state(id);return !!s&&!['unknown','unavailable'].includes(s.state);};
 const label=(id:string)=>!connection.connected?'Frånkopplad':!available(id)?'Otillgänglig':state(id)!.state==='on'?'På':state(id)!.state==='off'?'Av':esc(state(id)!.state);
 const isOff=(id:string)=>['off','standby'].includes(state(id)?.state??'');
 const cinemaAction=()=>isOff(controls.projector)&&isOff(controls.sound)?'turn_on':'turn_off';
 const cinemaAvailable=()=>available(controls.projector)&&available(controls.sound)&&['on','off'].includes(state(controls.projector)?.state??'')&&['on','off','standby','idle','playing','paused','buffering'].includes(state(controls.sound)?.state??'');
 const glyph=(name:string)=>{const paths:Record<string,string>={up:'M4 4h16v4H4z M12 21V10 M7 15l5-5 5 5',down:'M4 4h16v4H4z M12 10v11 M7 16l5 5 5-5',projector:'M4 7h16v12H4z M8 11h3 M8 14h3 M17 12a2 2 0 1 0 0 .1 M7 19v2 M17 19v2',power:'M12 3v9 M7 5a8 8 0 1 0 10 0',minus:'M7 12h10',plus:'M7 12h10 M12 7v10'};return paths[name]?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`:icon(name);};
 const button=(id:string,action:string,text:string,symbol:string,extra='')=>{
  const supported=id!==controls.sound||houseMediaSupports(state(id),action);
  const disabled=busy||!connection.connected||connection.dataStale||!connection.commandsEnabled||!available(id)||!supported;
  return `<button type="button" class="house-control-button ${extra}" data-house-entity="${esc(id)}" data-house-action="${esc(action)}" ${disabled?'disabled':''}>${glyph(symbol)}<span>${esc(text)}</span></button>`;
 };
 function render(){
  if(!dialog.open)return;
  const options=state(controls.hdmi)?.attributes.options,choices=Array.isArray(options)?options.filter((v):v is string=>typeof v==='string'):[];
  const power=(id:string)=>isOff(id)?'turn_on':'turn_off';
  const allOff=isOff(controls.projector)&&isOff(controls.sound),action=cinemaAction();
  const powerDisabled=busy||!connection.connected||connection.dataStale||!connection.commandsEnabled||!cinemaAvailable()||!houseMediaSupports(state(controls.sound),action);
  const volume=state(controls.sound)?.attributes.volume_level,volumeText=typeof volume==='number'&&Number.isFinite(volume)?Math.round(volume*100)+' %':'';
  const disabled=busy||!connection.connected||connection.dataStale||!connection.commandsEnabled||!available(controls.hdmi)||!choices.length;
  updateMarkup(dialog,`<div class="house-dialog-heading"><span class="house-dialog-icon">${glyph('projector')}</span><div><small>HUSET</small><h2 id="yard-house-title">Hemmabio</h2></div><span class="house-source ${connection.connected&&!connection.dataStale?'is-connected':''}">${connection.dataStale?'Gammal information':connection.source==='simulator'?'Simulator':connection.connected?'Home Assistant':'Frånkopplad'}</span></div>
   <section class="house-cinema" aria-label="Hemmabions kontroller">
    <div class="house-screen-controls" role="group" aria-label="Projektorduk">${button(controls.up,'turn_on','Duk upp','up')}${button(controls.down,'turn_on','Duk ner','down')}${button(controls.stop,'turn_on','Stopp','pause')}</div>
    <div class="house-cinema-power"><div class="house-cinema-device">${button(controls.projector,power(controls.projector),'Projektor','projector',state(controls.projector)?.state==='on'?'is-on':'')}<small>${label(controls.projector)}</small></div><div class="house-cinema-device">${button(controls.sound,power(controls.sound),'Sony HT-A9','power',state(controls.sound)?.state==='on'?'is-on':'')}<small>${label(controls.sound)}</small></div></div>
    <div class="house-volume" role="group" aria-label="Sony HT-A9 volym">${button(controls.sound,'volume_down','Sänk volym','minus')}<div>${glyph('volume')}<span>Volym</span><strong>${volumeText}</strong></div>${button(controls.sound,'volume_up','Höj volym','plus')}</div>
    <label class="house-hdmi"><span>HDMI-källor</span><select data-house-hdmi aria-label="HDMI-källor" ${disabled?'disabled':''}>${choices.length?choices.map(v=>`<option value="${esc(v)}" ${state(controls.hdmi)?.state===v?'selected':''}>${esc(v)}</option>`).join(''):'<option>Otillgänglig</option>'}</select></label>
    <button type="button" class="house-control-button house-cinema-shutdown ${allOff&&cinemaAvailable()?'is-ready':''}" data-house-power ${powerDisabled?'disabled':''}>${glyph('power')}<span>${busy?'Väntar på Home Assistant…':allOff?'Slå på bion':'Stäng av bion'}</span></button>
    <p class="house-control-feedback" role="status">${esc(message||(!connection.commandsEnabled?'Styrning är skrivskyddad för den här anslutningen.':''))}</p>
   </section>`);
 }
 async function command(id:string,action:string,value?:string){
  if(busy)return;busy=true;message='Skickar till Home Assistant…';render();
  try{await connection.entityAction(id,action,value);message='Home Assistant har tagit emot kommandot. Status uppdateras från enheten.';}catch(error){message=error instanceof Error?error.message:'Kommandot kunde inte skickas.';}finally{busy=false;render();}
 }
 async function cinemaPower(){
  if(busy||!connection.connected||connection.dataStale||!connection.commandsEnabled||!cinemaAvailable())return;
  const action=cinemaAction();if(!houseMediaSupports(state(controls.sound),action))return;
  // HA exposes mutually exclusive direction switches, not a measured screen position.
  // Lower on startup only when the reported direction is unambiguously up.
  // Shutdown never issues any screen command or invokes the old shutdown script.
  const screenUp=state(controls.up)?.state==='on'&&state(controls.down)?.state==='off'&&state(controls.stop)?.state==='off';
  const screenDown=state(controls.down)?.state==='on'&&state(controls.up)?.state==='off'&&state(controls.stop)?.state==='off';
  const targets=[controls.sound,controls.projector].filter(id=>action==='turn_on'?isOff(id):!isOff(id));
  if(action==='turn_on'&&screenUp)targets.push(controls.down);
  const screenNote=action==='turn_on'&&!screenUp&&!screenDown?' Dukens läge är oklart. Använd Duk ner om den behöver fällas ner.':'';
  busy=true;message=action==='turn_on'?(screenUp?'Slår på HT-A9 och projektorn och skickar Duk ner…':'Slår på HT-A9 och projektorn…'):'Stänger av HT-A9 och projektorn…';render();
  const results=await Promise.allSettled(targets.map(id=>connection.entityAction(id,action)));
  const failed=results.flatMap((result,i)=>result.status==='rejected'?[(targets[i]===controls.sound?'Sony HT-A9':targets[i]===controls.down?'Duk ner':'Projektor')+': '+(result.reason instanceof Error?result.reason.message:'Kommandot misslyckades.')]:[]);
  message=(failed.length?failed.join(' '):'Kommandon skickade till HT-A9 och projektorn.'+(action==='turn_on'&&screenUp?' Duk ner har skickats.':'')+' Inväntar enheternas status.')+screenNote;
  busy=false;render();
 }
 dialog.addEventListener('click',event=>{const power=(event.target as Element).closest<HTMLButtonElement>('button[data-house-power]');if(power){if(!power.disabled)void cinemaPower();return;}const target=(event.target as Element).closest<HTMLButtonElement>('button[data-house-entity]');if(target&&!target.disabled)void command(target.dataset.houseEntity!,target.dataset.houseAction!);});
 dialog.addEventListener('change',event=>{const target=event.target as HTMLSelectElement;if(target.matches('[data-house-hdmi]')&&!target.disabled)void command(controls.hdmi,'select_option',target.value);});
 const close=()=>{dialog.close();root.classList.remove('is-open');outline.setAttribute('aria-expanded','false');if(active&&location.pathname==='/')outline.focus({preventScroll:true});};
 const open=()=>{if(!active)return;if(!dialog.open)dialog.showModal();root.classList.add('is-open');outline.setAttribute('aria-expanded','true');render();dialog.focus({preventScroll:true});};
 outline.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open();});
 outline.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();open();}});
 const isOutside=(e:PointerEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{outside=isOutside(e);});dialog.addEventListener('pointerup',e=>{if(outside&&isOutside(e))close();outside=false;});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 return{root,update(visible:boolean){active=visible;outline.setAttribute('tabindex',visible?'0':'-1');root.classList.toggle('is-inactive',!visible);if(!visible&&dialog.open)close();else render();},dispose(){active=false;if(dialog.open)dialog.close();dialog.remove();root.remove();}};
}
