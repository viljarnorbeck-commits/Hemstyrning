import {afterEach,expect,it,vi} from 'vitest';
import express from 'express';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {AddressInfo} from 'node:net';
import {spotifyApi} from './spotify-api.js';

afterEach(()=>{vi.unstubAllEnvs();});
it('uses direct Spotify OAuth, persists refresh credentials privately and keeps controls off viewer clients',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hem-spotify-test-'));
 const app=express();app.use(express.json());
 const spotifyCalls:string[]=[];
 const spotifyRequest=vi.fn(async(input:string|URL|Request,init?:RequestInit)=>{
  const url=String(input);spotifyCalls.push(url);
  if(url.endsWith('/api/token'))return new Response(JSON.stringify({access_token:'fake-access',refresh_token:'fake-refresh',expires_in:3600}),{headers:{'Content-Type':'application/json'}});
  if(url.endsWith('/me/player'))return new Response(JSON.stringify({is_playing:true,progress_ms:13000,item:{name:'Testlåten',artists:[{name:'Testartist'}],duration_ms:200000,album:{images:[{url:'https://i.scdn.co/image/test'}]}},device:{id:'device_1',name:'Vardagsrum',volume_percent:30}}),{headers:{'Content-Type':'application/json'}});
  if(url.endsWith('/me/player/devices'))return new Response(JSON.stringify({devices:[{id:'device_1',name:'Vardagsrum',type:'speaker',is_active:true,is_restricted:false,supports_volume:true,volume_percent:30}]}),{headers:{'Content-Type':'application/json'}});
  return new Response(null,{status:204});
 }) as typeof fetch;
 vi.stubEnv('SPOTIFY_CLIENT_ID','client-test');vi.stubEnv('SPOTIFY_CLIENT_SECRET','secret-test');
 vi.stubEnv('SPOTIFY_REDIRECT_URI','http://127.0.0.1:5173/spotify-api/callback');
 app.use('/spotify-api',spotifyApi(directory,req=>req.headers['x-role']==='viewer'?'viewer':'admin',spotifyRequest));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 const base='http://127.0.0.1:'+(server.address() as AddressInfo).port+'/spotify-api';
 try{
  const pre=await fetch(base+'/status',{headers:{'x-role':'viewer'}}).then(r=>r.json());
  expect(pre).toMatchObject({configured:true,connected:false,canControl:false});
  const start=await fetch(base+'/connect',{redirect:'manual'});expect(start.status).toBe(302);
  const authorize=new URL(start.headers.get('location')!);
  const state=authorize.searchParams.get('state')!;
  expect(authorize.host).toBe('accounts.spotify.com');
  expect(authorize.searchParams.get('scope')).toContain('user-modify-playback-state');
  expect((await fetch(base+'/callback?state=bad&code=wrong')).status).toBe(400);
  const done=await fetch(base+'/callback?state='+state+'&code=valid',{redirect:'manual'});
  expect(done.status).toBe(302);
  const stored=JSON.parse(await readFile(join(directory,'spotify-account.json'),'utf8'));
  expect(stored.refresh_token).toBe('fake-refresh');
  const before=await fetch(base+'/playback').then(r=>r.json());
  expect(before.track.name).toBe('Testlåten');
  expect(before.track.cover).toContain('i.scdn.co');
  expect((await fetch(base+'/command',{method:'POST',headers:{'content-type':'application/json','x-role':'viewer'},body:JSON.stringify({action:'pause'})})).status).toBe(403);
  expect((await fetch(base+'/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'arbitrary'})})).status).toBe(400);
  expect((await fetch(base+'/command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'pause'})})).status).toBe(200);
  expect(spotifyCalls.some(u=>u.endsWith('/me/player/pause'))).toBe(true);
  expect(JSON.stringify(before)).not.toContain('fake-access');
  expect(JSON.stringify(before)).not.toContain('fake-refresh');
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(directory,{force:true,recursive:true});}
});
