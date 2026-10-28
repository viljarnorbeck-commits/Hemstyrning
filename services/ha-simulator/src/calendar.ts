import type { StateStore } from './store.js';
export interface CalendarEvent { summary:string;start:{dateTime?:string;date?:string};end:{dateTime?:string;date?:string};description?:string;location?:string }
function stamp(value:unknown):{dateTime?:string;date?:string}|null {
 if(typeof value==='string')return /^\d{4}-\d{2}-\d{2}$/.test(value)?{date:value}:Number.isFinite(Date.parse(value))?{dateTime:value}:null;
 if(value&&typeof value==='object'){const v=value as Record<string,unknown>;return stamp(v.dateTime??v.date);}
 return null;
}
export function calendarEvents(store:StateStore,id:string,start:string,end:string):CalendarEvent[]{
 const from=Date.parse(start),to=Date.parse(end);if(!Number.isFinite(from)||!Number.isFinite(to)||to<=from||to-from>93*86400000)throw new Error('Ogiltigt kalenderintervall');
 const state=store.get(id);if(!state||['unknown','unavailable'].includes(state.state))throw new Error('Kalendern är inte tillgänglig');
 const raw=state.attributes.events;if(!Array.isArray(raw))return[];
 const events:CalendarEvent[]=[];
 for(const entry of raw){if(!entry||typeof entry!=='object')continue;const event=entry as Record<string,unknown>,a=stamp(event.start),b=stamp(event.end);if(!a||!b||typeof event.summary!=='string')continue;
  const begin=Date.parse(a.dateTime??a.date!),finish=Date.parse(b.dateTime??b.date!);if(finish<=begin||finish<=from||begin>=to)continue;
  events.push({summary:event.summary.slice(0,500),start:a,end:b,...(typeof event.description==='string'?{description:event.description}:{}),...(typeof event.location==='string'?{location:event.location}:{})});
 }
 return events.sort((a,b)=>Date.parse(a.start.dateTime??a.start.date!)-Date.parse(b.start.dateTime??b.start.date!)).slice(0,500);
}
