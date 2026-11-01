import {it,expect} from 'vitest';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {localSpotifyDevices,activateLocalSpotify} from './spotify-local.js';
import express from 'express';
import {spotifyApi} from './spotify-api.js';
import type {AddressInfo} from 'node:net';
it('validates local activation before loading credentials and keeps capabilities private',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'spotify-activation-'));let credentialsRead=false;
 try{
  const row={id:'a'.repeat(24),name:'Speaker',model:'',protocol:'Spotify Connect',announced:true,lastSeen:1,spotifyId:'receiver',activationSupported:true};
  const snapshot={observedAt:Date.now(),devices:[row],activationPort:8767,activationKey:'k'.repeat(40)};
  await writeFile(join(dir,'spotify-local-devices.json'),JSON.stringify(snapshot));
  const publicData=await localSpotifyDevices(dir);expect(JSON.stringify(publicData)).not.toContain(snapshot.activationKey);
  expect(publicData.devices[0]).toMatchObject({activationSupported:true});
  const credentials=async()=>{credentialsRead=true;return {accessToken:'test-only',username:'test-user'};};
  await expect(activateLocalSpotify(dir,'discovered-invalid',credentials)).rejects.toThrow();expect(credentialsRead).toBe(false);
  const request=(async(url:any,init:any)=>{expect(String(url)).toBe('http://127.0.0.1:8767/activate');expect(init.redirect).toBe('error');expect(JSON.parse(init.body).id).toBe(row.id);return new Response(JSON.stringify({deviceId:'receiver'}));}) as typeof fetch;
  expect(await activateLocalSpotify(dir,'discovered-'+row.id,credentials,request)).toBe('receiver');
 }finally{await rm(dir,{recursive:true,force:true});}
});
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
