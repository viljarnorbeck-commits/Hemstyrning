import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import WebSocket,{WebSocketServer} from 'ws';
import {it,expect} from 'vitest';
import {createSimulator} from './server.js';

it('keeps real REST and WebSocket on the same read-only source without leaking server credentials',async()=>{
 const state={entity_id:'sensor.actual_house',state:'1200',attributes:{unit_of_measurement:'W'},last_updated:new Date().toISOString()};
 const writes:string[]=[],messages:string[]=[];
 const upstream=createServer((req,res)=>{if(req.method!=='GET')writes.push(req.url!);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url==='/api/states'?[state]:{}));});
 const upstreamWs=new WebSocketServer({server:upstream});
 upstreamWs.on('connection',ws=>{ws.send(JSON.stringify({type:'auth_required'}));ws.on('message',raw=>{const m=JSON.parse(String(raw));messages.push(m.type);
  if(m.type==='auth'){expect(m.access_token).toBe('server-only-test-secret');ws.send(JSON.stringify({type:'auth_ok'}));}
  else if(m.type==='get_states')ws.send(JSON.stringify({id:m.id,type:'result',success:true,result:[state]}));
 });});
 await new Promise<void>(r=>upstream.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${(upstream.address()as AddressInfo).port}`;
 const dir=await mkdtemp(join(tmpdir(),'hem-live-readonly-'));
 const app=createSimulator({token:'local-test',dataDirectory:dir,live:{url,token:'server-only-test-secret',commandsEnabled:false}});
 await new Promise<void>(r=>app.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${(app.server.address()as AddressInfo).port}`;
 let client:WebSocket|undefined;
 try{
  expect(await fetch(base+'/connection-api/status').then(r=>r.json())).toMatchObject({mode:'real',authenticated:true,commandsEnabled:false,entityCount:1});
  expect((await fetch(base+'/connection-api/equipment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity_id:'lock.entredorr_2',action:'unlock',confirmed:true})})).status).toBe(403);
  const received:string[]=[];client=new WebSocket(base.replace('http:','ws:')+'/connection-ws');
  const finished=new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Gateway did not respond')),3000);client!.on('error',reject);client!.on('message',raw=>{
   received.push(String(raw));const m=JSON.parse(String(raw));
   if(m.type==='auth_ok')client!.send(JSON.stringify({id:2,type:'get_states'}));
   if(m.type==='result'&&m.id===2){expect(m.result).toEqual([state]);client!.send(JSON.stringify({id:3,type:'call_service',domain:'lock',service:'unlock'}));}
   if(m.type==='result'&&m.id===3){expect(m.success).toBe(false);clearTimeout(timer);resolve();}
  });});
  await finished;
  expect(received.join('')).not.toContain('server-only-test-secret');
  expect(messages).toContain('get_states');
  // The existing read-only mower recorder also subscribes to the upstream.
  expect(messages.every(type=>['auth','get_states','subscribe_events'].includes(type))).toBe(true);
  expect(writes).toEqual([]);
 }finally{
  client?.terminate();app.simulation.stop();app.stopScreens();for(const ws of app.webSockets.clients)ws.terminate();app.webSockets.close();await new Promise<void>(r=>app.server.close(()=>r()));
  for(const ws of upstreamWs.clients)ws.terminate();upstreamWs.close();await new Promise<void>(r=>upstream.close(()=>r()));await rm(dir,{recursive:true,force:true});
 }
});
