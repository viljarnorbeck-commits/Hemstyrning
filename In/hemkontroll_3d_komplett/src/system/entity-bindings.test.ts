import {afterEach,describe,it,expect} from 'vitest';
import {configureSensorBindings,resolveEntity,readState} from './entity-bindings';
import {measurement,stateText} from './overview-data';
import type {HassState} from './types';
afterEach(()=>configureSensorBindings({}));
const state=(id:string,value:string,unit:string,age=0):HassState=>({entity_id:id,state:value,attributes:{unit_of_measurement:unit},last_updated:new Date(Date.now()-age).toISOString()});
describe('shared persisted sensor bindings',()=>{
 it('uses a selected sensor without altering the actual state catalog',()=>{
  configureSensorBindings({sensorBindings:{'sensor.ferroamp_grid_power':'sensor.replacement'}});
  const states=new Map([['sensor.replacement',state('sensor.replacement','1200','W')]]);
  expect(measurement(states,'sensor.ferroamp_grid_power',true,'kW').value).toBe(1.2);
  expect(readState(states,'sensor.ferroamp_grid_power')?.entity_id).toBe('sensor.replacement');
  expect([...states.keys()]).toEqual(['sensor.replacement']);
 });
 it('supports an explicit disconnected binding and restoring defaults',()=>{
  configureSensorBindings({sensorBindings:{'sensor.ferroamp_grid_power':'','$luba':'lawn_mower.actual_luba'}});
  expect(resolveEntity('sensor.ferroamp_grid_power')).toBe('');expect(resolveEntity('$luba')).toBe('lawn_mower.actual_luba');
  configureSensorBindings({});expect(resolveEntity('sensor.ferroamp_grid_power')).toBe('sensor.ferroamp_grid_power');expect(resolveEntity('$luba')).toBe('');
 });
 it('normalizes the verified price unit, never energy into power',()=>{
  const states=new Map([['sensor.price',state('sensor.price','.633','SEK/kWh')],['sensor.energy',state('sensor.energy','2400','Wh')]]);
  expect(measurement(states,'sensor.price',true,'kr/kWh').value).toBe(.633);
  expect(measurement(states,'sensor.energy',true,'kWh').value).toBe(2.4);
  expect(measurement(states,'sensor.energy',true,'kW').value).toBeNull();
 });
 it('keeps authoritative discrete state while still rejecting stale numeric telemetry',()=>{
  const states=new Map([['lock.test',state('lock.test','locked','',86400000)],['sensor.old',state('sensor.old','20','°C',86400000)]]);
  expect(stateText(states,'lock.test',true)).toBe('Låst');
  expect(measurement(states,'sensor.old',true,'°C').status).toBe('Gammal mätning');
 });
});
