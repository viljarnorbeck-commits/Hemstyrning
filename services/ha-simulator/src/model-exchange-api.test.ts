import {it,expect} from 'vitest';
import express from 'express';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import type {AddressInfo} from 'node:net';
import {workspaceApi} from './workspace-api.js';
it('commits models once, preserves device/light configuration and protects imports from stale scene saves',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hem-exchange-api-')),workspace=workspaceApi(directory),app=express();app.use(express.json({limit:'2mb'}));app.use(workspace.router);
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.on('listening',resolve));const base=`http://127.0.0.1:${(server.address()as AddressInfo).port}`,headers={'Content-Type':'application/json'};
 const post=(url:string,data:unknown)=>fetch(base+url,{method:'POST',headers,body:JSON.stringify(data)});
 try{
  const scene=await fetch(base+'/scene').then(r=>r.json()),original=structuredClone(scene),hash='a'.repeat(64),model=scene.models[scene.activeModel];
  scene.modelExchange={frame:{schemaVersion:1,id:'hemstyrning-yard-'+hash.slice(0,16),units:'existing-yard-unit',gpsVerified:false,createdAt:new Date().toISOString(),baseline:{sha256:hash,model,bounds:{min:[0,0,0],max:[10,10,10]}},anchors:[[0,0,0],[10,0,0],[0,0,10]].map((world,i)=>({id:'reference-'+i,world,baselineSource:world})),maxAnchorError:.05},imports:[]};
  expect((await fetch(base+'/scene',{method:'PUT',headers,body:JSON.stringify(scene)})).status).toBe(200);
  const json=Buffer.from(JSON.stringify({asset:{version:'2.0'}}).padEnd(32,' ')),glb=Buffer.alloc(20+json.length);glb.write('glTF');glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(json.length,12);glb.writeUInt32LE(0x4e4f534a,16);json.copy(glb,20);
  const upload=await fetch(base+'/models',{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:glb}).then(r=>r.json()),state=await fetch(base+'/model-exchange').then(r=>r.json());
  const activation={expectedModelRevision:state.modelRevision,frameId:scene.modelExchange.frame.id,version:'v1',publishedAt:'2026-11-02T12:00:00Z',manifestSha256:hash,calibrationSha256:hash,sourceSha256:createHash('sha256').update(glb).digest('hex'),model:{...model,url:upload.url,label:'v1 · ofullständig'},complete:false,seasons:[scene.activeModel]};
  expect((await post('/model-exchange/activate',activation)).status).toBe(200);expect((await post('/model-exchange/activate',activation)).status).toBe(200);
  let saved=await fetch(base+'/scene').then(r=>r.json());expect(saved.modelExchange.imports).toHaveLength(1);expect(saved.models[saved.activeModel].url).toBe(upload.url);expect(saved.models[saved.activeModel].fallback.url).toBe(model.url);
  for(const key of ['objects','bindings','appearance','location','geography'])expect(saved[key]).toEqual(original[key]);
  expect((await post('/model-exchange/activate',{...activation,manifestSha256:'b'.repeat(64)})).status).toBe(409);
  original.objects[0].name='User edit';expect((await fetch(base+'/scene',{method:'PUT',headers,body:JSON.stringify(original)})).status).toBe(200);
  saved=await fetch(base+'/scene').then(r=>r.json());expect(saved.objects[0].name).toBe('User edit');expect(saved.models[saved.activeModel].url).toBe(upload.url);expect(saved.modelExchange.imports).toHaveLength(1);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));workspace.close();await rm(directory,{recursive:true,force:true});}
});
