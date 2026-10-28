import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {AddressInfo} from 'node:net';
import {createSimulator} from './server.js';
import {simulatedSpotifyId as id} from './music.js';
const json={'Content-Type':'application/json','X-Hemkontroll-Mode':'live'};
it('restricts real media services to configured supported entities, while developer controls stay local',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hemkontroll-media-'));
 const remote=createSimulator({token:'fake-secret',dataDirectory:join(directory,'remote'),commandDelayMs:0});
 await new Promise<void>(r=>remote.server.listen(0,'127.0.0.1',r));
 const target=`http://127.0.0.1:${(remote.server.address() as AddressInfo).port}`;
 const bridge=createSimulator({token:'local',dataDirectory:join(directory,'local'),commandDelayMs:0,live:{url:target,token:'fake-secret',commandsEnabled:true}});
 await new Promise<void>(r=>bridge.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${(bridge.server.address() as AddressInfo).port}`;
 try{
  const config=await fetch(base+'/workspace-api/scene').then(r=>r.json());config.music={entities:[id],activeEntity:id,jamUrl:'',jamSavedAt:''};
  expect((await fetch(base+'/workspace-api/scene',{method:'PUT',headers:json,body:JSON.stringify(config)})).status).toBe(200);
  const send=(body:unknown,headers=json)=>fetch(base+'/bridge/api/media',{method:'POST',headers,body:JSON.stringify(body)});
  expect((await send({entity_id:id,action:'media_play'})).status).toBe(200);expect(remote.store.get(id)?.state).toBe('playing');expect(bridge.store.get(id)?.state).toBe('paused');
  expect((await send({entity_id:id,action:'media_pause'},{...json,'X-Hemkontroll-Mode':'simulation'})).status).toBe(403);expect(remote.store.get(id)?.state).toBe('playing');
  expect((await send({entity_id:'media_player.other',action:'media_play'})).status).toBe(403);
  expect((await send({entity_id:id,action:'play_media',media_content_id:'arbitrary'})).status).toBe(400);
  expect((await send({entity_id:id,action:'volume_set',volume_level:2})).status).toBe(400);
  expect((await send({entity_id:id,action:'select_source',source:'made-up'})).status).toBe(400);
  remote.store.set(id,'unavailable');expect((await send({entity_id:id,action:'media_pause'})).status).toBe(400);
  await fetch(base+'/dev-api/services/media_player/media_play',{method:'POST',headers:json,body:JSON.stringify({entity_id:id})});expect(bridge.store.get(id)?.state).toBe('playing');expect(remote.store.get(id)?.state).toBe('unavailable');
  expect(JSON.stringify(await fetch(base+'/bridge/api/info').then(r=>r.json()))).not.toContain('fake-secret');
 }finally{for(const server of [bridge,remote]){server.simulation.stop();for(const client of server.webSockets.clients)client.terminate();await new Promise<void>(r=>server.server.close(()=>r()));}await rm(directory,{recursive:true,force:true});}
});
