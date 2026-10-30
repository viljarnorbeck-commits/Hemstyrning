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

it('restores login after restart, refreshes SDK access privately and restricts token delivery',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hem-sdk-token-'));
 const {writeFile,stat}=await import('node:fs/promises');
 await writeFile(join(directory,'spotify-account.json'),JSON.stringify({access_token:'expired',refresh_token:'private-refresh',expires_at:0,scope:'streaming user-read-email user-read-private'}),{mode:0o600});
 let refreshes=0;const calls:any[]=[];
 const request=vi.fn(async(_url:unknown,init?:RequestInit)=>{if(String(_url).includes('/api/token')){refreshes++;return new Response(JSON.stringify({access_token:'sdk-ephemeral',expires_in:3600}),{headers:{'content-type':'application/json'}});}calls.push(JSON.parse(String(init?.body??'{}')));return new Response(null,{status:204});}) as typeof fetch;
 vi.stubEnv('SPOTIFY_CLIENT_ID','test');vi.stubEnv('SPOTIFY_CLIENT_SECRET','test-secret');vi.stubEnv('SPOTIFY_REDIRECT_URI','http://127.0.0.1:5173/spotify-api/callback');
 let server:ReturnType<ReturnType<typeof express>['listen']>,base='';
 const start=async()=>{const app=express();app.use(express.json());app.use('/spotify-api',spotifyApi(directory,req=>req.headers['x-role'] as 'viewer'|'controller'|'admin'|undefined,request));server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));base='http://127.0.0.1:'+(server.address() as AddressInfo).port+'/spotify-api';};
 const stop=()=>new Promise<void>(r=>server.close(()=>r()));
 const headers={'content-type':'application/json','x-role':'controller'};
 try{await start();
  expect((await fetch(base+'/sdk-token',{method:'POST',headers:{...headers,'x-role':'viewer'},body:'{}'})).status).toBe(403);
  expect((await fetch(base+'/sdk-token',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status).toBe(401);
  expect((await fetch(base+'/sdk-token',{method:'POST',headers:{...headers,origin:'https://attacker.invalid'},body:'{}'})).status).toBe(403);
  const result=await fetch(base+'/sdk-token',{method:'POST',headers,body:'{}'});expect(result.status).toBe(200);expect(result.headers.get('cache-control')).toContain('no-store');expect(await result.json()).toMatchObject({accessToken:'sdk-ephemeral'});expect(refreshes).toBe(1);
  const status=await fetch(base+'/status',{headers:{'x-role':'viewer'}}).then(r=>r.json());expect(status).toMatchObject({connected:true,webPlaybackAuthorized:true});expect(JSON.stringify(status)).not.toMatch(/sdk-ephemeral|private-refresh/);
  expect((await stat(join(directory,'spotify-account.json'))).mode&0o777).toBe(0o600);
  await stop();await start();expect((await fetch(base+'/status',{headers}).then(r=>r.json())).connected).toBe(true);
  expect((await fetch(base+'/sdk-token',{method:'POST',headers,body:'{}'})).status).toBe(200);expect(refreshes).toBe(1);
  expect((await fetch(base+'/command',{method:'POST',headers,body:JSON.stringify({action:'transfer',deviceId:'browser-new',play:true})})).status).toBe(200);expect(calls.at(-1)).toMatchObject({device_ids:['browser-new'],play:true});
  expect((await fetch(base+'/disconnect',{method:'POST',headers:{...headers,'x-role':'admin'},body:'{}'})).status).toBe(200);expect((await fetch(base+'/sdk-token',{method:'POST',headers,body:'{}'})).status).toBe(409);
 }finally{await stop();await rm(directory,{recursive:true,force:true});}
});

it('does not resurrect disconnected credentials when a refresh is already in flight',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hem-sdk-logout-'));const {writeFile}=await import('node:fs/promises');
 await writeFile(join(directory,'spotify-account.json'),JSON.stringify({access_token:'expired',refresh_token:'refresh',expires_at:0,scope:'streaming'}));
 vi.stubEnv('SPOTIFY_CLIENT_ID','test');vi.stubEnv('SPOTIFY_CLIENT_SECRET','secret');vi.stubEnv('SPOTIFY_REDIRECT_URI','http://127.0.0.1:5173/spotify-api/callback');
 let begin!:()=>void,release!:()=>void;const started=new Promise<void>(r=>begin=r),finish=new Promise<void>(r=>release=r);
 const request=(async()=>{begin();await finish;return new Response(JSON.stringify({access_token:'must-not-resurrect',expires_in:3600}));}) as typeof fetch;
 const app=express();app.use(express.json());app.use('/spotify-api',spotifyApi(directory,()=> 'admin',request));const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const base='http://127.0.0.1:'+(server.address() as AddressInfo).port+'/spotify-api',headers={'content-type':'application/json'};
 try{const pending=fetch(base+'/sdk-token',{method:'POST',headers,body:'{}'});await started;await fetch(base+'/disconnect',{method:'POST',headers,body:'{}'});release();expect((await pending).status).toBe(409);expect((await fetch(base+'/status').then(r=>r.json())).connected).toBe(false);await expect(readFile(join(directory,'spotify-account.json'))).rejects.toThrow();}
 finally{release();await new Promise<void>(r=>server.close(()=>r()));await rm(directory,{recursive:true,force:true});}
});
