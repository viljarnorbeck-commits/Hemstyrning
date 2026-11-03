import {suspendMusicView} from './music-session';
import {setupMeasurementHistory} from './measurement-history';
import {startConnection} from './app-session';
const routes=['/','/control','/lights','/music','/energy','/cars','/climate','/mower','/security','/settings'];
type MountedPage={ready:Promise<unknown>;activate():void;dispose():void};
export async function startShell(){
 const {homeReady}=await import('./home');await homeReady;setupMeasurementHistory();startConnection();
 for(const el of [...document.body.children])if(el instanceof HTMLElement&&el.id!=='garden'&&!el.matches('script,.app-sidebar,.nav-mobile,.music-panel,.music-widget,.spotify-device-popover,.measurement-history-dialog,.home-clock-popover,.overview-unlock-confirm,.yard-house-dialog,.week-forecast-dialog'))el.dataset.homeUi='';
 const hint=document.createElement('div');hint.className='orientation-hint';hint.textContent='Vrid gärna skärmen till liggande läge';hint.setAttribute('role','status');document.body.append(hint);
 window.setTimeout(()=>{hint.hidden=true;},6000);
 const lockLandscape=()=>{if(!matchMedia('(orientation: portrait)').matches)return;if(matchMedia('(display-mode: standalone)').matches||document.fullscreenElement){const orientation=screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>};if(orientation?.lock)void orientation.lock('landscape').catch(()=>{});}};
 lockLandscape();document.addEventListener('fullscreenchange',lockLandscape);matchMedia('(display-mode: standalone)').addEventListener('change',lockLandscape);
 const outlet=document.createElement('div');outlet.id='app-outlet';document.body.append(outlet);
 const notice=document.createElement('p');notice.id='route-notice';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);
 let mounted:MountedPage|undefined,serial=0,current='',currentUrl=location.pathname+location.search+location.hash;
 const scrolls=new Map<string,{windowY:number;bodyY:number;panels:Array<{id:string;x:number;y:number}>}>();
 function saveScroll(){if(!current)return;scrolls.set(current,{windowY:window.scrollY,bodyY:document.body.scrollTop,panels:[...outlet.querySelectorAll<HTMLElement>('[id]')].filter(el=>el.scrollTop||el.scrollLeft).map(el=>({id:el.id,x:el.scrollLeft,y:el.scrollTop}))});}
 function restoreScroll(route:string){const saved=scrolls.get(route);window.scrollTo(0,saved?.windowY??0);document.body.scrollTop=saved?.bodyY??0;for(const p of saved?.panels??[]){const el=outlet.querySelector<HTMLElement>('#'+CSS.escape(p.id));if(el){el.scrollTop=p.y;el.scrollLeft=p.x;}}}
 async function show(path:string,reset=false){const n=++serial,url=new URL(path,location.origin),route=url.pathname;let next:HTMLElement|undefined,candidate:MountedPage|undefined;
 notice.hidden=true;outlet.setAttribute('aria-busy','true');
 try{
 if(route!=='/'){
 const module=route==='/control'||route==='/lights'?await import('./control'):route==='/music'?await import('./music-page'):route==='/settings'?await import('./settings-v2'):await import('./function-pages');
 if(n!==serial)return;next=document.createElement('div');next.className='route-view';next.hidden=true;outlet.append(next);candidate=module.mount(next);await candidate.ready;
 if(n!==serial){candidate.dispose();next.remove();return;}
 }
 const first=!current;saveScroll();mounted?.dispose();mounted=undefined;
 if(candidate&&next){outlet.replaceChildren(next);next.hidden=false;mounted=candidate;if(!['/control','/music'].includes(route))suspendMusicView();candidate.activate();}else{suspendMusicView();outlet.replaceChildren();}
 document.body.classList.remove('control-mode','control-layout','lights-page','function-mode','settings-page','nav-open');document.querySelector('.nav-mobile')?.setAttribute('aria-expanded','false');
 document.body.classList.toggle('app-feature',route!=='/');document.body.classList.toggle('home-mode',route==='/');
 if(route==='/control'||route==='/lights')document.body.classList.add('control-mode','control-layout',...(route==='/lights'?['lights-page']:[]));else if(route==='/settings')document.body.classList.add('settings-page');else if(route!=='/')document.body.classList.add('control-mode','function-mode');
 current=route;currentUrl=url.pathname+url.search+url.hash;document.body.dataset.appRoute=route;
 document.dispatchEvent(new Event('hem-route-changed'));
 document.querySelectorAll('.app-sidebar nav a').forEach(a=>{if(a.getAttribute('href')===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 restoreScroll(route);if(url.hash)requestAnimationFrame(()=>outlet.querySelector('#'+CSS.escape(decodeURIComponent(url.hash.slice(1))))?.scrollIntoView({block:'start'}));
 if(route==='/'&&!first){
 const q=url.searchParams,id=q.get('focus');
 if(reset)document.dispatchEvent(new Event('hem-request-home'));
 else if(id)document.dispatchEvent(new CustomEvent('hem-focus-object',{detail:{id,follow:q.get('follow')==='1',inspect:false}}));
 else if(q.get('view')==='3d'&&document.body.classList.contains('hem-start'))document.getElementById('open-3d')?.click();
 else if(q.get('view')==='list'&&!document.body.classList.contains('home-list'))document.getElementById('list-button')?.click();
 if(q.has('calendar'))document.querySelector<HTMLButtonElement>('.mobile-home-nav [data-view=calendar]')?.click();
 }
 }catch{candidate?.dispose();next?.remove();if(n===serial){notice.textContent='Vyn kunde inte öppnas. Den tidigare vyn är kvar.';notice.hidden=false;history.replaceState(history.state,'',currentUrl);}}
 finally{if(n===serial)outlet.removeAttribute('aria-busy');}
 }
 document.addEventListener('click',e=>{const mouse=e as MouseEvent;if(mouse.button||mouse.ctrlKey||mouse.metaKey||mouse.shiftKey||mouse.altKey)return;const a=(e.target as Element).closest<HTMLAnchorElement>('a[href]');if(!a||a.target||a.download)return;const u=new URL(a.href);if(u.origin!==location.origin||!routes.includes(u.pathname))return;
 if(u.pathname===current&&u.pathname===location.pathname&&u.search===location.search&&!u.hash&&u.pathname!=='/'){e.preventDefault();e.stopImmediatePropagation();document.body.classList.remove('nav-open');document.querySelector('.nav-mobile')?.setAttribute('aria-expanded','false');return;}
 if(u.pathname===current&&u.search===location.search&&u.hash){e.preventDefault();history.pushState({},'',u.pathname+u.search+u.hash);document.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView({block:'start'});return;}
 e.preventDefault();e.stopImmediatePropagation();if(u.pathname===current&&u.pathname==='/'&&!u.search){document.dispatchEvent(new Event('hem-request-home'));return;}history.pushState({},'',u.pathname+u.search+u.hash);void show(u.href,u.pathname==='/'&&!u.search);},{capture:true});
 window.addEventListener('popstate',()=>void show(location.href));await show(location.href);
}
