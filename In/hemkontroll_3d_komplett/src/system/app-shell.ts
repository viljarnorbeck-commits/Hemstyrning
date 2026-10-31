import {restoreHomeMusic} from './music-session';
import {startConnection} from './app-session';
const routes=['/','/control','/lights','/music','/energy','/cars','/climate','/mower','/security','/settings'];
export async function startShell(){
 const {homeReady}=await import('./home');await homeReady;startConnection();
 for(const el of [...document.body.children])if(el instanceof HTMLElement&&el.id!=='garden'&&!el.matches('script,.app-sidebar,.nav-mobile,.music-panel,.music-widget'))el.dataset.homeUi='';
 const hint=document.createElement('div');hint.className='orientation-hint';hint.textContent='Vrid gärna skärmen till liggande läge';hint.setAttribute('role','status');document.body.append(hint);
 const lockLandscape=()=>{if(matchMedia('(display-mode: standalone)').matches||document.fullscreenElement){const orientation=screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>};void orientation.lock?.('landscape').catch(()=>{});}};lockLandscape();document.addEventListener('fullscreenchange',lockLandscape);
 const outlet=document.createElement('div');outlet.id='app-outlet';document.body.append(outlet);
 let dispose:(()=>void)|undefined,serial=0,current='';
 async function show(path:string,reset=false){const n=++serial;const route=new URL(path,location.origin).pathname;const next=document.createElement('div');next.className='route-view';
 if(route!=='/'){
 const module=route==='/control'||route==='/lights'?await import('./control'):route==='/music'?await import('./music-page'):route==='/settings'?await import('./settings-v2'):await import('./function-pages');
 if(n!==serial)return;outlet.append(next);next.hidden=true;const nextDispose=module.mount(next);await new Promise<void>(r=>requestAnimationFrame(()=>r()));if(n!==serial){nextDispose();next.remove();return;}dispose?.();outlet.replaceChildren(next);dispose=nextDispose;next.hidden=false;
 }else{dispose?.();dispose=undefined;restoreHomeMusic();outlet.replaceChildren();}
 document.body.classList.remove('control-mode','control-layout','lights-page','function-mode','settings-page');document.body.classList.toggle('app-feature',route!=='/');document.body.classList.toggle('home-mode',route==='/');
 if(route==='/control'||route==='/lights')document.body.classList.add('control-mode','control-layout',...(route==='/lights'?['lights-page']:[]));else if(route==='/settings')document.body.classList.add('settings-page');else if(route!=='/')document.body.classList.add('control-mode','function-mode');
 current=route;document.body.dataset.appRoute=route;document.querySelectorAll('.app-sidebar nav a').forEach(a=>{if(a.getAttribute('href')===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(route==='/'&&reset)document.dispatchEvent(new Event('hem-request-home'));
 }
 document.addEventListener('click',e=>{const mouse=e as MouseEvent;if(mouse.button||mouse.ctrlKey||mouse.metaKey||mouse.shiftKey||mouse.altKey)return;const a=(e.target as Element).closest<HTMLAnchorElement>('a[href]');if(!a||a.target||a.download)return;const u=new URL(a.href);if(u.origin!==location.origin||!routes.includes(u.pathname)||u.hash&&u.pathname===current)return;e.preventDefault();e.stopImmediatePropagation();if(u.pathname===current&&u.pathname==='/'){document.dispatchEvent(new Event('hem-request-home'));return;}history.pushState({},'',u.pathname+u.search+u.hash);void show(u.href,u.pathname==='/');},{capture:true});
 window.addEventListener('popstate',()=>void show(location.href));await show(location.href);
}
