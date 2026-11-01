import {it,expect,vi} from 'vitest';
import type {Response} from 'express';
import type {AddressInfo} from 'node:net';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSimulator} from './server.js';

it('resolves every feature deep link to the SPA without swallowing unknown URLs',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'hem-spa-audit-'));
 const s=createSimulator({token:'test-only',dataDirectory:directory});
 // Exercise routing without requiring generated dist files in a clean unit-test checkout.
 const entry=vi.spyOn(s.app.response,'sendFile').mockImplementation(function(this:Response,path:string){
  expect(path.replaceAll('\\','/')).toMatch(/\/dist\/index\.html$/);
  this.type('html').send('test-spa-entry');
 });
 await new Promise<void>(r=>s.server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${(s.server.address() as AddressInfo).port}`;
 try{
  for(const path of ['/control','/energy','/cars','/climate','/lights','/mower','/security','/music','/settings']){
   const response=await fetch(base+path);expect(response.status,path).toBe(200);expect(await response.text(),path).toBe('test-spa-entry');
  }
  expect((await fetch(base+'/not-a-page')).status).toBe(404);
 }finally{
  entry.mockRestore();s.simulation.stop();s.stopScreens();for(const ws of s.webSockets.clients)ws.terminate();s.webSockets.close();
  await new Promise<void>(r=>s.server.close(()=>r()));await rm(directory,{recursive:true,force:true});
 }
});
