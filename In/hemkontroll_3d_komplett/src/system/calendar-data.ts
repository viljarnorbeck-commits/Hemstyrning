export interface CalendarItem{summary:string;start:{dateTime?:string;date?:string};end:{dateTime?:string;date?:string};location?:string;calendar:string}
export function normalizeCalendar(value:unknown,calendar:string):CalendarItem[]{
 if(!Array.isArray(value))return[];
 return value.flatMap(event=>{if(!event||typeof event!=='object'||typeof event.summary!=='string')return[];const start=event.start,end=event.end;if(!start||!end||typeof start!=='object'||typeof end!=='object')return[];const a=start.dateTime??start.date,b=end.dateTime??end.date;if(typeof a!=='string'||typeof b!=='string'||!Number.isFinite(Date.parse(a))||!Number.isFinite(Date.parse(b))||Date.parse(b)<=Date.parse(a))return[];return[{summary:event.summary,start:{...(start.dateTime?{dateTime:a}:{date:a})},end:{...(end.dateTime?{dateTime:b}:{date:b})},...(typeof event.location==='string'?{location:event.location}:{}),calendar}];});
}
