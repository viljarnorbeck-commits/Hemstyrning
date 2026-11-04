import type {IncomingMessage} from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import {ViewCoordinator} from './view-coordinator.js';
/** Authenticated shared viewing channel. No pairing and no HA device commands. */
export function screenHub(role:(req:IncomingMessage)=>string|undefined,validObject:(id:string)=>Promise<boolean>,validCamera:(ref:string)=>Promise<boolean>=async()=>false,coordinator=new ViewCoordinator()){
 const wss=new WebSocketServer({noServer:true,maxPayload:2048});
 const clients=new Map<WebSocket,{ready:boolean;viewer:boolean;count:number;since:number;last:number}>();
 const send=(ws:WebSocket,m:unknown)=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(m));};
 const broadcast=(m:unknown)=>{for(const [ws,c]of clients)if(c.ready)send(ws,m);};
 const unsubscribe=coordinator.subscribe(state=>broadcast({type:'ViewState',state}));
 let queue=Promise.resolve();
 wss.on('connection',(ws,req:IncomingMessage)=>{
  const client={ready:false,viewer:false,count:0,since:Date.now(),last:Date.now()};clients.set(ws,client);
  const timeout=setTimeout(()=>{if(!client.ready)ws.close(1008);},5000);
  ws.on('message',raw=>{queue=queue.then(async()=>{
   if(ws.readyState!==WebSocket.OPEN)return;
   const r=role(req);if(!r){ws.close(1008);return;}
   let m:Record<string,unknown>;try{m=JSON.parse(String(raw));if(!m||typeof m!=='object'||Array.isArray(m))throw 0;}catch{ws.close(1003);return;}
   client.last=Date.now();
   const error=(message:string)=>send(ws,{type:'error',message});
   if(!client.ready){if(m.type!=='hello'||!['display','control'].includes(String(m.kind))){ws.close(1008);return;}client.ready=true;clearTimeout(timeout);send(ws,{type:'ready',canControl:r!=='viewer',state:{...coordinator.snapshot(),reason:'command'}});return;}
   if(m.type==='ping'){send(ws,{type:'pong'});return;}
   if(Date.now()-client.since>1000){client.since=Date.now();client.count=0;}if(++client.count>20){error('För många visningskommandon');return;}
   if(m.type==='leaveViewer'){client.viewer=false;send(ws,{type:'ViewerState',view:null,state:coordinator.snapshot()});return;}
   if(m.type==='viewer'){
    if(!['VIEW_CAMERA','VIEW_MOWER_CAMERA'].includes(String(m.mode))||typeof m.cameraRef!=='string'||m.cameraRef.length>150||!await validCamera(m.cameraRef)){error('Kameran är inte ansluten');return;}
    client.viewer=true;send(ws,{type:'ViewerState',view:{mode:m.mode,cameraRef:m.cameraRef}});return;
   }
   if(r==='viewer'){error('Läsbehörighet: du kan följa men inte styra gemensam visning');return;}
   if(m.type==='activity'){if(!client.viewer)coordinator.activity();return;}
   if(m.type!=='view'||!['HOME','FOCUS_OBJECT','FOLLOW_OBJECT','FREE_3D','PHOTO_YARD'].includes(String(m.mode))||Object.keys(m).some(k=>!['type','mode','objectId','photoId'].includes(k))){error('Ogiltigt visningskommando');return;}
   if(m.mode==='FOCUS_OBJECT'||m.mode==='FOLLOW_OBJECT'){
    if(typeof m.objectId!=='string'||m.objectId.length>150||!await validObject(m.objectId)){coordinator.set({mode:'HOME'},'invalid');error('Objektet saknas eller saknar verifierad 3D-position');return;}
    coordinator.set({mode:m.mode,objectId:m.objectId});
   }else if(m.mode==='PHOTO_YARD'){if(m.photoId!=='janne'){error('Fotovyn saknas');return;}coordinator.set({mode:'PHOTO_YARD',photoId:'janne'});}
   else coordinator.set({mode:m.mode as 'HOME'|'FREE_3D'});
  }).catch(()=>send(ws,{type:'error',message:'Visningen kunde inte uppdateras'}));});
  ws.on('close',()=>{clearTimeout(timeout);clients.delete(ws);});
 });
 const timer=setInterval(()=>{for(const[ws,c]of clients)if(Date.now()-c.last>45000)ws.terminate();},15000);timer.unref();
 return {wss,coordinator,broadcast:()=>{queue=queue.then(async()=>{const s=coordinator.snapshot();if('objectId'in s&&!await validObject(s.objectId))coordinator.set({mode:'HOME'},'invalid');broadcast({type:'ConfigUpdated'});});},close:()=>{clearInterval(timer);unsubscribe();coordinator.close();for(const ws of wss.clients)ws.terminate();wss.close();}};
}
