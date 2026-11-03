import {appConnection} from './app-session';
import {temperatureOffsetC} from './entity-bindings';
import {measurementHistoryPoints} from './measurement-history-data';
import type {HistoryPoint} from './function-data';
import {escapeHtml as esc} from './panels';
import './measurement-history.css';

type Snapshot={rows:HistoryPoint[];start:number;end:number};
const cache=new Map<string,Snapshot>();
/** One read-only history dialog shared by all measurement cards. */
export function setupMeasurementHistory(){
 const dialog=document.createElement('dialog');dialog.className='measurement-history-dialog';
 dialog.setAttribute('aria-labelledby','measurement-history-title');dialog.tabIndex=-1;
 document.body.append(dialog);
 let invoker:HTMLElement|undefined,serial=0,redraw:(()=>void)|undefined,resizeFrame=0;
 const close=()=>{serial++;dialog.close();if(invoker?.isConnected)invoker.focus({preventScroll:true});};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 let outside=false;
 const isOutside=(e:PointerEvent)=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom;};
 dialog.addEventListener('pointerdown',e=>{outside=isOutside(e);});
 dialog.addEventListener('pointerup',e=>{if(outside&&isOutside(e))close();outside=false;});
 document.addEventListener('hem-route-changed',()=>{serial++;if(dialog.open)close();schedulePrefetch();});
 window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(dialog.open)redraw?.();});});
 function render(label:string,unit:string,entity:string,snapshot?:Snapshot,message=''){
  redraw=()=>render(label,unit,entity,snapshot,message);
  const points=snapshot?measurementHistoryPoints(snapshot.rows,unit,snapshot.start,snapshot.end,temperatureOffsetC(entity)):[];
  const finite=points.filter((p):p is {t:number;value:number}=>p.value!==null);
  const low=finite.length?finite.reduce((v,p)=>Math.min(v,p.value),Infinity):0,high=finite.length?finite.reduce((v,p)=>Math.max(v,p.value),-Infinity):1;
  const pad=Math.max((high-low)*.12,Math.abs(high)*.02,.1),min=low-pad,max=high+pad;
  const start=snapshot?.start??Date.now()-86400000,end=snapshot?.end??Date.now();
  const chartWidth=innerWidth<600?540:980,plotWidth=chartWidth-104;
  const x=(t:number)=>64+(t-start)/(end-start)*plotWidth,y=(v:number)=>252-(v-min)/(max-min)*210;
  const segments:string[][]=[];let segment:string[]=[];
  for(const point of points){if(point.value===null){if(segment.length)segments.push(segment);segment=[];}else segment.push(`${x(point.t).toFixed(2)},${y(point.value).toFixed(2)}`);}if(segment.length)segments.push(segment);
  const format=(v:number)=>v.toLocaleString('sv-SE',{maximumFractionDigits:2});
  dialog.innerHTML=`<div class="history-modal-heading"><div><small>SENASTE DYGNET</small><h2 id="measurement-history-title">${esc(label)}</h2></div><span class="history-unit">${esc(unit)}</span></div>${finite.length?`<div class="history-summary"><div><small>Senast uppmätt</small><strong>${format(finite.at(-1)!.value)} <em>${esc(unit)}</em></strong></div><div><small>Lägst</small><span>${format(low)} ${esc(unit)}</span></div><div><small>Högst</small><span>${format(high)} ${esc(unit)}</span></div></div><svg class="history-modal-chart" viewBox="0 0 ${chartWidth} 310" role="img" aria-label="${esc(label)} under senaste 24 timmarna">${[0,.25,.5,.75,1].map(f=>`<line x1="64" x2="${chartWidth-40}" y1="${y(min+(max-min)*f)}" y2="${y(min+(max-min)*f)}"/><text x="5" y="${y(min+(max-min)*f)+4}">${format(min+(max-min)*f)}</text>`).join('')}${segments.map(s=>s.length>1?`<polyline points="${s.join(' ')}"/>`:`<circle cx="${s[0]!.split(',')[0]}" cy="${s[0]!.split(',')[1]}" r="3"/>`).join('')}${[0,.25,.5,.75,1].map(f=>`<text x="${64+plotWidth*f}" y="288" text-anchor="${f===0?'start':f===1?'end':'middle'}">${esc(new Date(start+(end-start)*f).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}))}</text>`).join('')}</svg>`:`<div class="history-modal-empty" role="status">${esc(message||'Ingen historik för den här mätningen under senaste dygnet.')}</div>`}<p class="history-modal-note" role="status">${finite.length?`${finite.length} mätpunkter · ${esc(appConnection.source==='simulator'?'Simulerad historik':'Home Assistant-historik')} · ${esc(new Date(start).toLocaleDateString('sv-SE'))}–${esc(new Date(end).toLocaleDateString('sv-SE'))}`:''}${message&&finite.length?' · '+esc(message):''}</p>`;
 }
 // Preload the visible route with a bounded queue. A modal and a background
 // prefetch share the same job; closing the modal never discards useful data.
 const pending=new Map<string,{promise:Promise<Snapshot>;run:()=>void}>(),queue:string[]=[],failures=new Map<string,number>();let active=0,prefetchTimer:ReturnType<typeof setTimeout>|undefined;
 const historyKey=(entity:string)=>appConnection.source+'|'+entity;
 const pump=()=>{while(active<2&&queue.length){const key=queue.shift()!,job=pending.get(key);if(job){active++;job.run();}}};
 function load(entity:string,priority=false):Promise<Snapshot>{
  const source=appConnection.source,key=historyKey(entity),cached=cache.get(key);
  if(cached&&Date.now()-cached.end<120000)return Promise.resolve(cached);
  const existing=pending.get(key);
  if(existing){if(priority){const index=queue.indexOf(key);if(index>=0){queue.splice(index,1);queue.unshift(key);}}return existing.promise;}
  if(Date.now()-(failures.get(key)??0)<15000)return Promise.reject(Error('Historiken kunde inte hämtas. Försök igen om en stund.'));
  let resolve!:(snapshot:Snapshot)=>void,reject!:(error:unknown)=>void;
  const promise=new Promise<Snapshot>((yes,no)=>{resolve=yes;reject=no;});
  pending.set(key,{promise,run:()=>{void(async()=>{
   try{
    if(appConnection.source!==source)throw Error('Datakällan har ändrats.');
    const end=Date.now(),start=end-86400000;
    const response=await fetch('/connection-api/history?'+new URLSearchParams({entity_id:entity,start:new Date(start).toISOString(),end:new Date(end).toISOString()}),{signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw Error(response.status===403?'Du saknar behörighet att läsa historiken.':'Historiken kunde inte hämtas. Försök igen om en stund.');
    const body=await response.json(),snapshot:Snapshot={rows:Array.isArray(body?.[0])?body[0]:[],start,end};
    if(appConnection.source!==source)throw Error('Datakällan har ändrats.');
    cache.set(key,snapshot);if(cache.size>80)cache.delete(cache.keys().next().value!);failures.delete(key);resolve(snapshot);
   }catch(error){failures.set(key,Date.now());if(failures.size>80)failures.delete(failures.keys().next().value!);reject(error);}
   finally{active--;pending.delete(key);pump();}
  })();}});
  if(priority)queue.unshift(key);else queue.push(key);pump();return promise;
 }
 function prefetch(){
  if(document.hidden||!appConnection.connected)return;
  const entities=new Set([...document.querySelectorAll<HTMLElement>('[data-measurement-history]')].filter(el=>el.getClientRects().length>0).map(el=>el.dataset.measurementHistory??''));
  for(const entity of entities)if(/^[a-z_]+\.[a-z0-9_]+$/.test(entity))void load(entity).catch(()=>{});
 }
 function schedulePrefetch(){clearTimeout(prefetchTimer);prefetchTimer=setTimeout(prefetch,150);}
 const observer=new MutationObserver(schedulePrefetch);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-measurement-history','hidden']});
 appConnection.addEventListener('connection',schedulePrefetch);document.addEventListener('visibilitychange',schedulePrefetch);setInterval(prefetch,60000);schedulePrefetch();
 for(const event of ['pointerover','focusin'])document.addEventListener(event,e=>{const entity=(e.target as Element).closest<HTMLElement>('[data-measurement-history]')?.dataset.measurementHistory;if(entity&&appConnection.connected)void load(entity,true).catch(()=>{});});
 async function open(target:HTMLElement){
  const current=++serial,source=appConnection.source;invoker=target;
  const entity=target.dataset.measurementHistory??'',unit=target.dataset.historyUnit??'',label=target.dataset.historyLabel??'Mätning',cached=cache.get(historyKey(entity));
  const show=(snapshot?:Snapshot,message='')=>{if(current!==serial||appConnection.source!==source)return;render(label,unit,entity,snapshot,message);if(!dialog.open)dialog.showModal();dialog.focus({preventScroll:true});};
  if(!entity){show(undefined,'Ingen historikkälla är kopplad till den här mätningen.');return;}
  if(cached)show(cached);
  try{show(await load(entity,true));}
  catch(error){show(cached,cached?'Visar senast hämtad historik. Uppdateringen misslyckades.':(error as Error).message);}
 }
 document.addEventListener('click',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-measurement-history]');if(!target||dialog.contains(target))return;e.preventDefault();e.stopImmediatePropagation();void open(target);},{capture:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog.open){e.preventDefault();e.stopImmediatePropagation();close();return;}if(e.key!=='Enter'&&e.key!==' ')return;const target=e.target as HTMLElement;if(!target.matches('[data-measurement-history]'))return;e.preventDefault();e.stopImmediatePropagation();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)target.animate([{transform:'translateY(1px) scale(.985)'},{transform:'none'}],{duration:180});void open(target);},{capture:true});
}
