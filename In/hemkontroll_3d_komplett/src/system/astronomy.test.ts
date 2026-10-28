import{describe,it,expect}from'vitest';
import{moonPosition,horizontalDirection,starDirection}from'./astronomy';
import{environmentTarget}from'./environment';
describe('astronomical sky independent of browser clock',()=>{
 it('matches NASA 2026 solar/lunar eclipse phase reference dates',()=>{
  // NASA GSFC: https://eclipse.gsfc.nasa.gov/OH/OH2026.html
  const newMoon=moonPosition(new Date('2026-02-17T12:12:00Z'),63.18,14.64),full=moonPosition(new Date('2026-03-03T11:34:00Z'),63.18,14.64);
  expect(newMoon.fraction).toBeLessThan(.001);expect(full.fraction).toBeGreaterThan(.999);
  expect(Math.abs(full.phaseAngle-180)).toBeLessThan(1);
 });
 it('changes apparent moon position with time, place and north without changing phase',()=>{const date=new Date('2026-10-27T20:00Z'),a=moonPosition(date,63.18,14.64),b=moonPosition(date,63.18,14.64,90),later=moonPosition(new Date(+date+3600000),63.18,14.64),other=moonPosition(date,-20,100);expect(a.fraction).toBe(b.fraction);expect(b.direction[0]).toBeCloseTo(-a.direction[2],8);expect(later.azimuth).not.toBeCloseTo(a.azimuth,0);expect(other.altitude).not.toBeCloseTo(a.altitude,0);expect(Math.hypot(...a.direction)).toBeCloseTo(1,10);});
 it('respects horizon compass and keeps Polaris near geographic north',()=>{expect(horizontalDirection(0,0)).toEqual([0,0,-1]);expect(horizontalDirection(90,0)[0]).toBeCloseTo(1);const p=starDirection(2.5303,89.2641,new Date('2026-10-27T20:00Z'),63.18,14.64);expect(Math.asin(p[1])*180/Math.PI).toBeCloseTo(63.18,0);expect(p[2]).toBeLessThan(0);});
 it('suppresses stars in daylight/cloud and provides bounded useful night lighting',()=>{const input={date:new Date('2026-06-21T11:00Z'),latitude:63.18,longitude:14.64,northOffset:0,cloud:0,lux:null,weather:'clear' as const,sensorWeight:.2,brightness:1};expect(environmentTarget(input).starVisibility).toBe(0);const night=environmentTarget({...input,date:new Date('2026-10-27T23:00Z')});expect(night.ambient).toBeGreaterThan(.04);expect(night.ambient).toBeLessThan(.09);expect(night.direct).toBe(0);expect(night.exposure).toBeGreaterThan(1);expect(environmentTarget({...input,date:new Date('2026-10-27T23:00Z'),cloud:1}).starVisibility).toBe(0);});
});
