import {WebSocket} from 'ws';
/** Read-only metadata. Never return device identifiers, tokens or arbitrary attributes. */
export function readRegistry(target:{url:string;token:string}){return new Promise<Array<{entityId:string;name:string;area:string;disabled:boolean;platform:string}>>((resolve,reject)=>{
 const url=new URL(target.url);url.protocol=url.protocol==='https:'?'wss:':'ws:';url.pathname='/api/websocket';url.search='';
 const ws=new WebSocket(url),results=new Map<number,any[]>();let finished=false;
 const finish=(error?:Error)=>{if(finished)return;finished=true;clearTimeout(timer);ws.close();if(error){reject(error);return;}const devices=new Map((results.get(2)??[]).map(d=>[d.id,d]));const areas=new Map((results.get(3)??[]).map(a=>[a.area_id,a.name]));resolve((results.get(1)??[]).map(e=>({entityId:e.entity_id,name:e.name??e.original_name??e.entity_id,area:areas.get(e.area_id??devices.get(e.device_id)?.area_id)??'Ej områdesplacerad',disabled:!!e.disabled_by,platform:e.platform??''})));};
 const timer=setTimeout(()=>finish(Error('Registerläsning tog för lång tid')),10000);
 ws.on('error',()=>finish(Error('Registeranslutning saknas')));ws.on('close',()=>{if(!finished)finish(Error('Registeranslutningen stängdes'));});
 ws.on('message',raw=>{try{const m=JSON.parse(String(raw));if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:target.token}));if(m.type==='auth_invalid')finish(Error('Registeråtkomst avvisades'));if(m.type==='auth_ok')for(const[id,type]of [[1,'config/entity_registry/list'],[2,'config/device_registry/list'],[3,'config/area_registry/list']]as const)ws.send(JSON.stringify({id,type}));if(m.type==='result'){if(!m.success||!Array.isArray(m.result)){finish(Error('Registeråtkomst saknas'));return;}results.set(m.id,m.result);if(results.size===3)finish();}}catch{finish(Error('Ogiltigt registersvar'));}});
 });}
