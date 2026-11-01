import {isLightingEntity} from '../../../shared/ha-contract.js';
import type {HassState} from './types.js';

export type EffectStatus={running:boolean;restoring:boolean;remainingSeconds:number;targetCount:number;message:string};
type Send=(domain:string,service:string,data:Record<string,unknown>)=>Promise<unknown>;
type Snapshot={id:string;on:boolean;brightness?:number};
type Run={id:string;snapshots:Snapshot[];ends:number;phase:number;stopping:boolean;pending?:Promise<void>;timer?:ReturnType<typeof setTimeout>;deadline?:ReturnType<typeof setTimeout>;done?:Promise<void>};

/** Only lighting is eligible; never infer that a general KNX power outlet is a lamp. */
export function halloweenLighting(s:Pick<HassState,'entity_id'|'attributes'>):boolean{return isLightingEntity(s.entity_id,s.attributes);}
/** One bounded, server-owned lighting effect. The browser never schedules physical commands. */
export class HalloweenEffect{
 private run:Run|undefined;private last=new Map<string,EffectStatus>();
 constructor(private send:Send,private random:()=>number=Math.random){}
 status(id:string):EffectStatus{const r=this.run;if(r?.id===id)return{running:true,restoring:r.stopping,remainingSeconds:Math.max(0,Math.ceil((r.ends-Date.now())/1000)),targetCount:r.snapshots.length,message:r.stopping?'Återställer belysningen…':'Halloween pågår'};return this.last.get(id)??{running:false,restoring:false,remainingSeconds:0,targetCount:0,message:''};}
 async start(id:string,ids:string[],states:HassState[],vacuumId?:string){
  if(this.run)throw new Error('En Halloween-effekt körs eller återställs redan.');
  const byId=new Map(states.map(s=>[s.entity_id,s]));
  const selected=[...new Set(ids)].filter(id=>{const s=byId.get(id);return s&&halloweenLighting(s)&&['on','off'].includes(s.state);});
  // A group and its members must never receive contradictory blink commands.
  const leaves=selected.filter(id=>!Array.isArray(byId.get(id)!.attributes.entity_id));
  if(!leaves.length)throw new Error('Ingen vald belysning är tillgänglig.');
  const r:Run={id,snapshots:leaves.map(id=>{const s=byId.get(id)!;return{id,on:s.state==='on',...(typeof s.attributes.brightness==='number'?{brightness:s.attributes.brightness}:{})};}),ends:Date.now()+60000,phase:0,stopping:false};
  this.last.delete(id);this.run=r;r.deadline=setTimeout(()=>{void this.stop(id);},60000);
  r.pending=this.frame(r);await r.pending;
  const vacuum=vacuumId?byId.get(vacuumId):undefined;
  if(!r.stopping&&vacuum&&vacuum.entity_id.startsWith('vacuum.')&&!['unknown','unavailable'].includes(vacuum.state)&&(Number(vacuum.attributes.supported_features)&512)!==0){
   // Locate only, once. No start, pause, fan, or docking commands.
   await this.send('vacuum','locate',{entity_id:vacuum.entity_id}).catch(()=>{this.last.set(id,{running:false,restoring:false,remainingSeconds:0,targetCount:leaves.length,message:'Dammsugarens lokaliseringssignal kunde inte bekräftas.'});});
  }
  return this.status(id);
 }
 private async frame(r:Run){
  if(r.stopping)return;
  const mixed=Math.floor((60000-(r.ends-Date.now()))/10000)%2===1;
  const on:string[]=[],off:string[]=[];
  for(const [i,s]of r.snapshots.entries())((mixed?((i+r.phase)%3!==0)!==(r.phase%2===0):r.phase%2===0)?on:off).push(s.id);
  try{await this.groups(on,'turn_on',off,'turn_off');}
  catch{this.last.set(r.id,{running:false,restoring:false,remainingSeconds:0,targetCount:r.snapshots.length,message:'Blinkningen avbröts efter ett styrfel.'});void this.stop(r.id);return;}
  if(!r.stopping){r.phase++;r.timer=setTimeout(()=>{r.pending=this.frame(r);},900+Math.floor(this.random()*1100));}
 }
 private async groups(a:string[],sa:string,b:string[]=[],sb='turn_off'){
  const jobs:Promise<unknown>[]=[];for(const[ids,service]of [[a,sa],[b,sb]]as const)for(const domain of ['light','switch']){const selected=ids.filter(id=>id.startsWith(domain+'.'));if(selected.length)jobs.push(this.send(domain,service,{entity_id:selected}));}
  const results=await Promise.allSettled(jobs);if(results.some(r=>r.status==='rejected'))throw new Error('Belysningskommandot kunde inte bekräftas.');
 }
 async stop(id?:string):Promise<EffectStatus>{
  const r=this.run;if(!r||id&&id!==r.id)return this.status(id??'');if(r.done){await r.done;return this.status(r.id);}
  r.stopping=true;clearTimeout(r.timer);clearTimeout(r.deadline);
  r.done=(async()=>{
   await r.pending?.catch(()=>{});
   let failed=false;
   // Restore only fields changed by the effect; preserve colors and other user settings.
   const queue=[...r.snapshots];await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{while(queue.length){const s=queue.shift()!;try{await this.send(s.id.split('.')[0]!,s.on?'turn_on':'turn_off',{entity_id:s.id,...(s.on&&s.id.startsWith('light.')&&s.brightness!==undefined?{brightness:s.brightness}:{})});}catch{failed=true;}}}));
   const previous=this.last.get(r.id)?.message;
   this.last.set(r.id,{running:false,restoring:false,remainingSeconds:0,targetCount:r.snapshots.length,message:failed?'Effekten stoppad. Vissa lampor kunde inte återställas.':previous||'Halloween avslutat · belysningen återställd.'});this.run=undefined;
  })();await r.done;return this.status(r.id);
 }
}
