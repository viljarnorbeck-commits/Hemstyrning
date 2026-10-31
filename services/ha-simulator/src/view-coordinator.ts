import {randomUUID} from 'node:crypto';
import type {SharedView,ViewState} from '../../../shared/view-protocol.js';
export interface ViewClock {now():number;set(callback:()=>void,ms:number):unknown;clear(timer:unknown):void}
const clock:ViewClock={now:Date.now,set:(fn,ms)=>setTimeout(fn,ms),clear:t=>clearTimeout(t as ReturnType<typeof setTimeout>)};
/** Only view state; intentionally has no access to HA services or credentials. */
export class ViewCoordinator {
 readonly epoch=randomUUID();private version=0;private closed=false;private timer:unknown;private listeners=new Set<(state:ViewState)=>void>();
 private state:ViewState={mode:'HOME',epoch:this.epoch,version:0,expiresAt:null,reason:'command'};
 constructor(private time:ViewClock=clock){}
 subscribe(listener:(state:ViewState)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 snapshot():ViewState{if(this.state.expiresAt!==null&&this.time.now()>=this.state.expiresAt)this.set({mode:'HOME'},'timeout');return {...this.state};}
 set(view:SharedView,reason:ViewState['reason']='command'){
  if(this.closed)return {...this.state};
  this.time.clear(this.timer);this.timer=undefined;
  this.state={...view,epoch:this.epoch,version:++this.version,expiresAt:view.mode==='HOME'?null:this.time.now()+300000,reason};
  if(this.state.expiresAt!==null)this.timer=this.time.set(()=>this.set({mode:'HOME'},'timeout'),300000);
  for(const listener of this.listeners)listener({...this.state});return this.snapshot();
 }
 activity(){if(this.snapshot().mode!=='HOME')this.set(this.state,'activity');}
 close(){this.closed=true;this.time.clear(this.timer);this.listeners.clear();}
}
