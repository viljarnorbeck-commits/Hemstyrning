import './vacuum-dropdown.css';

/** Native top-layer popover escapes the detail card's scrolling/clipping. */
export class VacuumDropdown{
 private menu?:HTMLElement;private button?:HTMLElement;
 private toggleWasOpen=false;
 private observed=new WeakSet<HTMLElement>();
 private abort=new AbortController();
 constructor(private root:HTMLElement){
  const signal=this.abort.signal;
  // Auto-popovers can light-dismiss before the invoker's click arrives.
  root.addEventListener('pointerdown',e=>{this.toggleWasOpen=(e.target as HTMLElement).closest('[data-vacuum-menu]')===this.button&&!!this.menu?.matches(':popover-open');},{signal});
  root.addEventListener('click',e=>{const target=e.target as HTMLElement;if(target.closest('.vacuum-target-menu button'))this.close();},{signal});
  root.addEventListener('wheel',e=>{if((e.target as HTMLElement).closest('.vacuum-target-menu'))e.preventDefault();},{passive:false,signal});
  root.addEventListener('keydown',e=>{
   if(!this.menu?.matches(':popover-open')||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   const buttons=Array.from(this.menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));if(!buttons.length)return;
   e.preventDefault();const index=buttons.indexOf(document.activeElement as HTMLButtonElement);
   buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length]!.focus({preventScroll:true});
  },{signal});
  window.addEventListener('resize',()=>this.refresh(),{signal});
  window.addEventListener('scroll',()=>this.refresh(),{capture:true,passive:true,signal});
 }
 toggle(button:HTMLElement){
  const menu=document.getElementById(button.getAttribute('aria-controls')??'');if(!menu||!this.root.contains(menu))return;
  if(menu.matches(':popover-open')||this.toggleWasOpen){this.toggleWasOpen=false;this.close();return;}
  this.close();this.menu=menu;this.button=button;
  if(!this.observed.has(menu)){this.observed.add(menu);menu.addEventListener('toggle',()=>{if(menu===this.menu)this.syncExpanded();},{signal:this.abort.signal});}
  menu.showPopover();this.refresh();
 }
 private syncExpanded(){this.button?.setAttribute('aria-expanded',String(!!this.menu?.matches(':popover-open')));}
 refresh(){
  if(!this.menu?.isConnected||!this.button?.isConnected){this.close();return;}
  this.syncExpanded();if(!this.menu.matches(':popover-open'))return;
  const rect=this.button.getBoundingClientRect(),width=Math.min(680,window.innerWidth-24,Math.max(rect.width,420));
  this.menu.style.width=width+'px';this.menu.style.setProperty('--vacuum-columns',String(window.innerHeight<450&&width>=550?4:width<460?2:3));
  const height=this.menu.offsetHeight;
  this.menu.style.left=Math.max(12,Math.min(rect.left,window.innerWidth-width-12))+'px';
  this.menu.style.top=Math.max(12,Math.min(rect.bottom+8,window.innerHeight-height-12))+'px';
 }
 close(){if(this.menu?.matches(':popover-open'))this.menu.hidePopover();this.button?.setAttribute('aria-expanded','false');this.menu=undefined;this.button=undefined;}
 dispose(){this.close();this.abort.abort();}
}
