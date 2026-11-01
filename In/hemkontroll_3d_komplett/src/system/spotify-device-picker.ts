import {updateMarkup} from './card-design';
import {escapeHtml as esc} from './panels';
export interface ConnectDevice{is_local?:boolean;requiresActivation?:boolean;unavailableReason?:string;id:string;name:string;type:string;is_active:boolean;is_restricted:boolean;supports_volume:boolean;volume_percent:number|null}
let sequence=0;
/** A local, portalled menu: never mounts the full player or changes routes. */
export class SpotifyDevicePicker{
 readonly id='spotify-device-picker-'+(++sequence);
 private root=document.createElement('div');private anchor?:HTMLButtonElement;private events?:AbortController;
 private resize?:ResizeObserver;private frame=0;private devices:ConnectDevice[]=[];private selected:string|null=null;private active:string|null=null;
 private allowed=false;private loading=false;private error='';private choosing=false;
 get isOpen(){return !this.root.hidden;}
 constructor(private choose:(id:string)=>Promise<void>,private refresh:()=>Promise<void>){
  this.root.id=this.id;this.root.className='spotify-device-popover';this.root.hidden=true;
  this.root.setAttribute('role','menu');this.root.setAttribute('aria-label','Välj uppspelningsenhet');this.root.tabIndex=-1;
  // The top layer avoids clipping by the control panel, including fullscreen views.
  this.root.setAttribute('popover','manual');document.body.append(this.root);
  this.root.addEventListener('click',e=>{e.stopPropagation();const b=(e.target as Element).closest<HTMLButtonElement>('[data-connect-device]');if(!b||b.disabled||this.choosing)return;const id=b.dataset.connectDevice!;this.close(true);this.choosing=true;void this.choose(id).finally(()=>{this.choosing=false;});});
 }
 toggle(anchor:HTMLButtonElement){if(this.isOpen){this.close(true);return;}this.show(anchor);}
 show(anchor:HTMLButtonElement,last=false){
  this.anchor=anchor;this.root.hidden=false;anchor.setAttribute('aria-expanded','true');this.render();
  if(typeof this.root.showPopover==='function')this.root.showPopover();
  this.position();this.focusItem(last?-1:0);this.events=new AbortController();const signal=this.events.signal;
  document.addEventListener('pointerdown',e=>{const path=e.composedPath();if(!path.includes(this.root)&&!path.includes(anchor))this.close(false);},{capture:true,signal});
  document.addEventListener('keydown',e=>this.key(e),{capture:true,signal});
  document.addEventListener('focusin',e=>{if(!this.root.contains(e.target as Node)&&e.target!==anchor)this.close(false);},{signal});
  window.addEventListener('resize',this.schedule,{signal});document.addEventListener('scroll',this.schedule,{capture:true,signal,passive:true});
  window.visualViewport?.addEventListener('resize',this.schedule,{signal});window.visualViewport?.addEventListener('scroll',this.schedule,{signal});
  this.resize=new ResizeObserver(this.schedule);this.resize.observe(anchor);void this.refresh();
 }
 update(devices:ConnectDevice[],selected:string|null,allowed:boolean,loading:boolean,error='',chosen:string|null=null){
  this.devices=devices;this.active=selected;this.selected=chosen??selected;this.allowed=allowed;this.loading=loading;this.error=error;if(this.isOpen)this.render();
 }
 private render(){
  const focus=document.activeElement,focused=focus instanceof HTMLElement&&this.root.contains(focus),scroll=this.root.scrollTop;
  // Keep existing row order during polling so a focused row never moves underneath a finger.
  const order=[...this.root.querySelectorAll<HTMLElement>('[data-connect-device]')].map(e=>e.dataset.connectDevice);
  const rows=[...this.devices].sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?order.length:ai)-(bi<0?order.length:bi);});
  updateMarkup(this.root,'<h3 data-dom-key="title">Välj uppspelningsenhet</h3><p role="status" data-dom-key="status">'+esc(this.error||(this.loading&&!rows.length?'Hämtar enheter…':!rows.length?'Inga tillgängliga enheter rapporteras av Spotify.':!this.allowed?'Spotify kan inte styras med aktuell anslutning.':''))+'</p>'+rows.map(d=>'<button type="button" role="menuitemradio" tabindex="-1" data-dom-key="device-'+esc(d.id)+'" data-connect-device="'+esc(d.id)+'" aria-checked="'+(d.id===this.selected)+'" '+(!this.allowed||d.is_restricted?'disabled':'')+'><span aria-hidden="true">'+(/computer/i.test(d.type)?'▣':/phone|tablet/i.test(d.type)?'▯':/tv/i.test(d.type)?'▱':'◉')+'</span><span><strong>'+esc(d.name)+'</strong><small>'+esc(d.is_restricted?(d.unavailableReason??'Kan inte styras'):d.id===this.active?'Aktiv':d.id===this.selected?'Vald · starta en låt':d.is_local?'Den här webbläsaren':d.type)+'</small></span><b aria-hidden="true">'+(d.id===this.selected?'✓':'')+'</b></button>').join(''));
  this.root.scrollTop=scroll;if(focused&&(document.activeElement===this.root||!this.root.contains(document.activeElement)))this.focusItem(0);this.schedule();
 }
 private buttons(){return [...this.root.querySelectorAll<HTMLButtonElement>('[data-connect-device]:not(:disabled)')];}
 private focusItem(index:number){const buttons=this.buttons();const target:HTMLElement=buttons[index<0?buttons.length-1:index]??this.root;target.focus({preventScroll:true});if(target!==this.root){const r=target.getBoundingClientRect(),box=this.root.getBoundingClientRect();if(r.top<box.top)this.root.scrollTop-=box.top-r.top+8;else if(r.bottom>box.bottom)this.root.scrollTop+=r.bottom-box.bottom+8;}}
 private key(e:KeyboardEvent){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();this.close(true);return;}
  if(!this.root.contains(document.activeElement)&&document.activeElement!==this.anchor)return;
  const buttons=this.buttons(),at=buttons.indexOf(document.activeElement as HTMLButtonElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();e.stopPropagation();const index=e.key==='Home'?0:e.key==='End'?buttons.length-1:e.key==='ArrowDown'?(at+1)%Math.max(1,buttons.length):(at-1+buttons.length)%Math.max(1,buttons.length);this.focusItem(index);
  }else if(e.key==='Tab'){
   // Continue from the trigger in the page's tab order, rather than from the body portal.
   const all=[...document.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')].filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&el.getClientRects().length&&!this.root.contains(el));
   const i=all.indexOf(this.anchor!),next=all[i+(e.shiftKey?-1:1)];this.close(false);e.preventDefault();(next??all[e.shiftKey?all.length-1:0]??this.anchor)?.focus({preventScroll:true});
  }else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){const next=buttons.slice(at+1).concat(buttons.slice(0,at+1)).find(b=>b.querySelector('strong')?.textContent?.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()));if(next){e.preventDefault();next.focus({preventScroll:true});}}
 }
 private schedule=()=>{if(!this.isOpen||this.frame)return;this.frame=requestAnimationFrame(()=>{this.frame=0;this.position();});};
 private position(){
  if(!this.anchor?.isConnected){this.close(false);return;}
  const v=window.visualViewport,left=v?.offsetLeft??0,top=v?.offsetTop??0,width=v?.width??innerWidth,height=v?.height??innerHeight,r=this.anchor.getBoundingClientRect(),gap=8,margin=10;
  const availableAbove=Math.max(0,r.top-top-gap-margin),availableBelow=Math.max(0,top+height-r.bottom-gap-margin),above=availableAbove>=availableBelow;
  this.root.style.width=Math.max(0,Math.min(310,width-2*margin))+'px';this.root.style.maxHeight=Math.max(0,Math.min(360,above?availableAbove:availableBelow))+'px';
  const box=this.root.getBoundingClientRect();this.root.style.left=Math.max(left+margin,Math.min(r.right-box.width,left+width-box.width-margin))+'px';
  this.root.style.top=Math.max(top+margin,Math.min(above?r.top-gap-box.height:r.bottom+gap,top+height-box.height-margin))+'px';
 }
 close(restoreFocus=false){if(!this.isOpen)return;this.events?.abort();this.resize?.disconnect();cancelAnimationFrame(this.frame);this.frame=0;if(typeof this.root.hidePopover==='function'&&this.root.matches(':popover-open'))this.root.hidePopover();this.root.hidden=true;this.anchor?.setAttribute('aria-expanded','false');if(restoreFocus&&this.anchor?.isConnected)this.anchor.focus({preventScroll:true});}
 dispose(){this.close(false);this.root.remove();}
}
