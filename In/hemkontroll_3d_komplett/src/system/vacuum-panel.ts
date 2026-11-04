import {displayEntity,entityUpdateNote} from './entity-display-data';
import type {SceneObject} from './types';
import type {Connection} from './connection';
import {measurement} from './overview-data';
import {available,robotSupports} from '../../../../shared/ha-contract.js';
import {escapeHtml as esc} from './panels';
import {icon} from './app-navigation';
import {VacuumDropdown} from './vacuum-dropdown';
import './vacuum-panel.css';
type VacuumView={busy:()=>boolean;setBusy:(busy:boolean)=>void;message:(text:string)=>void;render:()=>void};

/** Shared commands and room picker for the control workspace and Robots page. */
export class VacuumActions{
 private dropdown:VacuumDropdown;private abort=new AbortController();
 constructor(private root:HTMLElement,private connection:Connection,private object:(id:string)=>SceneObject|undefined,private view:VacuumView){
  this.dropdown=new VacuumDropdown(root);
  root.addEventListener('click',e=>{
   const b=(e.target as HTMLElement).closest<HTMLButtonElement>('button');if(!b||b.disabled)return;
   if(b.dataset.vacuumMenu){e.stopImmediatePropagation();this.dropdown.toggle(b);return;}
   if(b.dataset.vacuumTarget||b.dataset.action?.startsWith('vacuum_')){e.stopImmediatePropagation();void this.run(b);}
  },{signal:this.abort.signal});
 }
 refresh(){this.dropdown.refresh();}
 private async run(button:HTMLButtonElement){
  if(this.view.busy()||!this.connection.connected||!this.connection.commandsEnabled)return;
  const object=this.object(button.dataset.vacuumObject??button.dataset.id??'');if(!object||object.type!=='vacuum')return;
  const target=button.dataset.vacuumTarget?object.vacuumTargets?.find(t=>t.id===button.dataset.vacuumTarget):undefined;
  if(button.dataset.vacuumTarget&&!target)return;
  const action=button.dataset.action,value=action==='vacuum_fan'?button.dataset.vacuumSpeed:undefined;
  const state=this.connection.states.get(object.entityId),speeds=state?.attributes.fan_speed_list;
  if(action==='vacuum_fan'&&(!value||!robotSupports(state,action)||!Array.isArray(speeds)||!speeds.includes(value)))return;
  this.view.setBusy(true);this.view.message(target?'Skickar '+target.label+' till Home Assistant…':'Väntar på bekräftelse…');this.view.render();
  try{
   if(target){
    const response=await fetch('/connection-api/vacuum-target',{method:'POST',headers:{'Content-Type':'application/json','X-Hemkontroll-Mode':'live'},body:JSON.stringify({object_id:object.id,target_id:target.id}),signal:AbortSignal.timeout(35000)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.message??'Dammsugarfunktionen kunde inte skickas.');
    this.view.message(target.label+' · Home Assistant tog emot kommandot. Dammsugarens status visas när den uppdateras.');
   }else if(action){await this.connection.command(object,action,value);this.view.message(action==='vacuum_locate'?'Home Assistant tog emot lokaliseringssignalen':'Bekräftat av Home Assistant');}
  }catch(e){this.view.message((e as Error).message);}
  finally{this.view.setBusy(false);this.view.render();if(button.isConnected&&document.activeElement===document.body)button.focus({preventScroll:true});}
 }
 dispose(){this.abort.abort();this.dropdown.dispose();}
}
export const vacuumIllustration='<svg class="vacuum-illustration" viewBox="0 0 260 240" role="img" aria-label="Robotdammsugare"><ellipse cx="130" cy="214" rx="81" ry="10" fill="#000" opacity=".18"/><path d="m61 177-25 17m20-5-2 18m4-21-19-2" fill="none" stroke="#87939c" stroke-width="5" stroke-linecap="round"/><circle cx="130" cy="125" r="84" fill="#323940" stroke="#abb4bb" stroke-width="3"/><circle cx="130" cy="125" r="72" fill="#424b52" stroke="#65717b"/><path d="M60 150a75 75 0 0 0 140 0M86 176h88" fill="none" stroke="#171d22" stroke-width="7" stroke-linecap="round"/><circle cx="130" cy="99" r="21" fill="#252d34" stroke="#c7cdd0" stroke-width="2"/><circle cx="130" cy="99" r="11" fill="#6c7983"/><rect x="116" y="139" width="28" height="12" rx="6" fill="#222a30"/><circle cx="124" cy="145" r="2" fill="#efb660"/><path d="M78 80a67 67 0 0 1 99-9" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/></svg>';
export function renderVacuumPanel(o:SceneObject,connection:Connection,options:{busy:boolean;saved:boolean;status:string}){
 const s=connection.states.get(o.entityId),a=displayEntity(connection.states,o.entityId)?.attributes??{},disabled=!connection.connected||!connection.commandsEnabled||!options.saved||options.busy;
 const boundBattery=o.bindings?.battery_level?measurement(connection.states,o.bindings.battery_level,connection.connected,'%'):null;
 const battery=typeof a.battery_level==='number'&&a.battery_level>=0&&a.battery_level<=100?a.battery_level:boundBattery?.value!=null&&boundBattery.value>=0&&boundBattery.value<=100?boundBattery.value:null;
 const reported=s?.last_reported??s?.last_updated,stamp=reported?Date.parse(reported):NaN;
 const speedNames:Record<string,string>={Silent:'Tyst',Standard:'Standard',Medium:'Medel',Turbo:'Turbo',Gentle:'Skonsam',Auto:'Automatisk'};
 const speeds=Array.isArray(a.fan_speed_list)?a.fan_speed_list.filter((v):v is string=>typeof v==='string'):[];
 const actions=[['start','Städa allt','play'],['pause','Pausa','pause'],['dock','Till laddstation','dock'],['locate','Var är Max?','locate']];
 const targets=o.vacuumTargets??[],hasSpot=robotSupports(s,'vacuum_spot');
 const menu=targets.length||hasSpot?'<div class="vacuum-target-picker"><button type="button" class="action-button vacuum-menu-toggle" data-vacuum-menu="'+esc(o.id)+'" aria-expanded="false" aria-controls="vacuum-targets-'+esc(o.id)+'">'+icon('vacuum')+'<span>Punktstäda · välj plats</span><span aria-hidden="true">⌄</span></button><div id="vacuum-targets-'+esc(o.id)+'" class="vacuum-target-menu" popover="auto" role="group" aria-label="Välj rum eller dammsugarfunktion"><div class="vacuum-menu-heading"><strong>Var ska Max städa?</strong><small>Välj ett rum eller en funktion</small></div><div class="vacuum-room-grid">'+targets.map(t=>'<button type="button" class="action-button vacuum-target '+(t.kind==='goto'?'vacuum-empty':'')+'" data-vacuum-target="'+esc(t.id)+'" data-vacuum-object="'+esc(o.id)+'" '+(disabled||!available(s)?'disabled':'')+'>'+icon(t.kind==='goto'?'dock':'vacuum')+'<span>'+esc(t.label)+'</span>'+(t.kind==='goto'?'<small>Kör till tömningsplatsen</small>':'')+'</button>').join('')+(hasSpot?'<button type="button" class="action-button vacuum-target" data-action="vacuum_spot" data-id="'+esc(o.id)+'" '+(disabled?'disabled':'')+'>'+icon('vacuum')+'<span>Runt dammsugaren</span></button>':'')+'</div></div></div>':'';
 const fanMenu=robotSupports(s,'vacuum_fan')&&speeds.length?'<div class="vacuum-target-picker vacuum-fan"><button type="button" class="action-button vacuum-menu-toggle" data-vacuum-menu="fan-'+esc(o.id)+'" aria-expanded="false" aria-controls="vacuum-fan-'+esc(o.id)+'">'+icon('vacuum')+'<span>Sugkraft · '+esc(speedNames[String(a.fan_speed)]??a.fan_speed??'Välj sugläge')+'</span><span aria-hidden="true">⌄</span></button><div id="vacuum-fan-'+esc(o.id)+'" class="vacuum-target-menu" popover="auto" role="group" aria-label="Välj sugkraft"><div class="vacuum-menu-heading"><strong>Sugkraft</strong><small>Ändras direkt när du väljer</small></div><div class="vacuum-room-grid">'+speeds.map(speed=>'<button type="button" class="action-button vacuum-target" data-action="vacuum_fan" data-id="'+esc(o.id)+'" data-vacuum-speed="'+esc(speed)+'" aria-pressed="'+(a.fan_speed===speed)+'" '+(disabled?'disabled':'')+'><span>'+esc(speedNames[speed]??speed)+'</span></button>').join('')+'</div></div></div>':'';
 return '<div class="vacuum-detail"><h1>'+esc(o.name)+'</h1><p>'+esc(options.status)+'</p>'+(entityUpdateNote(connection.states,o.entityId)?'<p class="measurement-age">'+esc(entityUpdateNote(connection.states,o.entityId))+'</p>':'')+'<div class="vacuum-summary"><div><small>Batteri</small><strong>'+(battery!==null?esc(battery.toLocaleString('sv-SE',{maximumFractionDigits:0}))+' %':'Saknar data')+'</strong></div><div><small>Senast rapporterad</small><span>'+(Number.isFinite(stamp)?esc(new Date(stamp).toLocaleString('sv-SE')):'Saknas')+'</span></div></div><div class="vacuum-controls">'+actions.filter(([action])=>robotSupports(s,'vacuum_'+action)).map(([action,label,glyph])=>'<button type="button" class="action-button" data-action="vacuum_'+action+'" data-id="'+esc(o.id)+'" '+(disabled?'disabled':'')+'>'+icon(glyph!)+'<span>'+label+'</span></button>').join('')+'</div>'+menu+fanMenu+(!connection.connected||!available(s)?'<p class="stage-status">Dammsugaren är frånkopplad eller otillgänglig.</p>':'')+'</div>';
}
