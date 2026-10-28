import {WebSocket} from 'ws';
import type {StateStore} from './store.js';
import type {SceneConfig} from './scene-config.js';
import type {LiveTarget} from './bridge.js';
import type {HassState,StateChangedEvent} from './types.js';
import type {MowerHistory} from './mower-history.js';
/** Passive subscriber only; deliberately has no service-call path. */
export function mowerRecorder(history:MowerHistory,store:StateStore,load:()=>Promise<SceneConfig>,live?:LiveTarget){
 const latest=new Map<string,HassState>();let scene:SceneConfig|undefined,closed=false,socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined,lastBuild=0;const refresh=setInterval(()=>{void load().then(c=>scene=c).catch(()=>{});},5000);refresh.unref();void load().then(c=>scene=c).catch(()=>{});
 const record=(source:string,state:HassState)=>{latest.set(source+':'+state.entity_id,state);if(['unavailable','unknown'].includes(state.state))return;if(!scene)return;const mapped=scene.objects.filter(o=>o.type==='mower').map(o=>({id:o.bindings.position??o.entityId,activity:o.entityId}));const binding=mapped.find(m=>m.id===state.entity_id);if(!binding)return;const activity=latest.get(source+':'+binding.activity)?.state??'unknown';try{history.record(source,{...state,state:activity},scene);if(Date.now()-lastBuild>60000){lastBuild=Date.now();void history.rebuild(source,scene).catch(()=>{});}}catch{/* Do not expose coordinates or tokens in logs. */}};
 const local=(event:StateChangedEvent)=>{if(event.data.new_state)record('simulator',event.data.new_state);};store.on('state_changed',local);
 function connect(){if(closed||!live)return;try{const url=new URL('/api/websocket',live.url);url.protocol=url.protocol==='https:'?'wss:':'ws:';const ws=socket=new WebSocket(url,{handshakeTimeout:10000});ws.on('message',raw=>{try{const m=JSON.parse(String(raw));if(m.type==='auth_required')ws.send(JSON.stringify({type:'auth',access_token:live!.token}));if(m.type==='auth_ok'){ws.send(JSON.stringify({id:1,type:'get_states'}));ws.send(JSON.stringify({id:2,type:'subscribe_events',event_type:'state_changed'}));}if(m.type==='result'&&m.id===1&&Array.isArray(m.result))for(const state of m.result)record('real',state);if(m.type==='event'&&m.event?.data?.new_state)record('real',m.event.data.new_state);}catch{}});ws.on('error',()=>ws.close());ws.on('close',()=>{if(!closed){retry=setTimeout(connect,5000);retry.unref();}});}catch{retry=setTimeout(connect,5000);retry.unref();}}
 if(live)connect();return()=>{closed=true;clearInterval(refresh);clearTimeout(retry);store.off('state_changed',local);socket?.terminate();};
}
