import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { createSimulator } from './server.js';
import { defaultScene } from './scene-config.js';
let directory: string;
let base: string;
let simulator: ReturnType<typeof createSimulator>;
async function start() {
  simulator = createSimulator({ token:'test',commandDelayMs:1,dataDirectory:directory });
  await new Promise<void>(resolve => simulator.server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${(simulator.server.address() as AddressInfo).port}`;
}
async function stop() { simulator.webSockets.clients.forEach(ws=>ws.terminate()); simulator.webSockets.close(); await new Promise<void>(resolve=>simulator.server.close(()=>resolve())); }
beforeEach(async()=>{directory=await mkdtemp(join(tmpdir(),'hemkontroll-scene-'));await start();});
afterEach(async()=>{await stop(); await rm(directory,{recursive:true,force:true});});
const json = {'Content-Type':'application/json'};
function glb(document: object) {
  let text=JSON.stringify(document); while(Buffer.byteLength(text)%4) text+=' ';
  const data=Buffer.alloc(20+Buffer.byteLength(text)); data.write('glTF');data.writeUInt32LE(2,4);data.writeUInt32LE(data.length,8);data.writeUInt32LE(Buffer.byteLength(text),12);data.writeUInt32LE(0x4e4f534a,16);data.write(text,20);return data;
}
describe('persistent workspace and calibrated scene',()=>{
  it('saves all four calibrations and independent object properties across a server restart',async()=>{
    const config=defaultScene();
    config.sensorBindings={'sensor.ferroamp_grid_power':'sensor.verified_grid','$luba':'','$ev6Battery':'sensor.actual_battery'};
    config.startView={position:[20,15,30],target:[2,1,3],zoom:1.25,fov:48};
    config.models['winter']!.position=[12,4,19];config.models['winter']!.rotation=[-90,45,0];config.models['winter']!.scale=1.7;
    config.objects[0]!.placementConfirmed=false;config.objects[0]!.position=[3,5,7];config.objects[0]!.angle=35;config.bindings.lux='sensor.custom_lux';
    expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:json,body:JSON.stringify(config)})).status).toBe(200);
    await stop();await start();
    expect(await fetch(`${base}/workspace-api/scene`).then(r=>r.json())).toEqual(config);
  });
  it('validates missing slots, duplicate objects, numeric limits and foreign-origin writes',async()=>{
    const config=defaultScene();config.objects.push(structuredClone(config.objects[0]!));
    expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:json,body:JSON.stringify(config)})).status).toBe(400);
    const missing=defaultScene();delete missing.models['winter'];
    expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:json,body:JSON.stringify(missing)})).status).toBe(400);
    const invalid=defaultScene();invalid.models['summer']!.scale=-1;
    expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:json,body:JSON.stringify(invalid)})).status).toBe(400);
    expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:{...json,Origin:'https://foreign.example'},body:JSON.stringify(defaultScene())})).status).toBe(403);
  });
  it('imports embedded GLB content by hash and keeps it across restarts',async()=>{
    const data=glb({asset:{version:'2.0'},scene:0,scenes:[{}]});
    const response=await fetch(`${base}/workspace-api/models`,{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:data});
    expect(response.status).toBe(201);const result=await response.json() as {url:string};
    await stop();await start();const stored=await fetch(`${base}${result.url}`).then(r=>r.arrayBuffer());
    expect(Buffer.from(stored)).toEqual(data);
    const external=glb({asset:{version:'2.0'},buffers:[{uri:'https://foreign.example/data.bin'}]});
    expect((await fetch(`${base}/workspace-api/models`,{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:external})).status).toBe(400);
  });
});
describe('shared simulator/live command boundary',()=>{
  it('rejects simulation commands and unconfigured entities and accepts one configured confirmed lamp',async()=>{
    const send=(entity:string,mode:string)=>fetch(`${base}/bridge/api/services/light/turn_on`,{method:'POST',headers:{...json,'X-Hemkontroll-Mode':mode},body:JSON.stringify({entity_id:entity})});
    expect((await send('light.altan','simulation')).status).toBe(403);
    expect(simulator.store.get('light.altan')!.state).toBe('off');
    expect((await send('light.not_configured','live')).status).toBe(403);
    expect((await send('light.altan','live')).status).toBe(200);
    expect(simulator.store.get('light.altan')!.state).toBe('on');
    expect(await fetch(`${base}/bridge/api/info`).then(r=>r.json())).toEqual({mode:'simulator',commandsEnabled:true,controlBlockReason:null});
  });
  it('supports environment changes over the shared read-only WebSocket without exposing a token',async()=>{
    const ws=new WebSocket(base.replace('http:','ws:')+'/bridge/ws');
    const messages: Record<string,unknown>[]=[];
    ws.on('message',raw=>messages.push(JSON.parse(raw.toString()) as Record<string,unknown>));
    await new Promise<void>(resolve=>ws.once('open',resolve));
    await waitFor(()=>messages.some(m=>m.type==='auth_required'));
    ws.send(JSON.stringify({type:'auth',access_token:'local-bridge'}));
    await waitFor(()=>messages.some(m=>m.type==='auth_ok'));
    ws.send(JSON.stringify({id:1,type:'subscribe_events',event_type:'state_changed'}));
    await waitFor(()=>messages.some(m=>m.id===1));
    simulator.store.set('weather.home','snowy',{cloud_coverage:100});
    await waitFor(()=>messages.some(m=>m.type==='event'));
    ws.send(JSON.stringify({id:2,type:'call_service',domain:'light',service:'turn_on',service_data:{entity_id:'light.altan'}}));
    await waitFor(()=>messages.some(m=>m.id===2));
    expect(messages.find(m=>m.id===2)).toMatchObject({success:false});
    expect(simulator.store.get('light.altan')!.state).toBe('off');ws.close();
  });
});
async function waitFor(predicate:()=>boolean) { const end=Date.now()+2000;while(!predicate()){if(Date.now()>end)throw new Error('WS timeout');await new Promise(resolve=>setTimeout(resolve,5));} }

describe('real HA gateway contract using an isolated HA test double',()=>{
  it('defaults real connections to read-only for every command route',async()=>{
    await stop();
    simulator=createSimulator({token:'test',dataDirectory:directory,live:{url:'http://127.0.0.1:1',token:'not-a-real-token'}});
    await new Promise<void>(resolve=>simulator.server.listen(0,'127.0.0.1',resolve));
    base=`http://127.0.0.1:${(simulator.server.address() as AddressInfo).port}`;
    for(const path of ['lighting','commands','services/light/turn_on','media']){
      const response=await fetch(`${base}/bridge/api/${path}`,{method:'POST',headers:{...json,'X-Hemkontroll-Mode':'live'},body:JSON.stringify({on:true,entity_id:'light.altan'})});
      expect(response.status).toBe(403);
      expect(await response.text()).not.toContain('not-a-real-token');
    }
    expect((await fetch(`${base}/dev-api/states`)).status).toBe(200);
  });

  it('shares the same REST/WS interface, keeps credentials server-side and blocks simulation writes',async()=>{
    const remote=createSimulator({token:'remote-secret',commandDelayMs:1,dataDirectory:join(directory,'remote')});
    await new Promise<void>(resolve=>remote.server.listen(0,'127.0.0.1',resolve));
    const target=`http://127.0.0.1:${(remote.server.address() as AddressInfo).port}`;
    await stop();
    simulator=createSimulator({token:'test',commandDelayMs:1,dataDirectory:directory,live:{url:target,token:'remote-secret',commandsEnabled:true}});
    await new Promise<void>(resolve=>simulator.server.listen(0,'127.0.0.1',resolve));
    base=`http://127.0.0.1:${(simulator.server.address() as AddressInfo).port}`;
    let ws: WebSocket | undefined;
    try {
      expect(await fetch(`${base}/bridge/api/info`).then(r=>r.json())).toEqual({mode:'home-assistant',commandsEnabled:true,controlBlockReason:null});
      const send=(mode:string)=>fetch(`${base}/bridge/api/services/light/turn_on`,{method:'POST',headers:{...json,'X-Hemkontroll-Mode':mode},body:JSON.stringify({entity_id:'light.altan'})});
      expect((await send('simulation')).status).toBe(403);expect(remote.store.get('light.altan')!.state).toBe('off');
      expect((await send('live')).status).toBe(200);expect(remote.store.get('light.altan')!.state).toBe('on');
      expect(simulator.store.get('light.altan')!.state).toBe('off');
      // Developer mutations stay in the simulator even while the main bridge is live.
      await fetch(`${base}/dev-api/services/light/turn_on`,{method:'POST',headers:json,body:JSON.stringify({entity_id:'light.garage'})});
      expect(simulator.store.get('light.garage')!.state).toBe('on');
      expect(remote.store.get('light.garage')!.state).toBe('off');
      await fetch(`${base}/dev-api/scenario`,{method:'POST',headers:json,body:JSON.stringify({id:'blizzard'})});
      expect(simulator.store.get('weather.home')!.attributes.snow_intensity).toBe(1);
      expect(remote.store.get('weather.home')!.attributes.snow_intensity).toBe(0);
      ws=new WebSocket(base.replace('http:','ws:')+'/bridge/ws');
      const messages: Record<string,unknown>[]=[];
      ws.on('message',raw=>messages.push(JSON.parse(raw.toString()) as Record<string,unknown>));
      await waitFor(()=>messages.some(m=>m.type==='auth_ok'));
      ws.send(JSON.stringify({id:1,type:'get_states'}));
      await waitFor(()=>messages.some(m=>m.id===1));
      expect(JSON.stringify(messages)).not.toContain('remote-secret');
      expect(messages.find(m=>m.id===1)).toMatchObject({success:true});
      ws.send(JSON.stringify({id:2,type:'call_service',domain:'light',service:'turn_off',service_data:{entity_id:'light.altan'}}));
      await waitFor(()=>messages.some(m=>m.id===2));
      expect(messages.find(m=>m.id===2)).toMatchObject({success:false});
      expect(remote.store.get('light.altan')!.state).toBe('on');
    } finally {
      ws?.terminate();remote.webSockets.clients.forEach(client=>client.terminate());remote.webSockets.close();
      await new Promise<void>(resolve=>remote.server.close(()=>resolve()));
    }
  });
});
it('persists separate assets, panoramas and ENU control points, and rejects non-panoramic images',async()=>{
 const sharp=(await import('sharp')).default;
 const image=await sharp({create:{width:512,height:256,channels:3,background:'#4e82ae'}}).png().toBuffer();
 const response=await fetch(`${base}/workspace-api/panoramas`,{method:'POST',headers:{'Content-Type':'image/png'},body:image});expect(response.status).toBe(201);const panorama=await response.json() as {url:string};
 const config=defaultScene();config.panoramas=[{id:'test-sky',name:'Synthetic test sky',url:panorama.url,north:12,capturedAt:'2026-10-27T12:00:00+01:00',exposure:1,saturation:1,minElevation:10,maxElevation:90,minCloud:0,maxCloud:.3,containsSun:true,sunAzimuth:180,sunElevation:20,maskRadius:8}];
 config.geography.points=[{world:[1,2,3],geo:{latitude:63.18,longitude:14.64,altitude:350}}];
 config.objects[0]!.trackingOffset=[1,0,2];
 expect((await fetch(`${base}/workspace-api/scene`,{method:'PUT',headers:json,body:JSON.stringify(config)})).status).toBe(200);await stop();await start();expect(await fetch(`${base}/workspace-api/scene`).then(r=>r.json())).toEqual(config);expect(Buffer.from(new Uint8Array(await fetch(base+panorama.url).then(r=>r.arrayBuffer()) as ArrayBuffer))).toEqual(image);
 const wrong=await sharp({create:{width:512,height:512,channels:3,background:'white'}}).png().toBuffer();expect((await fetch(`${base}/workspace-api/panoramas`,{method:'POST',headers:{'Content-Type':'image/png'},body:wrong})).status).toBe(400);
});
it('stores private generated start images and persists photo/energy settings across restart',async()=>{
 const sharp=(await import('sharp')).default;const png=await sharp({create:{width:800,height:600,channels:4,background:'#182231'}}).png().toBuffer();
 const image=await fetch(base+'/workspace-api/start-images',{method:'POST',headers:{'Content-Type':'image/png'},body:png});expect(image.status).toBe(201);const data=await image.json();expect((await fetch(base+data.url)).status).toBe(200);
 expect((await fetch(base+'/workspace-api/start-images',{method:'POST',headers:{'Content-Type':'image/png'},body:'bad'})).status).toBe(400);
 const c=defaultScene();c.startView={position:[30,20,30],target:[0,0,0],zoom:1,fov:48};c.startMode='photo';c.startPhoto={url:data.url,signature:'test-visual-fingerprint',createdAt:new Date().toISOString(),width:800,height:600,view:c.startView};c.energyRoutes=[{id:'grid',name:'Nät till hus',points:[[0,-.5,0],[10,-.5,0]],sensor:'sensor.house_power',unit:'kW',color:'#ffb23f',kind:'grid',confirmed:false}];
 expect((await fetch(base+'/workspace-api/scene',{method:'PUT',headers:json,body:JSON.stringify(c)})).status).toBe(200);await stop();await start();const saved=await fetch(base+'/workspace-api/scene').then(r=>r.json());expect(saved.startPhoto).toEqual(c.startPhoto);expect(saved.energyRoutes).toEqual(c.energyRoutes);expect((await fetch(base+data.url)).status).toBe(200);
});
