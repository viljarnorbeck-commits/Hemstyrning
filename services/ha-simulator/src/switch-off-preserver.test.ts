import {it,expect} from 'vitest';
import {SwitchOffPreserver} from './switch-off-preserver.js';
import type {HassState} from './types.js';
const primary='switch.altan',bron='switch.bron',posts='switch.stolpar';
const noWait=async()=>{};
const rows=(values:Record<string,string>)=>Object.entries(values).map(([entity_id,state])=>({entity_id,state,attributes:{}}as HassState));

it('restores only changed companions to the snapshot while leaving the primary off',async()=>{
 const values:Record<string,string>={[primary]:'on',[bron]:'on',[posts]:'off'},calls:string[][]=[];
 const guard=new SwitchOffPreserver(async()=>rows(values),async(id,service)=>{calls.push([id,service]);values[id]=service==='turn_on'?'on':'off';if(id===primary){values[bron]='off';values[posts]='off';}},noWait);
 await guard.run(primary,[bron,posts]);
 expect(calls).toEqual([[primary,'turn_off'],[bron,'turn_on']]);expect(values).toEqual({[primary]:'off',[bron]:'on',[posts]:'off'});expect(guard.busy([primary,bron,posts])).toBe(false);
});
it('does not send a primary command when a companion has an unknown state',async()=>{
 const calls:string[]=[];const guard=new SwitchOffPreserver(async()=>rows({[primary]:'on',[bron]:'unavailable'}),async id=>{calls.push(id);},noWait);
 await expect(guard.run(primary,[bron])).rejects.toThrow('kända på/av');expect(calls).toEqual([]);expect(guard.busy([primary,bron])).toBe(false);
});
it('reports feedback that re-enables the primary without retrying in a loop',async()=>{
 const values:Record<string,string>={[primary]:'on',[bron]:'on'},calls:string[]=[];
 const guard=new SwitchOffPreserver(async()=>rows(values),async(id,service)=>{calls.push(id);values[id]=service==='turn_on'?'on':'off';if(id===primary)values[bron]='off';else values[primary]='on';},noWait);
 await expect(guard.run(primary,[bron])).rejects.toThrow('KNX-kopplingen');expect(calls).toEqual([primary,bron]);expect(guard.busy([primary,bron])).toBe(false);
});
it('locks all participating entities for the duration of one command',async()=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve),values:Record<string,string>={[primary]:'on',[bron]:'off'};
 const guard=new SwitchOffPreserver(async()=>{await gate;return rows(values);},async(id,service)=>{values[id]=service==='turn_on'?'on':'off';},noWait);
 const pending=guard.run(primary,[bron]);expect(guard.busy([bron])).toBe(true);await expect(guard.run(primary,[bron])).rejects.toThrow('återställs');release();await pending;expect(guard.busy([primary,bron])).toBe(false);
});
