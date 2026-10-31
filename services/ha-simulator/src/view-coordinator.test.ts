import {it,expect} from 'vitest';
import {ViewCoordinator,type ViewClock} from './view-coordinator.js';
import {screenHub} from './screens.js';
import http from 'node:http';import WebSocket from 'ws';import type {AddressInfo} from 'node:net';
function manual(){let now=0,id=0;const jobs=new Map<number,{at:number;fn:()=>void}>();return{clock:{now:()=>now,set:(fn:()=>void,ms:number)=>{jobs.set(++id,{at:now+ms,fn});return id;},clear:(v:unknown)=>{jobs.delete(v as number);}} satisfies ViewClock,advance(ms:number){now+=ms;for(const[key,job]of [...jobs])if(job.at<=now){jobs.delete(key);job.fn();}},size:()=>jobs.size};}
it('server expires after 300s of genuine inactivity, repeated HOME increments sequence and restart is HOME',()=>{const t=manual(),c=new ViewCoordinator(t.clock);c.set({mode:'FOCUS_OBJECT',objectId:'car'});t.advance(299000);expect(c.snapshot().mode).toBe('FOCUS_OBJECT');c.activity();t.advance(299000);expect(c.snapshot().mode).toBe('FOCUS_OBJECT');t.advance(1000);expect(c.snapshot()).toMatchObject({mode:'HOME',expiresAt:null,reason:'timeout'});const v=c.snapshot().version;c.set({mode:'HOME'});c.set({mode:'HOME'});expect(c.snapshot().version).toBe(v+2);c.set({mode:'FREE_3D'});c.close();c.set({mode:'FREE_3D'});expect(t.size()).toBe(0);const restarted=new ViewCoordinator(t.clock);expect(restarted.snapshot().mode).toBe('HOME');expect(restarted.epoch).not.toBe(c.epoch);restarted.close();});
function next(ws:WebSocket,type:string){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Missing '+type)),3000);const cb=(raw:WebSocket.RawData)=>{const m=JSON.parse(String(raw));if(m.type===type){clearTimeout(timer);ws.off('message',cb);resolve(m);}};ws.on('message',cb);});}
it('broadcasts to every display, orders concurrent requests, validates IDs and denies viewer commands',async()=>{
 const t=manual(),coordinator=new ViewCoordinator(t.clock),hub=screenHub(req=>req.headers['x-test-role'] as string,async id=>{await new Promise(r=>setTimeout(r,id==='car'?15:0));return ['car','mower'].includes(id);},async ref=>ref==='simulated-camera',coordinator),server=http.createServer();
 server.on('upgrade',(req,s,h)=>hub.wss.handleUpgrade(req,s,h,ws=>hub.wss.emit('connection',ws,req)));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const sockets:WebSocket[]=[];
 async function client(role='admin',kind='display'){const ws=new WebSocket(`ws://127.0.0.1:${(server.address()as AddressInfo).port}`,{headers:{'X-Test-Role':role}});sockets.push(ws);await new Promise(r=>ws.once('open',r));const ready=next(ws,'ready');ws.send(JSON.stringify({type:'hello',kind}));return{ws,ready:await ready};}
 try{
  const a=await client(),b=await client(),controller=await client('controller','control'),viewer=await client('viewer');
  const aa=next(a.ws,'ViewState'),bb=next(b.ws,'ViewState');controller.ws.send(JSON.stringify({type:'view',mode:'FOCUS_OBJECT',objectId:'car'}));expect((await aa).state.objectId).toBe('car');expect((await bb).state.objectId).toBe('car');
  const late=await client();expect(late.ready.state.objectId).toBe('car');
  const denied=next(viewer.ws,'error');viewer.ws.send(JSON.stringify({type:'view',mode:'HOME'}));await denied;expect(coordinator.snapshot().mode).toBe('FOCUS_OBJECT');
  const local=next(a.ws,'ViewerState');a.ws.send(JSON.stringify({type:'viewer',mode:'VIEW_CAMERA',cameraRef:'simulated-camera'}));expect((await local).view.mode).toBe('VIEW_CAMERA');
  const expiry=next(b.ws,'ViewState');t.advance(300000);expect((await expiry).state.mode).toBe('HOME');
  const invalid=next(controller.ws,'error');controller.ws.send(JSON.stringify({type:'view',mode:'FOCUS_OBJECT',objectId:'unplaced'}));await invalid;expect(coordinator.snapshot().mode).toBe('HOME');
  const unsafe=next(controller.ws,'error');controller.ws.send(JSON.stringify({type:'view',mode:'HOME',service:'unlock'}));await unsafe;
  const camera=next(a.ws,'error');a.ws.send(JSON.stringify({type:'viewer',mode:'VIEW_CAMERA',cameraRef:'http://internal-camera'}));await camera;
  controller.ws.send(JSON.stringify({type:'view',mode:'FOCUS_OBJECT',objectId:'car'}));controller.ws.send(JSON.stringify({type:'view',mode:'FOLLOW_OBJECT',objectId:'mower'}));await new Promise(r=>setTimeout(r,70));expect(coordinator.snapshot()).toMatchObject({mode:'FOLLOW_OBJECT',objectId:'mower'});
  const rejoin=next(a.ws,'ViewerState');a.ws.send(JSON.stringify({type:'leaveViewer'}));expect((await rejoin).state.mode).toBe('FOLLOW_OBJECT');
 }finally{for(const ws of sockets)ws.terminate();hub.close();await new Promise<void>(r=>server.close(()=>r()));}
});

it('a new server hub starts HOME and refuses unauthenticated sockets',async()=>{
 async function launch(){const hub=screenHub(req=>req.headers['x-test-role'] as string,async()=>true),server=http.createServer();server.on('upgrade',(req,s,h)=>hub.wss.handleUpgrade(req,s,h,ws=>hub.wss.emit('connection',ws,req)));await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));return{hub,server,url:`ws://127.0.0.1:${(server.address()as AddressInfo).port}`};}
 async function connect(url:string){const ws=new WebSocket(url,{headers:{'X-Test-Role':'controller'}});await new Promise(r=>ws.once('open',r));const ready=next(ws,'ready');ws.send(JSON.stringify({type:'hello',kind:'control'}));return{ws,state:(await ready).state};}
 let first=await launch();const c=await connect(first.url),changed=next(c.ws,'ViewState');c.ws.send(JSON.stringify({type:'view',mode:'FREE_3D'}));expect((await changed).state.mode).toBe('FREE_3D');c.ws.terminate();first.hub.close();await new Promise<void>(r=>first.server.close(()=>r()));
 const second=await launch();try{const joined=await connect(second.url);expect(joined.state.mode).toBe('HOME');expect(joined.state.epoch).not.toBe(c.state.epoch);joined.ws.terminate();const unauth=new WebSocket(second.url);await new Promise(r=>unauth.once('open',r));const closed=new Promise<number>(r=>unauth.once('close',r));unauth.send(JSON.stringify({type:'hello',kind:'control'}));expect(await closed).toBe(1008);}finally{second.hub.close();await new Promise<void>(r=>second.server.close(()=>r()));}
});
