import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {AddressInfo} from 'node:net';
import {createSimulator} from './server.js';
it('records without a browser, preserves history across server restart and guards deletion',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'luba-api-'));let sim=createSimulator({token:'test',dataDirectory:directory});
 async function start(){await new Promise<void>(r=>sim.server.listen(0,'127.0.0.1',r));sim.simulation.stop();return`http://127.0.0.1:${(sim.server.address() as AddressInfo).port}`;}
 async function close(){sim.simulation.stop();sim.webSockets.close();await new Promise<void>(r=>sim.server.close(()=>r()));}
 let base=await start();try{await fetch(base+'/workspace-api/scene');const mower=sim.store.all().find(s=>s.entity_id.startsWith('lawn_mower.'))!;const now=Date.now()-10000;for(let i=0;i<3;i++)sim.store.set(mower.entity_id,'mowing',{local_x:i,local_z:0,position_sampled_at:new Date(now+i*2000).toISOString(),job_id:'persist-test'});let data=await fetch(base+'/workspace-api/learning').then(r=>r.json()) as any;expect(data.stats.samples).toBeGreaterThanOrEqual(3);const count=data.stats.samples,run=data.runs[0].run;await close();sim=createSimulator({token:'test',dataDirectory:directory});base=await start();data=await fetch(base+'/workspace-api/learning').then(r=>r.json());expect(data.stats.samples).toBe(count);expect(data.runs[0].run).toBe(run);expect((await fetch(base+'/workspace-api/learning/runs/'+run,{method:'DELETE'})).status).toBe(400);expect((await fetch(base+'/workspace-api/learning',{headers:{Origin:'https://foreign.example'}})).status).toBe(403);expect((await fetch(base+'/workspace-api/learning/runs/'+run,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:'DELETE'})})).status).toBe(200);expect((await fetch(base+'/dev-api/learning').then(r=>r.json()) as any).stats.samples).toBe(0);}finally{await close();await rm(directory,{recursive:true,force:true});}
});
