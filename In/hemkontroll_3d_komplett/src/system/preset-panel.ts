import {updateMarkup} from './card-design';
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
export class PresetPanel{
 readonly root=document.createElement('section');private signature='';private busy='';private message='';private listener=()=>this.render();
 constructor(private config:Configuration,private connection:Connection){this.root.className='preset-panel';this.root.setAttribute('aria-label','Förinställningar');this.root.onclick=async e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-preset]'),p=config.value.presets?.find(p=>p.id===b?.dataset.preset);if(!p||this.busy)return;this.busy=p.id;this.message='Skickar · inväntar Home Assistant';this.render();try{await connection.preset(p,b!.dataset.stop==='true');this.message=b!.dataset.stop==='true'?'Skriptet bekräftat stoppat':'Aktivering bekräftad av Home Assistant. Lampornas status visas separat.';}catch(e){this.message=(e as Error).message;}finally{this.busy='';this.render();}};connection.addEventListener('state',this.listener);connection.addEventListener('connection',this.listener);this.render();}
 render(){const signature=JSON.stringify([this.config.value.presets,this.connection.connected,this.connection.commandsEnabled,this.busy,this.message,(this.config.value.presets??[]).map(p=>this.connection.states.get(p.entityId))]);if(signature===this.signature)return;this.signature=signature;const scroll=this.root.scrollTop;updateMarkup(this.root,`<div class="section-heading"><div><small>STÄMNING & SCENER</small><h2>Förinställningar</h2></div><a href="/settings">Redigera ↗</a></div><p role="status" class="preset-message">${esc(this.message)}</p><div class="preset-grid" tabindex="0" aria-label="Scener">${(this.config.value.presets??[]).filter(p=>!p.hidden).map(p=>{const state=this.connection.states.get(p.entityId),running=state?.state==='on'&&p.entityId.startsWith('script.'),disabled=!this.connection.connected||!this.connection.commandsEnabled||!state||state.state==='unavailable'||!!this.busy,last=state?.attributes.last_triggered??(p.entityId.startsWith('scene.')?state?.state:null);return`<article data-card="preset-${esc(p.id)}" class="preset-card ${running?'active':''}" style="--accent:${p.color};--preset-ink:${presetInk(p.color)}"><button data-preset="${esc(p.id)}" ${disabled?'disabled':''}><span class="preset-icon">${esc(p.icon)}</span><strong>${esc(p.name)}</strong><small>${esc(p.description)}</small><b>${this.busy===p.id?'Väntar…':!state?'Saknar entitet':state.state==='unavailable'?'Otillgänglig':running?'● Körs':'Aktivera'}</b></button>${running&&p.canStop?`<button data-preset="${esc(p.id)}" data-stop="true" ${this.busy?'disabled':''}>■ Stoppa</button>`:''}${typeof last==='string'&&Number.isFinite(Date.parse(last))?`<time>Senast aktiverad ${esc(new Date(last).toLocaleTimeString('sv-SE'))}</time>`:''}</article>`;}).join('')||'<p>Inga förinställningar valda. Välj scener eller skript i inställningarna.</p>'}</div>`);this.root.scrollTop=scroll;}
 dispose(){this.connection.removeEventListener('state',this.listener);this.connection.removeEventListener('connection',this.listener);this.root.remove();}
}
