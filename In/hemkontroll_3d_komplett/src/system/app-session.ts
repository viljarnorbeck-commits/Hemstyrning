import {Connection} from './connection';
import {startMeasurementData} from './measurement-data';
export const appConnection=new Connection();
let started=false;
export function startConnection(){if(!started){started=true;startMeasurementData(appConnection);void appConnection.start();}}
/** A route owns its listeners and timers, while the application owns the socket. */
export class PageScope {
 private cleanups:Array<()=>void>=[];private activators:Array<()=>void>=[];private activated=false;active=true;
 readonly connection:Connection;
 constructor(){const scope=this;this.connection=new Proxy(appConnection,{get(target,key){if(key==='stop')return()=>{};if(key==='start')return async()=>startConnection();if(key==='addEventListener')return(type:string,fn:EventListener,options?:AddEventListenerOptions)=>{target.addEventListener(type,fn,options);scope.disposeWith(()=>target.removeEventListener(type,fn,options));};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});}
 onActivate(fn:()=>void){if(this.active){if(this.activated)fn();else this.activators.push(fn);}}
 activate(){if(!this.active||this.activated)return;this.activated=true;for(const fn of this.activators.splice(0))fn();}
 disposeWith(fn:()=>void){if(this.active)this.cleanups.push(fn);else fn();}
 interval(fn:()=>void,ms:number){const id=setInterval(fn,ms);this.disposeWith(()=>clearInterval(id));return id;}
 dispose(){this.active=false;this.activators=[];for(const fn of this.cleanups.splice(0).reverse())fn();}
}
