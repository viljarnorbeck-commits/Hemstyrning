import {setTimeout as pause} from 'node:timers/promises';
import type {HassState} from './types.js';

/** A single bounded command transaction, never a background state automation. */
export class SwitchOffPreserver{
 private locked=new Set<string>();
 constructor(private read:(signal:AbortSignal)=>Promise<HassState[]>,private send:(id:string,service:'turn_on'|'turn_off',signal:AbortSignal)=>Promise<void>,private wait:(ms:number,signal:AbortSignal)=>Promise<unknown>=(ms,signal)=>pause(ms,undefined,{signal})){}
 busy(ids:readonly string[]){return ids.some(id=>this.locked.has(id));}
 async run(id:string,preserve:readonly string[]){
  const ids=[id,...preserve];if(this.busy(ids))throw Error('Belysningen återställs just nu. Vänta tills kommandot är klart.');
  ids.forEach(key=>this.locked.add(key));const signal=AbortSignal.timeout(8000);
  try{
   const before=new Map((await this.read(signal)).map(s=>[s.entity_id,s.state]));
   if(ids.some(key=>!['on','off'].includes(before.get(key)??'')))throw Error('Altan, Bron och Ute stolpar måste ha kända på/av-lägen innan altanen kan släckas.');
   await this.send(id,'turn_off',signal);
   // KNX group feedback follows the primary telegram with a short delay.
   await this.wait(450,signal);
   let current=new Map((await this.read(signal)).map(s=>[s.entity_id,s.state]));
   for(let attempt=0;current.get(id)!=='off'&&attempt<2;attempt++){
    await this.wait(200,signal);current=new Map((await this.read(signal)).map(s=>[s.entity_id,s.state]));
   }
   if(current.get(id)!=='off')throw Error('Altanens avstängning bekräftades inte. Ingen återställning har skickats.');
   for(const other of preserve){
    if(!['on','off'].includes(current.get(other)??''))throw Error('Ett skyddat ljus blev otillgängligt. Återställningen kunde inte slutföras.');
    if(current.get(other)!==before.get(other))await this.send(other,before.get(other)==='on'?'turn_on':'turn_off',signal);
   }
   await this.wait(300,signal);
   const after=new Map((await this.read(signal)).map(s=>[s.entity_id,s.state]));
   if(preserve.some(other=>after.get(other)!==before.get(other)))throw Error('Altanen släcktes men Bron eller Ute stolpar kunde inte bekräftas återställda. Kontrollera deras verkliga lägen.');
   if(after.get(id)!=='off')throw Error('De andra ljusen återställdes, men altanen rapporterar på igen. KNX-kopplingen behöver kontrolleras; ingen ny växlingsslinga startades.');
  }catch(error){if(signal.aborted)throw Error('Återställningen hann inte bekräftas. Kontrollera altanens, Brons och stolparnas verkliga lägen.');throw error;}
  finally{ids.forEach(key=>this.locked.delete(key));}
 }
}
