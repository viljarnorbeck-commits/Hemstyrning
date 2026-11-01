import {it,expect} from 'vitest';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {localSpotifyDevices} from './spotify-local.js';
import express from 'express';
import {spotifyApi} from './spotify-api.js';
import type {AddressInfo} from 'node:net';
it('lists local idle receivers without Spotify credentials, strips extra fields and rejects stale snapshots',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'spotify-local-'));
 try{
  expect((await localSpotifyDevices(dir)).available).toBe(false);
  const now=Date.now(),file=join(dir,'spotify-local-devices.json');
  await writeFile(file,JSON.stringify({observedAt:now,devices:[{id:'receiver',name:'HT-A9',model:'HT-A9',protocol:'Google Cast',announced:true,lastSeen:now/1000,token:'must-not-leave-server'}]}));
  const result=await localSpotifyDevices(dir,now);expect(result.available).toBe(true);expect(result.devices).toHaveLength(1);expect(result.devices[0].name).toBe('HT-A9');expect(JSON.stringify(result)).not.toContain('must-not-leave-server');
  expect((await localSpotifyDevices(dir,now+31000)).available).toBe(false);
  await writeFile(file,'broken');expect((await localSpotifyDevices(dir,now)).available).toBe(false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('protects local discovery with the existing app role without requiring a Spotify account',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'spotify-local-role-'));
 const app=express();app.use('/spotify-api',spotifyApi(dir,req=>req.headers['x-role']==='viewer'?'viewer':undefined));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 const url='http://127.0.0.1:'+(server.address() as AddressInfo).port+'/spotify-api/local-devices';
 try{
  expect((await fetch(url)).status).toBe(401);
  const response=await fetch(url,{headers:{'x-role':'viewer'}});
  expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toContain('no-store');
  expect(await response.json()).toMatchObject({available:false,devices:[]});
 }finally{await new Promise<void>(r=>server.close(()=>r()));await rm(dir,{recursive:true,force:true});}
});
