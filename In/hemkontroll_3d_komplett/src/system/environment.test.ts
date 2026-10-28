import { describe, expect, it } from 'vitest';
import { automaticSeason, damp, environmentTarget, freshState, liveInputs, solarPosition } from './environment';
import type { EnvironmentInput, HassState, SceneConfig } from './types';
const input: EnvironmentInput = { date: new Date('2026-06-21T12:00:00Z'), latitude: 63.18, longitude: 14.64, northOffset: 0, cloud: 0, lux: null, weather: 'clear', sensorWeight: 0.2, brightness: 1 };
const state = (entity_id: string, value: string, age = 0, attributes = {}): HassState => ({ entity_id, state: value, attributes, last_updated: new Date(Date.now() - age).toISOString() });
function config(): SceneConfig { return { activeModel:'summer', location:{latitude:63,longitude:14,northOffset:0}, automatic:{ enabled:true,snowEntity:'sensor.snow',snowThreshold:1,sourceConfirmed:false }, bindings:{weather:'weather.smhi',cloud:'',lux:'sensor.lux',cloudAttribute:'cloud_coverage',cloudMax:100,weatherMaxAge:7200,luxMaxAge:60},luxCalibration:{gain:1,weight:0.2,artificialLux:100,affectedByLights:true,placement:'shaded'},objects:[{type:'light',entityId:'light.test'}] } as SceneConfig; }
describe('solar geometry and environment', () => {
  it('matches equinox equator solar noon and northern summer altitude', () => {
    const noon = solarPosition(new Date('2026-03-20T12:07:00Z'), 0, 0);
    expect(noon.elevation).toBeGreaterThan(88);
    const summer = solarPosition(new Date('2026-06-21T11:04:00Z'), 63.18, 14.64);
    expect(summer.elevation).toBeCloseTo(50.27, 0);
    expect(summer.azimuth).toBeGreaterThan(175); expect(summer.azimuth).toBeLessThan(185);
  });
  it('has eastward sunrise, westward sunset and handles leap years/polar night', () => {
    expect(Math.abs(solarPosition(new Date('2026-03-20T06:07Z'), 0, 0).azimuth - 90)).toBeLessThan(1);
    expect(Math.abs(solarPosition(new Date('2026-03-20T18:07Z'), 0, 0).azimuth - 270)).toBeLessThan(1);
    expect(solarPosition(new Date('2024-02-29T12:00Z'), 65, 15).elevation).toBeGreaterThan(10);
    expect(solarPosition(new Date('2026-12-21T12:00Z'), 80, 15).elevation).toBeLessThan(0);
  });
  it('rotates north without altering solar elevation', () => {
    const a = solarPosition(input.date, 63.18, 14.64, 0), b = solarPosition(input.date, 63.18, 14.64, 90);
    expect(b.elevation).toBe(a.elevation); expect(b.direction[0]).toBeCloseTo(-a.direction[2]);
  });
  it('cloud and lux both influence light while lux cannot override daylight', () => {
    const clear = environmentTarget(input), cloudy = environmentTarget({...input,cloud:1});
    const darkSensor = environmentTarget({...input,lux:0}), brightSensor = environmentTarget({...input,lux:100000});
    expect(cloudy.direct).toBeLessThan(clear.direct * 0.2);
    expect(darkSensor.direct).toBeLessThan(brightSensor.direct);
    expect(darkSensor.direct).toBeGreaterThan(clear.direct * 0.9);
    const night = environmentTarget({...input,date:new Date('2026-10-27T23:00Z'),lux:100000});
    expect(night.direct).toBe(0); expect(night.ambient).toBeLessThan(clear.ambient * 0.15);
  });
  it('uses continuous twilight and framerate-independent damping', () => {
    const a = damp(0, 1, 1/30), b = damp(damp(0,1,1/60),1,1/60);
    expect(a).toBeCloseTo(b, 10); expect(a).toBeGreaterThan(0); expect(a).toBeLessThan(0.1);
    const frames = Array.from({length:60},(_,i) => environmentTarget({...input,date:new Date(Date.UTC(2026,9,27,14,i))}));
    for (let i=1;i<frames.length;i++) expect(Math.abs(frames[i].ambient-frames[i-1].ambient)).toBeLessThan(0.05);
  });
  it('keeps precipitation independent from ground-cover model selection', () => {
    expect(environmentTarget({...input,weather:'rain'})).toMatchObject({rain:1,snow:0});
    expect(environmentTarget({...input,weather:'snow'})).toMatchObject({rain:0,snow:1});
    expect(environmentTarget({...input,weather:'fog'}).fog).toBeGreaterThan(0.01);
  });
});
describe('HA environment state quality and season policy', () => {
  it('ignores unavailable, stale and disconnected data and compensates artificial lux', () => {
    const c = config(), states = new Map([state('weather.smhi','rainy',0,{cloud_coverage:80}),state('sensor.lux','500'),state('light.test','on')].map(s=>[s.entity_id,s]));
    expect(liveInputs(c,states,true)).toMatchObject({cloud:0.8,lux:400,weather:'rain'});
    expect(liveInputs(c,states,false).lux).toBeNull();
    states.set('sensor.lux',state('sensor.lux','500',120000)); expect(liveInputs(c,states,true).lux).toBeNull();
    expect(freshState(state('sensor.x','unavailable'),60)).toBe(false);
    expect(freshState(state('sensor.x','3',-120000),60)).toBe(false);
  });
  it('requires fresh confirmed snow observation; a snowy forecast never changes ground cover', () => {
    const c=config(), states = new Map([['weather.smhi',state('weather.smhi','snowy')],['sensor.snow',state('sensor.snow','4')]]);
    const date = new Date('2026-10-27T12:00Z');
    expect(automaticSeason(c,states,date,true)).toBe('autumn');
    c.automatic.sourceConfirmed=true; expect(automaticSeason(c,states,date,true)).toBe('firstSnow');
    expect(automaticSeason(c,states,date,false)).toBe('autumn');
    states.set('sensor.snow',state('sensor.snow','4',7200000)); expect(automaticSeason(c,states,date,true)).toBe('autumn');
    c.automatic.enabled=false; expect(automaticSeason(c,states,date,true)).toBe('summer');
  });
});
