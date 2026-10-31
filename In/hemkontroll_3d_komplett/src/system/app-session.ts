import {Connection} from './connection';
export const appConnection=new Connection();
let started=false;
export function startConnection(){if(!started){started=true;void appConnection.start();}}
/** A route owns its listeners and timers, while the application owns the socket. */
export class PageScope {
 private cleanups:Array<()=>void>=[];active=true;
 readonly connection:Connection;
 constructor(){const scope=this;this.connection=new Proxy(appConnection,{get(target,key){if(key==='stop')return()=>{};if(key==='start')return async()=>startConnection();if(key==='addEventListener')return(type:string,fn:EventListener,options?:AddEventListenerOptions)=>{target.addEventListener(type,fn,options);scope.cleanups.push(()=>target.removeEventListener(type,fn,options));};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});}
 disposeWith(fn:()=>void){this.cleanups.push(fn);}
 interval(fn:()=>void,ms:number){const id=setInterval(fn,ms);this.disposeWith(()=>clearInterval(id));return id;}
 dispose(){this.active=false;for(const fn of this.cleanups.splice(0).reverse())fn();}
}
