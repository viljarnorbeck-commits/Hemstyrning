import {describe,it,expect} from 'vitest';
import {deviceRegistry,discoveredLight,lightCapabilities,controlReason} from './device-registry';
import {controlDevices} from './control-devices';
import type {HassState,SceneConfig} from './types';
const state=(id='light.new'):HassState=>({entity_id:id,state:'off',attributes:{friendly_name:'Ny lampa',supported_color_modes:['brightness']},last_updated:new Date().toISOString()});
const config=(objects=[])=>({objects} as unknown as SceneConfig);
describe('one saved and discovered device registry',()=>{
 it('keeps hidden saved and discovered lights out of lists until restored, without hiding other unavailable lights',()=>{
  const old=state('light.old'),discovered=state('light.discovered'),other={...state('light.other'),state:'unavailable'};
  const scene=config([discoveredLight(old)] as never[]);scene.entityPreferences=Object.fromEntries([old,discovered].map(s=>[s.entity_id,{control:true,details:false,allowCommands:false,hidden:true}]));
  const states=new Map([old,discovered,other].map(s=>[s.entity_id,s]));
  expect(deviceRegistry(scene,states,'home-assistant').map(o=>o.entityId)).toEqual(['light.other']);
  expect(scene.objects).toHaveLength(1);
  scene.entityPreferences[old.entity_id]!.hidden=false;
  expect(deviceRegistry(scene,states,'home-assistant').map(o=>o.entityId)).toEqual(['light.old','light.other']);
 });
 it('does not re-add hidden lights through saved-object fallbacks or selected control preferences',()=>{
  const s=state('light.hidden'),scene=config([discoveredLight(s)] as never[]);scene.entityPreferences={[s.entity_id]:{control:true,details:true,allowCommands:true,hidden:true}};
  expect(controlDevices(scene,new Map([[s.entity_id,s]]),'home-assistant').some(o=>o.entityId===s.entity_id)).toBe(false);
  expect(controlDevices(scene,new Map(),'home-assistant').some(o=>o.entityId===s.entity_id)).toBe(false);
 });
 it('discovers a light without guessing any position and can resolve its displayed identity',()=>{const s=state(),list=deviceRegistry(config(),new Map([[s.entity_id,s]]),'home-assistant');expect(list[0]).toMatchObject({id:'ha-light.new',entityId:'light.new',placementConfirmed:false});expect(list.find(v=>v.id==='ha-light.new')?.entityId).toBe('light.new');});
 it('keeps the saved identity and binding without duplicating the discovered light',()=>{const s=state(),o={...discoveredLight(s),id:'saved-light',bindings:{power:'sensor.power'}};const list=deviceRegistry(config([o] as never[]),new Map([[s.entity_id,s]]),'home-assistant');expect(list).toEqual([o]);});
 it('does not need a pre-existing light template and never synthesizes a confirmed state',()=>{const s=state();s.state='unavailable';const states=new Map([[s.entity_id,s]]);expect(deviceRegistry(config(),states,'simulator')).toHaveLength(1);expect(states.get(s.entity_id)?.state).toBe('unavailable');});
 it('requires connectivity, permission, explicit persistence and an available confirmed state',()=>{const s=state();expect(controlReason(false,true,s,true)).toContain('frånkopplad');expect(controlReason(true,false,s,true)).toContain('Skrivskyddad');expect(controlReason(true,true,s,false)).toContain('Spara');expect(controlReason(true,true,{...s,state:'unavailable'},true)).toContain('otillgänglig');expect(controlReason(true,true,s,true)).toBe('');});
 it('shows only supported brightness, color and temperature controls',()=>{expect(lightCapabilities({...state(),attributes:{supported_color_modes:['onoff']}})).toEqual({brightness:false,color:false,temperature:false});expect(lightCapabilities(state())).toEqual({brightness:true,color:false,temperature:false});expect(lightCapabilities({...state(),attributes:{supported_color_modes:['rgb','color_temp']}})).toEqual({brightness:true,color:true,temperature:true});});
});
