import {it,expect} from 'vitest';
import {YardWindowLighting} from './yard-window-lighting';
import {yardWindowProfile,windowLightOutput} from './yard-window-state';
import surfacesText from './calibration/kyrkas-window-surfaces.json?raw';
import type {SceneConfig,HassState} from './types';
const surfaces=JSON.parse(surfacesText);
const kitchen=yardWindowProfile.windows.find(w=>w.id==='kitchen-both')!;
const hall=yardWindowProfile.windows.find(w=>w.id==='hall-stairs')!;
const state=(entity_id:string,value:string,brightness?:number):HassState=>({entity_id,state:value,last_updated:new Date().toISOString(),attributes:brightness===undefined?{}:{brightness}});
const config=(hash=surfaces.modelSha256)=>({activeModel:'autumn',models:{autumn:{url:`/workspace-api/models/${hash}.glb`}}}) as SceneConfig;
it('keeps kitchen and hall independent and never lights panes from unknown or disconnected states',()=>{
 const states=new Map(kitchen.bindings.map(b=>[b.entityId,state(b.entityId,'on')]));
 expect(windowLightOutput(kitchen,states,true)).toBe(1);expect(windowLightOutput(hall,states,true)).toBe(0);expect(windowLightOutput(kitchen,states,false)).toBe(0);
 states.set(kitchen.bindings[0].entityId,state(kitchen.bindings[0].entityId,'unavailable'));
 expect(windowLightOutput(kitchen,states,true)).toBeCloseTo(.4);
 states.set(kitchen.bindings[1].entityId,state(kitchen.bindings[1].entityId,'on',0));expect(windowLightOutput(kitchen,states,true)).toBe(0);
});
it('hides registered 3D panes after disconnect or model replacement, retaining the other room state',()=>{
 const rig=new YardWindowLighting(),states=new Map(kitchen.bindings.map(b=>[b.entityId,state(b.entityId,'on')]));
 try{
  rig.configure(config());rig.update(states,true,60);
  expect(rig.root.getObjectByName('kitchen-both')!.visible).toBe(true);expect(rig.root.getObjectByName('hall-stairs')!.visible).toBe(false);
  rig.update(states,false,60);expect(rig.root.children.every(c=>!c.visible)).toBe(true);
  rig.configure(config('0'.repeat(64)));rig.update(states,true,60);expect(rig.root.children.every(c=>!c.visible)).toBe(true);
 }finally{rig.dispose();}
});
