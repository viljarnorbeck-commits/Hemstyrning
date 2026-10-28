export interface SurfacePointer {id:number;x:number;y:number;type:string;primary:boolean;button:number;marker?:string}
export interface Tap {x:number;y:number;type:string;marker?:string;at:number}
/** A whole pointer sequence is navigation once any finger drags, cancels, or joins it. */
export class GestureGate {
 private pointers=new Map<number,SurfacePointer>();private blocked=false;private last?:Tap;
 get navigation(){return this.blocked;}
 get count(){return this.pointers.size;}
 has(id:number){return this.pointers.has(id);}
 invalidate(){this.blocked=true;this.last=undefined;}
 down(pointer:SurfacePointer){if(!this.count)this.blocked=false;this.pointers.set(pointer.id,pointer);if(this.count>1||!pointer.primary||pointer.button!==0)this.invalidate();}
 move(id:number,x:number,y:number){const start=this.pointers.get(id);if(start&&Math.hypot(x-start.x,y-start.y)>7)this.invalidate();}
 cancel(id:number){this.invalidate();this.pointers.delete(id);}
 up(id:number,x:number,y:number,at:number):{kind:'tap'|'double';tap:Tap}|null{
  const start=this.pointers.get(id);if(!start)return null;this.move(id,x,y);this.pointers.delete(id);if(this.blocked||this.count)return null;
  const tap:Tap={x,y,type:start.type,marker:start.marker,at};
  if(start.type==='touch'&&this.last&&at-this.last.at<=320&&Math.hypot(x-this.last.x,y-this.last.y)<26){this.last=undefined;return{kind:'double',tap};}
  this.last=start.type==='touch'?tap:undefined;return{kind:'tap',tap};
 }
}
/** Markers forward only pointer-down; OrbitControls captures the real pointer stream. */
export class SurfaceInput {
 readonly gate=new GestureGate();private markers=new Map<number,string>();private timer?:ReturnType<typeof setTimeout>;private pending?:Tap;private suppressUntil=0;private blockedClicks=new Set<number>();
 constructor(private canvas:HTMLCanvasElement,private onTap:(tap:Tap)=>void,private onDouble:(tap:Tap)=>void,private onNavigate:()=>void){
  canvas.addEventListener('pointerdown',this.down);
  document.addEventListener('pointermove',this.move,true);document.addEventListener('pointerup',this.up,true);document.addEventListener('pointercancel',this.cancel,true);document.addEventListener('pointerdown',this.outside,true);
  document.addEventListener('click',this.click,true);canvas.addEventListener('lostpointercapture',this.lost);canvas.style.touchAction='none';
 }
 private down=(e:PointerEvent)=>{this.gate.down({id:e.pointerId,x:e.clientX,y:e.clientY,type:e.pointerType,primary:e.isPrimary,button:e.button,marker:this.markers.get(e.pointerId)});if(this.gate.count>1)this.clear();};
 private move=(e:PointerEvent)=>{if(!this.gate.has(e.pointerId)){if(this.gate.count)e.stopPropagation();return;}this.gate.move(e.pointerId,e.clientX,e.clientY);if(this.gate.navigation)this.clear();};
 private up=(e:PointerEvent)=>{if(!this.gate.has(e.pointerId)){if(this.gate.count)e.stopPropagation();return;}if(this.gate.navigation)this.suppressUntil=performance.now()+350;const action=this.gate.up(e.pointerId,e.clientX,e.clientY,e.timeStamp);this.markers.delete(e.pointerId);if(!action)return;
  if(action.kind==='double'){this.clear();if(!action.tap.marker)this.onDouble(action.tap);return;}
  if(action.tap.type!=='touch'){this.onTap(action.tap);return;}
  if(this.pending)this.onTap(this.pending);this.clear();this.pending=action.tap;this.timer=setTimeout(()=>{const tap=this.pending;this.clear();if(tap&&!this.gate.count)this.onTap(tap);},330);
 };
 private cancel=(e:PointerEvent)=>{if(this.gate.has(e.pointerId)){this.gate.cancel(e.pointerId);this.markers.delete(e.pointerId);this.clear();}};
 private lost=(e:PointerEvent)=>{if(this.gate.has(e.pointerId))this.cancel(e);};
 private outside=(e:PointerEvent)=>{
  const ui=e.target!==this.canvas&&!(e.target as HTMLElement).closest?.('.device-marker');
  if(ui&&this.gate.count){this.blockedClicks.add(e.pointerId);if(this.blockedClicks.size>32)this.blockedClicks.delete(this.blockedClicks.values().next().value!);this.gate.invalidate();this.clear();}
  else if(ui){this.blockedClicks.delete(e.pointerId);this.suppressUntil=0;}
 };
 private click=(e:MouseEvent)=>{const blocked=e instanceof PointerEvent&&this.blockedClicks.has(e.pointerId);if(e.detail!==0&&(blocked||this.gate.count||performance.now()<this.suppressUntil)){e.preventDefault();e.stopPropagation();if(e instanceof PointerEvent)this.blockedClicks.delete(e.pointerId);}};
 private clear(){clearTimeout(this.timer);this.timer=undefined;this.pending=undefined;}
 forward(e:PointerEvent,marker:string){if(e.button!==0)return;e.preventDefault();e.stopPropagation();this.markers.set(e.pointerId,marker);
  this.canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:e.pointerId,pointerType:e.pointerType,isPrimary:e.isPrimary,button:e.button,buttons:e.buttons,clientX:e.clientX,clientY:e.clientY,screenX:e.screenX,screenY:e.screenY,width:e.width,height:e.height,pressure:e.pressure}));
 }
 navigationStarted(){this.onNavigate();}
 dispose(){this.clear();this.canvas.removeEventListener('pointerdown',this.down);document.removeEventListener('pointermove',this.move,true);document.removeEventListener('pointerup',this.up,true);document.removeEventListener('pointercancel',this.cancel,true);document.removeEventListener('pointerdown',this.outside,true);this.canvas.removeEventListener('lostpointercapture',this.lost);document.removeEventListener('click',this.click,true);}
}
