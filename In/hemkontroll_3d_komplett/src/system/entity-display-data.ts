import type {HassState} from './types';

// Display-only snapshots. Never replace the actual states used by command guards.
const caches=new WeakMap<Map<string,HassState>,Map<string,HassState>>();
const staleConnections=new WeakSet<Map<string,HassState>>();
const failedRefreshes=new WeakMap<Map<string,HassState>,Set<string>>();
export function entityRefreshFailed(states:Map<string,HassState>,id:string){return failedRefreshes.get(states)?.has(id)??false;}
export function setEntityRefreshFailed(states:Map<string,HassState>,id:string,failed:boolean){
 let entries=failedRefreshes.get(states);if(!entries){entries=new Set();failedRefreshes.set(states,entries);}
 if(failed)entries.add(id);else entries.delete(id);
}
export function displayConnectionStale(states:Map<string,HassState>){return staleConnections.has(states);}
export function rememberEntity(states:Map<string,HassState>,state:HassState){
 if(!state.state.trim()||['unknown','unavailable'].includes(state.state))return;
 let cache=caches.get(states);if(!cache){cache=new Map();caches.set(states,cache);}
 cache.set(state.entity_id,{...state,attributes:{...state.attributes}});
}
export function setDisplayConnectionStale(states:Map<string,HassState>,stale:boolean){
 if(stale)staleConnections.add(states);else staleConnections.delete(states);
}
export function displayEntity(states:Map<string,HassState>,id:string){
 const current=states.get(id);
 if(current&&!['unknown','unavailable'].includes(current.state)&&current.state.trim()){rememberEntity(states,current);return current;}
 return caches.get(states)?.get(id);
}
export function entityNotUpdated(states:Map<string,HassState>,id:string){
 const current=states.get(id);
 return staleConnections.has(states)||entityRefreshFailed(states,id)||!current||['unknown','unavailable'].includes(current.state)||!current.state.trim();
}
export function entityUpdateNote(states:Map<string,HassState>,id:string){
 if(!id||!entityNotUpdated(states,id))return '';
 return displayEntity(states,id)?'Inte uppdaterad · visar senast kända värde':'Inte uppdaterad · saknar tidigare värde';
}
