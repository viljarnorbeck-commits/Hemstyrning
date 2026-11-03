import {homeOverview} from './home-overview';
import {startPresentation} from './start-presentation';
import type {GardenScene} from './scene';
import type {Configuration} from './configuration';
import type {Connection} from './connection';
import {ScreenLink} from './screen-link';
import type {ViewState,ViewerView} from '../../../../shared/view-protocol.js';
export function homeV2(config:Configuration,connection:Connection,garden:GardenScene){
 const initialList=new URLSearchParams(location.search).get('view')==='list';let firstSnapshot=true;
 const presentation=startPresentation(config,connection,garden),cards=homeOverview(config,connection),root=cards.root;
 document.body.append(root);const link=new ScreenLink('display','Hem');let disposed=false,revision=0,applied='',navigating=false,lastMove=0,followKey='',followDeadline=0,followRetry:ReturnType<typeof setTimeout>|undefined;
 const nav=document.querySelector('header nav')!,home=document.createElement('button'),free=document.createElement('button'),control=document.createElement('a');home.id='home-button';home.textContent='⌂ Hem';free.id='open-3d';free.textContent='Öppna 3D';control.href='/control';control.textContent='Kontrollpanel ↗';nav.prepend(home,free,control);
 const viewer=document.createElement('section');viewer.className='view-camera-panel';viewer.hidden=true;viewer.setAttribute('aria-label','Kameravisning');viewer.innerHTML='<h2>Kameravisning</h2><p role="status"></p><button data-view-retry>Försök igen</button><button data-view-exit>Lämna kameravisning</button>';document.body.append(viewer);
 const message=(text:string)=>{const node=document.getElementById('data-status');if(node)node.textContent=text;};
 function setMode(value:boolean){
  const url=new URL(location.href);url.searchParams.delete('native');url.searchParams.delete('focus');url.searchParams.delete('follow');if(value)url.searchParams.set('view','3d');else url.searchParams.delete('view');if(location.pathname==='/')history.replaceState({sharedView:true},'',url.pathname+url.search);
  if(document.body.classList.contains('home-list'))document.getElementById('list-button')?.click();
  document.body.classList.toggle('hem-start',!value);root.hidden=value;presentation.home(!value);garden.controls.enabled=value;home.setAttribute('aria-pressed',String(!value));free.textContent=value?'Hem':'Öppna 3D';free.setAttribute('aria-label',value?'Hem – lämna 3D':'Öppna 3D');
 }
 function reset(){garden.pauseRendering(false);++revision;applied='';presentation.cancel(true);garden.cancelFollow();viewer.hidden=true;document.body.classList.remove('camera-viewer');setMode(false);document.dispatchEvent(new Event('hem-clear-selection'));garden.energyNetwork.enabled=false;document.body.classList.remove('energy-view');garden.overview();document.body.dataset.viewMode='HOME';}
 function clearViewerRoute(){const url=new URL(location.href);url.searchParams.delete('viewer');url.searchParams.delete('viewerKind');history.replaceState(history.state,'',url.pathname+url.search);initialViewer=null;}
 function requestHome(){clearViewerRoute();link.leaveViewer();reset();if(link.connected&&link.canControl)link.send('ShowOverview');else if(!link.connected)sessionStorage.setItem('hem-home-request','1');}
 async function apply(state:ViewState){
  if(disposed||link.viewer)return;document.body.dataset.viewVersion=String(state.version);document.body.dataset.viewEpoch=state.epoch;
  if(firstSnapshot){firstSnapshot=false;if((initialList||initialFree)&&state.mode==='HOME'){document.body.dataset.viewMode=initialFree?'FREE_3D':'HOME';return;}}
  if(state.reason==='activity'&&applied)return;
  if(state.mode==='HOME'){reset();if(state.reason==='invalid')message('Objektet saknas eller saknar verifierad position');return;}
  if(state.mode==='FREE_3D'){const n=++revision;garden.cancelFollow();if(!pendingInitialFree)await presentation.enter(()=>{if(n===revision)setMode(true);});if(n!==revision)return;pendingInitialFree=false;document.body.dataset.viewMode='FREE_3D';applied=state.epoch+':'+state.version;return;}
  const key=state.epoch+':'+state.version;if(key===applied)return;applied=key;const n=++revision;
  await presentation.enter(()=>{if(disposed||n!==revision||link.viewer)return;try{setMode(true);garden.cancelFollow();if('objectId'in state)garden.focusObject(state.objectId,state.mode==='FOLLOW_OBJECT');document.body.dataset.viewMode=state.mode;}catch(e){
   // A cold 3D view can be ready before HA's snapshot has supplied a safe robot fix.
   // Retain this camera intent briefly; focusObject still enforces verified geometry/position.
   if(state.mode==='FOLLOW_OBJECT'&&(e as Error).message==='Ingen verifierad robotposition att följa'){
    if(followKey!==key){followKey=key;followDeadline=performance.now()+10000;}
    if(performance.now()<followDeadline){applied='';message('Väntar på verifierad robotposition…');clearTimeout(followRetry);followRetry=setTimeout(()=>{if(!disposed&&n===revision&&!link.viewer&&link.state?.epoch===state.epoch&&link.state.version===state.version)void apply(state);},250);return;}
   }
   reset();message((e as Error).message);
  }});
 }
 function showViewer(view:ViewerView){garden.pauseRendering(true);++revision;presentation.cancel(true);garden.cancelFollow();viewer.hidden=false;document.body.classList.add('camera-viewer');viewer.querySelector('p')!.textContent=view.cameraRef==='simulated-camera'?'SIMULERAT KAMERATITTARLÄGE · ingen videoström används':'Ingen bild. Kamerans säkra strömanslutning är inte konfigurerad.';document.body.dataset.viewMode=view.mode;}
 viewer.querySelector('[data-view-exit]')!.addEventListener('click',()=>{clearViewerRoute();viewer.hidden=true;document.body.classList.remove('camera-viewer');link.leaveViewer();});
 viewer.querySelector('[data-view-retry]')!.addEventListener('click',()=>{if(link.viewer)link.openViewer(link.viewer);});
 link.addEventListener('message',event=>{const m=(event as CustomEvent).detail;
  if(m.type==='ConfigUpdated')void config.load().then(()=>{if(disposed)return;garden.setConfig(config.value);cards.render();});
  if(m.type==='ViewState')void apply(m.state);
  if(m.type==='ViewerState'){if(m.view)showViewer(m.view);else{garden.pauseRendering(false);viewer.hidden=true;document.body.classList.remove('camera-viewer');applied='';if(link.state)void apply(link.state);}}
  if(m.type==='error')message(m.message);
  if(m.type==='ready'){
   if(sessionStorage.getItem('hem-home-request')==='1'){sessionStorage.removeItem('hem-home-request');requestHome();}
   else if(initialFocus){const id=initialFocus;initialFocus='';try{link.send(initialFollow?'FollowObject':'FocusObject',id);}catch(e){message((e as Error).message);}}
   else if(initialViewer){const view=initialViewer;initialViewer=null;link.openViewer(view);}
   else if(initialFree){initialFree=false;if(link.canControl)link.send('EnterFree3D');}
  }
 });
 const focus=(e:Event)=>{const {id,follow}=(e as CustomEvent).detail;const object=config.value.objects.find(o=>o.id===id);if(!object||object.placementConfirmed===false){message('Objektet saknar verifierad 3D-position');return;}try{link.send(follow?'FollowObject':'FocusObject',id);}catch(e){message((e as Error).message);}};
 const open=()=>{try{link.send('EnterFree3D');}catch(e){message((e as Error).message);}};
 const openViewer=(e:Event)=>{try{link.openViewer((e as CustomEvent).detail);}catch(e){message((e as Error).message);}};
 document.addEventListener('hem-focus-object',focus);document.addEventListener('hem-show-overview',requestHome);document.addEventListener('hem-request-home',requestHome);document.addEventListener('hem-open-viewer',openViewer);
 home.onclick=requestHome;free.onclick=()=>{if(root.hidden)requestHome();else open();};
 // OrbitControls change also fires during animation. Only actual input starts activity.
 const inputStart=()=>{navigating=true;if(!link.viewer){++revision;presentation.cancel();garden.cancelFollow();}};const inputEnd=()=>{navigating=false;};
 const inputChange=()=>{if(!navigating||link.viewer||!link.canControl)return;if(Date.now()-lastMove<1000)return;lastMove=Date.now();if(link.state?.mode!=='FREE_3D'){try{link.send('EnterFree3D');}catch{}}else link.activity();};
 garden.controls.addEventListener('start',inputStart);garden.controls.addEventListener('end',inputEnd);garden.controls.addEventListener('change',inputChange);
 const keyActivity=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','-','PageUp','PageDown'].includes(e.key)&&(e.target===garden.renderer.domElement||e.target===document.body)&&!link.viewer&&link.canControl){if(link.state?.mode==='FREE_3D')link.activity();else link.send('EnterFree3D');}};document.addEventListener('keydown',keyActivity);
 const params=new URLSearchParams(location.search);let initialViewer:ViewerView|null=params.get('viewer')?{mode:params.get('viewerKind')==='mower'?'VIEW_MOWER_CAMERA':'VIEW_CAMERA',cameraRef:params.get('viewer')!}:null;let initialFocus=params.get('focus')??'',initialFollow=params.get('follow')==='1',initialFree=params.get('view')==='3d'&&!history.state?.sharedView;
 // TV boots locally at HOME; reconnects still receive the server's current state.
 if(params.get('native')==='home'&&params.get('profile')==='tv'){initialFocus='';initialFree=false;sessionStorage.setItem('hem-home-request','1');}
 let pendingInitialFree=initialFree;setMode(initialFree);if(initialFree)document.body.dataset.viewMode='FREE_3D';garden.revealOverview();link.start();const timer=setInterval(()=>cards.render(),1000);
 return()=>{disposed=true;++revision;clearTimeout(followRetry);clearInterval(timer);link.stop();cards.dispose();presentation.dispose();viewer.remove();document.removeEventListener('hem-focus-object',focus);document.removeEventListener('hem-show-overview',requestHome);document.removeEventListener('hem-request-home',requestHome);document.removeEventListener('hem-open-viewer',openViewer);document.removeEventListener('keydown',keyActivity);garden.controls.removeEventListener('start',inputStart);garden.controls.removeEventListener('end',inputEnd);garden.controls.removeEventListener('change',inputChange);};
}
