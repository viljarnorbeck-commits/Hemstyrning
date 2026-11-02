import {it,expect} from 'vitest';
import express from 'express';
import type {AddressInfo} from 'node:net';
import {bridgeApi} from './bridge.js';
import {StateStore} from './store.js';
import {defaultScene} from './scene-config.js';
import type {HassState} from './types.js';

it('optionally skips unreachable lights without bypassing permissions or changing unselected lights',async()=>{
 const state=(id:string,value:string)=>({entity_id:id,state:value,attributes:{friendly_name:id},last_updated:new Date().toISOString(),last_changed:new Date().toISOString()})as HassState;
 const store=new StateStore([state('light.outdoor','on'),state('light.offline','unavailable'),state('light.indoor','on')]);
 const config=defaultScene();
 for(const id of ['light.outdoor','light.offline'])config.objects.push({...config.objects[0]!,id,entityId:id,type:'light',name:id});
 config.presets=[{id:'norrsken',name:'Norrsken',icon:'✧',color:'#35cba5',description:'',entityId:'script.norrsken',canStop:false,hidden:false,effect:'combination',actions:['light.outdoor','light.offline'].map(entityId=>({entityId,action:'turn_off'}))}];
 let role='admin';const app=express();app.use(express.json(),(_req,res,next)=>{res.locals.hemRole=role;next();});app.use(bridgeApi(store,async()=>config,0));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.on('listening',resolve));
 const base=`http://127.0.0.1:${(server.address()as AddressInfo).port}`;
 const run=()=>fetch(base+'/presets/norrsken',{method:'POST',headers:{'Content-Type':'application/json','X-Hemkontroll-Mode':'live'},body:JSON.stringify({action:'activate'})});
 try{
  expect((await run()).status).toBe(409);expect(store.get('light.outdoor')?.state).toBe('on');
  config.presets[0]!.skipUnavailable=true;
  const accepted=await run();expect(accepted.status).toBe(200);expect((await accepted.json()).message).toContain('1 otillgängliga');
  expect(store.get('light.outdoor')?.state).toBe('off');expect(store.get('light.indoor')?.state).toBe('on');expect(store.get('light.offline')?.state).toBe('unavailable');
  store.set('light.outdoor','unavailable');expect((await run()).status).toBe(409);
  store.set('light.outdoor','on');config.entityPreferences['light.offline']={control:true,details:false,allowCommands:false};
  expect((await run()).status).toBe(409);expect(store.get('light.outdoor')?.state).toBe('on');
  delete config.entityPreferences['light.offline'];role='viewer';expect((await run()).status).toBe(403);expect(store.get('light.outdoor')?.state).toBe('on');
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
