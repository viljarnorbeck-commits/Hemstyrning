import type {Configuration} from './configuration';
import type {SceneObject} from './types';
import {escapeHtml as esc} from './panels';
import './control-pins.css';

const pinIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 4 5 5-3 1-3 5-1 3-7-7 3-1 5-3Z"/><path d="m9 15-5 5"/></svg>';

/** A hold only reveals the pin. A separate, explicit click saves the ordering. */
export class ControlPins{
 private revealed='';private busy='';private hold?:ReturnType<typeof setTimeout>;
 private suppressEntity='';private suppressUntil=0;
 private abort=new AbortController();private status=document.createElement('p');
 private origin?:{x:number;y:number;id:number};private toast?:ReturnType<typeof setTimeout>;
 constructor(private list:HTMLElement,private config:Configuration,private render:()=>void){
  const signal=this.abort.signal;this.status.className='control-pin-status';this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');list.parentElement!.append(this.status);
  list.addEventListener('pointerdown',e=>{
   this.cancelHold();this.suppressEntity='';this.suppressUntil=0;if(e.button!==0||!e.isPrimary)return;
   const target=e.target as HTMLElement,row=target.closest<HTMLElement>('[data-pin-entity]');
   if(!row||target.closest('.control-pin,input,select,textarea'))return;
   this.origin={x:e.clientX,y:e.clientY,id:e.pointerId};
   this.hold=setTimeout(()=>{
    this.hold=undefined;this.suppressEntity=row.dataset.pinEntity!;this.suppressUntil=Date.now()+1800;
    this.revealed=row.dataset.pinEntity!;this.render();this.status.textContent='Tryck på nålen för att '+(this.pinned(this.revealed)?'lossa funktionen.':'fästa funktionen överst.');
   },550);
  },{signal});
  window.addEventListener('pointermove',e=>{if(this.origin&&e.pointerId===this.origin.id&&Math.hypot(e.clientX-this.origin.x,e.clientY-this.origin.y)>10)this.cancelHold();},{passive:true,signal});
  window.addEventListener('pointerup',()=>{if(this.suppressEntity&&this.origin)this.suppressUntil=Date.now()+900;this.cancelHold();},{signal});
  window.addEventListener('pointercancel',()=>this.cancelHold(),{signal});window.addEventListener('blur',()=>this.cancelHold(),{signal});
  list.addEventListener('click',e=>{
   const target=e.target as HTMLElement,pin=target.closest<HTMLButtonElement>('.control-pin');
   if(pin){e.preventDefault();e.stopImmediatePropagation();if(!pin.disabled)void this.save(pin.dataset.pin!);return;}
   if(Date.now()<this.suppressUntil&&target.closest<HTMLElement>('[data-pin-entity]')?.dataset.pinEntity===this.suppressEntity){e.preventDefault();e.stopImmediatePropagation();}
  },{capture:true,signal});
  list.addEventListener('contextmenu',e=>{const row=(e.target as HTMLElement).closest<HTMLElement>('[data-pin-entity]');if(!row)return;e.preventDefault();this.cancelHold();this.revealed=row.dataset.pinEntity!;this.render();},{signal});
  list.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.revealed){e.preventDefault();this.revealed='';this.render();}},{signal});
  document.addEventListener('pointerdown',e=>{if(this.revealed&&!(e.target as HTMLElement).closest('.control-pin')&&(e.target as HTMLElement).closest<HTMLElement>('[data-pin-entity]')?.dataset.pinEntity!==this.revealed){this.revealed='';this.render();}},{signal});
 }
 private cancelHold(){clearTimeout(this.hold);this.hold=undefined;this.origin=undefined;}
 private pinned(id:string){return this.config.value?.controlPins?.includes(id)===true;}
 card(object:SceneObject,html:string){
  const id=object.entityId,pinned=this.pinned(id),visible=pinned||this.revealed===id;
  const button=visible?'<button type="button" class="control-pin '+(!pinned?'pin-offer':'')+'" data-pin="'+esc(id)+'" aria-label="'+esc((pinned?'Lossa ':'Fäst ')+object.name+(pinned?' från toppen':' överst'))+'" title="'+(pinned?'Lossa från toppen':'Fäst överst')+'" aria-pressed="'+pinned+'" '+(this.busy?'disabled':'')+'>'+pinIcon+'</button>':'';
  return html.replace('<article ','<article data-pin-entity="'+esc(id)+'" data-pinned="'+pinned+'" data-pin-visible="'+visible+'" ').replace('</article>',button+'</article>');
 }
 private async save(id:string){
  if(this.busy)return;const pinned=!this.pinned(id);this.busy=id;this.render();
  try{
   await this.config.setControlPin(id,pinned);this.revealed='';this.status.textContent=pinned?'Fäst överst.':'Fästningen borttagen.';
   this.render();if(pinned)this.list.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  }catch(e){this.status.textContent=(e as Error).message;this.status.classList.add('pin-error');clearTimeout(this.toast);this.toast=setTimeout(()=>this.status.classList.remove('pin-error'),6000);}
  finally{this.busy='';this.render();}
 }
 dispose(){this.cancelHold();clearTimeout(this.toast);this.abort.abort();this.status.remove();}
}
