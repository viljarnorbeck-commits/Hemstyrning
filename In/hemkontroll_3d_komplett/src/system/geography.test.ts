import{describe,it,expect}from'vitest';
import{geographicToLocal,localToGeographic,fitCalibration}from'./geography';
import type{Vec3}from'./types';
const origin={latitude:63.18,longitude:14.64,altitude:350};
describe('WGS84 ECEF ENU calibration',()=>{
 it('roundtrips north/east/height and rotated north at centimetre precision',()=>{for(const yaw of [0,37,180])for(const p of [[12,3,-41],[-70,-2,15],[0,0,0]] as Vec3[]){const q=geographicToLocal(localToGeographic(p,origin,yaw),origin,yaw);q.forEach((v,i)=>expect(v).toBeCloseTo(p[i],4));}expect(geographicToLocal({...origin,latitude:63.1801},origin)[2]).toBeLessThan(-11);});
 it('fits translation, scale, north and altitude from three measured points',()=>{const world:Vec3[]=[[0,0,0],[10,2,0],[0,1,10],[5,0,4]],r=.4,scale=1.7;const target=(p:Vec3):Vec3=>[8+scale*(Math.cos(r)*p[0]+Math.sin(r)*p[2]),3+scale*p[1],-4+scale*(-Math.sin(r)*p[0]+Math.cos(r)*p[2])];const fit=fitCalibration(world.map(p=>({world:p,geo:localToGeographic(target(p),origin)})),origin);expect(fit.scale).toBeCloseTo(scale,6);expect(fit.yaw).toBeCloseTo(r*180/Math.PI,6);expect(fit.rms).toBeLessThan(.0001);world.forEach(p=>fit.transform(p).forEach((v,i)=>expect(v).toBeCloseTo(target(p)[i],4)));});
 it('rejects collinear/too few control points',()=>{expect(()=>fitCalibration([],origin)).toThrow();expect(()=>fitCalibration([0,1,2].map(x=>({world:[x,0,0],geo:origin})),origin)).toThrow('linje');});
});
