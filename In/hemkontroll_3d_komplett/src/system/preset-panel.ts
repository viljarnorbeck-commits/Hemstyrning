import {updateMarkup} from './card-design';
import {runPresetMusic} from './preset-music';
import type{Configuration}from'./configuration';import type{Connection}from'./connection';import{escapeHtml as esc}from'./panels';
// Preset colors can be user-selected, so choose legible foreground text on
// the strongly colored tile rather than assuming every accent is light.
function presetInk(color:string):string{
 const match=/^#([0-9a-f]{6})$/i.exec(color);
 if(!match)return '#ffffff';
 const hex=match[1];
 const backdrop=[11,21,33];
 const mixed=[0,2,4].map((i,j)=>0.8*parseInt(hex.slice(i,i+2),16)+0.2*backdrop[j]);
 const linear=mixed.map(v=>{const s=v/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;});
 const luminance=0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2];
 return luminance>0.18?'#020407':'#ffffff';
}
const managedEffect=(p:{id:string;effect?:string;canStop:boolean})=>p.effect==='halloween'||p.id==='norrsken'&&p.effect==='combination'&&p.canStop;
type EffectStatus={running:boolean;restoring:boolean;remainingSeconds:number;targetCount:number;message:string};
export class PresetPanel{
 readonly root=document.createElement('section');
 private signature='';private busy='';private message='';private disposed=false;private polling=false;
 private effects:Record<string,EffectStatus>={};private timer:ReturnType<typeof setInterval>;
 private listener=()=>this.render();
 constructor(private config:Configuration,private connection:Connection){
  this.root.className='preset-panel';this.root.setAttribute('aria-label','Förinställningar');
  this.root.onclick=async e=>{
   const b=(e.target as HTMLElement).closest<HTMLElement>('[data-preset]'),p=config.value.presets?.find(p=>p.id===b?.dataset.preset);if(!p||this.busy)return;
   const stop=b!.getAttribute('aria-checked')==='true';this.busy=p.id;this.message='Skickar · inväntar bekräftelse';this.render();
   try{const result=await connection.preset(p,stop);if(managedEffect(p)){this.effects[p.id]=result;this.message=result.message;}else this.message=p.effect==='combination'?result.message:stop?'Skriptet bekräftat stoppat':'Aktivering bekräftad av Home Assistant. Lampornas status visas separat.';
    if(!stop&&p.spotify){try{await runPresetMusic(p.spotify);this.message=(this.message||'Kombinationen startad.')+' Spotify-kommandot mottaget.';}catch(e){this.message=(this.message||'Enhetskommandon mottagna.')+' Spotify: '+(e as Error).message;}}
   }
   catch(e){this.message=(e as Error).message;}finally{this.busy='';this.render();}
  };
  connection.addEventListener('state',this.listener);connection.addEventListener('connection',this.listener);this.render();
  this.timer=setInterval(()=>{void this.refreshEffects();},1000);void this.refreshEffects();
 }
 private async refreshEffects(){
  if(this.disposed||this.polling||!!this.busy||!this.connection.connected)return;this.polling=true;
  try{await Promise.all((this.config.value.presets??[]).filter(p=>managedEffect(p)&&!p.hidden).map(async p=>{try{const status=await this.connection.presetStatus(p.id);if(!this.disposed&&!this.busy){if(this.effects[p.id]?.running&&!status.running)this.message=status.message;this.effects[p.id]=status;}}catch{if(!this.disposed)delete this.effects[p.id];}}));if(!this.disposed)this.render();}finally{this.polling=false;}
 }
 render(){
  const signature=JSON.stringify([this.config.value.presets,this.effects,this.connection.connected,this.connection.commandsEnabled,this.busy,this.message,(this.config.value.presets??[]).map(p=>this.connection.states.get(p.entityId))]);if(signature===this.signature)return;this.signature=signature;
  const scroll=this.root.scrollTop;
  const cards=(this.config.value.presets??[]).filter(p=>!p.hidden).map(p=>{
   const state=this.connection.states.get(p.entityId),native=!!p.effect,blink=p.effect==='halloween',aurora=p.id==='norrsken',effect=this.effects[p.id],nativeToggle=managedEffect(p);
   const running=nativeToggle?effect?.running===true:state?.state==='on'&&p.entityId.startsWith('script.');
   const disabled=!this.connection.connected||!this.connection.commandsEnabled||(!native&&(!state||state.state==='unavailable'))||!!this.busy||!!effect?.restoring||(nativeToggle&&!effect);
   const toggle=nativeToggle||!native&&p.entityId.startsWith('script.')&&p.canStop;
   const info=aurora&&nativeToggle?(effect?.restoring?'Återställer…':running?'På · mörkerläge aktivt':'På släcker ute · Av återställer'):blink?(effect?.restoring?'Återställer…':effect?.running?effect.remainingSeconds+' s · '+effect.targetCount+' lampor':effect?.message||'60 s · belysning + lokaliseringssignal'):p.effect==='combination'?(p.actions?.length??0)+' enheter'+(p.spotify?' · Spotify':''):!state?'Saknar entitet':state.state==='unavailable'?'Otillgänglig':'';
   return '<article data-card="preset-'+esc(p.id)+'" class="preset-card '+(aurora?'aurora-preset ':'')+(running?'active':'')+'" style="--accent:'+p.color+';--preset-ink:'+presetInk(p.color)+'"><span class="preset-icon" aria-hidden="true">'+esc(p.icon)+'</span><strong>'+esc(p.name)+'</strong>'+(toggle?'<button class="device-switch preset-switch '+(running?'active':'')+'" role="switch" aria-checked="'+running+'" aria-label="'+esc(p.name)+'" data-preset="'+esc(p.id)+'" '+(disabled?'disabled':'')+'><span aria-hidden="true"></span></button>':'<button class="preset-go" data-preset="'+esc(p.id)+'" aria-label="Kör '+esc(p.name)+'" '+(disabled?'disabled':'')+'>'+(this.busy===p.id?'Väntar…':aurora?'Släck ute':'GO!')+'</button>')+'<small class="preset-availability">'+esc(info)+'</small></article>';
  }).join('');
  updateMarkup(this.root,'<div class="section-heading"><div><small>STÄMNING & SCENER</small><h2>Förinställningar</h2></div><a href="/settings">Redigera ↗</a></div><p role="status" class="preset-message">'+esc(this.message)+'</p><div class="preset-grid" tabindex="0" aria-label="Scener">'+(cards||'<p>Inga förinställningar valda. Välj scener eller skript i inställningarna.</p>')+'</div>');this.root.scrollTop=scroll;
 }
 dispose(){this.disposed=true;clearInterval(this.timer);this.connection.removeEventListener('state',this.listener);this.connection.removeEventListener('connection',this.listener);this.root.remove();}
}
